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

// 从localStorage加载保存的便签内容
window.onload = function() {
  loadNotes();
  
  // 如果没有便签，创建一个新便签
  if (notes.length === 0) {
    createNewNote();
  }
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

// 从localStorage加载便签
function loadNotes() {
  const savedNotes = localStorage.getItem('stickyNotes');
  if (savedNotes) {
    notes = JSON.parse(savedNotes);
    // 找出最大ID值，用于新便签ID生成
    nextNoteId = Math.max(...notes.map(note => note.id), 0) + 1;
    
    // 渲染所有便签
    renderAllNotes();
  }
}

// 保存所有便签到localStorage
function saveAllNotes() {
  localStorage.setItem('stickyNotes', JSON.stringify(notes));
}

// 创建新便签
function createNewNote() {
  const newNote = {
    id: nextNoteId++,
    title: `便签 ${notes.length + 1}`,
    content: ''
  };
  
  notes.push(newNote);
  saveAllNotes();
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
    saveNote(note.id, noteContent.value);
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

// 保存便签内容
function saveNote(noteId, content) {
  const index = notes.findIndex(note => note.id === noteId);
  if (index !== -1) {
    notes[index].content = content;
    saveAllNotes();
    showNotification('便签已保存！');
  }
}

// 删除便签
function deleteNote(noteId) {
  const index = notes.findIndex(note => note.id === noteId);
  if (index !== -1) {
    notes.splice(index, 1);
    saveAllNotes();
    
    // 从DOM中移除便签
    const noteElement = document.querySelector(`.note-container[data-note-id="${noteId}"]`);
    if (noteElement) {
      notesContainer.removeChild(noteElement);
    }
    
    showNotification('便签已删除！');
  }
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