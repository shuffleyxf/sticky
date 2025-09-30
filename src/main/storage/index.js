const fs = require('fs').promises;
const path = require('path');
const { STORAGE_CONFIG, getDataPath } = require('./config');

// 确保数据目录存在
async function ensureDataDir() {
  try {
    await fs.access(STORAGE_CONFIG.dataDir);
  } catch (error) {
    await fs.mkdir(STORAGE_CONFIG.dataDir, { recursive: true });
  }
}

// 读取便签数据
async function readNotesData() {
  try {
    await ensureDataDir();
    const dataPath = getDataPath();
    const data = await fs.readFile(dataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // 如果主文件读取失败，尝试读取备份文件
    try {
      const backupPath = getDataPath(true);
      const data = await fs.readFile(backupPath, 'utf8');
      console.log('从备份文件恢复数据');
      return JSON.parse(data);
    } catch (backupError) {
      console.log('没有找到存储文件，返回空数据');
      return { notes: [], nextId: 1 };
    }
  }
}

// 写入便签数据
async function writeNotesData(data) {
  try {
    await ensureDataDir();
    const dataPath = getDataPath();
    const backupPath = getDataPath(true);
    
    // 如果主文件存在，先备份
    try {
      await fs.access(dataPath);
      await fs.copyFile(dataPath, backupPath);
    } catch (error) {
      // 主文件不存在，跳过备份
    }
    
    // 写入新数据
    await fs.writeFile(dataPath, JSON.stringify(data, null, 2), 'utf8');
    return { success: true };
  } catch (error) {
    console.error('写入文件失败:', error);
    return { success: false, error: error.message };
  }
}

// 创建备份
async function createBackup() {
  try {
    await ensureDataDir();
    const dataPath = getDataPath();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(STORAGE_CONFIG.dataDir, `notes.backup.${timestamp}.json`);
    
    await fs.copyFile(dataPath, backupPath);
    
    // 清理旧备份（保留最新的几个）
    await cleanupOldBackups();
    
    return { success: true, backupPath };
  } catch (error) {
    console.error('创建备份失败:', error);
    return { success: false, error: error.message };
  }
}

// 清理旧备份文件
async function cleanupOldBackups() {
  try {
    const files = await fs.readdir(STORAGE_CONFIG.dataDir);
    const backupFiles = files
      .filter(file => file.startsWith('notes.backup.') && file.endsWith('.json'))
      .map(file => ({
        name: file,
        path: path.join(STORAGE_CONFIG.dataDir, file),
        time: fs.stat(path.join(STORAGE_CONFIG.dataDir, file)).then(stats => stats.mtime)
      }));
    
    if (backupFiles.length > STORAGE_CONFIG.maxBackups) {
      // 按时间排序，删除最旧的文件
      const sortedFiles = await Promise.all(
        backupFiles.map(async file => ({
          ...file,
          time: await file.time
        }))
      );
      
      sortedFiles.sort((a, b) => b.time - a.time);
      const filesToDelete = sortedFiles.slice(STORAGE_CONFIG.maxBackups);
      
      for (const file of filesToDelete) {
        await fs.unlink(file.path);
      }
    }
  } catch (error) {
    console.error('清理备份文件失败:', error);
  }
}

// 获取存储路径信息
function getStoragePaths() {
  return {
    dataDir: STORAGE_CONFIG.dataDir,
    dataFile: getDataPath(),
    backupFile: getDataPath(true)
  };
}

module.exports = {
  readNotesData,
  writeNotesData,
  createBackup,
  getStoragePaths
};