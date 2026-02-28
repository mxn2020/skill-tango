import { useAction, useQuery, useConvexAuth } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { MissingConfigDialog } from '../components/MissingConfigDialog'

export default function PricingPage() {
    const { isAuthenticated } = useConvexAuth()
    const subscription = useQuery(api.stripe.getSubscription)
    const createCheckout = useAction(api.stripe.createCheckoutSession)
    const navigate = useNavigate()
    const [configError, setConfigError] = useState<string | null>(null)

    const handleUpgrade = async (plan: 'pro' | 'enterprise') => {
        if (!isAuthenticated) {
            navigate('/login')
            return
        }
        try {
            const { url } = await createCheckout({ plan })
            if (url) window.location.href = url
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            if (msg.includes('not configured')) {
                setConfigError(msg)
            } else {
                alert(msg)
            }
        }
    }

    const currentPlan = subscription?.plan ?? 'free'

    return (
        <div className="pricing-page">
            {configError && (
                <MissingConfigDialog
                    message={configError}
                    onClose={() => setConfigError(null)}
                />
            )}
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl, 48px)' }}>
                <h1>Simple, Transparent Pricing</h1>
                <p style={{ color: 'var(--color-smoke-gray, #999)', fontSize: '1.1rem', marginTop: '8px' }}>
                    Start free. Upgrade when you're ready.
                </p>
            </div>

            <div className="pricing-grid">
                <div className="pricing-card">
                    <div className="pricing-card__header">
                        <h2>Free</h2>
                        <div className="pricing-card__price">$0<span>/mo</span></div>
                    </div>
                    <ul className="pricing-card__features">
                        <li>✅ 1 course at a time</li>
                        <li>✅ Text-only content</li>
                        <li>✅ Basic quizzes</li>
                        <li>❌ Audio lessons</li>
                        <li>❌ Visual content</li>
                    </ul>
                    <button className="btn btn--secondary pricing-card__btn" disabled={currentPlan === 'free'}>
                        {currentPlan === 'free' ? '✅ Current Plan' : 'Downgrade'}
                    </button>
                </div>

                <div className="pricing-card pricing-card--popular">
                    <div className="pricing-card__badge">Most Popular</div>
                    <div className="pricing-card__header">
                        <h2>Pro</h2>
                        <div className="pricing-card__price">$9<span>/mo</span></div>
                    </div>
                    <ul className="pricing-card__features">
                        <li>✅ Unlimited courses</li>
                        <li>✅ All modalities</li>
                        <li>✅ Audio lessons (TTS)</li>
                        <li>✅ Progress tracking</li>
                        <li>✅ Priority support</li>
                    </ul>
                    <button
                        className="btn btn--primary pricing-card__btn"
                        disabled={currentPlan === 'pro'}
                        onClick={() => handleUpgrade('pro')}
                    >
                        {currentPlan === 'pro' ? '✅ Current Plan' : 'Upgrade to Pro'}
                    </button>
                </div>

                <div className="pricing-card">
                    <div className="pricing-card__header">
                        <h2>Enterprise</h2>
                        <div className="pricing-card__price">$29<span>/mo</span></div>
                    </div>
                    <ul className="pricing-card__features">
                        <li>✅ Everything in Pro</li>
                        <li>✅ API access</li>
                        <li>✅ Team learning</li>
                        <li>✅ Custom topics</li>
                        <li>✅ SLA support</li>
                    </ul>
                    <button
                        className="btn btn--secondary pricing-card__btn"
                        disabled={currentPlan === 'enterprise'}
                        onClick={() => handleUpgrade('enterprise')}
                    >
                        {currentPlan === 'enterprise' ? '✅ Current Plan' : 'Contact Us'}
                    </button>
                </div>
            </div>
        </div>
    )
}
