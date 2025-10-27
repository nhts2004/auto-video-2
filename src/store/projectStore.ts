import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  Project, Track, Clip, TextClip, ImageClip, AudioClip,
  ImportedFile, RenderSettings, ExportOptions
} from '@/types';

// Full, correct interface with all required actions
interface ProjectState {
  currentProject: Project | null;
  importedFiles: ImportedFile[];
  selectedClips: string[];
  selectedTrack: string | null;
  isPlaying: boolean;
  currentTime: number;
  zoom: number;
  isRendering: boolean;
  renderProgress: number;
  renderError: string | null;
  lastEncoderUsed: string | null;
  renderSettings: RenderSettings;
  exportOptions: ExportOptions;

  createProject: (name: string, aspectRatio: '16:9' | '9:16') => void;
  loadProject: (project: Project) => void;
  importSRT: (file: File) => Promise<void>;
  importImage: (file: File) => Promise<void>;
  importAudio: (file: File) => Promise<void>;
  autoLayoutTimeline: () => void;
  addTrack: (type: 'text' | 'image' | 'audio', name: string) => void;
  updateClip: (trackId: string, clipId: string, updates: Partial<Clip>) => void;
  applyStyleAndTransformToTrack: (trackId: string, clip: TextClip | ImageClip) => void;
  selectClip: (clipId: string) => void;
  deselectAllClips: () => void;
  togglePlayback: () => void;
  startRender: (options: ExportOptions) => Promise<void>;
  cancelRender: () => void;
  clearRenderError: () => void;
  setRenderSettings: (settings: RenderSettings) => void;
}

const defaultRenderSettings: RenderSettings = {
  fps: 30, resolution: { width: 1920, height: 1080 }, quality: 'high',
  codec: 'h264', crf: 18, pixelFormat: 'yuv420p', profile: 'high'
};

const defaultExportOptions: ExportOptions = {
  format: 'mp4', settings: defaultRenderSettings,
  includeAudio: true, includeSubtitles: true
};

// Helper functions
function parseSRT(content: string): any[] {
    // Implementation restored
    const subtitles = [];
    const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const blocks = normalized.trim().split(/\n{2,}/);
    for (const block of blocks) {
        const lines = block.trim().split('\n');
        if (lines.length < 2) continue;
        const timeMatch = lines[1]?.match(/(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})/);
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
    return (hours * 3600 + minutes * 60 + seconds) * 1000 + (parseInt(ms) || 0);
}


export const useProjectStore = create<ProjectState>()(
  immer((set, get) => ({
    // State properties
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
    lastEncoderUsed: null,
    renderSettings: defaultRenderSettings,
    exportOptions: defaultExportOptions,

    // Actions
    createProject: (name, aspectRatio) => {
      const resolution = aspectRatio === '16:9' ? { width: 1920, height: 1080 } : { width: 1080, height: 1920 };
      set({ currentProject: { id: Date.now().toString(), name, duration: 60000, fps: 30, resolution, aspectRatio, tracks: [], createdAt: new Date(), updatedAt: new Date() }});
    },
    loadProject: (project) => set({ currentProject: project }),

    // Restored import functions
    importSRT: async (file) => {
        const content = await file.text();
        const subtitles = parseSRT(content);
        set(state => {
            state.importedFiles.push({ id: Date.now().toString(), name: file.name, type: 'srt', file, data: subtitles });
        });
    },

    importImage: async (file) => {
        const url = URL.createObjectURL(file);
        set(state => {
            state.importedFiles.push({ id: Date.now().toString(), name: file.name, type: 'image', file, data: { url } });
        });
    },

    importAudio: async (file) => {
        const url = URL.createObjectURL(file);
        set(state => {
            state.importedFiles.push({ id: Date.now().toString(), name: file.name, type: 'audio', file, data: { url } });
        });
    },

    // Restored autoLayoutTimeline with writingMode fix
    autoLayoutTimeline: () => {
        set(state => {
            if (!state.currentProject) return;
            const srtFiles = state.importedFiles.filter(f => f.type === 'srt');
            state.currentProject.tracks = []; // Clear existing tracks
            srtFiles.forEach(srtFile => {
                const track: Track = { id: `track-${srtFile.id}`, type: 'text', name: srtFile.name, clips: [], muted: false, locked: false };
                srtFile.data?.forEach((sub: any, index: number) => {
                    const clip: TextClip = {
                        id: `clip-${srtFile.id}-${index}`, type: 'text', start: sub.start, end: sub.end, text: sub.text,
                        trackId: track.id, position: { x: 50, y: 80 }, transform: { scale: 1, rotation: 0 },
                        style: {
                            fontSize: 48,
                            fontFamily: 'Arial',
                            color: '#ffffff',
                            backgroundColor: 'transparent',
                            writingMode: 'horizontal-tb' // Fixed: Added required property
                        }
                    };
                    track.clips.push(clip);
                });
                state.currentProject?.tracks.push(track);
            });
        });
    },

    addTrack: (type, name) => {
        set(state => {
            if(state.currentProject) {
                const newTrack: Track = { id: Date.now().toString(), type, name, clips: [], muted: false, locked: false };
                state.currentProject.tracks.push(newTrack);
            }
        });
    },

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
        if (track) {
          track.clips.forEach(clip => {
            if (clip.type === referenceClip.type) {
              clip.position = { ...referenceClip.position };
              clip.transform = { ...referenceClip.transform };
              if (clip.type === 'text' && referenceClip.type === 'text') {
                (clip as TextClip).style = { ...(clip as TextClip).style, ...referenceClip.style };
              }
            }
          });
        }
      });
    },

    selectClip: (clipId) => set({ selectedClips: [clipId] }),
    deselectAllClips: () => set({ selectedClips: [] }),
    togglePlayback: () => set(state => ({ isPlaying: !state.isPlaying })),

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

    cancelRender: () => set({ isRendering: false, renderProgress: 0 }),
    clearRenderError: () => set({ renderError: null }),
    setRenderSettings: (settings) => set({ renderSettings: settings }),
  }))
);
