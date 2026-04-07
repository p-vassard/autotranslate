const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    translate: () => ipcRenderer.invoke('translate'),
    hasSavedZone: () => ipcRenderer.invoke('has-saved-zone'),
    getLastTranslation: () => ipcRenderer.invoke('get-last-translation'),
    getFontSize: () => ipcRenderer.invoke('get-font-size'),
    onUpdateFontSize: (callback) => ipcRenderer.on('update-font-size', (event, size) => callback(size)),
    onZoneReady: (callback) => ipcRenderer.on('zone-ready', () => callback()),
    onAskForPrompt: (callback) => ipcRenderer.on('ask-for-prompt', (event, currentPrompt) => callback(currentPrompt)),
    savePrompt: (newPrompt) => ipcRenderer.send('save-prompt', newPrompt),
    onTranslationStarted: (callback) => ipcRenderer.on('translation-started', () => callback())
});
