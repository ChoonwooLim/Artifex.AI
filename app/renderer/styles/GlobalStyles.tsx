import React from 'react';
import { theme } from './theme';

export const GlobalStyles: React.FC = () => {
  return (
    <style jsx global>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      html {
        font-size: 16px;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      
      body {
        font-family: ${theme.typography.fontFamily};
        background: ${theme.colors.background};
        color: ${theme.colors.text};
        line-height: ${theme.typography.lineHeight.normal};
        overflow-x: hidden;
      }
      
      ::-webkit-scrollbar {
        width: 10px;
        height: 10px;
      }
      
      ::-webkit-scrollbar-track {
        background: ${theme.colors.backgroundSecondary};
      }
      
      ::-webkit-scrollbar-thumb {
        background: ${theme.colors.border};
        border-radius: ${theme.borderRadius.full};
        transition: background ${theme.transitions.fast};
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background: ${theme.colors.borderHover};
      }
      
      ::selection {
        background: ${theme.colors.primary};
        color: ${theme.colors.text};
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes slideIn {
        from { 
          opacity: 0;
          transform: translateY(10px);
        }
        to { 
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes scaleIn {
        from { 
          opacity: 0;
          transform: scale(0.95);
        }
        to { 
          opacity: 1;
          transform: scale(1);
        }
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      
      @keyframes rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      .glass-effect {
        background: ${theme.colors.glassBg};
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid ${theme.colors.glassBoderLight};
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
      }
      
      .gradient-primary {
        background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary});
      }
      
      .gradient-mesh {
        background-image: 
          radial-gradient(at 40% 20%, rgba(99, 102, 241, 0.3) 0px, transparent 50%),
          radial-gradient(at 80% 0%, rgba(236, 72, 153, 0.2) 0px, transparent 50%),
          radial-gradient(at 0% 50%, rgba(59, 130, 246, 0.2) 0px, transparent 50%),
          radial-gradient(at 80% 80%, rgba(168, 85, 247, 0.2) 0px, transparent 50%),
          radial-gradient(at 0% 100%, rgba(236, 72, 153, 0.2) 0px, transparent 50%);
      }
      
      .text-gradient {
        background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary});
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .shimmer {
        background: linear-gradient(
          90deg,
          ${theme.colors.surface} 0%,
          ${theme.colors.surfaceHover} 50%,
          ${theme.colors.surface} 100%
        );
        background-size: 200% 100%;
        animation: shimmer 1.5s ease-in-out infinite;
      }
      
      .no-select {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
      
      button {
        cursor: pointer;
        font-family: inherit;
        transition: all ${theme.transitions.fast};
      }
      
      input, select, textarea {
        font-family: inherit;
      }
      
      a {
        color: ${theme.colors.primary};
        text-decoration: none;
        transition: color ${theme.transitions.fast};
      }
      
      a:hover {
        color: ${theme.colors.primaryLight};
      }
      
      code {
        font-family: ${theme.typography.fontFamilyMono};
        background: ${theme.colors.surface};
        padding: 2px 6px;
        border-radius: ${theme.borderRadius.sm};
        font-size: 0.9em;
      }
      
      pre {
        font-family: ${theme.typography.fontFamilyMono};
        background: ${theme.colors.surface};
        padding: ${theme.spacing.md};
        border-radius: ${theme.borderRadius.md};
        overflow-x: auto;
      }
    `}</style>
  );
};