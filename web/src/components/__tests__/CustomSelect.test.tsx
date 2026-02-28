import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CustomSelect } from '../CustomSelect'

describe('CustomSelect', () => {
    const options = [
        { value: 'a', label: 'Option A' },
        { value: 'b', label: 'Option B' },
        { value: 'c', label: 'Option C' },
    ]

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('renders with selected value label', () => {
        render(<CustomSelect options={options} value="b" onChange={() => { }} />)
        expect(screen.getByText('Option B')).toBeInTheDocument()
    })

    it('opens dropdown on click', () => {
        render(<CustomSelect options={options} value="a" onChange={() => { }} />)

        fireEvent.click(screen.getByRole('button'))

        expect(screen.getByRole('listbox')).toBeInTheDocument()
        expect(screen.getAllByRole('option')).toHaveLength(3)
    })

    it('calls onChange when option is selected', () => {
        const onChange = vi.fn()
        render(<CustomSelect options={options} value="a" onChange={onChange} />)

        fireEvent.click(screen.getByRole('button'))
        fireEvent.click(screen.getByText('Option C'))

        expect(onChange).toHaveBeenCalledWith('c')
    })

    it('closes dropdown after selection', () => {
        render(<CustomSelect options={options} value="a" onChange={() => { }} />)

        fireEvent.click(screen.getByRole('button'))
        expect(screen.getByRole('listbox')).toBeInTheDocument()

        fireEvent.click(screen.getByText('Option B'))
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    it('closes dropdown on outside click', () => {
        render(
            <div>
                <CustomSelect options={options} value="a" onChange={() => { }} />
                <button data-testid="outside">Outside</button>
            </div>
        )

        fireEvent.click(screen.getByRole('button', { name: /option a/i }))
        expect(screen.getByRole('listbox')).toBeInTheDocument()

        fireEvent.mouseDown(screen.getByTestId('outside'))
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    it('marks active option', () => {
        render(<CustomSelect options={options} value="b" onChange={() => { }} />)

        fireEvent.click(screen.getByRole('button'))
        const activeOption = screen.getByRole('option', { selected: true })
        expect(activeOption).toHaveTextContent('Option B')
    })

    it('renders in sm size', () => {
        const { container } = render(<CustomSelect options={options} value="a" onChange={() => { }} size="sm" />)
        expect(container.querySelector('.custom-select--sm')).toBeInTheDocument()
    })

    it('displays fallback when value not in options', () => {
        render(<CustomSelect options={options} value="unknown" onChange={() => { }} />)
        expect(screen.getByText('unknown')).toBeInTheDocument()
    })

    it('toggles dropdown on repeated clicks', () => {
        render(<CustomSelect options={options} value="a" onChange={() => { }} />)

        // Open
        fireEvent.click(screen.getByRole('button'))
        expect(screen.getByRole('listbox')).toBeInTheDocument()

        // Close
        fireEvent.click(screen.getByRole('button'))
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })
})
