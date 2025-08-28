// 动画优化工具函数

/**
 * 优化CSS transition属性以提高性能
 * @param {string} property - CSS属性
 * @param {number} duration - 持续时间(毫秒)
 * @param {string} easing - 缓动函数
 * @param {object} performanceContext - 性能上下文
 * @returns {string} 优化后的transition字符串
 */
export const optimizeTransition = (property, duration, easing = "ease", performanceContext) => {
  if (!performanceContext) {
    return `${property} ${duration}ms ${easing}`;
  }
  
  const { shouldUseAnimation, getAnimationDuration } = performanceContext;
  
  // 如果不应该使用动画，返回空字符串
  if (!shouldUseAnimation()) {
    return "none";
  }
  
  // 获取优化后的持续时间
  const optimizedDuration = getAnimationDuration(duration);
  
  return `${property} ${optimizedDuration}ms ${easing}`;
};

/**
 * 优化CSS transform动画以提高性能
 * @param {object} transformProperties - transform属性对象
 * @param {object} performanceContext - 性能上下文
 * @returns {string} 优化后的transform字符串
 */
export const optimizeTransform = (transformProperties, performanceContext) => {
  if (!performanceContext) {
    return Object.entries(transformProperties)
      .map(([key, value]) => `${key}(${value})`)
      .join(" ");
  }
  
  const { shouldUseAnimation } = performanceContext;
  
  // 如果不应该使用复杂动画，只使用基本变换
  if (!shouldUseAnimation("high")) {
    // 只保留translate和scale，移除rotate等复杂变换
    const simpleTransforms = {};
    if (transformProperties.translate) {
      simpleTransforms.translate = transformProperties.translate;
    }
    if (transformProperties.scale) {
      simpleTransforms.scale = transformProperties.scale;
    }
    
    return Object.entries(simpleTransforms)
      .map(([key, value]) => `${key}(${value})`)
      .join(" ");
  }
  
  return Object.entries(transformProperties)
    .map(([key, value]) => `${key}(${value})`)
    .join(" ");
};

/**
 * 创建will-change属性以优化动画性能
 * @param {array} properties - 需要优化的CSS属性数组
 * @param {object} performanceContext - 性能上下文
 * @returns {string|null} will-change属性值或null
 */
export const createWillChange = (properties, performanceContext) => {
  if (!performanceContext) {
    return properties.join(", ");
  }
  
  const { shouldUseAnimation } = performanceContext;
  
  // 在低端设备上不使用will-change以避免额外开销
  if (!shouldUseAnimation("high")) {
    return null;
  }
  
  return properties.join(", ");
};

/**
 * 优化requestAnimationFrame动画
 * @param {function} animationFn - 动画函数
 * @param {object} performanceContext - 性能上下文
 * @returns {function} 优化后的动画函数
 */
export const optimizeRAF = (animationFn, performanceContext) => {
  if (!performanceContext) {
    return animationFn;
  }
  
  const { shouldUseAnimation } = performanceContext;
  
  // 如果不应该使用动画，直接返回空函数
  if (!shouldUseAnimation()) {
    return () => {};
  }
  
  // 在低端设备上降低动画帧率
  if (!shouldUseAnimation("high")) {
    let frameCount = 0;
    return (timestamp) => {
      frameCount++;
      // 每两帧执行一次动画
      if (frameCount % 2 === 0) {
        animationFn(timestamp);
      }
    };
  }
  
  return animationFn;
};

/**
 * 创建优化的动画keyframes
 * @param {object} keyframes - 关键帧对象
 * @param {object} performanceContext - 性能上下文
 * @returns {object} 优化后的关键帧对象
 */
export const optimizeKeyframes = (keyframes, performanceContext) => {
  if (!performanceContext) {
    return keyframes;
  }
  
  const { shouldUseAnimation } = performanceContext;
  
  // 如果不应该使用复杂动画，简化关键帧
  if (!shouldUseAnimation("high")) {
    // 只保留开始和结束帧
    const simplifiedKeyframes = {};
    const keys = Object.keys(keyframes);
    if (keys.length > 0) {
      simplifiedKeyframes[keys[0]] = keyframes[keys[0]];
      simplifiedKeyframes[keys[keys.length - 1]] = keyframes[keys[keys.length - 1]];
    }
    return simplifiedKeyframes;
  }
  
  // 如果是中等性能设备，减少中间帧
  if (!shouldUseAnimation("medium")) {
    const simplifiedKeyframes = {};
    const keys = Object.keys(keyframes);
    if (keys.length > 0) {
      // 保留开始、1/4、3/4和结束帧
      simplifiedKeyframes[keys[0]] = keyframes[keys[0]];
      if (keys.length > 2) {
        const quarter = Math.floor(keys.length / 4);
        simplifiedKeyframes[keys[quarter]] = keyframes[keys[quarter]];
        simplifiedKeyframes[keys[keys.length - quarter - 1]] = keyframes[keys[keys.length - quarter - 1]];
      }
      simplifiedKeyframes[keys[keys.length - 1]] = keyframes[keys[keys.length - 1]];
    }
    return simplifiedKeyframes;
  }
  
  return keyframes;
};

/**
 * 创建CSS动画优化配置
 * @param {object} performanceContext - 性能上下文
 * @returns {object} 动画配置对象
 */
export const createAnimationConfig = (performanceContext) => {
  if (!performanceContext) {
    return {
      durationMultiplier: 1,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
      shouldAnimate: true
    };
  }
  
  const { animationComplexity, shouldUseAnimation, getAnimationDuration } = performanceContext;
  
  // 根据性能等级调整动画配置
  switch (animationComplexity) {
    case "high":
      return {
        durationMultiplier: 1,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        shouldAnimate: shouldUseAnimation()
      };
    case "medium":
      return {
        durationMultiplier: 0.8,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        shouldAnimate: shouldUseAnimation("medium")
      };
    case "low":
      return {
        durationMultiplier: 0.5,
        easing: "linear",
        shouldAnimate: shouldUseAnimation("low")
      };
    default:
      return {
        durationMultiplier: 1,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        shouldAnimate: true
      };
  }
};

/**
 * 优化组件动画属性
 * @param {object} componentProps - 组件属性
 * @param {object} performanceContext - 性能上下文
 * @returns {object} 优化后的组件属性
 */
export const optimizeComponentAnimation = (componentProps, performanceContext) => {
  if (!performanceContext) {
    return componentProps;
  }
  
  const { shouldUseAnimation } = performanceContext;
  const optimizedProps = { ...componentProps };
  
  // 如果不应该使用动画，移除动画相关属性
  if (!shouldUseAnimation()) {
    delete optimizedProps.transition;
    delete optimizedProps.animation;
    delete optimizedProps.style?.transition;
    delete optimizedProps.style?.animation;
    
    // 移除MUI动画相关属性
    delete optimizedProps.TransitionComponent;
    delete optimizedProps.timeout;
  }
  
  return optimizedProps;
};