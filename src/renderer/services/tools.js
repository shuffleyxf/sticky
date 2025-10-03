/**
 * 工具服务 - 负责提供各种工具功能
 */

/**
 * Markdown预览工具类 - 负责处理Markdown预览功能
 */
class MarkdownPreviewTool {
  constructor(notificationService) {
    this.notificationService = notificationService;
  }

  /**
   * 获取工具配置
   * @param {HTMLElement} textarea - 文本区域元素
   * @returns {Object} 工具配置对象
   */
  getConfig(textarea) {
    return {
      id: 'toggle-preview',
      title: '切换Markdown预览',
      iconId: 'toggle-preview-icon-template',
      handler: () => this.togglePreview(textarea)
    };
  }

  /**
   * 切换Markdown预览
   * @param {HTMLElement} textarea - 文本区域元素
   */
  togglePreview(textarea) {
    const noteElement = textarea.closest('.note-container');
    const markdownPreview = noteElement.querySelector('.markdown-preview');
    
    if (!markdownPreview) {
      // 如果预览区域不存在，创建一个
      this.createPreviewElement(noteElement, textarea);
      return;
    }
    
    if (markdownPreview.style.display === 'none') {
      // 切换到预览模式
      textarea.style.display = 'none';
      markdownPreview.style.display = 'block';
      
      // 检查是否处于沉浸式模式，并更新背景颜色
      if (noteElement.classList.contains('maximized')) {
        markdownPreview.style.backgroundColor = 'var(--bg-color)';
      }
      
      this.updateMarkdownPreview(textarea, markdownPreview);
    } else {
      // 切换到编辑模式
      textarea.style.display = 'block';
      markdownPreview.style.display = 'none';
    }
  }

  /**
   * 创建Markdown预览元素
   * @param {HTMLElement} noteElement - 便签元素
   * @param {HTMLElement} textarea - 文本区域元素
   */
  createPreviewElement(noteElement, textarea) {
    const markdownPreview = document.createElement('div');
    markdownPreview.className = 'markdown-preview';
    markdownPreview.style.display = 'none';
    markdownPreview.style.padding = '10px';
    markdownPreview.style.overflow = 'auto';
    markdownPreview.style.height = textarea.style.height || '200px';
    
    // 检查是否处于沉浸式模式
    if (noteElement.classList.contains('maximized')) {
      // 沉浸式模式下使用CSS变量
      markdownPreview.style.backgroundColor = 'var(--bg-color)';
      markdownPreview.style.color = 'var(--text-color)';
    } else {
      // 普通模式下获取计算后的样式
      const noteBackground = getComputedStyle(noteElement).backgroundColor;
      const noteColor = getComputedStyle(noteElement).color;
      markdownPreview.style.backgroundColor = noteBackground;
      markdownPreview.style.color = noteColor;
    }
    
    // 插入到文本区域后面
    textarea.parentNode.insertBefore(markdownPreview, textarea.nextSibling);
    
    // 立即切换到预览模式
    this.togglePreview(textarea);
  }

  /**
   * 更新Markdown预览内容
   * @param {HTMLElement} textarea - 文本区域元素
   * @param {HTMLElement} previewElement - 预览元素
   */
  updateMarkdownPreview(textarea, previewElement) {
    const content = textarea.value;
    try {
      // 使用marked库解析Markdown
      previewElement.innerHTML = window.marked.parse(content);
      // 添加样式
      this.applyMarkdownStyles(previewElement);
    } catch (error) {
      console.error('Markdown解析错误:', error);
      previewElement.innerHTML = '<p style="color: red;">Markdown解析错误</p>';
      this.notificationService.error('Markdown解析错误');
    }
  }

