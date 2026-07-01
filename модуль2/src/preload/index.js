import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  getCakes: () => ipcRenderer.invoke('cakes:getAll'),
  getReferences: () => ipcRenderer.invoke('cakes:getReferences'),
  createCake: (cake) => ipcRenderer.invoke('cakes:create', cake),
  updateCake: (cake) => ipcRenderer.invoke('cakes:update', cake),
  deleteCake: (productId) => ipcRenderer.invoke('cakes:delete', productId)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
