import { useState, useCallback, useRef } from 'react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    LineChart, Line, ScatterChart, Scatter, Cell,
} from 'recharts'
import { Play, Square, Download, Loader2 } from 'lucide-react'
import { Input } from './ui/Input'

// --- Types ---
interface CallLog {
    callIndex: number
    concurrencyLevel: number
    timestamp: string
    durationMs: number
    success: boolean
    request: { url: string; method: string; headers: Record<string, string>; body: any }
    response: { status: number | null; statusText: string | null; headers: Record<string, string>; body: any } | null
    error?: string
}

interface ConcurrencyReport {
    concurrency: number
    totalCalls: number
    successful: number
    failed: number
    successRate: number
    p50Ms: number
    p95Ms: number
    p99Ms: number
    avgMs: number
    minMs: number
    maxMs: number
}

interface TestRun {
    id: string
    startedAt: string
    completedAt: string
    mode: 'live' | 'dry-run'
    target: string
    reports: ConcurrencyReport[]
    logs: CallLog[]
}

// --- Helpers ---
function percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0
    const idx = Math.ceil((p / 100) * sorted.length) - 1
    return sorted[Math.max(0, idx)]
}

// --- Chart Colors ---
const COLORS = {
    cyan: '#06B6D4',
    emerald: '#10B981',
    amber: '#F59E0B',
    red: '#EF4444',
    purple: '#8B5CF6',
    pink: '#EC4899',
    gridLine: 'rgba(255,255,255,0.06)',
    text: '#94A3B8',
}

const chartTooltipStyle = {
    backgroundColor: 'rgba(10,17,40,0.95)',
    border: '1px solid rgba(6,182,212,0.3)',
    borderRadius: '8px',
    color: '#F8FAFC',
    fontSize: '0.85rem',
}

