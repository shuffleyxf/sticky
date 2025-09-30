const { ipcMain } = require('electron');
const { readNotesData, writeNotesData, createBackup, getStoragePaths } = require('../storage');

class IPCHandlers {
  static register() {
    // 注册所有IPC处理程序
    this.registerStorageHandlers();
  }

  static registerStorageHandlers() {
    // 读取便签数据
    ipcMain.handle('storage:read', async () => {
      return await readNotesData();
    });

    // 写入便签数据
    ipcMain.handle('storage:write', async (event, data) => {
      return await writeNotesData(data);
    });

    // 创建备份
    ipcMain.handle('storage:backup', async () => {
      return await createBackup();
    });

    // 获取存储路径
    ipcMain.handle('storage:getPath', () => {
      return getStoragePaths();
    });
  }
}

module.exports = IPCHandlers;