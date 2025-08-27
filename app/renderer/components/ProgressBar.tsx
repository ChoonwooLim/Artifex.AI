import React from 'react';
import { motion } from 'framer-motion';
import { theme } from '../styles/theme';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  variant?: 'default' | 'gradient' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercentage = true,
  variant = 'gradient',
  size = 'md',
  animated = true,
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const sizes = {
    sm: { height: '6px', fontSize: '12px' },
    md: { height: '10px', fontSize: '14px' },
    lg: { height: '14px', fontSize: '16px' },
  };

  const backgrounds = {
    default: theme.colors.primary,
    gradient: `linear-gradient(90deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`,
    pulse: `linear-gradient(90deg, ${theme.colors.primary} 0%, ${theme.colors.primaryLight} 50%, ${theme.colors.primary} 100%)`,
  };

  return (
    <div style={{ width: '100%' }}>
      {(label || showPercentage) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: theme.spacing.sm,
            fontSize: sizes[size].fontSize,
            color: theme.colors.textSecondary,
          }}
        >
          {label && <span>{label}</span>}
          {showPercentage && (
            <span style={{ fontWeight: theme.typography.fontWeight.semibold }}>
              {percentage.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: sizes[size].height,
          background: theme.colors.backgroundTertiary,
          borderRadius: theme.borderRadius.full,
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={animated ? { width: 0 } : { width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: animated ? 0.5 : 0,
            ease: 'easeInOut',
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            background: backgrounds[variant],
            borderRadius: theme.borderRadius.full,
            boxShadow: `0 0 20px ${theme.colors.primary}40`,
          }}
        >
          {variant === 'pulse' && (
            <motion.div
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              }}
              style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                backgroundSize: '200% 100%',
              }}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
};