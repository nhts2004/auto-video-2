import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  Project,
  Track,
  Clip,
  TextClip,
  ImageClip,
  AudioClip,
  ImportedFile,
  RenderSettings,
  ExportOptions
} from '@/types';

interface ProjectState {
  // Project data
  currentProject: Project | null;
  importedFiles: ImportedFile[];

  // UI state
  selectedClips: string[];
  selectedTrack: string | null;
  isPlaying: boolean;
  currentTime: number;
  zoom: number;

  // Render/Export state
  isRendering: boolean;
  renderProgress: number;
  renderError: string | null;
  renderSettings: RenderSettings;
  exportOptions: ExportOptions;

  // Actions
  createProject: (name: string, aspectRatio: '16:9' | '9:16') => void;
  loadProject: (project: Project) => void;
  saveProject: () => void;

  // File management
  importSRT: (file: File) => Promise<void>;
  importImage: (file: File) => Promise<void>;
  importAudio: (file: File) => Promise<void>;
  removeFile: (fileId: string) => void;

  // Timeline operations
  addTrack: (type: 'text' | 'image' | 'audio', name: string) => void;
  removeTrack: (trackId: string) => void;
  addClip: (trackId: string, clip: Omit<Clip, 'id'>) => void;
  removeClip: (trackId: string, clipId: string) => void;
  updateClip: (trackId: string, clipId: string, updates: Partial<Clip>) => void;
  applyStyleToTrack: (trackId: string, style: Partial<TextClip['style']>) => void;
  moveClip: (fromTrackId: string, toTrackId: string, clipId: string, newStart: number) => void;

  // Auto-timeline
  autoLayoutTimeline: () => void;

  // UI actions
  selectClip: (clipId: string) => void;
  selectMultipleClips: (clipIds: string[]) => void;
  deselectAllClips: () => void;
  selectTrack: (trackId: string) => void;
  setCurrentTime: (time: number) => void;
  setZoom: (zoom: number) => void;
  togglePlayback: () => void;

  // Render/Export
  startRender: (options: ExportOptions) => Promise<void>;
  cancelRender: () => void;
  clearRenderError: () => void;
  updateRenderProgress: (progress: number) => void;
  setRenderSettings: (settings: RenderSettings) => void;
  // Project-level updates
  updateProjectSettings: (updates: Partial<Project>) => void;
}

const defaultRenderSettings: RenderSettings = {
  fps: 30,
  resolution: { width: 1920, height: 1080 },
  quality: 'high',
  codec: 'h264',
  crf: 18,
  pixelFormat: 'yuv420p',
  profile: 'high'
};

const defaultExportOptions: ExportOptions = {
  format: 'mp4',
  settings: defaultRenderSettings,
  includeAudio: true,
  includeSubtitles: true
};

