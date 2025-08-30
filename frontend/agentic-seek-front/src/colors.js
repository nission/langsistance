export const colors = {
  // Primary colors - 现代极简蓝色系
  primary: "#4f46e5", // 更柔和的紫蓝色
  primaryLight: "#e0e7ff", // 极淡的紫蓝色
  primaryDark: "#3730a3", // 深紫蓝色
  primarySoft: "#f0f4ff", // 极淡背景色

  // Secondary colors - 现代中性灰
  secondary: "#6b7280", // 温和的灰色
  secondaryLight: "#f9fafb", // 极淡灰色
  secondaryDark: "#111827", // 深灰色
  secondaryMuted: "#f3f4f6", // 柔和灰色

  // Accent colors - 现代橙色系
  accent: "#f59e0b",
  accentLight: "#fef3c7",
  accentDark: "#d97706",
  accentSoft: "#fffbeb", // 极淡橙色

  // Status colors - 现代状态色
  success: "#059669", // 现代绿色
  successLight: "#d1fae5",
  successSoft: "#ecfdf5",
  warning: "#d97706", // 现代橙色
  warningLight: "#fed7aa",
  warningSoft: "#fffbeb",
  error: "#dc2626", // 现代红色
  errorLight: "#fecaca",
  errorSoft: "#fef2f2",
  info: "#0891b2", // 现代青色
  infoLight: "#a7f3d0",
  infoSoft: "#f0fdfa",

  // Neutral colors - 极简调色板
  white: "#ffffff",
  gray50: "#fafafa", // 极淡灰
  gray100: "#f5f5f5", // 很淡灰
  gray200: "#e5e5e5", // 淡灰
  gray300: "#d4d4d4", // 中淡灰
  gray400: "#a3a3a3", // 中灰
  gray500: "#737373", // 标准灰
  gray600: "#525252", // 深灰
  gray700: "#404040", // 很深灰
  gray800: "#262626", // 极深灰
  gray900: "#171717", // 接近黑色
  black: "#000000",

  // Text colors - 现代文本色彩
  textPrimary: "#111827", // 深灰色文本，比纯黑更柔和
  textSecondary: "#6b7280", // 中性灰色文本
  textTertiary: "#9ca3af", // 淡灰色文本
  textDisabled: "#d1d5db", // 禁用状态文本

  // Background colors - 极简背景
  background: "#fafafa", // 极淡灰背景
  backgroundSoft: "#f9fafb", // 柔和背景
  card: "#ffffff", // 卡片背景
  cardSoft: "#fefefe", // 柔和卡片背景
  surface: "#f8fafc", // 表面色

  // Border colors - 极简边框
  border: "#e5e7eb", // 淡边框
  borderSoft: "#f3f4f6", // 极淡边框
  divider: "#f1f3f4", // 分割线

  // Interactive colors - 交互状态
  hover: "#f8fafc", // 悬停背景
  active: "#f1f5f9", // 激活背景
  focus: "#e0e7ff", // 聚焦背景

  // Transparent colors
  transparent: "transparent",
  overlay: "rgba(17, 24, 39, 0.4)", // 遮罩层
  backdropBlur: "rgba(255, 255, 255, 0.8)", // 毛玻璃效果

  // Dark theme colors - 现代深色主题 (更温暖、更现代的配色)
  dark: {
    background: "#0a0a0b", // 现代深色背景 - 接近黑色但更温暖
    backgroundSoft: "#111113", // 柔和深色背景
    card: "#18181b", // 深色卡片 - 现代灰色调
    cardSoft: "#27272a", // 柔和深色卡片
    surface: "#09090b", // 深色表面
    
    border: "#27272a", // 深色边框 - 更柔和
    borderSoft: "#3f3f46", // 柔和深色边框
    divider: "#18181b", // 深色分割线
    
    text: "#fafafa", // 深色主题文本 - 更柔和的白色
    textSecondary: "#a1a1aa", // 深色次要文本 - 现代灰色
    textTertiary: "#71717a", // 深色第三级文本
    textDisabled: "#52525b", // 深色禁用文本
    
    hover: "#27272a", // 深色悬停
    active: "#3f3f46", // 深色激活
    focus: "#4f46e5", // 深色聚焦 - 使用主色调
    
    overlay: "rgba(10, 10, 11, 0.8)", // 深色遮罩
    backdropBlur: "rgba(24, 24, 27, 0.8)", // 深色毛玻璃
  },

  // Gradients - 现代渐变
  gradients: {
    primary: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
    secondary: "linear-gradient(135deg, #6b7280 0%, #374151 100%)",
    accent: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    success: "linear-gradient(135deg, #059669 0%, #047857 100%)",
    error: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
    surface: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
    darkSurface: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
  },

  // Shadows - 现代阴影系统
  shadows: {
    xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
    none: "none",
  },

  // Dark shadows
  darkShadows: {
    xs: "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
    sm: "0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.3)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)",
    "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
    inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)",
    none: "none",
  }
};
