/**
 * 便签应用主入口文件
 * 整合所有服务和工具模块，管理应用的初始化和事件绑定
 */

// 导入服务模块
import StorageService from './services/storage.js';
import NotesService from './services/notes.js';
import SearchService from './services/search.js';
import NotificationService from './services/notification.js';
import ToolsService from './services/tools.js';

// Markdown解析库通过CDN引入，不需要import

// 导入工具模块
import { formatTime } from './utils/time.js';
import { getElement, debounce } from './utils/dom.js';
import { renderAllNotes, updateAllNoteTimes, updateSearchUI, getNoteInputs } from './utils/render.js';

/**
 * 便签应用主类
 */
class StickyNotesApp {
  constructor() {
    // 初始化服务
    this.storageService = new StorageService();
    this.notificationService = new NotificationService();
    this.notesService = new NotesService(this.storageService, this.notificationService);
    this.searchService = new SearchService();
    this.toolsService = new ToolsService(this.notificationService);
    
    // DOM元素
    this.notesContainer = null;
    this.newNoteButton = null;
    this.searchInput = null;
    this.clearSearchButton = null;
    this.searchBox = null;
    
    // 定时器
    this.timeUpdateInterval = null;
    
    // 记录最后获得焦点的便签ID
    this.lastFocusedNoteId = null;
    
    // 添加全局事件监听器来记录最后焦点便签
    document.addEventListener('mousedown', (event) => {
      const noteContainer = event.target.closest('.note-container');
      if (noteContainer) {
        const noteId = noteContainer.getAttribute('data-note-id');
        if (noteId) {
          this.lastFocusedNoteId = noteId;
        }
      }
    });
    
    // 绑定方法上下文
    this.handleSaveNote = this.handleSaveNote.bind(this);
    this.handleManualSaveNote = this.handleManualSaveNote.bind(this);
    this.handleDeleteNote = this.handleDeleteNote.bind(this);
    this.handleSearch = debounce(this.handleSearch.bind(this), 300);
    this.handleClearSearch = this.handleClearSearch.bind(this);
    this.handleCreateNote = this.handleCreateNote.bind(this);
  }

  /**
   * 初始化应用
   */
  async init() {
    try {
      // 获取DOM元素
      this.initDOMElements();
      
      // 初始化便签数据
      await this.notesService.initialize();
      
      // 渲染便签
      this.renderNotes();
      
      // 绑定事件监听器
      this.bindEventListeners();
      
      // 绑定快捷键事件
      this.bindShortcutEvents();
      
      // 启动定时器
      this.startTimeUpdateTimer();
      
      // 设置自动备份
      this.storageService.setupAutoBackup();
      
      // 启动自动保存
      this.storageService.startAutoSave();
      
      console.log('便签应用初始化完成');
    } catch (error) {
      console.error('应用初始化失败:', error);
      this.notificationService.error('应用初始化失败，请刷新页面重试');
    }
  }
  
  /**
   * 创建工具栏按钮
   * @param {string} id - 按钮ID
   * @param {string} title - 按钮提示文本
   * @param {string} iconId - SVG图标模板ID
   * @param {Function} clickHandler - 点击事件处理函数
   * @returns {HTMLElement} - 按钮元素
   */
  createToolButton(id, title, iconId, clickHandler) {
    const button = document.createElement('button');
    button.className = `toolbar-btn ${id}-btn`;
    button.title = title;
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'btn-icon');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    
    // 从模板中获取SVG内容
    const iconTemplate = document.getElementById(iconId);
    if (iconTemplate) {
      // 复制SVG内容
      const paths = iconTemplate.querySelectorAll("path, circle, rect, line, polyline");
      paths.forEach(path => {
        const newPath = path.cloneNode(true);
        svg.appendChild(newPath);
      });
    } else {
      console.warn(`找不到图标模板: ${iconId}`);
    }
    
    button.appendChild(svg);
    
    // 添加点击事件
    if (clickHandler) {
      button.addEventListener('click', () => {
        const noteElement = button.closest('.note-container');
        const contentTextarea = noteElement.querySelector('.note-content');
        
        if (contentTextarea) {
          clickHandler(contentTextarea);
        }
      });
    }
    
