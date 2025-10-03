/**
 * 工具服务 - 负责提供各种工具功能
 */

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
      this.tools.jsonFormat.getConfig(textarea)
    ];
  }
}

export default ToolsService;