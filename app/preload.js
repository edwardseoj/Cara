// Bridge: renderer sends landmark frames to main (where the recognizer runs), gets gated gestures back.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cara', {
  sendFrame: (frame) => ipcRenderer.send('landmarks', frame),
  onGesture: (fn) => ipcRenderer.on('gesture', (_e, event) => fn(event)),
});
