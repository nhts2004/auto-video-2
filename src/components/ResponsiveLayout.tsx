'use client';

import React, { useState, useEffect } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { motion, AnimatePresence } from 'framer-motion';

interface ResponsiveLayoutProps {
  onAspectRatioChange?: (aspectRatio: '16:9' | '9:16') => void;
}

export default function ResponsiveLayout({ onAspectRatioChange }: ResponsiveLayoutProps) {
  const { currentProject, updateClip, updateProjectSettings } = useProjectStore();
  const [isScaling, setIsScaling] = useState(false);

  if (!currentProject) return null;

  const handleAspectRatioChange = (newAspectRatio: '16:9' | '9:16') => {
    if (newAspectRatio === currentProject.aspectRatio) return;

    setIsScaling(true);

    // Update project resolution and aspect ratio
    const newResolution = newAspectRatio === '16:9' 
      ? { width: 1920, height: 1080 }
      : { width: 1080, height: 1920 };

    // Update project settings using dedicated action
    updateProjectSettings({
      aspectRatio: newAspectRatio,
      resolution: newResolution
    } as any);

    // Scale all clips to fit new aspect ratio
    scaleClipsToNewAspectRatio(newAspectRatio);
    
    onAspectRatioChange?.(newAspectRatio);

    setTimeout(() => {
      setIsScaling(false);
    }, 1000);
  };

  const scaleClipsToNewAspectRatio = (newAspectRatio: '16:9' | '9:16') => {
    if (!currentProject) return;

    const oldAspectRatio = currentProject.aspectRatio;
    const oldResolution = currentProject.resolution;
    const newResolution = newAspectRatio === '16:9' 
      ? { width: 1920, height: 1080 }
      : { width: 1080, height: 1920 };

    // Calculate scaling factors
    const scaleX = newResolution.width / oldResolution.width;
    const scaleY = newResolution.height / oldResolution.height;

    // Apply scaling to all text clips
    currentProject.tracks.forEach(track => {
      if (track.type === 'text') {
        track.clips.forEach(clip => {
          if (clip.type === 'text') {
            const scaledClip = {
              ...clip,
              position: {
                x: Math.min(100, clip.position.x * scaleX),
                y: Math.min(100, clip.position.y * scaleY)
              },
              style: {
                ...clip.style,
                fontSize: Math.max(12, Math.min(72, clip.style.fontSize * Math.min(scaleX, scaleY)))
              }
            };
            updateClip(track.id, clip.id, scaledClip);
          }
        });
      }
    });
  };

  const getAspectRatioIcon = (ratio: '16:9' | '9:16') => {
    return ratio === '16:9' ? '📺' : '📱';
  };

  const getAspectRatioLabel = (ratio: '16:9' | '9:16') => {
    return ratio === '16:9' ? 'Landscape (16:9)' : 'Portrait (9:16)';
  };

  const getAspectRatioDescription = (ratio: '16:9' | '9:16') => {
    return ratio === '16:9' 
      ? 'Perfect for YouTube, desktop viewing'
      : 'Perfect for TikTok, Instagram Stories';
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Responsive Layout
        </h3>

        {/* Current Aspect Ratio Display */}
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getAspectRatioIcon(currentProject.aspectRatio)}</span>
            <div>
              <div className="font-medium text-blue-900 dark:text-blue-300">
                {getAspectRatioLabel(currentProject.aspectRatio)}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-400">
                {currentProject.resolution.width} × {currentProject.resolution.height}
              </div>
            </div>
          </div>
        </div>

        {/* Aspect Ratio Options */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Switch Aspect Ratio:
          </h4>
          
          {(['16:9', '9:16'] as const).map((ratio) => (
            <motion.button
              key={ratio}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAspectRatioChange(ratio)}
              disabled={isScaling || ratio === currentProject.aspectRatio}
              className={`w-full p-4 border rounded-lg transition-all text-left ${
                ratio === currentProject.aspectRatio
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              } ${
                isScaling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getAspectRatioIcon(ratio)}</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {getAspectRatioLabel(ratio)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {getAspectRatioDescription(ratio)}
                  </div>
                </div>
                {ratio === currentProject.aspectRatio && (
                  <div className="text-blue-600 dark:text-blue-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Scaling Progress */}
        <AnimatePresence>
          {isScaling && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                <span className="text-green-700 dark:text-green-400 font-medium">
                  Auto-scaling clips to new aspect ratio...
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Layout Presets */}
        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Layout Presets:
          </h4>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => applyLayoutPreset('center')}
              className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-center"
            >
              <div className="text-lg mb-1">🎯</div>
              <div className="text-xs font-medium">Center</div>
            </button>
            
            <button
              onClick={() => applyLayoutPreset('bottom')}
              className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-center"
            >
              <div className="text-lg mb-1">⬇️</div>
              <div className="text-xs font-medium">Bottom</div>
            </button>
            
            <button
              onClick={() => applyLayoutPreset('top')}
              className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-center"
            >
              <div className="text-lg mb-1">⬆️</div>
              <div className="text-xs font-medium">Top</div>
            </button>
            
            <button
              onClick={() => applyLayoutPreset('fullscreen')}
              className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-center"
            >
              <div className="text-lg mb-1">🖥️</div>
              <div className="text-xs font-medium">Fullscreen</div>
            </button>
          </div>
        </div>

        {/* Layout Statistics */}
        <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Layout Statistics:
          </h4>
          <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
            <div>Text Clips: {currentProject.tracks.find(t => t.type === 'text')?.clips.length || 0}</div>
            <div>Image Clips: {currentProject.tracks.find(t => t.type === 'image')?.clips.length || 0}</div>
            <div>Total Duration: {Math.round(currentProject.duration / 1000)}s</div>
            <div>FPS: {currentProject.fps}</div>
          </div>
        </div>
      </div>
    </div>
  );

  function applyLayoutPreset(preset: 'center' | 'bottom' | 'top' | 'fullscreen') {
    if (!currentProject) return;

    currentProject.tracks.forEach(track => {
      if (track.type === 'text') {
        track.clips.forEach(clip => {
          if (clip.type === 'text') {
            let newPosition = { ...clip.position };

            switch (preset) {
              case 'center':
                newPosition = { x: 50, y: 50 };
                break;
              case 'bottom':
                newPosition = { x: 50, y: currentProject.aspectRatio === '9:16' ? 85 : 80 };
                break;
              case 'top':
                newPosition = { x: 50, y: currentProject.aspectRatio === '9:16' ? 15 : 20 };
                break;
              case 'fullscreen':
                newPosition = { x: 50, y: 50 };
                break;
            }

            updateClip(track.id, clip.id, { position: newPosition });
          }
        });
      }
    });
  }
}