export const useProjectStore = create<ProjectState>()(
  immer((set, get) => ({
    // Initial state
    currentProject: null,
    importedFiles: [],
    selectedClips: [],
    selectedTrack: null,
    isPlaying: false,
    currentTime: 0,
    zoom: 1,
    isRendering: false,
    renderProgress: 0,
    renderError: null,
    renderSettings: defaultRenderSettings,
    exportOptions: defaultExportOptions,

    // Project management
    createProject: (name: string, aspectRatio: '16:9' | '9:16') => {
      set((state) => {
        const resolution = aspectRatio === '16:9'
          ? { width: 1920, height: 1080 }
          : { width: 1080, height: 1920 };

        state.currentProject = {
          id: Date.now().toString(),
          name,
          duration: 0,
          fps: 30,
          resolution,
          aspectRatio,
          tracks: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
      });
    },

    loadProject: (project: Project) => {
      set((state) => {
        state.currentProject = project;
      });
    },

    saveProject: () => {
      const { currentProject } = get();
      if (currentProject) {
        // Save to localStorage or send to server
        localStorage.setItem(`project_${currentProject.id}`, JSON.stringify(currentProject));
      }
    },

    // File management
    importSRT: async (file: File) => {
      const content = await file.text();
      const subtitles = parseSRT(content);

      set((state) => {
        const importedFile: ImportedFile = {
          id: Date.now().toString(),
          name: file.name,
          type: 'srt',
          file,
          data: subtitles
        };
        state.importedFiles.push(importedFile);
      });
    },

    importImage: async (file: File) => {
      const url = URL.createObjectURL(file);

      set((state) => {
        const importedFile: ImportedFile = {
          id: Date.now().toString(),
          name: file.name,
          type: 'image',
          file,
          data: { url }
        };
        state.importedFiles.push(importedFile);
      });
    },

    importAudio: async (file: File) => {
      const url = URL.createObjectURL(file);

      set((state) => {
        const importedFile: ImportedFile = {
          id: Date.now().toString(),
          name: file.name,
          type: 'audio',
          file,
          data: { url }
        };
        state.importedFiles.push(importedFile);

        // Set as project audio if it's the first audio file
        if (state.currentProject && !state.currentProject.audioFile) {
          state.currentProject.audioFile = url;
        }
      });
    },

    removeFile: (fileId: string) => {
      set((state) => {
        state.importedFiles = state.importedFiles.filter(file => file.id !== fileId);
      });
    },

    // Timeline operations
    addTrack: (type: 'text' | 'image' | 'audio', name: string) => {
      set((state) => {
        if (!state.currentProject) return;

        const track: Track = {
          id: Date.now().toString(),
          type,
          name,
          clips: [],
          muted: false,
          locked: false
        };

        state.currentProject.tracks.push(track);
      });
    },

    removeTrack: (trackId: string) => {
      set((state) => {
        if (!state.currentProject) return;
        state.currentProject.tracks = state.currentProject.tracks.filter(track => track.id !== trackId);
      });
    },

    addClip: (trackId: string, clipData: Omit<Clip, 'id'>) => {
      set((state) => {
        if (!state.currentProject) return;

        const track = state.currentProject.tracks.find(t => t.id === trackId);
        if (!track) return;

        const clip: Clip = {
          ...clipData,
          id: Date.now().toString()
        } as Clip;

        track.clips.push(clip);
      });
    },

    removeClip: (trackId: string, clipId: string) => {
      set((state) => {
        if (!state.currentProject) return;

        const track = state.currentProject.tracks.find(t => t.id === trackId);
        if (!track) return;

        track.clips = track.clips.filter(clip => clip.id !== clipId);
      });
    },

    updateClip: (trackId: string, clipId: string, updates: Partial<Clip>) => {
      set((state) => {
        if (!state.currentProject) return;

        const track = state.currentProject.tracks.find(t => t.id === trackId);
        if (!track) return;

        const clip = track.clips.find(c => c.id === clipId);
        if (!clip) return;

        Object.assign(clip, updates);
      });
    },

    applyStyleToTrack: (trackId: string, style: Partial<TextClip['style']>) => {
      set((state) => {
        if (!state.currentProject) return;

        const track = state.currentProject.tracks.find(t => t.id === trackId);
        if (!track || track.type !== 'text') return;

        track.clips.forEach(clip => {
          if (clip.type === 'text') {
            clip.style = { ...clip.style, ...style };
          }
        });
      });
    },

    moveClip: (fromTrackId: string, toTrackId: string, clipId: string, newStart: number) => {
      set((state) => {
        if (!state.currentProject) return;

        const fromTrack = state.currentProject.tracks.find(t => t.id === fromTrackId);
        const toTrack = state.currentProject.tracks.find(t => t.id === toTrackId);

        if (!fromTrack || !toTrack) return;

        const clip = fromTrack.clips.find(c => c.id === clipId);
        if (!clip) return;

        // Remove from source track
        fromTrack.clips = fromTrack.clips.filter(c => c.id !== clipId);

        // Add to target track with new start time
        clip.start = newStart;
        clip.trackId = toTrackId;
        toTrack.clips.push(clip);
      });
    },

    // Auto-timeline
    autoLayoutTimeline: () => {
      const { currentProject, importedFiles } = get();
      if (!currentProject) return;

      set((state) => {
        if (!state.currentProject) return;

        const audioFile = importedFiles.find(f => f.type === 'audio');
        const srtFiles = importedFiles.filter(f => f.type === 'srt');
        const imageFiles = importedFiles.filter(f => f.type === 'image');

        let projectDuration = state.currentProject.duration || 0;

        if (audioFile) {
          projectDuration = 180000;
          state.currentProject.audioFile = audioFile.data?.url;
        } else if (srtFiles.length > 0) {
          const lastEnd = Math.max(
            ...srtFiles.flatMap((f: any) => (f.data || []).map((s: any) => s.end || 0))
          );
          projectDuration = Math.max(5000, lastEnd + 2000);
        } else if (imageFiles.length > 0) {
          projectDuration = imageFiles.length * 5000;
        } else {
          projectDuration = 60000;
        }

        state.currentProject.duration = projectDuration;
        state.currentProject.tracks = [];

        // Create a new track for each SRT file
        srtFiles.forEach(srtFile => {
          const textTrack: Track = {
            id: `track-${srtFile.id}`,
            type: 'text',
            name: srtFile.name,
            clips: [],
            muted: false,
            locked: false
          };

          if (srtFile.data) {
            srtFile.data.forEach((subtitle: any, index: number) => {
              const textClip: TextClip = {
                id: `clip-${srtFile.id}-${index}`,
                type: 'text',
                start: subtitle.start,
                end: subtitle.end,
                text: subtitle.text,
                position: { x: 50, y: 80 },
                transform: { scale: 1, rotation: 0 },
                style: {
                  fontSize: 36,
                  fontFamily: 'Arial',
                  color: '#ffffff',
                  backgroundColor: '#00000080',
                  writingMode: 'horizontal-tb'
                },
                trackId: textTrack.id
              };
              textTrack.clips.push(textClip);
            });
          }
          state.currentProject!.tracks.push(textTrack);
        });

        // Create one track for all images
        if (imageFiles.length > 0) {
          const imageTrack: Track = {
            id: 'auto-image-track',
            type: 'image',
            name: 'Images',
            clips: [],
            muted: false,
            locked: false
          };
          const imageDuration = (state.currentProject.duration || 60000) / imageFiles.length;
          imageFiles.forEach((imageFile, index) => {
            const imageClip: ImageClip = {
              id: `auto-image-${imageFile.id}`,
              type: 'image',
              start: index * imageDuration,
              end: (index + 1) * imageDuration,
              src: imageFile.data?.url || '',
              position: { x: 0, y: 0 },
              transform: { scale: 1, rotation: 0 },
              trackId: imageTrack.id
            };
            imageTrack.clips.push(imageClip);
          });
          state.currentProject!.tracks.push(imageTrack);
        }

        // Create one track for audio
        if (audioFile) {
          const audioTrack: Track = {
            id: 'auto-audio-track',
            type: 'audio',
            name: 'Audio',
            clips: [],
            muted: false,
            locked: false
          };
          const audioClip: AudioClip = {
            id: 'auto-audio-main',
            type: 'audio',
            start: 0,
            end: state.currentProject.duration,
            src: audioFile.data?.url || '',
            volume: 1,
            trackId: audioTrack.id
          };
          audioTrack.clips.push(audioClip);
          state.currentProject!.tracks.push(audioTrack);
        }
      });
    },

    // UI actions
    selectClip: (clipId: string) => {
      set((state) => {
        state.selectedClips = [clipId];
      });
    },

    selectMultipleClips: (clipIds: string[]) => {
      set((state) => {
        state.selectedClips = clipIds;
      });
    },

    deselectAllClips: () => {
      set((state) => {
        state.selectedClips = [];
      });
    },

    selectTrack: (trackId: string) => {
      set((state) => {
        state.selectedTrack = trackId;
      });
    },

    setCurrentTime: (time: number) => {
      set((state) => {
        state.currentTime = time;
      });
    },

    setZoom: (zoom: number) => {
      set((state) => {
        state.zoom = zoom;
      });
    },

    togglePlayback: () => {
      set((state) => {
        state.isPlaying = !state.isPlaying;
      });
    },

    // Render/Export
    startRender: async (options: ExportOptions) => {
      set((state) => {
        state.isRendering = true;
        state.renderProgress = 0;
        state.renderError = null;
        state.exportOptions = options;
      });

      try {
        const { currentProject } = get();
        if (!currentProject) throw new Error('No project loaded');

        // Call API route for rendering (server-side)
        const response = await fetch('/api/render', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            project: currentProject,
            options: {
              format: options.format,
              settings: options.settings,
              includeAudio: options.includeAudio
            }
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || 'Render request failed');
        }

        // Simulate progress for now (in real implementation, you'd use WebSocket or polling)
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 200));
          get().updateRenderProgress(i);
        }

        console.log('Render completed');

        set((state) => {
          state.isRendering = false;
          state.renderProgress = 100;
        });

      } catch (error) {
        console.error('Render failed:', error);
        set((state) => {
          state.isRendering = false;
          state.renderProgress = 0;
          state.renderError = error instanceof Error ? error.message : 'An unknown error occurred';
        });
      }
    },

    cancelRender: () => {
      set((state) => {
        state.isRendering = false;
        state.renderProgress = 0;
      });
    },

    clearRenderError: () => {
      set((state) => {
        state.renderError = null;
      });
    },

    updateRenderProgress: (progress: number) => {
      set((state) => {
        state.renderProgress = progress;
      });
    },

    setRenderSettings: (settings: RenderSettings) => {
      set((state) => {
        state.renderSettings = settings;
      });
    },

    // Project-level updates
    updateProjectSettings: (updates: Partial<Project>) => {
      set((state) => {
        if (!state.currentProject) return;
        state.currentProject = {
          ...state.currentProject,
          ...updates,
          updatedAt: new Date()
        } as Project;
      });
    }
  }))
);

// Helper function to parse SRT content
function parseSRT(content: string) {
  const subtitles = [];
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.trim().split(/\n{2,}/);

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 2) continue;

    const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})/);
    if (!timeMatch) continue;

    const start = parseTimeToMs(timeMatch[1]);
    const end = parseTimeToMs(timeMatch[2]);
    const text = lines.slice(2).join('\n');

    subtitles.push({ id: subtitles.length + 1, start, end, text });
  }

  return subtitles;
}

function parseTimeToMs(timeStr: string): number {
  const clean = timeStr.replace('.', ',');
  const [time, ms] = clean.split(',');
  const [hours, minutes, seconds] = time.split(':').map(Number);
  return (hours * 3600 + minutes * 60 + seconds) * 1000 + parseInt(ms);
}
