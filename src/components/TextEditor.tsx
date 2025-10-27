'use client';

import React, { useState, useEffect } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { TextClip } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface TextEditorProps {
  clip: TextClip;
  onClose: () => void;
}

export default function TextEditor({ clip, onClose }: TextEditorProps) {
  const { updateClip, applyStyleToTrack } = useProjectStore();
  const [localClip, setLocalClip] = useState<TextClip>(clip);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setLocalClip(clip);
  }, [clip]);

  const handleUpdate = (updates: Partial<TextClip>) => {
    const newClip = { ...localClip, ...updates };
    setLocalClip(newClip);
    updateClip(clip.trackId, clip.id, updates);
  };

  const handleStyleUpdate = (styleUpdates: Partial<TextClip['style']>) => {
    const newStyle = { ...localClip.style, ...styleUpdates };
    handleUpdate({ style: newStyle });
  };

  const handleTransformUpdate = (transformUpdates: Partial<TextClip['transform']>) => {
    const newTransform = { ...localClip.transform, ...transformUpdates };
    handleUpdate({ transform: newTransform });
  };

  const handlePositionUpdate = (positionUpdates: Partial<TextClip['position']>) => {
    const newPosition = { ...localClip.position, ...positionUpdates };
    handleUpdate({ position: newPosition });
  };

  const handleApplyStyleToTrack = () => {
    applyStyleToTrack(clip.trackId, localClip.style);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-gray-800 h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold">Edit Text</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Text Content */}
        <div>
          <label className="block text-sm font-medium mb-1">Content</label>
          <textarea
            value={localClip.text}
            onChange={(e) => handleUpdate({ text: e.target.value })}
            className="w-full p-2 border rounded-lg"
            rows={3}
          />
        </div>

        {/* Font & Size */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Font</label>
            <select
              value={localClip.style.fontFamily}
              onChange={(e) => handleStyleUpdate({ fontFamily: e.target.value })}
              className="w-full p-2 border rounded-lg"
            >
              <option>Arial</option>
              <option>Helvetica</option>
              <option>Times New Roman</option>
              <option>Georgia</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Size: {localClip.style.fontSize}px</label>
            <input
              type="range" min="12" max="144"
              value={localClip.style.fontSize}
              onChange={(e) => handleStyleUpdate({ fontSize: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>

        {/* Colors */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Text Color</label>
            <input
              type="color"
              value={localClip.style.color}
              onChange={(e) => handleStyleUpdate({ color: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Background</label>
            <input
              type="color"
              value={localClip.style.backgroundColor}
              onChange={(e) => handleStyleUpdate({ backgroundColor: e.target.value })}
            />
          </div>
        </div>

        {/* Position */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">X: {localClip.position.x}%</label>
            <input
              type="range" min="0" max="100"
              value={localClip.position.x}
              onChange={(e) => handlePositionUpdate({ x: Number(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Y: {localClip.position.y}%</label>
            <input
              type="range" min="0" max="100"
              value={localClip.position.y}
              onChange={(e) => handlePositionUpdate({ y: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>

        {/* Transform */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Scale: {localClip.transform.scale.toFixed(2)}</label>
            <input
              type="range" min="0.5" max="3" step="0.05"
              value={localClip.transform.scale}
              onChange={(e) => handleTransformUpdate({ scale: Number(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Rotation: {localClip.transform.rotation}°</label>
            <input
              type="range" min="-180" max="180"
              value={localClip.transform.rotation}
              onChange={(e) => handleTransformUpdate({ rotation: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>

      </div>

      <div className="p-4 border-t relative">
        <button
          onClick={handleApplyStyleToTrack}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Apply Style to All in Track
        </button>
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-green-500 text-white text-sm rounded-md"
            >
              Style applied!
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
