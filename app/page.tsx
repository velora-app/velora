'use client'

import type { DatabaseConnection } from '@/types'
import {
  Sidebar,
  SchemaPanel,
  ConnectionModal,
  ConfigImportModal,
  SavedQueriesDrawer,
  SaveQueryModal,
  HomeHero,
  AppHeader,
  Drawer,
  QueryWorkspace,
  ErrorBoundary,
} from '@/components'
import { useWorkspace } from '@/application'
import { DRAWER_WIDTH } from '@/lib'

export default function Home() {
  const w = useWorkspace()

  const queryWorkspaceProps = {
    tabs: w.queryTabs,
    activeTabId: w.activeTabId,
    onSelectTab: w.selectTab,
    onCloseTab: w.closeTab,
    onTogglePin: w.togglePinTab,
    queryText: w.queryText,
    setQueryText: w.setQueryText,
    queryResult: w.queryResult,
    activeConnection: w.activeConnection,
    isExecuting: w.isExecuting,
    onExecute: w.handleExecuteQuery,
    onSave: w.openSaveQueryModal,
  }

  const mainContent = !w.showWorkspace ? (
    <div className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-auto px-4 py-6 sm:px-6">
      <div className="floating-bg">
        <div className="floating-blob blob-1" />
        <div className="floating-blob blob-2" />
        <div className="floating-blob blob-3" />
      </div>
      <HomeHero
        connections={w.connections}
        onNewConnection={w.openConnectionModal}
        onImportConfig={w.openConfigModal}
        onSelectConnection={w.updateActiveConnection}
        onEditConnection={w.openEditConnection}
      />
    </div>
  ) : (
    <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden bg-white/70">
      {w.activeConnection ? (
        <SchemaPanel
          connection={w.activeConnection}
          tables={w.schemaTables}
          isLoading={w.isSchemaLoading}
          error={w.schemaError}
          onRefresh={() => w.activeConnection && w.loadSchema(w.activeConnection)}
          onSelect={w.handleSelectTable}
          onRun={w.handleSelectTable}
        />
      ) : null}
      <QueryWorkspace
        {...queryWorkspaceProps}
        currentSavedName={w.currentSavedName}
        toolbarLeft={<span className="truncate text-sm text-slate-700">{w.currentSavedName || 'Query Editor'}</span>}
      />
    </div>
  )

  return (
    <ErrorBoundary>
      <div className="flex h-screen min-h-0 min-w-0 overflow-hidden text-slate-900" style={{ background: 'var(--background)' }}>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <AppHeader
            activeConnection={w.activeConnection}
            connections={w.connections}
            hasConnectionsList={w.hasConnectionsList}
            onSelectConnection={w.selectConnectionById}
            onGoHome={w.handleGoHome}
            onOpenConnections={w.openConnectionsDrawer}
            onOpenSaved={w.openSavedDrawer}
            showWorkspaceActions={w.showWorkspace}
            onNewQuery={w.handleNewBlankQuery}
            onNewConnection={w.openConnectionModal}
            onImportConfig={w.openConfigModal}
          />

        {mainContent}
      </div>

      <Drawer
        open={w.isConnectionsDrawerOpen}
        onClose={w.closeConnectionsDrawer}
        title="Connections"
        side="right"
        width={DRAWER_WIDTH}
        overlayLabel="Close connections"
      >
        <Sidebar
          connections={w.connections}
          activeConnection={w.activeConnection}
          onSelectConnection={(conn: DatabaseConnection) => {
            w.updateActiveConnection(conn)
            w.closeConnectionsDrawer()
          }}
          onEditConnection={w.openEditConnection}
          onNewConnection={() => {
            w.closeConnectionsDrawer()
            w.openConnectionModal()
          }}
        />
      </Drawer>

      {w.isSavedDrawerOpen && (
        <SavedQueriesDrawer
          open={w.isSavedDrawerOpen}
          onClose={w.closeSavedDrawer}
          queries={w.savedQueriesForActive}
          connections={w.connections}
          activeConnection={w.activeConnection}
          onSelectConnection={w.selectConnectionById}
          onLoad={w.handleLoadSaved}
          onDelete={w.handleDeleteSaved}
          onRename={w.handleRenameSaved}
          onNewBlank={w.handleNewBlankQuery}
        />
      )}

      {w.isConnectionModalOpen && (
        <ConnectionModal
          connection={w.connectionBeingEdited}
          onClose={w.closeConnectionModal}
          onSave={w.handleSaveConnection}
        />
      )}

      <SaveQueryModal
        open={w.isSaveQueryModalOpen}
        onClose={w.closeSaveQueryModal}
        onSave={w.handleSaveNamedQuery}
        connectionName={w.activeConnection?.name ?? ''}
        initialName={w.saveQueryInitialName}
      />

      {w.isConfigModalOpen && (
        <ConfigImportModal
          onClose={w.closeConfigModal}
          onImport={(connection: DatabaseConnection) => {
            w.handleSaveConnection(connection)
            w.closeConfigModal()
          }}
        />
      )}
      </div>
    </ErrorBoundary>
  )
}
