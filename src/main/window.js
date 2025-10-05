const { BrowserWindow, nativeImage, Tray, Menu } = require('electron');
const path = require('path');

class WindowManager {
  constructor() {
    this.mainWindow = null;
    this.tray = null;
    this.isQuitting = false;
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

    // 创建托盘
    this.createTray(appIcon);

    // 修改窗口关闭行为：点击X按钮时最小化到托盘而不是退出
    this.mainWindow.on('close', (event) => {
      if (!this.isQuitting) {
        event.preventDefault();
        this.mainWindow.hide();
      }
    });

    // 当window被关闭时，触发下面的事件
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    return this.mainWindow;
  }

  createTray(appIcon) {
    // 创建托盘图标
    this.tray = new Tray(appIcon);
    
    // 设置托盘提示文本
    this.tray.setToolTip('便签应用');
    
    // 创建托盘右键菜单
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示窗口',
        click: () => {
          this.showWindow();
        }
      },
      {
        label: '隐藏窗口',
        click: () => {
          if (this.mainWindow) {
            this.mainWindow.hide();
          }
        }
      },
      {
        type: 'separator'
      },
      {
        label: '退出应用',
        click: () => {
          this.quitApp();
        }
      }
    ]);
    
    // 设置托盘右键菜单
    this.tray.setContextMenu(contextMenu);
    
    // 托盘图标双击事件：显示/隐藏窗口
    this.tray.on('double-click', () => {
      this.toggleWindow();
    });
    
    // 托盘图标单击事件（Windows）
    if (process.platform === 'win32') {
      this.tray.on('click', () => {
        this.toggleWindow();
      });
    }
  }

  showWindow() {
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
      }
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  toggleWindow() {
    if (this.mainWindow) {
      if (this.mainWindow.isVisible()) {
        this.mainWindow.hide();
      } else {
        this.showWindow();
      }
    }
  }

  quitApp() {
    this.isQuitting = true;
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
    if (this.mainWindow) {
      this.mainWindow.close();
      this.mainWindow = null;
    }
    // 确保应用进程完全退出
    const { app } = require('electron');
    app.quit();
  }

  getMainWindow() {
    return this.mainWindow;
  }

  getTray() {
    return this.tray;
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