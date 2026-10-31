'use client'

import { useMemo, useState } from 'react'
import { Database, RefreshCw, Table as TableIcon, Eye, KeyRound, FolderTree } from 'lucide-react'
import { DatabaseConnection, DatabaseTable } from '@/types'
import { Input, Button } from '@/components'

interface SchemaPanelProps {
  connection: DatabaseConnection | null
  tables: DatabaseTable[]
  isLoading: boolean
  error: string | null
  onRefresh: () => void
  onSelect: (table: DatabaseTable) => void
  onRun?: (table: DatabaseTable) => void
}

export default function SchemaPanel({
  connection,
  tables,
  isLoading,
  error,
  onRefresh,
  onSelect,
  onRun,
}: SchemaPanelProps) {
  const [filter, setFilter] = useState('')

  const filteredTables = useMemo(() => {
    if (!filter.trim()) return tables
    const text = filter.toLowerCase()
    return tables.filter((t) => `${t.schema || ''}.${t.name}`.toLowerCase().includes(text))
  }, [filter, tables])

  return (
    <div className="flex w-[min(18rem,42vw)] min-w-[9.5rem] shrink-0 flex-col border-r border-[var(--border)] bg-white">
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderTree size={16} className="text-rose-500" />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-slate-900">Objects</span>
            <span className="text-xs text-slate-600 truncate max-w-[140px]">
              {connection ? connection.database : 'No database selected'}
            </span>
          </div>
        </div>
        <Button
          variant="icon"
          onClick={onRefresh}
          disabled={!connection || isLoading}
          className="text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          title="Refresh schema"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </Button>
      </div>

      <div className="px-4 py-2 border-b border-[var(--border)]">
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter tables..."
          disabled={!connection}
          className="[&_input]:bg-[var(--surface)] [&_input]:text-sm [&_input]:focus:ring-rose-400"
        />
      </div>

      {!connection ? (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm px-4 text-center">
          Choose a connection to explore tables
        </div>
      ) : error ? (
        <div className="flex-1 px-4 py-3 text-sm text-red-400">{error}</div>
      ) : isLoading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
          Loading schema...
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm px-4 text-center">
          No tables or collections found
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <ul className="divide-y divide-[var(--border)]/80">
            {filteredTables.map((table) => (
              <li
                key={`${table.schema || 'default'}-${table.name}`}
                className="px-4 py-2 hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => onSelect(table)}
                onDoubleClick={() => onRun?.(table)}
              >
                <div className="flex min-w-0 items-center gap-2 text-sm text-slate-800">
                  <ObjectIcon type={table.type} name={`${table.schema || ''}.${table.name}`} />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-medium text-slate-900">{table.name}</span>
                    <span className="truncate text-xs text-slate-500">
                      {table.schema || labelForType(table.type)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="px-4 py-2 border-t border-[var(--border)] text-[11px] text-slate-500">
            Single-click inserts a SELECT, double-click runs it.
          </div>
        </div>
      )}
    </div>
  )
}

/** Distinct from the pink action buttons, and stable for the same object name. */
const OBJECT_COLORS = [
  'text-teal-600',
  'text-violet-600',
  'text-sky-600',
  'text-indigo-600',
  'text-emerald-600',
  'text-cyan-600',
  'text-blue-600',
  'text-purple-600',
]

function colorForObject(name: string): string {
  let hash = 0
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) >>> 0
  }
  return OBJECT_COLORS[hash % OBJECT_COLORS.length]
}

function ObjectIcon({ type, name }: { type: DatabaseTable['type']; name: string }) {
  const className = `${colorForObject(name)} shrink-0`
  switch (type) {
    case 'view':
      return <Eye size={16} className={className} />
    case 'collection':
      return <Database size={16} className={className} />
    case 'key':
      return <KeyRound size={16} className={className} />
    default:
      return <TableIcon size={16} className={className} />
  }
}

function labelForType(type: DatabaseTable['type']) {
  switch (type) {
    case 'collection':
      return 'collection'
    case 'key':
      return 'key'
    case 'view':
      return 'view'
    default:
      return 'table'
  }
}
