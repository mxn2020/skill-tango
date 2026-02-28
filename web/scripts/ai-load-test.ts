/**
 * AI Load Testing Script for Skill-Tango
 * 
 * Tests the AI pipeline at various concurrency levels to measure
 * throughput, latency, and error rates under load.
 * 
 * Usage:
 *   npx tsx scripts/ai-load-test.ts                          # Default: 1,5,10,20 concurrent
 *   npx tsx scripts/ai-load-test.ts --concurrency 1,5,10,50  # Custom levels
 *   npx tsx scripts/ai-load-test.ts --dry-run                # Mock mode (no real API calls)
 * 
 * Output:
 *   - Console: summary table with latency percentiles and success rates
 *   - File: scripts/ai-load-test-results-<timestamp>.json with full request/response logs
 * 
 * Requires:
 *   - CONVEX_URL environment variable (your deployment URL)
 *   - Deployed Convex backend with NVIDIA_API_KEY configured
 */

import { writeFileSync } from 'fs'
import { join } from 'path'

const args = process.argv.slice(2)
const concurrencyIdx = args.indexOf('--concurrency')
const isDryRun = args.includes('--dry-run')

const DEFAULT_CONCURRENCIES = [1, 5, 10, 20]
const concurrencies: number[] = concurrencyIdx >= 0 && args[concurrencyIdx + 1]
    ? args[concurrencyIdx + 1].split(',').map(Number).filter(n => n > 0)
    : DEFAULT_CONCURRENCIES

interface CallLog {
    callIndex: number
    concurrencyLevel: number
    timestamp: string
    durationMs: number
    success: boolean
    request: {
        url: string
        method: string
        headers: Record<string, string>
        body: any
    }
    response: {
        status: number | null
        statusText: string | null
        headers: Record<string, string>
        body: any
    } | null
    error?: string
}

interface CallResult {
    success: boolean
    durationMs: number
    error?: string
    log: CallLog
}

interface ConcurrencyReport {
    concurrency: number
    totalCalls: number
    successful: number
    failed: number
    successRate: string
    p50Ms: number
    p95Ms: number
    p99Ms: number
    avgMs: number
    minMs: number
    maxMs: number
    errors: Record<string, number>
}

function percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0
    const idx = Math.ceil((p / 100) * sorted.length) - 1
    return sorted[Math.max(0, idx)]
}

async function makeMockCall(id: number, concurrencyLevel: number): Promise<CallResult> {
    const baseLatency = 200 + Math.random() * 800
    const jitter = Math.random() * 200
    const duration = baseLatency + jitter
    const timestamp = new Date().toISOString()

    await new Promise(resolve => setTimeout(resolve, duration))

    const requestBody = {
        path: 'aiPipeline:assessBaseline',
        args: { topic: 'Basic Mathematics', targetLevel: 'Beginner', language: 'English' },
    }

    const isError = Math.random() < 0.05

    const log: CallLog = {
        callIndex: id,
        concurrencyLevel,
        timestamp,
        durationMs: Math.round(duration),
        success: !isError,
        request: {
            url: 'mock://dry-run',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: requestBody,
        },
        response: isError ? null : {
            status: 200,
            statusText: 'OK',
            headers: {},
            body: { assessmentMessage: '[mock]', questions: ['Q1?', 'Q2?', 'Q3?'] },
        },
        error: isError ? 'Simulated error' : undefined,
    }

    return {
        success: !isError,
        durationMs: duration,
        error: isError ? 'Simulated error' : undefined,
        log,
    }
}

