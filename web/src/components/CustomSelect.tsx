import { useState, useRef, useEffect, type CSSProperties } from 'react'
import { ChevronDown } from 'lucide-react'

export interface SelectOption {
    value: string
    label: string
}

interface CustomSelectProps {
    options: SelectOption[]
    value: string
    onChange: (value: string) => void
    size?: 'sm' | 'md'
    style?: CSSProperties
}

export function CustomSelect({ options, value, onChange, size = 'md', style }: CustomSelectProps) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const selectedLabel = options.find(o => o.value === value)?.label ?? value

    return (
        <div className={`custom-select custom-select--${size}`} ref={ref} style={style}>
            <button
                type="button"
                className="custom-select__trigger"
                onClick={() => setOpen(o => !o)}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span className="custom-select__label">{selectedLabel}</span>
                <ChevronDown size={size === 'sm' ? 14 : 16} className={`custom-select__chevron ${open ? 'custom-select__chevron--open' : ''}`} />
            </button>

            {open && (
                <ul className="custom-select__dropdown" role="listbox">
                    {options.map(opt => (
                        <li
                            key={opt.value}
                            role="option"
                            aria-selected={opt.value === value}
                            className={`custom-select__option ${opt.value === value ? 'custom-select__option--active' : ''}`}
                            onClick={() => { onChange(opt.value); setOpen(false) }}
                        >
                            {opt.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
