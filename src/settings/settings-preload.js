const { contextBridge, ipcRenderer } = require('electron');
const log = require('../log')('settings');

contextBridge.exposeInMainWorld('log', log);
contextBridge.exposeInMainWorld('API', {
    setSettings: (settings) => ipcRenderer.send('set_settings', settings),
    getSources: (thumb) => ipcRenderer.invoke('get_sources', thumb),
});
