const { BrowserWindow, nativeImage } = require('electron');
const path = require('path');

class WindowManager {
  constructor() {
    this.mainWindow = null;
  }

  createWindow() {
    // 创建图标
    const iconPath = path.join(__dirname, '..', '..', 'assets', 'icons', 'favicon.ico');
    const appIcon = nativeImage.createFromPath(iconPath);
    
    // 创建浏览器窗口
    this.mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      icon: appIcon, // 使用nativeImage加载的图标
      autoHideMenuBar: true, // 自动隐藏菜单栏
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '..', 'renderer', 'preload.js')
      }
    });
    
    // 隐藏菜单栏
    this.mainWindow.setMenuBarVisibility(false);

    // 加载应用的index.html
    this.mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

    // 打开开发者工具 (已禁用)
    // this.mainWindow.webContents.openDevTools();

    // 当window被关闭时，触发下面的事件
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    return this.mainWindow;
  }

  getMainWindow() {
    return this.mainWindow;
  }

  hasWindows() {
    return BrowserWindow.getAllWindows().length > 0;
  }

  closeAllWindows() {
    BrowserWindow.getAllWindows().forEach(window => {
      window.close();
    });
  }
}

module.exports = WindowManager;