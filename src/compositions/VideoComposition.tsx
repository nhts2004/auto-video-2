import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

interface VideoCompositionProps {
  project?: any;
}

export const VideoComposition: React.FC<VideoCompositionProps> = ({ project }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'white',
          fontSize: 48,
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div>Auto-Video Editor</div>
          <div style={{ fontSize: 24, marginTop: 20 }}>
            Frame: {frame} / FPS: {fps}
          </div>
          {project && (
            <div style={{ fontSize: 18, marginTop: 10 }}>
              Project: {project.name}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Main composition component
export const MainComposition: React.FC<VideoCompositionProps> = ({ project }) => {
  return (
    <AbsoluteFill>
      <VideoComposition project={project} />
    </AbsoluteFill>
  );
};
