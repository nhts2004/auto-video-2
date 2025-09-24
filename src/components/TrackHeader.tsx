'use client';

import React from 'react';
import { Track } from '@/types';
import { motion } from 'framer-motion';

interface TrackHeaderProps {
  track: Track;
}

export default function TrackHeader({ track }: TrackHeaderProps) {
  const getTrackIcon = (type: string) => {
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

  const getTrackColor = (type: string) => {
    switch (type) {
      case 'text':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'image':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'audio':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="p-3 h-full flex items-center space-x-3">
      <div className="flex items-center space-x-2 flex-1">
        <span className="text-lg">{getTrackIcon(track.type)}</span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 dark:text-white truncate">
            {track.name}
          </div>
          <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getTrackColor(track.type)}`}>
            {track.type}
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-1">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {track.clips.length} clips
        </span>
      </div>
    </div>
  );
}
