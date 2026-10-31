import type { DatabaseConnection, DatabaseType, SavedQuery } from '@/types'

const STORAGE_KEY = 'velora_connections'
const STORAGE_KEY_LEGACY = 'tablepuls_connections'
const SAVED_QUERIES_KEY = 'tablepuls_saved_queries'
const ACTIVE_CONNECTION_KEY = 'velora_active_connection_id'

const DB_TYPES: DatabaseType[] = ['postgresql', 'mysql', 'sqlite', 'mongodb', 'redis']

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const stored = localStorage.getItem(key)
    return stored ? (JSON.parse(stored) as T) : fallback
  } catch {
    return fallback
  }
}

function isConnectionLike(o: unknown): o is DatabaseConnection {
  return (
    typeof o === 'object' &&
    o !== null &&
    'id' in o &&
    'name' in o &&
    'type' in o &&
    'host' in o &&
    'database' in o &&
    typeof (o as DatabaseConnection).name === 'string' &&
    typeof (o as DatabaseConnection).host === 'string' &&
    typeof (o as DatabaseConnection).database === 'string' &&
    DB_TYPES.includes((o as DatabaseConnection).type)
  )
}

function normalizeConnection(o: Record<string, unknown>): DatabaseConnection {
  return {
    id: typeof o.id === 'string' ? o.id : `conn-${Date.now()}`,
    name: String(o.name ?? ''),
    type: (DB_TYPES.includes(o.type as DatabaseType) ? o.type : 'postgresql') as DatabaseType,
    host: String(o.host ?? ''),
    port: Number(o.port) || 5432,
    database: String(o.database ?? ''),
    username: String(o.username ?? ''),
    password: String(o.password ?? ''),
    ssl: o.ssl === true,
  }
}

function isSavedQueryLike(o: unknown): o is SavedQuery {
  return (
    typeof o === 'object' &&
    o !== null &&
    'id' in o &&
    'name' in o &&
    'query' in o &&
    'createdAt' in o &&
    typeof (o as SavedQuery).query === 'string' &&
    typeof (o as SavedQuery).createdAt === 'number'
  )
}

function normalizeSavedQuery(o: Record<string, unknown>): SavedQuery {
  return {
    id: typeof o.id === 'string' ? o.id : `sq-${Date.now()}`,
    name: String(o.name ?? 'Query'),
    query: String(o.query ?? ''),
    connectionId: typeof o.connectionId === 'string' ? o.connectionId : undefined,
    connectionName: typeof o.connectionName === 'string' ? o.connectionName : undefined,
    createdAt: typeof o.createdAt === 'number' ? o.createdAt : Date.now(),
  }
}

/** Queries belong to one connection. Unscoped and other-connection queries stay out of the list. */
export function queriesForConnection(queries: SavedQuery[], connectionId: string): SavedQuery[] {
  return queries.filter((query) => query.connectionId === connectionId)
}

/**
 * Save a named query on one connection.
 * An existing id is updated only when it already belongs to that connection.
 */
export function saveNamedQuery(
  queries: SavedQuery[],
  draft: {
    name: string
    query: string
    connectionId: string
    connectionName: string
    existingId?: string | null
    now?: number
  },
  limit: number
): { queries: SavedQuery[]; savedId: string; savedName: string } {
  const name = draft.name.trim()
  const now = draft.now ?? Date.now()
  const existing = draft.existingId
    ? queries.find((item) => item.id === draft.existingId && item.connectionId === draft.connectionId)
    : undefined

  if (existing) {
    return {
      savedId: existing.id,
      savedName: name,
      queries: queries
        .map((item) =>
          item.id === existing.id
            ? {
                ...item,
                name,
                query: draft.query,
                connectionId: draft.connectionId,
                connectionName: draft.connectionName,
              }
            : item
        )
        .slice(0, limit),
    }
  }

  const created: SavedQuery = {
    id: `sq-${now}`,
    name,
    query: draft.query,
    connectionId: draft.connectionId,
    connectionName: draft.connectionName,
    createdAt: now,
  }
  return {
    savedId: created.id,
    savedName: name,
    queries: [created, ...queries].slice(0, limit),
  }
}

/** Insert a new connection, or replace the one with the same id. Linked saved queries keep the new name. */
export function applyConnectionSave(
  connections: DatabaseConnection[],
  savedQueries: SavedQuery[],
  connection: DatabaseConnection,
  activeConnectionId: string | null
): {
  connections: DatabaseConnection[]
  savedQueries: SavedQuery[]
  activeConnectionId: string | null
  created: boolean
} {
  const created = connections.every((item) => item.id !== connection.id)
  const nextConnections = created
    ? [...connections, connection]
    : connections.map((item) => (item.id === connection.id ? connection : item))
  const linked = savedQueries.some((query) => query.connectionId === connection.id)
  const nextQueries = linked
    ? savedQueries.map((query) =>
        query.connectionId === connection.id ? { ...query, connectionName: connection.name } : query
      )
    : savedQueries

  return {
    connections: nextConnections,
    savedQueries: nextQueries,
    activeConnectionId: created ? connection.id : activeConnectionId,
    created,
  }
}

export function saveConnections(connections: DatabaseConnection[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(connections))
  }
}

export function loadConnections(): DatabaseConnection[] {
  if (typeof window === 'undefined') return []
  const raw = loadJson<unknown>(STORAGE_KEY, null) ?? loadJson<unknown>(STORAGE_KEY_LEGACY, null)
  if (!Array.isArray(raw)) return []
  return raw
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => (isConnectionLike(item) ? item : normalizeConnection(item)))
}

export function saveActiveConnectionId(id: string | null): void {
  if (typeof window !== 'undefined') {
    if (id) localStorage.setItem(ACTIVE_CONNECTION_KEY, id)
    else localStorage.removeItem(ACTIVE_CONNECTION_KEY)
  }
}

export function loadActiveConnectionId(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(ACTIVE_CONNECTION_KEY)
  }
  return null
}

export function saveSavedQueries(queries: SavedQuery[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SAVED_QUERIES_KEY, JSON.stringify(queries))
  }
}

export function loadSavedQueries(): SavedQuery[] {
  const raw = loadJson<unknown>(SAVED_QUERIES_KEY, [])
  if (!Array.isArray(raw)) return []
  return raw
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => (isSavedQueryLike(item) ? item : normalizeSavedQuery(item)))
}
