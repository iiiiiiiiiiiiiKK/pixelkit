import { useId, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { SpinnerIcon } from './Icons'

/** Small, consistent building blocks shared by every screen. */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : ''
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${sizeClass} ${className}`.trim()}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <SpinnerIcon size={16} /> : icon}
      {children}
    </button>
  )
}

export function IconButton({
  label,
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return (
    <button type="button" className={`icon-btn ${className}`.trim()} aria-label={label} title={label} {...props}>
      {children}
    </button>
  )
}

interface FieldProps {
  label: string
  hint?: string
  error?: string
  htmlFor?: string
  children: ReactNode
  trailing?: ReactNode
}

export function Field({ label, hint, error, htmlFor, children, trailing }: FieldProps) {
  const hintId = useId()
  const errorId = useId()
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined
  return (
    <div>
      <div className="field-label">
        <label htmlFor={htmlFor}>{label}</label>
        {trailing}
      </div>
      <div aria-describedby={describedBy}>{children}</div>
      {hint && !error ? (
        <p id={hintId} className="mt-1.5 text-[12.5px] leading-relaxed text-ink-mute">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="error-text" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export interface SegmentedOption<T extends string> {
  value: T
  label: string
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  disabled = false,
}: {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
  disabled?: boolean
}) {
  return (
    <div className="segmented" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          disabled={disabled}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
  id,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  hint?: string
  id?: string
}) {
  const generated = useId()
  const inputId = id ?? generated
  return (
    <div>
      <label className="switch" htmlFor={inputId}>
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="switch-track" aria-hidden="true" />
        <span>{label}</span>
      </label>
      {hint ? <p className="mt-1.5 pl-[48px] text-[12.5px] leading-relaxed text-ink-mute">{hint}</p> : null}
    </div>
  )
}

export function Notice({
  tone = 'info',
  title,
  children,
}: {
  tone?: 'info' | 'warn' | 'error'
  title?: string
  children: ReactNode
}) {
  const styles =
    tone === 'error'
      ? 'border-danger/25 bg-danger-soft text-danger'
      : tone === 'warn'
        ? 'border-warn/25 bg-warn-soft text-warn'
        : 'border-line bg-raised text-ink-soft'
  return (
    <div className={`rounded-[10px] border px-3.5 py-3 text-[12.5px] leading-relaxed ${styles}`} role="note">
      {title ? <p className="mb-1 font-semibold">{title}</p> : null}
      {children}
    </div>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string
  title: string
  description?: string
}) {
  return (
    <div className="max-w-2xl">
      {eyebrow ? <p className="panel-title mb-3">{eyebrow}</p> : null}
      <h2 className="text-[26px] font-semibold leading-[1.2] sm:text-[32px]">{title}</h2>
      {description ? <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">{description}</p> : null}
    </div>
  )
}
