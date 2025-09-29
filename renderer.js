// 存储管理器
class StorageManager {
  constructor() {
    this.isElectronAvailable = typeof window !== 'undefined' && window.electronAPI;
    this.saveTimeout = null;
  }

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

  saveToLocalStorage(data) {
    try {
      localStorage.setItem('stickyNotes', JSON.stringify(data));
      console.log('localStorage保存成功');
    } catch (error) {
      console.error('localStorage保存失败:', error);
    }
  }

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

  setupAutoBackup() {
    if (this.isElectronAvailable) {
      // 每5分钟自动备份一次
      setInterval(() => {
        this.createBackup();
      }, 5 * 60 * 1000);
    }
  }

  debouncedSave(data) {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = setTimeout(async () => {
      await this.saveData(data);
    }, 500);
  }
}

// 创建存储管理器实例
const storageManager = new StorageManager();

// 获取DOM元素
const notesContainer = document.getElementById('notes-container');
const newNoteButton = document.getElementById('newNoteBtn');
const noteTemplate = document.getElementById('note-template');
const searchInput = document.getElementById('searchInput');
const clearSearchButton = document.getElementById('clearSearch');

// 便签数据存储
let notes = [];
let nextNoteId = 1;
let filteredNotes = []; // 搜索过滤后的便签
let currentSearchTerm = ''; // 当前搜索关键词

// 自动更新定时器
let timeUpdateInterval = null;

// 从存储加载保存的便签内容
window.onload = async function() {
  await loadNotes();
  
  // 如果没有便签，创建一个新便签
  if (notes.length === 0) {
    createNewNote();
  }
  
  // 启动自动备份
  storageManager.setupAutoBackup();
  
  // 启动时间自动更新定时器
  startTimeUpdateTimer();
};

// 创建一个显示通知的函数
function showNotification(message) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.position = 'fixed';
  notification.style.bottom = '20px';
  notification.style.right = '20px';
  notification.style.backgroundColor = '#4CAF50';
  notification.style.color = 'white';
  notification.style.padding = '10px 20px';
  notification.style.borderRadius = '4px';
  notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  notification.style.zIndex = '1000';
  
  document.body.appendChild(notification);
  
  // 2秒后自动移除通知
  setTimeout(() => {
    document.body.removeChild(notification);
  }, 2000);
}

// 时间格式化函数
function formatTime(timestamp) {
  if (!timestamp) return '刚刚创建';
  
  const now = new Date();
  const time = new Date(timestamp);
  
  // 检查时间对象是否有效
  if (isNaN(time.getTime())) {
    console.error('无效的时间戳:', timestamp);
    return '时间错误';
  }
  
  const diffMs = now.getTime() - time.getTime();
  
  // 如果时间差为负数或者非常小，说明是刚创建的
  if (diffMs < 0 || diffMs < 1000) {
    return '刚刚';
  }
  
  // 计算时间差
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (seconds < 60) {
    return '刚刚';
  } else if (minutes < 60) {
    return `${minutes}分钟前`;
  } else if (hours < 24) {
    return `${hours}小时前`;
  } else if (days < 7) {
    return `${days}天前`;
  } else {
    // 超过一周显示具体日期
    return time.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric'
    });
  }
}

// 从存储加载便签
async function loadNotes() {
  try {
    const data = await storageManager.loadData();
    notes = data.notes || [];
    nextNoteId = data.nextId || 1;
    
    // 为旧便签添加时间字段兼容性
    const now = new Date().toISOString();
    notes.forEach(note => {
      if (!note.createdAt) {
        note.createdAt = now;
      }
      if (!note.updatedAt) {
        note.updatedAt = note.createdAt;
      }
    });
    
    // 如果从文件加载的数据为空，尝试从localStorage恢复
    if (notes.length === 0) {
      const localData = storageManager.loadFromLocalStorage();
      if (localData && localData.notes && localData.notes.length > 0) {
        notes = localData.notes;
        nextNoteId = localData.nextId;
        
        // 为恢复的便签也添加时间字段
        notes.forEach(note => {
          if (!note.createdAt) {
            note.createdAt = now;
          }
          if (!note.updatedAt) {
            note.updatedAt = note.createdAt;
          }
        });
        
        // 将数据同步到文件存储
        await saveAllNotes();
        showNotification('已从本地备份恢复数据');
      }
    }
    
    // 渲染所有便签
    renderAllNotes();
    
    // 显示存储信息（仅在开发模式下）
    const storageInfo = await storageManager.getStorageInfo();
    if (storageInfo) {
      console.log('数据存储位置:', storageInfo.dataFile);
    }
  } catch (error) {
    console.error('加载便签失败:', error);
    showNotification('加载便签失败，请检查存储权限');
  }
}

