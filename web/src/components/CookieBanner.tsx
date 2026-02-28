import { useState, useEffect } from 'react'

const COOKIE_KEY = 'skill-tango-cookie-consent'

export default function CookieBanner() {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const consent = localStorage.getItem(COOKIE_KEY)
        if (!consent) {
            // Small delay so it doesn't flash on load
            const timer = setTimeout(() => setVisible(true), 1500)
            return () => clearTimeout(timer)
        }
    }, [])

    const accept = () => {
        localStorage.setItem(COOKIE_KEY, 'accepted')
        setVisible(false)
    }

    const decline = () => {
        localStorage.setItem(COOKIE_KEY, 'declined')
        setVisible(false)
    }

    if (!visible) return null

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            padding: '16px',
            background: 'var(--color-void-black)',
            borderTop: '1px solid rgba(var(--color-accent-rgb), 0.3)',
            display: 'flex',
            justifyContent: 'center'
        }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', maxWidth: '800px', width: '100%', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-smoke-gray)' }}>
                    🍪 We use cookies to improve your experience. By continuing, you agree to our{' '}
                    <a href="/privacy" style={{ color: 'var(--color-cyber-cyan)' }}>Privacy Policy</a>.
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn--secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={decline}>
                        Decline
                    </button>
                    <button className="btn btn--primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={accept}>
                        Accept
                    </button>
                </div>
            </div>
        </div>
    )
}
