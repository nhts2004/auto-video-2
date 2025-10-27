'use client';

import React, { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { ExportOptions, RenderSettings } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { exportFormats, downloadFile } from '@/utils/exportUtils';

export default function ExportPanel() {
  const {
    currentProject,
    isRendering,
    renderProgress,
    renderError,
    lastEncoderUsed,
    startRender,
    cancelRender,
    clearRenderError,
    exportOptions,
    setRenderSettings
  } = useProjectStore();

  const [showExportDialog, setShowExportDialog] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'mp4' | 'mov' | 'fcp' | 'json' | 'ae'>('mp4');
  const [renderSettings, setLocalRenderSettings] = useState<RenderSettings>({
    fps: 30,
    resolution: { width: 1920, height: 1080 },
    quality: 'high',
    codec: 'h264',
    crf: 18,
    pixelFormat: 'yuv420p',
    profile: 'high'
  });

  if (!currentProject) return null;

  const handleStartExport = async () => {
    if (!currentProject) return;

    if (['fcp', 'json', 'ae'].includes(selectedFormat)) {
      // Export intermediate formats
      const format = exportFormats[selectedFormat as keyof typeof exportFormats];
      const content = format.exportFn(currentProject);
      const filename = `${currentProject.name}_${Date.now()}${format.extension}`;

      downloadFile(content, filename, format.mimeType);
      setShowExportDialog(false);
    } else {
      // Export video formats
      const options: ExportOptions = {
        format: selectedFormat as 'mp4' | 'mov',
        settings: renderSettings,
        includeAudio: true,
        includeSubtitles: true
      };

      setRenderSettings(renderSettings);
      await startRender(options);
      // Keep dialog open if there is an error
      if (!useProjectStore.getState().renderError) {
        setShowExportDialog(false);
      }
    }
  };

  const handleCancelExport = () => {
    cancelRender();
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'mp4': return '🎬';
      case 'mov': return '🎥';
      case 'fcp': return '✂️';
      case 'json': return '📄';
      case 'ae': return '🎨';
      default: return '📁';
    }
  };

  const getFormatDescription = (format: string) => {
    switch (format) {
      case 'mp4': return 'H.264 MP4 - Universal compatibility';
      case 'mov': return 'QuickTime MOV - High quality';
      case 'fcp': return 'Final Cut Pro XML - Professional editing';
      case 'json': return 'Project JSON - Continue editing';
      case 'ae': return 'After Effects JSON - Motion graphics';
      default: return '';
    }
  };

  const isIntermediateFormat = (format: string) => {
    return ['fcp', 'json', 'ae'].includes(format);
  };

  const qualityOptions = [
    { value: 'low', label: 'Low (Fast)', crf: 28, description: 'Small file, fast render' },
    { value: 'medium', label: 'Medium (Balanced)', crf: 23, description: 'Good quality, reasonable size' },
    { value: 'high', label: 'High (Quality)', crf: 18, description: 'Best quality, larger file' }
  ];

  const resolutionPresets = [
    { label: 'HD (720p)', width: 1280, height: 720 },
    { label: 'Full HD (1080p)', width: 1920, height: 1080 },
    { label: '4K (2160p)', width: 3840, height: 2160 },
    { label: 'Mobile (9:16)', width: 1080, height: 1920 }
  ];

  return (
    <div className="space-y-4">
      {/* Export Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowExportDialog(true)}
        disabled={isRendering || !currentProject.tracks.length}
        className={`w-full py-3 px-6 rounded-lg font-medium transition-all ${
          isRendering || !currentProject.tracks.length
            ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700 shadow-lg hover:shadow-xl'
        }`}
      >
        {isRendering ? (
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Exporting...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <span className="text-lg">🚀</span>
            <span>EXPORT VIDEO</span>
          </div>
        )}
      </motion.button>

      {/* Render Error */}
      <AnimatePresence>
        {renderError && !isRendering && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg relative"
            role="alert"
          >
            <strong className="font-bold">Render Failed: </strong>
            <span className="block sm:inline">{renderError}</span>
            <button
              onClick={() => clearRenderError()}
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
            >
              <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <title>Close</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Render Progress */}
      <AnimatePresence>
        {isRendering && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Rendering Video...
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {renderProgress}%
                </span>
              </div>

              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-green-600 to-blue-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${renderProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleCancelExport}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export Dialog */}
      <AnimatePresence>
        {showExportDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Export Settings
                </h2>
                <button
                  onClick={() => setShowExportDialog(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
                {/* Format Selection */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Export Format
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {(['mp4', 'mov', 'fcp', 'json', 'ae'] as const).map((format) => (
                      <button
                        key={format}
                        onClick={() => setSelectedFormat(format)}
                        className={`p-4 border rounded-lg text-left transition-colors ${
                          selectedFormat === format
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getFormatIcon(format)}</span>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white uppercase">
                              {format}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {getFormatDescription(format)}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Render Settings */}
                {!isIntermediateFormat(selectedFormat) && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Render Settings
                    </h3>

                    {/* Quality */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Quality
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {qualityOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setLocalRenderSettings({
                              ...renderSettings,
                              quality: option.value as any,
                              crf: option.crf
                            })}
                            className={`p-3 border rounded-lg text-center transition-colors ${
                              renderSettings.quality === option.value
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                            }`}
                          >
                            <div className="font-medium text-gray-900 dark:text-white">
                              {option.label}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {option.description}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Resolution */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Resolution
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {resolutionPresets.map((preset) => (
                          <button
                            key={preset.label}
                            onClick={() => setLocalRenderSettings({
                              ...renderSettings,
                              resolution: { width: preset.width, height: preset.height }
                            })}
                            className={`p-3 border rounded-lg text-center transition-colors ${
                              renderSettings.resolution.width === preset.width
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                            }`}
                          >
                            <div className="font-medium text-gray-900 dark:text-white">
                              {preset.label}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {preset.width} × {preset.height}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* FPS */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Frame Rate: {renderSettings.fps} FPS
                      </label>
                      <input
                        type="range"
                        min="24"
                        max="60"
                        value={renderSettings.fps}
                        onChange={(e) => setLocalRenderSettings({
                          ...renderSettings,
                          fps: parseInt(e.target.value)
                        })}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}

                {/* Intermediate Format Info */}
                {isIntermediateFormat(selectedFormat) && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-blue-900 dark:text-blue-300 mb-2">
                        {exportFormats[selectedFormat as keyof typeof exportFormats]?.name}
                      </h3>
                      <p className="text-blue-700 dark:text-blue-400 text-sm">
                        {selectedFormat === 'json' && 'Export your project data to continue editing later or share with others.'}
                        {selectedFormat === 'fcp' && 'Export to Final Cut Pro for professional video editing with all clips and timing preserved.'}
                        {selectedFormat === 'ae' && 'Export to After Effects for advanced motion graphics and visual effects work.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowExportDialog(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartExport}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Start Export
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export Info */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Export Information:
        </h4>
        <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
          {lastEncoderUsed && (
            <div className="text-green-600 dark:text-green-400">Last Used Encoder: {lastEncoderUsed}</div>
          )}
          <div>Project: {currentProject.name}</div>
          <div>Duration: {Math.round(currentProject.duration / 1000)}s</div>
          <div>Resolution: {currentProject.resolution.width} × {currentProject.resolution.height}</div>
          <div>Aspect Ratio: {currentProject.aspectRatio}</div>
          <div>Tracks: {currentProject.tracks.length}</div>
        </div>
      </div>
    </div>
  );
}
