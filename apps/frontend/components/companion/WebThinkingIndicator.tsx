'use client';

import React from 'react';
import { motion, type Variants } from 'framer-motion';

export function WebThinkingIndicator() {
  const dotVariants: Variants = {
    animate: (i: number) => ({
      y: [0, -5, 0],
      opacity: [0.4, 1, 0.4],
      transition: {
        repeat: Infinity,
        duration: 1.2,
        delay: i * 0.2,
        ease: 'easeInOut' as const,
      },
    }),
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400">
      <span className="text-[11px] font-medium text-slate-400">Spinning numbers</span>
      <div className="relative flex items-center gap-2.5">
        {/* Subtle interconnecting web thread */}
        <svg className="absolute -top-1 left-0 h-4 w-12 pointer-events-none" viewBox="0 0 48 16">
          <path
            d="M 6 8 Q 18 12 24 8 Q 30 4 42 8"
            fill="none"
            stroke="#e11d48"
            strokeWidth="0.8"
            strokeOpacity="0.4"
            strokeDasharray="2 2"
          />
        </svg>

        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            custom={i}
            variants={dotVariants}
            animate="animate"
            className="h-1.5 w-1.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/40"
          />
        ))}
      </div>
    </div>
  );
}
