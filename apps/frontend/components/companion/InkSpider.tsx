'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface InkSpiderProps {
  size?: 'sm' | 'md' | 'lg';
  isThinking?: boolean;
  className?: string;
}

export function InkSpider({
  size = 'md',
  isThinking = false,
  className = '',
}: InkSpiderProps) {
  const sizeMap = {
    sm: { dimension: 24, strokeWidth: 1.4 },
    md: { dimension: 32, strokeWidth: 1.5 },
    lg: { dimension: 44, strokeWidth: 1.6 },
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
            ? { scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }
            : { scale: 1, rotate: 0 }
        }
        transition={{
          repeat: isThinking ? Infinity : 0,
          duration: 1.5,
          ease: 'easeInOut',
        }}
      >
        {/* Subtle Network Filament Connectors */}
        <g stroke="#3a3f52" strokeWidth={strokeWidth * 0.7} strokeLinecap="round" strokeDasharray="1 1.5">
          <line x1="16" y1="16" x2="6" y2="7" />
          <line x1="16" y1="16" x2="26" y2="7" />
          <line x1="16" y1="16" x2="5" y2="25" />
          <line x1="16" y1="16" x2="27" y2="25" />
        </g>

        {/* Ink Legs (Fine Hand-Drawn Linework) */}
        <g stroke="#d1d5db" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          {/* Top Left Leg */}
          <path d="M 14 13 Q 8 9 5 12" />
          {/* Mid-top Left Leg */}
          <path d="M 13 15 Q 7 14 4 18" />
          {/* Mid-bottom Left Leg */}
          <path d="M 13 17 Q 8 20 6 24" />
          {/* Bottom Left Leg */}
          <path d="M 14 19 Q 10 24 9 27" />

          {/* Top Right Leg */}
          <path d="M 18 13 Q 24 9 27 12" />
          {/* Mid-top Right Leg */}
          <path d="M 19 15 Q 25 14 28 18" />
          {/* Mid-bottom Right Leg */}
          <path d="M 19 17 Q 24 20 26 24" />
          {/* Bottom Right Leg */}
          <path d="M 18 19 Q 22 24 23 27" />
        </g>

        {/* Central Hub (Abdomen / Head - Editorial Hexagonal / Teardrop Node) */}
        <ellipse cx="16" cy="17" rx="3.5" ry="4.5" fill="#14161d" stroke="#f4f5f8" strokeWidth={strokeWidth} />
        <circle cx="16" cy="11.5" r="2.2" fill="#14161d" stroke="#f4f5f8" strokeWidth={strokeWidth} />

        {/* Muted Crimson Focal Point (Awareness / Spending Leak Sensor) */}
        <circle cx="16" cy="15.5" r="1.3" fill="#c02643" />
        <circle cx="16" cy="11.2" r="0.7" fill="#c02643" />

        {/* Corner Network Micro-Nodes */}
        <circle cx="5" cy="12" r="0.9" fill="#9499ab" />
        <circle cx="4" cy="18" r="0.9" fill="#9499ab" />
        <circle cx="6" cy="24" r="0.9" fill="#9499ab" />
        <circle cx="27" cy="12" r="0.9" fill="#9499ab" />
        <circle cx="28" cy="18" r="0.9" fill="#9499ab" />
        <circle cx="26" cy="24" r="0.9" fill="#9499ab" />
      </motion.svg>
    </div>
  );
}
