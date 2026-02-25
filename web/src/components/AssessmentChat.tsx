import { useState } from 'react'
import { Loader2, ChevronRight } from 'lucide-react'

type Props = {
    topic: string
    targetLevel: string
    modalities: string[]
    assessmentMessage: string
    questions: string[]
    onComplete: (answers: string[]) => void
    isGrading: boolean
}

export function AssessmentChat({ topic, assessmentMessage, questions, onComplete, isGrading }: Props) {
    const [currentQ, setCurrentQ] = useState(0)
    const [answers, setAnswers] = useState<string[]>([])
    const [currentAnswer, setCurrentAnswer] = useState('')

    const handleSubmitAnswer = () => {
        if (!currentAnswer.trim()) return

        const newAnswers = [...answers, currentAnswer.trim()]
        setAnswers(newAnswers)
        setCurrentAnswer('')

        if (currentQ < questions.length - 1) {
            setCurrentQ(prev => prev + 1)
        } else {
            // All questions answered — submit to grader
            onComplete(newAnswers)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmitAnswer()
        }
    }

    const totalQ = questions.length

    return (
        <div className="card animate-fade-in" style={{ maxWidth: '640px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: 'var(--space-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
                    <span style={{ color: 'var(--color-smoke-gray)', fontSize: '0.85rem' }}>
                        Baseline Assessment for <strong style={{ color: 'var(--color-cyber-cyan)' }}>{topic}</strong>
                    </span>
                    <span style={{ color: 'var(--color-smoke-gray)', fontSize: '0.85rem' }}>
                        {Math.min(currentQ + 1, totalQ)} / {totalQ}
                    </span>
                </div>
                <div style={{
                    width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius-full)'
                }}>
                    <div style={{
                        height: '100%', borderRadius: 'var(--radius-full)',
                        background: 'var(--gradient-primary)',
                        width: `${(Math.min(currentQ + 1, totalQ) / totalQ) * 100}%`,
                        transition: 'width 0.4s ease'
                    }} />
                </div>
            </div>

            {/* Chat Log */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
                {/* AI greeting */}
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'
                    }}>🧠</div>
                    <div style={{
                        background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)',
                        borderRadius: '0 var(--radius-md) var(--radius-md) var(--radius-md)',
                        padding: 'var(--space-md)', maxWidth: '85%', fontSize: '0.95rem', lineHeight: 1.6
                    }}>
                        {assessmentMessage}
                    </div>
                </div>

                {/* Answered Q&A pairs */}
                {answers.map((ans, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                        {/* AI question */}
                        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                                background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'
                            }}>🧠</div>
                            <div style={{
                                background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)',
                                borderRadius: '0 var(--radius-md) var(--radius-md) var(--radius-md)',
                                padding: 'var(--space-md)', maxWidth: '85%', fontSize: '0.95rem', lineHeight: 1.6
                            }}>
                                <strong>Q{i + 1}:</strong> {questions[i]}
                            </div>
                        </div>
                        {/* User answer */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <div style={{
                                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                                borderRadius: 'var(--radius-md) 0 var(--radius-md) var(--radius-md)',
                                padding: 'var(--space-md)', maxWidth: '85%', fontSize: '0.95rem', lineHeight: 1.6
                            }}>
                                {ans}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Active question (if not done) */}
                {!isGrading && currentQ < totalQ && (
                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                            background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'
                        }}>🧠</div>
                        <div style={{
                            background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.25)',
                            borderRadius: '0 var(--radius-md) var(--radius-md) var(--radius-md)',
                            padding: 'var(--space-md)', maxWidth: '85%', fontSize: '0.95rem', lineHeight: 1.6
                        }}>
                            <strong>Q{currentQ + 1}:</strong> {questions[currentQ]}
                        </div>
                    </div>
                )}

                {/* Grading spinner */}
                {isGrading && (
                    <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                            background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'
                        }}>🧠</div>
                        <div style={{
                            background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)',
                            borderRadius: '0 var(--radius-md) var(--radius-md) var(--radius-md)',
                            padding: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', color: 'var(--color-smoke-gray)'
                        }}>
                            <Loader2 size={16} className="animate-spin" /> Grading & building your curriculum...
                        </div>
                    </div>
                )}
            </div>

            {/* Answer Input */}
            {!isGrading && currentQ < totalQ && (
                <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                    <textarea
                        placeholder="Type your answer... (Enter to submit)"
                        value={currentAnswer}
                        onChange={e => setCurrentAnswer(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={2}
                        style={{
                            flex: 1, padding: 'var(--space-md)', borderRadius: 'var(--radius-sm)',
                            border: '1px solid rgba(6, 182, 212, 0.3)', background: 'rgba(10, 10, 10, 0.5)',
                            color: 'white', fontSize: '1rem', resize: 'none', fontFamily: 'inherit'
                        }}
                    />
                    <button
                        className="btn btn--primary"
                        onClick={handleSubmitAnswer}
                        disabled={!currentAnswer.trim()}
                        style={{ alignSelf: 'flex-end', padding: 'var(--space-md)' }}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}
        </div>
    )
}
