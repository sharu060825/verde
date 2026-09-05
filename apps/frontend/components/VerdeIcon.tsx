'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface VerdeIconProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isThinking?: boolean;
  className?: string;
}

export function VerdeIcon({
  size = 'md',
  isThinking = false,
  className = '',
}: VerdeIconProps) {
  const sizeMap = {
    sm: { dimension: 20, strokeWidth: 1.5 },
    md: { dimension: 28, strokeWidth: 1.6 },
    lg: { dimension: 38, strokeWidth: 1.8 },
    xl: { dimension: 52, strokeWidth: 2.0 },
  };

  const { dimension, strokeWidth } = sizeMap[size];

  return (
    <div className={`relative inline-flex items-center justify-center select-none ${className}`}>
      <motion.svg
        width={dimension}
        height={dimension}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={
          isThinking
            ? { scale: [1, 1.08, 1], rotate: [0, 180, 360] }
            : { scale: 1, rotate: 0 }
        }
        transition={{
          repeat: isThinking ? Infinity : 0,
          duration: 2.5,
          ease: 'easeInOut',
        }}
      >
        {/* Diamond Outer Boundary — Geometric Financial Shield */}
        <path
          d="M 16 3 L 28 16 L 16 29 L 4 16 Z"
          stroke="#0f5132"
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          fill="#f0fdf4"
        />

        {/* Central Geometric V / Growth Spire in Emerald Green */}
        <path
          d="M 9 12 L 16 23 L 23 12"
          stroke="#15803d"
          strokeWidth={strokeWidth + 0.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Vertical Center Axis / Growth Pillar */}
        <line
          x1="16"
          y1="8"
          x2="16"
          y2="20"
          stroke="#0a0d0b"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Minimalist Top Node (Pinnacle of Capital / Discipline) */}
        <circle cx="16" cy="8" r="1.5" fill="#15803d" />
      </motion.svg>
    </div>
  );
}
