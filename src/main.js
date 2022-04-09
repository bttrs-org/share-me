const path = require('path');
const fs = require('fs');
const { app, BrowserWindow, screen, ipcMain, desktopCapturer } = require('electron');
const log = require('./log')('main');
const store = require('./store');

const isDev = process.env.NODE_ENV === 'development';
const debugWindows = isDev;

app.commandLine.appendSwitch('high-dpi-support', '1');
app.commandLine.appendSwitch('force-device-scale-factor', '1');

async function createScreenshots() {
    const sources = await desktopCapturer.getSources({
        types: ['window', 'screen'],
        thumbnailSize: { width: 1200, height: 1200 },
    });
    for (const source of sources) {
        sources.thumbnailSize = 99;
        try {
            fs.writeFile(path.join(__dirname, source.name.replace(/[^a-z0-9-]/gi, '_') + '.jpg'), source.thumbnail.toJPEG(90), () => {
            });
        } catch (e) {
            log.error(e);
        }
    }
}

// setTimeout(createScreenshots, 3000);

function createWindows() {
    // RENDERER WINDOW
    const rendererWindow = new BrowserWindow({
        title: 'Share me!',
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        resizable: debugWindows,
        movable: debugWindows,
        minimizable: false,
        maximizable: false,
        fullscreenable: false,
        skipTaskbar: !debugWindows,
        frame: false,
        hasShadow: false,
        roundedCorners: false,
        webPreferences: {
            defaultEncoding: 'utf-8',
            backgroundThrottling: false,
            preload: path.join(__dirname, 'renderer', 'renderer-preload.js'),
        },
    });
    rendererWindow.setMenuBarVisibility(false);
    rendererWindow.on('closed', () => app.quit());

    // OVERLAY WINDOW
    const overlayWindow = new BrowserWindow({
        title: ' ',
        parent: rendererWindow,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        resizable: debugWindows,
        movable: debugWindows,
        minimizable: false,
        maximizable: false,
        fullscreenable: false,
        skipTaskbar: !debugWindows,
        frame: false,
        hasShadow: false,
        roundedCorners: false,
        webPreferences: {
            defaultEncoding: 'utf-8',
        },
    });
    overlayWindow.setMenuBarVisibility(false);
    // overlayWindow.setContentProtection(true);
    overlayWindow.on('closed', () => app.quit());

    // SETTINGS WINDOW
    const settingsWindow = new BrowserWindow({
        title: 'Share me! - Settings',
        // x: 100,
        // y: 100,
        // width: 1200,
        // height: 600,
        webPreferences: {
            defaultEncoding: 'utf-8',
            preload: path.join(__dirname, 'settings', 'settings-preload.js'),
        },
    });
    settingsWindow.setMenuBarVisibility(false);
    settingsWindow.setContentProtection(true);
    settingsWindow.on('closed', () => app.quit());

    // if (debugWindows) {
    //     rendererWindow.webContents.openDevTools();
    //     overlayWindow.webContents.openDevTools();
    //     settingsWindow.webContents.openDevTools();
    // }

    return { rendererWindow, overlayWindow, settingsWindow };
}

async function getSources(thumb) {
    const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: {
            width: thumb || 0,
            height: thumb || 0,
        },
    });
    const displays = screen.getAllDisplays();

    return sources.map((s) => {
        let display = displays.find(d => `${d.id}` === `${s.display_id}`);

        if (!display) {
            return null;
        }

        return {
            id: s.id,
            name: s.name,
            displayId: s.display_id,
            displayBounds: display.workArea,
            // workArea: display.workArea,
            thumb: s.thumbnail.getSize().width ? s.thumbnail.toDataURL() : '',
        };
    }).filter(s => !!s);
}

async function setSettings(settings, rendererWindow, overlayWindow) {
    rendererWindow.setBounds({
        x: settings.displayBounds.x,
        y: settings.displayBounds.y,
        width: settings.sourceBounds.width,
        height: settings.sourceBounds.height,
    });
    overlayWindow.setBounds({
        x: settings.displayBounds.x,
        y: settings.displayBounds.y,
        width: settings.sourceBounds.width,
        height: settings.sourceBounds.height,
    });
    rendererWindow.send('set_settings', settings);
}

async function init() {
    const { rendererWindow, overlayWindow, settingsWindow } = createWindows();

    ipcMain.handle('get_store_value', (evt, key) => store.get(key));
    ipcMain.on('set_store_values', (evt, values) => store.set(values));
    ipcMain.handle('get_sources', (evtm, thumb) => getSources(thumb));
    ipcMain.on('set_settings', (evt, settings) => setSettings(settings, rendererWindow, overlayWindow));

    await Promise.all([
        rendererWindow.loadFile(path.join(__dirname, 'renderer', 'renderer.html')),
        overlayWindow.loadFile(path.join(__dirname, 'renderer', 'overlay.html')),
        settingsWindow.loadFile(path.join(__dirname, 'settings', 'settings.html')),
    ]);

    settingsWindow.focusOnWebView();
}

app.whenReady().then(() => {
    init();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindows();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
