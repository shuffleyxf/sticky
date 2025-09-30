/**
 * 便签应用主入口文件
 * 整合所有服务和工具模块，管理应用的初始化和事件绑定
 */

// 导入服务模块
import StorageService from './services/storage.js';
import NotesService from './services/notes.js';
import SearchService from './services/search.js';
import NotificationService from './services/notification.js';

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
    
    // DOM元素
    this.notesContainer = null;
    this.newNoteButton = null;
    this.searchInput = null;
    this.clearSearchButton = null;
    this.searchBox = null;
    
    // 定时器
    this.timeUpdateInterval = null;
    
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
    
    // 重新渲染所有便签
    this.renderNotes();
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