import { useState } from 'react'
import { BookOpen, Mic, Image as ImageIcon, Loader2 } from 'lucide-react'
import { useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { AssessmentChat } from '../components/AssessmentChat'
import { CourseRoadmap } from '../components/CourseRoadmap'
import { LessonPlayer } from '../components/LessonPlayer'
import { CustomSelect } from '../components/CustomSelect'
import { useToast } from '../components/Toast'

type Modality = 'text' | 'audio' | 'visual'

type AppView =
    | { name: 'home' }
    | { name: 'assessing' }
    | { name: 'answering'; assessmentData: any }
    | { name: 'grading'; assessmentData: any; answers: string[] }
    | { name: 'roadmap'; courseData: any; assessmentScore: number; assessmentFeedback: string }
    | { name: 'lesson'; courseData: any; assessmentScore: number; assessmentFeedback: string; chapterIdx: number; lessonIdx: number; lessonContent?: any; isGenerating: boolean; exercises: any[] }

const TARGET_LEVELS = [
    { value: 'Beginner', label: '🌱 Beginner' },
    { value: 'Intermediate', label: '🔥 Intermediate' },
    { value: 'Advanced', label: '🚀 Advanced' },
]

const LANGUAGES = [
    { value: 'English', label: '🇬🇧 English' },
    { value: 'Spanish', label: '🇪🇸 Spanish' },
    { value: 'French', label: '🇫🇷 French' },
    { value: 'German', label: '🇩🇪 German' },
    { value: 'Portuguese', label: '🇧🇷 Portuguese' },
    { value: 'Italian', label: '🇮🇹 Italian' },
    { value: 'Dutch', label: '🇳🇱 Dutch' },
    { value: 'Russian', label: '🇷🇺 Russian' },
    { value: 'Japanese', label: '🇯🇵 Japanese' },
    { value: 'Korean', label: '🇰🇷 Korean' },
    { value: 'Chinese', label: '🇨🇳 Chinese' },
    { value: 'Arabic', label: '🇸🇦 Arabic' },
    { value: 'Hindi', label: '🇮🇳 Hindi' },
    { value: 'Turkish', label: '🇹🇷 Turkish' },
    { value: 'Persian', label: '🇮🇷 Persian' },
]

export default function AppHome() {
    const [topic, setTopic] = useState('')
    const [targetLevel, setTargetLevel] = useState('Intermediate')
    const [language, setLanguage] = useState('English')
    const [modalities, setModalities] = useState<Modality[]>(['text'])
    const [view, setView] = useState<AppView>({ name: 'home' })
    const { showToast } = useToast()

    const assessBaseline = useAction(api.aiPipeline.assessBaseline)
    const gradeAndGenerate = useAction(api.aiPipeline.gradeAssessmentAndGenerateCurriculum)
    const generateLessonDirect = useAction(api.aiPipeline.generateLessonDirect)

    const toggleModality = (mod: Modality) => {
        setModalities(prev =>
            prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]
        )
    }

    const handleStartAssessment = async () => {
        if (!topic.trim()) return
        setView({ name: 'assessing' })
        try {
            const data = await assessBaseline({ topic, targetLevel, language })
            setView({ name: 'answering', assessmentData: data })
        } catch (err) {
            console.error(err)
            setView({ name: 'home' })
            showToast('Failed to generate assessment. Please try again.', 'error')
        }
    }

    const handleAssessmentComplete = async (answers: string[]) => {
        if (view.name !== 'answering') return
        const assessData = view.assessmentData
        setView({ name: 'grading', assessmentData: assessData, answers })

        try {
            const result = await gradeAndGenerate({
                topic, targetLevel, modalities, language,
                questions: assessData.questions, answers,
            })
            setView({
                name: 'roadmap',
                courseData: result.courseData,
                assessmentScore: result.assessmentScore,
                assessmentFeedback: result.assessmentFeedback
            })
        } catch (err) {
            console.error(err)
            showToast('Failed to generate curriculum. Please try again.', 'error')
            setView({ name: 'home' })
        }
    }

    const handleLessonSelect = async (chapterIdx: number, lessonIdx: number) => {
        if (view.name !== 'roadmap') return
        const { courseData, assessmentScore, assessmentFeedback } = view
        const lessonTitle = courseData.chapters[chapterIdx].lessons[lessonIdx].title
        const chapterTitle = courseData.chapters[chapterIdx].title

        setView({ name: 'lesson', courseData, assessmentScore, assessmentFeedback, chapterIdx, lessonIdx, isGenerating: true, exercises: [] })

        try {
            const lessonContent = await generateLessonDirect({ topic, targetLevel, lessonTitle, chapterTitle, language })
            setView({ name: 'lesson', courseData, assessmentScore, assessmentFeedback, chapterIdx, lessonIdx, lessonContent, isGenerating: false, exercises: (lessonContent as any).exercises || [] })
        } catch (err) {
            console.error(err)
            showToast('Failed to generate lesson. Please try again.', 'error')
            setView({ name: 'roadmap', courseData, assessmentScore, assessmentFeedback })
        }
    }

    const handleLessonComplete = () => {
        if (view.name !== 'lesson') return
        const { courseData, assessmentScore, assessmentFeedback } = view
        setView({ name: 'roadmap', courseData, assessmentScore, assessmentFeedback })
    }

    return (
        <>
            {view.name === 'home' && (
                <div className="animate-fade-in">
                    <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
                        <h1>What do you want to learn today?</h1>
                        <p style={{ color: 'var(--color-smoke-gray)', fontSize: '1.2rem', marginTop: 'var(--space-md)' }}>
                            AI-generated, highly personalized crash courses.
                        </p>
                    </div>

                    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: 'var(--space-sm)', fontWeight: 600 }}>Topic</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Quantum Physics, French, Guitar Chords..."
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleStartAssessment()}
                                    style={{
                                        width: '100%', padding: 'var(--space-md)', borderRadius: 'var(--radius-sm)',
                                        border: '1px solid rgba(6, 182, 212, 0.3)', background: 'rgba(10, 10, 10, 0.5)',
                                        color: 'white', fontSize: '1rem', fontFamily: 'inherit', outline: 'none'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: 'var(--space-sm)', fontWeight: 600 }}>Target Level</label>
                                <CustomSelect
                                    options={TARGET_LEVELS}
                                    value={targetLevel}
                                    onChange={setTargetLevel}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: 'var(--space-sm)', fontWeight: 600 }}>Course Language</label>
                                <CustomSelect
                                    options={LANGUAGES}
                                    value={language}
                                    onChange={setLanguage}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: 'var(--space-md)', fontWeight: 600 }}>Learning Modalities</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-md)' }}>
                                    {([
                                        { key: 'text', icon: <BookOpen size={24} />, label: 'Text' },
                                        { key: 'audio', icon: <Mic size={24} />, label: 'Audio' },
                                        { key: 'visual', icon: <ImageIcon size={24} />, label: 'Visual' },
                                    ] as const).map(({ key, icon, label }) => (
                                        <button
                                            key={key}
                                            className={`btn ${modalities.includes(key) ? 'btn--primary' : 'btn--secondary'}`}
                                            onClick={() => toggleModality(key)}
                                            style={{ flexDirection: 'column', gap: 'var(--space-xs)', padding: 'var(--space-md)' }}
                                        >
                                            {icon} {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                className="btn btn--primary"
                                style={{ width: '100%', marginTop: 'var(--space-md)' }}
                                onClick={handleStartAssessment}
                                disabled={!topic.trim()}
                            >
                                Start AI Assessment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {view.name === 'assessing' && (
                <div className="card animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: 'var(--space-3xl) var(--space-xl)' }}>
                    <Loader2 className="animate-spin" size={48} style={{ color: 'var(--color-cyber-cyan)', margin: '0 auto var(--space-lg)' }} />
                    <h2>Generating your assessment...</h2>
                    <p style={{ color: 'var(--color-smoke-gray)', marginTop: 'var(--space-sm)' }}>
                        AI is analyzing "<strong>{topic}</strong>"
                    </p>
                </div>
            )}

            {view.name === 'answering' && (
                <AssessmentChat
                    topic={topic} targetLevel={targetLevel} modalities={modalities}
                    assessmentMessage={view.assessmentData.assessmentMessage}
                    questions={view.assessmentData.questions}
                    onComplete={handleAssessmentComplete} isGrading={false}
                />
            )}

            {view.name === 'grading' && (
                <div className="card animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: 'var(--space-3xl) var(--space-xl)' }}>
                    <Loader2 className="animate-spin" size={48} style={{ color: 'var(--color-cyber-cyan)', margin: '0 auto var(--space-lg)' }} />
                    <h2>Grading & building your curriculum...</h2>
                </div>
            )}

            {view.name === 'roadmap' && (
                <CourseRoadmap
                    title={view.courseData.title} description={view.courseData.description}
                    assessmentScore={view.assessmentScore} assessmentFeedback={view.assessmentFeedback}
                    chapters={view.courseData.chapters.map((ch: any) => ({
                        ...ch, lessons: ch.lessons.map((l: any) => ({ ...l, status: 'pending' }))
                    }))}
                    topic={topic} onLessonSelect={handleLessonSelect}
                />
            )}

            {view.name === 'lesson' && (
                <LessonPlayer
                    lessonTitle={view.courseData.chapters[view.chapterIdx].lessons[view.lessonIdx].title}
                    chapterTitle={view.courseData.chapters[view.chapterIdx].title}
                    textContent={view.lessonContent?.text || ''}
                    audioUrl={view.lessonContent?.audioUrl}
                    exercises={view.exercises}
                    isGenerating={view.isGenerating}
                    onBack={() => setView({ name: 'roadmap', courseData: view.courseData, assessmentScore: view.assessmentScore, assessmentFeedback: view.assessmentFeedback })}
                    onComplete={handleLessonComplete}
                />
            )}
        </>
    )
}
