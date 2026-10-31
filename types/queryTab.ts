import type { QueryResult } from './database'

/** One open editor. A table or saved query gets its own tab instead of replacing another. */
export interface QueryTab {
  id: string
  connectionId: string
  title: string
  queryText: string
  result: QueryResult | null
  savedId: string | null
  tableKey: string | null
  pinned: boolean
}

export interface QueryTabDraft {
  connectionId: string
  title: string
  queryText: string
  savedId?: string | null
  tableKey?: string | null
}
