import { useState } from 'react'
import { ArrowLeft, Volume2, CheckCircle, XCircle, Loader2 } from 'lucide-react'

type Exercise = {
    type: string
    question: string
    options?: string[]
    correctAnswer: string
    explanation: string
}

type Props = {
    lessonTitle: string
    chapterTitle: string
    textContent: string
    audioUrl?: string
    exercises?: Exercise[]
    isGenerating: boolean
    onBack: () => void
    onComplete: () => void
}

export function LessonPlayer({ lessonTitle, chapterTitle, textContent, audioUrl, exercises = [], isGenerating, onBack, onComplete }: Props) {
    const [quizPhase, setQuizPhase] = useState<'lesson' | 'quiz' | 'done'>('lesson')
    const [currentEx, setCurrentEx] = useState(0)
    const [selected, setSelected] = useState<string | null>(null)
    const [revealed, setRevealed] = useState(false)
    const [score, setScore] = useState(0)

    const handleOptionSelect = (opt: string) => {
        if (revealed) return
        setSelected(opt)
    }

    const handleCheck = () => {
        if (!selected) return
        setRevealed(true)
        if (selected === exercises[currentEx].correctAnswer) {
            setScore(s => s + 1)
        }
    }

    const handleNext = () => {
        setSelected(null)
        setRevealed(false)
        if (currentEx < exercises.length - 1) {
            setCurrentEx(c => c + 1)
        } else {
            setQuizPhase('done')
        }
    }

    if (isGenerating) {
        return (
            <div className="card animate-fade-in" style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center', padding: '64px 24px' }}>
                <Loader2 size={48} className="animate-spin" style={{ color: 'var(--color-cyber-cyan)', margin: '0 auto var(--space-lg)' }} />
                <h2>Generating lesson content...</h2>
                <p style={{ color: 'var(--color-smoke-gray)', marginTop: 'var(--space-sm)' }}>
                    Writing "{lessonTitle}" and creating exercises. This takes ~10 seconds.
                </p>
            </div>
        )
    }

    return (
        <div className="animate-fade-in" style={{ maxWidth: '720px', margin: '0 auto' }}>
            {/* Header + Back */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
                <button className="btn btn--secondary" onClick={onBack} style={{ padding: 'var(--space-sm) var(--space-md)' }}>
                    <ArrowLeft size={18} /> Back
                </button>
                <div>
                    <p style={{ color: 'var(--color-smoke-gray)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{chapterTitle}</p>
                    <h2 style={{ fontSize: '1.4rem' }}>{lessonTitle}</h2>
                </div>
            </div>

            {quizPhase === 'lesson' && (
                <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                    {audioUrl && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
                            padding: 'var(--space-md)', background: 'rgba(6,182,212,0.08)',
                            borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-xl)'
                        }}>
                            <Volume2 size={20} style={{ color: 'var(--color-cyber-cyan)', flexShrink: 0 }} />
                            <audio controls src={audioUrl} style={{ flex: 1 }} />
                        </div>
                    )}

                    <div
                        style={{ lineHeight: 1.8, fontSize: '1rem', color: 'var(--color-ice-white)', whiteSpace: 'pre-wrap' }}
                        dangerouslySetInnerHTML={{ __html: textContent.replace(/\n/g, '<br/>') }}
                    />

                    {exercises.length > 0 && (
                        <button
                            className="btn btn--primary"
                            onClick={() => setQuizPhase('quiz')}
                            style={{ marginTop: 'var(--space-2xl)', width: '100%' }}
                        >
                            Take the Quiz ({exercises.length} questions)
                        </button>
                    )}
                    {exercises.length === 0 && (
                        <button className="btn btn--primary" onClick={onComplete} style={{ marginTop: 'var(--space-2xl)', width: '100%' }}>
                            Mark as Complete ✓
                        </button>
                    )}
                </div>
            )}

            {quizPhase === 'quiz' && exercises.length > 0 && (
                <div className="card animate-fade-in">
                    <div style={{ marginBottom: 'var(--space-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                            <span style={{ color: 'var(--color-smoke-gray)', fontSize: '0.85rem' }}>Quiz</span>
                            <span style={{ color: 'var(--color-smoke-gray)', fontSize: '0.85rem' }}>{currentEx + 1} / {exercises.length}</span>
                        </div>
                        <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 999 }}>
                            <div style={{ height: '100%', background: 'var(--gradient-primary)', width: `${((currentEx + 1) / exercises.length) * 100}%`, borderRadius: 999, transition: 'width 0.3s ease' }} />
                        </div>
                    </div>

                    <h3 style={{ marginBottom: 'var(--space-xl)', lineHeight: 1.5 }}>
                        {exercises[currentEx].question}
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
                        {(exercises[currentEx].options || []).map((opt) => {
                            const isCorrect = opt === exercises[currentEx].correctAnswer
                            const isSelected = opt === selected
                            const border = !revealed ? (isSelected ? 'rgba(6,182,212,0.7)' : 'rgba(255,255,255,0.1)') : isCorrect ? 'rgba(16,185,129,0.7)' : isSelected ? 'rgba(239,68,68,0.7)' : 'rgba(255,255,255,0.1)'
                            const bg = !revealed ? (isSelected ? 'rgba(6,182,212,0.12)' : 'transparent') : isCorrect ? 'rgba(16,185,129,0.1)' : isSelected ? 'rgba(239,68,68,0.1)' : 'transparent'
                            return (
                                <button
                                    key={opt}
                                    onClick={() => handleOptionSelect(opt)}
                                    style={{
                                        padding: 'var(--space-md) var(--space-lg)', textAlign: 'left',
                                        border: `1px solid ${border}`, borderRadius: 'var(--radius-md)',
                                        background: bg, color: 'var(--color-ice-white)', cursor: revealed ? 'default' : 'pointer',
                                        display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', transition: 'all 0.15s'
                                    }}
                                >
                                    {revealed && isCorrect && <CheckCircle size={16} style={{ color: 'var(--color-neon-emerald)', flexShrink: 0 }} />}
                                    {revealed && !isCorrect && isSelected && <XCircle size={16} style={{ color: 'var(--color-hot-red)', flexShrink: 0 }} />}
                                    {opt}
                                </button>
                            )
                        })}
                    </div>

                    {revealed && (
                        <div style={{
                            padding: 'var(--space-md)', background: 'rgba(255,255,255,0.04)',
                            borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-lg)', fontSize: '0.9rem',
                            color: 'var(--color-smoke-gray)', lineHeight: 1.6
                        }}>
                            💡 {exercises[currentEx].explanation}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                        {!revealed
                            ? <button className="btn btn--primary" onClick={handleCheck} disabled={!selected} style={{ flex: 1 }}>Check Answer</button>
                            : <button className="btn btn--primary" onClick={handleNext} style={{ flex: 1 }}>
                                {currentEx < exercises.length - 1 ? 'Next Question →' : 'See Results'}
                            </button>
                        }
                    </div>
                </div>
            )}

            {quizPhase === 'done' && (
                <div className="card animate-fade-in" style={{ textAlign: 'center', padding: '48px 32px' }}>
                    <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>
                        {score === exercises.length ? '🏆' : score >= exercises.length / 2 ? '🎉' : '💪'}
                    </div>
                    <h2 style={{ marginBottom: 'var(--space-md)' }}>Quiz Complete!</h2>
                    <p style={{ color: 'var(--color-smoke-gray)', marginBottom: 'var(--space-xl)', fontSize: '1.1rem' }}>
                        You scored <strong style={{ color: 'var(--color-cyber-cyan)' }}>{score} / {exercises.length}</strong>
                    </p>
                    <button className="btn btn--primary" onClick={onComplete} style={{ width: '100%' }}>
                        Complete Lesson ✓
                    </button>
                </div>
            )}
        </div>
    )
}