    return button;
  }

  /**
   * 绑定工具栏事件
   * @param {HTMLElement} noteElement - 便签元素
   * @param {Object} note - 便签数据
   */
  bindToolbarEvents(noteElement, note) {
    const toolbar = noteElement.querySelector('.header-toolbar');
    
    if (!toolbar) return;
    
    // 清空工具栏
    toolbar.innerHTML = '';
    
    // Markdown预览按钮现在通过工具服务添加
    
    // 获取其他可用工具
    const tools = this.toolsService.getAvailableTools(noteElement);
    
    // 动态创建工具按钮
    tools.forEach(tool => {
      const button = this.createToolButton(tool.id, tool.title, tool.iconId, tool.handler);
      toolbar.appendChild(button);
    });
  }

  /**
   * 渲染单个便签
   * @param {Object} note - 便签数据
   */
  renderNote(note) {
    // 获取便签模板
    const template = document.getElementById('note-template');
    const noteElement = document.importNode(template.content, true).querySelector('.note-container');
    
    // 设置便签ID
    noteElement.dataset.noteId = note.id;
    
    // 设置便签内容
    const titleInput = noteElement.querySelector('.note-title-input');
    const contentTextarea = noteElement.querySelector('.note-content');
    const dateElement = noteElement.querySelector('.note-date');
    
    titleInput.value = note.title || '';
    contentTextarea.value = note.content || '';
    dateElement.textContent = formatTime(note.updatedAt);
    
    // 绑定事件
    this.bindNoteEvents(noteElement, note);
    
    // 绑定工具栏事件
    this.bindToolbarEvents(noteElement, note);
    
    return noteElement;
  }

  /**
   * 初始化DOM元素
   */
  initDOMElements() {
    this.notesContainer = getElement('#notes-container');
    this.newNoteButton = getElement('#newNoteBtn');
    this.searchInput = getElement('#searchInput');
    this.clearSearchButton = getElement('#clearSearch');
    this.searchBox = getElement('.search-box');
    
    if (!this.notesContainer) {
      throw new Error('找不到便签容器元素');
    }
  }

  /**
   * 绑定事件监听器
   */
  bindEventListeners() {
    // 新建便签按钮
    if (this.newNoteButton) {
      this.newNoteButton.addEventListener('click', this.handleCreateNote);
    }
    
    // 搜索输入框
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.handleSearch(e.target.value);
      });
      
      this.searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.handleClearSearch();
        }
      });
    }
    
    // 清除搜索按钮
    if (this.clearSearchButton) {
      this.clearSearchButton.addEventListener('click', this.handleClearSearch);
    }
    
    // 页面卸载时清理定时器
    window.addEventListener('beforeunload', () => {
      this.stopTimeUpdateTimer();
    });
  }

  /**
   * 渲染便签
   */
  renderNotes() {
    const notes = this.notesService.getAllNotes();
    let notesToRender = notes;
    
    // 如果有搜索关键词，使用搜索结果
    if (this.searchService.hasSearchTerm()) {
      notesToRender = this.searchService.performSearch(notes, this.searchService.getCurrentSearchTerm());
    }
    
    renderAllNotes(
      notesToRender,
      this.notesContainer,
      this.searchService,
      this.handleSaveNote,
      this.handleManualSaveNote,
      this.handleDeleteNote
    );
  }

  /**
   * 处理创建新便签
   */
  async handleCreateNote() {
    try {
      const newNote = await this.notesService.createNewNote();
      this.renderNotes();
      
      // 滚动到新便签并聚焦
      setTimeout(() => {
        const inputs = getNoteInputs(newNote.id);
        if (inputs && inputs.titleInput) {
          inputs.titleInput.focus();
          inputs.titleInput.select();
          
          // 检查是否有已经最大化的便签，如果有，则将新便签也设为最大化
          const hasMaximizedNote = document.body.classList.contains('has-maximized-note');
          if (hasMaximizedNote) {
            // 获取新便签的容器元素
            const noteElement = document.querySelector(`.note-container[data-note-id="${newNote.id}"]`);
            if (noteElement) {
              // 将新便签设为最大化状态
              this.toggleMaximizeNote(newNote.id);
            }
          }
        }
      }, 100);
    } catch (error) {
      console.error('创建便签失败:', error);
      this.notificationService.error('创建便签失败');
    }
  }

  /**
   * 处理保存便签（自动保存，无通知）
   */
  async handleSaveNote(noteId, updates) {
    try {
      const success = await this.notesService.updateNote(noteId, updates);
      if (success) {
        // 更新时间显示
        const inputs = getNoteInputs(noteId);
        if (inputs && inputs.noteElement) {
          const dateElement = inputs.noteElement.querySelector('.note-date');
          if (dateElement) {
            const note = this.notesService.getNoteById(noteId);
            if (note) {
              dateElement.textContent = formatTime(note.updatedAt);
            }
          }
        }
      }
    } catch (error) {
      console.error('保存便签失败:', error);
      this.notificationService.error('保存便签失败');
    }
  }

  /**
   * 处理手动保存便签（显示通知）
   */
  async handleManualSaveNote(noteId, updates) {
    try {
      const success = await this.notesService.saveNoteManually(noteId, updates);
      if (success) {
        // 更新时间显示
        const inputs = getNoteInputs(noteId);
        if (inputs && inputs.noteElement) {
          const dateElement = inputs.noteElement.querySelector('.note-date');
          if (dateElement) {
            const note = this.notesService.getNoteById(noteId);
            if (note) {
              dateElement.textContent = formatTime(note.updatedAt);
            }
          }
        }
      }
    } catch (error) {
      console.error('手动保存便签失败:', error);
      // 注意：通知已在NotesService.saveNoteManually中处理，这里不再显示错误通知
    }
  }
  
  /**
   * 切换便签最大化状态
   * @param {string} noteId - 便签ID
   */
  toggleMaximizeNote(noteId) {
    console.log('执行toggleMaximizeNote方法', noteId);
    const noteElement = document.querySelector(`.note-container[data-note-id="${noteId}"]`);
    console.log('找到便签元素:', noteElement);
    
    if (noteElement) {
      if (noteElement.classList.contains('maximized')) {
        // 还原便签
        console.log('还原便签');
        
        // 先获取目标元素引用，避免后续查找
        const titleInput = noteElement.querySelector('.note-title-input');
        const contentEditor = noteElement.querySelector('.note-content');
        const targetElement = contentEditor || titleInput; // 优先选择内容编辑区
        
        // 立即设置焦点到目标元素，防止焦点跳到其他地方
        if (targetElement) {
          targetElement.focus();
        }
        
        // 移除沉浸式模式相关的CSS类
        noteElement.classList.remove('maximized');
        document.body.classList.remove('has-maximized-note');
        document.documentElement.classList.remove('has-maximized-note');
        noteElement.querySelector('.maximize-btn').title = '最大化编辑';
        noteElement.querySelector('.maximize-btn svg path').setAttribute('d', 'M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3');
        
        // 使用较短的延时，在布局稳定后进行滚动和焦点设置
        setTimeout(() => {
          // 滚动到便签位置
          noteElement.scrollIntoView({
            behavior: 'instant', // 使用instant避免滚动动画造成的闪烁
            block: 'center'
          });
          
          // 再次确保焦点在正确位置，优先聚焦内容编辑区
           if (contentEditor) {
             contentEditor.focus();
           } else if (titleInput) {
             titleInput.focus();
             titleInput.select();
           }
        }, 50); // 减少延时时间
      } else {
        // 最大化便签
        console.log('最大化便签');
        noteElement.classList.add('maximized');
        document.body.classList.add('has-maximized-note'); // 添加body类名
        document.documentElement.classList.add('has-maximized-note'); // 添加html类名
        noteElement.querySelector('.maximize-btn').title = '还原便签';
        noteElement.querySelector('.maximize-btn svg path').setAttribute('d', 'M4 14h6m0 0v6m0-6l-7 7m11-3h6m0 0v-6m0 6l-7-7');
        
        // 聚焦到内容编辑区
        setTimeout(() => {
          const contentEditor = noteElement.querySelector('.note-content');
          if (contentEditor) {
            contentEditor.focus();
          }
        }, 100);
      }
    }
  }

  /**
   * 处理删除便签
   */
  async handleDeleteNote(noteId) {
    try {
      const success = await this.notesService.deleteNote(noteId);
      if (success) {
        // 移除DOM元素
        const noteElement = document.querySelector(`[data-note-id="${noteId}"]`);
        if (noteElement) {
          noteElement.remove();
        }
        
        // 如果是搜索状态，重新渲染
        if (this.searchService.hasSearchTerm()) {
          this.renderNotes();
        }
      }
    } catch (error) {
      console.error('删除便签失败:', error);
      this.notificationService.error('删除便签失败');
    }
  }

  /**
   * 处理搜索
   */
  handleSearch(searchTerm) {
    const notes = this.notesService.getAllNotes();
    const filteredNotes = this.searchService.performSearch(notes, searchTerm);
    
    // 更新搜索UI状态
    updateSearchUI(
      this.searchInput,
      this.clearSearchButton,
      this.searchBox,
      this.searchService.hasSearchTerm()
    );
    
    // 重新渲染便签
    renderAllNotes(
      filteredNotes,
      this.notesContainer,
      this.searchService,
      this.handleSaveNote,
      this.handleManualSaveNote,
      this.handleDeleteNote
    );
  }

  /**
   * 处理清除搜索
   */
  handleClearSearch() {
    if (this.searchInput) {
      this.searchInput.value = '';
    }
    
    this.searchService.clearSearch();
    
    // 更新搜索UI状态
    updateSearchUI(
      this.searchInput,
      this.clearSearchButton,
      this.searchBox,
      false
    );
    
    // 重新渲染便签
    this.renderNotes();
  }
  
  /**
   * 绑定快捷键事件
   */
  bindShortcutEvents() {
    // 监听来自主进程的搜索框聚焦事件
    if (window.electronAPI && window.electronAPI.shortcuts) {
      window.electronAPI.shortcuts.onFocusSearch(() => {
        if (this.searchInput) {
          this.searchInput.focus();
          console.log('快捷键触发: 聚焦到搜索框');
        }
      });
    }
    
    // 添加便签间导航快捷键
    document.addEventListener('keydown', (e) => {
      // 只有按下Ctrl键时才处理
      if (e.ctrlKey) {
        // 上方向键 - 导航到上一个便签
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.navigateNotes('prev');
        }
        // 下方向键 - 导航到下一个便签
        else if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.navigateNotes('next');
        }
        // Ctrl+N - 创建新便签
        else if (e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          this.handleCreateNote();
        }
        // Ctrl+E - 将焦点移动到便签内容编辑区
        else if (e.key === 'e' || e.key === 'E') {
          e.preventDefault();
          this.focusNoteContent();
        }
        // Ctrl+M - 切换Markdown预览
        else if (e.key === 'm' || e.key === 'M') {
          e.preventDefault();
          
          let targetNoteContainer;
          
          // 优先使用最后获得焦点的便签
          if (this.lastFocusedNoteId) {
            targetNoteContainer = document.querySelector(`.note-container[data-note-id="${this.lastFocusedNoteId}"]`);
          }
          
          // 如果没有最后焦点便签，则使用最大化的便签
          if (!targetNoteContainer) {
            targetNoteContainer = document.querySelector('.note-container.maximized');
          }
          
          // 如果没有最大化的便签，则使用第一个可见的便签
          if (!targetNoteContainer) {
            const visibleNotes = Array.from(document.querySelectorAll('.note-container')).filter(
              note => note.style.display !== 'none'
            );
            if (visibleNotes.length > 0) {
              targetNoteContainer = visibleNotes[0];
            }
          }
          
          if (targetNoteContainer) {
            const textarea = targetNoteContainer.querySelector('.note-content');
            const markdownPreview = targetNoteContainer.querySelector('.markdown-preview');
            
            if (textarea && markdownPreview) {
              // 检查当前是否处于预览模式
              if (markdownPreview.style.display !== 'none' && textarea.style.display === 'none') {
                // 从预览模式切换回编辑模式
                textarea.style.display = 'block';
                markdownPreview.style.display = 'none';
                // 切换回编辑模式后，将焦点设置到文本区域
                textarea.focus();
              } else {
                // 从编辑模式切换到预览模式
                this.toolsService.toggleMarkdownPreview(textarea);
              }
            } else if (textarea) {
              // 如果没有预览元素，则创建一个
              this.toolsService.toggleMarkdownPreview(textarea);
            }
          }
        }
        // Ctrl+M快捷键已移除，仅使用F11作为全屏快捷键
      }
      
      // F11 - 切换当前便签的最大化状态
      if (e.key === 'F11') {
        e.preventDefault();
        const activeElement = document.activeElement;
        let noteContainer = activeElement ? activeElement.closest('.note-container') : null;
        
        // 如果没有找到便签容器（可能是在预览模式下点击了预览区域）
        if (!noteContainer) {
          // 尝试查找当前可能处于预览模式的便签
          const markdownPreview = document.querySelector('.markdown-preview[style*="display: block"]');
          if (markdownPreview) {
            noteContainer = markdownPreview.closest('.note-container');
          }
          
          // 如果仍然没有找到，尝试使用最后一个获得焦点的便签
          if (!noteContainer && this.lastFocusedNoteId) {
            noteContainer = document.querySelector(`.note-container[data-note-id="${this.lastFocusedNoteId}"]`);
          }
          
          // 如果仍然没有找到，尝试使用已经最大化的便签
          if (!noteContainer) {
            noteContainer = document.querySelector('.note-container.maximized');
          }
        }
        
        if (noteContainer) {
          this.toggleMaximizeNote(noteContainer.dataset.noteId);
        }
      }
    });
  }
  
  /**
   * 便签间导航
   * @param {string} direction - 导航方向 ('prev' 或 'next')
   */
  navigateNotes(direction) {
    // 获取所有便签元素
    const noteElements = document.querySelectorAll('.note-container');
    if (noteElements.length <= 1) return; // 只有一个或没有便签时不需要导航
    
    // 找到当前活动的便签
    let activeNoteIndex = -1;
    const activeElement = document.activeElement;
    
    // 检查当前焦点是否在某个便签内
    for (let i = 0; i < noteElements.length; i++) {
      if (noteElements[i].contains(activeElement)) {
        activeNoteIndex = i;
        break;
      }
    }
    
    // 如果没有找到活动便签，尝试使用最后一个获得焦点的便签
    if (activeNoteIndex === -1 && this.lastFocusedNoteId) {
      for (let i = 0; i < noteElements.length; i++) {
        if (noteElements[i].dataset.noteId === this.lastFocusedNoteId) {
          activeNoteIndex = i;
          break;
        }
      }
    }
    
    // 如果仍然没有找到活动便签，默认选择第一个或最后一个
    if (activeNoteIndex === -1) {
      activeNoteIndex = direction === 'next' ? -1 : noteElements.length;
    }
    
    // 计算目标便签索引
    let targetIndex;
    if (direction === 'next') {
      targetIndex = (activeNoteIndex + 1) % noteElements.length;
    } else {
      targetIndex = (activeNoteIndex - 1 + noteElements.length) % noteElements.length;
    }
    
    // 获取目标便签
    const targetNote = noteElements[targetIndex];
    const noteId = targetNote.getAttribute('data-note-id');
    if (!noteId) return;
    
    // 更新最后焦点便签ID
    this.lastFocusedNoteId = noteId;
    
    // 检查是否处于沉浸式模式
    const isMaximized = document.body.classList.contains('has-maximized-note');
    
    if (isMaximized) {
      // 在沉浸式模式下，先将当前便签恢复正常大小，然后将目标便签设为沉浸式模式
      const currentMaximizedNote = document.querySelector('.note-container.maximized');
      if (currentMaximizedNote) {
        currentMaximizedNote.classList.remove('maximized');
      }
      
      // 将目标便签设为沉浸式模式
      targetNote.classList.add('maximized');
      
      // 聚焦到目标便签的内容区域
      const contentTextarea = targetNote.querySelector('.note-content');
      if (contentTextarea) {
        contentTextarea.focus();
      }
    } else {
      // 非沉浸式模式下，聚焦到目标便签的标题输入框
      const titleInput = targetNote.querySelector('.note-title-input');
      if (titleInput) {
        titleInput.focus();
      }
    }
  }
  
  /**
   * 将焦点移动到当前便签的内容编辑区
   */
  focusNoteContent() {
    // 获取当前活动元素
    const activeElement = document.activeElement;
    
    // 查找当前活动元素所在的便签容器
    let noteContainer = null;
    if (activeElement) {
      // 尝试多种可能的便签容器类名
      noteContainer = activeElement.closest('.note-container') || 
                      activeElement.closest('.note') || 
                      activeElement.closest('.sticky-note');
    }
    
    // 如果没有找到便签容器，尝试获取第一个便签
    if (!noteContainer) {
      // 尝试多种可能的便签容器选择器
      const allNotes = document.querySelectorAll('.note-container, .note, .sticky-note');
      
      if (allNotes.length > 0) {
        noteContainer = allNotes[0];
      } else {
        return; // 没有便签，无法聚焦
      }
    }
    
    // 尝试多种可能的内容编辑区选择器
    const contentArea = noteContainer.querySelector('.note-content-input') || 
                        noteContainer.querySelector('.note-content') || 
                        noteContainer.querySelector('textarea') ||
                        noteContainer.querySelector('[contenteditable="true"]');
    
    if (contentArea) {
      contentArea.focus();
    }
  }

  /**
   * 启动时间更新定时器
   */
  startTimeUpdateTimer() {
    // 清除现有定时器（如果有的话）
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
    }
    
    // 每分钟（60000毫秒）更新一次时间显示
    this.timeUpdateInterval = setInterval(() => {
      const notes = this.notesService.getAllNotes();
      updateAllNoteTimes(notes);
    }, 60000);
  }

  /**
   * 停止时间更新定时器
   */
  stopTimeUpdateTimer() {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }
  }

  /**
   * 创建测试便签（开发用）
   */
  async createTestNotes() {
    try {
      await this.notesService.createTestNotes();
      this.renderNotes();
      this.notificationService.success('测试便签已创建');
    } catch (error) {
      console.error('创建测试便签失败:', error);
      this.notificationService.error('创建测试便签失败');
    }
  }
}

