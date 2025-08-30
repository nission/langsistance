import { createTheme } from "@mui/material/styles";
import { colors } from "./colors";

// 现代极简主题配置 - Material Design 3
export const createAppTheme = (isDark) => {
  // 基于深色/浅色模式定义配色方案
  const palette = isDark
    ? {
        mode: "dark",
        primary: {
          main: colors.primary,
          light: colors.primaryLight,
          dark: colors.primaryDark,
          contrastText: colors.white,
        },
        secondary: {
          main: colors.secondary,
          light: colors.secondaryLight,
          dark: colors.secondaryDark,
          contrastText: colors.white,
        },
        accent: {
          main: colors.accent,
          light: colors.accentLight,
          dark: colors.accentDark,
        },
        success: {
          main: colors.success,
          light: colors.successLight,
          contrastText: colors.white,
        },
        warning: {
          main: colors.warning,
          light: colors.warningLight,
          contrastText: colors.white,
        },
        error: {
          main: colors.error,
          light: colors.errorLight,
          contrastText: colors.white,
        },
        info: {
          main: colors.info,
          light: colors.infoLight,
          contrastText: colors.white,
        },
        background: {
          default: colors.dark.background,
          paper: colors.dark.card,
        },
        surface: {
          main: colors.dark.surface,
          soft: colors.dark.cardSoft,
        },
        text: {
          primary: colors.dark.text,
          secondary: colors.dark.textSecondary,
          disabled: colors.dark.textDisabled,
        },
        divider: colors.dark.border,
        action: {
          hover: colors.dark.hover,
          selected: colors.dark.active,
          focus: colors.dark.focus,
        },
      }
    : {
        mode: "light",
        primary: {
          main: colors.primary,
          light: colors.primaryLight,
          dark: colors.primaryDark,
          contrastText: colors.white,
        },
        secondary: {
          main: colors.secondary,
          light: colors.secondaryLight,
          dark: colors.secondaryDark,
          contrastText: colors.white,
        },
        accent: {
          main: colors.accent,
          light: colors.accentLight,
          dark: colors.accentDark,
        },
        success: {
          main: colors.success,
          light: colors.successLight,
          contrastText: colors.white,
        },
        warning: {
          main: colors.warning,
          light: colors.warningLight,
          contrastText: colors.white,
        },
        error: {
          main: colors.error,
          light: colors.errorLight,
          contrastText: colors.white,
        },
        info: {
          main: colors.info,
          light: colors.infoLight,
          contrastText: colors.white,
        },
        background: {
          default: colors.background,
          paper: colors.card,
        },
        surface: {
          main: colors.surface,
          soft: colors.cardSoft,
        },
        text: {
          primary: colors.textPrimary,
          secondary: colors.textSecondary,
          disabled: colors.textDisabled,
        },
        divider: colors.border,
        action: {
          hover: colors.hover,
          selected: colors.active,
          focus: colors.focus,
        },
      };

  // 使用 Material Design 3 规范创建主题
  return createTheme({
    palette,
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 1024,
        lg: 1440,
        xl: 1920,
      },
    },
    typography: {
      fontFamily: '"Inter", "SF Pro Display", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: "2.5rem",
        fontWeight: 600,
        letterSpacing: "-0.02em",
        lineHeight: 1.2,
      },
      h2: {
        fontSize: "2rem",
        fontWeight: 600,
        letterSpacing: "-0.01em",
        lineHeight: 1.3,
      },
      h3: {
        fontSize: "1.75rem",
        fontWeight: 600,
        letterSpacing: "-0.01em",
        lineHeight: 1.3,
      },
      h4: {
        fontSize: "1.5rem",
        fontWeight: 600,
        letterSpacing: "0em",
        lineHeight: 1.4,
      },
      h5: {
        fontSize: "1.25rem",
        fontWeight: 600,
        letterSpacing: "0em",
        lineHeight: 1.4,
      },
      h6: {
        fontSize: "1.125rem",
        fontWeight: 600,
        letterSpacing: "0em",
        lineHeight: 1.4,
      },
      body1: {
        fontSize: "1rem",
        fontWeight: 400,
        lineHeight: 1.6,
        letterSpacing: "0.01em",
      },
      body2: {
        fontSize: "0.875rem",
        fontWeight: 400,
        lineHeight: 1.5,
        letterSpacing: "0.01em",
      },
      button: {
        textTransform: "none",
        fontWeight: 500,
        letterSpacing: "0.02em",
      },
      caption: {
        fontSize: "0.75rem",
        fontWeight: 400,
        lineHeight: 1.4,
        letterSpacing: "0.03em",
      },
    },
    shape: {
      borderRadius: 12, // 现代圆角设计
    },
    shadows: isDark ? [
      "none",
      colors.darkShadows.xs,
      colors.darkShadows.sm,
      colors.darkShadows.md,
      colors.darkShadows.lg,
      colors.darkShadows.xl,
      colors.darkShadows["2xl"],
      colors.darkShadows["2xl"],
      colors.darkShadows["2xl"],
      colors.darkShadows["2xl"],
      colors.darkShadows["2xl"],
      colors.darkShadows["2xl"],
      colors.darkShadows["2xl"],
      colors.darkShadows["2xl"],
      colors.darkShadows["2xl"],
      colors.darkShadows["2xl"],
      colors.darkShadows["2xl"],
      colors.darkShadows["2xl"],
      colors.darkShadows["2xl"],
      colors.darkShadows["2xl"],
      colors.darkShadows["2xl"],
      colors.darkShadows["2xl"],
      colors.darkShadows["2xl"],
      colors.darkShadows["2xl"],
      colors.darkShadows["2xl"],
    ] : [
      "none",
      colors.shadows.xs,
      colors.shadows.sm,
      colors.shadows.md,
      colors.shadows.lg,
      colors.shadows.xl,
      colors.shadows["2xl"],
      colors.shadows["2xl"],
      colors.shadows["2xl"],
      colors.shadows["2xl"],
      colors.shadows["2xl"],
      colors.shadows["2xl"],
      colors.shadows["2xl"],
      colors.shadows["2xl"],
      colors.shadows["2xl"],
      colors.shadows["2xl"],
      colors.shadows["2xl"],
      colors.shadows["2xl"],
      colors.shadows["2xl"],
      colors.shadows["2xl"],
      colors.shadows["2xl"],
      colors.shadows["2xl"],
      colors.shadows["2xl"],
      colors.shadows["2xl"],
      colors.shadows["2xl"],
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarWidth: "thin",
            scrollbarColor: isDark 
              ? `${colors.dark.borderSoft} ${colors.dark.background}`
              : `${colors.borderSoft} ${colors.background}`,
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-track": {
              background: isDark ? colors.dark.background : colors.background,
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: isDark ? colors.dark.borderSoft : colors.borderSoft,
              borderRadius: "4px",
              "&:hover": {
                backgroundColor: isDark ? colors.dark.border : colors.border,
              },
            },
          },
        },
      },
      MuiButtonBase: {
        defaultProps: {
          disableRipple: false,
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            textTransform: "none",
            fontWeight: 500,
            padding: "10px 20px",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "none",
            "&:hover": {
              transform: "translateY(-1px)",
              boxShadow: isDark ? colors.darkShadows.md : colors.shadows.md,
            },
            "&:active": {
              transform: "translateY(0)",
              transition: "all 0.1s cubic-bezier(0.4, 0, 0.2, 1)",
            },
            "&.Mui-disabled": {
              transform: "none",
              boxShadow: "none",
            },
          },
          contained: {
            background: colors.gradients.primary,
            color: colors.white,
            "&:hover": {
              background: colors.gradients.primary,
              filter: "brightness(1.1)",
            },
          },
          outlined: {
            borderColor: isDark ? colors.dark.border : colors.border,
            color: isDark ? colors.dark.text : colors.textPrimary,
            "&:hover": {
              borderColor: palette.primary.main,
              backgroundColor: isDark ? colors.dark.hover : colors.hover,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: `1px solid ${isDark ? colors.dark.border : colors.borderSoft}`,
            boxShadow: isDark ? colors.darkShadows.sm : colors.shadows.sm,
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: isDark ? colors.darkShadows.lg : colors.shadows.lg,
              borderColor: isDark ? colors.dark.borderSoft : colors.border,
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: 12,
              backgroundColor: isDark ? colors.dark.backgroundSoft : colors.backgroundSoft,
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              "& fieldset": {
                borderColor: isDark ? colors.dark.border : colors.borderSoft,
                borderWidth: "1px",
              },
              "&:hover fieldset": {
                borderColor: isDark ? colors.dark.borderSoft : colors.border,
              },
              "&.Mui-focused": {
                backgroundColor: isDark ? colors.dark.card : colors.card,
                "& fieldset": {
                  borderColor: palette.primary.main,
                  borderWidth: "2px",
                },
                boxShadow: `0 0 0 4px ${palette.primary.main}20`,
              },
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: `1px solid ${isDark ? colors.dark.border : colors.borderSoft}`,
            boxShadow: isDark ? colors.darkShadows.sm : colors.shadows.sm,
            backgroundImage: "none",
          },
          elevation1: {
            boxShadow: isDark ? colors.darkShadows.sm : colors.shadows.sm,
          },
          elevation2: {
            boxShadow: isDark ? colors.darkShadows.md : colors.shadows.md,
          },
          elevation3: {
            boxShadow: isDark ? colors.darkShadows.lg : colors.shadows.lg,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? colors.dark.card : colors.card,
            color: isDark ? colors.dark.text : colors.textPrimary,
            boxShadow: isDark ? colors.darkShadows.sm : colors.shadows.sm,
            borderBottom: `1px solid ${isDark ? colors.dark.border : colors.borderSoft}`,
            backdropFilter: "blur(20px)",
            background: isDark 
              ? `${colors.dark.backdropBlur}`
              : `${colors.backdropBlur}`,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: `1px solid ${isDark ? colors.dark.border : colors.borderSoft}`,
            backgroundColor: isDark ? colors.dark.card : colors.card,
            boxShadow: isDark ? colors.darkShadows.lg : colors.shadows.lg,
          },
        },
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            margin: "4px 8px",
            "&.Mui-selected": {
              backgroundColor: isDark ? colors.dark.active : colors.active,
              "&:hover": {
                backgroundColor: isDark ? colors.dark.hover : colors.hover,
              },
            },
            "&:hover": {
              backgroundColor: isDark ? colors.dark.hover : colors.hover,
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              transform: "scale(1.05)",
              backgroundColor: isDark ? colors.dark.hover : colors.hover,
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            fontWeight: 500,
            fontSize: "0.75rem",
          },
        },
      },
    },
  });
};