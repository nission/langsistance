import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  TextField,
  Button,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Grid,
  Chip,
  Tooltip,
  CircularProgress,
  Alert,
  Fab,
  useMediaQuery,
  useTheme,
  Fade
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { usePerformance } from '../contexts/PerformanceContext';
import { useTheme as useAppTheme } from '../contexts/ThemeContext';
import { optimizeComponentAnimation } from '../utils/animationOptimizer';
import './KnowledgeBase.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:7777';

const KnowledgeBase = () => {
  const theme = useTheme();
  const { isDark } = useAppTheme();
  const { shouldUseAnimation, animationComplexity } = usePerformance();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  
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
    <Box className="knowledge-base">
      <Card className="knowledge-header" elevation={2}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Typography variant="h4" component="h2" sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' } }}>
              知识库
            </Typography>
            <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
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
                sx={{
                  minWidth: { xs: 44, sm: 48, md: 52 },
                  height: { xs: 44, sm: 48, md: 52 },
                  fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' }
                }}
              >
                添加记录
              </Button>
              <Box component="form" onSubmit={handleSearch} display="flex" gap={1}>
                <TextField
                  variant="outlined"
                  placeholder="搜索知识记录..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon color="action" />,
                    sx: {
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }
                  }}
                  sx={{
                    width: { xs: 100, sm: 150, md: 200 },
                    '& .MuiOutlinedInput-root': {
                      height: { xs: 44, sm: 48, md: 52 }
                    }
                  }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  startIcon={<SearchIcon />}
                  sx={{
                    minWidth: { xs: 44, sm: 48, md: 52 },
                    height: { xs: 44, sm: 48, md: 52 },
                    /* 在移动端禁用复杂动画 */
                    '@media (max-width: 1023px)': {
                      transition: 'none',
                    },
                    fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' }
                  }}
                >
                  搜索
                </Button>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
      
      <Box className="knowledge-content" mt={2}>
        {loading && !showForm ? (
          <Fade in={loading} timeout={shouldUseAnimation() ? 200 : 0}>
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
              <CircularProgress />
            </Box>
          </Fade>
        ) : error && !showForm ? (
          <Alert severity="error">{error}</Alert>
        ) : showForm ? (
          <Dialog
            open={showForm}
            onClose={() => setShowForm(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              {isEditing ? '编辑知识记录' : '添加知识记录'}
              <IconButton
                aria-label="close"
                onClick={() => setShowForm(false)}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Box component="form" onSubmit={isEditing ? handleEditFormSubmit : handleAddFormSubmit}>
                <Grid container spacing={2} mt={1}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="问题"
                      name="question"
                      value={formData.question}
                      onChange={handleInputChange}
                      required
                      variant="outlined"
                      InputProps={{
                        sx: {
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: { xs: 'auto', sm: 'auto' },
                          minHeight: { xs: 44, sm: 52 }
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="描述"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      variant="outlined"
                      multiline
                      rows={3}
                      InputProps={{
                        sx: {
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          minHeight: { xs: 100, sm: 120 }
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="答案"
                      name="answer"
                      value={formData.answer}
                      onChange={handleInputChange}
                      required
                      variant="outlined"
                      multiline
                      rows={5}
                      InputProps={{
                        sx: {
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          minHeight: { xs: 150, sm: 200 }
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="模型名称"
                      name="model_name"
                      value={formData.model_name}
                      onChange={handleInputChange}
                      required
                      variant="outlined"
                      InputProps={{
                        sx: {
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: { xs: 'auto', sm: 'auto' },
                          minHeight: { xs: 44, sm: 52 }
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="工具ID"
                      name="tool_id"
                      type="number"
                      value={formData.tool_id}
                      onChange={handleInputChange}
                      required
                      variant="outlined"
                      InputProps={{
                        sx: {
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: { xs: 'auto', sm: 'auto' },
                          minHeight: { xs: 44, sm: 52 }
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="嵌入ID"
                      name="embeddingId"
                      type="number"
                      value={formData.embeddingId}
                      onChange={handleInputChange}
                      required
                      variant="outlined"
                      InputProps={{
                        sx: {
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          height: { xs: 'auto', sm: 'auto' },
                          minHeight: { xs: 44, sm: 52 }
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="public"
                          checked={formData.public}
                          onChange={handleInputChange}
                        />
                      }
                      label="公开"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="参数 (JSON格式)"
                      name="params"
                      value={formData.params}
                      onChange={handleInputChange}
                      required
                      variant="outlined"
                      multiline
                      rows={3}
                      InputProps={{
                        sx: {
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          minHeight: { xs: 100, sm: 120 }
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowForm(false)} color="secondary">
                取消
              </Button>
              <Button 
                onClick={isEditing ? handleEditFormSubmit : handleAddFormSubmit} 
                variant="contained" 
                color="primary"
                disabled={loading}
              >
                {loading ? (isEditing ? '更新中...' : '提交中...') : (isEditing ? '更新记录' : '添加记录')}
              </Button>
            </DialogActions>
          </Dialog>
        ) : knowledgeRecords.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="200px">
            <Typography variant="h6" color="textSecondary">
              暂无知识记录
            </Typography>
          </Box>
        ) : (
          <List className="knowledge-list">
            {knowledgeRecords.map((record, index) => (
              <Fade
                key={record.id}
                in={true}
                timeout={shouldUseAnimation() ? (index * 100 + 300) : 0} // 逐个延迟进入，符合Material Design规范
              >
                <ListItem className="knowledge-item" disablePadding>
                  <Card
                    className="knowledge-card"
                    variant="outlined"
                    sx={{
                      width: '100%',
                      transition: shouldUseAnimation() ? 'all 0.2s cubic-bezier(0.2, 0, 0, 1)' : 'none', // 使用Material Design标准缓动函数
                      '&:hover': {
                        boxShadow: isDark
                          ? '0 6px 16px rgba(0, 0, 0, 0.3)'
                          : '0 6px 16px rgba(0, 0, 0, 0.15)',
                        transform: shouldUseAnimation('high') ? 'translateY(-3px)' : 'none',
                        /* 在移动端禁用复杂动画 */
                        '@media (max-width: 1023px)': {
                          transform: 'none',
                          boxShadow: isDark
                            ? '0 2px 10px rgba(0, 0, 0, 0.3)'
                            : '0 2px 10px rgba(0, 0, 0, 0.1)',
                        }
                      }
                    }}
                  >
                  <CardContent>
                    <Typography variant="h6" className="knowledge-question" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' } }}>
                      {record.question}
                    </Typography>
                    <Typography variant="body2" className="knowledge-description" color="textSecondary" paragraph sx={{ fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.875rem' } }}>
                      {record.description}
                    </Typography>
                    
                    <Accordion>
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls={`panel-content-${record.id}`}
                        id={`panel-header-${record.id}`}
                      >
                        <Typography>查看答案</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography className="knowledge-answer" paragraph sx={{ fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.875rem' } }}>
                          {record.answer}
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                    
                    <Box className="knowledge-meta" mt={2} display="flex" flexWrap="wrap" gap={1}>
                      <Chip label={`模型: ${record.model_name}`} size="small" sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' } }} />
                      <Chip label={`工具ID: ${record.tool_id}`} size="small" sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' } }} />
                      <Chip label={`嵌入ID: ${record.embeddingId}`} size="small" sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' } }} />
                      {record.public && <Chip label="公开" color="primary" size="small" sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' } }} />}
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Box display="flex" justifyContent="flex-end" width="100%" gap={1}>
                      <Tooltip title="编辑">
                        <IconButton
                          color="primary"
                          onClick={() => openEditForm(record)}
                          sx={{
                            width: { xs: 44, sm: 48, md: 52 },
                            height: { xs: 44, sm: 48, md: 52 },
                            '& .MuiSvgIcon-root': {
                              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' }
                            },
                            /* 在移动端禁用复杂动画 */
                            '@media (max-width: 1023px)': {
                              transition: 'none',
                            }
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="删除">
                        <IconButton
                          color="error"
                          onClick={() => deleteKnowledgeRecord(record.id)}
                          sx={{
                            width: { xs: 44, sm: 48, md: 52 },
                            height: { xs: 44, sm: 48, md: 52 },
                            '& .MuiSvgIcon-root': {
                              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' }
                            },
                            /* 在移动端禁用复杂动画 */
                            '@media (max-width: 1023px)': {
                              transition: 'none',
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardActions>
                </Card>
              </ListItem>
            </Fade>
          ))}
        </List>
      )}
      </Box>
      
      {/* Floating Action Button for mobile */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: { xs: 16, sm: 24 },
          right: { xs: 16, sm: 24 },
          display: { xs: 'flex', md: 'none' },
          width: { xs: 44, sm: 52 },
          height: { xs: 44, sm: 52 }
        }}
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
        <AddIcon sx={{ fontSize: { xs: '1.4rem', sm: '1.6rem' } }} />
      </Fab>
      {/* 在移动端禁用复杂动画 */}
      <Box
        sx={{
          '@media (max-width: 1023px)': {
            transition: 'none',
          },
        }}
      />
    </Box>
  );
};

export default KnowledgeBase;