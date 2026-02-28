import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Trash2, ChevronDown, ChevronRight, FlaskConical } from 'lucide-react'

export default function ModelTestPage() {
    const testRuns = useQuery(api.modelTests.getTestRuns)
    const [expandedRun, setExpandedRun] = useState<string | null>(null)

    return (
        <div className="model-test-page">
            <div style={{ marginBottom: '32px' }}>
                <h1><FlaskConical size={28} style={{ verticalAlign: 'middle', marginRight: '8px' }} />AI Model Tests</h1>
                <p style={{ color: 'var(--color-smoke-gray)', marginTop: '8px' }}>
                    Test and compare AI model responses for curriculum and lesson generation
                </p>
            </div>

            {/* Test Runs List */}
            <div className="model-tests__runs">
                {!testRuns ? (
                    <p style={{ color: 'var(--color-smoke-gray)' }}>Loading test runs...</p>
                ) : testRuns.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-smoke-gray)' }}>
                        <FlaskConical size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                        <p>No test runs yet. Run model tests from the Convex dashboard or via scripts.</p>
                    </div>
                ) : (
                    testRuns.map((run) => (
                        <TestRunCard
                            key={run.testRunId}
                            run={run}
                            expanded={expandedRun === run.testRunId}
                            onToggle={() => setExpandedRun(expandedRun === run.testRunId ? null : run.testRunId)}
                        />
                    ))
                )}
            </div>
        </div>
    )
}

function TestRunCard({ run, expanded, onToggle }: {
    run: {
        testRunId: string
        startedAt: number
        models: string[]
        totalTests: number
        successCount: number
        avgDurationMs: number
    }
    expanded: boolean
    onToggle: () => void
}) {
    const details = useQuery(
        api.modelTests.getTestsByRun,
        expanded ? { testRunId: run.testRunId } : "skip"
    )
    const deleteRun = useMutation(api.modelTests.deleteTestRun)
    const [deleting, setDeleting] = useState(false)

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!confirm('Delete this test run?')) return
        setDeleting(true)
        try {
            await deleteRun({ testRunId: run.testRunId })
        } catch (err) {
            console.error('Failed to delete:', err)
            setDeleting(false)
        }
    }

    const uniqueModels = [...new Set(run.models)]
    const successRate = run.totalTests > 0 ? Math.round((run.successCount / run.totalTests) * 100) : 0

    return (
        <div className="test-run-card">
            <div className="test-run-card__header" onClick={onToggle} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    <span style={{ fontWeight: 600 }}>
                        {new Date(run.startedAt).toLocaleString()}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span className="test-run-card__stat">
                        {uniqueModels.length} model{uniqueModels.length !== 1 ? 's' : ''}
                    </span>
                    <span className="test-run-card__stat">
                        {run.totalTests} test{run.totalTests !== 1 ? 's' : ''}
                    </span>
                    <span className={`test-run-card__rate ${successRate === 100 ? 'test-run-card__rate--success' : ''}`}>
                        {successRate}% pass
                    </span>
                    <span className="test-run-card__stat">
                        ~{Math.round(run.avgDurationMs)}ms avg
                    </span>
                    <button
                        className="btn btn--ghost btn--sm"
                        onClick={handleDelete}
                        disabled={deleting}
                        title="Delete run"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="test-run-card__details">
                    {!details ? (
                        <p style={{ color: 'var(--color-smoke-gray)', padding: '16px' }}>Loading details...</p>
                    ) : (
                        <div className="test-results-grid">
                            {details.map((test) => (
                                <TestResultRow key={test._id} test={test} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function TestResultRow({ test }: {
    test: {
        _id: string
        model: string
        mode: string
        durationMs: number
        status: string
        promptTokens: number
        completionTokens: number
        totalTokens: number
        parseSuccess: boolean
        hasAllFields: boolean
        rawResponse: string
        parsedResult?: string
        errorMessage?: string
        qualityNotes?: string
    }
}) {
    const [showRaw, setShowRaw] = useState(false)

    return (
        <div className={`test-result ${test.status === 'success' ? 'test-result--success' : 'test-result--error'}`}>
            <div className="test-result__header">
                <div>
                    <span className="test-result__model">{test.model}</span>
                    <span className="test-result__mode">{test.mode}</span>
                </div>
                <div className="test-result__stats">
                    <span>{test.durationMs}ms</span>
                    <span>{test.totalTokens} tok</span>
                    <span>{test.parseSuccess ? '✅ Parsed' : '❌ Parse fail'}</span>
                    <span>{test.hasAllFields ? '✅ Complete' : '⚠️ Partial'}</span>
                </div>
            </div>
            {test.errorMessage && (
                <div className="test-result__error">{test.errorMessage}</div>
            )}
            {test.qualityNotes && (
                <div className="test-result__notes">{test.qualityNotes}</div>
            )}
            <button
                className="btn btn--ghost btn--sm"
                onClick={() => setShowRaw(!showRaw)}
                style={{ marginTop: '8px' }}
            >
                {showRaw ? 'Hide' : 'Show'} Raw Response
            </button>
            {showRaw && (
                <pre className="test-result__raw">{test.rawResponse}</pre>
            )}
        </div>
    )
}
