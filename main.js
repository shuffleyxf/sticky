const { app, BrowserWindow, nativeImage, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

// 保持对window对象的全局引用，避免JavaScript对象被垃圾回收时，窗口被自动关闭
let mainWindow;

function createWindow() {
  // 创建图标
  const iconPath = path.join(__dirname, 'assets', 'icons', 'favicon.ico');
  const appIcon = nativeImage.createFromPath(iconPath);
  
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: appIcon, // 使用nativeImage加载的图标
    autoHideMenuBar: true, // 自动隐藏菜单栏
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  
  // 隐藏菜单栏
  mainWindow.setMenuBarVisibility(false);

  // 加载应用的index.html
  mainWindow.loadFile('index.html');

  // 打开开发者工具 (已禁用)
  // mainWindow.webContents.openDevTools();

  // 当window被关闭时，触发下面的事件
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(createWindow);

// 所有窗口关闭时退出应用
app.on('window-all-closed', function () {
  // 在macOS上，除非用户使用Cmd + Q确定地退出
  // 否则绝大部分应用会保持活动状态
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  // 在macOS上，当点击dock图标并且没有其他窗口打开时，
  // 通常会在应用程序中重新创建一个窗口
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// 存储相关的配置和函数
const STORAGE_CONFIG = {
  dataDir: path.join(os.homedir(), '.sticky-notes'),
  dataFile: 'notes.json',
  backupFile: 'notes.backup.json',
  maxBackups: 5
};

// 确保数据目录存在
async function ensureDataDir() {
  try {
    await fs.access(STORAGE_CONFIG.dataDir);
  } catch (error) {
    await fs.mkdir(STORAGE_CONFIG.dataDir, { recursive: true });
  }
}

// 获取数据文件路径
function getDataPath(isBackup = false) {
  const fileName = isBackup ? STORAGE_CONFIG.backupFile : STORAGE_CONFIG.dataFile;
  return path.join(STORAGE_CONFIG.dataDir, fileName);
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

// IPC 处理程序
ipcMain.handle('storage:read', async () => {
  return await readNotesData();
});

ipcMain.handle('storage:write', async (event, data) => {
  return await writeNotesData(data);
});

ipcMain.handle('storage:backup', async () => {
  return await createBackup();
});

ipcMain.handle('storage:getPath', () => {
  return {
    dataDir: STORAGE_CONFIG.dataDir,
    dataFile: getDataPath(),
    backupFile: getDataPath(true)
  };
});