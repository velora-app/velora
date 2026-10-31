'use client'

import { DatabaseConnection } from '@/types'
import { Button } from '@/components'

interface EditorToolbarProps {
  variant: 'saved' | 'main'
  title?: string
  currentSavedName?: string | null
  activeConnection: DatabaseConnection | null
  onSave: () => void
  onRun: () => void
  isExecuting: boolean
  canSave: boolean
  canRun: boolean
  toolbarClassName?: string
  leftContent?: React.ReactNode
}

export default function EditorToolbar({
  variant,
  title = 'Query Editor',
  currentSavedName,
  activeConnection,
  onSave,
  onRun,
  isExecuting,
  canSave,
  canRun,
  toolbarClassName = 'px-4 py-3 bg-white border-b border-[var(--border)]',
  leftContent,
}: EditorToolbarProps) {
  const label =
    variant === 'saved'
      ? currentSavedName
        ? `Editing: ${currentSavedName}`
        : 'Saved query'
      : title

  return (
    <div className={`flex min-w-0 flex-wrap items-center justify-between gap-2 ${toolbarClassName}`}>
      <div className="flex min-w-0 items-center gap-3">
        {leftContent ?? <div className="text-sm text-slate-700">{label}</div>}
        {activeConnection && (
          <span className="max-w-[12rem] truncate rounded border border-rose-100 bg-rose-50 px-2 py-1 text-xs text-rose-700">
            {activeConnection.name}
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="secondary" onClick={onSave} disabled={!canSave}>
          Save query
        </Button>
        <Button
          variant="primary"
          onClick={onRun}
          disabled={!canRun && !isExecuting}
          loading={isExecuting}
          loadingLabel="Running"
        >
          Run ⌘↵
        </Button>
      </div>
    </div>
  )
}
