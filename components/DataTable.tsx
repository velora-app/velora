'use client'

import { useState, useCallback, type ReactNode } from 'react'
import { QueryResult } from '@/types'
import { AlertCircle, CheckCircle2, Download } from 'lucide-react'
import { Button } from '@/components'
import { saveTextFile, buildCsv, buildJsonFromRows } from '@/lib'

interface DataTableProps {
  result: QueryResult | null
  headerAction?: ReactNode
  isLoading?: boolean
}

const TOAST_DURATION_MS = 3500

const EXPORT_FORMATS: { format: 'csv' | 'json' | 'xlsx'; label: string }[] = [
  { format: 'csv', label: 'CSV' },
  { format: 'json', label: 'JSON' },
  { format: 'xlsx', label: 'Excel' },
]

function sortRows(
  rows: QueryResult['rows'],
  sortColumn: number | null,
  sortDirection: 'asc' | 'desc'
): QueryResult['rows'] {
  return [...rows].sort((a, b) => {
    if (sortColumn === null) return 0
    const aVal = a[sortColumn]
    const bVal = b[sortColumn]
    if (aVal === null || aVal === undefined) return 1
    if (bVal === null || bVal === undefined) return -1
    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    return sortDirection === 'asc' ? comparison : -comparison
  })
}

