import { describe, it, expect } from 'vitest'
import {
  applyConnectionSave,
  queriesForConnection,
  saveNamedQuery,
  loadConnections,
  loadSavedQueries,
  saveConnections,
  saveSavedQueries,
  loadActiveConnectionId,
  saveActiveConnectionId,
} from '@/lib'
import type { DatabaseConnection, SavedQuery } from '@/types'

describe('storage (node env)', () => {
  it('loadConnections returns empty array when window is undefined', () => {
    expect(loadConnections()).toEqual([])
  })

  it('loadSavedQueries returns empty array when window is undefined', () => {
    expect(loadSavedQueries()).toEqual([])
  })

  it('loadActiveConnectionId returns null when window is undefined', () => {
    expect(loadActiveConnectionId()).toBeNull()
  })

  it('saveConnections does not throw when given valid array', () => {
    expect(() =>
      saveConnections([
        {
          id: 'c1',
          name: 'Test',
          type: 'postgresql',
          host: 'localhost',
          port: 5432,
          database: 'db',
          username: '',
          password: '',
        },
      ])
    ).not.toThrow()
  })

  it('saveSavedQueries does not throw when given valid array', () => {
    expect(() =>
      saveSavedQueries([
        { id: 'q1', name: 'Q', query: 'SELECT 1', createdAt: Date.now() },
      ])
    ).not.toThrow()
  })

  const existing: DatabaseConnection = {
    id: 'c1',
    name: 'Old',
    type: 'postgresql',
    host: 'localhost',
    port: 5432,
    database: 'db',
    username: 'u',
    password: 'p',
  }

  const linkedQuery: SavedQuery = {
    id: 'q1',
    name: 'Q',
    query: 'SELECT 1',
    connectionId: 'c1',
    connectionName: 'Old',
    createdAt: 1,
  }

  it('appends a new connection and makes it active', () => {
    const queries = [linkedQuery]
    const created: DatabaseConnection = { ...existing, id: 'c2', name: 'New' }
    const result = applyConnectionSave([existing], queries, created, 'c1')
    expect(result.created).toBe(true)
    expect(result.connections).toEqual([existing, created])
    expect(result.activeConnectionId).toBe('c2')
    expect(result.savedQueries).toBe(queries)
  })

  it('replaces a connection and renames saved queries that use it', () => {
    const edited: DatabaseConnection = { ...existing, name: 'Renamed', host: 'db.example' }
    const result = applyConnectionSave([existing], [linkedQuery], edited, 'c1')
    expect(result.created).toBe(false)
    expect(result.connections).toEqual([edited])
    expect(result.savedQueries[0]?.connectionName).toBe('Renamed')
    expect(result.activeConnectionId).toBe('c1')
  })

  it('keeps the active connection when editing a different one', () => {
    const other: DatabaseConnection = { ...existing, id: 'c2', name: 'Other' }
    const edited: DatabaseConnection = { ...other, host: '10.0.0.2' }
    const result = applyConnectionSave([existing, other], [linkedQuery], edited, 'c1')
    expect(result.activeConnectionId).toBe('c1')
    expect(result.connections[1]?.host).toBe('10.0.0.2')
    expect(result.savedQueries).toEqual([linkedQuery])
  })

  it('keeps a saved query on its own connection', () => {
    const other: SavedQuery = { ...linkedQuery, id: 'q2', connectionId: 'c2', connectionName: 'Other' }
    expect(queriesForConnection([linkedQuery, other], 'c1')).toEqual([linkedQuery])
    expect(queriesForConnection([linkedQuery, other], 'c2')).toEqual([other])
  })

  it('saves a named query on one connection and does not move another connection’s query', () => {
    const other: SavedQuery = {
      ...linkedQuery,
      id: 'q2',
      name: 'Elsewhere',
      connectionId: 'c2',
      connectionName: 'Other',
    }
    const created = saveNamedQuery(
      [linkedQuery, other],
      {
        name: '  Morning check  ',
        query: 'SELECT 2',
        connectionId: 'c1',
        connectionName: 'Old',
        existingId: 'q2',
        now: 50,
      },
      200
    )
    expect(created.savedName).toBe('Morning check')
    expect(created.savedId).toBe('sq-50')
    expect(created.queries[0]).toMatchObject({
      name: 'Morning check',
      connectionId: 'c1',
      query: 'SELECT 2',
    })
    expect(created.queries.find((query) => query.id === 'q2')?.connectionId).toBe('c2')

    const renamed = saveNamedQuery(
      created.queries,
      {
        name: 'Morning check renamed',
        query: 'SELECT 3',
        connectionId: 'c1',
        connectionName: 'Old',
        existingId: created.savedId,
        now: 60,
      },
      200
    )
    expect(renamed.savedId).toBe(created.savedId)
    expect(renamed.queries.find((query) => query.id === created.savedId)).toMatchObject({
      name: 'Morning check renamed',
      query: 'SELECT 3',
      connectionId: 'c1',
    })
  })

  it('saveActiveConnectionId does not throw', () => {
    expect(() => saveActiveConnectionId('conn-1')).not.toThrow()
    expect(() => saveActiveConnectionId(null)).not.toThrow()
  })
})
