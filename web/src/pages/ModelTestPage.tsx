import { useState, useRef } from 'react'
import { useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { FlaskConical, Image as ImageIcon, MessageSquare, Mic, Video, Upload, Loader2, Play } from 'lucide-react'
import { TEXT_MODELS, IMAGE_MODELS, AUDIO_MODELS, VIDEO_MODELS } from '../lib/modelRegistry'
import { Select, Textarea } from '@geenius-ui/react-css'

const TABS = [
    { id: 'text', icon: <MessageSquare size={18} />, label: 'Text' },
    { id: 'audio', icon: <Mic size={18} />, label: 'Text-to-Audio (TTS)' },
    { id: 'image', icon: <ImageIcon size={18} />, label: 'Text-to-Image' },
    { id: 'video', icon: <Video size={18} />, label: 'Text-to-Video' },
    { id: 'transcribe', icon: <Mic size={18} />, label: 'Audio-to-Text (ASR)' },
    { id: 'conversation', icon: <Mic size={18} />, label: 'Audio Conversation' },
]

export default function ModelTestPage() {
    const [activeTab, setActiveTab] = useState('text')

    // Model testing states
    const [prompt, setPrompt] = useState('Write a short dialogue in Spanish.')
    const [file, setFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Results state
    const [isRunning, setIsRunning] = useState(false)
    const [resultData, setResultData] = useState<any>(null)
    const [duration, setDuration] = useState<number>(0)
    const [error, setError] = useState<string | null>(null)

    // Selection state
    const [selectedModel, setSelectedModel] = useState(TEXT_MODELS[0].id)

    // Actions
    const callModel = useAction(api.nvidia.callModel)
    const generateImage = useAction(api.nvidia.generateImageAction)
    const generateAudio = useAction(api.nvidia.generateAudioAction)
    const generateVideo = useAction(api.nvidia.generateVideoAction)
    const transcribeAudio = useAction(api.nvidia.transcribeAudioAction)

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId)
        setResultData(null)
        setError(null)
        setFile(null)
        const newModels = getModels(tabId)
        if (newModels.length > 0) setSelectedModel(newModels[0].id)
    }

    const getModels = (tabId: string) => {
        switch (tabId) {
            case 'text': return TEXT_MODELS
            case 'image': return IMAGE_MODELS
            case 'audio': return AUDIO_MODELS
            case 'video': return VIDEO_MODELS
            case 'transcribe': return AUDIO_MODELS
            case 'conversation': return TEXT_MODELS // usually uses an LLM to reply
            default: return []
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]
        if (f) {
            setFile(f)
        }
    }

    async function fileToBase64(f: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(f)
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = error => reject(error)
        })
    }

    const runTest = async () => {
        setIsRunning(true)
        setError(null)
        setResultData(null)
        const start = Date.now()

        try {
            if (activeTab === 'text') {
                const res = await callModel({
                    model: selectedModel,
                    messages: [{ role: 'user', content: prompt }]
                })
                setResultData({ type: 'text', content: res })
            }
            else if (activeTab === 'image') {
                const res = await generateImage({ prompt })
                setResultData({ type: 'image', content: `data:image/png;base64,${res}` })
            }
            else if (activeTab === 'audio') {
                const res = await generateAudio({ prompt })
                setResultData({ type: 'audio', content: `data:audio/mp3;base64,${res}` })
            }
            else if (activeTab === 'video') {
                const res = await generateVideo({ prompt })
                setResultData({ type: 'video', content: res })
            }
            else if (activeTab === 'transcribe') {
                if (!file) throw new Error("Please upload an audio file.")
                const b64 = await fileToBase64(file)
                const res = await transcribeAudio({ base64Audio: b64 })
                setResultData({ type: 'text', content: res })
            }
            else if (activeTab === 'conversation') {
                // Mock endpoint fallback logic for audio conversation
                if (!file) throw new Error("Please upload an audio file mapping your voice.")
                await new Promise(r => setTimeout(r, 2000))
                setResultData({ type: 'text', content: "Simulated Conversation Reply: ¡Hola! ¿Cómo estás hoy?" })
            }
        } catch (err: any) {
            setError(err.message || String(err))
        } finally {
            setDuration(Date.now() - start)
            setIsRunning(false)
        }
    }

    const models = getModels(activeTab)

    return (
        <div className="model-test-page" style={{ maxWidth: '1000px', margin: '0 auto', padding: 'var(--space-md)' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1><FlaskConical size={28} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Skill-Tango Models Lab</h1>
                <p style={{ color: 'var(--color-smoke-gray)', marginTop: '8px' }}>
                    Interactive testing environment for core educational modalities.
                </p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        className={`btn ${activeTab === tab.id ? 'btn--primary' : 'btn--ghost'}`}
                        onClick={() => handleTabChange(tab.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1.5fr)', gap: '24px', marginTop: '24px' }}>
                {/* Configuration Panel */}
                <div className="card" style={{ padding: '24px' }}>
                    <h3 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>Configuration</h3>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-smoke-gray)' }}>Select Model</label>
                        <Select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            style={{ width: '100%' }}
                        >
                            {models.map(m => (
                                <option key={m.id} value={m.id}>{m.name} ({m.provider})</option>
                            ))}
                        </Select>
                    </div>

                    {['transcribe', 'conversation'].includes(activeTab) && (
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-smoke-gray)' }}>Upload Audio</label>
                            <div
                                style={{
                                    border: '2px dashed var(--color-border)',
                                    borderRadius: '8px',
                                    padding: '24px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    backgroundColor: 'var(--color-surface)'
                                }}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {file ? (
                                    <div style={{ color: 'var(--color-accent)' }}><Upload size={32} style={{ margin: '0 auto 8px' }} /> {file.name}</div>
                                ) : (
                                    <div style={{ color: 'var(--color-smoke-gray)' }}>
                                        <Upload size={32} style={{ margin: '0 auto 8px' }} />
                                        Click to upload audio snippet
                                    </div>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                style={{ display: 'none' }}
                                onChange={handleFileSelect}
                                accept="audio/*"
                            />
                        </div>
                    )}

                    {!['transcribe', 'conversation'].includes(activeTab) && (
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-smoke-gray)' }}>Prompt</label>
                            <Textarea
                                rows={4}
                                value={prompt}
                                onChange={(e: any) => setPrompt(e.target.value)}
                                style={{ width: '100%', resize: 'vertical' }}
                                placeholder="Enter your prompt here..."
                            />
                        </div>
                    )}

                    <button
                        className="btn btn--primary"
                        style={{ width: '100%', marginTop: '8px', display: 'flex', justifyContent: 'center', gap: '8px' }}
                        onClick={runTest}
                        disabled={isRunning || (!file && ['transcribe', 'conversation'].includes(activeTab))}
                    >
                        {isRunning ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : <><Play size={18} /> Run Test</>}
                    </button>

                    {error && (
                        <div style={{ marginTop: '16px', padding: '12px', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.9rem' }}>
                            {error}
                        </div>
                    )}
                </div>

                {/* Results Panel */}
                <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '1.2rem' }}>Output</h3>
                        {resultData && <span style={{ fontSize: '0.85rem', color: 'var(--color-smoke-gray)', background: 'var(--color-surface)', padding: '4px 8px', borderRadius: '4px' }}>{(duration / 1000).toFixed(2)}s latency</span>}
                    </div>

                    <div style={{
                        flex: 1,
                        backgroundColor: 'var(--color-surface)',
                        borderRadius: '8px',
                        padding: '16px',
                        overflowY: 'auto',
                        minHeight: '300px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: resultData && ['image', 'video'].includes(resultData.type) ? 'center' : 'flex-start',
                        justifyContent: resultData && ['image', 'video'].includes(resultData.type) ? 'center' : 'flex-start',
                    }}>
                        {!resultData && !isRunning && (
                            <div style={{ margin: 'auto', color: 'var(--color-smoke-gray)', textAlign: 'center' }}>
                                <FlaskConical size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                                Run a test to see output here.
                            </div>
                        )}

                        {isRunning && (
                            <div style={{ margin: 'auto', color: 'var(--color-accent)', textAlign: 'center' }}>
                                <Loader2 size={48} className="animate-spin" style={{ margin: '0 auto 16px' }} />
                                Waiting for model response...
                            </div>
                        )}

                        {resultData?.type === 'text' && (
                            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, width: '100%' }}>{resultData.content}</div>
                        )}

                        {resultData?.type === 'image' && (
                            <img src={resultData.content} alt="Generated" style={{ maxWidth: '100%', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                        )}

                        {resultData?.type === 'audio' && (
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', margin: 'auto' }}>
                                <Mic size={48} style={{ color: 'var(--color-accent)' }} />
                                <audio controls src={resultData.content} style={{ width: '100%' }} autoPlay />
                            </div>
                        )}

                        {resultData?.type === 'video' && (
                            <video controls src={resultData.content} style={{ maxWidth: '100%', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} autoPlay />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