export default function DataTable({ result, headerAction, isLoading = false }: DataTableProps) {
  const [sortColumn, setSortColumn] = useState<number | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [exportToast, setExportToast] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const showExportFeedback = useCallback((type: 'success' | 'error', message: string) => {
    setExportToast({ type, message })
    setTimeout(() => setExportToast(null), TOAST_DURATION_MS)
  }, [])

  const report = useCallback(
    (ok: boolean, err?: string) => {
      showExportFeedback(
        ok ? 'success' : 'error',
        ok ? 'File exported successfully' : (err ?? 'Export failed')
      )
    },
    [showExportFeedback]
  )

  const handleExport = useCallback(
    async (format: 'csv' | 'json' | 'xlsx') => {
      if (!result || result.error || result.columns.length === 0) return
      const sortedRows = sortRows(result.rows, sortColumn, sortDirection)
      if (format === 'csv') {
        const res = await saveTextFile(buildCsv(result.columns, sortedRows), 'query_result.csv', {
          title: 'Export to CSV',
          mimeType: 'text/csv',
          filters: [{ name: 'CSV Files', extensions: ['csv'] }],
        })
        report(res.success, res.error)
        return
      }
      if (format === 'json') {
        const res = await saveTextFile(
          buildJsonFromRows(result.columns, sortedRows),
          'query_result.json',
          {
            title: 'Export to JSON',
            mimeType: 'application/json',
            filters: [{ name: 'JSON Files', extensions: ['json'] }],
          }
        )
        report(res.success, res.error)
        return
      }
      const data = sortedRows.map((row) => {
        const obj: Record<string, unknown> = {}
        result.columns.forEach((col, idx) => {
          obj[col] = row[idx]
        })
        return obj
      })
      try {
        if (typeof window !== 'undefined' && window.electronAPI) {
          const exportResult = await window.electronAPI.exportExcel(data, 'query_result.xlsx')
          report(!!exportResult.success, exportResult.success ? undefined : exportResult.error)
        } else {
          try {
            const XLSX = require('xlsx')
            const ws = XLSX.utils.json_to_sheet(data)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
            XLSX.writeFile(wb, 'query_result.xlsx')
            report(true)
          } catch {
            report(false, 'Excel export requires Electron. Use CSV or JSON in browser.')
          }
        }
      } catch (error) {
        report(false, error instanceof Error ? error.message : 'Unknown error')
      }
    },
    [result, sortColumn, sortDirection, report]
  )

  if (!result) {
    if (isLoading) return <ReadingRows headerAction={headerAction} />
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-white">
        {headerAction ? <div className="flex justify-end px-4 py-2">{headerAction}</div> : null}
        <div className="flex flex-1 items-center justify-center text-slate-500">
          <div className="text-center">
            <p className="mb-2 text-lg text-slate-700">No query results</p>
            <p className="text-sm">Execute a query to see results here</p>
          </div>
        </div>
      </div>
    )
  }

  if (result.error) {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-white">
        {headerAction ? <div className="flex justify-end px-4 py-2">{headerAction}</div> : null}
        <div className="flex flex-1 items-center justify-center">
          <div className="max-w-2xl rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-red-600">
              <AlertCircle size={20} />
              <span className="font-semibold">Query Error</span>
            </div>
            <p className="text-sm text-red-700">{result.error}</p>
          </div>
        </div>
      </div>
    )
  }

  const handleSort = (columnIndex: number) => {
    if (sortColumn === columnIndex) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnIndex)
      setSortDirection('asc')
    }
  }

  const sortedRows = sortRows(result.rows, sortColumn, sortDirection)

  return (
    <div className="rows-arrive relative flex flex-1 flex-col overflow-hidden bg-white">
      {exportToast && (
        <div
          className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-lg shadow-lg text-sm font-medium ${
            exportToast.type === 'success'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}
          role="status"
        >
          {exportToast.message}
        </div>
      )}
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] bg-slate-50 px-4 py-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 size={16} />
            <span>Query executed successfully</span>
          </div>
          {result.rowCount !== undefined && (
            <span className="text-slate-600">
              {result.rowCount.toLocaleString()} row{result.rowCount !== 1 ? 's' : ''}
            </span>
          )}
          {result.executionTime !== undefined && (
            <span className="text-slate-600">{result.executionTime}ms</span>
          )}
          {result.truncatedMessage && (
            <span className="text-amber-700 text-sm" title={result.truncatedMessage}>
              {result.truncatedMessage}
            </span>
          )}
        </div>
        {result.columns.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {headerAction}
            {EXPORT_FORMATS.map(({ format, label }) => (
              <Button key={format} variant="secondary" onClick={() => handleExport(format)}>
                <Download size={14} />
                {label}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto" style={{ overflowX: 'auto', overflowY: 'auto' }}>
        {result.columns.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            No data returned
          </div>
        ) : (
          <div className="min-w-full inline-block">
            <table className="w-full border-collapse" style={{ minWidth: 'max-content' }}>
              <thead className="bg-slate-100 sticky top-0 z-10">
                <tr>
                  {result.columns.map((column, index) => (
                    <th
                      key={index}
                      onClick={() => handleSort(index)}
                      className="px-4 py-2 text-left text-sm font-semibold text-slate-800 border-b border-[var(--border)] cursor-pointer hover:bg-rose-50 transition-colors select-none whitespace-nowrap"
                    >
                      <div className="flex items-center gap-2">
                        {column}
                        {sortColumn === index && (
                          <span className="text-xs text-slate-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="border-b border-[var(--border)] hover:bg-slate-50 transition-colors"
                  >
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="px-4 py-2 text-sm text-slate-900 whitespace-nowrap"
                        title={String(cell ?? '')}
                      >
                        {cell === null || cell === undefined ? (
                          <span className="text-slate-500 italic">NULL</span>
                        ) : typeof cell === 'object' ? (
                          <span className="max-w-md truncate block">{JSON.stringify(cell)}</span>
                        ) : (
                          <span className="max-w-md truncate block">{String(cell)}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

const SKELETON_WIDTHS = ['42%', '68%', '36%', '54%', '28%']

function ReadingRows({ headerAction }: { headerAction?: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white" aria-busy="true" aria-live="polite">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] bg-slate-50 px-4 py-2">
        <p className="text-sm text-rose-700">Reading rows</p>
        {headerAction}
      </div>
      <div className="flex-1 space-y-3 overflow-hidden px-4 py-4">
        {Array.from({ length: 8 }, (_, row) => (
          <div key={row} className="flex gap-3">
            {SKELETON_WIDTHS.map((width, column) => (
              <div
                key={column}
                className="row-shimmer h-3.5 rounded-full"
                style={{ width, animationDelay: `${(row + column) * 70}ms` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
