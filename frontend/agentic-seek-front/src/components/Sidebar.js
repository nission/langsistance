import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Chat as ChatIcon, Book as KnowledgeIcon, Settings as SettingsIcon } from '@mui/icons-material';
import { useTheme as useAppTheme } from '../contexts/ThemeContext';
import { usePerformance } from '../contexts/PerformanceContext';

const Sidebar = ({ activeTab, onTabChange }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const { isDark } = useAppTheme();
  const { shouldUseAnimation } = usePerformance();

  const drawerWidth = isMobile ? 72 : isTablet ? 180 : 220;

  const menuItems = [
    {
      id: 'chat',
      label: '聊天',
      icon: <ChatIcon />,
    },
    {
      id: 'knowledge',
      label: '知识库',
      icon: <KnowledgeIcon />,
    },
    {
      id: 'settings',
      label: '设置',
      icon: <SettingsIcon />,
    },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: `1px solid ${isDark ? theme.palette.divider : 'rgba(0, 0, 0, 0.08)'}`,
          backgroundColor: isDark ? theme.palette.background.paper : theme.palette.background.default,
          boxShadow: isDark ? '2px 0 20px rgba(0, 0, 0, 0.3)' : '2px 0 20px rgba(0, 0, 0, 0.08)',
          borderRadius: isMobile ? '0 12px 0 0' : '0 24px 0 0',
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 24,
            background: `linear-gradient(180deg, ${isDark ? theme.palette.background.paper : theme.palette.background.default} 60%, transparent)`,
            borderRadius: isMobile ? '0 12px 0 0' : '0 24px 0 0',
            zIndex: 1,
          },
        },
      }}
    >
      <Toolbar /> {/* 空的Toolbar用于占据AppBar的空间 */}
      <List sx={{ 
        padding: isMobile ? '0.75rem 0' : isTablet ? '1rem 0' : '1.5rem 0',
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '0.5rem' : isTablet ? '0.75rem' : '0.75rem',
      }}>
        {menuItems.map((item) => (
          <ListItem
            key={item.id}
            button
            onClick={() => onTabChange(item.id)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isMobile ? 'center' : 'flex-start',
              padding: isMobile ? '1.25rem' : isTablet ? '1rem 1.1rem' : '1rem 1.25rem',
              borderRadius: isMobile ? '12px' : isTablet ? '14px' : '16px',
              backgroundColor: activeTab === item.id ?
                (isDark ? theme.palette.primary.dark : theme.palette.primary.light) :
                'transparent',
              color: activeTab === item.id ? 
                (isDark ? theme.palette.primary.contrastText : theme.palette.primary.main) : 
                (isDark ? theme.palette.text.primary : theme.palette.text.secondary),
              boxShadow: activeTab === item.id ? 
                (isDark ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.12)') : 
                'none',
              transition: 'all 0.3s ease',
              /* 在移动端禁用复杂动画 */
              '@media (max-width: 1023px)': {
                transition: 'none',
              },
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                backgroundColor: activeTab === item.id ? 
                  (isDark ? theme.palette.primary.main : theme.palette.primary.light) : 
                  (isDark ? theme.palette.action.hover : theme.palette.action.selected),
                color: activeTab === item.id ? 
                  (isDark ? theme.palette.primary.contrastText : theme.palette.primary.main) : 
                  theme.palette.text.primary,
                transform: isMobile ? 'none' : 'translateY(-2px)',
                /* 在移动端禁用复杂动画 */
                '@media (max-width: 1023px)': {
                  transform: 'none',
                },
                boxShadow: activeTab === item.id ? 
                  (isDark ? '0 6px 16px rgba(0, 0, 0, 0.3)' : '0 6px 16px rgba(0, 0, 0, 0.15)') : 
                  (isDark ? '0 6px 16px rgba(0, 0, 0, 0.1)' : '0 6px 16px rgba(0, 0, 0, 0.1)'),
              },
              '& .MuiListItemIcon-root': {
                minWidth: isMobile ? 'auto' : isTablet ? '36px' : '44px',
                color: 'inherit',
                fontSize: isMobile ? '1.5rem' : isTablet ? '1.35rem' : '1.5rem',
              },
            }}
          >
            <ListItemIcon>
              {item.icon}
            </ListItemIcon>
            {!isMobile && (
              <ListItemText 
                primary={item.label}
                sx={{
                  '& .MuiListItemText-primary': {
                    fontSize: isTablet ? '0.9rem' : '1rem',
                    fontWeight: 500,
                  },
                }}
              />
            )}
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;