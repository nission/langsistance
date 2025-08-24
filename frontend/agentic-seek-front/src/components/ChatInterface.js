import React from 'react';
import ReactMarkdown from 'react-markdown';
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
  return (
    <div className="chat-interface">
      <h2>聊天界面</h2>
      <div className="messages">
        {messages.length === 0 ? (
          <p className="placeholder">
            还没有消息。在下方输入开始聊天！
          </p>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${
                msg.type === "user"
                  ? "user-message"
                  : msg.type === "agent"
                  ? "agent-message"
                  : "error-message"
              }`}
            >
              <div className="message-header">
                {msg.type === "agent" && (
                  <span className="agent-name">{msg.agentName}</span>
                )}
                {msg.type === "agent" &&
                  msg.reasoning &&
                  expandedReasoning.has(index) && (
                    <div className="reasoning-content">
                      <ReactMarkdown>{msg.reasoning}</ReactMarkdown>
                    </div>
                  )}
                {msg.type === "agent" && (
                  <button
                    className="reasoning-toggle"
                    onClick={() => toggleReasoning(index)}
                    title={
                      expandedReasoning.has(index)
                        ? "隐藏推理过程"
                        : "显示推理过程"
                    }
                  >
                    {expandedReasoning.has(index) ? "▼" : "▶"} 推理过程
                  </button>
                )}
              </div>
              <div className="message-content">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      {isOnline && <div className="loading-animation">{status}</div>}
      {!isLoading && !isOnline && (
        <p className="loading-animation">
          系统离线。请先部署后端。
        </p>
      )}
      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="输入您的问题..."
          disabled={isLoading}
        />
        <div className="action-buttons">
          <button
            type="submit"
            disabled={isLoading}
            className="icon-button"
            aria-label="发送消息"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleStop}
            className="icon-button stop-button"
            aria-label="停止处理"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect
                x="6"
                y="6"
                width="12"
                height="12"
                fill="currentColor"
                rx="2"
              />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;