const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    translate: () => ipcRenderer.invoke('translate'),
    captureZone: () => ipcRenderer.invoke('capture-zone'),
    translateMultiple: (images) => ipcRenderer.invoke('translate-multiple', images),
    hasSavedZone: () => ipcRenderer.invoke('has-saved-zone'),
    getLastTranslation: () => ipcRenderer.invoke('get-last-translation'),
    getFontSize: () => ipcRenderer.invoke('get-font-size'),
    onUpdateFontSize: (callback) => ipcRenderer.on('update-font-size', (event, size) => callback(size)),
    onZoneReady: (callback) => ipcRenderer.on('zone-ready', () => callback()),
    onAskForPrompt: (callback) => ipcRenderer.on('ask-for-prompt', (event, currentPrompt) => callback(currentPrompt)),
    savePrompt: (newPrompt) => ipcRenderer.send('save-prompt', newPrompt),
    getPromptSize: () => ipcRenderer.invoke('get-prompt-size'),
    savePromptSize: (size) => ipcRenderer.send('save-prompt-size', size),
    onTranslationStarted: (callback) => ipcRenderer.on('translation-started', () => callback())
});
