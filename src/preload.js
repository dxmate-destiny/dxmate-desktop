const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    signInWithStartgg: async () => { await ipcRenderer.invoke('sign-in-with-startgg') }
});