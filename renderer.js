// 获取DOM元素
const notesContainer = document.getElementById('notes-container');
const newNoteButton = document.getElementById('newNoteBtn');
const noteTemplate = document.getElementById('note-template');

// 便签数据存储
let notes = [];
let nextNoteId = 1;

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
  notes.forEach(note => renderNote(note));
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

// 添加新建便签按钮事件
newNoteButton.addEventListener('click', createNewNote);