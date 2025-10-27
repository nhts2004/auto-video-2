'use client';

import React, { useState, useEffect } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { ImageClip } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageEditorProps {
  clip: ImageClip;
  onClose: () => void;
}

export default function ImageEditor({ clip, onClose }: ImageEditorProps) {
  const { updateClip, applyStyleAndTransformToTrack } = useProjectStore();
  const [localClip, setLocalClip] = useState<ImageClip>(clip);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => { setLocalClip(clip); }, [clip]);

  const handleUpdate = (updates: Partial<ImageClip>) => {
    const newClip = { ...localClip, ...updates };
    setLocalClip(newClip);
    updateClip(clip.trackId, clip.id, updates);
  };

  const handleTransformUpdate = (transformUpdates: Partial<ImageClip['transform']>) => {
    handleUpdate({ transform: { ...localClip.transform, ...transformUpdates } });
  };

  const handlePositionUpdate = (positionUpdates: Partial<ImageClip['position']>) => {
    handleUpdate({ position: { ...localClip.position, ...positionUpdates } });
  };

  const handleApplyToTrack = () => {
    applyStyleAndTransformToTrack(clip.trackId, localClip);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-gray-800 h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Edit Image</h2>
        <button onClick={onClose}><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <img src={localClip.src} className="w-full rounded-lg border" />

        <div>
          <label>X Position: {localClip.position.x}%</label>
          <input type="range" min="-50" max="150" value={localClip.position.x} onChange={(e) => handlePositionUpdate({ x: parseInt(e.target.value) })} className="w-full" />
        </div>
        <div>
          <label>Y Position: {localClip.position.y}%</label>
          <input type="range" min="-50" max="150" value={localClip.position.y} onChange={(e) => handlePositionUpdate({ y: parseInt(e.target.value) })} className="w-full" />
        </div>
        <div>
          <label>Scale: {localClip.transform.scale.toFixed(2)}</label>
          <input type="range" min="0.1" max="5" step="0.05" value={localClip.transform.scale} onChange={(e) => handleTransformUpdate({ scale: parseFloat(e.target.value) })} className="w-full" />
        </div>
        <div>
          <label>Rotation: {localClip.transform.rotation}°</label>
          <input type="range" min="-180" max="180" value={localClip.transform.rotation} onChange={(e) => handleTransformUpdate({ rotation: parseInt(e.target.value) })} className="w-full" />
        </div>
      </div>

      <div className="p-4 border-t relative">
        <button onClick={handleApplyToTrack} className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Apply to All in Track
        </button>
        <AnimatePresence>
          {showSuccess && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-green-500 text-white text-sm rounded-md">
              Applied to all!
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
