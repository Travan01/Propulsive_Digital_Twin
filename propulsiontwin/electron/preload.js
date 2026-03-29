const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  saveReport: (content) => ipcRenderer.invoke('save-report', content),
  saveSession: (data) => ipcRenderer.invoke('save-session', data),
  loadSession: () => ipcRenderer.invoke('load-session'),
  onMenuNew: (cb) => ipcRenderer.on('menu-new', cb),
  onMenuExport: (cb) => ipcRenderer.on('menu-export', cb),
  onMenuMode: (cb) => ipcRenderer.on('menu-mode', (_, mode) => cb(mode)),
  onMenuManual: (cb) => ipcRenderer.on('menu-manual', cb),
  platform: process.platform,
})
