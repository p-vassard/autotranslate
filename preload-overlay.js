const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    zoneSelected: (bounds) => ipcRenderer.send('zone-selected', bounds),
    cancelSelection: () => ipcRenderer.send('cancel-selection')
});
