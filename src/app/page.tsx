'use client';

import React, { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import ImportPanel from '@/components/ImportPanel';
import Timeline from '@/components/Timeline';
import PreviewPanel from '@/components/PreviewPanel';
import Toolbar from '@/components/Toolbar';
import AutoLayout from '@/components/AutoLayout';
import ResponsiveLayout from '@/components/ResponsiveLayout';
import LayoutEditor from '@/components/LayoutEditor';
import ExportPanel from '@/components/ExportPanel';
import TextEditor from '@/components/TextEditor';
import ImageEditor from '@/components/ImageEditor';
import { motion, AnimatePresence } from 'framer-motion';
import { Clip, TextClip, ImageClip } from '@/types';

export default function Home() {
  const {
    currentProject,
    createProject,
    selectedClips,
    deselectAllClips
  } = useProjectStore();
  const [showImportPanel, setShowImportPanel] = useState(false);

  const getSelectedClip = (): Clip | null => {
    if (!currentProject || selectedClips.length !== 1) return null;
    for (const track of currentProject.tracks) {
      const clip = track.clips.find(c => c.id === selectedClips[0]);
      if (clip) return clip;
    }
    return null;
  };

  const selectedClip = getSelectedClip();

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center space-y-6">
            <div className="text-6xl">🎬</div>
            <div>
              <h1 className="text-2xl font-bold">Auto-Video Editor</h1>
              <p className="text-gray-600">Tạo video nhạc Vietsub nhanh chóng</p>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Chọn tỉ lệ khung hình:</h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => createProject('New Project', '16:9')} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="text-2xl mb-2">📺</div>
                  <div className="font-medium">16:9</div>
                  <div className="text-sm text-gray-500">Landscape</div>
                </button>
                <button onClick={() => createProject('New Project', '9:16')} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="text-2xl mb-2">📱</div>
                  <div className="font-medium">9:16</div>
                  <div className="text-sm text-gray-500">Portrait</div>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      <header className="bg-white dark:bg-gray-800 border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{currentProject.name}</h1>
        <button onClick={() => setShowImportPanel(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Import Files
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-80 border-r flex flex-col overflow-y-auto">
          <div className="p-4 border-b"><AutoLayout /></div>
          <div className="p-4 border-b"><ResponsiveLayout /></div>
          <div className="p-4 border-b"><LayoutEditor /></div>
          <div className="p-4"><ExportPanel /></div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor Panel (now on the left of Preview/Timeline) */}
          <AnimatePresence>
            {selectedClip && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 350, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="border-r flex-shrink-0"
              >
                {selectedClip.type === 'text' && <TextEditor key={selectedClip.id} clip={selectedClip as TextClip} onClose={deselectAllClips} />}
                {selectedClip.type === 'image' && <ImageEditor key={selectedClip.id} clip={selectedClip as ImageClip} onClose={deselectAllClips} />}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Preview and Timeline Area (now vertical) */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-[3] p-4 flex items-center justify-center bg-gray-200 dark:bg-gray-950 overflow-hidden">
              <PreviewPanel />
            </div>
            <div className="flex-[2] min-h-0 flex flex-col border-t">
              <Toolbar />
              <div className="flex-1 min-h-0 overflow-auto">
                <Timeline />
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showImportPanel && <ImportPanel onClose={() => setShowImportPanel(false)} />}
      </AnimatePresence>
    </div>
  );
}
