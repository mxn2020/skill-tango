import { useState } from 'react'

const FAQ_ITEMS = [
    {
        q: "How does Skill-Tango work?",
        a: "You tell us what you want to learn, take a short baseline assessment, and our AI generates a fully personalized curriculum with lessons, quizzes, and multi-modal content."
    },
    {
        q: "What AI models do you use?",
        a: "We use state-of-the-art language models through NVIDIA NIMs to generate assessments, curricula, lesson content, and exercises."
    },
    {
        q: "Can I learn any topic?",
        a: "Yes! From quantum physics to guitar chords, our AI can generate courses for virtually any subject. The quality is best for well-documented topics."
    },
    {
        q: "Are the courses saved?",
        a: "With an account, your courses, progress, and XP are saved automatically. Without an account, courses are generated fresh each session."
    },
    {
        q: "How do I cancel my subscription?",
        a: "Go to Settings and click 'Manage Subscription'. You can cancel anytime and keep access until the end of your billing period."
    },
]

export default function HelpPage() {
    const [openIdx, setOpenIdx] = useState<number | null>(null)

    return (
        <div className="help-page">
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl, 48px)' }}>
                <h1>❓ Help Center</h1>
                <p style={{ color: 'var(--color-smoke-gray, #999)', fontSize: '1.1rem', marginTop: '8px' }}>
                    Got questions? We've got answers.
                </p>
            </div>

            <div className="faq-list">
                {FAQ_ITEMS.map((item, i) => (
                    <div
                        key={i}
                        className={`faq-item ${openIdx === i ? 'faq-item--open' : ''}`}
                        onClick={() => setOpenIdx(openIdx === i ? null : i)}
                    >
                        <div className="faq-item__question">
                            <span>{item.q}</span>
                            <span className="faq-item__icon">{openIdx === i ? '−' : '+'}</span>
                        </div>
                        {openIdx === i && (
                            <div className="faq-item__answer">{item.a}</div>
                        )}
                    </div>
                ))}
            </div>

            <div className="help-contact" style={{ textAlign: 'center', marginTop: 'var(--space-2xl, 48px)' }}>
                <h2>Still need help?</h2>
                <p style={{ color: 'var(--color-smoke-gray, #999)', marginTop: '8px', marginBottom: '16px' }}>
                    Reach out to us and we'll get back to you ASAP.
                </p>
                <a href="mailto:support@skill-tango.com" className="btn btn--primary">
                    📧 Contact Support
                </a>
            </div>
        </div>
    )
}
