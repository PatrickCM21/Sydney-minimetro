'use client';

import React, { useState } from 'react';
import { STATION_MAP, LINE_MAP } from '@/lib/networkData';
import type { LineId } from '@/types';

interface ShareButtonProps {
  startId: string;
  targetId: string;
  optimalPath: string[];
  guessedIds: string[];
  wrongGuesses: string[];
  tripLines: LineId[];
  score: number;
  personalStats: {
    totalGames: number;
    avgScore: number;
  } | null;
}

export default function ShareButton({
  startId,
  targetId,
  optimalPath,
  guessedIds,
  wrongGuesses,
  tripLines,
  score,
  personalStats,
}: ShareButtonProps) {
  const [shareStatus, setShareStatus] = useState<'idle' | 'generating' | 'success'>('idle');

  const totalStationsToGuess = optimalPath.length > 2 ? optimalPath.length - 2 : 0;
  const correctCount = guessedIds.length;

  const getShareText = () => {
    const start = STATION_MAP.get(startId)?.name ?? startId;
    const target = STATION_MAP.get(targetId)?.name ?? targetId;

    const won = correctCount === totalStationsToGuess;
    const resultText = won ? 'YOU WON!' : 'COMPLETED';

    const lines = [
      `Trackle Route Quiz`,
      `${start} ↔ ${target}`,
      `Result: ${resultText}`,
      `Guessed: ${correctCount}/${totalStationsToGuess} stations correctly`,
      `Score: ${score}%`,
    ];

    if (personalStats) {
      lines.push(`Total games played: ${personalStats.totalGames}`);
    }

    lines.push(`playtrackle.app`);
    return lines.join('\n');
  };

  const handleCopyResult = () => {
    const text = getShareText();
    if (typeof window !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => { });
    }
  };

  const handleShare = async () => {
    setShareStatus('generating');
    try {
      const startName = STATION_MAP.get(startId)?.name ?? startId;
      const targetName = STATION_MAP.get(targetId)?.name ?? targetId;

      // Load logo image asynchronously
      const logo = await new Promise<HTMLImageElement | null>((resolve) => {
        const img = new Image();
        img.src = '/trackle_logo.png';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
      });

      // Generate canvas
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // Helper: Draw rounded rect
      const drawRoundedRect = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string) => {
        c.beginPath();
        c.moveTo(x + r, y);
        c.arcTo(x + w, y, x + w, y + h, r);
        c.arcTo(x + w, y + h, x, y + h, r);
        c.arcTo(x, y + h, x, y, r);
        c.arcTo(x, y, x + w, y, r);
        c.closePath();
        c.fillStyle = fill;
        c.fill();
        if (stroke) {
          c.strokeStyle = stroke;
          c.lineWidth = 3;
          c.stroke();
        }
      };

      // Sydney Trains Blue/Navy Background (with subtle gradient)
      const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
      gradient.addColorStop(0, '#001a40');
      gradient.addColorStop(0.5, '#002664');
      gradient.addColorStop(1, '#001533');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1080, 1920);

      // Accent Grid (Sydney Trains Blue/translucent)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 2;
      for (let x = 0; x < 1080; x += 90) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 1920);
        ctx.stroke();
      }
      for (let y = 0; y < 1920; y += 90) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1080, y);
        ctx.stroke();
      }

      // Sydney Trains Orange Glow Aura
      const aura = ctx.createRadialGradient(540, 800, 50, 540, 800, 600);
      aura.addColorStop(0, 'rgba(243, 112, 33, 0.08)');
      aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(540, 800, 600, 0, Math.PI * 2);
      ctx.fill();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Header: Logo and Title
      let headerY = 220;
      if (logo) {
        const aspect = logo.width / logo.height;
        const logoHeight = 90;
        const logoWidth = logoHeight * aspect;
        ctx.drawImage(logo, 540 - logoWidth / 2, 70, logoWidth, logoHeight);
        headerY = 200;
      } else {
        ctx.font = 'bold 54px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('TRACKLE', 540, 120);
      }

      ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#f37021'; // Sydney Trains Brand Orange
      ctx.fillText('TRACKLE', 540, headerY + 25);

      // Divider Line (Orange)
      ctx.strokeStyle = '#f37021';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(540 - 120, headerY + 60); // Starts at 420
      ctx.lineTo(540 + 120, headerY + 60); // Ends at 660
      ctx.stroke();

      // Trip Title & Stations
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('TODAY\'S TRIP', 540, headerY + 115);

      ctx.font = 'bold 44px system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(startName, 540, headerY + 165);

      ctx.font = 'bold 36px system-ui, sans-serif';
      ctx.fillStyle = '#f37021'; // Orange Arrow
      ctx.fillText('↔', 540, headerY + 215);

      ctx.font = 'bold 44px system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(targetName, 540, headerY + 265);

      // Score / Result Box (White/Translucent with Blue border)
      const won = correctCount === totalStationsToGuess;
      const resultColor = won ? '#10b981' : '#f37021';

      // Box coordinates Y = 590 to 1060
      drawRoundedRect(ctx, 120, 590, 840, 460, 30, 'rgba(255, 255, 255, 0.07)', 'rgba(255, 255, 255, 0.12)');

      // Highlight Outcome / "I GUESSED"
      ctx.font = 'bold 28px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('I GUESSED', 540, 670);

      // Giant Guesses Count Fraction
      ctx.font = '900 130px system-ui, sans-serif';
      ctx.fillStyle = resultColor;
      ctx.fillText(`${correctCount}/${totalStationsToGuess}`, 540, 790);

      // Bottom label "STATIONS CORRECTLY"
      ctx.font = 'bold 28px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('STATIONS CORRECTLY', 540, 895);

      // Score percentage
      ctx.font = '900 36px system-ui, sans-serif';
      ctx.fillStyle = won ? '#10b981' : '#ffffff';
      ctx.fillText(`SCORE: ${score}%`, 540, 975);

      // Journey Path Graphic: Horizontal and Snaking layout
      const pathStartY = 1140;
      const numStations = optimalPath.length;

      if (numStations > 0) {
        const primaryLineId = tripLines[0];
        const primaryLine = LINE_MAP[primaryLineId];
        const lineColor = primaryLine?.color ?? '#f37021';

        const guessedSet = new Set(guessedIds);
        const stationsToDraw: Array<{ name: string; isGuessed: boolean; isEndpoint: boolean; isEllipsis?: boolean }> = [];

        // Max 3 rows (at 3 per row = 9 stations max). If exceeds, place ellipsis in the middle.
        if (numStations <= 9) {
          for (let i = 0; i < numStations; i++) {
            const id = optimalPath[i];
            const station = STATION_MAP.get(id);
            if (!station) continue;
            stationsToDraw.push({
              name: station.name,
              isGuessed: guessedSet.has(id),
              isEndpoint: i === 0 || i === numStations - 1,
            });
          }
        } else {
          // Show first 4
          for (let i = 0; i < 4; i++) {
            const id = optimalPath[i];
            const station = STATION_MAP.get(id);
            if (!station) continue;
            stationsToDraw.push({
              name: station.name,
              isGuessed: guessedSet.has(id),
              isEndpoint: i === 0,
            });
          }
          // Ellipsis
          stationsToDraw.push({
            name: '...',
            isGuessed: false,
            isEndpoint: false,
            isEllipsis: true,
          });
          // Show last 4
          for (let i = numStations - 4; i < numStations; i++) {
            const id = optimalPath[i];
            const station = STATION_MAP.get(id);
            if (!station) continue;
            stationsToDraw.push({
              name: station.name,
              isGuessed: guessedSet.has(id),
              isEndpoint: i === numStations - 1,
            });
          }
        }

        // Draw horizontal track segments
        // We will lay out the stations in a wrapping horizontal pattern: 3 per row (max 3 rows)
        const rowSize = 3;
        const rowHeight = 160;
        const startX = 220;
        const endX = 860;

        const getCoords = (idx: number) => {
          const r = Math.floor(idx / rowSize);
          const totalRows = Math.ceil(stationsToDraw.length / rowSize);
          const isLastRow = r === totalRows - 1;
          const countInRow = isLastRow && (stationsToDraw.length % rowSize !== 0) ? (stationsToDraw.length % rowSize) : rowSize;
          const c = idx % rowSize;
          const y = pathStartY + r * rowHeight;

          const center = 540;
          const spacing = 320;

          let offset = (c - (countInRow - 1) / 2) * spacing;
          if (r % 2 === 1) {
            offset = -offset;
          }

          const x = center + offset;
          return { x, y, row: r };
        };

        // Draw track lines first
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 0; i < stationsToDraw.length - 1; i++) {
          const p1 = getCoords(i);
          const p2 = getCoords(i + 1);

          ctx.beginPath();
          if (p1.row === p2.row) {
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          } else {
            // Draw horizontal connection to the edge, then vertical down, then horizontal in
            ctx.moveTo(p1.x, p1.y);
            const edgeX = p1.row % 2 === 0 ? endX : startX;
            ctx.lineTo(edgeX, p1.y);
            ctx.lineTo(edgeX, p2.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        // Draw stations (nodes) with rings around them
        stationsToDraw.forEach((st, idx) => {
          const { x, y } = getCoords(idx);

          if (st.isEllipsis) {
            ctx.beginPath();
            ctx.arc(x, y, 16, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 3;
            ctx.fillStyle = '#002664';
            ctx.fill();
            ctx.stroke();

            ctx.font = 'bold 20px system-ui, sans-serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.textAlign = 'center';
            ctx.fillText('...', x, y);
            return;
          }

          // Outer glowing/border ring (Circle around)
          ctx.beginPath();
          ctx.arc(x, y, st.isEndpoint ? 28 : 22, 0, Math.PI * 2);
          ctx.strokeStyle = st.isEndpoint
            ? '#f37021'
            : (st.isGuessed ? '#10b981' : '#ef4444');
          ctx.lineWidth = 4;
          ctx.fillStyle = '#002664';
          ctx.fill();
          ctx.stroke();

          // Inner solid circle
          ctx.beginPath();
          ctx.arc(x, y, st.isEndpoint ? 16 : 12, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();

          // Station Name Label
          ctx.font = 'bold 20px system-ui, sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.fillText(st.name, x, y + (st.isEndpoint ? 50 : 42));

          // Mini indicator symbol inside node label area
          if (!st.isEndpoint) {
            ctx.font = 'bold 16px system-ui, sans-serif';
            ctx.fillStyle = st.isGuessed ? '#10b981' : '#ef4444';
          } else {
            ctx.font = '900 13px system-ui, sans-serif';
            ctx.fillStyle = '#f37021';
          }
        });
      }

      // Footer
      ctx.textAlign = 'center';
      ctx.font = 'bold 28px system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('Can you beat my score?', 540, 1690);

      ctx.font = '900 48px system-ui, sans-serif';
      ctx.fillStyle = '#f37021';
      ctx.fillText('playtrackle.app', 540, 1755);

      ctx.font = '18px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText('Sydney Trains Minimetro Puzzle', 540, 1810);

      // Convert Canvas to Blob
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Failed to create blob');

      const file = new File([blob], `trackle-journey.png`, { type: 'image/png' });

      // Web Share API
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: 'Trackle Sydney Minimetro',
          text: `My Trackle Sydney Minimetro journey result: ${score}% accuracy!`,
        });
        setShareStatus('success');
      } else {
        // Fallback: Copy text to clipboard and download file directly
        handleCopyResult();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trackle-story-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setShareStatus('success');
      }
    } catch (err) {
      console.error('Error sharing Story:', err);
      setShareStatus('idle');
    }

    setTimeout(() => setShareStatus('idle'), 4000);
  };

  return (
    <button
      onClick={handleShare}
      disabled={shareStatus === 'generating'}
      className={`
        flex-1 py-2.5 px-4 rounded-xl text-white text-sm font-bold shadow-md active:scale-95 transition-all duration-200
        ${shareStatus === 'generating'
          ? 'bg-amber-600 shadow-amber-500/20 cursor-wait'
          : shareStatus === 'success'
            ? 'bg-emerald-600 shadow-emerald-500/20'
            : 'bg-green-600 hover:bg-green-500 shadow-green-500/20'}
      `}
    >
      {shareStatus === 'generating' && 'Generating...'}
      {shareStatus === 'success' && 'Copied! ✓'}
      {shareStatus === 'idle' && 'Share'}
    </button>
  );
}
