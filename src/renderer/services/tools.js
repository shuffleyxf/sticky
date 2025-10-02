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
 * 工具服务 - 管理所有工具
 */
class ToolsService {
  constructor(notificationService) {
    this.notificationService = notificationService;
    this.tools = {
      copy: new CopyTool(notificationService)
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
      this.tools.copy.getConfig(textarea)
    ];
  }
}

export default ToolsService;