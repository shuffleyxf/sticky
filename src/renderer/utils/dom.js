/**
 * DOM工具函数
 */

/**
 * 安全地获取DOM元素
 * @param {string} selector CSS选择器
 * @param {Element} parent 父元素（可选）
 * @returns {Element|null} DOM元素或null
 */
export function getElement(selector, parent = document) {
  try {
    return parent.querySelector(selector);
  } catch (error) {
    console.error('获取元素失败:', selector, error);
    return null;
  }
}

/**
 * 安全地获取多个DOM元素
 * @param {string} selector CSS选择器
 * @param {Element} parent 父元素（可选）
 * @returns {NodeList} DOM元素列表
 */
export function getElements(selector, parent = document) {
  try {
    return parent.querySelectorAll(selector);
  } catch (error) {
    console.error('获取元素列表失败:', selector, error);
    return [];
  }
}

/**
 * 创建DOM元素
 * @param {string} tagName 标签名
 * @param {Object} attributes 属性对象
 * @param {string|Element|Array} content 内容（文本、元素或元素数组）
 * @returns {Element} 创建的DOM元素
 */
export function createElement(tagName, attributes = {}, content = null) {
  const element = document.createElement(tagName);
  
  // 设置属性
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className' || key === 'class') {
      element.className = value;
    } else if (key === 'dataset') {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        element.dataset[dataKey] = dataValue;
      });
    } else if (key.startsWith('on') && typeof value === 'function') {
      // 事件监听器
      const eventName = key.slice(2).toLowerCase();
      element.addEventListener(eventName, value);
    } else {
      element.setAttribute(key, value);
    }
  });
  
  // 设置内容
  if (content !== null) {
    if (typeof content === 'string') {
      element.textContent = content;
    } else if (content instanceof Element) {
      element.appendChild(content);
    } else if (Array.isArray(content)) {
      content.forEach(item => {
        if (typeof item === 'string') {
          element.appendChild(document.createTextNode(item));
        } else if (item instanceof Element) {
          element.appendChild(item);
        }
      });
    }
  }
  
  return element;
}

/**
 * 从HTML字符串创建DOM元素
 * @param {string} htmlString HTML字符串
 * @returns {Element} 创建的DOM元素
 */
export function createElementFromHTML(htmlString) {
  const template = document.createElement('template');
  template.innerHTML = htmlString.trim();
  return template.content.firstChild;
}

/**
 * 安全地移除DOM元素
 * @param {Element} element 要移除的元素
 */
export function removeElement(element) {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

/**
 * 切换元素的类名
 * @param {Element} element DOM元素
 * @param {string} className 类名
 * @param {boolean} force 强制添加或移除（可选）
 */
export function toggleClass(element, className, force = undefined) {
  if (!element) return;
  
  if (force !== undefined) {
    if (force) {
      element.classList.add(className);
    } else {
      element.classList.remove(className);
    }
  } else {
    element.classList.toggle(className);
  }
}

/**
 * 添加类名
 * @param {Element} element DOM元素
 * @param {...string} classNames 类名列表
 */
export function addClass(element, ...classNames) {
  if (!element) return;
  element.classList.add(...classNames);
}

/**
 * 移除类名
 * @param {Element} element DOM元素
 * @param {...string} classNames 类名列表
 */
export function removeClass(element, ...classNames) {
  if (!element) return;
  element.classList.remove(...classNames);
}

/**
 * 检查元素是否包含指定类名
 * @param {Element} element DOM元素
 * @param {string} className 类名
 * @returns {boolean} 是否包含类名
 */
export function hasClass(element, className) {
  return element && element.classList.contains(className);
}

/**
 * 设置元素的样式
 * @param {Element} element DOM元素
 * @param {Object} styles 样式对象
 */
export function setStyles(element, styles) {
  if (!element) return;
  
  Object.entries(styles).forEach(([property, value]) => {
    element.style[property] = value;
  });
}

/**
 * 获取元素的计算样式
 * @param {Element} element DOM元素
 * @param {string} property 样式属性名
 * @returns {string} 样式值
 */
export function getComputedStyle(element, property) {
  if (!element) return '';
  
  const computedStyle = window.getComputedStyle(element);
  return computedStyle.getPropertyValue(property);
}

/**
 * 检查元素是否在视口中可见
 * @param {Element} element DOM元素
 * @returns {boolean} 是否可见
 */
export function isElementVisible(element) {
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * 滚动到指定元素
 * @param {Element} element 目标元素
 * @param {Object} options 滚动选项
 */
export function scrollToElement(element, options = {}) {
  if (!element) return;
  
  const defaultOptions = {
    behavior: 'smooth',
    block: 'start',
    inline: 'nearest'
  };
  
  element.scrollIntoView({ ...defaultOptions, ...options });
}

/**
 * 防抖函数
 * @param {Function} func 要防抖的函数
 * @param {number} wait 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数
 * @param {Function} func 要节流的函数
 * @param {number} limit 时间限制（毫秒）
 * @returns {Function} 节流后的函数
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}