  /**
   * 应用Markdown样式
   * @param {HTMLElement} element - 预览元素
   */
  applyMarkdownStyles(element) {
    // 添加基本样式
    element.querySelectorAll('h1').forEach(el => {
      el.style.fontSize = '1.8em';
      el.style.marginBottom = '0.5em';
    });
    
    element.querySelectorAll('h2').forEach(el => {
      el.style.fontSize = '1.5em';
      el.style.marginBottom = '0.5em';
    });
    
    element.querySelectorAll('a').forEach(el => {
      el.style.color = '#0366d6';
      el.style.textDecoration = 'none';
    });
    
    element.querySelectorAll('code').forEach(el => {
      el.style.backgroundColor = '#f6f8fa';
      el.style.padding = '0.2em 0.4em';
      el.style.borderRadius = '3px';
      el.style.fontFamily = 'monospace';
    });
    
    element.querySelectorAll('pre').forEach(el => {
      el.style.backgroundColor = '#f6f8fa';
      el.style.padding = '1em';
      el.style.borderRadius = '5px';
      el.style.overflow = 'auto';
    });
    
    element.querySelectorAll('blockquote').forEach(el => {
      el.style.borderLeft = '4px solid #dfe2e5';
      el.style.paddingLeft = '1em';
      el.style.color = '#6a737d';
      el.style.margin = '0 0 1em 0';
    });
    
    element.querySelectorAll('table').forEach(el => {
      el.style.borderCollapse = 'collapse';
      el.style.width = '100%';
    });
    
    element.querySelectorAll('th, td').forEach(el => {
      el.style.border = '1px solid #dfe2e5';
      el.style.padding = '6px 13px';
    });
    
    element.querySelectorAll('tr:nth-child(2n)').forEach(el => {
      el.style.backgroundColor = '#f6f8fa';
    });
  }
}

/**
 * 复制工具类 - 负责处理文本复制功能
 */
class CopyTool {
  constructor(notificationService) {
    this.notificationService = notificationService;
  }

  /**
   * 获取工具配置
   * @param {HTMLElement} textarea - 文本区域元素
   * @returns {Object} 工具配置对象
   */
  getConfig(textarea) {
    return {
      id: 'copy',
      title: '复制内容',
      iconId: 'copy-icon-template',
      handler: () => this.copyContent(textarea)
    };
  }

  /**
   * 复制文本内容到剪贴板
   * @param {HTMLElement} textarea - 文本区域元素
   */
  copyContent(textarea) {
    const content = textarea.value;
    navigator.clipboard.writeText(content)
      .then(() => {
        this.notificationService.success('内容已复制到剪贴板');
      })
      .catch(err => {
        console.error('复制失败:', err);
        this.notificationService.error('复制失败');
      });
  }
}

/**
 * JSON格式化工具类 - 负责处理JSON格式化功能
 */
class JsonFormatTool {
  constructor(notificationService) {
    this.notificationService = notificationService;
  }

  /**
   * 获取工具配置
   * @param {HTMLElement} textarea - 文本区域元素
   * @returns {Object} 工具配置对象
   */
  getConfig(textarea) {
    return {
      id: 'json-format',
      title: 'JSON格式化',
      iconId: 'json-format-icon-template',
      handler: () => this.formatJson(textarea)
    };
  }

  /**
   * 格式化JSON内容
   * @param {HTMLElement} textarea - 文本区域元素
   */
  formatJson(textarea) {
    const content = textarea.value.trim();
    
    if (!content) {
      this.notificationService.warning('内容为空，无法格式化');
      return;
    }
    
    try {
      // 尝试解析JSON
      const jsonObj = JSON.parse(content);
      // 格式化JSON并设置缩进为2个空格
      const formattedJson = JSON.stringify(jsonObj, null, 2);
      // 更新文本区域内容
      textarea.value = formattedJson;
      this.notificationService.success('JSON格式化成功');
    } catch (error) {
      console.error('JSON格式化失败:', error);
      this.notificationService.error('无效的JSON格式，请检查内容');
    }
  }
}

/**
 * 工具服务 - 管理所有工具
 */
class ToolsService {
  constructor(notificationService) {
    this.notificationService = notificationService;
    this.tools = {
      markdownPreview: new MarkdownPreviewTool(notificationService),
      copy: new CopyTool(notificationService),
      jsonFormat: new JsonFormatTool(notificationService)
    };
  }

  /**
   * 获取所有可用工具
   * @param {HTMLElement} noteElement - 便签元素
   * @returns {Array} 工具配置数组
   */
  getAvailableTools(noteElement) {
    const textarea = noteElement.querySelector('.note-content');
    if (!textarea) return [];

    return [
      this.tools.copy.getConfig(textarea),
      this.tools.markdownPreview.getConfig(textarea),
      this.tools.jsonFormat.getConfig(textarea)
    ];
  }
  
  /**
   * 切换Markdown预览
   * @param {HTMLElement} textarea - 文本区域元素
   */
  toggleMarkdownPreview(textarea) {
    this.tools.markdownPreview.togglePreview(textarea);
  }
}

export default ToolsService;