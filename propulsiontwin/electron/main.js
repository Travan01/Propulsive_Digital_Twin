'use strict'

const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron')
const path = require('path')
const fs = require('fs')

const isDev = process.env.NODE_ENV === 'development'
const iconPath = path.join(__dirname, '..', 'public', 'icon.svg')

let mainWindow = null

function createWindow () {
  const win = new BrowserWindow({
    width: 1600,
    height: 960,
    minWidth: 1200,
    minHeight: 700,
    backgroundColor: '#070b0f',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    frame: true,
    ...(fs.existsSync(iconPath) ? { icon: iconPath } : {}),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      sandbox: false,
    },
    show: false,
  })

  mainWindow = win

  if (isDev) {
    win.loadURL('http://localhost:5173').catch(function (err) {
      console.error('Failed to load dev URL:', err.message)
    })
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    var indexPath = path.join(__dirname, '..', 'dist', 'index.html')
    win.loadFile(indexPath).catch(function (err) {
      console.error('Failed to load dist/index.html:', err.message)
    })
  }

  win.once('ready-to-show', function () {
    win.show()
    win.focus()
  })

  win.on('closed', function () {
    mainWindow = null
  })

  buildMenu(win)
}

function buildMenu (win) {
  function send (channel) {
    var args = Array.prototype.slice.call(arguments, 1)
    if (win && !win.isDestroyed()) {
      win.webContents.send.apply(win.webContents, [channel].concat(args))
    }
  }

  var template = [
    {
      label: 'File',
      submenu: [
        { label: 'New Simulation', accelerator: 'CmdOrCtrl+N', click: function () { send('menu-new') } },
        { label: 'Export Report',  accelerator: 'CmdOrCtrl+E', click: function () { send('menu-export') } },
        { type: 'separator' },
        { label: 'Quit', accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4', click: function () { app.quit() } },
      ],
    },
    {
      label: 'Simulation',
      submenu: [
        { label: 'Jet Engine', accelerator: 'CmdOrCtrl+1', click: function () { send('menu-mode', 'jet') } },
        { label: 'Rocket',     accelerator: 'CmdOrCtrl+2', click: function () { send('menu-mode', 'rocket') } },
        { label: 'Electric',   accelerator: 'CmdOrCtrl+3', click: function () { send('menu-mode', 'electric') } },
        { label: 'Hybrid',     accelerator: 'CmdOrCtrl+4', click: function () { send('menu-mode', 'hybrid') } },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload',            accelerator: 'CmdOrCtrl+R',   click: function () { if (win && !win.isDestroyed()) win.webContents.reload() } },
        { label: 'Toggle Fullscreen', accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+F' : 'F11', click: function () { if (win && !win.isDestroyed()) win.setFullScreen(!win.isFullScreen()) } },
        { type: 'separator' },
        { label: 'Zoom In',    accelerator: 'CmdOrCtrl+=', click: function () { if (win && !win.isDestroyed()) win.webContents.setZoomLevel(win.webContents.getZoomLevel() + 0.5) } },
        { label: 'Zoom Out',   accelerator: 'CmdOrCtrl+-', click: function () { if (win && !win.isDestroyed()) win.webContents.setZoomLevel(win.webContents.getZoomLevel() - 0.5) } },
        { label: 'Reset Zoom', accelerator: 'CmdOrCtrl+0', click: function () { if (win && !win.isDestroyed()) win.webContents.setZoomLevel(0) } },
      ],
    },
    {
      label: 'Help',
      submenu: [
        { label: 'User Manual',       click: function () { send('menu-manual') } },
        { label: 'GitHub Repository', click: function () { shell.openExternal('https://github.com/yourusername/propulsiontwin') } },
        { type: 'separator' },
        {
          label: 'About PropulsionTwin',
          click: function () {
            if (!win || win.isDestroyed()) return
            dialog.showMessageBox(win, {
              type: 'info',
              title: 'About PropulsionTwin',
              message: 'PropulsionTwin v2.0.0',
              detail: 'Digital Twin Simulation Environment\nJet · Rocket · Electric · Hybrid\n\nPowered by Claude AI + Physics Engine\n© 2025 PropulsionTwin Contributors\n\nRuntime: Node.js ' + process.version,
            })
          },
        },
      ],
    },
  ]

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    })
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// ── IPC Handlers ──────────────────────────────────────────────────────────────

ipcMain.handle('save-report', async function (_event, content) {
  if (!mainWindow || mainWindow.isDestroyed()) return { success: false }
  try {
    var result = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Simulation Report',
      defaultPath: path.join(app.getPath('documents'), 'propulsion-report-' + Date.now() + '.txt'),
      filters: [
        { name: 'Text Report', extensions: ['txt'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    })
    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, content, { encoding: 'utf8' })
      return { success: true, path: result.filePath }
    }
  } catch (err) {
    console.error('save-report error:', err.message)
  }
  return { success: false }
})

ipcMain.handle('save-session', async function (_event, sessionData) {
  if (!mainWindow || mainWindow.isDestroyed()) return { success: false }
  try {
    var result = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Session',
      defaultPath: path.join(app.getPath('documents'), 'propulsion-session-' + Date.now() + '.json'),
      filters: [{ name: 'PropulsionTwin Session', extensions: ['json'] }],
    })
    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, JSON.stringify(sessionData, null, 2), { encoding: 'utf8' })
      return { success: true }
    }
  } catch (err) {
    console.error('save-session error:', err.message)
  }
  return { success: false }
})

ipcMain.handle('load-session', async function () {
  if (!mainWindow || mainWindow.isDestroyed()) return { success: false }
  try {
    var result = await dialog.showOpenDialog(mainWindow, {
      title: 'Load Session',
      filters: [{ name: 'PropulsionTwin Session', extensions: ['json'] }],
      properties: ['openFile'],
    })
    if (!result.canceled && result.filePaths && result.filePaths[0]) {
      var raw = fs.readFileSync(result.filePaths[0], { encoding: 'utf8' })
      return { success: true, data: JSON.parse(raw) }
    }
  } catch (err) {
    console.error('load-session error:', err.message)
  }
  return { success: false }
})

// ── App lifecycle ─────────────────────────────────────────────────────────────

app.whenReady().then(function () {
  createWindow()
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// Prevent renderer from navigating away
app.on('web-contents-created', function (_event, contents) {
  contents.on('will-navigate', function (event, url) {
    if (!url.startsWith('http://localhost:5173') && !url.startsWith('file://')) {
      event.preventDefault()
    }
  })
})
