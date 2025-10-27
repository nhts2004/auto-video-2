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

  const handleApplyStyleToTrack = () => {
    applyStyleToTrack(clip.trackId, localClip.style);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000); // Hide after 2 seconds
  };

  const fontFamilies = [
    'Arial, sans-serif', 'Helvetica, sans-serif', 'Times New Roman, serif',
    'Georgia, serif', 'Verdana, sans-serif', 'Tahoma, sans-serif',
    'Impact, sans-serif', 'Comic Sans MS, cursive'
  ];

  const colors = [
    '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00',
    '#ff00ff', '#00ffff', '#ffa500', '#800080', '#ffc0cb', '#a52a2a'
  ];

  return (
    <div className="bg-white dark:bg-gray-800 h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Edit Text
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

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Fields... */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Content</label>
          <textarea
            value={localClip.text}
            onChange={(e) => handleUpdate({ text: e.target.value })}
            className="w-full p-2 border rounded-lg"
            rows={3}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Font</label>
            <select
              value={localClip.style.fontFamily}
              onChange={(e) => handleStyleUpdate({ fontFamily: e.target.value })}
              className="w-full p-2 border rounded-lg"
            >
              {fontFamilies.map(font => <option key={font} value={font}>{font.split(',')[0]}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Size: {localClip.style.fontSize}px</label>
            <input
              type="range" min="12" max="144"
              value={localClip.style.fontSize}
              onChange={(e) => handleStyleUpdate({ fontSize: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Text Color</label>
            <input
              type="color"
              value={localClip.style.color}
              onChange={(e) => handleStyleUpdate({ color: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Background</label>
            <input
              type="color"
              value={localClip.style.backgroundColor || '#000000'}
              onChange={(e) => handleStyleUpdate({ backgroundColor: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 relative">
        <button
          onClick={handleApplyStyleToTrack}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Apply Style to All Clips in Track
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
