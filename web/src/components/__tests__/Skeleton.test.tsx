import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { SkeletonLine, SkeletonCard, SkeletonCourseList, SkeletonLessonPlayer, SkeletonAssessment, SkeletonProfile } from '../Skeleton'

describe('Skeleton Components', () => {
    it('renders SkeletonLine correctly', () => {
        const { container } = render(<SkeletonLine width="50%" height="2rem" />)
        const line = container.querySelector('.skeleton--line')
        expect(line).toBeInTheDocument()
        expect(line).toHaveStyle({ width: '50%', height: '2rem' })
    })

    it('renders SkeletonCard correctly', () => {
        const { container } = render(<SkeletonCard />)
        expect(container.querySelector('.skeleton--card')).toBeInTheDocument()
        // Card has header, body, footer placeholders
        expect(container.querySelectorAll('.skeleton--line')).toHaveLength(3)
    })

    it('renders SkeletonCourseList with default 3 cards', () => {
        const { container } = render(<SkeletonCourseList />)
        const cards = container.querySelectorAll('.skeleton--card')
        expect(cards).toHaveLength(3)
    })

    it('renders SkeletonCourseList with specific count', () => {
        const { container } = render(<SkeletonCourseList count={5} />)
        const cards = container.querySelectorAll('.skeleton--card')
        expect(cards).toHaveLength(5)
    })

    it('renders SkeletonLessonPlayer correctly', () => {
        const { container } = render(<SkeletonLessonPlayer />)
        expect(container.querySelector('.animate-fade-in')).toBeInTheDocument()
        expect(container.querySelectorAll('.skeleton--line').length).toBeGreaterThan(0)
    })

    it('renders SkeletonAssessment correctly', () => {
        const { container } = render(<SkeletonAssessment />)
        expect(container.querySelector('.animate-fade-in')).toBeInTheDocument()
        expect(container.querySelectorAll('.skeleton--line').length).toBeGreaterThan(0)
    })

    it('renders SkeletonProfile correctly', () => {
        const { container } = render(<SkeletonProfile />)
        expect(container.querySelector('.profile-page')).toBeInTheDocument()
        const cards = container.querySelectorAll('.skeleton--card')
        expect(cards).toHaveLength(4) // Grid has 4 cards
    })
})
