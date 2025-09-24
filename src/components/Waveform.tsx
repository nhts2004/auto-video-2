'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useProjectStore } from '@/store/projectStore';

export default function Waveform() {
  const { currentProject, currentTime, setCurrentTime } = useProjectStore();
  const waveformRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!currentProject?.audioFile) return;

    const canvas = waveformRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create a simple waveform visualization
    // In a real implementation, you would use Web Audio API to analyze the audio
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(0, 0, width, height);

    // Draw a simple waveform pattern
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const duration = currentProject.duration;
    const timePerPixel = duration / width;

    for (let x = 0; x < width; x += 2) {
      const time = x * timePerPixel;
      const normalizedTime = time / duration;
      
      // Create a simple sine wave pattern for demonstration
      const amplitude = Math.sin(normalizedTime * Math.PI * 10) * 0.5 + 0.5;
      const y = height * (1 - amplitude * 0.8) + height * 0.1;
      
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
    setIsLoaded(true);
  }, [currentProject]);

  const handleWaveformClick = (e: React.MouseEvent) => {
    if (!currentProject) return;

    const canvas = waveformRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const duration = currentProject.duration;
    const clickTime = (clickX / canvas.width) * duration;

    setCurrentTime(Math.max(0, Math.min(duration, clickTime)));
  };

  if (!currentProject?.audioFile) {
    return (
      <div className="h-20 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          No audio file loaded
        </p>
      </div>
    );
  }

  return (
    <div className="h-20 bg-gray-50 dark:bg-gray-700 relative">
      <canvas
        ref={waveformRef}
        width={800}
        height={80}
        className="w-full h-full cursor-pointer"
        onClick={handleWaveformClick}
      />
      
      {/* Playhead */}
      {isLoaded && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-10"
          style={{
            left: `${(currentTime / currentProject.duration) * 100}%`
          }}
        >
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-500 rounded-full"></div>
        </div>
      )}
      
      {/* Time labels */}
      <div className="absolute bottom-1 left-2 text-xs text-gray-500 dark:text-gray-400">
        0:00
      </div>
      <div className="absolute bottom-1 right-2 text-xs text-gray-500 dark:text-gray-400">
        {Math.floor(currentProject.duration / 60000)}:
        {Math.floor((currentProject.duration % 60000) / 1000).toString().padStart(2, '0')}
      </div>
    </div>
  );
}
