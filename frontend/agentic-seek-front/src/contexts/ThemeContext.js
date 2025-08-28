import React, { createContext, useContext, useState, useEffect } from "react";
import { ThemeProvider as MUIThemeProvider } from "@mui/material/styles";
import { createAppTheme } from "../theme";

const ThemeContext = createContext();

export const CustomThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true; // Default to dark
  });

  // Create MUI theme based on current mode
  const theme = createAppTheme(isDark);

  useEffect(() => {
    // 添加过渡效果
    const root = document.documentElement;
    root.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    
    // 清除过渡效果
    const handleTransitionEnd = () => {
      root.style.transition = '';
    };
    
    // 设置超时以确保过渡效果被清除
    const timeoutId = setTimeout(handleTransitionEnd, 300);
    
    localStorage.setItem("theme", isDark ? "dark" : "light");
    document.documentElement.setAttribute(
      "data-theme",
      isDark ? "dark" : "light"
    );
    
    // 设置CSS变量
    if (isDark) {
      root.style.setProperty('--background-gradient-start', '#0f172a');
      root.style.setProperty('--background-gradient-end', '#1e293b');
      root.style.setProperty('--background', '#0f172a');
      root.style.setProperty('--foreground', '#f8fafc');
      root.style.setProperty('--card', '#1e293b');
      root.style.setProperty('--border', '#334155');
      root.style.setProperty('--muted', '#1e293b');
      root.style.setProperty('--muted-foreground', '#94a3b8');
      root.style.setProperty('--accent', '#2563eb');
      root.style.setProperty('--accent-foreground', '#ffffff');
      root.style.setProperty('--destructive', '#ef4444');
      root.style.setProperty('--destructive-foreground', '#ffffff');
      root.style.setProperty('--secondary', '#334155');
      root.style.setProperty('--secondary-foreground', '#f8fafc');
    } else {
      root.style.setProperty('--background-gradient-start', '#f8fafc');
      root.style.setProperty('--background-gradient-end', '#e2e8f0');
      root.style.setProperty('--background', '#f8fafc');
      root.style.setProperty('--foreground', '#0f172a');
      root.style.setProperty('--card', '#ffffff');
      root.style.setProperty('--border', '#e2e8f0');
      root.style.setProperty('--muted', '#f1f5f9');
      root.style.setProperty('--muted-foreground', '#64748b');
      root.style.setProperty('--accent', '#2563eb');
      root.style.setProperty('--accent-foreground', '#ffffff');
      root.style.setProperty('--destructive', '#ef4444');
      root.style.setProperty('--destructive-foreground', '#ffffff');
      root.style.setProperty('--secondary', '#e2e8f0');
      root.style.setProperty('--secondary-foreground', '#0f172a');
    }
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <MUIThemeProvider theme={theme}>
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within CustomThemeProvider");
  }
  return context;
};
