'use client'

import Image from 'next/image'
import { DatabaseConnection } from '@/types'
import { Select, Button } from '@/components'

type ButtonVariant = 'primary' | 'secondary'

interface AppHeaderProps {
  activeConnection: DatabaseConnection | null
  connections: DatabaseConnection[]
  hasConnectionsList: boolean
  onSelectConnection: (connectionId: string) => void
  onGoHome: () => void
  onOpenConnections: () => void
  onOpenSaved: () => void
  showWorkspaceActions: boolean
  onNewQuery: () => void
  onNewConnection: () => void
  onImportConfig: () => void
}

type HeaderActionId = 'connections' | 'saved' | 'newQuery' | 'newConnection' | 'importConfig'

const HEADER_ACTIONS: { id: HeaderActionId; label: string; variant: ButtonVariant }[] = [
  { id: 'connections', label: 'Connections', variant: 'secondary' },
  { id: 'saved', label: 'Saved queries', variant: 'secondary' },
  { id: 'newQuery', label: 'New query', variant: 'primary' },
  { id: 'newConnection', label: 'New Connection', variant: 'primary' },
  { id: 'importConfig', label: 'Import config', variant: 'secondary' },
]

export default function AppHeader({
  activeConnection,
  connections,
  hasConnectionsList,
  onSelectConnection,
  onGoHome,
  onOpenConnections,
  onOpenSaved,
  showWorkspaceActions,
  onNewQuery,
  onNewConnection,
  onImportConfig,
}: AppHeaderProps) {
  const handlers: Record<HeaderActionId, () => void> = {
    connections: onOpenConnections,
    saved: onOpenSaved,
    newQuery: onNewQuery,
    newConnection: onNewConnection,
    importConfig: onImportConfig,
  }

  return (
    <div className="app-header flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-[var(--border)] bg-white/95 py-2 pr-4 backdrop-blur-sm shadow-sm">
      <div className="flex min-w-0 shrink-0 items-center gap-3 text-sm text-slate-600">
        <Button
          variant="ghost"
          onClick={onGoHome}
          className="text-slate-900 font-semibold hover:text-rose-600 hover:bg-transparent"
          title="Go to home"
        >
          <Image src="/assets/main-logo-icon.svg" alt="Velora" width={24} height={24} />
          Velora
        </Button>
        {/* {activeConnection ? (
          <div className="flex items-center gap-2">
            <span className="text-slate-400">•</span>
            <span className="text-slate-800 font-medium">{activeConnection.name}</span>
            <span className="text-slate-500">
              {activeConnection.host}:{activeConnection.port}
            </span>
          </div>
        ) : (
          <span className="text-slate-500">No connection selected</span>
        )}
        {hasConnectionsList && (
          <div className="ml-2 min-w-[140px] [&_select]:py-1 [&_select]:text-sm">
            <Select
              options={[
                { value: '', label: 'Switch connection...' },
                ...connections.map((c) => ({ value: c.id, label: `${c.name} (${c.type})` })),
              ]}
              value={activeConnection?.id ?? ''}
              onChange={(e) => onSelectConnection(e.target.value)}
            />
          </div>
        )} */}
      </div>

      <nav className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
        {HEADER_ACTIONS.filter((action) => {
          if (!showWorkspaceActions && (action.id === 'saved' || action.id === 'newQuery')) return false
          return true
        }).map(({ id, label, variant }) => (
          <Button key={id} variant={variant} onClick={handlers[id]} className="shrink-0 whitespace-nowrap">
            {label}
          </Button>
        ))}
      </nav>
    </div>
  )
}
