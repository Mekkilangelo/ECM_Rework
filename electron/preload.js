const { contextBridge, ipcRenderer } = require('electron');

// Exposez des API sécurisées au frontend
contextBridge.exposeInMainWorld('electronAPI', {
  showError: (message) => ipcRenderer.invoke('show-error', message),
  downloadFile: (url, fileName) => ipcRenderer.invoke('download-file', url, fileName),
  openExternal: (url) => ipcRenderer.invoke('open-external', url)
});