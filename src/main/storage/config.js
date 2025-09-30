const path = require('path');
const os = require('os');

// 存储相关的配置
const STORAGE_CONFIG = {
  dataDir: path.join(os.homedir(), '.sticky-notes'),
  dataFile: 'notes.json',
  backupFile: 'notes.backup.json',
  maxBackups: 5
};

// 获取数据文件路径
function getDataPath(isBackup = false) {
  const fileName = isBackup ? STORAGE_CONFIG.backupFile : STORAGE_CONFIG.dataFile;
  return path.join(STORAGE_CONFIG.dataDir, fileName);
}

module.exports = {
  STORAGE_CONFIG,
  getDataPath
};