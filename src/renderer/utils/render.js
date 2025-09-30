/**
 * 渲染工具函数
 */

import { formatTime } from './time.js';
import { createElement, getElement } from './dom.js';

/**
 * 渲染单个便签
 * @param {Object} note 便签对象
 * @param {Object} searchService 搜索服务实例
 * @param {Function} onAutoSave 自动保存回调函数
 * @param {Function} onManualSave 手动保存回调函数
 * @param {Function} onDelete 删除回调函数
 * @returns {Element} 便签DOM元素
 */
export function renderNote(note, searchService, onAutoSave, onManualSave, onDelete) {
  const noteTemplate = getElement('#note-template');
  if (!noteTemplate) {
    console.error('找不到便签模板');
    return null;
  }
  
  const noteClone = noteTemplate.content.cloneNode(true);
  const noteContainer = noteClone.querySelector('.note-container');
  
  // 设置便签ID
  noteContainer.dataset.noteId = note.id;
  
  // 获取各个元素
  const titleInput = noteClone.querySelector('.note-title-input');
  const contentTextarea = noteClone.querySelector('.note-content');
  const dateElement = noteClone.querySelector('.note-date');
  const saveButton = noteClone.querySelector('.save-btn');
  const deleteButton = noteClone.querySelector('.delete-btn');
  
  // 设置内容
  if (titleInput) {
    titleInput.value = note.title || '';
    
    // 如果有搜索关键词，高亮显示
    if (searchService && searchService.hasSearchTerm()) {
      const highlightedTitle = searchService.highlightSearchTerm(note.title || '');
      // 注意：这里不能直接设置innerHTML到input，需要特殊处理
      titleInput.setAttribute('data-highlighted', highlightedTitle);
    }
  }
  
  if (contentTextarea) {
    contentTextarea.value = note.content || '';
    
    // 如果有搜索关键词，高亮显示
    if (searchService && searchService.hasSearchTerm()) {
      const highlightedContent = searchService.highlightSearchTerm(note.content || '');
      contentTextarea.setAttribute('data-highlighted', highlightedContent);
    }
  }
  
  if (dateElement) {
    // 优先显示修改时间，如果没有则显示创建时间
    const displayTime = note.updatedAt || note.createdAt;
    dateElement.textContent = formatTime(displayTime);
  }
  
  // 添加事件监听器
  if (titleInput && onAutoSave) {
    titleInput.addEventListener('input', () => {
      onAutoSave(note.id, {
        title: titleInput.value.trim() || `便签 ${note.id}`
      });
    });
  }
  
  if (contentTextarea && onAutoSave) {
    contentTextarea.addEventListener('input', () => {
      onAutoSave(note.id, {
        content: contentTextarea.value.trim()
      });
    });
  }
  
  if (saveButton && onManualSave) {
    saveButton.addEventListener('click', () => {
      // 手动保存：获取当前输入的内容并保存
      const currentTitle = titleInput ? titleInput.value.trim() : note.title;
      const currentContent = contentTextarea ? contentTextarea.value.trim() : note.content;
      
      onManualSave(note.id, {
        title: currentTitle || `便签 ${note.id}`,
        content: currentContent || ''
      });
    });
  }

  if (deleteButton && onDelete) {
    deleteButton.addEventListener('click', () => {
      onDelete(note.id);
    });
  }
  
  return noteContainer;
}

/**
 * 渲染所有便签
 * @param {Array} notes 便签数组
 * @param {Element} container 容器元素
 * @param {Object} searchService 搜索服务实例
 * @param {Function} onAutoSave 自动保存回调函数
 * @param {Function} onManualSave 手动保存回调函数
 * @param {Function} onDelete 删除回调函数
 */
export function renderAllNotes(notes, container, searchService, onAutoSave, onManualSave, onDelete) {
  if (!container) {
    console.error('找不到便签容器');
    return;
  }
  
  // 清空容器
  container.innerHTML = '';
  
  // 确定要渲染的便签列表
  let notesToRender = notes;
  
  if (searchService && searchService.hasSearchTerm()) {
    notesToRender = searchService.getFilteredNotes();
    
    // 如果搜索结果为空，显示空状态
    if (notesToRender.length === 0) {
      showSearchEmptyState(container, searchService.getCurrentSearchTerm());
      return;
    }
  }
  
  // 如果没有便签，显示空状态
  if (notesToRender.length === 0) {
    showEmptyState(container);
    return;
  }
  
  // 渲染便签
  notesToRender.forEach(note => {
    const noteElement = renderNote(note, searchService, onAutoSave, onManualSave, onDelete);
    if (noteElement) {
      container.appendChild(noteElement);
    }
  });
}

/**
 * 显示搜索空状态
 * @param {Element} container 容器元素
 * @param {string} searchTerm 搜索关键词
 */
export function showSearchEmptyState(container, searchTerm) {
  const emptyState = createElement('div', {
    className: 'search-empty-state'
  });
  
  emptyState.innerHTML = `
    <div class="empty-state-content">
      <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
      <h3>未找到匹配的便签</h3>
      <p>没有找到包含 "<strong>${searchTerm}</strong>" 的便签</p>
      <p>尝试使用其他关键词搜索，或者<button class="link-btn" onclick="clearSearch()">清除搜索</button></p>
    </div>
  `;
  
  container.appendChild(emptyState);
}

/**
 * 显示空状态
 * @param {Element} container 容器元素
 */
export function showEmptyState(container) {
  const emptyState = createElement('div', {
    className: 'empty-state'
  });
  
  emptyState.innerHTML = `
    <div class="empty-state-content">
      <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10,9 9,9 8,9"/>
      </svg>
      <h3>还没有便签</h3>
      <p>点击"新建便签"按钮创建你的第一个便签</p>
    </div>
  `;
  
  container.appendChild(emptyState);
}

/**
 * 更新便签时间显示
 * @param {Array} notes 便签数组
 */
export function updateAllNoteTimes(notes) {
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

/**
 * 更新搜索UI状态
 * @param {Element} searchInput 搜索输入框
 * @param {Element} clearButton 清除按钮
 * @param {Element} searchBox 搜索框容器
 * @param {boolean} hasSearchTerm 是否有搜索关键词
 */
export function updateSearchUI(searchInput, clearButton, searchBox, hasSearchTerm) {
  if (clearButton) {
    if (hasSearchTerm) {
      clearButton.classList.add('show');
    } else {
      clearButton.classList.remove('show');
    }
  }
  
  if (searchBox) {
    if (hasSearchTerm) {
      searchBox.classList.add('has-content');
    } else {
      searchBox.classList.remove('has-content');
    }
  }
}

/**
 * 滚动到指定便签
 * @param {number} noteId 便签ID
 */
export function scrollToNote(noteId) {
  const noteElement = document.querySelector(`[data-note-id="${noteId}"]`);
  if (noteElement) {
    noteElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
    
    // 添加高亮效果
    noteElement.classList.add('highlight');
    setTimeout(() => {
      noteElement.classList.remove('highlight');
    }, 2000);
  }
}

/**
 * 获取便签元素的输入框
 * @param {number} noteId 便签ID
 * @returns {Object} 包含titleInput和contentTextarea的对象
 */
export function getNoteInputs(noteId) {
  const noteElement = document.querySelector(`[data-note-id="${noteId}"]`);
  if (!noteElement) {
    return null;
  }
  
  return {
    titleInput: noteElement.querySelector('.note-title-input'),
    contentTextarea: noteElement.querySelector('.note-content'),
    noteElement
  };
}