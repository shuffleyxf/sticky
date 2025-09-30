const { app } = require('electron');
const WindowManager = require('./window');
const IPCHandlers = require('./ipc/handlers');

// 保持对window管理器的引用
let windowManager;

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(() => {
  windowManager = new WindowManager();
  windowManager.createWindow();
  
  // 注册IPC处理程序
  IPCHandlers.register();
});

// 所有窗口关闭时退出应用
app.on('window-all-closed', function () {
  // 在macOS上，除非用户使用Cmd + Q确定地退出
  // 否则绝大部分应用会保持活动状态
  if (process.platform !== 'darwin') app.quit();
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