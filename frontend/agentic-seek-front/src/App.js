import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "./App.css";
import { ThemeToggle } from "./components/ThemeToggle";
import faviconPng from "./logo.png";
import Sidebar from "./components/Sidebar";
import ChatInterface from "./components/ChatInterface";
import KnowledgeBase from "./components/KnowledgeBase";
import LangsistanceHome from "./components/LangsistanceHome";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
console.log("Using backend URL:", BACKEND_URL);

function App() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [, setError] = useState(null);
  const [, setResponseData] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [status, setStatus] = useState("Agents ready");
  const [expandedReasoning, setExpandedReasoning] = useState(new Set());
  const [activeTab, setActiveTab] = useState("chat");
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

  const updateData = (data) => {
    setResponseData((prev) => ({
      ...prev,
      blocks: data.blocks || (prev && prev.blocks) || null,
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
      setQuery("");
    }
  };

  // 移除了Computer View相关的函数

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">
          <div className="logo-container">
            <img src={faviconPng} alt="Langsistance" className="logo-icon" />
          </div>
          <div className="brand-text">
            <h1>Langsistance</h1>
          </div>
        </div>
        <div className="header-status">
          <div
            className={`status-indicator ${isOnline ? "online" : "offline"}`}
          >
            <div className="status-dot"></div>
            <span className="status-text">
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>
        <div className="header-actions">
          <a
            href="https://github.com/Fosowl/langsistance"
            target="_blank"
            rel="noopener noreferrer"
            className="action-button github-link"
            aria-label="View on GitHub"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            <span className="action-text">GitHub</span>
          </a>
          <div>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="main">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="content-area">
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
          ) : activeTab === "knowledge" ? (
            <KnowledgeBase />
          ) : (
            <LangsistanceHome />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
