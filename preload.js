const { contextBridge, ipcRenderer, webUtils } = require("electron");

contextBridge.exposeInMainWorld("footageDesktop", {
  selectFolder: (options) => ipcRenderer.invoke("folder:select", options),
  contextEntries: (paths) => ipcRenderer.invoke("context:entries", paths),
  dropEntries: (paths, options) => ipcRenderer.invoke("drop:entries", paths, options),
  filePath: (file) => webUtils.getPathForFile(file),
  readStates: (files) => ipcRenderer.invoke("context:read-states", files),
  markRead: (files, source) => ipcRenderer.invoke("context:mark-read", files, source),
  saveContext: (files, source, model) => ipcRenderer.invoke("context:save", files, source, model),
  searchContext: (query, limit) => ipcRenderer.invoke("context:search", query, limit),
  semanticStatus: () => ipcRenderer.invoke("context:semantic-status"),
  onContextOpen: (callback) => {
    ipcRenderer.on("context:open", (_event, paths) => callback(paths));
  },
  analyzeFootage: (payload) => ipcRenderer.invoke("footage:analyze", payload),
  showInFolder: (filePath) => ipcRenderer.invoke("file:show", filePath),
  platform: process.platform,
});
