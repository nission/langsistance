import React from 'react';
import {
  BottomNavigation as MuiBottomNavigation,
  BottomNavigationAction,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Chat as ChatIcon, Book as KnowledgeIcon, Settings as SettingsIcon } from '@mui/icons-material';
import { useTheme as useAppTheme } from '../contexts/ThemeContext';
import { usePerformance } from '../contexts/PerformanceContext';

const BottomNavigation = ({ activeTab, onTabChange }) => {
  const theme = useTheme();
  const { isDark } = useAppTheme();
  const { shouldUseAnimation } = usePerformance();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // 只在移动端显示底部导航栏
  if (!isMobile) {
    return null;
  }

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
    <MuiBottomNavigation
      value={activeTab}
      onChange={(event, newValue) => onTabChange(newValue)}
      showLabels
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: isDark ? theme.palette.background.paper : theme.palette.background.default,
        borderTop: `1px solid ${isDark ? theme.palette.divider : 'rgba(0, 0, 0, 0.08)'}`,
        boxShadow: isDark ? '0 -2px 20px rgba(0, 0, 0, 0.3)' : '0 -2px 20px rgba(0, 0, 0, 0.08)',
        /* 在移动端禁用复杂动画 */
        '@media (max-width: 1023px)': {
          boxShadow: isDark ? '0 -1px 10px rgba(0, 0, 0, 0.3)' : '0 -1px 10px rgba(0, 0, 0, 0.08)',
        },
        height: 56,
        '& .MuiBottomNavigationAction-root': {
          minWidth: 80,
          padding: '6px 0',
          color: isDark ? theme.palette.text.secondary : theme.palette.text.primary,
          '&.Mui-selected': {
            color: isDark ? theme.palette.primary.main : theme.palette.primary.dark,
          },
        },
        '& .MuiBottomNavigationAction-label': {
          fontSize: '0.75rem',
          fontWeight: 500,
          '&.Mui-selected': {
            fontSize: '0.75rem',
          },
        },
        '& .MuiSvgIcon-root': {
          fontSize: '1.5rem',
        },
      }}
    >
      {menuItems.map((item) => (
        <BottomNavigationAction
          key={item.id}
          label={item.label}
          value={item.id}
          icon={item.icon}
        />
      ))}
    </MuiBottomNavigation>
  );
};

export default BottomNavigation;