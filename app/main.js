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
  new BrowserWindow({ width: 960, height: 640 }).loadURL('app://cara/index.html');
});

app.on('window-all-closed', () => app.quit());
