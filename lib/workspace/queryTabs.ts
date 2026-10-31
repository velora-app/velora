import type { QueryTab, QueryTabDraft } from '@/types'

export function createQueryTab(draft: QueryTabDraft, now = Date.now()): QueryTab {
  return {
    id: `tab-${now}-${Math.random().toString(36).slice(2, 8)}`,
    connectionId: draft.connectionId,
    title: draft.title,
    queryText: draft.queryText,
    result: null,
    savedId: draft.savedId ?? null,
    tableKey: draft.tableKey ?? null,
    pinned: false,
  }
}

export function blankQueryTitle(tabs: QueryTab[], connectionId: string): string {
  const blanks = tabs.filter(
    (tab) => tab.connectionId === connectionId && !tab.savedId && !tab.tableKey
  ).length
  return blanks === 0 ? 'Query' : `Query ${blanks + 1}`
}

/** Pinned tabs stay at the front. Order within each group is unchanged. */
export function tabsForConnection(tabs: QueryTab[], connectionId: string): QueryTab[] {
  const mine = tabs.filter((tab) => tab.connectionId === connectionId)
  return [...mine.filter((tab) => tab.pinned), ...mine.filter((tab) => !tab.pinned)]
}

function matchingOpenTab(tabs: QueryTab[], draft: QueryTabDraft): QueryTab | undefined {
  if (!draft.savedId && !draft.tableKey) return undefined
  return tabs.find(
    (tab) =>
      tab.connectionId === draft.connectionId &&
      ((draft.savedId && tab.savedId === draft.savedId) ||
        (draft.tableKey && tab.tableKey === draft.tableKey))
  )
}

export function openQueryTab(
  tabs: QueryTab[],
  draft: QueryTabDraft,
  now = Date.now()
): { tabs: QueryTab[]; activeId: string; created: boolean } {
  const existing = matchingOpenTab(tabs, draft)
  if (existing) return { tabs, activeId: existing.id, created: false }
  const tab = createQueryTab(draft, now)
  return { tabs: [...tabs, tab], activeId: tab.id, created: true }
}

export function closeQueryTab(
  tabs: QueryTab[],
  activeId: string | null,
  tabId: string
): { tabs: QueryTab[]; activeId: string | null; closed: boolean } {
  const tab = tabs.find((item) => item.id === tabId)
  if (!tab || tab.pinned) return { tabs, activeId, closed: false }
  const next = tabs.filter((item) => item.id !== tabId)
  if (activeId !== tabId) return { tabs: next, activeId, closed: true }
  const ordered = tabsForConnection(tabs, tab.connectionId)
  const index = ordered.findIndex((item) => item.id === tabId)
  const remaining = tabsForConnection(next, tab.connectionId)
  const neighbor = remaining[Math.min(index, remaining.length - 1)] ?? null
  return { tabs: next, activeId: neighbor?.id ?? null, closed: true }
}

export function toggleQueryTabPin(tabs: QueryTab[], tabId: string): QueryTab[] {
  return tabs.map((tab) => (tab.id === tabId ? { ...tab, pinned: !tab.pinned } : tab))
}

export function updateTabQuery(tabs: QueryTab[], tabId: string, queryText: string): QueryTab[] {
  return tabs.map((tab) => (tab.id === tabId ? { ...tab, queryText } : tab))
}

export function setTabResult(
  tabs: QueryTab[],
  tabId: string,
  result: QueryTab['result']
): QueryTab[] {
  return tabs.map((tab) => (tab.id === tabId ? { ...tab, result } : tab))
}

export function assignSavedTab(
  tabs: QueryTab[],
  tabId: string,
  savedId: string,
  title: string
): QueryTab[] {
  return tabs.map((tab) => (tab.id === tabId ? { ...tab, savedId, title } : tab))
}

export function renameSavedTabs(tabs: QueryTab[], savedId: string, title: string): QueryTab[] {
  return tabs.map((tab) => (tab.savedId === savedId ? { ...tab, title } : tab))
}

export function unlinkSavedTabs(tabs: QueryTab[], savedId: string): QueryTab[] {
  return tabs.map((tab) => (tab.savedId === savedId ? { ...tab, savedId: null } : tab))
}

export function adoptUnscopedTabs(tabs: QueryTab[], connectionId: string): QueryTab[] {
  return tabs.map((tab) => (tab.connectionId === '' ? { ...tab, connectionId } : tab))
}
