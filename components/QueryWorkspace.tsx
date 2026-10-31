'use client'

import { ReactNode, useState } from 'react'
import { DatabaseConnection, QueryResult, QueryTab } from '@/types'
import { QueryEditor, DataTable, EditorToolbar } from '@/components'
import QueryTabBar from './QueryTabBar'

interface QueryWorkspaceProps {
  tabs: QueryTab[]
  activeTabId: string | null
  onSelectTab: (tabId: string) => void
  onCloseTab: (tabId: string) => void
  onTogglePin: (tabId: string) => void
  toolbarLeft?: ReactNode
  toolbarClassName?: string
  toolbarVariant?: 'main' | 'saved'
  currentSavedName?: string | null
  queryText: string
  setQueryText: (value: string) => void
  queryResult: QueryResult | null
  activeConnection: DatabaseConnection | null
  isExecuting: boolean
  onExecute: (query: string) => void
  onSave: () => void
}

const canRun = (isExecuting: boolean, hasConnection: boolean, hasQuery: boolean) =>
  !isExecuting && hasConnection && hasQuery

export default function QueryWorkspace({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onTogglePin,
  toolbarLeft,
  toolbarClassName = 'px-4 py-2 bg-slate-50 border-b border-[var(--border)]',
  toolbarVariant = 'main',
  currentSavedName,
  queryText,
  setQueryText,
  queryResult,
  activeConnection,
  isExecuting,
  onExecute,
  onSave,
}: QueryWorkspaceProps) {
  const runDisabled = !canRun(isExecuting, !!activeConnection, !!queryText.trim())
  const useSavedToolbar = toolbarVariant === 'saved'
  const [rowsOnly, setRowsOnly] = useState(true)
  const [editorMounted, setEditorMounted] = useState(false)
  const editingQuery = !rowsOnly
  const toggleEditor = () => {
    setEditorMounted(true)
    setRowsOnly((open) => !open)
  }
  const rowsToggle = (
    <button
      type="button"
      onClick={toggleEditor}
      aria-pressed={editingQuery}
      aria-label={editingQuery ? 'Close query editor' : 'Edit query'}
      className={`inline-flex shrink-0 items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm font-medium shadow-sm ${
        editingQuery
          ? 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100'
          : 'border-rose-200 bg-white text-rose-700 hover:bg-rose-50'
      }`}
    >
      <EditQueryMark open={editingQuery} />
      Edit query
    </button>
  )

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <QueryTabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSelect={onSelectTab}
        onClose={onCloseTab}
        onTogglePin={onTogglePin}
      />
      {!activeTabId ? (
        <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-slate-500">
          Open a table or a saved query. Each one stays in its own tab. Close a tab with its button, or press ⌘W.
        </div>
      ) : null}
      {activeTabId ? (
        <>
          <div
            className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${
              editingQuery ? '[grid-template-rows:1fr]' : '[grid-template-rows:0fr]'
            }`}
          >
            <div className="min-h-0 overflow-hidden">
              {editorMounted ? (
                <div className="flex h-[min(38vh,260px)] min-h-[200px] flex-col border-b border-[var(--border)]">
                  <EditorToolbar
                    variant={toolbarVariant}
                    title="Query Editor"
                    currentSavedName={currentSavedName}
                    activeConnection={activeConnection}
                    onSave={onSave}
                    onRun={() => onExecute(queryText)}
                    isExecuting={isExecuting}
                    canSave={!!queryText.trim() && !!activeConnection}
                    canRun={!runDisabled}
                    toolbarClassName={toolbarClassName}
                    leftContent={useSavedToolbar ? undefined : toolbarLeft}
                  />
                  <QueryEditor
                    key={activeTabId}
                    onExecute={onExecute}
                    isExecuting={isExecuting}
                    connection={activeConnection}
                    value={queryText}
                    onChange={setQueryText}
                    onSave={onSave}
                    showToolbar={false}
                  />
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <DataTable
              key={activeTabId}
              result={queryResult}
              isLoading={isExecuting && !queryResult}
              headerAction={rowsToggle}
            />
          </div>
        </>
      ) : null}
    </div>
  )
}

function EditQueryMark({ open }: { open: boolean }) {
  return (
    <span className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full bg-rose-100 text-rose-600">
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        aria-hidden
        className={`transition-transform duration-200 ease-out motion-reduce:transition-none ${
          open ? 'rotate-180' : ''
        }`}
      >
        <path
          d="M3.25 8.75 7 5l3.75 3.75"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}
