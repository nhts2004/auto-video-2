'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { motion, AnimatePresence } from 'framer-motion';
import Waveform from './Waveform';
import TrackHeader from './TrackHeader';
import ClipComponent from './ClipComponent';
import TextEditor from './TextEditor';
import { Clip } from '@/types';

export default function Timeline() {
  const {
    currentProject,
    selectedClips,
    selectedTrack,
    currentTime,
    zoom,
    selectClip,
    selectTrack,
    setCurrentTime,
    setZoom
  } = useProjectStore();

  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartTime, setDragStartTime] = useState(0);
  const [editingClip, setEditingClip] = useState<Clip | null>(null);

  if (!currentProject) return null;

  const duration = currentProject.duration;
  const pixelsPerSecond = 100 * zoom;
  const timelineWidth = duration * pixelsPerSecond / 1000;

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickTime = (clickX / timelineWidth) * duration;
    
    setCurrentTime(Math.max(0, Math.min(duration, clickTime)));
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(Math.max(0.1, Math.min(5, zoom * zoomFactor)));
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimeMarkers = () => {
    const markers: Array<{time: number; label: string; position: number}> = [];
    const interval = zoom > 2 ? 5000 : zoom > 1 ? 10000 : 20000; // 5s, 10s, or 20s intervals
    
    for (let time = 0; time <= duration; time += interval) {
      markers.push({
        time,
        label: formatTime(time),
        position: (time / duration) * 100
      });
    }
    
    return markers;
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 overflow-hidden">
      {/* Timeline Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Timeline
          </h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Zoom:</span>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-20"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {Math.round(zoom * 100)}%
              </span>
            </div>
            
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Duration: {formatTime(duration)}
            </div>
          </div>
        </div>

        {/* Time Ruler */}
        <div className="relative h-8 bg-gray-50 dark:bg-gray-700 rounded">
          <div
            ref={timelineRef}
            className="absolute inset-0 cursor-pointer"
            onClick={handleTimelineClick}
            onWheel={handleWheel}
          >
            {/* Time Markers */}
            {getTimeMarkers().map((marker) => (
              <div
                key={marker.time}
                className="absolute top-0 h-full border-l border-gray-300 dark:border-gray-600"
                style={{ left: `${marker.position}%` }}
              >
                <div className="absolute -top-6 left-0 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {marker.label}
                </div>
              </div>
            ))}
            
            {/* Playhead */}
            <div
              className="absolute top-0 w-0.5 h-full bg-red-500 pointer-events-none z-10"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            >
              <div className="absolute -top-2 -left-1 w-2 h-2 bg-red-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Audio Waveform */}
      {currentProject.audioFile && (
        <div className="border-b border-gray-200 dark:border-gray-700 shrink-0">
          <Waveform />
        </div>
      )}

      {/* Tracks */}
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="relative" style={{ width: `${timelineWidth}px`, minWidth: '100%', overflowX: 'auto' }}>
          {/* Track Headers */}
          <div className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex">
              <div className="w-48 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                <div className="p-3 text-sm font-medium text-gray-900 dark:text-white">
                  Tracks
                </div>
              </div>
              <div className="flex-1">
                <div className="p-3 text-sm font-medium text-gray-900 dark:text-white">
                  Timeline
                </div>
              </div>
            </div>
          </div>

          {/* Track Content */}
          {currentProject.tracks.map((track) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border-b border-gray-200 dark:border-gray-700 ${
                selectedTrack === track.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <div className="flex h-16">
                {/* Track Header */}
                <div className="w-48 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                  <TrackHeader track={track} />
                </div>

                {/* Track Content */}
                <div className="flex-1 relative">
                  {/* Track Background */}
                  <div className="absolute inset-0 bg-gray-50 dark:bg-gray-700/50"></div>
                  
                  {/* Clips */}
                  <div className="relative h-full">
                    {track.clips.map((clip) => (
                      <ClipComponent
                        key={clip.id}
                        clip={clip}
                        track={track}
                        pixelsPerSecond={pixelsPerSecond}
                        duration={duration}
                        isSelected={selectedClips.includes(clip.id)}
                        onSelect={() => selectClip(clip.id)}
                        onTrackSelect={() => selectTrack(track.id)}
                        onEdit={setEditingClip}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Empty State */}
          {currentProject.tracks.length === 0 && (
            <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-2">🎬</div>
                <p>No tracks yet. Import files to get started.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Text Editor Modal */}
      <AnimatePresence>
        {editingClip && editingClip.type === 'text' && (
          <TextEditor
            clip={editingClip as any}
            onClose={() => setEditingClip(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
