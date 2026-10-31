'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

const PRIMARY_GRADIENT =
  'bg-gradient-to-r from-rose-500 via-pink-500 to-pink-400 hover:brightness-110'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'icon'
  | 'iconPrimary'
  | 'iconDanger'
  | 'tile'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  children: ReactNode
  /** Crossfades a spinner into the label without resizing the button. */
  loading?: boolean
  loadingLabel?: string
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: `inline-flex items-center justify-center gap-2 px-4 py-1.5 ${PRIMARY_GRADIENT} text-white rounded-md text-sm shadow-sm transition-opacity duration-200`,
  secondary:
    'inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] text-slate-700 hover:border-slate-400 rounded-md bg-white shadow-sm transition-opacity duration-200 disabled:opacity-50',
  ghost:
    'inline-flex items-center gap-2 px-2 py-1.5 text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50',
  icon: 'p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors disabled:opacity-50 inline-flex items-center justify-center',
  iconPrimary: `p-1.5 rounded-md ${PRIMARY_GRADIENT} text-white inline-flex items-center justify-center`,
  iconDanger:
    'p-1.5 rounded-md bg-red-500 text-white hover:bg-red-600 inline-flex items-center justify-center',
  tile: 'relative h-full min-h-[120px] text-left rounded-2xl border border-[var(--border)] bg-white px-4 py-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-sm flex flex-col items-stretch',
}

export default function Button({
  variant = 'secondary',
  className = '',
  children,
  loading = false,
  loadingLabel,
  disabled,
  ...props
}: ButtonProps) {
  const isBusy = loading
  const isInactive = Boolean(disabled) && !isBusy
  const reserveLoadingLabel = loadingLabel !== undefined

  return (
    <button
      {...props}
      disabled={Boolean(disabled) || isBusy}
      aria-busy={isBusy || undefined}
      className={[
        variantClasses[variant],
        isInactive && variant === 'primary' ? 'opacity-60 cursor-not-allowed' : '',
        isBusy ? 'cursor-wait' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {reserveLoadingLabel ? (
        <span className="inline-grid place-items-center">
          <span
            className={`col-start-1 row-start-1 inline-flex items-center gap-2 transition-opacity duration-200 ease-out motion-reduce:transition-none ${
              isBusy ? 'opacity-0' : 'opacity-100'
            }`}
            aria-hidden={isBusy}
          >
            {children}
          </span>
          <span
            className={`col-start-1 row-start-1 inline-flex items-center gap-2 transition-opacity duration-200 ease-out motion-reduce:transition-none ${
              isBusy ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden={!isBusy}
          >
            <Loader2 size={15} className="animate-spin" aria-hidden />
            {loadingLabel}
          </span>
        </span>
      ) : (
        children
      )}
    </button>
  )
}
