'use client';

import { createTheme, Theme } from '@mui/material/styles';

// Base theme options shared between light and dark
const baseTheme = {
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    h1: {
      fontSize: '2.25rem',
      fontWeight: 600,
      lineHeight: 1.25,
    },
    h2: {
      fontSize: '1.875rem',
      fontWeight: 600,
      lineHeight: 1.25,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.25,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.25,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.25,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.25,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none' as const,
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: '8px 16px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: 'var(--tooltip-bg)',
          color: 'var(--tooltip-text)',
          fontSize: '0.75rem',
        },
        arrow: {
          color: 'var(--tooltip-bg)',
        },
      },
    },
  },
};

// Light theme
export const lightTheme: Theme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'light',
    primary: {
      main: '#667eea',
      dark: '#5a67d8',
      light: '#818cf8',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#764ba2',
      dark: '#6b21a8',
      light: '#9333ea',
      contrastText: '#ffffff',
    },
    success: {
      main: '#10b981',
      dark: '#059669',
      light: '#34d399',
    },
    warning: {
      main: '#f59e0b',
      dark: '#d97706',
      light: '#fbbf24',
    },
    error: {
      main: '#ef4444',
      dark: '#dc2626',
      light: '#f87171',
    },
    grey: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    background: {
      default: '#f9fafb',
      paper: '#ffffff',
    },
    text: {
      primary: '#111827',
      secondary: '#6b7280',
    },
  },
});

// Dark theme
export const darkTheme: Theme = createTheme({
  ...baseTheme,
  components: {
    ...baseTheme.components,
    MuiAlert: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e293b',
          color: '#f1f5f9',
        },
        standardSuccess: {
          backgroundColor: 'rgba(52, 211, 153, 0.15)',
          color: '#34d399',
        },
        standardError: {
          backgroundColor: 'rgba(248, 113, 113, 0.15)',
          color: '#f87171',
        },
        standardWarning: {
          backgroundColor: 'rgba(251, 191, 36, 0.15)',
          color: '#fbbf24',
        },
        standardInfo: {
          backgroundColor: 'rgba(129, 140, 248, 0.15)',
          color: '#818cf8',
        },
      },
    },
  },
  palette: {
    mode: 'dark',
    primary: {
      main: '#818cf8',
      dark: '#667eea',
      light: '#a5b4fc',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#a78bfa',
      dark: '#8b5cf6',
      light: '#c4b5fd',
      contrastText: '#ffffff',
    },
    success: {
      main: '#34d399',
      dark: '#10b981',
      light: '#6ee7b7',
    },
    warning: {
      main: '#fbbf24',
      dark: '#f59e0b',
      light: '#fcd34d',
    },
    error: {
      main: '#f87171',
      dark: '#ef4444',
      light: '#fca5a5',
    },
    grey: {
      50: '#111827',
      100: '#1f2937',
      200: '#374151',
      300: '#4b5563',
      400: '#6b7280',
      500: '#9ca3af',
      600: '#d1d5db',
      700: '#e5e7eb',
      800: '#f3f4f6',
      900: '#f9fafb',
    },
    background: {
      default: '#4b5563',
      paper: '#1e293b',
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#94a3b8',
    },
  },
});

// Default export for backwards compatibility
export const theme = lightTheme;
