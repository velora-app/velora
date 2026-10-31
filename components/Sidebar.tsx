'use client'

import { useState } from 'react'
import { Database, Plus, Server, ChevronRight, ChevronDown, Pencil } from 'lucide-react'
import { DatabaseConnection } from '@/types'
import { Button } from '@/components'

interface SidebarProps {
  connections: DatabaseConnection[]
  activeConnection: DatabaseConnection | null
  onSelectConnection: (connection: DatabaseConnection) => void
  onEditConnection: (connection: DatabaseConnection) => void
  onNewConnection: () => void
}

export default function Sidebar({
  connections,
  activeConnection,
  onSelectConnection,
  onEditConnection,
  onNewConnection,
}: SidebarProps) {
  const [expandedConnections, setExpandedConnections] = useState<Set<string>>(new Set())

  const toggleConnection = (id: string) => {
    const newExpanded = new Set(expandedConnections)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedConnections(newExpanded)
  }

  return (
    <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col bg-[var(--panel)]">
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Connections</h2>
        </div>
        <Button variant="primary" onClick={onNewConnection} className="w-full justify-center py-2">
          <Plus size={16} />
          New Connection
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {connections.length === 0 ? (
          <div className="p-4 text-slate-600 text-sm text-center">
            No connections yet. Click &quot;New Connection&quot; to get started.
          </div>
        ) : (
          <div className="p-2">
            {connections.map((connection) => (
              <div key={connection.id} className="mb-1">
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                    activeConnection?.id === connection.id
                      ? 'bg-gradient-to-r from-indigo-50 via-fuchsia-50 to-emerald-50 text-slate-900 border border-[var(--border)]'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                  onClick={() => {
                    onSelectConnection(connection)
                    toggleConnection(connection.id)
                  }}
                >
                  {expandedConnections.has(connection.id) ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                  <Server
                    size={16}
                    className={
                      activeConnection?.id === connection.id ? 'text-emerald-500' : 'text-slate-500'
                    }
                  />
                  <span className="flex-1 truncate">{connection.name}</span>
                  <Button
                    type="button"
                    variant="icon"
                    className="text-pink-600 hover:bg-pink-50 hover:text-pink-700"
                    title="Edit connection"
                    aria-label={`Edit ${connection.name}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      onEditConnection(connection)
                    }}
                  >
                    <Pencil size={14} aria-hidden />
                  </Button>
                </div>
                {expandedConnections.has(connection.id) && (
                  <div className="ml-6 mt-1 space-y-1">
                    <div className="flex items-center gap-2 px-3 py-1 text-sm text-slate-600">
                      <Database size={14} />
                      <span>{connection.database}</span>
                    </div>
                    <div className="px-3 py-1 text-xs text-slate-500">
                      {connection.type.toUpperCase()} • {connection.host}:{connection.port}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
