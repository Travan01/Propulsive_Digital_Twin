const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron')
const path = require('path')
const fs = require('fs')

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 960,
    minWidth: 1200,
    minHeight: 700,
    backgroundColor: '#070b0f',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    frame: true,
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Allow API calls to Anthropic
    },
    show: false,
  })

  // Load app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()
  })

  mainWindow.on('closed', () => { mainWindow = null })

  // Custom menu
  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        { label: 'New Simulation', accelerator: 'CmdOrCtrl+N', click: () => mainWindow.webContents.send('menu-new') },
        { label: 'Export Report', accelerator: 'CmdOrCtrl+E', click: () => mainWindow.webContents.send('menu-export') },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
      ]
    },
    {
      label: 'Simulation',
      submenu: [
        { label: 'Jet Engine', accelerator: 'CmdOrCtrl+1', click: () => mainWindow.webContents.send('menu-mode', 'jet') },
        { label: 'Rocket', accelerator: 'CmdOrCtrl+2', click: () => mainWindow.webContents.send('menu-mode', 'rocket') },
        { label: 'Electric', accelerator: 'CmdOrCtrl+3', click: () => mainWindow.webContents.send('menu-mode', 'electric') },
        { label: 'Hybrid', accelerator: 'CmdOrCtrl+4', click: () => mainWindow.webContents.send('menu-mode', 'hybrid') },
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => mainWindow.webContents.reload() },
        { label: 'Toggle Fullscreen', accelerator: 'F11', click: () => mainWindow.setFullScreen(!mainWindow.isFullScreen()) },
        { type: 'separator' },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+=', click: () => mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() + 0.5) },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', click: () => mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() - 0.5) },
        { label: 'Reset Zoom', accelerator: 'CmdOrCtrl+0', click: () => mainWindow.webContents.setZoomLevel(0) },
      ]
    },
    {
      label: 'Help',
      submenu: [
        { label: 'User Manual', click: () => mainWindow.webContents.send('menu-manual') },
        { label: 'GitHub Repository', click: () => shell.openExternal('https://github.com/yourusername/propulsiontwin') },
        { type: 'separator' },
        { label: 'About PropulsionTwin', click: () => {
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'About PropulsionTwin',
            message: 'PropulsionTwin v2.0.0',
            detail: 'Digital Twin Simulation Environment\nJet · Rocket · Electric · Hybrid\n\nPowered by Claude AI + Physics Engine\n© 2025 PropulsionTwin'
          })
        }}
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)
}

// IPC Handlers
ipcMain.handle('save-report', async (event, content) => {
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Simulation Report',
    defaultPath: `propulsion-report-${Date.now()}.txt`,
    filters: [
      { name: 'Text Report', extensions: ['txt'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  if (filePath) {
    fs.writeFileSync(filePath, content, 'utf8')
    return { success: true, path: filePath }
  }
  return { success: false }
})

ipcMain.handle('save-session', async (event, sessionData) => {
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Session',
    defaultPath: `propulsion-session-${Date.now()}.json`,
    filters: [{ name: 'PropulsionTwin Session', extensions: ['json'] }]
  })
  if (filePath) {
    fs.writeFileSync(filePath, JSON.stringify(sessionData, null, 2), 'utf8')
    return { success: true }
  }
  return { success: false }
})

ipcMain.handle('load-session', async () => {
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Load Session',
    filters: [{ name: 'PropulsionTwin Session', extensions: ['json'] }],
    properties: ['openFile']
  })
  if (filePaths && filePaths[0]) {
    const data = fs.readFileSync(filePaths[0], 'utf8')
    return { success: true, data: JSON.parse(data) }
  }
  return { success: false }
})

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
