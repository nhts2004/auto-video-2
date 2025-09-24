// Core types for Auto-Video Editor
export interface SRTSubtitle {
  id: number;
  start: number; // milliseconds
  end: number;   // milliseconds
  text: string;
}

export interface TextClip {
  id: string;
  type: 'text';
  start: number; // milliseconds
  end: number;   // milliseconds
  text: string;
  position: {
    x: number;
    y: number;
  };
  transform: {
    scale: number;
    rotation: number;
  };
  style: {
    fontSize: number;
    fontFamily: string;
    color: string;
    backgroundColor?: string;
    writingMode: 'horizontal-tb' | 'vertical-rl' | 'vertical-lr';
  };
  trackId: string;
}

export interface ImageClip {
  id: string;
  type: 'image';
  start: number;
  end: number;
  src: string;
  position: {
    x: number;
    y: number;
  };
  transform: {
    scale: number;
    rotation: number;
  };
  trackId: string;
}

export interface AudioClip {
  id: string;
  type: 'audio';
  start: number;
  end: number;
  src: string;
  volume: number;
  trackId: string;
}

export type Clip = TextClip | ImageClip | AudioClip;

export interface Track {
  id: string;
  type: 'text' | 'image' | 'audio';
  name: string;
  clips: Clip[];
  muted: boolean;
  locked: boolean;
}

export interface Project {
  id: string;
  name: string;
  duration: number; // milliseconds
  fps: number;
  resolution: {
    width: number;
    height: number;
  };
  aspectRatio: '16:9' | '9:16';
  tracks: Track[];
  audioFile?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImportedFile {
  id: string;
  name: string;
  type: 'srt' | 'image' | 'audio';
  file: File;
  data?: any; // parsed data
}

export interface RenderSettings {
  fps: number;
  resolution: {
    width: number;
    height: number;
  };
  quality: 'low' | 'medium' | 'high';
  codec: 'h264' | 'h265';
  crf: number;
  pixelFormat: string;
  profile: string;
}

export interface ExportOptions {
  format: 'mp4' | 'mov' | 'fcp' | 'json' | 'ae';
  settings: RenderSettings;
  includeAudio: boolean;
  includeSubtitles: boolean;
}
