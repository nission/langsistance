import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "./App.css";
import { ThemeToggle } from "./components/ThemeToggle";
import { CustomThemeProvider } from "./contexts/ThemeContext";
import { usePerformance } from "./contexts/PerformanceContext";
import { optimizeComponentAnimation } from "./utils/animationOptimizer";
import faviconPng from "./logo.png";
import Sidebar from "./components/Sidebar";
import BottomNavigation from "./components/BottomNavigation";
import ChatInterface from "./components/ChatInterface";
import KnowledgeBase from "./components/KnowledgeBase";
import { Settings } from "./components/Settings";

// Import MUI components for Material Design 3
import { AppBar, Toolbar, Box, CssBaseline, useMediaQuery, useTheme, Slide, Typography, IconButton, Fab } from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
console.log("Using backend URL:", BACKEND_URL);

function App() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { shouldUseAnimation, animationComplexity } = usePerformance();
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [responseData, setResponseData] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [status, setStatus] = useState("Agents ready");
  const [expandedReasoning, setExpandedReasoning] = useState(new Set());
  const [activeTab, setActiveTab] = useState("chat");
  const [prevTab, setPrevTab] = useState("chat");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchLatestAnswer = useCallback(async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/latest_answer`);
      const data = res.data;

      updateData(data);
      if (!data.answer || data.answer.trim() === "") {
        return;
      }
      const normalizedNewAnswer = normalizeAnswer(data.answer);
      const answerExists = messages.some(
        (msg) => normalizeAnswer(msg.content) === normalizedNewAnswer
      );
      if (!answerExists) {
        setMessages((prev) => [
          ...prev,
          {
            type: "agent",
            content: data.answer,
            reasoning: data.reasoning,
            agentName: data.agent_name,
            status: data.status,
            uid: data.uid,
          },
        ]);
        setStatus(data.status);
        scrollToBottom();
      } else {
        console.log("Duplicate answer detected, skipping:", data.answer);
      }
    } catch (error) {
      console.error("Error fetching latest answer:", error);
    }
  }, [messages]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      checkHealth();
      fetchLatestAnswer();
    }, 3000);
    return () => clearInterval(intervalId);
  }, [fetchLatestAnswer]);

  const checkHealth = async () => {
    try {
      await axios.get(`${BACKEND_URL}/health`);
      setIsOnline(true);
      console.log("System is online");
    } catch {
      setIsOnline(false);
      console.log("System is offline");
    }
  };

  // 移除了Computer View相关的函数

  const normalizeAnswer = (answer) => {
    return answer
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/[.,!?]/g, "");
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const toggleReasoning = (messageIndex) => {
    setExpandedReasoning((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageIndex)) {
        newSet.delete(messageIndex);
      } else {
        newSet.add(messageIndex);
      }
      return newSet;
    });
  };

  // 跟踪标签变化以确定滑动方向
  useEffect(() => {
    setPrevTab(activeTab);
  }, [activeTab]);

  const updateData = (data) => {
    setResponseData((prev) => ({
      ...prev,
      blocks: data.blocks || prev.blocks || null,
      done: data.done,
      answer: data.answer,
      agent_name: data.agent_name,
      status: data.status,
      uid: data.uid,
    }));
  };

  const handleStop = async (e) => {
    e.preventDefault();
    checkHealth();
    setIsLoading(false);
    setError(null);
    try {
      await axios.get(`${BACKEND_URL}/stop`);
      setStatus("Requesting stop...");
    } catch (err) {
      console.error("Error stopping the agent:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    checkHealth();
    if (!query.trim()) {
      console.log("Empty query");
      return;
    }
    setMessages((prev) => [...prev, { type: "user", content: query }]);
    setIsLoading(true);
    setError(null);

    try {
      console.log("Sending query:", query);
      setQuery("waiting for response...");
      const res = await axios.post(`${BACKEND_URL}/query`, {
        query,
        tts_enabled: false,
      });
      setQuery("Enter your query...");
      console.log("Response:", res.data);
      const data = res.data;
      updateData(data);
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to process query.");
      setMessages((prev) => [
        ...prev,
        { type: "error", content: "Error: Unable to get a response." },
      ]);
    } finally {
      console.log("Query completed");
      setIsLoading(false);
    }
  };

  return (
    <CustomThemeProvider>
      <CssBaseline />
      <Box className="app" sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <AppBar
          position="static"
          elevation={0}
          sx={{
            backgroundColor: 'transparent',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid',
            borderColor: 'divider',
            height: { xs: 64, sm: 72 },
            justifyContent: 'center'
          }}
        >
          <Toolbar
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: { xs: 2, sm: 3, md: 4 },
              minHeight: { xs: 64, sm: 72 }
            }}
          >
            {/* Logo 和品牌 */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flex: { xs: 1, sm: 'none' }
            }}>
              <Box sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 0.5,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
              }}>
                <img
                  src={faviconPng}
                  alt="AgenticSeek"
                  style={{
                    width: 32,
                    height: 32,
                    filter: 'brightness(0) invert(1)'
                  }}
                />
              </Box>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography
                  variant="h6"
                  component="h1"
                  sx={{
                    fontWeight: 700,
                    fontSize: '1.5rem',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.02em'
                  }}
                >
                  AgenticSeek
                </Typography>
              </Box>
            </Box>
            
            {/* 状态指示器 */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: { xs: 0, sm: 1 }
            }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 1,
                  borderRadius: 20,
                  backgroundColor: isOnline
                    ? 'rgba(5, 150, 105, 0.1)'
                    : 'rgba(220, 38, 38, 0.1)',
                  border: '1px solid',
                  borderColor: isOnline
                    ? 'rgba(5, 150, 105, 0.2)'
                    : 'rgba(220, 38, 38, 0.2)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: isOnline ? '#059669' : '#dc2626',
                    boxShadow: isOnline
                      ? '0 0 12px rgba(5, 150, 105, 0.6)'
                      : '0 0 12px rgba(220, 38, 38, 0.6)',
                    animation: isOnline ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
                    '@keyframes pulse': {
                      '0%, 100%': {
                        opacity: 1,
                      },
                      '50%': {
                        opacity: 0.5,
                      }
                    }
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: isOnline ? 'success.main' : 'error.main'
                  }}
                >
                  {isOnline ? "在线" : "离线"}
                </Typography>
              </Box>
            </Box>
            
            {/* 操作按钮 */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flex: { xs: 1, sm: 'none' },
              justifyContent: 'flex-end'
            }}>
              <IconButton
                component="a"
                href="https://github.com/Fosowl/agenticSeek"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: 'background.paper',
                  color: 'text.secondary',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(79, 70, 229, 0.25)',
                  }
                }}
                aria-label="查看 GitHub"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </IconButton>
              <ThemeToggle />
            </Box>
          </Toolbar>
        </AppBar>
        <Box component="main" className="main" sx={{ display: 'flex', flex: 1, position: 'relative' }}>
          {/* 可隐藏的侧边栏 */}
          <Sidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          
          {/* 主内容区域 */}
          <Box className="content-area" sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            p: { xs: 0, sm: 1, md: 3 },
            pb: { xs: 7, sm: 1, md: 3 }, // 为底部导航栏留出空间
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}>
            {activeTab === "settings" ? (
              <Settings />
            ) : (
              <Slide
                direction={prevTab === "chat" && activeTab === "knowledge" ? "left" :
                        prevTab === "knowledge" && activeTab === "chat" ? "right" : "left"}
                in={activeTab === "chat" || activeTab === "knowledge"}
                timeout={shouldUseAnimation ? 200 * animationComplexity : 0} // 根据性能设置调整动画持续时间
                mountOnEnter
                unmountOnExit
              >
                <Box sx={{ height: '100%' }}>
                  {activeTab === "chat" ? (
                    <ChatInterface
                      messages={messages}
                      query={query}
                      setQuery={setQuery}
                      isLoading={isLoading}
                      isOnline={isOnline}
                      status={status}
                      expandedReasoning={expandedReasoning}
                      toggleReasoning={toggleReasoning}
                      handleSubmit={handleSubmit}
                      handleStop={handleStop}
                      messagesEndRef={messagesEndRef}
                    />
                  ) : (
                    <KnowledgeBase />
                  )}
                </Box>
              </Slide>
            )}
          </Box>
        </Box>
        
        {/* 悬浮菜单按钮 */}
        <Fab
          color="primary"
          aria-label="打开菜单"
          onClick={() => setSidebarOpen(true)}
          sx={{
            position: 'fixed',
            top: { xs: 80, sm: 90, md: 100 },
            left: { xs: 16, sm: 20, md: 24 },
            zIndex: 1200,
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            boxShadow: '0 8px 32px rgba(79, 70, 229, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4338ca 0%, #6d28d9 100%)',
              transform: 'scale(1.05)',
              boxShadow: '0 12px 40px rgba(79, 70, 229, 0.4)',
            },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <MenuIcon />
        </Fab>
        
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </Box>
    </CustomThemeProvider>
  );
}

export default App;
