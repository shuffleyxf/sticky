/**
 * 存储服务 - 负责数据的加载、保存和备份
 */
class StorageService {
  constructor() {
    this.isElectronAvailable = typeof window !== 'undefined' && window.electronAPI;
    this.saveTimeout = null; // 防抖保存定时器
    this.autoSaveInterval = null; // 自动保存间隔定时器
    this.pendingData = null; // 待保存的数据
    this.autoSaveIntervalMs = 30000; // 30秒自动保存一次
  }

  /**
   * 加载数据
   * @returns {Promise<Object>} 包含notes、nextId和lastModified的数据对象
   */
  async loadData() {
    try {
      if (this.isElectronAvailable) {
        console.log('使用文件存储加载数据...');
        const data = await window.electronAPI.storage.read();
        
        if (data && data.notes) {
          console.log('从文件存储加载数据成功');
          return data;
        } else {
          console.log('文件存储为空，尝试从localStorage恢复...');
          return this.loadFromLocalStorage();
        }
      } else {
        console.log('Electron不可用，使用localStorage...');
        return this.loadFromLocalStorage();
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      console.log('尝试从localStorage恢复...');
      return this.loadFromLocalStorage();
    }
  }

  /**
   * 从localStorage加载数据
   * @returns {Object} 数据对象或默认数据
   */
  loadFromLocalStorage() {
    try {
      const savedData = localStorage.getItem('stickyNotes');
      if (savedData) {
        console.log('从localStorage加载数据成功');
        return JSON.parse(savedData);
      }
    } catch (error) {
      console.error('从localStorage加载数据失败:', error);
    }
    
    console.log('返回默认数据');
    return {
      notes: [],
      nextId: 1,
      lastModified: new Date().toISOString()
    };
  }

  /**
   * 保存数据
   * @param {Object} data 要保存的数据
   */
  async saveData(data) {
    try {
      if (this.isElectronAvailable) {
        console.log('使用文件存储保存数据...');
        await window.electronAPI.storage.write(data);
        console.log('文件存储保存成功');
        
        // 同时保存到localStorage作为备份
        this.saveToLocalStorage(data);
      } else {
        console.log('Electron不可用，使用localStorage保存...');
        this.saveToLocalStorage(data);
      }
    } catch (error) {
      console.error('保存数据失败:', error);
      console.log('尝试保存到localStorage...');
      this.saveToLocalStorage(data);
    }
  }

  /**
   * 保存到localStorage
   * @param {Object} data 要保存的数据
   */
  saveToLocalStorage(data) {
    try {
      localStorage.setItem('stickyNotes', JSON.stringify(data));
      console.log('localStorage保存成功');
    } catch (error) {
      console.error('localStorage保存失败:', error);
    }
  }

  /**
   * 创建备份
   */
  async createBackup() {
    if (this.isElectronAvailable) {
      try {
        await window.electronAPI.storage.backup();
        console.log('备份创建成功');
      } catch (error) {
        console.error('创建备份失败:', error);
      }
    }
  }

  /**
   * 获取存储信息
   * @returns {Promise<Object|null>} 存储路径信息
   */
  async getStorageInfo() {
    if (this.isElectronAvailable) {
      try {
        return await window.electronAPI.storage.getPath();
      } catch (error) {
        console.error('获取存储路径失败:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * 设置自动备份
   */
  setupAutoBackup() {
    if (this.isElectronAvailable) {
      // 每30分钟自动备份一次
      setInterval(() => {
        this.createBackup();
      }, 30 * 60 * 1000);
    }
  }

  /**
   * 防抖保存 - 避免频繁保存
   * @param {Object} data 要保存的数据
   */
  debouncedSave(data) {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = setTimeout(() => {
      this.saveData(data);
    }, 1000); // 1秒后保存，用户输入停止后快速响应
  }

  /**
   * 防抖保存（带回调） - 避免频繁保存，保存完成后执行回调
   * @param {Object} data 要保存的数据
   * @param {Function} callback 保存完成后的回调函数
   */
  debouncedSaveWithNotification(data, callback) {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = setTimeout(async () => {
      try {
        await this.saveData(data);
        if (callback) {
          callback();
        }
      } catch (error) {
        console.error('防抖保存失败:', error);
      }
    }, 1000); // 1秒后保存
  }

  /**
   * 启动自动保存间隔
   */
  startAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    
    this.autoSaveInterval = setInterval(() => {
      if (this.pendingData) {
        console.log('执行定期自动保存...');
        this.saveData(this.pendingData);
      }
    }, this.autoSaveIntervalMs);
    
    console.log(`自动保存已启动，间隔: ${this.autoSaveIntervalMs / 1000}秒`);
  }

  /**
   * 停止自动保存间隔
   */
  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
      console.log('自动保存已停止');
    }
  }

  /**
   * 设置待保存的数据（用于自动保存）
   * @param {Object} data 要保存的数据
   */
  setPendingData(data) {
    this.pendingData = data;
  }

  /**
   * 清除待保存的数据
   */
  clearPendingData() {
    this.pendingData = null;
  }
}

export default StorageService;