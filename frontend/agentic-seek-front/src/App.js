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
import { AppBar, Toolbar, Box, CssBaseline, useMediaQuery, useTheme, Slide } from "@mui/material";

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
          elevation={1}
          sx={{
            backgroundColor: 'background.paper',
            color: 'text.primary',
            borderBottom: 1,
            borderColor: 'divider',
            height: { xs: 56, sm: 64, md: 72 },
            justifyContent: 'center'
          }}
        >
          <Toolbar
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: { xs: 2, sm: 3, md: 4 }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
              <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={faviconPng} alt="AgenticSeek" style={{ width: { xs: 32, sm: 36, md: 40 }, height: { xs: 32, sm: 36, md: 40 } }} />
              </Box>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>AgenticSeek</h1>
              </Box>
              <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>AS</h1>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: { xs: 0.5, sm: 1 },
                  px: { xs: 1, sm: 1.5 },
                  py: { xs: 0.5, sm: 0.75 },
                  borderRadius: 20,
                  backgroundColor: isOnline ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: 1,
                  borderColor: isOnline ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                  transition: 'all 0.3s ease',
                  /* 在移动端禁用复杂动画 */
                  '@media (max-width: 1023px)': {
                    transition: 'none',
                  },
                }}
              >
                <Box
                  sx={{
                    width: { xs: 8, sm: 10 },
                    height: { xs: 8, sm: 10 },
                    borderRadius: '50%',
                    backgroundColor: isOnline ? '#22c55e' : '#ef4444',
                    boxShadow: isOnline ? '0 0 8px rgba(34, 197, 94, 0.5)' : 'none',
                    /* 在移动端禁用复杂动画 */
                    '@media (max-width: 1023px)': {
                      boxShadow: isOnline ? '0 0 4px rgba(34, 197, 94, 0.5)' : 'none',
                    },
                    animation: isOnline ? 'statusPulse 2s infinite' : 'none',
                    '@keyframes statusPulse': {
                      '0%, 100%': {
                        opacity: 1,
                        transform: 'scale(1)'
                      },
                      '50%': {
                        opacity: 0.7,
                        transform: 'scale(1.2)'
                      }
                    }
                  }}
                />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {isOnline ? "Online" : "Offline"}
                </span>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
              <a
                href="https://github.com/Fosowl/agenticSeek"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: { xs: 0.5, sm: 1 },
                  minWidth: { xs: 44, sm: 48 },
                  height: { xs: 44, sm: 48 },
                  padding: { xs: '0 8px', sm: '0 12px' },
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: 'background.paper',
                  color: 'text.primary',
                  textDecoration: 'none',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  /* 在移动端禁用复杂动画 */
                  '@media (max-width: 1023px)': {
                    transition: 'none',
                  },
                  /* 在移动端禁用复杂动画 */
                  '@media (max-width: 1023px)': {
                    transition: 'none',
                  },
                  position: 'relative',
                  overflow: 'hidden'
                }}
                aria-label="View on GitHub"
                onMouseEnter={(e) => {
                  /* 在移动端禁用悬停效果 */
                  if (window.innerWidth <= 1023) return;
                  e.currentTarget.style.background = 'var(--muted)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  /* 在移动端禁用悬停效果 */
                  if (window.innerWidth <= 1023) return;
                  e.currentTarget.style.background = 'var(--card)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, display: 'none', '@media (min-width: 768px)': { display: 'block' } }}>
                  GitHub
                </span>
              </a>
              <div>
                <ThemeToggle />
              </div>
            </Box>
          </Toolbar>
        </AppBar>
        <Box component="main" className="main" sx={{ display: 'flex', flex: 1, p: { xs: 0, sm: 2, md: 3 }, gap: { xs: 0, sm: 2 } }}>
          {!isMobile && <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />}
          <Box className="content-area" sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            p: { xs: 0, sm: 1, md: 3 },
            pb: { xs: 7, sm: 1, md: 3 } // 为底部导航栏留出空间
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
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </Box>
    </CustomThemeProvider>
  );
}

export default App;
