import React from 'react';
import { motion } from 'framer-motion';
import { theme } from '../styles/theme';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...props
}) => {
  const variants = {
    primary: {
      background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark})`,
      color: theme.colors.text,
      border: 'none',
      boxShadow: `0 4px 20px rgba(99, 102, 241, 0.25)`,
    },
    secondary: {
      background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.secondaryDark})`,
      color: theme.colors.text,
      border: 'none',
      boxShadow: `0 4px 20px rgba(236, 72, 153, 0.25)`,
    },
    ghost: {
      background: 'transparent',
      color: theme.colors.text,
      border: `1px solid ${theme.colors.border}`,
      boxShadow: 'none',
    },
    danger: {
      background: `linear-gradient(135deg, ${theme.colors.error}, #dc2626)`,
      color: theme.colors.text,
      border: 'none',
      boxShadow: `0 4px 20px rgba(239, 68, 68, 0.25)`,
    },
    success: {
      background: `linear-gradient(135deg, ${theme.colors.success}, #059669)`,
      color: theme.colors.text,
      border: 'none',
      boxShadow: `0 4px 20px rgba(16, 185, 129, 0.25)`,
    },
  };

  const sizes = {
    sm: {
      padding: '8px 16px',
      fontSize: theme.typography.fontSize.sm,
      borderRadius: theme.borderRadius.sm,
    },
    md: {
      padding: '12px 24px',
      fontSize: theme.typography.fontSize.md,
      borderRadius: theme.borderRadius.md,
    },
    lg: {
      padding: '16px 32px',
      fontSize: theme.typography.fontSize.lg,
      borderRadius: theme.borderRadius.lg,
    },
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02, y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      style={{
        ...variants[variant],
        ...sizes[size],
        width: fullWidth ? '100%' : 'auto',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontWeight: theme.typography.fontWeight.semibold,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.5 : 1,
        transition: `all ${theme.transitions.fast}`,
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{
              width: '20px',
              height: '20px',
              border: `2px solid ${theme.colors.text}`,
              borderTopColor: 'transparent',
              borderRadius: '50%',
            }}
          />
        </div>
      )}
      {icon && iconPosition === 'left' && <span>{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span>{icon}</span>}
    </motion.button>
  );
};