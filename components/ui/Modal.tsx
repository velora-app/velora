'use client'

import { ReactNode } from 'react'
import { X } from 'lucide-react'
import Button from './Button'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  icon?: ReactNode
  children: ReactNode
  /** max width: sm=lg, md=2xl, lg=4xl */
  size?: 'sm' | 'md' | 'lg'
  /** if true, panel scrolls when content overflows */
  scrollable?: boolean
}

const sizeClasses = {
  sm: 'max-w-lg',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
}

export default function Modal({
  open,
  onClose,
  title,
  icon,
  children,
  size = 'md',
  scrollable = true,
}: ModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className={`flex w-full max-h-[90vh] flex-col rounded-xl border border-[var(--border)] bg-white shadow-2xl ${sizeClasses[size]} ${
          scrollable ? 'max-h-[90vh] overflow-hidden' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || icon) && (
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--border)] shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              {icon}
              {title && (
                <h2 id="modal-title" className="text-lg sm:text-xl font-semibold text-slate-900">
                  {title}
                </h2>
              )}
            </div>
            <Button type="button" variant="icon" onClick={onClose} aria-label="Close">
              <X size={20} />
            </Button>
          </div>
        )}
        <div className={scrollable ? 'overflow-y-auto flex-1' : ''}>{children}</div>
      </div>
    </div>
  )
}
