export const theme = {
  colors: {
    primary: '#6366f1',
    primaryDark: '#4f46e5',
    primaryLight: '#818cf8',
    secondary: '#ec4899',
    secondaryDark: '#db2777',
    secondaryLight: '#f472b6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    background: '#0a0a0b',
    backgroundSecondary: '#111113',
    backgroundTertiary: '#18181b',
    
    surface: '#1a1a1f',
    surfaceHover: '#25252b',
    surfaceActive: '#2d2d35',
    
    border: '#2e2e38',
    borderHover: '#3e3e4a',
    
    text: '#f4f4f5',
    textSecondary: '#a1a1aa',
    textTertiary: '#71717a',
    textInverse: '#09090b',
    
    glassBg: 'rgba(10, 10, 11, 0.7)',
    glassBoderLight: 'rgba(255, 255, 255, 0.1)',
    glassBorderDark: 'rgba(0, 0, 0, 0.2)',
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  
  borderRadius: {
    sm: '6px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    full: '9999px',
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    glow: '0 0 40px rgba(99, 102, 241, 0.3)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },
  
  transitions: {
    fast: '150ms ease',
    normal: '250ms ease',
    slow: '350ms ease',
  },
  
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    fontFamilyMono: '"JetBrains Mono", "SF Mono", Consolas, monospace',
    fontSize: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  animations: {
    fadeIn: 'fadeIn 250ms ease',
    slideIn: 'slideIn 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    scaleIn: 'scaleIn 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  },
  
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
};

export type Theme = typeof theme;