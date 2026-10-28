const { app, BrowserWindow, protocol, net, ipcMain } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { loadRecognizer } = require('./recognizer');

// Exported static model (#28), copied from training/models/static; gitignored like app/models/.
const STATIC_MODEL = process.env.CARA_STATIC_MODEL || path.join(__dirname, 'models', 'static');

// Serve app files over app:// so the renderer can fetch the local MediaPipe wasm and model (file:// blocks fetch).
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

app.whenReady().then(() => {
  protocol.handle('app', (req) => {
    const file = path.join(__dirname, decodeURIComponent(new URL(req.url).pathname));
    if (!file.startsWith(__dirname + path.sep)) return new Response('', { status: 404 });
    return net.fetch(pathToFileURL(file).toString());
  });
  // Dev UI (ADR 0003) only when running from source; packaged builds exclude dev.html and dev/.
  const page = app.isPackaged ? 'index.html' : 'dev.html';
  const win = new BrowserWindow({ width: app.isPackaged ? 1000 : 1100, height: 640, webPreferences: { preload: path.join(__dirname, 'preload.js') } });
  win.loadURL(`app://cara/${page}`);
  // Every gesture shown or acted on comes out of the gate inside the recognizer.
  loadRecognizer(STATIC_MODEL).then((recognize) => {
    ipcMain.on('landmarks', (_e, frame) => {
      const event = recognize(frame);
      if (event) win.webContents.send('gesture', event);
    });
  }, (err) => console.error(`static gestures off: ${err.message}`));
});

app.on('window-all-closed', () => app.quit());
