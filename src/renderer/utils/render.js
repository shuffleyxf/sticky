/**
 * 渲染工具函数
 */

import { formatTime } from './time.js';
import { createElement, getElement } from './dom.js';

/**
 * 渲染便签
 * @param {Object} note 便签数据
 * @param {Object} searchService 搜索服务实例
 * @param {Function} onAutoSave 自动保存回调函数
 * @param {Function} onManualSave 手动保存回调函数
 * @param {Function} onDelete 删除回调函数
 * @returns {Element} 便签DOM元素
 */
export function renderNote(note, searchService, onAutoSave, onManualSave, onDelete) {
  // 获取便签模板
  const template = document.getElementById('note-template');
  if (!template) {
    console.error('找不到便签模板');
    return null;
  }
  
  // 克隆模板
  const noteClone = template.content.cloneNode(true);
  const noteContainer = noteClone.querySelector('.note-container');
  
  // 设置便签ID
  noteContainer.dataset.noteId = note.id;
  
  // 获取各个元素
  const titleInput = noteContainer.querySelector('.note-title-input');
  const contentTextarea = noteContainer.querySelector('.note-content');
  const dateElement = noteContainer.querySelector('.note-date');
  const saveButton = noteContainer.querySelector('.save-btn');
  const deleteButton = noteContainer.querySelector('.delete-btn');
  
  // 获取工具栏按钮
  const formatJsonBtn = noteContainer.querySelector('.format-json-btn');
  const clearBtn = noteContainer.querySelector('.clear-btn');
  const copyBtn = noteContainer.querySelector('.copy-btn');
  const formatTextBtn = noteContainer.querySelector('.format-text-btn');
  
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
  
  // 文本格式化按钮点击事件
  if (formatTextBtn) {
    formatTextBtn.addEventListener('click', () => {
      const content = contentTextarea.value;
      if (content) {
        // 简单的文本格式化：去除多余空行，规范缩进
        const formattedText = content
          .split('\n')
          .filter(line => line.trim() !== '') // 移除空行
          .join('\n');
        
        contentTextarea.value = formattedText;
        onAutoSave(note.id, {
          content: formattedText
        });
        
        // 显示成功通知
        const event = new CustomEvent('notification', {
          detail: { message: '文本格式化成功', type: 'success' }
        });
        document.dispatchEvent(event);
      }
    });
  }
  
  // 添加工具栏按钮事件
  if (formatJsonBtn) {
    formatJsonBtn.addEventListener('click', () => {
      try {
        const content = contentTextarea.value.trim();
        if (content) {
          const jsonObj = JSON.parse(content);
          contentTextarea.value = JSON.stringify(jsonObj, null, 2);
          onAutoSave(note.id, {
            content: contentTextarea.value
          });
          // 显示成功通知
          const event = new CustomEvent('notification', {
            detail: { message: 'JSON格式化成功', type: 'success' }
          });
          document.dispatchEvent(event);
        }
      } catch (error) {
        // 显示错误通知
        const event = new CustomEvent('notification', {
          detail: { message: '无效的JSON格式', type: 'error' }
        });
        document.dispatchEvent(event);
      }
    });
  }
  
  // 清空内容按钮点击事件
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('确定要清空便签内容吗？')) {
        contentTextarea.value = '';
        onAutoSave(note.id, {
          content: ''
        });
      }
    });
  }
  
  // 复制内容按钮点击事件
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      contentTextarea.select();
      document.execCommand('copy');
      // 显示信息通知
      const event = new CustomEvent('notification', {
        detail: { message: '内容已复制到剪贴板', type: 'info' }
      });
      document.dispatchEvent(event);
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
      // 确保工具栏显示
      const toolbar = noteElement.querySelector('.note-toolbar');
      if (toolbar) {
        toolbar.style.display = 'flex';
      }
      container.appendChild(noteElement);
      
      // 重要：确保工具栏功能正常初始化
      if (window.stickyNotesApp) {
        window.stickyNotesApp.bindToolbarEvents(noteElement, note);
      }
      
      // 绑定工具栏切换按钮事件
      const toolsToggleBtn = noteElement.querySelector('.tools-toggle-btn');
      const toolbarWrapper = noteElement.querySelector('.toolbar-wrapper');
      
      if (toolsToggleBtn && toolbarWrapper) {
        // 点击切换按钮时显示/隐藏工具栏
        toolsToggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          toolbarWrapper.classList.toggle('active');
        });
        
        // 点击工具栏内部时阻止事件冒泡，防止关闭
        toolbarWrapper.addEventListener('click', (e) => {
          e.stopPropagation();
        });
        
        // 点击便签其他区域时关闭工具栏
        noteElement.addEventListener('click', () => {
          if (toolbarWrapper.classList.contains('active')) {
            toolbarWrapper.classList.remove('active');
          }
        });
      }
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
 * @param {number|Element} noteId 便签ID或便签元素
 * @returns {Object} 包含titleInput和contentTextarea的对象
 */
export function getNoteInputs(noteId) {
  let noteElement;
  
  if (typeof noteId === 'object') {
    // 如果传入的是DOM元素
    noteElement = noteId;
  } else {
    // 如果传入的是ID
    noteElement = document.querySelector(`[data-note-id="${noteId}"]`);
  }
  
  if (!noteElement) {
    return null;
  }
  
  return {
    titleInput: noteElement.querySelector('.note-title-input'),
    contentTextarea: noteElement.querySelector('.note-content'),
    noteElement
  };
}