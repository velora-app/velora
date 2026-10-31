import type { DatabaseConnection, DatabaseTable, QueryResult } from './database'

/** Options for Electron save-file dialog (and shared with saveTextFile). */
export interface SaveFileDialogOptions {
  title?: string
  defaultPath?: string
  filters?: { name: string; extensions: string[] }[]
}

/** Options for saveTextFile (browser + Electron). */
export interface SaveTextFileOptions extends SaveFileDialogOptions {
  mimeType?: string
}

/** Result of save-file dialog. */
export interface SaveFileDialogResult {
  filePath?: string
  canceled: boolean
}

/** Result of writeFile IPC. */
export interface WriteFileResult {
  success: boolean
  error?: string
}

/** Result of exportExcel IPC. */
export interface ExportExcelResult {
  success: boolean
  filePath?: string
  canceled?: boolean
  error?: string
}

/** IPC payload for execute-query. */
export interface ExecuteQueryPayload {
  connection: DatabaseConnection
  query: string
}

/** IPC payload for fetch-schema. */
export interface FetchSchemaPayload {
  connection: DatabaseConnection
}

/** IPC payload for write-file. */
export interface WriteFilePayload {
  filePath: string
  data: string
}

/** IPC payload for export-excel. */
export interface ExportExcelPayload {
  data: Record<string, unknown>[]
  defaultPath?: string
}

export interface ElectronAPI {
  executeQuery: (connection: DatabaseConnection, query: string) => Promise<QueryResult>
  fetchSchema: (
    connection: DatabaseConnection
  ) => Promise<{ tables?: DatabaseTable[]; error?: string }>
  saveFileDialog: (options?: SaveFileDialogOptions) => Promise<SaveFileDialogResult>
  writeFile: (filePath: string, data: string) => Promise<WriteFileResult>
  exportExcel: (
    data: Record<string, unknown>[],
    defaultPath?: string
  ) => Promise<ExportExcelResult>
  onCloseActiveTab: (handler: () => void) => () => void
  closeWindow: () => void
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