async function makeRealCall(convexUrl: string, id: number, concurrencyLevel: number): Promise<CallResult> {
    const start = Date.now()
    const timestamp = new Date().toISOString()

    const requestUrl = `${convexUrl}/api/action`
    const requestBody = {
        path: 'aiPipeline:assessBaseline',
        args: {
            topic: 'Basic Mathematics',
            targetLevel: 'Beginner',
            language: 'English',
        },
    }
    const requestHeaders = { 'Content-Type': 'application/json' }

    try {
        const response = await fetch(requestUrl, {
            method: 'POST',
            headers: requestHeaders,
            body: JSON.stringify(requestBody),
        })

        const durationMs = Date.now() - start
        const responseBody = await response.text()

        // Parse response headers into a plain object
        const responseHeaders: Record<string, string> = {}
        response.headers.forEach((value, key) => {
            responseHeaders[key] = value
        })

        // Try to parse body as JSON
        let parsedBody: any
        try {
            parsedBody = JSON.parse(responseBody)
        } catch {
            parsedBody = responseBody
        }

        const log: CallLog = {
            callIndex: id,
            concurrencyLevel,
            timestamp,
            durationMs,
            success: response.ok,
            request: {
                url: requestUrl,
                method: 'POST',
                headers: requestHeaders,
                body: requestBody,
            },
            response: {
                status: response.status,
                statusText: response.statusText,
                headers: responseHeaders,
                body: parsedBody,
            },
            error: response.ok ? undefined : `HTTP ${response.status}: ${responseBody.substring(0, 200)}`,
        }

        return {
            success: response.ok,
            durationMs,
            error: response.ok ? undefined : log.error,
            log,
        }
    } catch (err) {
        const durationMs = Date.now() - start
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'

        const log: CallLog = {
            callIndex: id,
            concurrencyLevel,
            timestamp,
            durationMs,
            success: false,
            request: {
                url: requestUrl,
                method: 'POST',
                headers: requestHeaders,
                body: requestBody,
            },
            response: null,
            error: errorMsg,
        }

        return { success: false, durationMs, error: errorMsg, log }
    }
}

async function runConcurrencyLevel(concurrency: number, convexUrl: string, allLogs: CallLog[]): Promise<ConcurrencyReport> {
    const callsPerLevel = Math.max(concurrency, 5)
    console.log(`\n  Running ${callsPerLevel} calls at concurrency ${concurrency}...`)

    const results: CallResult[] = []
    const pending: Promise<void>[] = []
    let completed = 0
    let callId = 0

    for (let i = 0; i < callsPerLevel; i++) {
        const currentId = callId++
        const promise = (async () => {
            const result = isDryRun
                ? await makeMockCall(currentId, concurrency)
                : await makeRealCall(convexUrl, currentId, concurrency)
            results.push(result)
            allLogs.push(result.log)
            completed++
            process.stdout.write(`\r    Progress: ${completed}/${callsPerLevel}`)
        })()
        pending.push(promise)

        if (pending.length >= concurrency) {
            await Promise.race(pending)
            for (let j = pending.length - 1; j >= 0; j--) {
                const settled = await Promise.race([pending[j].then(() => true), Promise.resolve(false)])
                if (settled) pending.splice(j, 1)
            }
        }
    }

    await Promise.all(pending)
    console.log()

    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)
    const durations = successful.map(r => r.durationMs).sort((a, b) => a - b)

    const errors: Record<string, number> = {}
    for (const f of failed) {
        const key = f.error?.substring(0, 60) ?? 'Unknown'
        errors[key] = (errors[key] ?? 0) + 1
    }

    return {
        concurrency,
        totalCalls: callsPerLevel,
        successful: successful.length,
        failed: failed.length,
        successRate: `${((successful.length / callsPerLevel) * 100).toFixed(1)}%`,
        p50Ms: Math.round(percentile(durations, 50)),
        p95Ms: Math.round(percentile(durations, 95)),
        p99Ms: Math.round(percentile(durations, 99)),
        avgMs: durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0,
        minMs: durations.length > 0 ? Math.round(durations[0]) : 0,
        maxMs: durations.length > 0 ? Math.round(durations[durations.length - 1]) : 0,
        errors,
    }
}

