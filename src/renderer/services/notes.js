/**
 * 便签服务 - 负责便签的创建、读取、更新、删除操作
 */
class NotesService {
  constructor(storageService, notificationService) {
    this.storageService = storageService;
    this.notificationService = notificationService;
    this.notes = [];
    this.nextNoteId = 1;
  }

  /**
   * 初始化便签数据
   */
  async initialize() {
    try {
      const data = await this.storageService.loadData();
      this.notes = data.notes || [];
      this.nextNoteId = data.nextId || 1;
      
      // 为旧便签添加时间字段兼容性
      const now = new Date().toISOString();
      this.notes.forEach(note => {
        if (!note.createdAt) {
          note.createdAt = now;
        }
        if (!note.updatedAt) {
          note.updatedAt = note.createdAt;
        }
      });
      
      // 如果从文件加载的数据为空，尝试从localStorage恢复
      if (this.notes.length === 0) {
        const localData = this.storageService.loadFromLocalStorage();
        if (localData && localData.notes && localData.notes.length > 0) {
          this.notes = localData.notes;
          this.nextNoteId = localData.nextId;
          
          // 为恢复的便签也添加时间字段
          this.notes.forEach(note => {
            if (!note.createdAt) {
              note.createdAt = now;
            }
            if (!note.updatedAt) {
              note.updatedAt = note.createdAt;
            }
          });
          
          // 将数据同步到文件存储
          await this.saveAllNotes();
          this.notificationService.show('已从本地备份恢复数据');
        }
      }
      
      // 显示存储信息（仅在开发模式下）
      const storageInfo = await this.storageService.getStorageInfo();
      if (storageInfo) {
        console.log('数据存储位置:', storageInfo.dataFile);
      }
    } catch (error) {
      console.error('初始化便签失败:', error);
      this.notificationService.show('加载便签失败，请检查存储权限');
    }
  }

  /**
   * 获取所有便签
   * @returns {Array} 便签数组
   */
  getAllNotes() {
    return this.notes;
  }

  /**
   * 根据ID获取便签
   * @param {number} noteId 便签ID
   * @returns {Object|null} 便签对象或null
   */
  getNoteById(noteId) {
    return this.notes.find(note => note.id === noteId) || null;
  }

  /**
   * 创建新便签
   * @returns {Object} 新创建的便签对象
   */
  async createNewNote() {
    const now = new Date().toISOString();
    const newNote = {
      id: this.nextNoteId++,
      title: `便签 ${this.notes.length + 1}`,
      content: '',
      createdAt: now,
      updatedAt: now
    };
    
    this.notes.push(newNote);
    await this.saveAllNotes();
    this.notificationService.show('新便签已创建！');
    
    return newNote;
  }

  /**
   * 更新便签（自动保存，无通知）
   * @param {number} noteId 便签ID
   * @param {Object} updates 更新的字段
   */
  async updateNote(noteId, updates) {
    const note = this.getNoteById(noteId);
    if (!note) {
      console.error('无法找到便签:', noteId);
      return false;
    }
    
    // 更新字段
    Object.assign(note, updates);
    note.updatedAt = new Date().toISOString();
    
    // 准备保存数据
    const data = {
      notes: this.notes,
      nextId: this.nextNoteId,
      lastModified: new Date().toISOString()
    };
    
    // 设置待保存数据（用于定期自动保存）
    this.storageService.setPendingData(data);
    
    // 使用防抖保存（用户输入停止后短时间内保存，无通知）
    this.storageService.debouncedSave(data);
    
    return true;
  }

  /**
   * 手动保存便签（显示通知）
   * @param {number} noteId 便签ID
   * @param {Object} updates 更新的字段
   */
  async saveNoteManually(noteId, updates) {
    const note = this.getNoteById(noteId);
    if (!note) {
      console.error('无法找到便签:', noteId);
      return false;
    }
    
    // 立即显示保存通知
    this.notificationService.show('便签已保存！');
    
    // 更新字段
    Object.assign(note, updates);
    note.updatedAt = new Date().toISOString();
    
    // 立即保存数据
    await this.saveAllNotes();
    
    return true;
  }

  /**
   * 删除便签
   * @param {number} noteId 便签ID
   */
  async deleteNote(noteId) {
    const noteIndex = this.notes.findIndex(n => n.id === noteId);
    if (noteIndex === -1) {
      return false;
    }

    this.notes.splice(noteIndex, 1);
    await this.saveAllNotes();
    this.notificationService.show('便签已删除！');
    
    return true;
  }

  /**
   * 保存所有便签到存储
   */
  async saveAllNotes() {
    try {
      const data = {
        notes: this.notes,
        nextId: this.nextNoteId,
        lastModified: new Date().toISOString()
      };
      
      await this.storageService.saveData(data);
    } catch (error) {
      console.error('保存便签失败:', error);
      this.notificationService.show('保存失败，数据已保存到本地备份');
    }
  }

  /**
   * 搜索便签
   * @param {string} searchTerm 搜索关键词
   * @returns {Array} 匹配的便签数组
   */
  searchNotes(searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
      return this.notes;
    }
    
    const term = searchTerm.toLowerCase().trim();
    return this.notes.filter(note => {
      const title = note.title ? note.title.toLowerCase() : '';
      const content = note.content ? note.content.toLowerCase() : '';
      return title.includes(term) || content.includes(term);
    });
  }

  /**
   * 创建测试便签（开发用）
   */
  async createTestNotes() {
    const now = new Date();
    
    // 创建5分钟前的便签
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
    const testNote1 = {
      id: this.nextNoteId++,
      title: '5分钟前的便签',
      content: '这是5分钟前创建的便签',
      createdAt: fiveMinutesAgo,
      updatedAt: fiveMinutesAgo
    };
    
    // 创建2小时前的便签
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
    const testNote2 = {
      id: this.nextNoteId++,
      title: '2小时前的便签',
      content: '这是2小时前创建的便签',
      createdAt: twoHoursAgo,
      updatedAt: twoHoursAgo
    };
    
    // 创建3天前的便签
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const testNote3 = {
      id: this.nextNoteId++,
      title: '3天前的便签',
      content: '这是3天前创建的便签',
      createdAt: threeDaysAgo,
      updatedAt: threeDaysAgo
    };
    
    this.notes.push(testNote1, testNote2, testNote3);
    await this.saveAllNotes();
    
    console.log('测试便签已创建');
    return [testNote1, testNote2, testNote3];
  }
}

export default NotesService;