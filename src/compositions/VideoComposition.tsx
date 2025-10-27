import React, { useMemo } from 'react';
import { AbsoluteFill, Audio, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Project, Track, Clip, TextClip, ImageClip, AudioClip } from '../types';

const DEFAULT_BACKGROUND = '#000000';

const TRACK_ORDER: Record<Track['type'], number> = {
  image: 0,
  text: 1,
  audio: 2,
};

type ProjectLike = Partial<Project> & { tracks?: Track[] };

export type NormalizedProject = {
  name: string;
  fps: number;
  duration: number;
  resolution: {
    width: number;
    height: number;
  };
  aspectRatio: '16:9' | '9:16';
  tracks: Track[];
  audioFile?: string;
};

const DEFAULT_PROJECT: NormalizedProject = {
  name: 'Untitled Project',
  fps: 30,
  duration: 3000,
  resolution: { width: 1920, height: 1080 },
  aspectRatio: '16:9',
  tracks: [],
};

interface VideoCompositionProps {
  project?: ProjectLike | null;
}

export const VideoComposition: React.FC<VideoCompositionProps> = ({ project }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const normalizedProject = useMemo(() => normalizeProject(project), [project]);
  const { resolution, tracks } = normalizedProject;
  const currentTimeMs = (frame / fps) * 1000;

  const visualTracks = useMemo(
    () =>
      tracks
        .map((track, index) => ({ track, index }))
        .filter(({ track }) => track.type !== 'audio' && !track.muted)
        .sort((a, b) => {
          const orderDiff = TRACK_ORDER[a.track.type] - TRACK_ORDER[b.track.type];
          if (orderDiff !== 0) return orderDiff;
          return a.index - b.index;
        }),
    [tracks],
  );

  const audioTracks = useMemo(
    () => tracks.filter((track) => track.type === 'audio' && track.clips.length > 0),
    [tracks],
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: DEFAULT_BACKGROUND,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {visualTracks.flatMap(({ track, index }) =>
        track.clips
          .filter((clip) => isClipActive(clip, currentTimeMs))
          .map((clip, clipIndex) => {
            const zIndex = index * 10 + clipIndex;
            if (isTextClip(clip)) {
              return (
                <div key={clip.id} style={getTextClipStyle(clip, resolution, zIndex)}>
                  {clip.text}
                </div>
              );
            }

            if (isImageClip(clip) && clip.src) {
              return (
                <img
                  key={clip.id}
                  src={clip.src}
                  alt=""
                  style={getImageClipStyle(clip, resolution, zIndex)}
                />
              );
            }

            return null;
          })
          .filter(Boolean),
      )}

      {audioTracks.map((track) =>
        track.clips.map((clip) => {
          if (!isAudioClip(clip)) {
            return null;
          }

          const startFrame = msToFrame(clip.start, fps);
          const endFrame = msToFrame(clip.end, fps);
          const volume = track.muted ? 0 : clip.volume ?? 1;
          const src = clip.src || normalizedProject.audioFile;

          if (!src) {
            return null;
          }

          return (
            <Audio
              key={clip.id}
              src={src}
              startFrom={startFrame}
              endAt={endFrame}
              volume={volume}
            />
          );
        }),
      )}
    </AbsoluteFill>
  );
};

export function normalizeProject(project?: ProjectLike | null): NormalizedProject {
  if (!project) {
    return { ...DEFAULT_PROJECT };
  }

  const fps = typeof project.fps === 'number' && project.fps > 0 ? project.fps : DEFAULT_PROJECT.fps;
  const resolution = {
    width: project.resolution?.width ?? DEFAULT_PROJECT.resolution.width,
    height: project.resolution?.height ?? DEFAULT_PROJECT.resolution.height,
  };
  const aspectRatio = project.aspectRatio ?? (resolution.width >= resolution.height ? '16:9' : '9:16');
  const tracks = Array.isArray(project.tracks)
    ? project.tracks.map((track) => ({
        ...track,
        clips: Array.isArray(track.clips) ? track.clips.map((clip) => ({ ...clip })) : [],
      }))
    : [];

  const clipEndTimes = tracks.flatMap((track) =>
    track.clips.map((clip) => (typeof clip.end === 'number' ? clip.end : 0)),
  );
  const derivedDuration = clipEndTimes.length > 0 ? Math.max(...clipEndTimes) : 0;
  const declaredDuration = typeof project.duration === 'number' ? project.duration : 0;
  const duration = Math.max(declaredDuration, derivedDuration, 1);

  return {
    name: project.name ?? DEFAULT_PROJECT.name,
    fps,
    duration,
    resolution,
    aspectRatio,
    tracks,
    audioFile: project.audioFile,
  };
}

