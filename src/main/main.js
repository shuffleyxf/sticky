const { app, globalShortcut } = require('electron');
const WindowManager = require('./window');
const IPCHandlers = require('./ipc/handlers');

// 保持对window管理器的引用
let windowManager;

// 确保应用程序只有一个实例
const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  console.log('应用已经在运行中，退出当前实例');
  app.quit();
} else {
  // 当第二个实例启动时，将焦点聚焦到第一个实例的窗口
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (windowManager) {
      const mainWindow = windowManager.getMainWindow();
      if (mainWindow) {
        // 如果窗口最小化，则恢复窗口
        if (mainWindow.isMinimized()) mainWindow.restore();
        // 聚焦窗口
        mainWindow.focus();
      }
    }
  });

  // 当Electron完成初始化并准备创建浏览器窗口时调用此方法
  app.whenReady().then(() => {
    windowManager = new WindowManager();
    windowManager.createWindow();
    
    // 注册IPC处理程序
    IPCHandlers.register();
    
    // 注册全局快捷键
    globalShortcut.register('CommandOrControl+Shift+/', () => {
      const mainWindow = windowManager.getMainWindow();
      if (mainWindow) {
        // 如果窗口最小化或隐藏，则显示窗口
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }
        if (!mainWindow.isVisible()) {
          mainWindow.show();
        }
        // 激活窗口（将焦点放到窗口上）
        mainWindow.focus();
        // 发送消息到渲染进程，聚焦搜索框
        mainWindow.webContents.send('focus-search');
      }
    });
  });
}

// 所有窗口关闭时的处理
app.on('window-all-closed', function () {
  // 由于我们使用托盘，不要在所有窗口关闭时退出应用
  // 应用将继续在托盘中运行
  // 只有在macOS上且没有托盘时才退出
  if (process.platform === 'darwin' && (!windowManager || !windowManager.tray)) {
    app.quit();
  }
});

app.on('activate', function () {
  // 在macOS上，当点击dock图标并且没有其他窗口打开时，
  // 通常会在应用程序中重新创建一个窗口
  if (!windowManager || !windowManager.hasWindows()) {
    if (!windowManager) {
      windowManager = new WindowManager();
    }
    windowManager.createWindow();
  }
});

// 应用退出前的清理
app.on('before-quit', () => {
  if (windowManager) {
    // 只清理资源，不再次调用app.quit()
    windowManager.isQuitting = true;
    if (windowManager.getTray()) {
      windowManager.getTray().destroy();
    }
  }
});

// 处理Cmd+Q (macOS) 或 Ctrl+Q 退出
app.on('will-quit', (event) => {
  // 注销所有全局快捷键
  globalShortcut.unregisterAll();
});