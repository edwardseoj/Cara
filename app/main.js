const { app, BrowserWindow } = require('electron');

app.whenReady().then(() => {
  new BrowserWindow({ width: 960, height: 640 }).loadFile('index.html');
});

app.on('window-all-closed', () => app.quit());
