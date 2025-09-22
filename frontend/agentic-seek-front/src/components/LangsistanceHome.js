import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:7777';

const LangsistanceHome = () => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('knowledge');
  const [searchQuery, setSearchQuery] = useState('');
  const [knowledgeData, setKnowledgeData] = useState([]);
  const [toolsData, setToolsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedKnowledge, setSelectedKnowledge] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  // 根据主题生成动态类名的辅助函数
  const getThemeClasses = () => {
    return {
      // 背景色
      mainBg: isDark
        ? 'min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
        : 'min-h-screen bg-gradient-to-br from-secondary-50 via-white to-primary-50',
      
      // 英雄区背景
      heroBg: isDark
        ? 'absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-500/5 to-blue-400/10'
        : 'absolute inset-0 bg-gradient-to-r from-primary-600/10 via-accent-500/5 to-primary-400/10',
      
      // 文本颜色
      heroTitle: isDark
        ? 'text-5xl sm:text-6xl lg:text-7xl font-display font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-300 bg-clip-text text-transparent mb-6'
        : 'text-5xl sm:text-6xl lg:text-7xl font-display font-bold bg-gradient-to-r from-primary-600 via-accent-500 to-primary-500 bg-clip-text text-transparent mb-6',
      
      heroSubtitle: isDark
        ? 'text-xl sm:text-2xl text-gray-300 font-medium mb-8 max-w-3xl mx-auto'
        : 'text-xl sm:text-2xl text-secondary-600 font-medium mb-8 max-w-3xl mx-auto',
      
      statusText: isDark
        ? 'flex items-center justify-center space-x-2 text-gray-400'
        : 'flex items-center justify-center space-x-2 text-secondary-500',
      
      // 搜索框
      searchContainer: isDark
        ? 'relative bg-gray-800/80 backdrop-blur-sm border border-gray-700/20 rounded-2xl shadow-large hover:shadow-glow transition-all duration-300'
        : 'relative bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-large hover:shadow-glow transition-all duration-300',
      
      searchInput: isDark
        ? 'w-full px-6 py-4 text-lg bg-transparent border-0 rounded-2xl focus:outline-none focus:ring-0 placeholder-gray-400 text-white'
        : 'w-full px-6 py-4 text-lg bg-transparent border-0 rounded-2xl focus:outline-none focus:ring-0 placeholder-secondary-400',
      
      // Tab 导航
      tabContainer: isDark
        ? 'relative bg-gray-800/60 backdrop-blur-sm rounded-2xl p-1.5 shadow-soft border border-gray-700/20'
        : 'relative bg-white/60 backdrop-blur-sm rounded-2xl p-1.5 shadow-soft border border-white/20',
      
      tabActive: isDark
        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-medium transform scale-105'
        : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-medium transform scale-105',
      
      tabInactive: isDark
        ? 'text-gray-300 hover:text-white hover:bg-gray-700/50'
        : 'text-secondary-600 hover:text-secondary-800 hover:bg-white/50',
      
      // 卡片
      cardBg: isDark
        ? 'group relative bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-700/20 shadow-soft hover:shadow-large transition-all duration-300 hover:-translate-y-1 animate-slide-up'
        : 'group relative bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-soft hover:shadow-large transition-all duration-300 hover:-translate-y-1 animate-slide-up',
      
      cardHover: isDark
        ? 'absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-400/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300'
        : 'absolute inset-0 bg-gradient-to-r from-primary-500/5 via-accent-500/5 to-primary-400/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300',
      
      cardTitle: isDark
        ? 'text-lg font-bold text-gray-100 mb-2 group-hover:text-blue-300 transition-colors'
        : 'text-lg font-bold text-secondary-900 mb-2 group-hover:text-primary-700 transition-colors',
      
      cardDescription: isDark
        ? 'text-gray-300 text-sm line-clamp-2 leading-relaxed'
        : 'text-secondary-600 text-sm line-clamp-2 leading-relaxed',
      
      // 下拉菜单
      dropdown: isDark
        ? 'absolute right-0 mt-2 w-52 bg-gray-800/90 backdrop-blur-sm border border-gray-700/20 rounded-xl shadow-large z-10 animate-slide-down'
        : 'absolute right-0 mt-2 w-52 bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl shadow-large z-10 animate-slide-down',
      
      dropdownItem: isDark
        ? 'flex items-center w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-blue-900/50 hover:text-blue-300 transition-colors'
        : 'flex items-center w-full text-left px-4 py-3 text-sm text-secondary-700 hover:bg-primary-50 hover:text-primary-700 transition-colors',
      
      // 模态框
      modalBg: isDark
        ? 'bg-gray-800/95 backdrop-blur-sm rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-large animate-scale-in'
        : 'bg-white/95 backdrop-blur-sm rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-large animate-scale-in',
      
      modalHeader: isDark
        ? 'relative bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white'
        : 'relative bg-gradient-to-r from-primary-500 to-accent-500 p-6 text-white',
      
      // 其他元素
      answerBg: isDark
        ? 'mb-4 p-3 bg-gray-700/50 rounded-xl'
        : 'mb-4 p-3 bg-secondary-50/50 rounded-xl',
      
      answerText: isDark
        ? 'text-sm text-gray-300 line-clamp-3 leading-relaxed'
        : 'text-sm text-secondary-700 line-clamp-3 leading-relaxed',
      
      footerBorder: isDark
        ? 'flex items-center justify-between pt-4 border-t border-gray-700'
        : 'flex items-center justify-between pt-4 border-t border-secondary-100',
      
      statusDot: isDark
        ? 'text-xs font-medium text-gray-400'
        : 'text-xs font-medium text-secondary-500'
    };
  };

  // 获取公开知识数据
  const fetchPublicKnowledge = async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${BACKEND_URL}/query_public_knowledge`, {
        params: {
          query: query || '',
          limit: 50,
          offset: 0
        }
      });
      
      if (response.data.success) {
        setKnowledgeData(response.data.data || []);
      } else {
        setError(response.data.message || 'Failed to fetch knowledge data');
      }
    } catch (err) {
      console.error('Error fetching knowledge:', err);
      setError('Error fetching knowledge data');
    } finally {
      setLoading(false);
    }
  };

  // 获取公开工具数据
  const fetchPublicTools = async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${BACKEND_URL}/query_public_tools`, {
        params: {
          query: query || '',
          limit: 50,
          offset: 0
        }
      });
      
      if (response.data.success) {
        setToolsData(response.data.data || []);
      } else {
        setError(response.data.message || 'Failed to fetch tools data');
      }
    } catch (err) {
      console.error('Error fetching tools:', err);
      setError('Error fetching tools data');
    } finally {
      setLoading(false);
    }
  };

  // 复制知识记录
  const copyKnowledge = async (knowledgeId) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/copy_knowledge`, {
        userId: '11111111', // 默认用户ID，实际应用中应从认证系统获取
        knowledgeId: knowledgeId
      });
      
      if (response.data.success) {
        // 尝试将内容复制到剪贴板
        let clipboardSuccess = false;
        if (selectedKnowledge) {
          try {
            const content = `问题: ${selectedKnowledge.question}\n描述: ${selectedKnowledge.description}\n答案: ${selectedKnowledge.answer}`;
            await navigator.clipboard.writeText(content);
            clipboardSuccess = true;
          } catch (clipboardErr) {
            console.warn('剪贴板复制失败:', clipboardErr);
          }
        }

        // 显示综合结果提示
        if (clipboardSuccess) {
          alert('复制成功！知识已保存到您的知识库，内容已复制到剪贴板。');
        } else {
          alert('复制成功！知识已保存到您的知识库。');
        }
        setShowModal(false);
      } else {
        alert('复制失败: ' + response.data.message);
      }
    } catch (err) {
      console.error('Error copying knowledge:', err);
      alert('复制失败');
    }
  };

  // 处理搜索
  const handleSearch = (e) => {
    e.preventDefault();
    if (activeTab === 'knowledge') {
      fetchPublicKnowledge(searchQuery);
    } else {
      fetchPublicTools(searchQuery);
    }
  };

  // 切换Tab
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
    if (tab === 'knowledge') {
      fetchPublicKnowledge();
    } else {
      fetchPublicTools();
    }
  };

  // 打开知识详情模态框
  const openKnowledgeModal = (knowledge) => {
    setSelectedKnowledge(knowledge);
    setShowModal(true);
    setOpenDropdown(null);
  };

  // 切换下拉菜单
  const toggleDropdown = (itemId) => {
    setOpenDropdown(openDropdown === itemId ? null : itemId);
  };

  // 初始化数据
  useEffect(() => {
    fetchPublicKnowledge();
  }, []);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !event.target.closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  const currentData = activeTab === 'knowledge' ? knowledgeData : toolsData;
  const themeClasses = getThemeClasses();

  return (
    <div className={`${themeClasses.mainBg} overflow-x-hidden`}>
      {/* 现代化顶部英雄区 */}
      <div className="relative overflow-hidden">
        <div className={themeClasses.heroBg}></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <div className="animate-fade-in">
              <h1 className={themeClasses.heroTitle}>
                Langsistance
              </h1>
              <p className={themeClasses.heroSubtitle}>
                智能知识与工具聚合平台
              </p>
              <div className={themeClasses.statusText}>
                <div className="w-2 h-2 bg-success-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">实时同步最新内容</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* 现代化搜索框 */}
        <div className="mb-12 -mt-8 relative z-10">
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
            <div className="relative group">
              <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gradient-to-r from-primary-500 to-accent-500'} rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity`}></div>
              <div className={themeClasses.searchContainer}>
                <input
                  type="text"
                  placeholder="🔍 搜索知识库或发现新工具..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={themeClasses.searchInput}
                />
                <button
                  type="submit"
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-3 ${isDark ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700' : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700'} text-white rounded-xl transition-all duration-200 shadow-medium hover:shadow-large hover:scale-105`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* 现代化 Tab 导航 */}
        <div className="flex justify-center mb-12">
          <div className={themeClasses.tabContainer}>
            <div className="flex space-x-1">
              <button
                onClick={() => handleTabChange('knowledge')}
                className={`relative px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  activeTab === 'knowledge'
                    ? themeClasses.tabActive
                    : themeClasses.tabInactive
                }`}
              >
                <span className="relative z-10 flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span>知识库</span>
                </span>
              </button>
              <button
                onClick={() => handleTabChange('tools')}
                className={`relative px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  activeTab === 'tools'
                    ? themeClasses.tabActive
                    : themeClasses.tabInactive
                }`}
              >
                <span className="relative z-10 flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>工具箱</span>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 现代化内容区域 */}
        <div className="mb-8 min-h-[60vh]">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-20">
              <div className="relative">
                <div className={`w-12 h-12 border-4 ${isDark ? 'border-gray-700 border-t-blue-500' : 'border-primary-200 border-t-primary-500'} rounded-full animate-spin`}></div>
                <div className={`absolute inset-0 w-12 h-12 border-4 border-transparent ${isDark ? 'border-t-purple-400' : 'border-t-accent-400'} rounded-full animate-spin`} style={{animationDirection: 'reverse', animationDuration: '0.8s'}}></div>
              </div>
              <span className={`mt-4 ${isDark ? 'text-gray-300' : 'text-secondary-600'} font-medium animate-pulse`}>正在加载精彩内容...</span>
            </div>
          ) : error ? (
              <div className="text-center py-20">
                <div className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'bg-red-900/50' : 'bg-error-100'} rounded-full flex items-center justify-center`}>
                  <svg className={`w-8 h-8 ${isDark ? 'text-red-400' : 'text-error-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className={`${isDark ? 'text-red-400' : 'text-error-600'} font-medium mb-4`}>{error}</div>
                <button
                  onClick={() => activeTab === 'knowledge' ? fetchPublicKnowledge() : fetchPublicTools()}
                  className={`px-6 py-3 ${isDark ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700' : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700'} text-white rounded-xl transition-all duration-200 shadow-medium hover:shadow-large font-medium`}
                >
                  重新加载
                </button>
              </div>
            ) : currentData.length === 0 ? (
              <div className="text-center py-20">
                <div className={`w-20 h-20 mx-auto mb-6 ${isDark ? 'bg-gray-700' : 'bg-secondary-100'} rounded-full flex items-center justify-center`}>
                  <svg className={`w-10 h-10 ${isDark ? 'text-gray-400' : 'text-secondary-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className={`text-xl font-semibold ${isDark ? 'text-gray-300' : 'text-secondary-700'} mb-2`}>
                  {activeTab === 'knowledge' ? '知识库空空如也' : '工具箱待填充'}
                </h3>
                <p className={isDark ? 'text-gray-400' : 'text-secondary-500'}>
                  {activeTab === 'knowledge' ? '暂时没有找到相关知识，试试其他关键词吧' : '还没有发现好用的工具，敬请期待'}
                </p>
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {currentData.map((item, index) => (
                <div
                  key={item.id}
                  className={themeClasses.cardBg}
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  {/* 卡片光效 */}
                  <div className={themeClasses.cardHover}></div>
                  
                  <div className="relative p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-start space-x-3 mb-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            activeTab === 'knowledge'
                              ? (isDark ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-primary-500 to-primary-600')
                              : (isDark ? 'bg-gradient-to-br from-purple-500 to-purple-600' : 'bg-gradient-to-br from-accent-500 to-accent-600')
                          }`}>
                            {activeTab === 'knowledge' ? (
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className={themeClasses.cardTitle}>
                              {activeTab === 'knowledge' ? item.question : item.title}
                            </h3>
                            <p className={themeClasses.cardDescription}>
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="relative ml-4 dropdown-container">
                        <button
                          onClick={() => toggleDropdown(item.id)}
                          className={`p-2 ${isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50' : 'text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100/50'} rounded-xl transition-all duration-200`}
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        
                        {/* 现代化下拉菜单 */}
                        {openDropdown === item.id && (
                          <div className={themeClasses.dropdown}>
                            <div className="py-2">
                              {activeTab === 'knowledge' && (
                                <>
                                  <button
                                    onClick={() => openKnowledgeModal(item)}
                                    className={themeClasses.dropdownItem}
                                  >
                                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    查看详情
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      copyKnowledge(item.id);
                                      setOpenDropdown(null);
                                    }}
                                    className={themeClasses.dropdownItem}
                                  >
                                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    复制知识
                                  </button>
                                </>
                              )}
                              {activeTab === 'tools' && (
                                <>
                                  <button
                                    onClick={() => {
                                      window.open(item.url, '_blank');
                                      setOpenDropdown(null);
                                    }}
                                    className={themeClasses.dropdownItem}
                                  >
                                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                    访问工具
                                  </button>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(item.url);
                                      alert('工具链接已复制到剪贴板');
                                      setOpenDropdown(null);
                                    }}
                                    className={themeClasses.dropdownItem}
                                  >
                                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    复制链接
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {activeTab === 'knowledge' && (
                      <div className={themeClasses.answerBg}>
                        <p className={themeClasses.answerText}>
                          {item.answer}
                        </p>
                      </div>
                    )}
                    
                    <div className={themeClasses.footerBorder}>
                      <div className="flex items-center space-x-3">
                        {activeTab === 'knowledge' ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-success-400 rounded-full"></div>
                            <span className={themeClasses.statusDot}>
                              {item.modelName || item.model_name || 'AI模型'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-accent-400 rounded-full"></div>
                            <span className={`${themeClasses.statusDot} truncate max-w-32`}>
                              {new URL(item.url).hostname}
                            </span>
                          </div>
                        )}
                      </div>
                      {activeTab === 'knowledge' && (
                        <button
                          onClick={() => openKnowledgeModal(item)}
                          className={`px-3 py-1.5 ${isDark ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700' : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700'} text-white text-xs font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md`}
                        >
                          详情
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 现代化知识详情模态框 */}
      {showModal && selectedKnowledge && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className={`${themeClasses.modalBg} my-4 sm:my-8 flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)] w-full`}>
            {/* 模态框头部 */}
            <div className={`${themeClasses.modalHeader} flex-shrink-0`}>
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">💡 知识详情</h2>
                  <p className={`${isDark ? 'text-blue-100' : 'text-primary-100'} text-sm`}>深入了解这个知识点</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 模态框内容 */}
            <div className="p-6 overflow-y-auto flex-1" style={{scrollbarWidth: 'thin'}}>
              <div className="space-y-6">
                <div className={`${isDark ? 'bg-gradient-to-r from-blue-900/30 to-purple-900/30' : 'bg-gradient-to-r from-primary-50 to-accent-50'} rounded-2xl p-5`}>
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 ${isDark ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-primary-500 to-primary-600'} rounded-lg flex items-center justify-center flex-shrink-0 mt-1`}>
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-bold ${isDark ? 'text-gray-100' : 'text-secondary-800'} mb-2`}>核心问题</h3>
                      <p className={`${isDark ? 'text-gray-300' : 'text-secondary-700'} leading-relaxed`}>{selectedKnowledge.question}</p>
                    </div>
                  </div>
                </div>
                
                <div className={`${isDark ? 'bg-gradient-to-r from-gray-800/50 to-blue-900/30' : 'bg-gradient-to-r from-secondary-50 to-primary-50'} rounded-2xl p-5`}>
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 ${isDark ? 'bg-gradient-to-r from-gray-600 to-gray-700' : 'bg-gradient-to-r from-secondary-500 to-secondary-600'} rounded-lg flex items-center justify-center flex-shrink-0 mt-1`}>
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-bold ${isDark ? 'text-gray-100' : 'text-secondary-800'} mb-2`}>详细描述</h3>
                      <p className={`${isDark ? 'text-gray-300' : 'text-secondary-700'} leading-relaxed`}>{selectedKnowledge.description}</p>
                    </div>
                  </div>
                </div>
                
                <div className={`${isDark ? 'bg-gradient-to-r from-green-900/30 to-blue-900/30' : 'bg-gradient-to-r from-success-50 to-primary-50'} rounded-2xl p-5`}>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-success-500 to-success-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-bold ${isDark ? 'text-gray-100' : 'text-secondary-800'} mb-2`}>智能答案</h3>
                      <div className={`${isDark ? 'bg-gray-700/70 border-green-700' : 'bg-white/70 border-success-200'} rounded-xl p-4 border`}>
                        <p className={`${isDark ? 'text-gray-300' : 'text-secondary-700'} leading-relaxed whitespace-pre-wrap`}>{selectedKnowledge.answer}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`${isDark ? 'bg-gray-700/70 border-gray-600' : 'bg-white/70 border-secondary-200'} rounded-2xl p-4 border`}>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className={`w-6 h-6 ${isDark ? 'bg-gradient-to-r from-purple-500 to-purple-600' : 'bg-gradient-to-r from-accent-500 to-accent-600'} rounded-lg flex items-center justify-center`}>
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className={`font-bold ${isDark ? 'text-gray-100' : 'text-secondary-800'}`}>AI模型</h3>
                    </div>
                    <p className={`${isDark ? 'text-gray-300' : 'text-secondary-600'} font-medium`}>{selectedKnowledge.modelName || selectedKnowledge.model_name || '未知模型'}</p>
                  </div>
                  <div className={`${isDark ? 'bg-gray-700/70 border-gray-600' : 'bg-white/70 border-secondary-200'} rounded-2xl p-4 border`}>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-warning-500 to-warning-600 rounded-lg flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <h3 className={`font-bold ${isDark ? 'text-gray-100' : 'text-secondary-800'}`}>工具ID</h3>
                    </div>
                    <p className={`${isDark ? 'text-gray-300' : 'text-secondary-600'} font-medium`}>{selectedKnowledge.toolId || selectedKnowledge.tool_id || '无'}</p>
                  </div>
                </div>
                
                {selectedKnowledge.params && (
                  <div className={`${isDark ? 'bg-gray-800' : 'bg-secondary-900'} rounded-2xl p-5`}>
                    <div className="flex items-center space-x-2 mb-3">
                      <div className={`w-6 h-6 ${isDark ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-primary-500 to-primary-600'} rounded-lg flex items-center justify-center`}>
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                      </div>
                      <h3 className="font-bold text-white">技术参数</h3>
                    </div>
                    <div className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-secondary-800 border-secondary-700'} rounded-xl p-4 border`}>
                      <pre className={`${isDark ? 'text-blue-300' : 'text-primary-300'} font-mono text-sm overflow-x-auto whitespace-pre-wrap`}>
                        {selectedKnowledge.params}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* 模态框底部操作区 */}
            <div className={`${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-secondary-50/80 border-secondary-200'} backdrop-blur-sm border-t p-6 flex-shrink-0`}>
              <div className="flex justify-between items-center">
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-secondary-500'}`}>
                  💡 点击复制按钮将知识保存到个人知识库
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className={`px-6 py-2.5 ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-secondary-200 text-secondary-700 hover:bg-secondary-300'} rounded-xl transition-all duration-200 font-medium`}
                  >
                    关闭
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      copyKnowledge(selectedKnowledge.id);
                    }}
                    className={`px-6 py-2.5 ${isDark ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700' : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700'} text-white rounded-xl transition-all duration-200 shadow-medium hover:shadow-large font-medium flex items-center space-x-2`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>复制知识</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LangsistanceHome;