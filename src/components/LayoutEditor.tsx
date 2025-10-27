'use client';

import React, { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { TextClip } from '@/types';
import { combineHexWithAlpha } from '@/utils/color';

export default function LayoutEditor() {
  const { currentProject, updateClip } = useProjectStore();
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState(24);
  const [color, setColor] = useState('#ffffff');
  const [bgColorHex, setBgColorHex] = useState('#000000');
  const [bgOpacity, setBgOpacity] = useState(50);

  if (!currentProject) return null;

  const applyToAllText = () => {
    const backgroundColor = combineHexWithAlpha(bgColorHex, bgOpacity / 100);

    currentProject.tracks.forEach((track) => {
      if (track.type !== 'text') return;

      track.clips.forEach((clip) => {
        if (clip.type !== 'text') return;

        updateClip(track.id, clip.id, {
          style: {
            ...clip.style,
            fontFamily,
            fontSize,
            color,
            backgroundColor,
          },
        } as Partial<TextClip>);
      });
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Layout Editor</h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm text-gray-600 dark:text-gray-300">Font family</label>
          <select
            value={fontFamily}
            onChange={(event) => setFontFamily(event.target.value)}
            className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-transparent"
          >
            <option value="Arial">Arial</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Inter">Inter</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Roboto">Roboto</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-600 dark:text-gray-300">Font size</label>
          <input
            type="number"
            min={12}
            max={128}
            value={fontSize}
            onChange={(event) => setFontSize(parseInt(event.target.value || '24', 10))}
            className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-transparent"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-600 dark:text-gray-300">Text color</label>
          <input
            type="color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
            className="w-full h-10 p-1 rounded border border-gray-300 dark:border-gray-600 bg-transparent"
          />
        </div>

        <div className="space-y-2">
          <div className="space-y-1">
            <label className="text-sm text-gray-600 dark:text-gray-300">Background</label>
            <input
              type="color"
              value={bgColorHex}
              onChange={(event) => setBgColorHex(event.target.value)}
              className="w-full h-10 p-1 rounded border border-gray-300 dark:border-gray-600 bg-transparent"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Background opacity ({bgOpacity}%)
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={bgOpacity}
              onChange={(event) => setBgOpacity(parseInt(event.target.value || '0', 10))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <button
        onClick={applyToAllText}
        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Apply to all subtitles
      </button>
    </div>
  );
}