function isClipActive(clip: Clip, currentTimeMs: number) {
  return currentTimeMs >= clip.start && currentTimeMs <= clip.end;
}

function isTextClip(clip: Clip): clip is TextClip {
  return clip.type === 'text';
}

function isImageClip(clip: Clip): clip is ImageClip {
  return clip.type === 'image';
}

function isAudioClip(clip: Clip): clip is AudioClip {
  return clip.type === 'audio';
}

function msToFrame(ms: number, fps: number) {
  return Math.max(0, Math.round((ms / 1000) * fps));
}

function percentToPixels(percent: number, dimension: number) {
  return (percent / 100) * dimension;
}

function buildTransform(scale = 1, rotation = 0) {
  const transforms: string[] = [];
  if (scale !== 1) {
    transforms.push(`scale(${scale})`);
  }
  if (rotation !== 0) {
    transforms.push(`rotate(${rotation}deg)`);
  }

  if (transforms.length === 0) {
    return undefined;
  }

  return transforms.join(' ');
}

function withAlpha(color?: string) {
  if (!color) {
    return undefined;
  }

  const hexMatch = color.match(/^#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?$/);
  if (!hexMatch) {
    return color;
  }

  const [, rgb, alpha] = hexMatch;
  const r = parseInt(rgb.slice(0, 2), 16);
  const g = parseInt(rgb.slice(2, 4), 16);
  const b = parseInt(rgb.slice(4, 6), 16);

  if (!alpha) {
    return `rgb(${r}, ${g}, ${b})`;
  }

  const alphaValue = Math.round((parseInt(alpha, 16) / 255) * 1000) / 1000;
  return `rgba(${r}, ${g}, ${b}, ${alphaValue})`;
}

function getTextClipStyle(clip: TextClip, resolution: NormalizedProject['resolution'], zIndex: number) {
  const left = percentToPixels(clip.position.x, resolution.width);
  const top = percentToPixels(clip.position.y, resolution.height);

  return {
    position: 'absolute' as const,
    left,
    top,
    transformOrigin: 'top left',
    transform: buildTransform(clip.transform?.scale, clip.transform?.rotation),
    fontFamily: clip.style.fontFamily,
    fontSize: `${clip.style.fontSize}px`,
    color: clip.style.color,
    backgroundColor: withAlpha(clip.style.backgroundColor),
    writingMode: clip.style.writingMode,
    whiteSpace: 'pre-wrap' as const,
    lineHeight: 1.2,
    padding: clip.style.backgroundColor ? '12px 16px' : undefined,
    borderRadius: clip.style.backgroundColor ? '12px' : undefined,
    zIndex,
    pointerEvents: 'none' as const,
    maxWidth: '90%',
  };
}

function getImageClipStyle(clip: ImageClip, resolution: NormalizedProject['resolution'], zIndex: number) {
  const left = percentToPixels(clip.position.x, resolution.width);
  const top = percentToPixels(clip.position.y, resolution.height);

  return {
    position: 'absolute' as const,
    left,
    top,
    transformOrigin: 'top left',
    transform: buildTransform(clip.transform?.scale, clip.transform?.rotation),
    zIndex,
    pointerEvents: 'none' as const,
    maxWidth: resolution.width,
    maxHeight: resolution.height,
  };
}