// 保存所有便签到存储
async function saveAllNotes() {
  try {
    const data = {
      notes: notes,
      nextId: nextNoteId,
      lastModified: new Date().toISOString()
    };
    
    await storageManager.saveData(data);
  } catch (error) {
    console.error('保存便签失败:', error);
    showNotification('保存失败，数据已保存到本地备份');
  }
}

// 创建新便签
async function createNewNote() {
  const now = new Date().toISOString();
  const newNote = {
    id: nextNoteId++,
    title: `便签 ${notes.length + 1}`,
    content: '',
    createdAt: now,
    updatedAt: now
  };
  
  notes.push(newNote);
  await saveAllNotes();
  renderNote(newNote);
}

// 渲染所有便签
function renderAllNotes() {
  notesContainer.innerHTML = '';
  const notesToRender = currentSearchTerm ? filteredNotes : notes;
  notesToRender.forEach(note => renderNote(note));
  
  // 如果搜索后没有结果，显示提示
  if (currentSearchTerm && filteredNotes.length === 0) {
    showSearchEmptyState();
  }
}

// 渲染单个便签
function renderNote(note) {
  const noteElement = document.importNode(noteTemplate.content, true);
  const noteContainer = noteElement.querySelector('.note-container');
  
  // 设置便签ID
  noteContainer.dataset.noteId = note.id;
  
  // 设置便签标题
  const noteTitleInput = noteElement.querySelector('.note-title-input');
  noteTitleInput.value = note.title;
  
  // 搜索时不需要额外的视觉效果，只显示匹配的便签
  
  // 设置便签内容
  const noteContent = noteElement.querySelector('.note-content');
  noteContent.value = note.content;
  
  // 设置时间显示
  const noteDateElement = noteElement.querySelector('.note-date');
  if (noteDateElement) {
    // 优先显示修改时间，如果没有则显示创建时间
    const displayTime = note.updatedAt || note.createdAt;
    noteDateElement.textContent = formatTime(displayTime);
  }
  
  // 添加标题变化事件
  noteTitleInput.addEventListener('input', function() {
    const index = notes.findIndex(n => n.id === note.id);
    if (index !== -1) {
      notes[index].title = noteTitleInput.value;
      saveAllNotes();
    }
  });
  
  // 添加标题失去焦点事件（保存标题）
  noteTitleInput.addEventListener('blur', function() {
    const index = notes.findIndex(n => n.id === note.id);
    if (index !== -1) {
      notes[index].title = noteTitleInput.value;
      saveAllNotes();
    }
  });
  
  // 添加保存按钮事件
  const saveButton = noteElement.querySelector('.save-btn');
  saveButton.addEventListener('click', function() {
    saveNote(note.id);
    noteContent.focus();
  });
  
  // 添加删除按钮事件
  const deleteButton = noteElement.querySelector('.delete-btn');
  deleteButton.addEventListener('click', function() {
    deleteNote(note.id);
  });
  
  // 添加内容变化事件
  noteContent.addEventListener('input', function() {
    // 自动保存功能
    const index = notes.findIndex(n => n.id === note.id);
    if (index !== -1) {
      notes[index].content = noteContent.value;
    }
  });
  
  notesContainer.appendChild(noteElement);
}

// 保存便签
async function saveNote(noteId) {
  const note = notes.find(n => n.id === noteId);
  if (!note) return;

  const titleInput = document.querySelector(`[data-note-id="${noteId}"] .note-title-input`);
  const contentTextarea = document.querySelector(`[data-note-id="${noteId}"] .note-content`);
  
  if (!titleInput || !contentTextarea) {
    console.error('无法找到便签元素:', noteId);
    return;
  }
  
  note.title = titleInput.value.trim() || `便签 ${noteId}`;
  note.content = contentTextarea.value.trim();
  note.updatedAt = new Date().toISOString();
  
  // 更新时间显示
  const noteElement = document.querySelector(`[data-note-id="${noteId}"]`);
  if (noteElement) {
    const dateElement = noteElement.querySelector('.note-date');
    if (dateElement) {
      dateElement.textContent = formatTime(note.updatedAt);
    }
  }
  
  const data = {
    notes: notes,
    nextId: nextNoteId,
    lastModified: new Date().toISOString()
  };
  
  storageManager.debouncedSave(data);
  showNotification('便签已保存！');
}

