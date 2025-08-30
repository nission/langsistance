import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
  Box,
  Typography,
  IconButton
} from '@mui/material';
import { 
  Chat as ChatIcon, 
  Book as KnowledgeIcon, 
  Settings as SettingsIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useTheme as useAppTheme } from '../contexts/ThemeContext';

const Sidebar = ({ activeTab, onTabChange, open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const { isDark } = useAppTheme();

  const drawerWidth = isMobile ? 280 : isTablet ? 300 : 320;

  const menuItems = [
    {
      id: 'chat',
      label: '聊天',
      icon: <ChatIcon />,
      description: '智能对话助手'
    },
    {
      id: 'knowledge',
      label: '知识库',
      icon: <KnowledgeIcon />,
      description: '知识管理中心'
    },
    {
      id: 'settings',
      label: '设置',
      icon: <SettingsIcon />,
      description: '系统配置'
    },
  ];

  const handleItemClick = (itemId) => {
    onTabChange(itemId);
    onClose(); // 选择后自动关闭侧边栏
  };

  return (
    <Drawer
      variant="temporary"
      anchor="left"
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true, // 提升移动端性能
      }}
      sx={{
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: 'none',
          backgroundColor: isDark ? 'rgba(10, 10, 11, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          boxShadow: isDark
            ? '4px 0 32px rgba(0, 0, 0, 0.5)'
            : '4px 0 32px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden', // 防止内容溢出导致跳动
          position: 'relative',
          // 确保固定高度，防止内容变化时的跳动
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* 侧边栏头部 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: '1px solid',
          borderColor: isDark ? 'rgba(39, 39, 42, 0.5)' : 'rgba(229, 231, 235, 0.8)',
          background: isDark 
            ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)'
            : 'linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%)',
        }}
      >
        <Box>
          <Typography 
            variant="h6" 
            sx={{ 
              fontSize: '1.25rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em'
            }}
          >
            AgenticSeek
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary',
              fontSize: '0.75rem',
              display: 'block',
              mt: 0.25
            }}
          >
            智能助手平台
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            backgroundColor: isDark ? 'rgba(39, 39, 42, 0.8)' : 'rgba(0, 0, 0, 0.05)',
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: isDark ? 'rgba(63, 63, 70, 0.8)' : 'rgba(0, 0, 0, 0.1)',
              color: 'text.primary',
            },
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      
      {/* 侧边栏主体 */}
      <Box
        sx={{
          flex: 1, // 使用 flex: 1 而不是 height: '100%'
          display: 'flex',
          flexDirection: 'column',
          p: 2,
          gap: 2,
          overflow: 'hidden', // 防止内容溢出
        }}
      >
        {/* 导航区域 */}
        <Box
          sx={{
            backgroundColor: isDark ? 'rgba(24, 24, 27, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
            border: '1px solid',
            borderColor: isDark ? 'rgba(39, 39, 42, 0.5)' : 'rgba(229, 231, 235, 0.8)',
            boxShadow: isDark 
              ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
              : '0 8px 32px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
          }}
        >
          {/* 菜单列表 */}
          <List sx={{
            p: 2,
            pt: 2.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
          }}>
            {menuItems.map((item) => (
              <ListItem
                key={item.id}
                button
                onClick={() => handleItemClick(item.id)}
                sx={{
                  borderRadius: 2,
                  minHeight: 60, // 稍微减少高度，使界面更紧凑
                  px: 2,
                  py: 1.5,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  
                  // 基础状态
                  backgroundColor: 'transparent',
                  color: 'text.secondary',
                  
                  // 激活状态
                  ...(activeTab === item.id && {
                    backgroundColor: isDark 
                      ? 'rgba(79, 70, 229, 0.15)' 
                      : 'rgba(79, 70, 229, 0.08)',
                    color: 'primary.main',
                    boxShadow: isDark
                      ? '0 4px 20px rgba(79, 70, 229, 0.3)'
                      : '0 4px 20px rgba(79, 70, 229, 0.15)',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 4,
                      height: '60%',
                      backgroundColor: 'primary.main',
                      borderRadius: '0 2px 2px 0',
                    }
                  }),
                  
                  // 悬停状态
                  '&:hover': {
                    backgroundColor: activeTab === item.id 
                      ? (isDark 
                          ? 'rgba(79, 70, 229, 0.2)' 
                          : 'rgba(79, 70, 229, 0.12)')
                      : (isDark 
                          ? 'rgba(255, 255, 255, 0.05)' 
                          : 'rgba(0, 0, 0, 0.04)'),
                    transform: 'translateX(4px)',
                    color: activeTab === item.id ? 'primary.main' : 'text.primary',
                  },
                  
                  // 激活时的悬停状态
                  ...(activeTab === item.id && {
                    '&:hover': {
                      backgroundColor: isDark 
                        ? 'rgba(79, 70, 229, 0.2)' 
                        : 'rgba(79, 70, 229, 0.12)',
                      transform: 'translateX(4px)',
                    }
                  })
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 44,
                    mr: 2,
                    color: 'inherit',
                    '& .MuiSvgIcon-root': {
                      fontSize: '1.5rem',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                
                <ListItemText 
                  primary={item.label}
                  secondary={item.description}
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontSize: '1rem',
                      fontWeight: 600,
                      letterSpacing: '-0.01em',
                      color: 'inherit',
                    },
                    '& .MuiListItemText-secondary': {
                      fontSize: '0.75rem',
                      color: 'text.secondary',
                      opacity: 0.8,
                      mt: 0.25,
                    },
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* 底部信息区域 */}
        <Box
          sx={{
            mt: 'auto',
            p: 2,
            borderRadius: 3,
            background: isDark 
              ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%)',
            border: '1px solid',
            borderColor: isDark ? 'rgba(79, 70, 229, 0.2)' : 'rgba(79, 70, 229, 0.1)',
            textAlign: 'center',
          }}
        >
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary',
              fontSize: '0.7rem',
              fontWeight: 500,
              letterSpacing: '0.02em'
            }}
          >
            AgenticSeek v1.0
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block',
              color: 'text.secondary',
              fontSize: '0.65rem',
              opacity: 0.7,
              mt: 0.25
            }}
          >
            智能助手平台
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;