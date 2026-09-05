'use client';

import React, { useEffect, useRef, useState } from 'react';

interface ComposedNote {
  id: number;
  baseX: number; // Normalized relative to center (-1 to 1)
  baseY: number; // Normalized relative to center (-1 to 1)
  baseZ: number; // 3D depth (-150 to +150)
  rotX: number; // 3D Euler tilt
  rotY: number;
  rotZ: number;
  scale: number;
  type: '100' | '25' | '10';
  phase: number;
  freqX: number;
  freqY: number;
  ampX: number;
  ampY: number;
}

export function BanknotesCanvas({
  className = '',
}: {
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    // High DPI support
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.parentElement.clientWidth;
      height = canvas.parentElement.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };
    window.addEventListener('resize', handleResize);

    // Interactive Camera Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / width - 0.5) * 50;
      targetMouseY = (e.clientY / height - 0.5) * 40;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // ==========================================
    // Pre-render Fictional VERDE Banknotes
    // ==========================================
    const noteW = 160;
    const noteH = 86;

    const createNoteCanvas = (
      denom: '100' | '25' | '10',
      bgColor: string,
      primaryColor: string,
      secondaryColor: string
    ) => {
      const front = document.createElement('canvas');
      front.width = noteW * 2;
      front.height = noteH * 2;
      const fCtx = front.getContext('2d')!;
      fCtx.scale(2, 2);

      // Paper base
      fCtx.fillStyle = bgColor;
      fCtx.fillRect(0, 0, noteW, noteH);

      // Guilloche Borders
      fCtx.strokeStyle = primaryColor;
      fCtx.lineWidth = 1.5;
      fCtx.strokeRect(3.5, 3.5, noteW - 7, noteH - 7);

      fCtx.strokeStyle = secondaryColor;
      fCtx.lineWidth = 0.75;
      fCtx.strokeRect(6.5, 6.5, noteW - 13, noteH - 13);

      // Corner Accents
      fCtx.fillStyle = primaryColor;
      fCtx.fillRect(6.5, 6.5, 5, 5);
      fCtx.fillRect(noteW - 11.5, 6.5, 5, 5);
      fCtx.fillRect(6.5, noteH - 11.5, 5, 5);
      fCtx.fillRect(noteW - 11.5, noteH - 11.5, 5, 5);

      // Denominations
      fCtx.font = 'bold 10px "Segoe UI", Roboto, sans-serif';
      fCtx.fillStyle = '#0a0d0b';
      fCtx.fillText(denom, 10, 20);
      fCtx.fillText(denom, noteW - 28, 20);
      fCtx.fillText(denom, 10, noteH - 11);
      fCtx.fillText(denom, noteW - 28, noteH - 11);

      // Center Geometric Medallion
      fCtx.save();
      fCtx.translate(noteW / 2, noteH / 2);
      fCtx.strokeStyle = primaryColor;
      fCtx.lineWidth = 1.2;
      fCtx.beginPath();
      fCtx.moveTo(0, -19);
      fCtx.lineTo(25, 0);
      fCtx.lineTo(0, 19);
      fCtx.lineTo(-25, 0);
      fCtx.closePath();
      fCtx.stroke();

      fCtx.fillStyle = '#f0fdf4';
      fCtx.fill();

      // Wordmark
      fCtx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      fCtx.fillStyle = '#0a0d0b';
      fCtx.textAlign = 'center';
      fCtx.textBaseline = 'middle';
      fCtx.fillText('VERDE', 0, -2);

      fCtx.font = '6px sans-serif';
      fCtx.fillStyle = primaryColor;
      fCtx.fillText('RESERVE', 0, 8);
      fCtx.restore();

      // Serial Stamps
      fCtx.font = '5.5px monospace';
      fCtx.fillStyle = '#4b554f';
      fCtx.fillText(`VR-${denom}-2026`, 20, noteH - 10);
      fCtx.fillText('N° 8841-A', noteW - 58, noteH - 10);

      // BACK FACE
      const back = document.createElement('canvas');
      back.width = noteW * 2;
      back.height = noteH * 2;
      const bCtx = back.getContext('2d')!;
      bCtx.scale(2, 2);

      bCtx.fillStyle = bgColor;
      bCtx.fillRect(0, 0, noteW, noteH);

      bCtx.strokeStyle = primaryColor;
      bCtx.lineWidth = 1.8;
      bCtx.strokeRect(3.5, 3.5, noteW - 7, noteH - 7);

      bCtx.strokeStyle = secondaryColor;
      bCtx.lineWidth = 0.5;
      for (let i = 10; i < noteW - 10; i += 9) {
        bCtx.beginPath();
        bCtx.moveTo(i, 8);
        bCtx.lineTo(noteW - i, noteH - 8);
        bCtx.stroke();
      }

      bCtx.save();
      bCtx.translate(noteW / 2, noteH / 2);
      bCtx.fillStyle = primaryColor;
      bCtx.beginPath();
      bCtx.arc(0, 0, 17, 0, Math.PI * 2);
      bCtx.fill();

      bCtx.font = 'bold 9px sans-serif';
      bCtx.fillStyle = '#ffffff';
      bCtx.textAlign = 'center';
      bCtx.textBaseline = 'middle';
      bCtx.fillText('VERDE', 0, 0);
      bCtx.restore();

      return { front, back };
    };

    const textures = {
      '100': createNoteCanvas('100', '#fafdfb', '#0f5132', '#15803d'),
      '25': createNoteCanvas('25', '#f1f8f3', '#15803d', '#4ade80'),
      '10': createNoteCanvas('10', '#ffffff', '#0a0d0b', '#15803d'),
    };

    // ==========================================
    // Composed 3D Financial Sculpture Arrangement
    // ==========================================
    // Carefully composed positions (relative to screen dimensions)
    const composedNotes: ComposedNote[] = [
      // 0: Foreground Left — Tilted forward, close to viewer
      {
        id: 0,
        baseX: -0.28,
        baseY: -0.06,
        baseZ: 75,
        rotX: 0.22,
        rotY: -0.32,
        rotZ: -0.16,
        scale: 1.15,
        type: '100',
        phase: 0,
        freqX: 0.0012,
        freqY: 0.0014,
        ampX: 4,
        ampY: 5,
      },
      // 1: Upper Right Background — Angled upward
      {
        id: 1,
        baseX: 0.32,
        baseY: -0.26,
        baseZ: -60,
        rotX: -0.24,
        rotY: 0.38,
        rotZ: 0.24,
        scale: 0.95,
        type: '25',
        phase: 1.2,
        freqX: 0.001,
        freqY: 0.0013,
        ampX: 3.5,
        ampY: 4.5,
      },
      // 2: Center-Right Midground — Elegant overlap
      {
        id: 2,
        baseX: 0.28,
        baseY: 0.08,
        baseZ: 25,
        rotX: 0.16,
        rotY: 0.28,
        rotZ: -0.14,
        scale: 1.08,
        type: '100',
        phase: 2.1,
        freqX: 0.0014,
        freqY: 0.0011,
        ampX: 4,
        ampY: 5,
      },
      // 3: Lower Left Foreground Anchor
      {
        id: 3,
        baseX: -0.32,
        baseY: 0.24,
        baseZ: 50,
        rotX: -0.2,
        rotY: -0.25,
        rotZ: 0.18,
        scale: 1.1,
        type: '10',
        phase: 3.4,
        freqX: 0.0011,
        freqY: 0.0015,
        ampX: 3.5,
        ampY: 5.5,
      },
      // 4: Lower Right Floating Depth
      {
        id: 4,
        baseX: 0.22,
        baseY: 0.3,
        baseZ: -30,
        rotX: 0.28,
        rotY: 0.22,
        rotZ: 0.15,
        scale: 0.98,
        type: '25',
        phase: 4.2,
        freqX: 0.0013,
        freqY: 0.001,
        ampX: 3,
        ampY: 4,
      },
      // 5: Top Left Distant Accent
      {
        id: 5,
        baseX: -0.22,
        baseY: -0.3,
        baseZ: -90,
        rotX: -0.18,
        rotY: -0.35,
        rotZ: 0.26,
        scale: 0.88,
        type: '10',
        phase: 5.0,
        freqX: 0.0009,
        freqY: 0.0012,
        ampX: 3,
        ampY: 3.5,
      },
      // 6: Top Center High Horizon Note
      {
        id: 6,
        baseX: 0.05,
        baseY: -0.34,
        baseZ: -120,
        rotX: 0.12,
        rotY: 0.16,
        rotZ: -0.06,
        scale: 0.82,
        type: '100',
        phase: 5.9,
        freqX: 0.0012,
        freqY: 0.0009,
        ampX: 2.5,
        ampY: 3,
      },
    ];

    // Responsive filter: on small mobile viewports, keep the 4 core notes cleanly arranged
    const isMobile = width < 640;
    const activeNotes = isMobile
      ? composedNotes.filter((n) => [0, 1, 2, 3].includes(n.id))
      : composedNotes;

    const focalLength = 550;

    // Static render for reduced motion
    if (reducedMotion) {
      ctx.clearRect(0, 0, width, height);
      activeNotes.forEach((n) => {
        const posX = width / 2 + n.baseX * width;
        const posY = height / 2 + n.baseY * height;
        const tex = textures[n.type].front;
        ctx.save();
        ctx.translate(posX, posY);
        ctx.rotate(n.rotZ);
        ctx.drawImage(tex, (-noteW * n.scale) / 2, (-noteH * n.scale) / 2, noteW * n.scale, noteH * n.scale);
        ctx.restore();
      });
      return;
    }

    // ==========================================
    // Living Sculpture Render Loop
    // ==========================================
    const render = (time: number) => {
      // Smooth camera parallax
      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;

      ctx.clearRect(0, 0, width, height);

      // Calculate dynamic positions with subtle floating motion (NO falling)
      const renderedNotes = activeNotes.map((note) => {
        // Very subtle breathing oscillation (±3–5px)
        const hoverX = Math.sin(time * note.freqX + note.phase) * note.ampX;
        const hoverY = Math.cos(time * note.freqY + note.phase) * note.ampY;
        const hoverZ = Math.sin(time * 0.0008 + note.phase) * 6;

        // Slow micro-tilt (±0.02 rad)
        const dynRotX = note.rotX + Math.sin(time * 0.0007 + note.phase) * 0.025;
        const dynRotY = note.rotY + Math.cos(time * 0.0009 + note.phase) * 0.025;
        const dynRotZ = note.rotZ + Math.sin(time * 0.0006 + note.phase) * 0.015;

        // 3D coordinates relative to center
        const x3d = note.baseX * width + hoverX;
        const y3d = note.baseY * height + hoverY;
        const z3d = note.baseZ + hoverZ;

        return {
          ...note,
          x3d,
          y3d,
          z3d,
          dynRotX,
          dynRotY,
          dynRotZ,
        };
      });

      // Sort by Z for proper depth ordering
      renderedNotes.sort((a, b) => a.z3d - b.z3d);

      const centerX = width / 2;
      const centerY = height / 2;

      for (let i = 0; i < renderedNotes.length; i++) {
        const n = renderedNotes[i];

        // 3D Perspective Projection with Camera Parallax
        const depth = n.z3d + focalLength;
        if (depth <= 20) continue;

        const perspective = focalLength / depth;

        // Foreground objects shift slightly more under mouse parallax
        const parallaxFactor = 1.0 + (n.z3d / 200) * 0.6;
        const screenX = centerX + n.x3d * perspective + mouseX * parallaxFactor;
        const screenY = centerY + n.y3d * perspective + mouseY * parallaxFactor;

        // 3D Normal Vector for Front/Back orientation and lighting
        const cosX = Math.cos(n.dynRotX);
        const cosY = Math.cos(n.dynRotY);
        const normalZ = cosX * cosY;

        // Scaling with perspective
        const scaleX = cosY * perspective * n.scale;
        const scaleY = cosX * perspective * n.scale;

        const rW = noteW * Math.abs(scaleX);
        const rH = noteH * Math.abs(scaleY);

        if (rW < 2 || rH < 2) continue;

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(n.dynRotZ);

        // Soft, realistic paper drop shadow
        ctx.shadowColor = 'rgba(10, 20, 14, 0.09)';
        ctx.shadowBlur = 14 * perspective;
        ctx.shadowOffsetX = 3 * perspective;
        ctx.shadowOffsetY = 8 * perspective;

        // Choose front or back texture based on surface normal orientation
        const isFront = normalZ >= 0;
        const noteTex = isFront ? textures[n.type].front : textures[n.type].back;

        ctx.drawImage(noteTex, -rW / 2, -rH / 2, rW, rH);

        // Realistic Paper Lighting
        const lightDot = normalZ * 0.7 + 0.3;
        if (lightDot < 0.85) {
          ctx.shadowColor = 'transparent';
          ctx.fillStyle = `rgba(10, 20, 14, ${(0.85 - lightDot) * 0.3})`;
          ctx.fillRect(-rW / 2, -rH / 2, rW, rH);
        } else if (lightDot > 0.92) {
          ctx.shadowColor = 'transparent';
          ctx.fillStyle = `rgba(255, 255, 255, ${(lightDot - 0.92) * 0.4})`;
          ctx.fillRect(-rW / 2, -rH / 2, rW, rH);
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [reducedMotion]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="h-full w-full block" />
    </div>
  );
}
