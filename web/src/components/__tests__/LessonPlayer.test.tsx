import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LessonPlayer } from '../LessonPlayer'

describe('LessonPlayer', () => {
    const defaultProps = {
        lessonTitle: 'Test Lesson',
        chapterTitle: 'Chapter 1',
        textContent: 'This is the lesson text.',
        isGenerating: false,
        onBack: vi.fn(),
        onComplete: vi.fn()
    }

    it('renders loading state when isGenerating is true', () => {
        render(<LessonPlayer {...defaultProps} isGenerating={true} />)
        expect(screen.getByText(/Generating "Test Lesson".../i)).toBeInTheDocument()
        expect(screen.queryByText(defaultProps.chapterTitle)).not.toBeInTheDocument()
    })

    it('renders lesson content when isGenerating is false', () => {
        render(<LessonPlayer {...defaultProps} />)
        expect(screen.getByText(defaultProps.lessonTitle)).toBeInTheDocument()
        expect(screen.getByText(defaultProps.chapterTitle)).toBeInTheDocument()
        expect(screen.getByText(defaultProps.textContent)).toBeInTheDocument()
    })

    it('renders image when imageUrl is provided', () => {
        render(<LessonPlayer {...defaultProps} imageUrl="https://example.com/image.png" />)
        const img = screen.getByRole('img')
        expect(img).toBeInTheDocument()
        expect(img).toHaveAttribute('src', 'https://example.com/image.png')
    })

    it('renders audio when audioUrl is provided', () => {
        const { container } = render(<LessonPlayer {...defaultProps} audioUrl="https://example.com/audio.mp3" />)
        expect(container.querySelector('audio')).toBeInTheDocument()
        expect(container.querySelector('audio')).toHaveAttribute('src', 'https://example.com/audio.mp3')
    })

    it('handles exercises and completion', () => {
        const exercises = [
            { question: 'Q1', options: ['A', 'B'], correctAnswer: 'A', explanation: 'E1', type: 'multiple_choice' }
        ]
        render(<LessonPlayer {...defaultProps} exercises={exercises} />)

        // Go to exercise phase
        fireEvent.click(screen.getByText(/take the quiz/i))

        // Check exercise is rendered
        expect(screen.getByText('Q1')).toBeInTheDocument()

        // Select option A
        fireEvent.click(screen.getByText('A'))
        fireEvent.click(screen.getByText(/check answer/i))

        // See explanation
        expect(screen.getByText(/E1/i)).toBeInTheDocument()

        // Click Next
        fireEvent.click(screen.getByText(/see results/i))

        expect(screen.getByText(/Quiz Complete!/i)).toBeInTheDocument()
    })
})
