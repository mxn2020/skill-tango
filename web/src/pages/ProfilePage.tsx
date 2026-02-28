import { useQuery, useAction, useMutation, useConvexAuth } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Flame, Crown, User, Settings, CreditCard } from 'lucide-react'
import { SkeletonProfile } from '../components/Skeleton'
import { MissingConfigDialog } from '../components/MissingConfigDialog'

export default function ProfilePage() {
    const { isAuthenticated } = useConvexAuth()
    const me = useQuery(api.users.getMe)
    const subscription = useQuery(api.stripe.getSubscription)
    const createPortal = useAction(api.stripe.createPortalSession)
    const updateProfile = useMutation(api.users.updateProfile)
    const navigate = useNavigate()

    const [editingName, setEditingName] = useState(false)
    const [nameDraft, setNameDraft] = useState('')
    const [loading, setLoading] = useState(false)
    const [configError, setConfigError] = useState<string | null>(null)

    if (!isAuthenticated) {
        navigate('/login')
        return null
    }

    if (!me) {
        return <SkeletonProfile />
    }

    const plan = subscription?.plan ?? 'free'
    const planLabel = plan === 'free' ? 'Free' : plan === 'pro' ? 'Pro' : 'Enterprise'
    const planEmoji = plan === 'free' ? '🆓' : plan === 'pro' ? '⭐' : '👑'

    const handleManageSubscription = async () => {
        setLoading(true)
        try {
            const { url } = await createPortal()
            window.location.href = url
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            if (msg.includes('not configured')) {
                setConfigError(msg)
            } else {
                alert(msg)
            }
        } finally {
            setLoading(false)
        }
    }

    const handleSaveName = async () => {
        if (!nameDraft.trim()) return
        await updateProfile({ name: nameDraft.trim() })
        setEditingName(false)
    }

    return (
        <div className="profile-page">
            {configError && (
                <MissingConfigDialog
                    message={configError}
                    onClose={() => setConfigError(null)}
                />
            )}
            <h1><User size={28} style={{ marginRight: 8 }} /> My Profile</h1>

            <div className="profile-grid">
                {/* Account Info Card */}
                <div className="profile-card">
                    <h2><Settings size={20} /> Account</h2>
                    <div className="profile-field">
                        <span className="profile-field__label">Email</span>
                        <span className="profile-field__value">{me.email || '—'}</span>
                    </div>
                    <div className="profile-field">
                        <span className="profile-field__label">Name</span>
                        {editingName ? (
                            <div className="profile-field__edit">
                                <input
                                    type="text"
                                    value={nameDraft}
                                    onChange={(e) => setNameDraft(e.target.value)}
                                    className="profile-field__input"
                                    autoFocus
                                />
                                <button className="btn btn--primary btn--sm" onClick={handleSaveName}>Save</button>
                                <button className="btn btn--secondary btn--sm" onClick={() => setEditingName(false)}>Cancel</button>
                            </div>
                        ) : (
                            <div className="profile-field__edit">
                                <span className="profile-field__value">{me.name || '—'}</span>
                                <button
                                    className="btn btn--secondary btn--sm"
                                    onClick={() => { setNameDraft(me.name || ''); setEditingName(true); }}
                                >
                                    Edit
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Plan Card */}
                <div className="profile-card">
                    <h2><CreditCard size={20} /> Subscription</h2>
                    <div className="profile-plan">
                        <div className="profile-plan__badge">
                            {planEmoji} {planLabel} Plan
                        </div>
                    </div>
                    {plan === 'free' ? (
                        <button className="btn btn--primary" onClick={() => navigate('/pricing')}>
                            Upgrade to Pro
                        </button>
                    ) : (
                        <button
                            className="btn btn--secondary"
                            onClick={handleManageSubscription}
                            disabled={loading}
                        >
                            {loading ? '⏳ Opening...' : '⚙️ Manage Subscription'}
                        </button>
                    )}
                </div>

                {/* Stats Card */}
                <div className="profile-card">
                    <h2><Zap size={20} /> Stats</h2>
                    <div className="profile-stats">
                        <div className="profile-stat">
                            <Zap size={24} style={{ color: 'var(--color-cyber-cyan)' }} />
                            <div className="profile-stat__value">{me.hasProfile ? (me as any).xp ?? 0 : 0}</div>
                            <div className="profile-stat__label">Total XP</div>
                        </div>
                        <div className="profile-stat">
                            <Flame size={24} style={{ color: '#f97316' }} />
                            <div className="profile-stat__value">{me.hasProfile ? (me as any).streak ?? 0 : 0}</div>
                            <div className="profile-stat__label">Day Streak</div>
                        </div>
                        <div className="profile-stat">
                            <Crown size={24} style={{ color: 'var(--color-neon-emerald)' }} />
                            <div className="profile-stat__value">{me.role}</div>
                            <div className="profile-stat__label">Role</div>
                        </div>
                    </div>
                </div>

                {/* Usage Card */}
                {me.hasProfile && (
                    <div className="profile-card">
                        <h2>📊 Monthly Usage</h2>
                        <div className="profile-field">
                            <span className="profile-field__label">Assessments</span>
                            <span className="profile-field__value">
                                {(me as any).monthlyAssessments ?? 0}
                                {plan === 'free' && ' / 3'}
                            </span>
                        </div>
                        <div className="profile-field">
                            <span className="profile-field__label">Courses Created</span>
                            <span className="profile-field__value">
                                {(me as any).monthlyCoursesCreated ?? 0}
                                {plan === 'free' && ' / 3'}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
