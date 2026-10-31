/**
 * Application layer: workspace use case.
 * Encapsulates all workspace state and handlers so the page only composes UI.
 * Depends on domain (types) and infrastructure (lib).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DatabaseConnection, DatabaseTable, QueryResult, QueryTab, SavedQuery } from '@/types'
import {
  loadConnections,
  saveConnections,
  applyConnectionSave,
  queriesForConnection,
  saveNamedQuery,
  loadSavedQueries,
  saveSavedQueries,
  loadActiveConnectionId,
  saveActiveConnectionId,
  saveTextFile,
  runQuery,
  fetchSchemaRemote,
  logger,
  SAVED_QUERIES_LIMIT,
  adoptUnscopedTabs,
  assignSavedTab,
  blankQueryTitle,
  closeQueryTab,
  openQueryTab,
  renameSavedTabs,
  setTabResult,
  tabsForConnection,
  toggleQueryTabPin,
  unlinkSavedTabs,
  updateTabQuery,
} from '@/lib'

export function useWorkspace() {
  const [connections, setConnections] = useState<DatabaseConnection[]>([])
  const [activeConnection, setActiveConnection] = useState<DatabaseConnection | null>(null)
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false)
  const [connectionBeingEdited, setConnectionBeingEdited] = useState<DatabaseConnection | null>(null)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [isConnectionsDrawerOpen, setIsConnectionsDrawerOpen] = useState(false)
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [executingTabId, setExecutingTabId] = useState<string | null>(null)
  const [queryTabs, setQueryTabs] = useState<QueryTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [editingFromSaved, setEditingFromSaved] = useState(false)
  const [schemaTables, setSchemaTables] = useState<DatabaseTable[]>([])
  const [isSchemaLoading, setIsSchemaLoading] = useState(false)
  const [schemaError, setSchemaError] = useState<string | null>(null)
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([])
  const [isHydrated, setIsHydrated] = useState(false)
  const [isSaveQueryModalOpen, setIsSaveQueryModalOpen] = useState(false)
  const tabsRef = useRef<QueryTab[]>([])
  const activeTabIdRef = useRef<string | null>(null)
  const activeConnectionRef = useRef<DatabaseConnection | null>(null)
  tabsRef.current = queryTabs
  activeTabIdRef.current = activeTabId
  activeConnectionRef.current = activeConnection

  const updateActiveConnection = useCallback((conn: DatabaseConnection | null) => {
    setActiveConnection(conn)
    saveActiveConnectionId(conn ? conn.id : null)
    if (!conn) return
    setQueryTabs((prev) => adoptUnscopedTabs(prev, conn.id))
  }, [])

  const connectionKey = activeConnection?.id ?? ''
  const visibleTabs = useMemo(
    () => tabsForConnection(queryTabs, connectionKey),
    [queryTabs, connectionKey]
  )
  const activeTab = visibleTabs.find((tab) => tab.id === activeTabId) ?? null
  const queryText = activeTab?.queryText ?? ''

  useEffect(() => {
    if (visibleTabs.some((tab) => tab.id === activeTabId)) return
    setActiveTabId(visibleTabs[0]?.id ?? null)
  }, [visibleTabs, activeTabId])

  const handleSaveConnection = useCallback(
    (connection: DatabaseConnection) => {
      const result = applyConnectionSave(
        connections,
        savedQueries,
        connection,
        activeConnection?.id ?? null
      )
      setConnections(result.connections)
      saveConnections(result.connections)
      if (result.savedQueries !== savedQueries) {
        setSavedQueries(result.savedQueries)
        saveSavedQueries(result.savedQueries)
      }
      if (result.created) {
        updateActiveConnection(connection)
        setIsConnectionsDrawerOpen(false)
      } else if (activeConnection?.id === connection.id) {
        updateActiveConnection(connection)
      }
      setConnectionBeingEdited(null)
      setIsConnectionModalOpen(false)
    },
    [connections, savedQueries, activeConnection, updateActiveConnection]
  )

  const openSaveQueryModal = useCallback(() => {
    if (!queryText.trim() || !activeConnection) return
    setIsSaveQueryModalOpen(true)
  }, [queryText, activeConnection])

  const handleSaveNamedQuery = useCallback(
    (name: string) => {
      if (!name.trim() || !queryText.trim() || !activeConnection) return
      const result = saveNamedQuery(
        savedQueries,
        {
          name,
          query: queryText,
          connectionId: activeConnection.id,
          connectionName: activeConnection.name,
          existingId: activeTab?.savedId ?? null,
        },
        SAVED_QUERIES_LIMIT
      )
      setSavedQueries(result.queries)
      saveSavedQueries(result.queries)
      const tabId = activeTabIdRef.current
      if (tabId) setQueryTabs((prev) => assignSavedTab(prev, tabId, result.savedId, result.savedName))
      setEditingFromSaved(true)
      setIsSaveQueryModalOpen(false)
    },
    [queryText, activeConnection, savedQueries, activeTab]
  )

  const handleDeleteSaved = useCallback((id: string) => {
    setSavedQueries((prev) => {
      const updated = prev.filter((q) => q.id !== id)
      saveSavedQueries(updated)
      return updated
    })
    setQueryTabs((prev) => unlinkSavedTabs(prev, id))
  }, [])

  const loadSchema = useCallback(async (connection: DatabaseConnection) => {
    setIsSchemaLoading(true)
    setSchemaError(null)
    try {
      const { tables } = await fetchSchemaRemote(connection)
      setSchemaTables(tables)
    } catch (error) {
      setSchemaTables([])
      setSchemaError(error instanceof Error ? error.message : 'Failed to load schema')
    } finally {
      setIsSchemaLoading(false)
    }
  }, [])

  useEffect(() => {
    const loadedConns = loadConnections()
    setConnections(loadedConns)
    setSavedQueries(loadSavedQueries())
    const lastId = loadActiveConnectionId()
    if (lastId) {
      const found = loadedConns.find((c) => c.id === lastId)
      if (found) setActiveConnection(found)
    }
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (activeConnection) loadSchema(activeConnection)
    else {
      setSchemaTables([])
      setSchemaError(null)
    }
  }, [activeConnection, loadSchema])

  const handleExecuteQuery = useCallback(
    async (query: string, tabId?: string) => {
      const targetId = tabId ?? activeTabIdRef.current
      if (!activeConnection || !query.trim() || !targetId) return
      setIsExecuting(true)
      setExecutingTabId(targetId)
      try {
        const result = await runQuery(activeConnection, query)
        setQueryTabs((prev) => setTabResult(prev, targetId, result))
      } catch (error) {
        logger.error('Query execution error', error)
        const failed: QueryResult = {
          columns: [],
          rows: [],
          error: error instanceof Error ? error.message : 'Unknown error',
        }
        setQueryTabs((prev) => setTabResult(prev, targetId, failed))
      } finally {
        setExecutingTabId((current) => (current === targetId ? null : current))
        setIsExecuting(false)
      }
    },
    [activeConnection]
  )

  const formatIdentifier = useCallback((value: string, type: DatabaseConnection['type']) => {
    if (!value) return ''
    switch (type) {
      case 'mysql':
        return `\`${value}\``
      case 'postgresql':
      case 'sqlite':
        return `"${value}"`
      default:
        return value
    }
  }, [])

  const buildSelectStatement = useCallback(
    (table: DatabaseTable): string => {
      if (!activeConnection) return ''
      if (activeConnection.type === 'mongodb') {
        return JSON.stringify(
          { collection: table.name, filter: {}, limit: 100, projection: {} },
          null,
          2
        )
      }
      if (activeConnection.type === 'redis') return `GET ${table.name}`
      const name = formatIdentifier(table.name, activeConnection.type)
      const schema = table.schema ? `${formatIdentifier(table.schema, activeConnection.type)}.` : ''
      return `SELECT * FROM ${schema}${name} LIMIT 100;`
    },
    [activeConnection, formatIdentifier]
  )

  const rememberTab = useCallback((tabs: QueryTab[], activeId: string) => {
    setQueryTabs(tabs)
    setActiveTabId(activeId)
  }, [])

  const handleSelectTable = useCallback(
    (table: DatabaseTable) => {
      if (!activeConnection) return
      const statement = buildSelectStatement(table)
      if (!statement) return
      const opened = openQueryTab(tabsRef.current, {
        connectionId: activeConnection.id,
        title: table.name,
        queryText: statement,
        tableKey: `${table.schema || ''}.${table.name}`,
      })
      rememberTab(opened.tabs, opened.activeId)
      setEditingFromSaved(true)
      if (opened.created) void handleExecuteQuery(statement, opened.activeId)
    },
    [activeConnection, buildSelectStatement, handleExecuteQuery, rememberTab]
  )

  const handleLoadSaved = useCallback(
    (query: SavedQuery, run?: boolean) => {
      if (!query.connectionId) return
      const conn = connections.find((item) => item.id === query.connectionId) ?? null
      if (!conn) return
      const opened = openQueryTab(tabsRef.current, {
        connectionId: conn.id,
        title: query.name,
        queryText: query.query,
        savedId: query.id,
      })
      rememberTab(opened.tabs, opened.activeId)
      setIsSavedDrawerOpen(false)
      setEditingFromSaved(true)
      updateActiveConnection(conn)
      if (run && opened.created) void handleExecuteQuery(query.query, opened.activeId)
    },
    [connections, handleExecuteQuery, rememberTab, updateActiveConnection]
  )

  const handleNewBlankQuery = useCallback(() => {
    const connectionId = activeConnectionRef.current?.id ?? ''
    const opened = openQueryTab(tabsRef.current, {
      connectionId,
      title: blankQueryTitle(tabsRef.current, connectionId),
      queryText: '',
    })
    rememberTab(opened.tabs, opened.activeId)
    setEditingFromSaved(true)
    setIsSavedDrawerOpen(false)
  }, [rememberTab])

  const handleExportSaved = useCallback(async (query: SavedQuery) => {
    await saveTextFile(query.query, `${query.name || 'query'}.sql`, {
      title: 'Export query',
      filters: [{ name: 'SQL Files', extensions: ['sql'] }],
    })
  }, [])

  const handleGoHome = useCallback(() => {
    updateActiveConnection(null)
    setSchemaTables([])
    setEditingFromSaved(false)
  }, [updateActiveConnection])

  const handleRenameSaved = useCallback((id: string, name: string) => {
    setSavedQueries((prev) => {
      const updated = prev.map((q) => (q.id === id ? { ...q, name } : q))
      saveSavedQueries(updated)
      return updated
    })
    setQueryTabs((prev) => renameSavedTabs(prev, id, name))
  }, [])

  const setQueryText = useCallback((value: string) => {
    const tabId = activeTabIdRef.current
    if (!tabId) return
    setQueryTabs((prev) => updateTabQuery(prev, tabId, value))
  }, [])

  const selectTab = useCallback((tabId: string) => {
    setActiveTabId(tabId)
  }, [])

  const closeTab = useCallback((tabId: string) => {
    const result = closeQueryTab(tabsRef.current, activeTabIdRef.current, tabId)
    if (!result.closed) return
    setQueryTabs(result.tabs)
    setActiveTabId(result.activeId)
  }, [])

  const togglePinTab = useCallback((tabId: string) => {
    setQueryTabs((prev) => toggleQueryTabPin(prev, tabId))
  }, [])

  const closeActiveTab = useCallback(() => {
    if (typeof document !== 'undefined' && document.querySelector('[role="dialog"]')) return
    const connectionId = activeConnectionRef.current?.id ?? ''
    const visible = tabsForConnection(tabsRef.current, connectionId)
    const current = visible.find((tab) => tab.id === activeTabIdRef.current) ?? null
    if (!current) {
      window.electronAPI?.closeWindow?.()
      return
    }
    if (current.pinned) return
    const result = closeQueryTab(tabsRef.current, current.id, current.id)
    if (!result.closed) return
    setQueryTabs(result.tabs)
    setActiveTabId(result.activeId)
  }, [])

  useEffect(() => {
    const onCloseRequest = () => closeActiveTab()
    if (window.electronAPI?.onCloseActiveTab) {
      return window.electronAPI.onCloseActiveTab(onCloseRequest)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'w' || event.repeat) return
      if (!event.metaKey && !event.ctrlKey) return
      if (event.shiftKey || event.altKey) return
      event.preventDefault()
      onCloseRequest()
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [closeActiveTab])

  const savedQueriesForActive = useMemo(
    () => (activeConnection ? queriesForConnection(savedQueries, activeConnection.id) : []),
    [savedQueries, activeConnection]
  )
  const saveQueryInitialName = useMemo(() => {
    if (!activeTab?.savedId || !activeConnection) return ''
    const saved = savedQueries.find((query) => query.id === activeTab.savedId)
    if (!saved || saved.connectionId !== activeConnection.id) return ''
    return saved.name
  }, [activeTab, activeConnection, savedQueries])

  const hasConnection = useMemo(() => Boolean(activeConnection), [activeConnection])
  const hasConnectionsList = useMemo(
    () => isHydrated && connections.length > 0,
    [connections.length, isHydrated]
  )
  const showWorkspace = useMemo(
    () => hasConnection || editingFromSaved,
    [hasConnection, editingFromSaved]
  )

  const selectConnectionById = useCallback(
    (id: string) => {
      const conn = connections.find((c) => c.id === id) ?? null
      updateActiveConnection(conn)
    },
    [connections, updateActiveConnection]
  )

  return {
    // state
    connections,
    activeConnection,
    queryResult: activeTab?.result ?? null,
    queryText,
    setQueryText,
    queryTabs: visibleTabs,
    activeTabId: activeTab?.id ?? null,
    schemaTables,
    isSchemaLoading,
    schemaError,
    savedQueries,
    savedQueriesForActive,
    saveQueryInitialName,
    isExecuting: Boolean(activeTab && executingTabId === activeTab.id && isExecuting),
    editingFromSaved,
    currentSavedName: activeTab?.title ?? null,
    hasConnection,
    hasConnectionsList,
    showWorkspace,
    // UI state
    isConnectionModalOpen,
    setIsConnectionModalOpen,
    isConfigModalOpen,
    setIsConfigModalOpen,
    isConnectionsDrawerOpen,
    setIsConnectionsDrawerOpen,
    isSavedDrawerOpen,
    setIsSavedDrawerOpen,
    isSaveQueryModalOpen,
    // convenience (so page avoids inline lambdas)
    connectionBeingEdited,
    closeConnectionModal: () => {
      setIsConnectionModalOpen(false)
      setConnectionBeingEdited(null)
    },
    closeConfigModal: () => setIsConfigModalOpen(false),
    openConnectionModal: () => {
      setConnectionBeingEdited(null)
      setIsConnectionModalOpen(true)
    },
    openEditConnection: (connection: DatabaseConnection) => {
      setConnectionBeingEdited(connection)
      setIsConnectionModalOpen(true)
    },
    openConfigModal: () => setIsConfigModalOpen(true),
    closeConnectionsDrawer: () => setIsConnectionsDrawerOpen(false),
    openConnectionsDrawer: () => setIsConnectionsDrawerOpen(true),
    closeSavedDrawer: () => setIsSavedDrawerOpen(false),
    openSavedDrawer: () => setIsSavedDrawerOpen(true),
    closeSaveQueryModal: () => setIsSaveQueryModalOpen(false),
    openSaveQueryModal,
    selectConnectionById,
    // actions
    updateActiveConnection,
    handleSaveConnection,
    handleSaveNamedQuery,
    handleDeleteSaved,
    handleLoadSaved,
    handleNewBlankQuery,
    handleExportSaved,
    handleExecuteQuery,
    loadSchema,
    handleSelectTable,
    handleGoHome,
    handleRenameSaved,
    selectTab,
    closeTab,
    togglePinTab,
  }
}
