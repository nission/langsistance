import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { CustomThemeProvider } from "./contexts/ThemeContext";
import { PerformanceProvider } from "./contexts/PerformanceContext";
import "./styles/globals.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <PerformanceProvider>
      <CustomThemeProvider>
        <App />
      </CustomThemeProvider>
    </PerformanceProvider>
  </React.StrictMode>
);
