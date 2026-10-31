'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Play } from 'lucide-react'
import { DatabaseConnection } from '@/types'
import { Button } from '@/components'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => null,
})

/** Shape we need from Monaco editor for getModel().getValueInRange(getSelection()). */
interface MonacoEditorLike {
  getModel(): { getValueInRange(range: unknown): string } | null
  getSelection(): unknown
}

interface QueryEditorProps {
  onExecute: (query: string) => void
  isExecuting: boolean
  connection: DatabaseConnection | null
  value: string
  onChange: (value: string) => void
  onSave?: () => void
  showToolbar?: boolean
}

export default function QueryEditor({
  onExecute,
  isExecuting,
  connection,
  value,
  onChange,
  onSave,
  showToolbar = true,
}: QueryEditorProps) {
  const [monacoReady, setMonacoReady] = useState(false)
  const editorRef = useRef<MonacoEditorLike | null>(null)
  const onExecuteRef = useRef(onExecute)
  const valueRef = useRef(value)
  const isExecutingRef = useRef(isExecuting)
  const connectionRef = useRef(connection)
  onExecuteRef.current = onExecute
  valueRef.current = value
  isExecutingRef.current = isExecuting
  connectionRef.current = connection

  const handleEditorDidMount = (editor: MonacoEditorLike) => {
    editorRef.current = editor
    setMonacoReady(true)
  }

  const runQuery = () => {
    if (isExecutingRef.current || !connectionRef.current) return
    const editor = editorRef.current
    const currentValue = valueRef.current
    if (!editor) {
      onExecuteRef.current(currentValue)
      return
    }
    const model = editor.getModel()
    const selectedText = model ? model.getValueInRange(editor.getSelection()) : ''
    onExecuteRef.current(selectedText.trim() ? selectedText : currentValue)
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.repeat) return
      if (!event.metaKey && !event.ctrlKey) return
      if (event.shiftKey || event.altKey) return
      const target = event.target
      if (target instanceof Element && target.closest('[role="dialog"]')) return
      if (!connectionRef.current || isExecutingRef.current) return
      event.preventDefault()
      event.stopPropagation()
      runQuery()
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [])

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-white">
      {showToolbar && (
        <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-700">Query Editor</span>
            {connection && (
              <span className="text-xs px-2 py-1 bg-rose-50 text-rose-700 rounded border border-rose-100">
                {connection.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onSave && (
              <Button variant="secondary" onClick={onSave} disabled={!connection && !value.trim()}>
                Save query
              </Button>
            )}
            <Button
              variant="primary"
              onClick={runQuery}
              disabled={!connection}
              loading={isExecuting}
              loadingLabel="Running"
            >
              <Play size={16} />
              Run ⌘↵
            </Button>
          </div>
        </div>
      )}
      <div className="relative min-h-0 min-w-0 flex-1">
        <pre
          className={`absolute inset-0 overflow-auto whitespace-pre-wrap px-16 py-1 font-mono text-[13px] leading-[22px] text-slate-800 transition-opacity duration-150 motion-reduce:transition-none ${
            monacoReady ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
          aria-hidden={monacoReady}
        >
          {value}
        </pre>
        <div
          className={`h-full transition-opacity duration-150 motion-reduce:transition-none ${
            monacoReady ? 'opacity-100' : 'opacity-0'
          }`}
        >
        <MonacoEditor
          height="100%"
          defaultLanguage="sql"
          theme="velora-light"
          value={value}
          onChange={(val) => onChange(val || '')}
          beforeMount={(monaco) => {
            monaco.editor.defineTheme('velora-light', {
              base: 'vs',
              inherit: true,
              colors: {
                'editor.background': '#ffffff',
                'editorCursor.foreground': '#ec4899',
                'editor.lineHighlightBackground': '#fff7ed',
                'editor.selectionBackground': '#fde2f2',
                'editorLineNumber.foreground': '#94a3b8',
                'editorLineNumber.activeForeground': '#ec4899',
                'editorIndentGuide.background': '#e2e8f0',
                'editorIndentGuide.activeBackground': '#f9a8d4',
              },
              rules: [],
            })
          }}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'SFMono-Regular', Menlo, monospace",
            fontLigatures: true,
            lineHeight: 22,
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            tabSize: 2,
          }}
        />
        </div>
      </div>
      {!connection && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-slate-500 text-sm bg-gradient-to-b from-white via-transparent to-slate-100">
          Connect to a database to run queries
        </div>
      )}
    </div>
  )
}
