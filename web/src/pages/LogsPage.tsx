import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Input } from '../components/ui/Input'

export default function LogsPage() {
    const logs = useQuery(api.aiLogs.list, {}) ?? []
    const [filter, setFilter] = useState('')

    const filteredLogs = filter
        ? logs.filter((l: { model: string }) => l.model.toLowerCase().includes(filter.toLowerCase()))
        : logs

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <h1>📋 AI Logs</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Input
                        type="text"
                        placeholder="Filter by model..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        style={{ width: 200 }}
                        id="log-filter"
                    />
                    <button className="btn btn--secondary btn--sm" title="Auto-refreshes via Convex">
                        <RefreshCw size={14} />
                    </button>
                </div>
            </div>

            <div>
                <h3 style={{ marginBottom: '12px' }}>Request History ({filteredLogs.length})</h3>

                {filteredLogs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-smoke-gray, #999)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📋</div>
                        <p>No logs yet</p>
                        <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>AI request logs will appear here once actions are performed.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--color-border, rgba(255,255,255,0.1))' }}>
                                    <th style={{ textAlign: 'left', padding: '8px', color: 'var(--color-smoke-gray, #999)' }}>Time</th>
                                    <th style={{ textAlign: 'left', padding: '8px', color: 'var(--color-smoke-gray, #999)' }}>Model</th>
                                    <th style={{ textAlign: 'left', padding: '8px', color: 'var(--color-smoke-gray, #999)' }}>Status</th>
                                    <th style={{ textAlign: 'right', padding: '8px', color: 'var(--color-smoke-gray, #999)' }}>Duration</th>
                                    <th style={{ textAlign: 'right', padding: '8px', color: 'var(--color-smoke-gray, #999)' }}>Tokens</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.map((log: { _id: string; timestamp: number; model: string; status: string; durationMs: number; totalTokens?: number }) => (
                                    <tr key={log._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td style={{ padding: '8px' }}>{new Date(log.timestamp).toLocaleString()}</td>
                                        <td style={{ padding: '8px' }}>{log.model}</td>
                                        <td style={{ padding: '8px' }}>
                                            <span style={{ color: log.status === 'success' ? 'var(--color-success, #4caf50)' : 'var(--color-danger, #f44336)' }}>
                                                {log.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '8px', textAlign: 'right' }}>
                                            {log.durationMs ? `${(log.durationMs / 1000).toFixed(1)}s` : '—'}
                                        </td>
                                        <td style={{ padding: '8px', textAlign: 'right' }}>{log.totalTokens ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
