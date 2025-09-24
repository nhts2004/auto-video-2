'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useProjectStore } from '@/store/projectStore';
import { motion, AnimatePresence } from 'framer-motion';

interface ImportPanelProps {
  onClose: () => void;
}

export default function ImportPanel({ onClose }: ImportPanelProps) {
  const { importSRT, importImage, importAudio, importedFiles, removeFile, autoLayoutTimeline } = useProjectStore();
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true);
    
    try {
      for (const file of acceptedFiles) {
        const extension = file.name.split('.').pop()?.toLowerCase();
        
        switch (extension) {
          case 'srt':
            await importSRT(file);
            break;
          case 'jpg':
          case 'jpeg':
          case 'png':
          case 'gif':
          case 'webp':
            await importImage(file);
            break;
          case 'mp3':
          case 'wav':
          case 'ogg':
          case 'm4a':
          case 'flac':
          case 'aac':
          case 'wma':
          case 'aiff':
          case 'alac':
          case 'opus':
            await importAudio(file);
            break;
          default:
            console.warn(`Unsupported file type: ${extension}`);
        }
      }
      // After imports, auto-generate the timeline so clips appear immediately
      autoLayoutTimeline();
    } catch (error) {
      console.error('Error importing files:', error);
    } finally {
      setIsUploading(false);
    }
  }, [importSRT, importImage, importAudio, autoLayoutTimeline]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      'text/plain': ['.srt'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac', '.wma', '.aiff', '.alac', '.opus']
    }
  });

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'srt':
        return '📝';
      case 'image':
        return '🖼️';
      case 'audio':
        return '🎵';
      default:
        return '📄';
    }
  };

  const getFileTypeLabel = (type: string) => {
    switch (type) {
      case 'srt':
        return 'Subtitle';
      case 'image':
        return 'Image';
      case 'audio':
        return 'Audio';
      default:
        return 'Unknown';
    }
  };

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
            Import Media Files
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

        <div className="p-6 space-y-6">
          {/* Drop Zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragActive
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              <div className="text-4xl">
                {isDragActive ? '📂' : '📁'}
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  or click to select files
                </p>
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1">
                <p>Supported formats:</p>
                <p>• Subtitles: .srt</p>
                <p>• Images: .jpg, .png, .gif, .webp</p>
                <p>• Audio: .mp3, .wav, .flac, .aac, .ogg, .m4a, .wma, .aiff, .alac, .opus</p>
              </div>
            </div>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  Importing files...
                </span>
              </div>
            </div>
          )}

          {/* Imported Files List */}
          {importedFiles.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Imported Files ({importedFiles.length})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <AnimatePresence>
                  {importedFiles.map((file) => (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getFileIcon(file.type)}</span>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {file.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {getFileTypeLabel(file.type)}
                            {file.type === 'srt' && file.data && (
                              <span className="ml-2">
                                ({file.data.length} subtitles)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Close
            </button>
            {importedFiles.length > 0 && (
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue to Timeline
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
