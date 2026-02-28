import { describe, it, expect } from 'vitest'
import { fillTemplate, sanitizeJson, parseJsonResponse } from './aiPipeline'

describe('fillTemplate', () => {
    it('replaces placeholders with values', () => {
        const result = fillTemplate('Hello {{name}}, you are {{level}}', { name: 'Alice', level: 'Advanced' })
        expect(result).toBe('Hello Alice, you are Advanced')
    })

    it('replaces missing vars with empty string', () => {
        const result = fillTemplate('Hello {{name}}, score: {{score}}', { name: 'Bob' })
        expect(result).toBe('Hello Bob, score: ')
    })

    it('handles empty template', () => {
        const result = fillTemplate('', { name: 'Alice' })
        expect(result).toBe('')
    })

    it('handles template with no placeholders', () => {
        const result = fillTemplate('No placeholders here', { name: 'Alice' })
        expect(result).toBe('No placeholders here')
    })

    it('handles empty vars', () => {
        const result = fillTemplate('Hello {{name}}', {})
        expect(result).toBe('Hello ')
    })

    it('converts non-string values to strings', () => {
        const result = fillTemplate('Score: {{score}}', { score: 42 })
        expect(result).toBe('Score: 42')
    })

    it('handles boolean values', () => {
        const result = fillTemplate('Active: {{active}}', { active: true })
        expect(result).toBe('Active: true')
    })
})

describe('sanitizeJson', () => {
    it('removes escaped single quotes', () => {
        const result = sanitizeJson(`{"text": "Don\\'t worry"}`)
        expect(result).toBe(`{"text": "Don't worry"}`)
    })

    it('removes trailing commas before }', () => {
        const result = sanitizeJson('{"a": 1, "b": 2,}')
        expect(result).toBe('{"a": 1, "b": 2}')
    })

    it('removes trailing commas before ]', () => {
        const result = sanitizeJson('[1, 2, 3,]')
        expect(result).toBe('[1, 2, 3]')
    })

    it('handles nested trailing commas', () => {
        const result = sanitizeJson('{"arr": [1, 2,], "obj": {"a": 1,},}')
        expect(result).toBe('{"arr": [1, 2], "obj": {"a": 1}}')
    })

    it('leaves valid JSON unchanged', () => {
        const input = '{"name": "test", "value": 42}'
        expect(sanitizeJson(input)).toBe(input)
    })
})

describe('parseJsonResponse', () => {
    it('parses clean JSON', () => {
        const result = parseJsonResponse('{"score": 85, "feedback": "Great job!"}')
        expect(result).toEqual({ score: 85, feedback: 'Great job!' })
    })

    it('strips markdown code fences', () => {
        const result = parseJsonResponse('```json\n{"score": 85}\n```')
        expect(result).toEqual({ score: 85 })
    })

    it('strips code fences without language', () => {
        const result = parseJsonResponse('```\n{"score": 85}\n```')
        expect(result).toEqual({ score: 85 })
    })

    it('extracts JSON from prose wrapping', () => {
        const result = parseJsonResponse('Here is the result:\n{"score": 85}\nLet me know if you need anything else.')
        expect(result).toEqual({ score: 85 })
    })

    it('handles trailing commas in response', () => {
        const result = parseJsonResponse('{"score": 85, "items": [1, 2,],}')
        expect(result).toEqual({ score: 85, items: [1, 2] })
    })

    it('throws on completely invalid input', () => {
        expect(() => parseJsonResponse('This is not JSON at all')).toThrow('AI returned invalid JSON')
    })

    it('handles whitespace around JSON', () => {
        const result = parseJsonResponse('   \n  {"score": 85}   \n  ')
        expect(result).toEqual({ score: 85 })
    })

    it('handles complex nested JSON', () => {
        const input = JSON.stringify({
            curriculum: {
                title: "Test Course",
                chapters: [
                    { title: "Ch1", lessons: [{ title: "L1" }] }
                ]
            }
        })
        const result = parseJsonResponse(input)
        expect(result.curriculum.title).toBe("Test Course")
        expect(result.curriculum.chapters).toHaveLength(1)
    })
})