// 删除便签
async function deleteNote(noteId) {
  const noteIndex = notes.findIndex(n => n.id === noteId);
  if (noteIndex === -1) return;

  const noteElement = document.querySelector(`[data-note-id="${noteId}"]`);
  if (noteElement) {
    noteElement.remove();
  }

  notes.splice(noteIndex, 1);
  await saveAllNotes();
  showNotification('便签已删除！');
}

// 搜索功能实现
function performSearch(searchTerm) {
  currentSearchTerm = searchTerm.toLowerCase().trim();
  
  if (currentSearchTerm === '') {
    filteredNotes = [];
    clearSearchButton.style.display = 'none';
  } else {
    // 根据标题搜索便签
    filteredNotes = notes.filter(note => {
      const title = note.title ? note.title.toLowerCase() : '';
      return title.includes(currentSearchTerm);
    });
    clearSearchButton.style.display = 'flex';
  }
  
  renderAllNotes();
}

function clearSearch() {
  searchInput.value = '';
  currentSearchTerm = '';
  filteredNotes = [];
  clearSearchButton.style.display = 'none';
  renderAllNotes();
}

function showSearchEmptyState() {
  const emptyState = document.createElement('div');
  emptyState.className = 'search-empty-state';
  emptyState.innerHTML = `
    <div class="empty-state-content">
      <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
      <h3>未找到匹配的便签</h3>
      <p>尝试使用其他关键词搜索，或者<button class="link-btn" onclick="clearSearch()">清除搜索</button></p>
    </div>
  `;
  notesContainer.appendChild(emptyState);
}

function highlightSearchTerm(text, searchTerm) {
  if (!searchTerm || !text) return text;
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark class="search-highlight">$1</mark>');
}

// 更新所有便签的时间显示
function updateAllNoteTimes() {
  const noteElements = document.querySelectorAll('.note-container');
  
  noteElements.forEach(noteElement => {
    const noteId = parseInt(noteElement.dataset.noteId);
    const note = notes.find(n => n.id === noteId);
    
    if (note) {
      const dateElement = noteElement.querySelector('.note-date');
      if (dateElement) {
        // 优先显示修改时间，如果没有则显示创建时间
        const displayTime = note.updatedAt || note.createdAt;
        dateElement.textContent = formatTime(displayTime);
      }
    }
  });
}

// 启动自动更新定时器
function startTimeUpdateTimer() {
  // 清除现有定时器（如果有的话）
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval);
  }
  
  // 每分钟（60000毫秒）更新一次时间显示
  timeUpdateInterval = setInterval(updateAllNoteTimes, 60000);
}

// 停止自动更新定时器
function stopTimeUpdateTimer() {
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval);
    timeUpdateInterval = null;
  }
}

// 添加事件监听器
newNoteButton.addEventListener('click', createNewNote);

// 搜索框事件监听器
searchInput.addEventListener('input', (e) => {
  performSearch(e.target.value);
});

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    clearSearch();
  }
});

clearSearchButton.addEventListener('click', clearSearch);

// 测试函数 - 创建不同时间的便签用于测试
window.createTestNotes = function() {
  const now = new Date();
  
  // 创建5分钟前的便签
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
  const testNote1 = {
    id: nextNoteId++,
    title: '5分钟前的便签',
    content: '这是5分钟前创建的便签',
    createdAt: fiveMinutesAgo,
    updatedAt: fiveMinutesAgo
  };
  
  // 创建2小时前的便签
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
  const testNote2 = {
    id: nextNoteId++,
    title: '2小时前的便签',
    content: '这是2小时前创建的便签',
    createdAt: twoHoursAgo,
    updatedAt: twoHoursAgo
  };
  
  // 创建3天前的便签
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const testNote3 = {
    id: nextNoteId++,
    title: '3天前的便签',
    content: '这是3天前创建的便签',
    createdAt: threeDaysAgo,
    updatedAt: threeDaysAgo
  };
  
  notes.push(testNote1, testNote2, testNote3);
  renderAllNotes();
  saveAllNotes();
  
  console.log('测试便签已创建');
};

// 页面卸载时清理定时器
window.addEventListener('beforeunload', () => {
  stopTimeUpdateTimer();
});