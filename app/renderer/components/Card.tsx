import React from 'react';
import { motion } from 'framer-motion';
import { theme } from '../styles/theme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'gradient' | 'outlined';
  padding?: string;
  hover?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = theme.spacing.lg,
  hover = false,
  onClick,
  className = '',
  style = {},
}) => {
  const variants = {
    default: {
      background: theme.colors.surface,
      border: `1px solid ${theme.colors.border}`,
      boxShadow: theme.shadows.md,
    },
    glass: {
      background: theme.colors.glassBg,
      backdropFilter: 'blur(10px)',
      border: `1px solid ${theme.colors.glassBoderLight}`,
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
    },
    gradient: {
      background: `linear-gradient(135deg, ${theme.colors.surface}, ${theme.colors.surfaceHover})`,
      border: `1px solid ${theme.colors.border}`,
      boxShadow: theme.shadows.lg,
    },
    outlined: {
      background: 'transparent',
      border: `2px solid ${theme.colors.border}`,
      boxShadow: 'none',
    },
  };

  return (
    <motion.div
      className={`card ${className}`}
      whileHover={hover ? { y: -4, boxShadow: theme.shadows.xl } : {}}
      transition={{ type: 'spring', stiffness: 300 }}
      onClick={onClick}
      style={{
        ...variants[variant],
        padding,
        borderRadius: theme.borderRadius.lg,
        cursor: onClick ? 'pointer' : 'default',
        transition: `all ${theme.transitions.normal}`,
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
};