# Sticky Notes - 简约便签应用

<div align="center">
  <img src="assets/icons/icon-512.png" alt="Sticky Notes Logo" width="128" height="128">
  
  <p>一个简洁、高效的桌面便签应用，基于 Electron 构建</p>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Electron](https://img.shields.io/badge/Electron-38.2.0-blue.svg)](https://electronjs.org/)
  [![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com/electron/electron)
</div>

## ✨ 功能特点

- 📝 **便签管理** - 创建、编辑、删除便签
- 🔍 **实时搜索** - 快速查找便签内容
- 🎨 **现代UI** - 简洁美观的用户界面
- 🔒 **安全可靠** - 本地数据存储，隐私有保障

## 📸 预览

![应用截图](./assets/images/preview.png)

## 🚀 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) (推荐 v16 或更高版本)
- npm 或 yarn

### 本地运行

1. **安装依赖**
   ```bash
   npm install
   ```

2. **启动应用**
   ```bash
   npm start
   ```

### 构建应用

```bash
# 构建应用
npm run build

# 构建 Windows 版本
npm run build:win

# 生成分发包
npm run dist
```

## 📋 使用说明

1. **创建便签**: 点击"新建便签"按钮
2. **编辑便签**: 直接点击便签内容进行编辑
3. **搜索便签**: 在搜索框中输入关键词快速查找
4. **删除便签**: 点击便签右上角的删除按钮
5. **自动保存**: 编辑内容会自动保存，无需手动操作


## 🐛 问题反馈

如果你发现了 bug 或有功能建议，请：

1. 查看 [Issues](https://github.com/your-username/sticky/issues) 确认问题未被报告
2. 创建新的 Issue，详细描述问题或建议
3. 如果可能，请提供复现步骤

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源协议。