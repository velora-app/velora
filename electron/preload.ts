import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI } from '../types'

const electronAPI: ElectronAPI = {
  executeQuery: (connection, query) => ipcRenderer.invoke('execute-query', { connection, query }),
  saveFileDialog: (options) => ipcRenderer.invoke('save-file-dialog', options),
  writeFile: (filePath, data) => ipcRenderer.invoke('write-file', { filePath, data }),
  exportExcel: (data, defaultPath) => ipcRenderer.invoke('export-excel', { data, defaultPath }),
  fetchSchema: (connection) => ipcRenderer.invoke('fetch-schema', { connection }),
  onCloseActiveTab: (handler) => {
    const listener = () => handler()
    ipcRenderer.on('close-active-tab', listener)
    return () => ipcRenderer.removeListener('close-active-tab', listener)
  },
  closeWindow: () => ipcRenderer.send('close-window'),
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