async function main() {
    const convexUrl = process.env.CONVEX_URL || process.env.VITE_CONVEX_URL

    if (!isDryRun && !convexUrl) {
        console.error('❌ Error: CONVEX_URL or VITE_CONVEX_URL environment variable is required')
        console.error('   Set it to your Convex deployment URL, e.g.:')
        console.error('   CONVEX_URL=https://your-project.convex.cloud npx tsx scripts/ai-load-test.ts')
        console.error('\n   Or use --dry-run for mock testing:')
        console.error('   npx tsx scripts/ai-load-test.ts --dry-run')
        process.exit(1)
    }

    console.log('═══════════════════════════════════════════════')
    console.log('  🧪 Skill-Tango AI Load Test')
    console.log('═══════════════════════════════════════════════')
    console.log(`  Mode: ${isDryRun ? '🔧 DRY RUN (mock calls)' : '🔴 LIVE (real API calls)'}`)
    console.log(`  Concurrency levels: ${concurrencies.join(', ')}`)
    if (!isDryRun) console.log(`  Target: ${convexUrl}`)
    console.log('═══════════════════════════════════════════════')

    const reports: ConcurrencyReport[] = []
    const allLogs: CallLog[] = []

    for (const c of concurrencies) {
        const report = await runConcurrencyLevel(c, convexUrl || '', allLogs)
        reports.push(report)
    }

    // Print summary table
    console.log('\n═══════════════════════════════════════════════════════════════')
    console.log('  📊 Results Summary')
    console.log('═══════════════════════════════════════════════════════════════')
    console.log(
        '  Concurrency'.padEnd(14) +
        'Success'.padEnd(10) +
        'Rate'.padEnd(8) +
        'Avg(ms)'.padEnd(10) +
        'P50(ms)'.padEnd(10) +
        'P95(ms)'.padEnd(10) +
        'P99(ms)'.padEnd(10) +
        'Min(ms)'.padEnd(10) +
        'Max(ms)'.padEnd(10)
    )
    console.log('  ' + '─'.repeat(86))

    for (const r of reports) {
        console.log(
            `  ${String(r.concurrency).padEnd(12)}` +
            `${r.successful}/${r.totalCalls}`.padEnd(10) +
            `${r.successRate}`.padEnd(8) +
            `${r.avgMs}`.padEnd(10) +
            `${r.p50Ms}`.padEnd(10) +
            `${r.p95Ms}`.padEnd(10) +
            `${r.p99Ms}`.padEnd(10) +
            `${r.minMs}`.padEnd(10) +
            `${r.maxMs}`.padEnd(10)
        )
    }

    // Print errors
    const hasErrors = reports.some(r => r.failed > 0)
    if (hasErrors) {
        console.log('\n  ⚠️  Error Breakdown:')
        for (const r of reports) {
            if (r.failed > 0) {
                console.log(`    Concurrency ${r.concurrency}:`)
                for (const [err, count] of Object.entries(r.errors)) {
                    console.log(`      ${count}x — ${err}`)
                }
            }
        }
    }

    // Save full logs to JSON file
    const ts = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)
    const outputFilename = `ai-load-test-results-${ts}.json`
    const outputPath = join(import.meta.dirname || '.', outputFilename)

    const fullReport = {
        meta: {
            timestamp: new Date().toISOString(),
            mode: isDryRun ? 'dry-run' : 'live',
            target: convexUrl || 'mock://dry-run',
            concurrencyLevels: concurrencies,
            totalCalls: allLogs.length,
        },
        summary: reports,
        calls: allLogs,
    }

    writeFileSync(outputPath, JSON.stringify(fullReport, null, 2))
    console.log(`\n  📁 Full logs saved to: ${outputPath}`)

    console.log('\n═══════════════════════════════════════════════════════════════')

    // Exit with error if any level had >20% failure rate
    const anyHighFailure = reports.some(r => r.failed / r.totalCalls > 0.2)
    if (anyHighFailure) {
        console.log('  ❌ FAIL: One or more concurrency levels had >20% failure rate')
        process.exit(1)
    } else {
        console.log('  ✅ PASS: All concurrency levels within acceptable error rates')
    }
}

main().catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
})
