import React from 'react';
import { AbsoluteFill, useCurrentFrame, Img, staticFile } from 'remotion';
import { Project, Track, TextClip, ImageClip } from '@/types';

interface VideoCompositionProps {
  project: Project;
}

const ClipContent: React.FC<{ clip: TextClip | ImageClip }> = ({ clip }) => {
  const commonStyle: React.CSSProperties = {
    position: 'absolute',
    top: `${clip.position.y}%`,
    left: `${clip.position.x}%`,
    transform: `translate(-50%, -50%) scale(${clip.transform.scale}) rotate(${clip.transform.rotation}deg)`,
  };

  if (clip.type === 'text') {
    return (
      <div style={{ ...commonStyle, ...clip.style, whiteSpace: 'pre-wrap' }}>
        {clip.text}
      </div>
    );
  }

  if (clip.type === 'image') {
    const src = clip.src.startsWith('blob:')
      ? clip.src // Will likely not work in Remotion's render context, but fine for preview
      : staticFile(clip.src);

    return (
      <Img
        src={src}
        style={{
          ...commonStyle,
          width: 'auto',
          height: 'auto',
          maxWidth: '100%',
          maxHeight: '100%',
        }}
      />
    );
  }

  return null;
};

export const MainComposition: React.FC<VideoCompositionProps> = ({ project }) => {
  const frame = useCurrentFrame();
  const timeMs = (frame / project.fps) * 1000;

  const imageTracks = project.tracks.filter(t => t.type === 'image');
  const textTracks = project.tracks.filter(t => t.type === 'text');

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      {/* Render Image Tracks First (Bottom Layer) */}
      {imageTracks.map(track => (
        <React.Fragment key={track.id}>
          {track.clips.filter(c => timeMs >= c.start && timeMs < c.end).map(clip => (
            <ClipContent key={clip.id} clip={clip as ImageClip} />
          ))}
        </React.Fragment>
      ))}

      {/* Render Text Tracks Second (Top Layer) */}
      {textTracks.map(track => (
        <React.Fragment key={track.id}>
          {track.clips.filter(c => timeMs >= c.start && timeMs < c.end).map(clip => (
            <ClipContent key={clip.id} clip={clip as TextClip} />
          ))}
        </React.Fragment>
      ))}
    </AbsoluteFill>
  );
};
