// Processo principale Electron — apre la finestra del gioco (client dei colleghi).
// In sviluppo carica il dev server Vite; nell'exe impacchettato serve i file build
// tramite un protocollo interno "app://" così i percorsi ASSOLUTI (es. /illustrations/x.jpg)
// si risolvono dalla cartella dell'app invece che dalla radice del disco (bug di file://).
const { app, protocol, net, BrowserWindow, shell } = require('electron')
const path = require('path')
const { pathToFileURL } = require('url')

// Va registrato PRIMA di app.whenReady()
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } },
])

function createWindow() {
  const win = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: '#06080f',
    autoHideMenuBar: true,
    title: 'Pocket Fantasya',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: false, // app locale fidata: il preload imposta il flag client
      nodeIntegration: false,
    },
  })

  if (!app.isPackaged) {
    // Sviluppo: serve `npm run dev` attivo su 5173
    win.loadURL('http://localhost:5173/newui.html')
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    // Produzione: la nuova UI compilata, servita via protocollo app://
    win.loadURL('app://bundle/newui.html')
  }

  // I link esterni (es. studio) si aprono nel browser di sistema, non nella finestra gioco
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })
}

app.whenReady().then(() => {
  if (app.isPackaged) {
    const distRoot = path.join(__dirname, '..', 'dist')
    // Mappa app://bundle/<path> → dist/<path> (incluso "/" → newui.html)
    protocol.handle('app', (request) => {
      let rel = decodeURIComponent(new URL(request.url).pathname)
      if (rel === '/' || rel === '') rel = '/newui.html'
      const filePath = path.join(distRoot, rel)
      return net.fetch(pathToFileURL(filePath).toString())
    })
  }

  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
