'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { motion } from 'framer-motion';

export default function PreviewPanel() {
  const { currentProject, currentTime, selectedClips, isPlaying, setCurrentTime, togglePlayback } = useProjectStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const rafRef = useRef<number | null>(null);
  const imageCacheRef = useRef<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    if (!currentProject || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size based on project resolution
    const { width, height } = currentProject.resolution;
    const aspectRatio = width / height;
    
    // Calculate display size (max 400px width)
    const maxWidth = 400;
    const displayWidth = Math.min(maxWidth, width);
    const displayHeight = displayWidth / aspectRatio;
    
    canvas.width = displayWidth;
    canvas.height = displayHeight;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    // Render current frame
    renderFrame(ctx, displayWidth, displayHeight);
  }, [currentProject, currentTime]);

  // Sync store time with audio element when playing
  useEffect(() => {
    if (!currentProject) return;

    const audioEl = audioRef.current;
    const tick = () => {
      if (!audioEl) return;
      setCurrentTime(audioEl.currentTime * 1000);
      rafRef.current = requestAnimationFrame(tick);
    };

    if (isPlaying) {
      // Start audio if available; otherwise drive time by rAF without audio
      if (audioEl && currentProject.audioFile) {
        // If seeking occurred externally
        if (Math.abs(audioEl.currentTime * 1000 - currentTime) > 50) {
          audioEl.currentTime = currentTime / 1000;
        }
        audioEl.play().catch(() => {/* ignore */});
      }
      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (audioEl) audioEl.pause();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, currentProject]);

  // Keep audio element in sync when user seeks via timeline/waveform
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    if (Math.abs(audioEl.currentTime * 1000 - currentTime) > 50) {
      audioEl.currentTime = currentTime / 1000;
    }
  }, [currentTime]);

  const renderFrame = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!currentProject) return;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Render clips at current time
    currentProject.tracks.forEach(track => {
      track.clips.forEach(clip => {
        if (currentTime >= clip.start && currentTime <= clip.end) {
          renderClip(ctx, clip, width, height);
        }
      });
    });
  };

  const renderClip = (ctx: CanvasRenderingContext2D, clip: any, canvasWidth: number, canvasHeight: number) => {
    const { width, height } = currentProject!.resolution;
    const scaleX = canvasWidth / width;
    const scaleY = canvasHeight / height;

    switch (clip.type) {
      case 'text':
        renderTextClip(ctx, clip, scaleX, scaleY);
        break;
      case 'image':
        renderImageClip(ctx, clip, scaleX, scaleY);
        break;
      case 'audio':
        // Audio clips don't render visually
        break;
    }
  };

  const renderTextClip = (ctx: CanvasRenderingContext2D, clip: any, scaleX: number, scaleY: number) => {
    const projectWidth = currentProject!.resolution.width;
    const projectHeight = currentProject!.resolution.height;

    // Treat positions as percentages of project resolution
    const posXInPx = (clip.position.x / 100) * projectWidth;
    const posYInPx = (clip.position.y / 100) * projectHeight;

    const x = posXInPx * scaleX;
    const y = posYInPx * scaleY;
    const fontSize = clip.style.fontSize * scaleY;

    ctx.save();
    
    // Set text style
    ctx.font = `${fontSize}px ${clip.style.fontFamily}`;
    ctx.fillStyle = clip.style.color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Draw background if specified
    if (clip.style.backgroundColor) {
      const metrics = ctx.measureText(clip.text);
      ctx.fillStyle = clip.style.backgroundColor;
      ctx.fillRect(x - 5, y - 5, metrics.width + 10, fontSize + 10);
    }

    // Draw text
    ctx.fillStyle = clip.style.color;
    ctx.fillText(clip.text, x, y);
    
    ctx.restore();
  };

  const renderImageClip = (ctx: CanvasRenderingContext2D, clip: any, scaleX: number, scaleY: number) => {
    const projectWidth = currentProject!.resolution.width;
    const projectHeight = currentProject!.resolution.height;

    // Treat positions as percentages of project resolution
    const posXInPx = (clip.position.x / 100) * projectWidth;
    const posYInPx = (clip.position.y / 100) * projectHeight;

    const x = posXInPx * scaleX;
    const y = posYInPx * scaleY;
    const scale = clip.transform.scale;

    // Cache image elements to avoid reloading on every frame
    let img = imageCacheRef.current[clip.src];
    if (!img) {
      img = new Image();
      img.src = clip.src;
      imageCacheRef.current[clip.src] = img;
      img.onload = () => {
        const width = img.width * scale * scaleX;
        const height = img.height * scale * scaleY;
        ctx.drawImage(img, x, y, width, height);
      };
      return;
    }

    if (img.complete && img.naturalWidth > 0) {
      const width = img.width * scale * scaleX;
      const height = img.height * scale * scaleY;
      ctx.drawImage(img, x, y, width, height);
    }
  };

  const handleCanvasClick = () => {
    togglePlayback();
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!currentProject) {
    return (
      <div className="h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">No project loaded</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-800">
      {/* Preview Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Preview
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {formatTime(currentTime)} / {formatTime(currentProject.duration)}
          </span>
          <button
            onClick={handleCanvasClick}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
        </div>
      </div>

      {/* Preview Canvas */}
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <canvas
            ref={canvasRef}
            className="border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer shadow-lg"
            onClick={handleCanvasClick}
          />
          {/* Hidden audio element for playback */}
          {currentProject.audioFile && (
            <audio ref={audioRef} src={currentProject.audioFile} preload="auto" />
          )}
          
          {/* Aspect ratio indicator */}
          <div className="absolute -bottom-6 left-0 text-xs text-gray-500 dark:text-gray-400">
            {currentProject.aspectRatio}
          </div>
        </motion.div>
      </div>

      {/* Project Info */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Resolution:</span>
            <span className="text-gray-900 dark:text-white">
              {currentProject.resolution.width} × {currentProject.resolution.height}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">FPS:</span>
            <span className="text-gray-900 dark:text-white">{currentProject.fps}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Tracks:</span>
            <span className="text-gray-900 dark:text-white">{currentProject.tracks.length}</span>
          </div>
          {selectedClips.length > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Selected:</span>
              <span className="text-blue-600 dark:text-blue-400">{selectedClips.length} clips</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
