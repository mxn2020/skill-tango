import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ToastProvider, useToast } from '../Toast'

// Test component that triggers toasts
function TestTrigger() {
    const { showToast } = useToast()
    return (
        <div>
            <button onClick={() => showToast('Success message', 'success')}>Show Success</button>
            <button onClick={() => showToast('Error message', 'error')}>Show Error</button>
            <button onClick={() => showToast('Info message', 'info')}>Show Info</button>
            <button onClick={() => showToast('Default message')}>Show Default</button>
        </div>
    )
}

describe('Toast', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('renders success toast', () => {
        render(
            <ToastProvider>
                <TestTrigger />
            </ToastProvider>
        )

        fireEvent.click(screen.getByText('Show Success'))
        expect(screen.getByText('Success message')).toBeInTheDocument()
    })

    it('renders error toast', () => {
        render(
            <ToastProvider>
                <TestTrigger />
            </ToastProvider>
        )

        fireEvent.click(screen.getByText('Show Error'))
        expect(screen.getByText('Error message')).toBeInTheDocument()
    })

    it('renders info toast', () => {
        render(
            <ToastProvider>
                <TestTrigger />
            </ToastProvider>
        )

        fireEvent.click(screen.getByText('Show Info'))
        expect(screen.getByText('Info message')).toBeInTheDocument()
    })

    it('defaults to info type', () => {
        render(
            <ToastProvider>
                <TestTrigger />
            </ToastProvider>
        )

        fireEvent.click(screen.getByText('Show Default'))
        expect(screen.getByText('Default message')).toBeInTheDocument()
    })

    it('auto-dismisses after timeout', async () => {
        vi.useFakeTimers()

        render(
            <ToastProvider>
                <TestTrigger />
            </ToastProvider>
        )

        fireEvent.click(screen.getByText('Show Success'))
        expect(screen.getByText('Success message')).toBeInTheDocument()

        await act(async () => {
            vi.advanceTimersByTime(5001)
        })

        expect(screen.queryByText('Success message')).not.toBeInTheDocument()
        vi.useRealTimers()
    })

    it('can be manually dismissed', () => {
        render(
            <ToastProvider>
                <TestTrigger />
            </ToastProvider>
        )

        fireEvent.click(screen.getByText('Show Success'))
        expect(screen.getByText('Success message')).toBeInTheDocument()

        const dismissBtn = screen.getByLabelText('Dismiss')
        fireEvent.click(dismissBtn)

        expect(screen.queryByText('Success message')).not.toBeInTheDocument()
    })

    it('renders multiple toasts', () => {
        render(
            <ToastProvider>
                <TestTrigger />
            </ToastProvider>
        )

        fireEvent.click(screen.getByText('Show Success'))
        fireEvent.click(screen.getByText('Show Error'))

        expect(screen.getByText('Success message')).toBeInTheDocument()
        expect(screen.getByText('Error message')).toBeInTheDocument()
    })

    it('throws when useToast is used outside provider', () => {
        // Suppress console.error for this test
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

        function BrokenComponent() {
            useToast()
            return null
        }

        expect(() => render(<BrokenComponent />)).toThrow('useToast must be inside ToastProvider')
        consoleSpy.mockRestore()
    })
})
