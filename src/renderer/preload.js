const { contextBridge, ipcRenderer } = require('electron');

// 安全地暴露存储API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 存储相关API
  storage: {
    // 读取便签数据
    read: () => ipcRenderer.invoke('storage:read'),
    
    // 写入便签数据
    write: (data) => ipcRenderer.invoke('storage:write', data),
    
    // 创建备份
    backup: () => ipcRenderer.invoke('storage:backup'),
    
    // 获取存储路径信息
    getPath: () => ipcRenderer.invoke('storage:getPath')
  }
});