// 创建应用实例
const app = new StickyNotesApp();

// 页面加载完成后初始化应用
window.addEventListener('DOMContentLoaded', async () => {
  await app.init();
});

// 导出到全局作用域供开发使用
window.stickyNotesApp = app;
window.createTestNotes = () => app.createTestNotes();

// 全局最大化切换函数
window.toggleMaximize = function(button) {
  const noteContainer = button.closest('.note-container');
  if (!noteContainer) return;
  
  console.log('切换最大化状态', noteContainer.dataset.noteId);
  
  if (noteContainer.classList.contains('maximized')) {
    // 还原便签
    noteContainer.classList.remove('maximized');
    document.body.classList.remove('has-maximized-note'); // 移除body类名
    document.documentElement.classList.remove('has-maximized-note'); // 移除html类名
    button.title = '最大化编辑';
    button.querySelector('svg path').setAttribute('d', 'M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3');
  } else {
    // 最大化便签
    noteContainer.classList.add('maximized');
    document.body.classList.add('has-maximized-note'); // 添加body类名
    document.documentElement.classList.add('has-maximized-note'); // 添加html类名
    button.title = '还原便签';
    button.querySelector('svg path').setAttribute('d', 'M4 14h6m0 0v6m0-6l-7 7m11-3h6m0 0v-6m0 6l-7-7');
    
    // 聚焦到内容编辑区
    setTimeout(() => {
      const contentEditor = noteContainer.querySelector('.note-content');
      if (contentEditor) {
        contentEditor.focus();
      }
    }, 100);
  }
};

