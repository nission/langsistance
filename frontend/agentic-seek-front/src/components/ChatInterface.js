import React from 'react';
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
  Fade
} from '@mui/material';
import { Send as SendIcon, Stop as StopIcon } from '@mui/icons-material';
import { useTheme as useAppTheme } from '../contexts/ThemeContext';
import { usePerformance } from '../contexts/PerformanceContext';
import { optimizeComponentAnimation } from '../utils/animationOptimizer';
import './ChatInterface.css';

const ChatInterface = ({
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
  const { shouldUseAnimation, animationComplexity } = usePerformance();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <Box className="chat-interface" sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Typography
        variant="h4"
        component="h2"
        sx={{
          fontWeight: 600,
          mb: 3,
          px: 2,
          fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem', lg: '2rem' }
        }}
      >
        聊天界面
      </Typography>
      
      <Box className="messages" sx={{ 
        flex: 1, 
        overflowY: 'auto', 
        px: 2, 
        pb: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2
      }}>
        {messages.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            flex: 1 
          }}>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'text.secondary', 
                textAlign: 'center',
                maxWidth: 400
              }}
            >
              还没有消息。在下方输入开始聊天！
            </Typography>
          </Box>
        ) : (
          messages.map((msg, index) => (
            <Card
              key={index}
              variant="outlined"
              sx={{
                alignSelf: msg.type === "user" ? 'flex-end' : 'flex-start',
                maxWidth: { xs: '85%', sm: '80%', md: '75%', lg: '70%' },
                backgroundColor: msg.type === "user" 
                  ? (isDark ? theme.palette.primary.dark : theme.palette.primary.light) 
                  : (isDark ? theme.palette.background.paper : theme.palette.background.default),
                color: msg.type === "user" 
                  ? (isDark ? theme.palette.primary.contrastText : theme.palette.primary.main) 
                  : 'text.primary',
                borderRadius: 3,
                boxShadow: msg.type === "error"
                  ? (isDark
                      ? '0 4px 12px rgba(239, 68, 68, 0.3)'
                      : '0 4px 12px rgba(239, 68, 68, 0.15)')
                  : '0 2px 8px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)', // 使用Material Design标准缓动函数
                /* 在移动端禁用复杂动画 */
                '@media (max-width: 1023px)': {
                  transition: 'none',
                },
                '&:hover': {
                  boxShadow: msg.type === "error"
                    ? (isDark
                        ? '0 8px 20px rgba(239, 68, 68, 0.4)'
                        : '0 8px 20px rgba(239, 68, 68, 0.2)')
                    : '0 6px 16px rgba(0, 0, 0, 0.15)',
                  transform: 'translateY(-3px)',
                  /* 在移动端禁用复杂动画 */
                  '@media (max-width: 1023px)': {
                    transform: 'none',
                    boxShadow: msg.type === "error"
                      ? (isDark
                          ? '0 4px 12px rgba(239, 68, 68, 0.3)'
                          : '0 4px 12px rgba(239, 68, 68, 0.15)')
                      : '0 2px 8px rgba(0, 0, 0, 0.1)',
                  }
                }
              }}
            >
              <CardContent sx={{ 
                padding: { xs: 1.25, sm: 1.5, md: 2 },
                '&:last-child': { pb: { xs: 1.25, sm: 1.5, md: 2 } }
              }}>
                <Box className="message-header" sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  mb: 1,
                  flexWrap: 'wrap'
                }}>
                  {msg.type === "agent" && (
                    <Box 
                      component="span" 
                      sx={{ 
                        fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                        fontWeight: 600,
                        color: 'text.secondary',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                        padding: { xs: '0.15rem 0.5rem', sm: '0.2rem 0.6rem', md: '0.25rem 0.75rem' },
                        borderRadius: 20
                      }}
                    >
                      {msg.agentName}
                    </Box>
                  )}
                  {msg.type === "agent" && (
                    <Button
                      size="small"
                      onClick={() => toggleReasoning(index)}
                      sx={{
                        fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                        fontWeight: 500,
                        textTransform: 'none',
                        minWidth: { xs: 44, sm: 48, md: 52 },
                        height: { xs: 32, sm: 36, md: 40 },
                        padding: { xs: '0.25rem 0.75rem', sm: '0.3rem 0.8rem', md: '0.35rem 0.9rem' },
                        borderRadius: 20,
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                        color: 'text.secondary',
                        '&:hover': {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
                        },
                        /* 在移动端禁用复杂动画 */
                        '@media (max-width: 1023px)': {
                          '&:hover': {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                          }
                        }
                      }}
                    >
                      {expandedReasoning.has(index) ? "▼" : "▶"} 推理过程
                    </Button>
                  )}
                </Box>
                
                {msg.type === "agent" &&
                  msg.reasoning &&
                  expandedReasoning.has(index) && (
                    <Box 
                      className="reasoning-content"
                      sx={{
                        width: '100%',
                        mb: 1.5,
                        padding: { xs: 1.25, sm: 1.5, md: 1.75 },
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                        borderRadius: 2,
                        fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' },
                        color: 'text.secondary'
                      }}
                    >
                      <ReactMarkdown>{msg.reasoning}</ReactMarkdown>
                    </Box>
                  )}
                
                <Box className="message-content" sx={{ 
                  width: '100%',
                  lineHeight: 1.6,
                  fontSize: { xs: '0.875rem', sm: '0.9rem', md: '0.95rem', lg: '1rem' }
                }}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </Box>
              </CardContent>
            </Card>
          ))
        )}
        <div ref={messagesEndRef} />
      </Box>
      {isOnline && isLoading && (
        <Fade in={isLoading} timeout={shouldUseAnimation() ? 200 : 0}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 1
          }}>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {status}
            </Typography>
          </Box>
        </Fade>
      )}
      
      {!isLoading && !isOnline && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          py: 1 
        }}>
          <Typography variant="body2" sx={{ color: 'error.main' }}>
            系统离线。请先部署后端。
          </Typography>
        </Box>
      )}
      
      <Box component="form" onSubmit={handleSubmit} sx={{ 
        display: 'flex', 
        gap: 1.5, 
        p: { xs: 1.25, sm: 1.5, md: 2 },
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
        borderRadius: 3,
        mx: { xs: 0.5, sm: 1 },
        mb: { xs: 0.5, sm: 1 }
      }}>
        <TextField
          fullWidth
          variant="outlined"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="输入您的问题..."
          disabled={isLoading}
          multiline={isMobile}
          maxRows={isMobile ? 3 : isTablet ? 4 : 1}
          InputProps={{
            sx: {
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2.5,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'white',
              '& fieldset': {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
              },
              '&:hover fieldset': {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'
              },
              '&.Mui-focused fieldset': {
                borderColor: isDark ? theme.palette.primary.main : theme.palette.primary.light
              },
              minHeight: { xs: 44, sm: 48, md: 52 }
            }
          }}
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            type="submit"
            disabled={isLoading}
            sx={{
              width: { xs: 44, sm: 48, md: 52 },
              height: { xs: 44, sm: 48, md: 52 },
              borderRadius: 2.5,
              backgroundColor: isDark ? theme.palette.primary.main : theme.palette.primary.light,
              color: isDark ? theme.palette.primary.contrastText : theme.palette.primary.main,
              '&:hover': {
                backgroundColor: isDark ? theme.palette.primary.dark : theme.palette.primary.main,
                color: isDark ? theme.palette.primary.contrastText : theme.palette.primary.contrastText
              },
              /* 在移动端禁用复杂动画 */
              '@media (max-width: 1023px)': {
                '&:hover': {
                  backgroundColor: isDark ? theme.palette.primary.main : theme.palette.primary.light,
                  color: isDark ? theme.palette.primary.contrastText : theme.palette.primary.main
                }
              },
              '&:disabled': {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'
              }
            }}
            aria-label="发送消息"
          >
            <SendIcon />
          </IconButton>
          <IconButton
            onClick={handleStop}
            sx={{
              width: { xs: 44, sm: 48, md: 52 },
              height: { xs: 44, sm: 48, md: 52 },
              borderRadius: 2.5,
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
              color: isDark ? '#ef4444' : '#ef4444',
              '&:hover': {
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'
              },
              /* 在移动端禁用复杂动画 */
              '@media (max-width: 1023px)': {
                '&:hover': {
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'
                }
              }
            }}
            aria-label="停止处理"
          >
            <StopIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatInterface;