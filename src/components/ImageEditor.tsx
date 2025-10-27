'use client';

import React, { useState, useEffect } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { ImageClip } from '@/types';

interface ImageEditorProps {
  clip: ImageClip;
  onClose: () => void;
}

export default function ImageEditor({ clip, onClose }: ImageEditorProps) {
  const { updateClip } = useProjectStore();
  const [localClip, setLocalClip] = useState<ImageClip>(clip);

  useEffect(() => {
    setLocalClip(clip);
  }, [clip]);

  const handleUpdate = (updates: Partial<ImageClip>) => {
    const newClip = { ...localClip, ...updates };
    setLocalClip(newClip);
    updateClip(clip.trackId, clip.id, updates);
  };

  const handleTransformUpdate = (transformUpdates: Partial<ImageClip['transform']>) => {
    const newTransform = { ...localClip.transform, ...transformUpdates };
    handleUpdate({ transform: newTransform });
  };

  const handlePositionUpdate = (positionUpdates: Partial<ImageClip['position']>) => {
    const newPosition = { ...localClip.position, ...positionUpdates };
    handleUpdate({ position: newPosition });
  };

  return (
    <div className="bg-white dark:bg-gray-800 h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Edit Image
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Image Preview */}
        <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <img src={localClip.src} alt="Clip Preview" className="w-full h-auto object-contain" />
        </div>

        {/* Position */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900 dark:text-white">Position</h3>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              X Position: {localClip.position.x}%
            </label>
            <input
              type="range" min="0" max="100"
              value={localClip.position.x}
              onChange={(e) => handlePositionUpdate({ x: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Y Position: {localClip.position.y}%
            </label>
            <input
              type="range" min="0" max="100"
              value={localClip.position.y}
              onChange={(e) => handlePositionUpdate({ y: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>

        {/* Transform */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900 dark:text-white">Transform</h3>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Scale: {localClip.transform.scale.toFixed(2)}
            </label>
            <input
              type="range" min="0.1" max="5" step="0.05"
              value={localClip.transform.scale}
              onChange={(e) => handleTransformUpdate({ scale: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Rotation: {localClip.transform.rotation}°
            </label>
            <input
              type="range" min="-180" max="180"
              value={localClip.transform.rotation}
              onChange={(e) => handleTransformUpdate({ rotation: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
