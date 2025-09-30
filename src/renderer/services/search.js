/**
 * 搜索服务 - 负责便签的搜索、过滤和高亮功能
 */
class SearchService {
  constructor() {
    this.currentSearchTerm = '';
    this.filteredNotes = [];
  }

  /**
   * 执行搜索
   * @param {Array} notes 所有便签
   * @param {string} searchTerm 搜索关键词
   * @returns {Array} 过滤后的便签数组
   */
  performSearch(notes, searchTerm) {
    this.currentSearchTerm = searchTerm.toLowerCase().trim();
    
    if (this.currentSearchTerm === '') {
      this.filteredNotes = [];
      return notes;
    }
    
    // 根据标题和内容搜索便签
    this.filteredNotes = notes.filter(note => {
      const title = note.title ? note.title.toLowerCase() : '';
      const content = note.content ? note.content.toLowerCase() : '';
      return title.includes(this.currentSearchTerm) || content.includes(this.currentSearchTerm);
    });
    
    return this.filteredNotes;
  }

  /**
   * 清除搜索
   */
  clearSearch() {
    this.currentSearchTerm = '';
    this.filteredNotes = [];
  }

  /**
   * 获取当前搜索关键词
   * @returns {string} 当前搜索关键词
   */
  getCurrentSearchTerm() {
    return this.currentSearchTerm;
  }

  /**
   * 获取过滤后的便签
   * @returns {Array} 过滤后的便签数组
   */
  getFilteredNotes() {
    return this.filteredNotes;
  }

  /**
   * 检查是否有搜索关键词
   * @returns {boolean} 是否有搜索关键词
   */
  hasSearchTerm() {
    return this.currentSearchTerm !== '';
  }

  /**
   * 高亮搜索关键词
   * @param {string} text 要高亮的文本
   * @param {string} searchTerm 搜索关键词（可选，默认使用当前搜索关键词）
   * @returns {string} 高亮后的HTML文本
   */
  highlightSearchTerm(text, searchTerm = null) {
    const term = searchTerm || this.currentSearchTerm;
    
    if (!term || !text) {
      return text;
    }
    
    const regex = new RegExp(`(${this.escapeRegExp(term)})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  }

  /**
   * 转义正则表达式特殊字符
   * @param {string} string 要转义的字符串
   * @returns {string} 转义后的字符串
   */
  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * 获取搜索统计信息
   * @param {Array} allNotes 所有便签
   * @returns {Object} 搜索统计信息
   */
  getSearchStats(allNotes) {
    return {
      totalNotes: allNotes.length,
      filteredNotes: this.filteredNotes.length,
      searchTerm: this.currentSearchTerm,
      hasResults: this.filteredNotes.length > 0
    };
  }

  /**
   * 检查搜索结果是否为空
   * @returns {boolean} 搜索结果是否为空
   */
  isSearchEmpty() {
    return this.hasSearchTerm() && this.filteredNotes.length === 0;
  }
}

export default SearchService;