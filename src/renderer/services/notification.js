/**
 * 通知服务 - 负责显示用户通知消息
 */
class NotificationService {
  constructor() {
    this.notificationContainer = null;
    this.activeNotifications = new Set();
    this.init();
  }

  /**
   * 初始化通知容器
   */
  init() {
    // 创建通知容器（如果不存在）
    this.notificationContainer = document.getElementById('notification-container');
    if (!this.notificationContainer) {
      this.notificationContainer = document.createElement('div');
      this.notificationContainer.id = 'notification-container';
      document.body.appendChild(this.notificationContainer);
    }
  }

  /**
   * 显示通知
   * @param {string} message 通知消息
   * @param {string} type 通知类型 ('success', 'error', 'warning', 'info')
   * @param {number} duration 显示时长（毫秒），0表示不自动消失
   */
  show(message, type = 'success', duration = 3000) {
    const notification = this.createNotificationElement(message, type);
    
    // 添加到容器
    this.notificationContainer.appendChild(notification);
    this.activeNotifications.add(notification);
    
    // 设置初始样式以便动画
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-20px)';
    
    // 显示通知
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateY(0)';
    }, 10);
    
    // 自动消失
    if (duration > 0) {
      setTimeout(() => {
        this.hide(notification);
      }, duration);
    }
    
    return notification;
  }

  /**
   * 创建通知元素
   * @param {string} message 通知消息
   * @param {string} type 通知类型
   * @returns {HTMLElement} 通知元素
   */
  createNotificationElement(message, type) {
    const notification = document.createElement('div');
    
    // 添加基础通知类
    notification.classList.add('notification');
    
    // 添加类型特定类
    notification.classList.add(`notification-${type || 'success'}`);
    
    notification.textContent = message;
    
    // 点击关闭
    notification.addEventListener('click', () => {
      this.hide(notification);
    });
    
    return notification;
  }



  /**
   * 隐藏通知
   * @param {HTMLElement} notification 通知元素
   */
  hide(notification) {
    if (!this.activeNotifications.has(notification)) {
      return;
    }
    
    // 添加隐藏类触发动画
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-20px)';
    
    // 动画结束后移除元素
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      this.activeNotifications.delete(notification);
    }, 300);
  }

  /**
   * 清除所有通知
   */
  clearAll() {
    this.activeNotifications.forEach(notification => {
      this.hide(notification);
    });
  }

  /**
   * 显示成功通知
   * @param {string} message 通知消息
   * @param {number} duration 显示时长
   */
  success(message, duration = 3000) {
    return this.show(message, 'success', duration);
  }

  /**
   * 显示错误通知
   * @param {string} message 通知消息
   * @param {number} duration 显示时长
   */
  error(message, duration = 5000) {
    return this.show(message, 'error', duration);
  }

  /**
   * 显示警告通知
   * @param {string} message 通知消息
   * @param {number} duration 显示时长
   */
  warning(message, duration = 4000) {
    return this.show(message, 'warning', duration);
  }

  /**
   * 显示信息通知
   * @param {string} message 通知消息
   * @param {number} duration 显示时长
   */
  info(message, duration = 3000) {
    return this.show(message, 'info', duration);
  }
}

export default NotificationService;