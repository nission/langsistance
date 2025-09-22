import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css"; // 首先导入 TailwindCSS
import App from "./App";
import { ThemeProvider } from "./contexts/ThemeContext";
import "./styles/globals.css"; // 然后导入其他样式

// 添加mock服务的初始化函数
async function enableMocking() {
  // 检查是否应该启用mock服务
  // 1. 如果是开发环境且REACT_APP_MOCK_API环境变量为true，则启用
  // 2. 如果REACT_APP_MOCK_API_FORCE环境变量为true，则强制启用（用于测试环境）
  if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_MOCK_API === 'true') {
    try {
      const { worker } = await import('./mocks/browser');
      await worker.start({
        onUnhandledRequest: 'warn',
        serviceWorker: {
          url: '/mockServiceWorker.js'
        }
      });
      console.log('Mocking enabled in development mode');
    } catch (error) {
      console.warn('Failed to start MSW:', error);
    }
  } else if (process.env.REACT_APP_MOCK_API_FORCE === 'true') {
    try {
      const { worker } = await import('./mocks/browser');
      await worker.start({
        onUnhandledRequest: 'warn',
        serviceWorker: {
          url: '/mockServiceWorker.js'
        }
      });
      console.log('Mocking force enabled');
    } catch (error) {
      console.warn('Failed to start MSW:', error);
    }
  }
}

// 初始化mock服务后再渲染应用
enableMocking().then(() => {
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(
    <React.StrictMode>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </React.StrictMode>
  );
});
