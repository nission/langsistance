import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Card,
  CardContent,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Fade,
  Chip,
  Avatar
} from '@mui/material';
import { 
  Send as SendIcon, 
  Stop as StopIcon, 
  SmartToy as BotIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { useTheme as useAppTheme } from '../contexts/ThemeContext';
import './ChatInterface.css';
const ChatInterface = memo(({
  messages,
  query,
  setQuery,
  isLoading,
  isOnline,
  status,
  expandedReasoning,
  toggleReasoning,
  handleSubmit,
  handleStop,
  messagesEndRef
}) => {
  const theme = useTheme();
  const { isDark } = useAppTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  return (
    <Box 
      className="chat-interface" 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* 聊天标题区域 */}
      <Box sx={{ 
        px: { xs: 2, sm: 3, md: 4 }, 
        py: { xs: 2, sm: 2.5, md: 3 },
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundColor: isDark ? 'rgba(24, 24, 27, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
      }}>
        <Typography
          variant="h4"
          component="h2"
          sx={{
            fontWeight: 700,
            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em',
            mb: 0.5
          }}
        >
          智能对话
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'text.secondary',
            fontSize: '0.875rem'
          }}
        >
          与 AI 助手进行自然对话，获得智能回答和建议
        </Typography>
      </Box>
      
      {/* 消息区域 */}
      <Box 
        className="messages" 
        sx={{ 
          flex: 1, 
          overflowY: 'auto', 
          px: { xs: 2, sm: 3, md: 4 }, 
          py: { xs: 2, sm: 3, md: 4 },
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 2, sm: 2.5, md: 3 },
          position: 'relative',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            borderRadius: '3px',
            '&:hover': {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
            },
          },
        }}
      >
        {messages.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            flex: 1,
            flexDirection: 'column',
            gap: 3,
            py: 8
          }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(79, 70, 229, 0.3)',
                mb: 2
              }}
            >
              <BotIcon sx={{ fontSize: '2rem', color: 'white' }} />
            </Box>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'text.primary',
                fontWeight: 600,
                textAlign: 'center',
                mb: 1
              }}
            >
              开始对话
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'text.secondary', 
                textAlign: 'center',
                maxWidth: 400,
                lineHeight: 1.6
              }}
            >
              在下方输入您的问题，AI 助手将为您提供智能回答和建议
            </Typography>
          </Box>
        ) : (
          messages.map((msg, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                flexDirection: msg.type === "user" ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                gap: 2,
                maxWidth: '100%'
              }}
            >
              {/* 头像 */}
              <Avatar
                sx={{
                  width: { xs: 36, sm: 40, md: 44 },
                  height: { xs: 36, sm: 40, md: 44 },
                  backgroundColor: msg.type === "user" 
                    ? 'primary.main' 
                    : (msg.type === "error" ? 'error.main' : 'secondary.main'),
                  flexShrink: 0,
                  mt: 0.5
                }}
              >
                {msg.type === "user" ? (
                  <PersonIcon sx={{ fontSize: '1.25rem' }} />
                ) : (
                  <BotIcon sx={{ fontSize: '1.25rem' }} />
                )}
              </Avatar>

              {/* 消息内容 */}
              <Card
                variant="outlined"
                sx={{
                  maxWidth: { xs: '85%', sm: '80%', md: '75%', lg: '70%' },
                  backgroundColor: msg.type === "user" 
                    ? (isDark ? 'primary.dark' : 'primary.light') 
                    : (msg.type === "error" 
                        ? (isDark ? 'rgba(220, 38, 38, 0.1)' : 'rgba(220, 38, 38, 0.05)')
                        : (isDark ? 'background.paper' : 'background.default')),
                  borderColor: msg.type === "error" 
                    ? 'error.main' 
                    : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'),
                  borderRadius: 3,
                  boxShadow: msg.type === "error"
                    ? (isDark ? '0 4px 20px rgba(220, 38, 38, 0.2)' : '0 4px 20px rgba(220, 38, 38, 0.1)')
                    : (isDark ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 4px 20px rgba(0, 0, 0, 0.08)'),
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: msg.type === "error"
                      ? (isDark ? '0 8px 32px rgba(220, 38, 38, 0.3)' : '0 8px 32px rgba(220, 38, 38, 0.15)')
                      : (isDark ? '0 8px 32px rgba(0, 0, 0, 0.4)' : '0 8px 32px rgba(0, 0, 0, 0.12)'),
                  }
                }}
              >
                <CardContent sx={{ 
                  padding: { xs: 2, sm: 2.5, md: 3 },
                  '&:last-child': { pb: { xs: 2, sm: 2.5, md: 3 } }
                }}>
                  {/* 消息头部 */}
                  {msg.type === "agent" && (
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1.5, 
                      mb: 2,
                      flexWrap: 'wrap'
                    }}>
                      <Chip
                        label={msg.agentName}
                        size="small"
                        sx={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: isDark ? 'rgba(79, 70, 229, 0.2)' : 'rgba(79, 70, 229, 0.1)',
                          color: 'primary.main',
                          border: '1px solid',
                          borderColor: isDark ? 'rgba(79, 70, 229, 0.3)' : 'rgba(79, 70, 229, 0.2)',
                        }}
                      />
                      {msg.reasoning && (
                        <Button
                          size="small"
                          onClick={() => toggleReasoning(index)}
                          startIcon={expandedReasoning.has(index) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          sx={{
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            textTransform: 'none',
                            minWidth: 'auto',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 20,
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                            color: 'text.secondary',
                            '&:hover': {
                              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'
                            }
                          }}
                        >
                          推理过程
                        </Button>
                      )}
                    </Box>
                  )}
                  
                  {/* 推理过程展开内容 */}
                  {msg.type === "agent" &&
                    msg.reasoning &&
                    expandedReasoning.has(index) && (
                      <Box 
                        sx={{
                          mb: 2,
                          p: 2,
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: isDark ? 'rgba(63, 63, 70, 0.5)' : 'rgba(0, 0, 0, 0.1)',
                          fontSize: '0.875rem',
                          color: 'text.secondary',
                          '& pre': {
                            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.04)',
                            padding: '12px',
                            borderRadius: '8px',
                            overflow: 'auto',
                            fontSize: '0.8rem',
                          }
                        }}
                      >
                        <ReactMarkdown>{msg.reasoning}</ReactMarkdown>
                      </Box>
                    )}
                  
                  {/* 消息内容 */}
                  <Box sx={{ 
                    lineHeight: 1.7,
                    fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' },
                    color: msg.type === "user" 
                      ? (isDark ? 'primary.contrastText' : 'primary.main') 
                      : 'text.primary',
                    '& p': {
                      margin: '0 0 1rem 0',
                      '&:last-child': {
                        marginBottom: 0
                      }
                    },
                    '& pre': {
                      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.06)',
                      padding: '16px',
                      borderRadius: '12px',
                      overflow: 'auto',
                      fontSize: '0.85rem',
                      fontFamily: '"Fira Code", "JetBrains Mono", monospace',
                      border: '1px solid',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    },
                    '& code': {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.9em',
                      fontFamily: '"Fira Code", "JetBrains Mono", monospace',
                    },
                    '& a': {
                      color: 'primary.main',
                      textDecoration: 'none',
                      borderBottom: '1px dashed',
                      borderColor: 'primary.main',
                      '&:hover': {
                        borderBottomStyle: 'solid'
                      }
                    }
                  }}>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ))
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* 加载状态 */}
      {isOnline && isLoading && (
        <Fade in={isLoading} timeout={200}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 2,
            px: { xs: 2, sm: 3, md: 4 },
            borderTop: '1px solid',
            borderColor: 'divider',
            backgroundColor: isDark ? 'rgba(24, 24, 27, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
          }}>
            <CircularProgress size={20} sx={{ mr: 2 }} />
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              {status}
            </Typography>
          </Box>
        </Fade>
      )}
      
      {/* 离线状态 */}
      {!isLoading && !isOnline && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          py: 2,
          px: { xs: 2, sm: 3, md: 4 },
          borderTop: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'rgba(220, 38, 38, 0.05)',
        }}>
          <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 500 }}>
            系统离线。请先部署后端服务。
          </Typography>
        </Box>
      )}
      
      {/* 输入区域 */}
      <Box 
        component="form" 
        onSubmit={handleSubmit} 
        sx={{ 
          p: { xs: 2, sm: 3, md: 4 },
          borderTop: '1px solid',
          borderColor: 'divider',
          backgroundColor: isDark ? 'rgba(24, 24, 27, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <Box sx={{
          display: 'flex',
          gap: 2,
          alignItems: 'flex-end',
          maxWidth: '100%'
        }}>
          <TextField
            fullWidth
            variant="outlined"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="输入您的问题..."
            disabled={isLoading}
            multiline
            maxRows={isMobile ? 3 : isTablet ? 4 : 6}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                backgroundColor: isDark ? 'rgba(39, 39, 42, 0.8)' : 'white',
                fontSize: { xs: '1rem', sm: '1rem' },
                lineHeight: 1.5,
                '& fieldset': {
                  borderColor: isDark ? 'rgba(63, 63, 70, 0.5)' : 'rgba(0, 0, 0, 0.1)'
                },
                '&:hover fieldset': {
                  borderColor: isDark ? 'rgba(161, 161, 170, 0.3)' : 'rgba(0, 0, 0, 0.2)'
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                  borderWidth: '2px'
                },
                minHeight: { xs: 48, sm: 52, md: 56 }
              }
            }}
          />
          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
            <IconButton
              type="submit"
              disabled={isLoading || !query.trim()}
              sx={{
                width: { xs: 48, sm: 52, md: 56 },
                height: { xs: 48, sm: 52, md: 56 },
                borderRadius: 3,
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                color: 'white',
                boxShadow: '0 4px 20px rgba(79, 70, 229, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4338ca 0%, #6d28d9 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 32px rgba(79, 70, 229, 0.4)',
                },
                '&:disabled': {
                  background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                  transform: 'none',
                  boxShadow: 'none'
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              aria-label="发送消息"
            >
              <SendIcon />
            </IconButton>
            <IconButton
              onClick={handleStop}
              sx={{
                width: { xs: 48, sm: 52, md: 56 },
                height: { xs: 48, sm: 52, md: 56 },
                borderRadius: 3,
                backgroundColor: isDark ? 'rgba(220, 38, 38, 0.2)' : 'rgba(220, 38, 38, 0.08)',
                color: 'error.main',
                border: '1px solid',
                borderColor: isDark ? 'rgba(220, 38, 38, 0.3)' : 'rgba(220, 38, 38, 0.2)',
                '&:hover': {
                  backgroundColor: isDark ? 'rgba(220, 38, 38, 0.3)' : 'rgba(220, 38, 38, 0.15)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 32px rgba(220, 38, 38, 0.2)',
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              aria-label="停止处理"
            >
              <StopIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Box>
  );
});

ChatInterface.displayName = 'ChatInterface';

export default ChatInterface;