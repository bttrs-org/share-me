const { contextBridge, ipcRenderer } = require('electron');
const log = require('../log')('settings');

contextBridge.exposeInMainWorld('log', log);
contextBridge.exposeInMainWorld('API', {
    getStoreValue: (key) => ipcRenderer.invoke('get_store_value', key),
    setStoreValues: (values) => ipcRenderer.send('set_store_values', values),
    getSources: (thumb) => ipcRenderer.invoke('get_sources', thumb),
    setSettings: (settings) => ipcRenderer.send('set_settings', settings),
});
