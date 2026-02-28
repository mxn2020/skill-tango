import { useState } from 'react'
import { BookOpen, Mic, Image as ImageIcon } from 'lucide-react'
import { useAction, useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { AssessmentChat } from '../components/AssessmentChat'
import { CourseRoadmap } from '../components/CourseRoadmap'
import { LessonPlayer } from '../components/LessonPlayer'
import { CustomSelect } from '../components/CustomSelect'
import { useToast } from '../components/Toast'
import { SkeletonCourseList, SkeletonAssessment } from '../components/Skeleton'

type Modality = 'text' | 'audio' | 'visual'

type AppView =
    | { name: 'home' }
    | { name: 'assessing' }
    | { name: 'answering'; assessmentData: any }
    | { name: 'grading'; assessmentData: any; answers: string[] }
    | { name: 'roadmap'; courseData: any; assessmentScore: number; assessmentFeedback: string; courseId?: Id<"courses"> }
    | { name: 'lesson'; courseData: any; assessmentScore: number; assessmentFeedback: string; chapterIdx: number; lessonIdx: number; courseId?: Id<"courses">; lessonId?: Id<"lessons"> }

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
    const createCourse = useMutation(api.courses.createCourse)
    const trackCompletion = useMutation(api.courses.trackCompletion)
    const deleteCourse = useMutation(api.courses.deleteCourse)
    const existingCourses = useQuery(api.courses.getUserCourses)

    const liveCourseData = useQuery(api.courses.getCourseWithChapters, view.name === 'roadmap' || view.name === 'lesson' ? (view.courseId ? { courseId: view.courseId } : "skip") : "skip")
    const liveLessonData = useQuery(api.content.getLessonFullContent, view.name === 'lesson' && view.lessonId ? { lessonId: view.lessonId } : "skip")

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

            // Persist the course to the database
            let courseId: Id<"courses"> | undefined
            try {
                courseId = await createCourse({
                    topic,
                    targetLevel,
                    modalities,
                    title: result.courseData.title,
                    description: result.courseData.description,
                    chapters: result.courseData.chapters.map((ch: any) => ({
                        title: ch.title,
                        description: ch.description,
                        lessons: ch.lessons.map((l: any) => ({ title: l.title })),
                    })),
                })
                showToast('Course saved! You can come back anytime.', 'success')
            } catch (saveErr) {
                console.error('Failed to persist course:', saveErr)
                // Continue even if save fails — user can still use the in-memory course
            }

            setView({
                name: 'roadmap',
                courseData: result.courseData,
                assessmentScore: result.assessmentScore,
                assessmentFeedback: result.assessmentFeedback,
                courseId,
            })
        } catch (err) {
            console.error(err)
            showToast('Failed to generate curriculum. Please try again.', 'error')
            setView({ name: 'home' })
        }
    }

    const handleLessonSelect = async (chapterIdx: number, lessonIdx: number) => {
        if (view.name !== 'roadmap') return
        const { assessmentScore, assessmentFeedback, courseId } = view

        const chapters = liveCourseData?.chapters || view.courseData.chapters
        const lesson = chapters[chapterIdx].lessons[lessonIdx]

        setView({
            name: 'lesson',
            courseData: view.courseData,
            assessmentScore,
            assessmentFeedback,
            chapterIdx,
            lessonIdx,
            courseId,
            lessonId: lesson._id
        })
    }

    const handleLessonComplete = async () => {
        if (view.name !== 'lesson') return
        const { courseData, assessmentScore, assessmentFeedback, chapterIdx, lessonIdx, courseId } = view
        const lessonKey = `${courseData.chapters[chapterIdx].title}::${courseData.chapters[chapterIdx].lessons[lessonIdx].title}`

        // Track completion
        try {
            await trackCompletion({ type: 'lesson', itemId: lessonKey })
        } catch (err) {
            console.error('Failed to track completion:', err)
        }

        setView({ name: 'roadmap', courseData, assessmentScore, assessmentFeedback, courseId })
    }

    const handleResumeCourse = (course: any) => {
        // Re-enter roadmap from a saved course
        setTopic(course.topic)
        setView({
            name: 'roadmap',
            courseData: {
                title: course.title,
                description: course.description,
                // We'll load chapters separately via getCourseWithChapters in a future enhancement
                // For now, show placeholder
                chapters: [],
            },
            assessmentScore: 0,
            assessmentFeedback: 'Resuming your saved course.',
            courseId: course._id,
        })
        showToast(`Resuming "${course.title}"`, 'info')
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

                    {/* Existing Courses */}
                    {existingCourses && existingCourses.length > 0 && (
                        <div style={{ maxWidth: '600px', margin: '0 auto var(--space-2xl)' }}>
                            <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--color-cyber-cyan)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                📚 Your Courses
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                {existingCourses.map((course) => (
                                    <div
                                        key={course._id}
                                        className="card"
                                        style={{
                                            padding: 'var(--space-md) var(--space-lg)',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            border: '1px solid rgba(6,182,212,0.15)',
                                        }}
                                    >
                                        <button
                                            onClick={() => handleResumeCourse(course)}
                                            style={{
                                                flex: 1, background: 'none', border: 'none', color: 'inherit',
                                                textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                                            }}
                                        >
                                            <div style={{ fontWeight: 600, marginBottom: 4 }}>{course.title}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-smoke-gray)' }}>
                                                {course.topic} · {course.targetLevel} · {new Date(course.createdAt).toLocaleDateString()}
                                            </div>
                                        </button>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                            <span style={{ color: 'var(--color-cyber-cyan)', fontSize: '0.85rem', cursor: 'pointer' }} onClick={() => handleResumeCourse(course)}>Resume →</span>
                                            <button
                                                className="course-delete-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    if (confirm(`Delete "${course.title}"? This cannot be undone.`)) {
                                                        deleteCourse({ courseId: course._id })
                                                            .then(() => showToast('Course deleted', 'info'))
                                                            .catch(() => showToast('Failed to delete', 'error'))
                                                    }
                                                }}
                                                title="Delete course"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {existingCourses === undefined && (
                        <div style={{ maxWidth: '600px', margin: '0 auto var(--space-2xl)' }}>
                            <SkeletonCourseList count={2} />
                        </div>
                    )}

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
                <div>
                    <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
                        <h2 style={{ fontSize: '1.2rem', color: 'var(--color-cyber-cyan)' }}>Generating your assessment...</h2>
                        <p style={{ color: 'var(--color-smoke-gray)', marginTop: 'var(--space-sm)' }}>
                            AI is analyzing "<strong>{topic}</strong>"
                        </p>
                    </div>
                    <SkeletonAssessment />
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
                <div>
                    <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
                        <h2 style={{ fontSize: '1.2rem', color: 'var(--color-cyber-cyan)' }}>Grading & building your curriculum...</h2>
                    </div>
                    <SkeletonAssessment />
                </div>
            )}

            {view.name === 'roadmap' && (
                <CourseRoadmap
                    title={liveCourseData?.course?.title || view.courseData.title}
                    description={liveCourseData?.course?.description || view.courseData.description}
                    assessmentScore={view.assessmentScore} assessmentFeedback={view.assessmentFeedback}
                    chapters={(liveCourseData?.chapters || view.courseData.chapters).map((ch: any) => ({
                        ...ch, lessons: ch.lessons.map((l: any) => ({ ...l, status: l.status || 'pending' }))
                    }))}
                    topic={topic} onLessonSelect={handleLessonSelect}
                />
            )}

            {view.name === 'lesson' && (
                <LessonPlayer
                    lessonTitle={(liveCourseData?.chapters || view.courseData.chapters)[view.chapterIdx].lessons[view.lessonIdx].title}
                    chapterTitle={(liveCourseData?.chapters || view.courseData.chapters)[view.chapterIdx].title}
                    textContent={liveLessonData?.textContent || ''}
                    audioUrl={liveLessonData?.audioUrl}
                    imageUrl={liveLessonData?.imageUrl}
                    exercises={liveLessonData?.exercises || []}
                    isGenerating={!liveLessonData?.textContent || liveLessonData?.status !== 'ready'}
                    onBack={() => setView({ name: 'roadmap', courseData: view.courseData, assessmentScore: view.assessmentScore, assessmentFeedback: view.assessmentFeedback, courseId: view.courseId })}
                    onComplete={handleLessonComplete}
                />
            )}
        </>
    )
}