// --- Component ---
export function LoadTestDashboard() {
    const [concurrencyInput, setConcurrencyInput] = useState('1,2,5,10')
    const [isDryRun, setIsDryRun] = useState(false)
    const [isRunning, setIsRunning] = useState(false)
    const [progress, setProgress] = useState('')
    const [runs, setRuns] = useState<TestRun[]>([])
    const [selectedRun, setSelectedRun] = useState<string | null>(null)
    const [expandedLog, setExpandedLog] = useState<number | null>(null)
    const abortRef = useRef(false)

    const convexUrl = (import.meta as any).env?.VITE_CONVEX_URL || ''

    const runTest = useCallback(async () => {
        const concurrencies = concurrencyInput.split(',').map(s => parseInt(s.trim())).filter(n => n > 0)
        if (concurrencies.length === 0) return

        if (!isDryRun && !convexUrl) {
            alert('VITE_CONVEX_URL not found. Use dry-run mode or set the env variable.')
            return
        }

        setIsRunning(true)
        abortRef.current = false
        const startedAt = new Date().toISOString()
        const allLogs: CallLog[] = []
        const reports: ConcurrencyReport[] = []

        for (const concurrency of concurrencies) {
            if (abortRef.current) break

            const callsPerLevel = Math.max(concurrency, 5)
            setProgress(`Concurrency ${concurrency}: 0/${callsPerLevel}`)

            const results: CallLog[] = []
            const pending: Promise<void>[] = []
            let completed = 0
            let callId = 0

            for (let i = 0; i < callsPerLevel; i++) {
                if (abortRef.current) break

                const currentId = callId++
                const promise = (async () => {
                    const log = isDryRun
                        ? await mockCall(currentId, concurrency)
                        : await realCall(convexUrl, currentId, concurrency)
                    results.push(log)
                    allLogs.push(log)
                    completed++
                    setProgress(`Concurrency ${concurrency}: ${completed}/${callsPerLevel}`)
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

            // Compute stats
            const successful = results.filter(r => r.success)
            const failed = results.filter(r => !r.success)
            const durations = successful.map(r => r.durationMs).sort((a, b) => a - b)

            reports.push({
                concurrency,
                totalCalls: callsPerLevel,
                successful: successful.length,
                failed: failed.length,
                successRate: callsPerLevel > 0 ? (successful.length / callsPerLevel) * 100 : 0,
                p50Ms: Math.round(percentile(durations, 50)),
                p95Ms: Math.round(percentile(durations, 95)),
                p99Ms: Math.round(percentile(durations, 99)),
                avgMs: durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0,
                minMs: durations.length > 0 ? Math.round(durations[0]) : 0,
                maxMs: durations.length > 0 ? Math.round(durations[durations.length - 1]) : 0,
            })
        }

        const run: TestRun = {
            id: crypto.randomUUID(),
            startedAt,
            completedAt: new Date().toISOString(),
            mode: isDryRun ? 'dry-run' : 'live',
            target: isDryRun ? 'mock' : convexUrl,
            reports,
            logs: allLogs,
        }

        setRuns(prev => [run, ...prev])
        setSelectedRun(run.id)
        setIsRunning(false)
        setProgress('')
    }, [concurrencyInput, isDryRun, convexUrl])

    const stopTest = () => { abortRef.current = true }

    const activeRun = runs.find(r => r.id === selectedRun) || null

    const downloadJson = (run: TestRun) => {
        const blob = new Blob([JSON.stringify(run, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `load-test-${run.startedAt.replace(/[:.]/g, '-').substring(0, 19)}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div>
            {/* Config Panel */}
            <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                <h3 style={{ marginBottom: 'var(--space-md)' }}>🧪 Test Configuration</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--space-lg)', alignItems: 'end' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-smoke-gray)', marginBottom: 4 }}>
                                Concurrency Levels (comma-separated)
                            </label>
                            <Input
                                type="text"
                                value={concurrencyInput}
                                onChange={e => setConcurrencyInput(e.target.value)}
                                placeholder="1,5,10,20,50,100"
                                disabled={isRunning}
                            />
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={isDryRun}
                                onChange={e => setIsDryRun(e.target.checked)}
                                disabled={isRunning}
                                style={{ accentColor: 'var(--color-cyber-cyan)' }}
                            />
                            <span style={{ color: 'var(--color-smoke-gray)' }}>
                                Dry run (mock calls, no API credits)
                            </span>
                        </label>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                        {isRunning ? (
                            <button className="btn btn--secondary" onClick={stopTest} style={{ gap: 6 }}>
                                <Square size={16} /> Stop
                            </button>
                        ) : (
                            <button className="btn btn--primary" onClick={runTest} style={{ gap: 6 }}>
                                <Play size={16} /> Run Test
                            </button>
                        )}
                    </div>
                </div>
                {isRunning && (
                    <div style={{ marginTop: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Loader2 size={16} className="animate-spin" style={{ color: 'var(--color-cyber-cyan)' }} />
                        <span style={{ fontSize: '0.9rem', color: 'var(--color-cyber-cyan)' }}>{progress}</span>
                    </div>
                )}
            </div>

            {/* Run History */}
            {runs.length > 0 && (
                <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
                    {runs.map(r => (
                        <button
                            key={r.id}
                            className={`admin-tab ${selectedRun === r.id ? 'admin-tab--active' : ''}`}
                            onClick={() => setSelectedRun(r.id)}
                        >
                            {r.mode === 'dry-run' ? '🔧' : '🔴'} {new Date(r.startedAt).toLocaleTimeString()}
                            <span style={{ fontSize: '0.75rem', marginLeft: 4, opacity: 0.6 }}>
                                ({r.logs.length} calls)
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {/* Results */}
            {activeRun && (
                <div className="animate-fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                        <h3>
                            Results — {activeRun.mode === 'dry-run' ? '🔧 Dry Run' : '🔴 Live'} · {activeRun.logs.length} calls
                        </h3>
                        <button className="btn btn--secondary" onClick={() => downloadJson(activeRun)} style={{ fontSize: '0.85rem', gap: 6 }}>
                            <Download size={14} /> Download JSON
                        </button>
                    </div>

                    {/* Chart 1: Latency by Concurrency (Bar) */}
                    <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                        <h4 style={{ marginBottom: 'var(--space-md)', color: 'var(--color-smoke-gray)' }}>Latency by Concurrency Level</h4>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={activeRun.reports} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gridLine} />
                                <XAxis dataKey="concurrency" stroke={COLORS.text} fontSize={12} label={{ value: 'Concurrency', position: 'insideBottom', offset: -2, fill: COLORS.text }} />
                                <YAxis stroke={COLORS.text} fontSize={12} label={{ value: 'ms', angle: -90, position: 'insideLeft', fill: COLORS.text }} />
                                <Tooltip contentStyle={chartTooltipStyle} />
                                <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                                <Bar dataKey="p50Ms" name="P50" fill={COLORS.cyan} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="p95Ms" name="P95" fill={COLORS.amber} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="p99Ms" name="P99" fill={COLORS.red} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Chart 2: Success Rate (Line) */}
                    <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                        <h4 style={{ marginBottom: 'var(--space-md)', color: 'var(--color-smoke-gray)' }}>Success Rate by Concurrency Level</h4>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={activeRun.reports} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gridLine} />
                                <XAxis dataKey="concurrency" stroke={COLORS.text} fontSize={12} />
                                <YAxis stroke={COLORS.text} fontSize={12} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                                <Tooltip contentStyle={chartTooltipStyle} formatter={(v?: number) => `${(v ?? 0).toFixed(1)}%`} />
                                <Line type="monotone" dataKey="successRate" name="Success Rate" stroke={COLORS.emerald} strokeWidth={3} dot={{ fill: COLORS.emerald, r: 5 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Chart 3: Latency Distribution (Scatter) */}
                    <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                        <h4 style={{ marginBottom: 'var(--space-md)', color: 'var(--color-smoke-gray)' }}>Individual Call Latency</h4>
                        <ResponsiveContainer width="100%" height={250}>
                            <ScatterChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gridLine} />
                                <XAxis dataKey="callIndex" name="Call #" stroke={COLORS.text} fontSize={12} label={{ value: 'Call #', position: 'insideBottom', offset: -2, fill: COLORS.text }} />
                                <YAxis dataKey="durationMs" name="Latency" stroke={COLORS.text} fontSize={12} label={{ value: 'ms', angle: -90, position: 'insideLeft', fill: COLORS.text }} />
                                <Tooltip contentStyle={chartTooltipStyle} formatter={(v: any, name: any) => [
                                    name === 'Latency' ? `${Math.round(v ?? 0)}ms` : v,
                                    name
                                ]} />
                                <Scatter data={activeRun.logs} shape="circle">
                                    {activeRun.logs.map((log, i) => (
                                        <Cell key={i} fill={log.success ? COLORS.cyan : COLORS.red} opacity={0.7} />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                        <div style={{ display: 'flex', gap: 'var(--space-lg)', justifyContent: 'center', marginTop: 'var(--space-sm)', fontSize: '0.8rem', color: 'var(--color-smoke-gray)' }}>
                            <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: COLORS.cyan, marginRight: 4 }} />Success</span>
                            <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: COLORS.red, marginRight: 4 }} />Failed</span>
                        </div>
                    </div>

                    {/* Chart 4: Min/Avg/Max Range */}
                    <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                        <h4 style={{ marginBottom: 'var(--space-md)', color: 'var(--color-smoke-gray)' }}>Latency Range (Min / Avg / Max)</h4>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={activeRun.reports} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gridLine} />
                                <XAxis dataKey="concurrency" stroke={COLORS.text} fontSize={12} />
                                <YAxis stroke={COLORS.text} fontSize={12} />
                                <Tooltip contentStyle={chartTooltipStyle} />
                                <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                                <Bar dataKey="minMs" name="Min" fill={COLORS.emerald} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="avgMs" name="Avg" fill={COLORS.cyan} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="maxMs" name="Max" fill={COLORS.amber} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Summary Table */}
                    <div className="card" style={{ marginBottom: 'var(--space-xl)', overflow: 'auto' }}>
                        <h4 style={{ marginBottom: 'var(--space-md)', color: 'var(--color-smoke-gray)' }}>Summary Table</h4>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(6,182,212,0.2)' }}>
                                    {['Concurrency', 'Total', 'Success', 'Failed', 'Rate', 'P50', 'P95', 'P99', 'Avg', 'Min', 'Max'].map(h => (
                                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--color-smoke-gray)', fontWeight: 600 }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {activeRun.reports.map(r => (
                                    <tr key={r.concurrency} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{r.concurrency}</td>
                                        <td style={{ padding: '8px 12px' }}>{r.totalCalls}</td>
                                        <td style={{ padding: '8px 12px', color: COLORS.emerald }}>{r.successful}</td>
                                        <td style={{ padding: '8px 12px', color: r.failed > 0 ? COLORS.red : 'inherit' }}>{r.failed}</td>
                                        <td style={{ padding: '8px 12px', color: r.successRate >= 95 ? COLORS.emerald : r.successRate >= 80 ? COLORS.amber : COLORS.red }}>
                                            {r.successRate.toFixed(1)}%
                                        </td>
                                        <td style={{ padding: '8px 12px' }}>{r.p50Ms}ms</td>
                                        <td style={{ padding: '8px 12px' }}>{r.p95Ms}ms</td>
                                        <td style={{ padding: '8px 12px' }}>{r.p99Ms}ms</td>
                                        <td style={{ padding: '8px 12px' }}>{r.avgMs}ms</td>
                                        <td style={{ padding: '8px 12px' }}>{r.minMs}ms</td>
                                        <td style={{ padding: '8px 12px' }}>{r.maxMs}ms</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Call Logs (expandable) */}
                    <div className="card">
                        <h4 style={{ marginBottom: 'var(--space-md)', color: 'var(--color-smoke-gray)' }}>
                            Call Logs ({activeRun.logs.length})
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 500, overflowY: 'auto' }}>
                            {activeRun.logs.map((log, i) => (
                                <div key={i}>
                                    <button
                                        onClick={() => setExpandedLog(expandedLog === i ? null : i)}
                                        style={{
                                            width: '100%', textAlign: 'left', padding: '8px 12px',
                                            background: expandedLog === i ? 'rgba(6,182,212,0.08)' : 'rgba(0,0,0,0.2)',
                                            border: '1px solid', borderColor: expandedLog === i ? 'rgba(6,182,212,0.3)' : 'rgba(255,255,255,0.04)',
                                            borderRadius: 6, cursor: 'pointer', color: 'inherit',
                                            fontFamily: 'inherit', fontSize: '0.82rem',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        }}
                                    >
                                        <span>
                                            <span style={{ color: log.success ? COLORS.emerald : COLORS.red, fontWeight: 600, marginRight: 8 }}>
                                                {log.success ? '✓' : '✗'}
                                            </span>
                                            Call #{log.callIndex} · Concurrency {log.concurrencyLevel}
                                        </span>
                                        <span style={{ color: 'var(--color-smoke-gray)' }}>
                                            {Math.round(log.durationMs)}ms · {log.response?.status ?? 'ERR'}
                                        </span>
                                    </button>
                                    {expandedLog === i && (
                                        <div style={{
                                            background: 'rgba(0,0,0,0.3)', borderRadius: '0 0 6px 6px',
                                            padding: 12, fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
                                            whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--color-smoke-gray)',
                                            maxHeight: 400, overflowY: 'auto',
                                            borderLeft: `2px solid ${log.success ? COLORS.emerald : COLORS.red}`,
                                        }}>
                                            <div style={{ marginBottom: 12 }}>
                                                <div style={{ color: COLORS.cyan, fontWeight: 600, marginBottom: 4 }}>→ REQUEST</div>
                                                {JSON.stringify(log.request, null, 2)}
                                            </div>
                                            <div>
                                                <div style={{ color: log.success ? COLORS.emerald : COLORS.red, fontWeight: 600, marginBottom: 4 }}>
                                                    ← RESPONSE {log.response ? `(${log.response.status})` : '(ERROR)'}
                                                </div>
                                                {log.response
                                                    ? JSON.stringify(log.response, null, 2)
                                                    : `Error: ${log.error}`
                                                }
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {runs.length === 0 && !isRunning && (
                <div style={{ textAlign: 'center', padding: 'var(--space-3xl) var(--space-md)', color: 'var(--color-smoke-gray)' }}>
                    <p style={{ fontSize: '2.5rem', marginBottom: 'var(--space-md)' }}>🧪</p>
                    <p>Configure concurrency levels above and click <strong>Run Test</strong> to start.</p>
                    <p style={{ fontSize: '0.85rem', marginTop: 'var(--space-sm)' }}>
                        Use <strong>dry run</strong> to test without consuming API credits.
                    </p>
                </div>
            )}
        </div>
    )
}

// --- Call Functions ---

async function mockCall(id: number, concurrency: number): Promise<CallLog> {
    const start = Date.now()
    const duration = 200 + Math.random() * 800 + Math.random() * 200
    await new Promise(r => setTimeout(r, duration))
    const isError = Math.random() < 0.05

    return {
        callIndex: id, concurrencyLevel: concurrency,
        timestamp: new Date().toISOString(), durationMs: Date.now() - start,
        success: !isError,
        request: { url: 'mock://dry-run', method: 'POST', headers: { 'Content-Type': 'application/json' }, body: { path: 'aiPipeline:assessBaseline', args: { topic: 'Basic Mathematics', targetLevel: 'Beginner', language: 'English' } } },
        response: isError ? null : { status: 200, statusText: 'OK', headers: {}, body: { assessmentMessage: '[mock]', questions: ['Q1?', 'Q2?', 'Q3?'] } },
        error: isError ? 'Simulated error' : undefined,
    }
}

async function realCall(convexUrl: string, id: number, concurrency: number): Promise<CallLog> {
    const start = Date.now()
    const requestBody = { path: 'aiPipeline:assessBaseline', args: { topic: 'Basic Mathematics', targetLevel: 'Beginner', language: 'English' } }
    const requestUrl = `${convexUrl}/api/action`
    const requestHeaders = { 'Content-Type': 'application/json' }

    try {
        const response = await fetch(requestUrl, { method: 'POST', headers: requestHeaders, body: JSON.stringify(requestBody) })
        const durationMs = Date.now() - start
        const responseText = await response.text()
        const responseHeaders: Record<string, string> = {}
        response.headers.forEach((v, k) => { responseHeaders[k] = v })
        let parsedBody: any
        try { parsedBody = JSON.parse(responseText) } catch { parsedBody = responseText }

        return {
            callIndex: id, concurrencyLevel: concurrency,
            timestamp: new Date().toISOString(), durationMs, success: response.ok,
            request: { url: requestUrl, method: 'POST', headers: requestHeaders, body: requestBody },
            response: { status: response.status, statusText: response.statusText, headers: responseHeaders, body: parsedBody },
            error: response.ok ? undefined : `HTTP ${response.status}`,
        }
    } catch (err) {
        return {
            callIndex: id, concurrencyLevel: concurrency,
            timestamp: new Date().toISOString(), durationMs: Date.now() - start, success: false,
            request: { url: requestUrl, method: 'POST', headers: requestHeaders, body: requestBody },
            response: null,
            error: err instanceof Error ? err.message : 'Unknown error',
        }
    }
}
