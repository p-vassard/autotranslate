const { app, BrowserWindow, Menu, ipcMain, desktopCapturer } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { translateImage } = require('./services/gemini');
const { captureScreenZone } = require('./services/capture');

// Initialize store
const store = new Store();
if (!store.has('prompt')) {
    store.set('prompt', 'Traduit et décompose ce texte');
}

let mainWindow;
let overlayWindow;

function createWindow() {
    const windowBounds = store.get('windowBounds', { width: 450, height: 400 });

    mainWindow = new BrowserWindow({
        width: windowBounds.width,
        height: windowBounds.height,
        alwaysOnTop: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    mainWindow.on('resize', () => {
        if (mainWindow) {
            store.set('windowBounds', mainWindow.getBounds());
        }
    });

    mainWindow.loadFile('renderer/index.html');
    createMenu();
}

function createMenu() {
    const template = [
        {
            label: 'Réglages',
            submenu: [
                {
                    label: 'Taille du texte',
                    submenu: [12, 14, 16, 18, 20, 24].map(size => ({
                        label: `${size}px`,
                        click: () => {
                            store.set('fontSize', size);
                            if (mainWindow) mainWindow.webContents.send('update-font-size', size);
                        }
                    }))
                },
                {
                    label: 'Sélectionner la zone',
                    click: () => {
                        createOverlay();
                    }
                },
                {
                    label: 'Prompt',
                    click: () => {
                        // Simple prompt dialog or IPC to main window to ask for prompt
                        mainWindow.webContents.send('ask-for-prompt', store.get('prompt'));
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

function createOverlay() {
    if (overlayWindow) return;

    overlayWindow = new BrowserWindow({
        frame: false,
        transparent: true,
        fullscreen: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload-overlay.js'),
            contextIsolation: true
        }
    });

    overlayWindow.loadFile('renderer/overlay.html');
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// IPC communication
ipcMain.on('zone-selected', (event, bounds) => {
    if (overlayWindow) {
        overlayWindow.close();
        overlayWindow = null;
    }

    // Save bounds and notify main window
    store.set('captureBounds', bounds);
    mainWindow.webContents.send('zone-ready');
});

ipcMain.on('cancel-selection', () => {
    if (overlayWindow) {
        overlayWindow.close();
        overlayWindow = null;
    }
});

ipcMain.handle('translate', async () => {
    try {
        const bounds = store.get('captureBounds');
        if (!bounds) throw new Error('Aucune zone sélectionnée');

        mainWindow.webContents.send('translation-started');

        // 1. Capture screen zone
        const base64Image = await captureScreenZone(bounds);

        // 2. Transmettre à Gemini
        const userPrompt = store.get('prompt', 'Traduit et décompose ce texte');
        const resultMarkdown = await translateImage(base64Image, userPrompt);

        // 3. Convertir en HTML
        const { marked } = await import('marked');
        const resultHTML = marked.parse(resultMarkdown);

        store.set('lastTranslation', resultHTML);

        return { success: true, text: resultHTML };

    } catch (error) {
        console.error(error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('has-saved-zone', () => {
    return store.has('captureBounds');
});

ipcMain.handle('get-font-size', () => {
    return store.get('fontSize', 14);
});

ipcMain.handle('get-last-translation', () => {
    return store.get('lastTranslation', '');
});

ipcMain.on('save-prompt', (event, newPrompt) => {
    store.set('prompt', newPrompt);
});
