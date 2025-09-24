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
  const { updateClip } = useProjectStore();
  const [localClip, setLocalClip] = useState<TextClip>(clip);

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

  const fontFamilies = [
    'Arial, sans-serif',
    'Helvetica, sans-serif',
    'Times New Roman, serif',
    'Georgia, serif',
    'Verdana, sans-serif',
    'Tahoma, sans-serif',
    'Impact, sans-serif',
    'Comic Sans MS, cursive'
  ];

  const colors = [
    '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff',
    '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080',
    '#ffc0cb', '#a52a2a', '#808080', '#000080', '#008000'
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Edit Text Clip
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

        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          {/* Text Content */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Text Content
            </label>
            <textarea
              value={localClip.text}
              onChange={(e) => handleUpdate({ text: e.target.value })}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              rows={3}
              placeholder="Enter your text here..."
            />
          </div>

          {/* Font Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Font Family
              </label>
              <select
                value={localClip.style.fontFamily}
                onChange={(e) => handleStyleUpdate({ fontFamily: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {fontFamilies.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Font Size: {localClip.style.fontSize}px
              </label>
              <input
                type="range"
                min="12"
                max="72"
                value={localClip.style.fontSize}
                onChange={(e) => handleStyleUpdate({ fontSize: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>

          {/* Color Settings */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Text Color
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={localClip.style.color}
                onChange={(e) => handleStyleUpdate({ color: e.target.value })}
                className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
              />
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleStyleUpdate({ color })}
                    className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Background Color */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Background Color
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={localClip.style.backgroundColor || '#000000'}
                onChange={(e) => handleStyleUpdate({ backgroundColor: e.target.value })}
                className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
              />
              <button
                onClick={() => handleStyleUpdate({ backgroundColor: undefined })}
                className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                No Background
              </button>
            </div>
          </div>

          {/* Writing Mode */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Text Direction
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'horizontal-tb', label: 'Horizontal', icon: '↔️' },
                { value: 'vertical-rl', label: 'Vertical (R→L)', icon: '↕️' },
                { value: 'vertical-lr', label: 'Vertical (L→R)', icon: '↕️' }
              ].map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => handleStyleUpdate({ writingMode: mode.value as any })}
                  className={`p-3 border rounded-lg transition-colors ${
                    localClip.style.writingMode === mode.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="text-lg mb-1">{mode.icon}</div>
                  <div className="text-xs">{mode.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Position */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                X Position: {localClip.position.x}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
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
                type="range"
                min="0"
                max="100"
                value={localClip.position.y}
                onChange={(e) => handlePositionUpdate({ y: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>

          {/* Transform */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Scale: {localClip.transform.scale.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
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
                type="range"
                min="-180"
                max="180"
                value={localClip.transform.rotation}
                onChange={(e) => handleTransformUpdate({ rotation: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>

          {/* Timing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Start Time (ms)
              </label>
              <input
                type="number"
                value={localClip.start}
                onChange={(e) => handleUpdate({ start: parseInt(e.target.value) })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                End Time (ms)
              </label>
              <input
                type="number"
                value={localClip.end}
                onChange={(e) => handleUpdate({ end: parseInt(e.target.value) })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </motion.div>
  );
}
