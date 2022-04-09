const { contextBridge, ipcRenderer } = require('electron');
const log = require('../log')('renderer');

contextBridge.exposeInMainWorld('log', log);
contextBridge.exposeInMainWorld('API', {
    onSetSettings: (cb) => ipcRenderer.on('set_settings', cb),
});
