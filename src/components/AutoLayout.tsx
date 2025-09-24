'use client';

import React, { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { globalAudioAnalyzer, audioUtils } from '@/utils/audioUtils';
import { motion, AnimatePresence } from 'framer-motion';

interface AutoLayoutProps {
  onComplete?: () => void;
}

export default function AutoLayout({ onComplete }: AutoLayoutProps) {
  const {
    currentProject,
    importedFiles,
    autoLayoutTimeline,
    updateClip,
    addClip
  } = useProjectStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  const handleAutoLayout = async () => {
    if (!currentProject || importedFiles.length === 0) return;

    setIsProcessing(true);
    setProgress(10);
    setCurrentStep('Preparing media...');

    try {
      // If audio exists, try to get duration, otherwise continue (not required)
      const audioFile = importedFiles.find(f => f.type === 'audio');
      if (audioFile) {
        try {
          const audioDuration = await globalAudioAnalyzer.getAudioDuration(audioFile.file);
          setProgress(30);
          setCurrentStep('Detected audio duration');
        } catch {
          // Ignore; store will compute duration from SRT/images
        }
      }

      setProgress(60);
      setCurrentStep('Auto-laying out timeline...');
      autoLayoutTimeline();

      setProgress(100);
      setCurrentStep('Complete!');
      setTimeout(() => {
        setIsProcessing(false);
        onComplete?.();
      }, 500);
    } catch (error) {
      console.error('Auto layout failed:', error);
      setIsProcessing(false);
      setCurrentStep('Error occurred');
    }
  };


  if (!currentProject) return null;

  return (
    <div className="space-y-4">
      {/* Auto Layout Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleAutoLayout}
        disabled={isProcessing || importedFiles.length === 0}
        className={`w-full py-3 px-6 rounded-lg font-medium transition-all ${
          isProcessing || importedFiles.length === 0
            ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
        }`}
      >
        {isProcessing ? (
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Processing...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <span className="text-lg">⚡</span>
            <span>AUTO LAYOUT</span>
          </div>
        )}
      </motion.button>

      {/* Processing Progress */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {currentStep}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {progress}%
                </span>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto Layout Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
          Auto Layout Features:
        </h3>
        <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
          <li>• Tự động tính thời lượng từ file âm thanh</li>
          <li>• Sắp xếp subtitle theo timestamp từ SRT</li>
          <li>• Tạo slideshow từ hình ảnh</li>
          <li>• Tối ưu font size và vị trí text</li>
          <li>• Hỗ trợ cả 16:9 và 9:16</li>
        </ul>
      </div>

      {/* File Status */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Imported Files:
        </h4>
        <div className="space-y-1">
          {importedFiles.map((file) => (
            <div key={file.id} className="flex items-center space-x-2 text-xs">
              <span className="text-lg">
                {file.type === 'srt' ? '📝' : file.type === 'image' ? '🖼️' : '🎵'}
              </span>
              <span className="text-gray-600 dark:text-gray-400 truncate">
                {file.name}
              </span>
              {file.type === 'srt' && file.data && (
                <span className="text-blue-600 dark:text-blue-400">
                  ({file.data.length} subtitles)
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}