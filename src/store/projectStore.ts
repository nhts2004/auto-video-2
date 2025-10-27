import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  Project, Track, Clip, TextClip, ImageClip, AudioClip,
  ImportedFile, RenderSettings, ExportOptions
} from '@/types';

// (Interface definitions remain the same)
interface ProjectState {
  currentProject: Project | null;
  importedFiles: ImportedFile[];
  selectedClips: string[];
  isPlaying: boolean;
  currentTime: number;
  isRendering: boolean;
  renderProgress: number;
  renderError: string | null;
  lastEncoderUsed: string | null;

  createProject: (name: string, aspectRatio: '16:9' | '9:16') => void;
  importSRT: (file: File) => Promise<void>;
  importImage: (file: File) => Promise<void>;
  importAudio: (file: File) => Promise<void>;
  autoLayoutTimeline: () => void;
  updateClip: (trackId: string, clipId: string, updates: Partial<Clip>) => void;
  applyStyleAndTransformToTrack: (trackId: string, clip: TextClip | ImageClip) => void;
  selectClip: (clipId: string) => void;
  deselectAllClips: () => void;
  startRender: (options: ExportOptions) => Promise<void>;
  clearRenderError: () => void;
}

export const useProjectStore = create<ProjectState>()(
  immer((set, get) => ({
    // ... initial state
    currentProject: null,
    importedFiles: [],
    selectedClips: [],
    isPlaying: false,
    currentTime: 0,
    isRendering: false,
    renderProgress: 0,
    renderError: null,
    lastEncoderUsed: null,
    // ... other actions
    createProject: (name, aspectRatio) => {
      const resolution = aspectRatio === '16:9'
        ? { width: 1920, height: 1080 }
        : { width: 1080, height: 1920 };
      set({
        currentProject: {
          id: Date.now().toString(), name, duration: 0, fps: 30, resolution, aspectRatio,
          tracks: [], createdAt: new Date(), updatedAt: new Date()
        }
      });
    },

    importSRT: async (file) => { /* ... implementation ... */ },
    importImage: async (file) => { /* ... implementation ... */ },
    importAudio: async (file) => { /* ... implementation ... */ },
    autoLayoutTimeline: () => { /* ... implementation ... */ },

    updateClip: (trackId, clipId, updates) => {
      set(state => {
        const track = state.currentProject?.tracks.find(t => t.id === trackId);
        const clip = track?.clips.find(c => c.id === clipId);
        if (clip) Object.assign(clip, updates);
      });
    },

    applyStyleAndTransformToTrack: (trackId, referenceClip) => {
      set(state => {
        const track = state.currentProject?.tracks.find(t => t.id === trackId);
        if (!track) return;

        track.clips.forEach(clip => {
          if (clip.type === referenceClip.type) {
            // Apply position and transform
            clip.position = { ...referenceClip.position };
            clip.transform = { ...referenceClip.transform };

            // Apply style only if it's a TextClip
            if (clip.type === 'text' && referenceClip.type === 'text') {
              (clip as TextClip).style = { ...(clip as TextClip).style, ...referenceClip.style };
            }
          }
        });
      });
    },

    selectClip: (clipId) => set({ selectedClips: [clipId] }),
    deselectAllClips: () => set({ selectedClips: [] }),
    clearRenderError: () => set({ renderError: null }),

    startRender: async (options) => {
      set({ isRendering: true, renderProgress: 0, renderError: null });
      try {
        const serializableProject = JSON.parse(JSON.stringify(get().currentProject));
        const response = await fetch('/api/render', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project: serializableProject, options }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.details || 'Render failed');
        set({ isRendering: false, lastEncoderUsed: result.encoderUsed });
      } catch (error) {
        set({ isRendering: false, renderError: (error as Error).message });
      }
    },
  }))
);
