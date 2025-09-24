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
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const { currentProject, createProject, autoLayoutTimeline, importedFiles } = useProjectStore();
  const [showImportPanel, setShowImportPanel] = useState(false);

  const handleCreateProject = (aspectRatio: '16:9' | '9:16') => {
    createProject('New Project', aspectRatio);
  };

  const handleAutoLayout = () => {
    if (importedFiles.length > 0) {
      autoLayoutTimeline();
    }
  };

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full mx-4"
        >
          <div className="text-center space-y-6">
            <div className="text-6xl">🎬</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Auto-Video Editor
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Tạo video nhạc Vietsub 2 ngôn ngữ nhanh chóng và tự động
              </p>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Chọn tỉ lệ khung hình:
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleCreateProject('16:9')}
                  className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="text-2xl mb-2">📺</div>
                  <div className="font-medium text-gray-900 dark:text-white">16:9</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Landscape</div>
                </button>
                <button
                  onClick={() => handleCreateProject('9:16')}
                  className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="text-2xl mb-2">📱</div>
                  <div className="font-medium text-gray-900 dark:text-white">9:16</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Portrait</div>
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
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {currentProject.name}
            </h1>
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm">
              {currentProject.aspectRatio}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowImportPanel(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Import Files
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-y-auto">
          {/* Auto Layout Panel */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <AutoLayout />
          </div>
          
          {/* Responsive Layout Panel */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <ResponsiveLayout />
          </div>
          
          {/* Layout Editor */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <LayoutEditor />
          </div>

          {/* Export Panel */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <ExportPanel />
          </div>
          
          {/* Preview Panel - moved to main area above timeline */}
        </div>

        {/* Main Panel: Preview above Timeline */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <PreviewPanel />
          </div>
          <div className="flex-1 min-h-0 flex flex-col">
            <Toolbar />
            <div className="flex-1 min-h-0 overflow-hidden">
              <Timeline />
            </div>
          </div>
        </div>
      </div>

      {/* Import Panel Modal */}
      <AnimatePresence>
        {showImportPanel && (
          <ImportPanel onClose={() => setShowImportPanel(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}