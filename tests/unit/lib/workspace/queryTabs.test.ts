import { describe, expect, it } from 'vitest'
import {
  blankQueryTitle,
  closeQueryTab,
  openQueryTab,
  tabsForConnection,
  toggleQueryTabPin,
} from '@/lib/workspace/queryTabs'
import type { QueryTabDraft } from '@/types'

const draft = (overrides: Partial<QueryTabDraft> = {}): QueryTabDraft => ({
  connectionId: 'conn-1',
  title: 'Orders',
  queryText: 'select 1',
  ...overrides,
})

describe('query tabs', () => {
  it('opens a second tab instead of replacing the first', () => {
    const first = openQueryTab([], draft({ title: 'Query', savedId: null, tableKey: null }), 1)
    const second = openQueryTab(
      first.tabs,
      draft({ title: 'Query 2', queryText: 'select 2' }),
      2
    )
    expect(second.tabs).toHaveLength(2)
    expect(second.activeId).not.toBe(first.activeId)
    expect(second.tabs[0]?.queryText).toBe('select 1')
  })

  it('focuses an existing table or saved query instead of duplicating it', () => {
    const opened = openQueryTab([], draft({ tableKey: 'public.orders' }), 1)
    const again = openQueryTab(opened.tabs, draft({ tableKey: 'public.orders', queryText: 'changed' }), 2)
    expect(again.created).toBe(false)
    expect(again.tabs).toHaveLength(1)
    expect(again.activeId).toBe(opened.activeId)
    expect(again.tabs[0]?.queryText).toBe('select 1')

    const saved = openQueryTab([], draft({ savedId: 'sq-1', tableKey: null }), 3)
    const savedAgain = openQueryTab(saved.tabs, draft({ savedId: 'sq-1', queryText: 'other' }), 4)
    expect(savedAgain.created).toBe(false)
    expect(savedAgain.activeId).toBe(saved.activeId)
  })

  it('names blank queries in order', () => {
    expect(blankQueryTitle([], 'conn-1')).toBe('Query')
    const first = openQueryTab([], draft({ title: 'Query' }), 1)
    expect(blankQueryTitle(first.tabs, 'conn-1')).toBe('Query 2')
  })

  it('closes the active tab and keeps a pinned tab', () => {
    const first = openQueryTab([], draft({ title: 'One' }), 1)
    const second = openQueryTab(first.tabs, draft({ title: 'Two', queryText: 'select 2' }), 2)
    const closed = closeQueryTab(second.tabs, second.activeId, second.activeId)
    expect(closed.closed).toBe(true)
    expect(closed.tabs).toHaveLength(1)
    expect(closed.activeId).toBe(first.activeId)

    const pinned = toggleQueryTabPin(second.tabs, second.activeId)
    const refused = closeQueryTab(pinned, second.activeId, second.activeId)
    expect(refused.closed).toBe(false)
    expect(refused.tabs).toHaveLength(2)
  })

  it('lists pinned tabs before the others for that connection only', () => {
    const first = openQueryTab([], draft({ title: 'One' }), 1)
    const second = openQueryTab(first.tabs, draft({ title: 'Two', queryText: 'select 2' }), 2)
    const other = openQueryTab(
      second.tabs,
      draft({ connectionId: 'conn-2', title: 'Other' }),
      3
    )
    const pinned = toggleQueryTabPin(other.tabs, second.activeId)
    const visible = tabsForConnection(pinned, 'conn-1')
    expect(visible.map((tab) => tab.title)).toEqual(['Two', 'One'])
    expect(tabsForConnection(pinned, 'conn-2')).toHaveLength(1)
  })
})