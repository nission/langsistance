import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const PerformanceContext = createContext();

// 设备性能等级
const PERFORMANCE_LEVELS = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low"
};

// 动画复杂度等级
const ANIMATION_COMPLEXITY = {
  HIGH: "high",    // 复杂动画
  MEDIUM: "medium", // 中等动画
  LOW: "low"       // 简单动画
};

export const PerformanceProvider = ({ children }) => {
  // 设备性能等级
  const [performanceLevel, setPerformanceLevel] = useState(PERFORMANCE_LEVELS.HIGH);
  
  // 动画偏好设置
  const [animationPreference, setAnimationPreference] = useState("auto"); // auto, reduced, none
  
  // 当前动画复杂度
  const [animationComplexity, setAnimationComplexity] = useState(ANIMATION_COMPLEXITY.HIGH);
  
  // 是否启用性能优化
  const [isPerformanceOptimizationEnabled, setIsPerformanceOptimizationEnabled] = useState(true);

  // 检测设备性能
  const detectDevicePerformance = useCallback(() => {
    if (!isPerformanceOptimizationEnabled) {
      setPerformanceLevel(PERFORMANCE_LEVELS.HIGH);
      setAnimationComplexity(ANIMATION_COMPLEXITY.HIGH);
      return;
    }

    // 检查设备内存
    const memory = navigator.deviceMemory || navigator.hardwareConcurrency || 4;
    
    // 检查CPU核心数
    const cores = navigator.hardwareConcurrency || 4;
    
    // 检查屏幕刷新率
    const refreshRate = window.screen?.availWidth ? 
      (window.screen.availWidth > 1920 ? 120 : 60) : 60;
    
    // 简单的性能评估算法
    let level = PERFORMANCE_LEVELS.HIGH;
    
    // 低端设备判断逻辑
    if (memory <= 4 || cores <= 2) {
      level = PERFORMANCE_LEVELS.LOW;
    } else if (memory <= 8 || cores <= 4) {
      level = PERFORMANCE_LEVELS.MEDIUM;
    }
    
    setPerformanceLevel(level);
    
    // 根据性能等级设置动画复杂度
    switch (level) {
      case PERFORMANCE_LEVELS.HIGH:
        setAnimationComplexity(ANIMATION_COMPLEXITY.HIGH);
        break;
      case PERFORMANCE_LEVELS.MEDIUM:
        setAnimationComplexity(ANIMATION_COMPLEXITY.MEDIUM);
        break;
      case PERFORMANCE_LEVELS.LOW:
        setAnimationComplexity(ANIMATION_COMPLEXITY.LOW);
        break;
      default:
        setAnimationComplexity(ANIMATION_COMPLEXITY.HIGH);
    }
  }, [isPerformanceOptimizationEnabled]);

  // 检查用户动画偏好
  const checkAnimationPreference = useCallback(() => {
    // 检查用户是否偏好减少动画
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reducedMotion = prefersReducedMotion.matches;
    
    if (reducedMotion) {
      setAnimationPreference("reduced");
      setAnimationComplexity(ANIMATION_COMPLEXITY.LOW);
    } else {
      setAnimationPreference("auto");
    }
  }, []);

  // 切换性能优化
  const togglePerformanceOptimization = useCallback((enabled) => {
    setIsPerformanceOptimizationEnabled(enabled);
  }, []);

  // 切换动画偏好
  const setAnimationPref = useCallback((pref) => {
    setAnimationPreference(pref);
    
    // 如果用户选择不使用动画，设置最低复杂度
    if (pref === "none") {
      setAnimationComplexity(ANIMATION_COMPLEXITY.LOW);
    } else if (pref === "reduced") {
      setAnimationComplexity(ANIMATION_COMPLEXITY.MEDIUM);
    } else {
      // 自动模式下根据设备性能设置
      detectDevicePerformance();
    }
  }, [detectDevicePerformance]);

  // 初始化和监听变化
  useEffect(() => {
    // 初始检测
    detectDevicePerformance();
    checkAnimationPreference();
    
    // 监听系统动画偏好变化
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleMediaChange = () => checkAnimationPreference();
    
    mediaQuery.addEventListener("change", handleMediaChange);
    
    // 监听窗口大小变化（可能影响性能）
    const handleResize = () => {
      // 简单的节流，避免频繁检测
      const now = Date.now();
      if (!window.lastResizeCheck || now - window.lastResizeCheck > 2000) {
        window.lastResizeCheck = now;
        detectDevicePerformance();
      }
    };
    
    window.addEventListener("resize", handleResize);
    
    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange);
      window.removeEventListener("resize", handleResize);
    };
  }, [detectDevicePerformance, checkAnimationPreference]);

  // 根据性能等级和动画偏好决定是否应该使用动画
  const shouldUseAnimation = useCallback((requestedComplexity = ANIMATION_COMPLEXITY.HIGH) => {
    if (animationPreference === "none") {
      return false;
    }
    
    if (animationPreference === "reduced") {
      return requestedComplexity === ANIMATION_COMPLEXITY.LOW;
    }
    
    // 自动模式下根据设备性能决定
    switch (animationComplexity) {
      case ANIMATION_COMPLEXITY.HIGH:
        return true;
      case ANIMATION_COMPLEXITY.MEDIUM:
        return requestedComplexity !== ANIMATION_COMPLEXITY.HIGH;
      case ANIMATION_COMPLEXITY.LOW:
        return requestedComplexity === ANIMATION_COMPLEXITY.LOW;
      default:
        return true;
    }
  }, [animationPreference, animationComplexity]);

  // 获取动画持续时间
  const getAnimationDuration = useCallback((baseDuration) => {
    if (!isPerformanceOptimizationEnabled) {
      return baseDuration;
    }
    
    switch (animationComplexity) {
      case ANIMATION_COMPLEXITY.HIGH:
        return baseDuration;
      case ANIMATION_COMPLEXITY.MEDIUM:
        return baseDuration * 0.8;
      case ANIMATION_COMPLEXITY.LOW:
        return baseDuration * 0.5;
      default:
        return baseDuration;
    }
  }, [animationComplexity, isPerformanceOptimizationEnabled]);

  return (
    <PerformanceContext.Provider
      value={{
        performanceLevel,
        animationPreference,
        animationComplexity,
        isPerformanceOptimizationEnabled,
        shouldUseAnimation,
        getAnimationDuration,
        togglePerformanceOptimization,
        setAnimationPref,
        detectDevicePerformance
      }}
    >
      {children}
    </PerformanceContext.Provider>
  );
};

export const usePerformance = () => {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error("usePerformance must be used within PerformanceProvider");
  }
  return context;
};