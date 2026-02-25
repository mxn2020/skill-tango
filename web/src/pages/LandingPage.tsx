import { useNavigate } from 'react-router-dom'
import { BrainCircuit, BookOpen, Mic, Image as ImageIcon, Sparkles, Target, TrendingUp } from 'lucide-react'

export default function LandingPage() {
    const navigate = useNavigate()

    return (
        <div className="landing-page">
            <section className="landing-hero">
                <div className="landing-hero__content">
                    <h1 className="landing-hero__title">
                        <BrainCircuit size={40} style={{ color: 'var(--color-cyber-cyan)' }} />
                        <span>Learn Anything.<br />Your Way.</span>
                    </h1>
                    <p className="landing-hero__tagline">
                        AI-generated, highly personalized crash courses. Tell us what you want to learn,
                        and we'll build you a custom curriculum in seconds.
                    </p>
                    <div className="landing-hero__actions">
                        <button className="btn btn--primary btn--lg" onClick={() => navigate('/app')}>
                            🚀 Start Learning Free
                        </button>
                        <button className="btn btn--secondary btn--lg" onClick={() => navigate('/pricing')}>
                            View Plans
                        </button>
                    </div>
                </div>
            </section>

            <section className="landing-features">
                <h2 className="landing-section__title">How It Works</h2>
                <div className="landing-features__grid">
                    <div className="landing-feature">
                        <div className="landing-feature__icon"><Target size={32} /></div>
                        <h3>Pick a Topic</h3>
                        <p>From quantum physics to guitar chords — our AI handles any subject.</p>
                    </div>
                    <div className="landing-feature">
                        <div className="landing-feature__icon"><Sparkles size={32} /></div>
                        <h3>AI Assessment</h3>
                        <p>A quick baseline test adapts the curriculum to your exact current level.</p>
                    </div>
                    <div className="landing-feature">
                        <div className="landing-feature__icon"><TrendingUp size={32} /></div>
                        <h3>Learn & Level Up</h3>
                        <p>Multi-modal lessons with text, audio, and exercises — progress at your pace.</p>
                    </div>
                </div>
            </section>

            <section className="landing-modalities">
                <h2 className="landing-section__title">Multi-Modal Learning</h2>
                <div className="landing-features__grid">
                    <div className="landing-feature">
                        <BookOpen size={28} style={{ color: 'var(--color-cyber-cyan)' }} />
                        <h3>Text Lessons</h3>
                        <p>Rich, structured content with examples and code snippets.</p>
                    </div>
                    <div className="landing-feature">
                        <Mic size={28} style={{ color: 'var(--color-neon-magenta, #e040fb)' }} />
                        <h3>Audio Narration</h3>
                        <p>AI-generated audio so you can learn on the go.</p>
                    </div>
                    <div className="landing-feature">
                        <ImageIcon size={28} style={{ color: 'var(--color-lime-zap, #76ff03)' }} />
                        <h3>Visual Aids</h3>
                        <p>Diagrams, charts, and visual explanations for complex concepts.</p>
                    </div>
                </div>
            </section>

            <section className="landing-cta">
                <h2>Ready to learn smarter?</h2>
                <p>Join thousands of learners already using AI-powered education.</p>
                <button className="btn btn--primary btn--lg" onClick={() => navigate('/login')}>
                    🚀 Get Started Free
                </button>
            </section>
        </div>
    )
}
