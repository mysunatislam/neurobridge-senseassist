import React, { useEffect, useRef } from 'react';

interface AudioWaveformVisualizerProps {
  isRecording: boolean;
  rmsDb: number;
  frequencyData?: Uint8Array;
  pauses?: Array<{ start: number; duration: number }>;
}

export const AudioWaveformVisualizer: React.FC<AudioWaveformVisualizerProps> = ({
  isRecording,
  rmsDb,
  frequencyData,
  pauses = []
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Dark background with subtle grid
      ctx.fillStyle = '#0a0f1e';
      ctx.fillRect(0, 0, width, height);

      // Draw baseline center line
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      if (isRecording && frequencyData && frequencyData.length > 0) {
        const barCount = 48;
        const barWidth = (width / barCount) - 2;
        const step = Math.floor(frequencyData.length / barCount);

        for (let i = 0; i < barCount; i++) {
          const value = frequencyData[i * step] || 0;
          const barHeight = (value / 255) * (height * 0.85);
          const x = i * (barWidth + 2);
          const y = (height - barHeight) / 2;

          // Gradient color from teal to cyan to pink for active frequencies
          const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
          grad.addColorStop(0, '#2dd4bf'); // teal-400
          grad.addColorStop(0.5, '#38bdf8'); // cyan-400
          grad.addColorStop(1, '#f43f5e'); // rose-500

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, Math.max(3, barHeight), 2);
          ctx.fill();
        }
      } else {
        // Idle ambient sine wave
        ctx.strokeStyle = '#0f766e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const time = Date.now() / 300;
        for (let x = 0; x < width; x += 4) {
          const y = (height / 2) + Math.sin(x * 0.04 + time) * 6;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isRecording, frequencyData]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-800 bg-[#0a0f1e] p-3 shadow-inner">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className={`inline-block w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-slate-600'}`} />
          <span className="text-xs font-semibold text-slate-300">
            {isRecording ? 'Live Spectral Biomarker Stream (FFT)' : 'Acoustic Signal Standby'}
          </span>
        </div>
        <div className="flex items-center space-x-3 text-[11px] text-slate-400">
          <span>Signal Energy: <strong className={rmsDb > -30 ? 'text-teal-400' : 'text-slate-500'}>{rmsDb} dB</strong></span>
          {pauses.length > 0 && (
            <span className="text-amber-400 font-medium">Pauses: {pauses.length}</span>
          )}
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={600}
        height={100}
        className="w-full h-24 rounded-lg block"
      />
    </div>
  );
};
