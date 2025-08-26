import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './KnowledgeBase.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:7777';

const KnowledgeBase = () => {
  const [knowledgeRecords, setKnowledgeRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 表单状态
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRecordId, setCurrentRecordId] = useState(null);
  const [formData, setFormData] = useState({
    question: '',
    description: '',
    answer: '',
    public: false,
    embeddingId: 0,
    model_name: '',
    tool_id: 1,
    params: '{}'
  });

  // 获取知识库记录
  const fetchKnowledgeRecords = async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      // 这里使用一个默认的userId，实际应用中应该从认证系统获取
      const userId = 'default_user';
      const response = await axios.get(`${BACKEND_URL}/knowledge`, {
        params: {
          userId,
          query,
          limit: 100,
          offset: 0
        }
      });
      
      if (response.data.success) {
        setKnowledgeRecords(response.data.data);
      } else {
        setError(response.data.message || '获取知识库记录失败');
      }
    } catch (err) {
      console.error('获取知识库记录时出错:', err);
      setError('获取知识库记录时出错');
    } finally {
      setLoading(false);
    }
  };

  // 处理表单输入变化
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // 处理添加表单提交
  const handleAddFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // 这里使用一个默认的userId，实际应用中应该从认证系统获取
      const userId = 'default_user';
      const requestData = {
        ...formData,
        userId,
        embeddingId: parseInt(formData.embeddingId),
        tool_id: parseInt(formData.tool_id)
      };
      
      const response = await axios.post(`${BACKEND_URL}/knowledge`, requestData);
      
      if (response.data.success) {
        // 添加成功后重新获取数据
        await fetchKnowledgeRecords();
        // 重置表单并关闭
        setFormData({
          question: '',
          description: '',
          answer: '',
          public: false,
          embeddingId: 0,
          model_name: '',
          tool_id: 1,
          params: '{}'
        });
        setShowForm(false);
      } else {
        setError(response.data.message || '添加知识记录失败');
      }
    } catch (err) {
      console.error('添加知识记录时出错:', err);
      setError('添加知识记录时出错');
    } finally {
      setLoading(false);
    }
  };

  // 处理编辑表单提交
  const handleEditFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // 这里使用一个默认的userId，实际应用中应该从认证系统获取
      const userId = 'default_user';
      const requestData = {
        ...formData,
        userId,
        embeddingId: parseInt(formData.embeddingId),
        tool_id: parseInt(formData.tool_id)
      };
      
      const response = await axios.put(`${BACKEND_URL}/knowledge/${currentRecordId}`, requestData);
      
      if (response.data.success) {
        // 编辑成功后重新获取数据
        await fetchKnowledgeRecords();
        // 重置表单并关闭
        setFormData({
          question: '',
          description: '',
          answer: '',
          public: false,
          embeddingId: 0,
          model_name: '',
          tool_id: 1,
          params: '{}'
        });
        setShowForm(false);
        setIsEditing(false);
        setCurrentRecordId(null);
      } else {
        setError(response.data.message || '编辑知识记录失败');
      }
    } catch (err) {
      console.error('编辑知识记录时出错:', err);
      setError('编辑知识记录时出错');
    } finally {
      setLoading(false);
    }
  };

  // 打开编辑表单
  const openEditForm = (record) => {
    setFormData({
      question: record.question,
      description: record.description,
      answer: record.answer,
      public: record.public,
      embeddingId: record.embeddingId,
      model_name: record.model_name,
      tool_id: record.tool_id,
      params: record.params
    });
    setCurrentRecordId(record.id);
    setIsEditing(true);
    setShowForm(true);
  };

  // 删除知识记录
  const deleteKnowledgeRecord = async (id) => {
    if (!window.confirm('确定要删除这条知识记录吗？')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.delete(`${BACKEND_URL}/knowledge/${id}`);
      
      if (response.data.success) {
        // 删除成功后重新获取数据
        await fetchKnowledgeRecords();
      } else {
        setError(response.data.message || '删除知识记录失败');
      }
    } catch (err) {
      console.error('删除知识记录时出错:', err);
      setError('删除知识记录时出错');
    } finally {
      setLoading(false);
    }
  };

  // 处理搜索
  const handleSearch = (e) => {
    e.preventDefault();
    fetchKnowledgeRecords(searchQuery);
  };

  // 组件挂载时获取数据
  useEffect(() => {
    fetchKnowledgeRecords();
  }, []);

  return (
    <div className="knowledge-base">
      <div className="knowledge-header">
        <h2>知识库</h2>
        <div className="header-actions">
          <button 
            className="add-button"
            onClick={() => {
              setFormData({
                question: '',
                description: '',
                answer: '',
                public: false,
                embeddingId: 0,
                model_name: '',
                tool_id: 1,
                params: '{}'
              });
              setIsEditing(false);
              setCurrentRecordId(null);
              setShowForm(true);
            }}
          >
            添加记录
          </button>
          <form className="search-form" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="搜索知识记录..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-button">
              搜索
            </button>
          </form>
        </div>
      </div>
      
      <div className="knowledge-content">
        {loading && !showForm ? (
          <p className="loading">加载中...</p>
        ) : error && !showForm ? (
          <p className="error">{error}</p>
        ) : showForm ? (
          <div className="form-overlay">
            <div className="form-container">
              <h3>{isEditing ? '编辑知识记录' : '添加知识记录'}</h3>
              <form onSubmit={isEditing ? handleEditFormSubmit : handleAddFormSubmit} className="knowledge-form">
                <div className="form-group">
                  <label htmlFor="question">问题:</label>
                  <input
                    type="text"
                    id="question"
                    name="question"
                    value={formData.question}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="description">描述:</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="form-textarea"
                    rows="3"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="answer">答案:</label>
                  <textarea
                    id="answer"
                    name="answer"
                    value={formData.answer}
                    onChange={handleInputChange}
                    className="form-textarea"
                    rows="5"
                    required
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="model_name">模型名称:</label>
                    <input
                      type="text"
                      id="model_name"
                      name="model_name"
                      value={formData.model_name}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="tool_id">工具ID:</label>
                    <input
                      type="number"
                      id="tool_id"
                      name="tool_id"
                      value={formData.tool_id}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="embeddingId">嵌入ID:</label>
                    <input
                      type="number"
                      id="embeddingId"
                      name="embeddingId"
                      value={formData.embeddingId}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        name="public"
                        checked={formData.public}
                        onChange={handleInputChange}
                        className="form-checkbox"
                      />
                      公开
                    </label>
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="params">参数 (JSON格式):</label>
                  <textarea
                    id="params"
                    name="params"
                    value={formData.params}
                    onChange={handleInputChange}
                    className="form-textarea"
                    rows="3"
                    required
                  />
                </div>
                
                <div className="form-actions">
                  <button type="button" className="cancel-button" onClick={() => setShowForm(false)}>
                    取消
                  </button>
                  <button type="submit" className="submit-button" disabled={loading}>
                    {loading ? (isEditing ? '更新中...' : '提交中...') : (isEditing ? '更新记录' : '添加记录')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : knowledgeRecords.length === 0 ? (
          <p className="placeholder">暂无知识记录</p>
        ) : (
          <div className="knowledge-list">
            {knowledgeRecords.map((record) => (
              <div key={record.id} className="knowledge-item">
                <h3 className="knowledge-question">{record.question}</h3>
                <p className="knowledge-description">{record.description}</p>
                <div className="knowledge-answer">
                  <p>{record.answer}</p>
                </div>
                <div className="knowledge-meta">
                  <span className="knowledge-model">模型: {record.model_name}</span>
                  <span className="knowledge-tool">工具ID: {record.tool_id}</span>
                </div>
                <div className="knowledge-actions">
                  <button 
                    className="edit-button"
                    onClick={() => openEditForm(record)}
                  >
                    编辑
                  </button>
                  <button 
                    className="delete-button"
                    onClick={() => deleteKnowledgeRecord(record.id)}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBase;