'use client';

import React, { useState } from 'react';
import { Clip, TextClip, ImageClip, AudioClip } from '@/types';
import { motion } from 'framer-motion';

interface ClipComponentProps {
  clip: Clip;
  track: any;
  pixelsPerSecond: number;
  duration: number;
  isSelected: boolean;
  onSelect: () => void;
  onTrackSelect: () => void;
  onEdit?: (clip: Clip) => void;
}

export default function ClipComponent({
  clip,
  track,
  pixelsPerSecond,
  duration,
  isSelected,
  onSelect,
  onTrackSelect,
  onEdit
}: ClipComponentProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const clipWidth = (clip.end - clip.start) * pixelsPerSecond / 1000;
  const clipLeft = (clip.start / duration) * 100;

  const getClipColor = (type: string) => {
    switch (type) {
      case 'text':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'image':
        return 'bg-green-500 hover:bg-green-600';
      case 'audio':
        return 'bg-purple-500 hover:bg-purple-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getClipIcon = (type: string) => {
    switch (type) {
      case 'text':
        return '📝';
      case 'image':
        return '🖼️';
      case 'audio':
        return '🎵';
      default:
        return '📄';
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    onTrackSelect();
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit && clip.type === 'text') {
      onEdit(clip);
    }
  };

  const renderClipContent = () => {
    switch (clip.type) {
      case 'text':
        const textClip = clip as TextClip;
        return (
          <div className="p-2">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-sm">{getClipIcon(clip.type)}</span>
              <span className="text-xs text-white/80">
                {Math.round((clip.end - clip.start) / 1000)}s
              </span>
            </div>
            <div className="text-xs text-white truncate">
              {textClip.text}
            </div>
          </div>
        );
      
      case 'image':
        const imageClip = clip as ImageClip;
        return (
          <div className="p-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm">{getClipIcon(clip.type)}</span>
              <span className="text-xs text-white/80">
                {Math.round((clip.end - clip.start) / 1000)}s
              </span>
            </div>
          </div>
        );
      
      case 'audio':
        const audioClip = clip as AudioClip;
        return (
          <div className="p-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm">{getClipIcon(clip.type)}</span>
              <span className="text-xs text-white/80">
                {Math.round((clip.end - clip.start) / 1000)}s
              </span>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`absolute top-2 bottom-2 rounded cursor-pointer select-none ${
        getClipColor(clip.type)
      } ${isSelected ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''}`}
      style={{
        left: `${clipLeft}%`,
        width: `${clipWidth}px`,
        minWidth: '60px'
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {renderClipContent()}
      
      {/* Resize handles */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/20 cursor-ew-resize opacity-0 hover:opacity-100 transition-opacity"></div>
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/20 cursor-ew-resize opacity-0 hover:opacity-100 transition-opacity"></div>
    </motion.div>
  );
}
