'use client';

import React from 'react';
import { useProjectStore } from '@/store/projectStore';

export default function Toolbar() {
  const {
    currentProject,
    isPlaying,
    togglePlayback,
    setCurrentTime,
    addTrack,
    startRender,
    exportOptions
  } = useProjectStore();

  if (!currentProject) return null;

  const handlePlayPause = () => {
    togglePlayback();
  };

  const handleStop = () => {
    setCurrentTime(0);
  };

  const handleAddTextTrack = () => {
    addTrack('text', 'Text Track');
  };

  const handleAddImageTrack = () => {
    addTrack('image', 'Image Track');
  };

  const handleAddAudioTrack = () => {
    addTrack('audio', 'Audio Track');
  };

  const handleExport = () => {
    startRender(exportOptions);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between">
        {/* Playback Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handlePlayPause}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          
          <button
            onClick={handleStop}
            className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ⏹️
          </button>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Playback Controls
          </div>
        </div>

        {/* Track Management */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleAddTextTrack}
            className="px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors text-sm"
          >
            + Text Track
          </button>
          
          <button
            onClick={handleAddImageTrack}
            className="px-3 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors text-sm"
          >
            + Image Track
          </button>
          
          <button
            onClick={handleAddAudioTrack}
            className="px-3 py-2 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors text-sm"
          >
            + Audio Track
          </button>
        </div>

        {/* Export Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Export Video
          </button>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {currentProject.tracks.length} tracks
          </div>
        </div>
      </div>
    </div>
  );
}
