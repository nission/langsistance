import { createTheme } from "@mui/material/styles";
import { colors } from "./colors";

// Material Design 3 theme configuration
export const createAppTheme = (isDark) => {
  // Define color scheme based on dark/light mode
  const palette = isDark
    ? {
        mode: "dark",
        primary: {
          main: colors.primary,
          light: colors.primaryLight,
          dark: colors.primaryDark,
        },
        secondary: {
          main: colors.secondary,
          light: colors.secondaryLight,
          dark: colors.secondaryDark,
        },
        accent: {
          main: colors.accent,
          light: colors.accentLight,
          dark: colors.accentDark,
        },
        success: {
          main: colors.success,
          light: colors.successLight,
        },
        warning: {
          main: colors.warning,
          light: colors.warningLight,
        },
        error: {
          main: colors.error,
          light: colors.errorLight,
        },
        info: {
          main: colors.info,
          light: colors.infoLight,
        },
        background: {
          default: colors.darkBackground,
          paper: colors.darkCard,
        },
        text: {
          primary: colors.darkText,
          secondary: colors.darkTextSecondary,
        },
        divider: colors.darkBorder,
      }
    : {
        mode: "light",
        primary: {
          main: colors.primary,
          light: colors.primaryLight,
          dark: colors.primaryDark,
        },
        secondary: {
          main: colors.secondary,
          light: colors.secondaryLight,
          dark: colors.secondaryDark,
        },
        accent: {
          main: colors.accent,
          light: colors.accentLight,
          dark: colors.accentDark,
        },
        success: {
          main: colors.success,
          light: colors.successLight,
        },
        warning: {
          main: colors.warning,
          light: colors.warningLight,
        },
        error: {
          main: colors.error,
          light: colors.errorLight,
        },
        info: {
          main: colors.info,
          light: colors.infoLight,
        },
        background: {
          default: colors.background,
          paper: colors.card,
        },
        text: {
          primary: colors.textPrimary,
          secondary: colors.textSecondary,
        },
        divider: colors.border,
      };

  // Create theme with Material Design 3 specifications
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
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: "2.5rem",
        fontWeight: 500,
      },
      h2: {
        fontSize: "2rem",
        fontWeight: 500,
      },
      h3: {
        fontSize: "1.75rem",
        fontWeight: 500,
      },
      h4: {
        fontSize: "1.5rem",
        fontWeight: 500,
      },
      h5: {
        fontSize: "1.25rem",
        fontWeight: 500,
      },
      h6: {
        fontSize: "1.125rem",
        fontWeight: 500,
      },
      body1: {
        fontSize: "1rem",
      },
      body2: {
        fontSize: "0.875rem",
      },
      button: {
        textTransform: "none",
        fontWeight: 500,
      },
    },
    shape: {
      borderRadius: 12, // Material Design 3 rounded corners
    },
    components: {
      MuiButtonBase: {
        defaultProps: {
          disableRipple: false, // 确保启用涟漪效果
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 24, // More rounded buttons for MD3
            textTransform: "none",
            fontWeight: 500,
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)", // Material Design standard easing
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)",
            },
            "&:active": {
              transform: "translateY(0)",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
              transition: "all 0.1s cubic-bezier(0.4, 0, 0.2, 1)",
            },
            "&.Mui-disabled": {
              transform: "none",
              boxShadow: "none",
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: isDark
              ? "0 2px 10px rgba(0, 0, 0, 0.3)"
              : "0 2px 10px rgba(0, 0, 0, 0.1)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              transform: "translateY(-4px)",
              boxShadow: isDark
                ? "0 8px 20px rgba(0, 0, 0, 0.4)"
                : "0 8px 20px rgba(0, 0, 0, 0.15)",
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)",
                },
              },
              "&.Mui-focused": {
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: palette.primary.main,
                  borderWidth: "2px",
                },
                boxShadow: isDark
                  ? `0 0 0 4px ${palette.primary.main}20`
                  : `0 0 0 4px ${palette.primary.main}30`,
              },
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: isDark
              ? "0 2px 10px rgba(0, 0, 0, 0.3)"
              : "0 2px 10px rgba(0, 0, 0, 0.1)",
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? colors.darkCard : colors.card,
            color: isDark ? colors.darkText : colors.textPrimary,
          },
        },
      },
    },
  });
};