import { registerRoot } from 'remotion';
import React from 'react';
import { Composition } from 'remotion';
import { VideoComposition } from './VideoComposition';

const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="MainComposition"
      component={VideoComposition as any}
      durationInFrames={3000}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{ project: null }}
    />
  );
};

registerRoot(RemotionRoot);


