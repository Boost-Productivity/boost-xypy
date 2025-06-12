const { contextBridge, ipcRenderer } = require('electron')

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // Get list of available apps
    getApps: () => ipcRenderer.invoke('get-apps'),

    // Launch an app
    launchApp: (appConfig) => ipcRenderer.invoke('launch-app', appConfig)
}) 