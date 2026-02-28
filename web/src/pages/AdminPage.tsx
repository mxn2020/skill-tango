import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { CustomSelect } from '../components/CustomSelect'
import { LoadTestDashboard } from '../components/LoadTestDashboard'
import { SkeletonCard } from '../components/Skeleton'

export default function AdminPage() {
    const prompts = useQuery(api.prompts.getPrompts)
    const updatePrompt = useMutation(api.prompts.updatePrompt)
    const seedPrompts = useMutation(api.prompts.seedPrompts)
    const [editingPrompt, setEditingPrompt] = useState<string | null>(null)
    const [promptDraft, setPromptDraft] = useState<string>('')
    const [activeTab, setActiveTab] = useState<'prompts' | 'users' | 'loadtest'>('prompts')

    const users = useQuery(api.users.listUsers)
    const setRole = useMutation(api.users.setRole)

    return (
        <div className="admin-page">
            <h1>⚙️ Admin Dashboard</h1>

            <div className="admin-tabs">
                <button
                    className={`admin-tab ${activeTab === 'prompts' ? 'admin-tab--active' : ''}`}
                    onClick={() => setActiveTab('prompts')}
                >
                    📝 Prompt Management
                </button>
                <button
                    className={`admin-tab ${activeTab === 'users' ? 'admin-tab--active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    👥 User Management
                </button>
                <button
                    className={`admin-tab ${activeTab === 'loadtest' ? 'admin-tab--active' : ''}`}
                    onClick={() => setActiveTab('loadtest')}
                >
                    🧪 Load Testing
                </button>
            </div>

            {activeTab === 'prompts' && (
                <div className="admin-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2>📝 AI Generation Workflow</h2>
                        <button className="btn btn--secondary" style={{ fontSize: '0.85rem' }} onClick={() => seedPrompts({})}>
                            🌱 Seed Defaults
                        </button>
                    </div>
                    <p style={{ color: '#999', marginBottom: '32px' }}>
                        Review the AI generation pipeline. Each step feeds into the next. Edit the prompts to customize the output.
                    </p>

                    <div className="admin-prompts" style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        {prompts && [
                            { id: "assess_baseline_system", label: "Step 1: Baseline Assessment" },
                            { id: "grade_assessment_system", label: "Step 2: Grading & Curriculum Generation" },
                            { id: "content_generator_system", label: "Step 3: Chapter/Lesson Generation (Background)" },
                            { id: "exercise_generator_system", label: "Step 4: Exercise Generation (Background)" }
                        ].map((step, index) => {
                            const prompt = prompts.find(p => p.promptId === step.id)
                            if (!prompt) return null

                            return (
                                <div key={prompt._id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div className="admin-prompt-card" style={{ width: '100%', border: '1px solid var(--color-cyber-cyan)' }}>
                                        <div className="admin-prompt-header">
                                            <div>
                                                <h3 style={{ color: 'var(--color-cyber-cyan)', marginBottom: 4 }}>{step.label}</h3>
                                                <div style={{ fontWeight: 600, marginTop: '8px' }}>{prompt.name}</div>
                                                <div className="admin-prompt-desc">{prompt.description}</div>
                                            </div>
                                            <div className="admin-prompt-meta">
                                                Last updated: {new Date(prompt.updatedAt).toLocaleString()}
                                            </div>
                                        </div>

                                        {editingPrompt === prompt.promptId ? (
                                            <div className="admin-prompt-editor">
                                                <textarea
                                                    value={promptDraft}
                                                    onChange={(e) => setPromptDraft(e.target.value)}
                                                    className="admin-prompt-textarea"
                                                    rows={12}
                                                />
                                                <div className="admin-prompt-actions">
                                                    <button className="btn btn--secondary" style={{ fontSize: '0.85rem' }} onClick={() => setEditingPrompt(null)}>
                                                        Cancel
                                                    </button>
                                                    <button
                                                        className="btn btn--primary" style={{ fontSize: '0.85rem' }}
                                                        onClick={async () => {
                                                            await updatePrompt({ id: prompt._id, content: promptDraft })
                                                            setEditingPrompt(null)
                                                        }}
                                                    >
                                                        Save Prompt
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="admin-prompt-view">
                                                <pre className="admin-prompt-content">{prompt.content}</pre>
                                                <button
                                                    className="btn btn--secondary" style={{ fontSize: '0.85rem', alignSelf: 'flex-start' }}
                                                    onClick={() => {
                                                        setPromptDraft(prompt.content)
                                                        setEditingPrompt(prompt.promptId)
                                                    }}
                                                >
                                                    Edit System Prompt
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Visual Arrow Linking Steps */}
                                    {index < 3 && (
                                        <div style={{ height: '32px', width: '2px', background: 'var(--color-cyber-cyan)', margin: '16px 0', opacity: 0.5 }}></div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {activeTab === 'users' && (
                <div className="admin-section">
                    <h2>👥 User Management</h2>
                    <p style={{ color: '#999', marginBottom: '16px' }}>
                        Manage users and their roles.
                    </p>

                    <div className="admin-users">
                        {users === undefined ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                <SkeletonCard />
                                <SkeletonCard />
                            </div>
                        ) : users.length === 0 ? (
                            <p style={{ color: '#666' }}>No users found (or you're not an admin).</p>
                        ) : (
                            users.map((user) => (
                                <div key={user._id} className="admin-user-card">
                                    <div>
                                        <strong>{user.name || 'Unnamed'}</strong>
                                        <span style={{ color: '#999', marginLeft: '8px' }}>{user.role}</span>
                                    </div>
                                    <div>
                                        <CustomSelect
                                            options={[
                                                { value: 'user', label: 'User' },
                                                { value: 'admin', label: 'Admin' },
                                            ]}
                                            value={user.role}
                                            onChange={(val) => setRole({ profileId: user._id, role: val as any })}
                                            size="sm"
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'loadtest' && (
                <div className="admin-section">
                    <h2>🧪 AI Load Testing</h2>
                    <p style={{ color: '#999', marginBottom: '16px' }}>
                        Run AI pipeline load tests and visualize results. Use dry-run to avoid API costs.
                    </p>
                    <LoadTestDashboard />
                </div>
            )}
        </div>
    )
}
