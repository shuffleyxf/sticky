/**
 * 时间工具函数
 */

/**
 * 格式化时间戳为相对时间
 * @param {string} timestamp ISO时间戳
 * @returns {string} 格式化后的时间字符串
 */
export function formatTime(timestamp) {
  if (!timestamp) {
    return '未知时间';
  }
  
  const time = new Date(timestamp);
  const now = new Date();
  
  // 检查时间是否有效
  if (isNaN(time.getTime())) {
    return '无效时间';
  }
  
  // 计算时间差（毫秒）
  const diffMs = now.getTime() - time.getTime();
  
  // 如果是未来时间，显示具体时间
  if (diffMs < 0) {
    return time.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

/**
 * 格式化时间戳为完整日期时间
 * @param {string} timestamp ISO时间戳
 * @returns {string} 格式化后的完整日期时间
 */
export function formatFullDateTime(timestamp) {
  if (!timestamp) {
    return '未知时间';
  }
  
  const time = new Date(timestamp);
  
  if (isNaN(time.getTime())) {
    return '无效时间';
  }
  
  return time.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * 格式化时间戳为日期
 * @param {string} timestamp ISO时间戳
 * @returns {string} 格式化后的日期
 */
export function formatDate(timestamp) {
  if (!timestamp) {
    return '未知日期';
  }
  
  const time = new Date(timestamp);
  
  if (isNaN(time.getTime())) {
    return '无效日期';
  }
  
  return time.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * 获取当前ISO时间戳
 * @returns {string} 当前ISO时间戳
 */
export function getCurrentTimestamp() {
  return new Date().toISOString();
}

/**
 * 检查时间戳是否为今天
 * @param {string} timestamp ISO时间戳
 * @returns {boolean} 是否为今天
 */
export function isToday(timestamp) {
  if (!timestamp) {
    return false;
  }
  
  const time = new Date(timestamp);
  const today = new Date();
  
  if (isNaN(time.getTime())) {
    return false;
  }
  
  return time.toDateString() === today.toDateString();
}

/**
 * 检查时间戳是否为昨天
 * @param {string} timestamp ISO时间戳
 * @returns {boolean} 是否为昨天
 */
export function isYesterday(timestamp) {
  if (!timestamp) {
    return false;
  }
  
  const time = new Date(timestamp);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (isNaN(time.getTime())) {
    return false;
  }
  
  return time.toDateString() === yesterday.toDateString();
}

/**
 * 计算两个时间戳之间的差值
 * @param {string} timestamp1 第一个时间戳
 * @param {string} timestamp2 第二个时间戳
 * @returns {Object} 包含天、小时、分钟、秒的差值对象
 */
export function getTimeDifference(timestamp1, timestamp2) {
  const time1 = new Date(timestamp1);
  const time2 = new Date(timestamp2);
  
  if (isNaN(time1.getTime()) || isNaN(time2.getTime())) {
    return null;
  }
  
  const diffMs = Math.abs(time2.getTime() - time1.getTime());
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  
  return {
    days,
    hours,
    minutes,
    seconds,
    totalMs: diffMs
  };
}