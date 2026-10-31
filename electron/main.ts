import { app, BrowserWindow, ipcMain, dialog, net, protocol } from 'electron'
import path from 'path'
import fs from 'fs'
import { pathToFileURL } from 'url'
import type {
  QueryResult,
  ExecuteQueryPayload,
  FetchSchemaPayload,
  SaveFileDialogOptions,
  WriteFilePayload,
  ExportExcelPayload,
} from '../types'
import { executeQuery } from './database'
import { fetchSchema } from './schema'

const appScheme = 'app'

protocol.registerSchemesAsPrivileged([
  {
    scheme: appScheme,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
])

let mainWindow: BrowserWindow | null = null

function registerAppProtocol(): void {
  const outDir = path.join(app.getAppPath(), 'out')
  protocol.handle(appScheme, (request) => {
    const pathname = decodeURIComponent(new URL(request.url).pathname).replace(/^\/+/, '')
    const relativePath = pathname.length > 0 ? pathname : 'index.html'
    const filePath = path.normalize(path.join(outDir, relativePath))
    const outsideOutDir = path.relative(outDir, filePath).startsWith('..') || path.isAbsolute(path.relative(outDir, filePath))
    if (outsideOutDir || !fs.existsSync(filePath)) {
      return new Response('Not found', { status: 404 })
    }
    return net.fetch(pathToFileURL(filePath).toString(), { bypassCustomProtocolHandlers: true })
  })
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#1a1a1a',
    icon: path.join(app.getAppPath(), 'assets', 'main-logo-icon.svg'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 18 },
    frame: true,
  })

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    void mainWindow.loadURL(`${appScheme}://velora/index.html`)
  }

  mainWindow.webContents.on('before-input-event', (event, input) => {
    const closeShortcut =
      input.type === 'keyDown' &&
      input.key.toLowerCase() === 'w' &&
      (input.meta || input.control) &&
      !input.shift &&
      !input.alt
    if (!closeShortcut || !mainWindow) return
    event.preventDefault()
    mainWindow.webContents.send('close-active-tab')
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

ipcMain.on('close-window', () => {
  mainWindow?.close()
})

app.whenReady().then(() => {
  registerAppProtocol()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle(
  'execute-query',
  async (_event, { connection, query }: ExecuteQueryPayload): Promise<QueryResult> => {
    try {
      return await executeQuery(connection, query)
    } catch (error) {
      return {
        columns: [],
        rows: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
)

ipcMain.handle(
  'fetch-schema',
  async (_event, { connection }: FetchSchemaPayload) => {
    try {
      const tables = await fetchSchema(connection)
      return { tables }
    } catch (error) {
      return {
        tables: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
)

ipcMain.handle(
  'save-file-dialog',
  async (_event, options?: SaveFileDialogOptions) => {
    const result = await dialog.showSaveDialog(mainWindow!, options ?? {})
    return result
  }
)

ipcMain.handle(
  'write-file',
  async (_event, { filePath, data }: WriteFilePayload) => {
    try {
      fs.writeFileSync(filePath, data)
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }
)

ipcMain.handle(
  'export-excel',
  async (_event, { data, defaultPath }: ExportExcelPayload) => {
    try {
      const XLSX = require('xlsx') as typeof import('xlsx')
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')

      const result = await dialog.showSaveDialog(mainWindow!, {
        title: 'Export to Excel',
        defaultPath: defaultPath ?? 'query_result.xlsx',
        filters: [{ name: 'Excel Files', extensions: ['xlsx'] }],
      })

      if (result.filePath && !result.canceled) {
        XLSX.writeFile(wb, result.filePath)
        return { success: true, filePath: result.filePath }
      }

      return { success: false, canceled: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }
)
