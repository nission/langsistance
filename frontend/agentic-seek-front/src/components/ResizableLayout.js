import React, { useState, useRef, useCallback } from "react";
import { useTheme, useMediaQuery } from "@mui/material";
import { usePerformance } from "../contexts/PerformanceContext";
import { optimizeAnimation } from "../utils/animationOptimizer";
import "./ResizableLayout.css";

export const ResizableLayout = ({ children, initialLeftWidth = 50 }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const { shouldUseAnimation, animationComplexity } = usePerformance();
  
  // 在移动设备上默认不显示可调整布局
  const [leftWidth, setLeftWidth] = useState(
    isMobile ? 100 :
    isTablet ? 40 :
    initialLeftWidth
  );
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newLeftWidth =
        ((e.clientX - containerRect.left) / containerRect.width) * 100;

      // Constrain between 20% and 80%
      const constrainedWidth = Math.max(20, Math.min(80, newLeftWidth));
      setLeftWidth(constrainedWidth);
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    // 更新移动设备上的布局
    if (isMobile) {
      setLeftWidth(100);
    } else if (isTablet) {
      setLeftWidth(40);
    } else {
      setLeftWidth(initialLeftWidth);
    }
    
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, handleMouseMove, handleMouseUp, isMobile, isTablet, initialLeftWidth]);
  return (
    <div
      ref={containerRef}
      className={`resizable-container ${isDragging ? "dragging" : ""}`}
      style={optimizeAnimation({
        flexDirection: isMobile ? "column" : "row",
        height: isMobile ? "auto" : "100%",
        transition: shouldUseAnimation ? `all ${0.3 * animationComplexity}s ease` : "none"
      })}
    >
      <div
        className="resizable-left"
        style={optimizeAnimation({
          width: isMobile ? "100%" : `${leftWidth}%`,
          height: isMobile ? "50%" : "100%",
          transition: shouldUseAnimation ? `width ${0.3 * animationComplexity}s ease, height ${0.3 * animationComplexity}s ease` : "none"
        })}
      >
        {children[0]}
      </div>
      {!isMobile && (
        <div
          className="resize-handle"
          onMouseDown={handleMouseDown}
          style={optimizeAnimation({
            transition: shouldUseAnimation ? `background-color ${0.3 * animationComplexity}s ease` : "none"
          })}
        >
          <div
            className="resize-handle-line"
            style={optimizeAnimation({
              transition: shouldUseAnimation ? `all ${0.3 * animationComplexity}s ease` : "none"
            })}
          />
        </div>
      )}
      <div
        className="resizable-right"
        style={optimizeAnimation({
          width: isMobile ? "100%" : `${100 - leftWidth}%`,
          height: isMobile ? "50%" : "100%",
          transition: shouldUseAnimation ? `width ${0.3 * animationComplexity}s ease, height ${0.3 * animationComplexity}s ease` : "none"
        })}
      >
        {children[1]}
      </div>
    </div>
  );
};
