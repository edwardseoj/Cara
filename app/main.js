const { app, BrowserWindow, protocol, net } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

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
  new BrowserWindow({ width: 1000, height: 640 }).loadURL(`app://cara/${page}`);
});

app.on('window-all-closed', () => app.quit());
