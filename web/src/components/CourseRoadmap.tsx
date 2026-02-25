import { useState } from 'react'
import { Loader2, ChevronDown, ChevronRight as ChevronRightIcon, CheckCircle, Lock, BookOpen } from 'lucide-react'

type Lesson = {
    title: string
    status: 'pending' | 'generating' | 'ready' | 'locked'
}

type Chapter = {
    title: string
    description: string
    lessons: Lesson[]
}

type Props = {
    title: string
    description: string
    assessmentScore: number
    assessmentFeedback: string
    chapters: Chapter[]
    topic: string
    onLessonSelect: (chapterIdx: number, lessonIdx: number) => void
}

export function CourseRoadmap({ title, description, assessmentScore, assessmentFeedback, chapters, onLessonSelect }: Props) {
    const [expandedChapter, setExpandedChapter] = useState<number>(0)

    const scoreColor = assessmentScore >= 70 ? 'var(--color-neon-emerald)' : assessmentScore >= 40 ? 'var(--color-warm-amber)' : 'var(--color-hot-red)'

    return (
        <div className="animate-fade-in" style={{ maxWidth: '760px', margin: '0 auto' }}>
            {/* Course Header */}
            <div className="card" style={{ marginBottom: 'var(--space-xl)', padding: 'var(--space-xl)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                    <div>
                        <p style={{ color: 'var(--color-cyber-cyan)', fontSize: '0.85rem', fontWeight: 600, marginBottom: 'var(--space-sm)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            📚 Your Personalized Course
                        </p>
                        <h2 style={{ fontSize: '1.75rem', marginBottom: 'var(--space-sm)' }}>{title}</h2>
                        <p style={{ color: 'var(--color-smoke-gray)', lineHeight: 1.6 }}>{description}</p>
                    </div>

                    {/* Baseline Score Badge */}
                    <div style={{
                        background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-md) var(--space-xl)',
                        textAlign: 'center', flexShrink: 0
                    }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: scoreColor, fontFamily: 'var(--font-heading)' }}>
                            {assessmentScore}
                        </div>
                        <div style={{ color: 'var(--color-smoke-gray)', fontSize: '0.8rem', marginTop: 2 }}>Baseline Score</div>
                    </div>
                </div>

                {/* Feedback */}
                <div style={{
                    marginTop: 'var(--space-lg)', padding: 'var(--space-md)',
                    background: 'rgba(6,182,212,0.05)', borderLeft: '3px solid var(--color-cyber-cyan)', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0'
                }}>
                    <p style={{ color: 'var(--color-smoke-gray)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
                        🎯 {assessmentFeedback}
                    </p>
                </div>
            </div>

            {/* Chapter Accordion */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {chapters.map((chapter, ci) => {
                    const isOpen = expandedChapter === ci
                    return (
                        <div key={ci} style={{
                            background: 'var(--gradient-card)', border: `1px solid ${isOpen ? 'rgba(6,182,212,0.4)' : 'rgba(6,182,212,0.15)'}`,
                            borderRadius: 'var(--radius-lg)', overflow: 'hidden', transition: 'border-color 0.2s'
                        }}>
                            {/* Chapter Header */}
                            <button
                                style={{
                                    width: '100%', padding: 'var(--space-lg) var(--space-xl)',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    background: 'none', border: 'none', color: 'var(--color-ice-white)', cursor: 'pointer',
                                    textAlign: 'left', gap: 'var(--space-md)'
                                }}
                                onClick={() => setExpandedChapter(isOpen ? -1 : ci)}
                            >
                                <div>
                                    <p style={{ color: 'var(--color-smoke-gray)', fontSize: '0.75rem', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                        Chapter {ci + 1}
                                    </p>
                                    <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '1.1rem' }}>
                                        {chapter.title}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexShrink: 0 }}>
                                    <span style={{ color: 'var(--color-smoke-gray)', fontSize: '0.85rem' }}>{chapter.lessons.length} lessons</span>
                                    {isOpen
                                        ? <ChevronDown size={20} style={{ color: 'var(--color-cyber-cyan)' }} />
                                        : <ChevronRightIcon size={20} style={{ color: 'var(--color-smoke-gray)' }} />
                                    }
                                </div>
                            </button>

                            {/* Lesson List */}
                            {isOpen && (
                                <div style={{ borderTop: '1px solid rgba(6,182,212,0.1)' }}>
                                    {chapter.lessons.map((lesson, li) => {
                                        const isLocked = ci > 0 && li === 0 // Simple locking: first lesson of each subsequent chapter is locked until prior is done
                                        return (
                                            <button
                                                key={li}
                                                disabled={isLocked}
                                                onClick={() => onLessonSelect(ci, li)}
                                                style={{
                                                    width: '100%', padding: 'var(--space-md) var(--space-xl)',
                                                    display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
                                                    background: 'none', border: 'none', borderBottom: li < chapter.lessons.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                                    color: isLocked ? 'var(--color-smoke-gray)' : 'var(--color-ice-white)',
                                                    cursor: isLocked ? 'not-allowed' : 'pointer',
                                                    textAlign: 'left', transition: 'background 0.15s'
                                                }}
                                                onMouseEnter={e => { if (!isLocked) (e.currentTarget as HTMLElement).style.background = 'rgba(6,182,212,0.05)' }}
                                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
                                            >
                                                {isLocked
                                                    ? <Lock size={16} style={{ flexShrink: 0, color: 'var(--color-smoke-gray)' }} />
                                                    : lesson.status === 'ready'
                                                        ? <CheckCircle size={16} style={{ flexShrink: 0, color: 'var(--color-neon-emerald)' }} />
                                                        : <BookOpen size={16} style={{ flexShrink: 0, color: 'var(--color-cyber-cyan)' }} />
                                                }
                                                <span style={{ fontSize: '0.95rem' }}>
                                                    {li + 1}. {lesson.title}
                                                </span>
                                                {lesson.status === 'generating' && (
                                                    <Loader2 size={14} className="animate-spin" style={{ marginLeft: 'auto', color: 'var(--color-cyber-cyan)' }} />
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
