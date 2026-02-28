import { describe, it, expect } from 'vitest'
import { extractPromptText } from './nvidia'

describe('extractPromptText', () => {
    it('extracts system and user prompts from string messages', () => {
        const result = extractPromptText([
            { role: 'system', content: 'You are a tutor' },
            { role: 'user', content: 'Teach me physics' },
        ])
        expect(result.systemPrompt).toBe('You are a tutor')
        expect(result.userPromptText).toBe('Teach me physics')
        expect(result.hasImage).toBe(false)
        expect(result.imageSizeBytes).toBe(0)
    })

    it('handles array content with text parts', () => {
        const result = extractPromptText([
            { role: 'system', content: [{ type: 'text' as const, text: 'System prompt' }] },
            { role: 'user', content: [{ type: 'text' as const, text: 'User prompt' }] },
        ])
        expect(result.systemPrompt).toBe('System prompt')
        expect(result.userPromptText).toBe('User prompt')
    })

    it('detects images in array content', () => {
        const result = extractPromptText([
            {
                role: 'user', content: [
                    { type: 'text' as const, text: 'Describe this' },
                    { type: 'image_url' as const, image_url: { url: 'data:image/png;base64,abc123' } },
                ]
            },
        ])
        expect(result.hasImage).toBe(true)
        expect(result.imageSizeBytes).toBeGreaterThan(0)
        expect(result.userPromptText).toBe('Describe this')
    })

    it('handles empty messages array', () => {
        const result = extractPromptText([])
        expect(result.systemPrompt).toBe('')
        expect(result.userPromptText).toBe('')
        expect(result.hasImage).toBe(false)
    })

    it('concatenates multiple user messages', () => {
        const result = extractPromptText([
            { role: 'user', content: 'Hello' },
            { role: 'user', content: ' world' },
        ])
        expect(result.userPromptText).toBe('Hello world')
    })

    it('handles assistant messages', () => {
        const result = extractPromptText([
            { role: 'system', content: 'System' },
            { role: 'assistant', content: 'Assistant response' },
            { role: 'user', content: 'Follow up' },
        ])
        expect(result.systemPrompt).toBe('System')
        expect(result.userPromptText).toBe('Assistant responseFollow up')
    })
})