/**
 * 初始化工具栏
 */
StickyNotesApp.prototype.initToolbar = function() {
    const tools = [
      {
        id: 'toggle-preview',
        title: '切换Markdown预览',
        iconId: 'toggle-preview-icon',
        handler: (textarea) => this.toolsService.toggleMarkdownPreview(textarea)
      },
      {
        id: 'format-json',
        title: '格式化JSON',
        iconId: 'format-json-icon',
        handler: this.toolsService.formatJson
      },
      {
        id: 'format-text',
        title: '格式化文本',
        iconId: 'format-text-icon',
        handler: this.toolsService.formatText
      },
      {
        id: 'copy',
        title: '复制内容',
        iconId: 'copy-icon',
        handler: this.toolsService.copyText
      },
      {
        id: 'clear',
        title: '清空内容',
        iconId: 'clear-icon',
        handler: this.toolsService.clearText
      }
    ];
    
    return tools;
  }
  
  /**
   * 绑定便签事件
   * @param {Element} noteElement - 便签DOM元素
   * @param {Object} note - 便签数据
   */
  StickyNotesApp.prototype.bindNoteEvents = function(noteElement, note) {
    const titleInput = noteElement.querySelector('.note-title-input');
    const contentTextarea = noteElement.querySelector('.note-content');
    const saveButton = noteElement.querySelector('.save-btn');
    const deleteButton = noteElement.querySelector('.delete-btn');
    const toolsToggleBtn = noteElement.querySelector('.tools-toggle-btn');
    const toolbarWrapper = noteElement.querySelector('.toolbar-wrapper');
    const maximizeButton = noteElement.querySelector('.maximize-btn');
    const togglePreviewButton = noteElement.querySelector('.toggle-preview-btn');
    const markdownPreview = noteElement.querySelector('.markdown-preview');
    
    // 记录便签获得焦点 - 使用mousedown事件代替click，更早捕获
    noteElement.addEventListener('mousedown', () => {
      console.log('便签获得焦点:', note.id);
      this.lastFocusedNoteId = note.id;
    });
    
    // 记录便签获得焦点 - 使用mouseenter事件，当鼠标进入便签时记录
    noteElement.addEventListener('mouseenter', () => {
      console.log('鼠标进入便签:', note.id);
      this.lastFocusedNoteId = note.id;
    });
    
    // 记录文本区域获得焦点
    if (contentTextarea) {
      contentTextarea.addEventListener('focus', () => {
        console.log('文本区域获得焦点:', note.id);
        this.lastFocusedNoteId = note.id;
      });
      
      // 添加点击事件
      contentTextarea.addEventListener('click', () => {
        console.log('点击文本区域:', note.id);
        this.lastFocusedNoteId = note.id;
      });
    }
    
    // 记录标题获得焦点
    if (titleInput) {
      titleInput.addEventListener('focus', () => {
        console.log('标题获得焦点:', note.id);
        this.lastFocusedNoteId = note.id;
      });
      
      // 添加点击事件
      titleInput.addEventListener('click', () => {
        console.log('点击标题:', note.id);
        this.lastFocusedNoteId = note.id;
      });
    }
    
    // 记录预览区域获得焦点
    const previewElement = noteElement.querySelector('.markdown-preview');
    if (previewElement) {
      previewElement.addEventListener('click', () => {
        console.log('点击预览区域:', note.id);
        this.lastFocusedNoteId = note.id;
      });
    }
  
  // 最大化按钮点击事件
  if (maximizeButton) {
    console.log('绑定最大化按钮事件', note.id);
    const self = this; // 保存this引用
    maximizeButton.addEventListener('click', function() {
      console.log('最大化按钮被点击', note.id);
      self.toggleMaximizeNote(note.id);
    });
  }
  
  // 标题输入事件
  if (titleInput) {
    titleInput.addEventListener('input', () => {
      this.handleSaveNote(note.id, {
        title: titleInput.value.trim() || `便签 ${note.id}`
      });
    });
  }
  
  // 内容输入事件
  if (contentTextarea) {
    contentTextarea.addEventListener('input', () => {
      this.handleSaveNote(note.id, {
        content: contentTextarea.value
      });
      
      // 如果预览区域存在且可见，则更新预览内容
      if (markdownPreview && markdownPreview.style.display !== 'none') {
        this.updateMarkdownPreview(contentTextarea, markdownPreview);
      }
    });
  }
  
  // 保存按钮点击事件
  if (saveButton) {
    saveButton.addEventListener('click', () => {
      this.handleManualSaveNote(note.id, {
        title: titleInput ? titleInput.value.trim() || `便签 ${note.id}` : note.title,
        content: contentTextarea ? contentTextarea.value : note.content
      });
    });
  }
  
  // 删除按钮点击事件
  if (deleteButton) {
    deleteButton.addEventListener('click', () => {
      if (confirm('确定要删除这个便签吗？')) {
        this.handleDeleteNote(note.id);
      }
    });
  }
  
  // Markdown预览切换按钮点击事件
  if (togglePreviewButton && markdownPreview) {
    togglePreviewButton.addEventListener('click', () => {
      if (contentTextarea.style.display === 'none') {
        // 切换到编辑模式
        contentTextarea.style.display = 'block';
        markdownPreview.style.display = 'none';
        togglePreviewButton.title = '预览Markdown';
      } else {
        // 切换到预览模式
        contentTextarea.style.display = 'none';
        markdownPreview.style.display = 'block';
        this.updateMarkdownPreview(contentTextarea, markdownPreview);
        togglePreviewButton.title = '编辑内容';
      }
    });
  }
  
  // 工具栏切换按钮点击事件
  if (toolsToggleBtn && toolbarWrapper) {
    toolsToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // 阻止事件冒泡
      toolbarWrapper.classList.toggle('active');
    });
  }
  
  // 点击文档其他区域关闭工具栏
  document.addEventListener('click', (e) => {
    const allToolbarWrappers = document.querySelectorAll('.toolbar-wrapper');
    allToolbarWrappers.forEach(wrapper => {
      if (!wrapper.contains(e.target) && 
          !e.target.closest('.tools-toggle-btn') &&
          wrapper.classList.contains('active')) {
        wrapper.classList.remove('active');
      }
    });
  });
}

// 已移动到tools.js中实现