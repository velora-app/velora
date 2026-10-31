'use client'

import { Pin, X } from 'lucide-react'
import type { QueryTab } from '@/types'
import { Button } from '@/components'

interface QueryTabBarProps {
  tabs: QueryTab[]
  activeTabId: string | null
  onSelect: (tabId: string) => void
  onClose: (tabId: string) => void
  onTogglePin: (tabId: string) => void
}

export default function QueryTabBar({
  tabs,
  activeTabId,
  onSelect,
  onClose,
  onTogglePin,
}: QueryTabBarProps) {
  if (tabs.length === 0) return null

  return (
    <div
      className="flex min-w-0 items-end gap-1 overflow-x-auto border-b border-[var(--border)] bg-rose-50/40 px-2 pt-2"
      role="tablist"
      aria-label="Open queries"
    >
      {tabs.map((tab) => {
        const selected = tab.id === activeTabId
        return (
          <div
            key={tab.id}
            role="tab"
            aria-selected={selected}
            className={`flex max-w-[14rem] shrink-0 items-center gap-0.5 rounded-t-lg border border-b-0 px-1 py-1 ${
              selected
                ? 'border-rose-200 bg-white text-slate-900'
                : 'border-transparent bg-white/50 text-slate-600 hover:bg-white/80'
            }`}
          >
            <Button
              type="button"
              variant="icon"
              className={tab.pinned ? 'text-pink-600 hover:bg-pink-50' : 'text-slate-400 hover:text-pink-600'}
              aria-pressed={tab.pinned}
              aria-label={tab.pinned ? `Unpin ${tab.title}` : `Pin ${tab.title}`}
              title={tab.pinned ? 'Unpin' : 'Pin'}
              onClick={() => onTogglePin(tab.id)}
            >
              <Pin size={13} aria-hidden className={tab.pinned ? 'fill-pink-600' : ''} />
            </Button>
            <button
              type="button"
              className="min-w-0 flex-1 truncate px-1 text-left text-sm"
              title={tab.title}
              onClick={() => onSelect(tab.id)}
            >
              {tab.title}
            </button>
            {tab.pinned ? null : (
              <Button
                type="button"
                variant="icon"
                className="text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                aria-label={`Close ${tab.title}`}
                title="Close"
                onClick={() => onClose(tab.id)}
              >
                <X size={13} aria-hidden />
              </Button>
            )}
          </div>
        )
      })}
    </div>
  )
}
