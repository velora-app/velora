/**
 * Components layer: single entry point. Re-exports public components so app can import from '@/components'.
 */
export { default as Sidebar } from './Sidebar'
export { default as SchemaPanel } from './SchemaPanel'
export { default as ConnectionModal } from './ConnectionModal'
export { default as ConfigImportModal } from './ConfigImportModal'
export { default as SavedQueriesDrawer } from './SavedQueriesDrawer'
export { default as HomeHero } from './HomeHero'
export { default as AppHeader } from './AppHeader'
export { default as QueryWorkspace } from './QueryWorkspace'
export { default as QueryTabBar } from './QueryTabBar'
export { default as ErrorBoundary } from './ErrorBoundary'
export { default as DataTable } from './DataTable'
export { default as EditorToolbar } from './EditorToolbar'
export { default as QueryEditor } from './QueryEditor'
export { default as SaveQueryModal } from './SaveQueryModal'

export { default as Drawer } from './ui/Drawer'
export { default as Select } from './ui/Select'
export { default as Button } from './ui/Button'
export { default as Modal } from './ui/Modal'
export { default as Input } from './ui/Input'
export { default as Checkbox } from './ui/Checkbox'
export { default as Textarea } from './ui/Textarea'
export { default as ActionTile } from './ui/ActionTile'

export type { SelectOption } from './ui/Select'
export type { ButtonVariant } from './ui/Button'
