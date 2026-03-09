import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  auth: {
    login: (username: string, password: string) => ipcRenderer.invoke('auth:login', username, password),
    logout: () => ipcRenderer.invoke('auth:logout'),
  },
  users: {
    getAll: () => ipcRenderer.invoke('users:getAll'),
    create: (data: any) => ipcRenderer.invoke('users:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('users:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('users:delete', id),
  },
  inventory: {
    getAll: () => ipcRenderer.invoke('inventory:getAll'),
    create: (data: any) => ipcRenderer.invoke('inventory:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('inventory:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('inventory:delete', id),
  },
  products: {
    getAll: () => ipcRenderer.invoke('products:getAll'),
    create: (data: any) => ipcRenderer.invoke('products:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('products:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('products:delete', id),
  },
  sales: {
    create: (data: any) => ipcRenderer.invoke('sales:create', data),
    getReports: (start: string, end: string) => ipcRenderer.invoke('sales:getReports', start, end),
  },
  tables: {
    getAll: () => ipcRenderer.invoke('tables:getAll'),
    create: (data: any) => ipcRenderer.invoke('tables:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('tables:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('tables:delete', id),
    generateLinks: () => ipcRenderer.invoke('tables:generateLinks'),
  },
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: any) => ipcRenderer.invoke('settings:set', key, value),
    reset: () => ipcRenderer.invoke('settings:reset'),
  },
  print: {
    placeholder: (data: any) => ipcRenderer.invoke('print:placeholder', data),
  }
});
