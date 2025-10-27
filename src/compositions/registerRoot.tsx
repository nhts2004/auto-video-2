import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { VideoComposition, normalizeProject } from './VideoComposition';

type CompositionProps = {
  project?: Parameters<typeof normalizeProject>[0];
};

const FALLBACK_PROJECT = normalizeProject(null);

const FALLBACK_METADATA = deriveMetadata(null);

const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="MainComposition"
      component={VideoComposition}
      durationInFrames={FALLBACK_METADATA.durationInFrames}
      fps={FALLBACK_METADATA.fps}
      width={FALLBACK_METADATA.width}
      height={FALLBACK_METADATA.height}
      defaultProps={{ project: FALLBACK_PROJECT }}
      calculateMetadata={({ props }: { props: CompositionProps }) => deriveMetadata(props.project)}
    />
  );
};

registerRoot(RemotionRoot);

function deriveMetadata(project: CompositionProps['project']) {
  const normalized = normalizeProject(project);
  const { fps, resolution, duration } = normalized;
  const durationInFrames = Math.max(1, Math.ceil((duration / 1000) * fps));

  return {
    durationInFrames,
    fps,
    width: resolution.width,
    height: resolution.height,
    props: { project: normalized },
  };
}
