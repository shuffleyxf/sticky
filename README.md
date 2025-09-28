# Electron便签应用

这是一个简单的Electron桌面应用示例，实现了一个基本的便签功能。

## 功能特点

- 创建和编辑便签
- 保存便签内容到本地存储
- 清除便签内容

## 项目结构

```
sticky/
├── main.js          # 主进程文件
├── index.html       # 渲染进程HTML
├── renderer.js      # 渲染进程JavaScript
├── styles.css       # 样式文件
└── package.json     # 项目配置文件
```

## 安装步骤

1. 确保已安装 [Node.js](https://nodejs.org/) (包含npm)
2. 克隆或下载此仓库
3. 在项目目录中打开命令行
4. 安装依赖:

```bash
npm install
```

## 运行应用

安装完依赖后，使用以下命令启动应用:

```bash
npm start
```

## 技术栈

- Electron
- HTML/CSS
- JavaScript

## 学习资源

- [Electron官方文档](https://www.electronjs.org/docs)
- [Electron快速入门](https://www.electronjs.org/docs/tutorial/quick-start)