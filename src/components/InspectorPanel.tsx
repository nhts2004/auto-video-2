'use client';

import React from 'react';
import { useProjectStore } from '@/store/projectStore';
import { TextClip, ImageClip } from '@/types';
import { colorInputValue, combineHexWithAlpha, parseColorWithAlpha } from '@/utils/color';

const FONT_OPTIONS = [
  'Arial',
  'Helvetica',
  'Inter',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Tahoma',
  'Impact',
];

type InspectorSelection = ReturnType<typeof useProjectStore>['inspectorSelection'];

export default function InspectorPanel() {
  const {
    currentProject,
    inspectorSelection,
    updateClip,
    updateTextTrackStyle,
    updateTextTrackPosition,
    fitImageClip,
    clearInspectorSelection,
  } = useProjectStore();

  const selection = inspectorSelection;

  if (!currentProject) {
    return null;
  }

  const handleTextClipChange = (
    trackId: string,
    clipId: string,
    updates: Partial<TextClip>,
  ) => {
    updateClip(trackId, clipId, updates as Partial<TextClip>);
  };

  const handleTextStyleChange = (
    trackId: string,
    clipId: string,
    updates: Partial<TextClip['style']>,
  ) => {
    updateClip(trackId, clipId, {
      style: {
        ...(findClip(trackId, clipId) as TextClip | undefined)?.style,
        ...updates,
      },
    } as Partial<TextClip>);
  };

  const handleTextPositionChange = (
    trackId: string,
    clipId: string,
    updates: Partial<TextClip['position']>,
  ) => {
    updateClip(trackId, clipId, {
      position: {
        ...(findClip(trackId, clipId) as TextClip | undefined)?.position,
        ...updates,
      },
    } as Partial<TextClip>);
  };

  const findClip = (trackId: string, clipId: string) => {
    return currentProject.tracks
      .find((track) => track.id === trackId)?.clips
      .find((clip) => clip.id === clipId);
  };

  const renderContent = () => {
    if (!selection) {
      return (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Select a clip or track to edit its properties.
        </div>
      );
    }

    if (selection.type === 'track') {
      const track = currentProject.tracks.find((t) => t.id === selection.trackId);
      if (!track) {
        return (
          <div className="text-sm text-red-500">Track not found.</div>
        );
      }

      if (track.type !== 'text') {
        return (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Track-level adjustments are currently supported for text tracks only.
          </div>
        );
      }

      const sampleClip = track.clips.find((clip) => clip.type === 'text') as TextClip | undefined;
      const style = sampleClip?.style;
      const position = sampleClip?.position;
      const trackBackgroundParsed = parseColorWithAlpha(style?.backgroundColor);

      return (
        <div className="space-y-4">
          <SectionTitle title={`Track: ${track.name}`} subtitle="Adjust all subtitles in this track." />

          <div className="space-y-3">
            <label className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Font family</label>
            <select
              value={style?.fontFamily ?? FONT_OPTIONS[0]}
              onChange={(event) => updateTextTrackStyle(track.id, { fontFamily: event.target.value })}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </div>

          <RangeField
            label={`Font size (${style?.fontSize ?? 36}px)`}
            min={12}
            max={96}
            step={1}
            value={style?.fontSize ?? 36}
            onChange={(value) => updateTextTrackStyle(track.id, { fontSize: value })}
          />

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Text color</label>
            <input
              type="color"
              value={colorInputValue(style?.color, '#ffffff')}
              onChange={(event) => updateTextTrackStyle(track.id, { color: event.target.value })}
              className="h-10 w-full cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Background</label>
            <input
              type="text"
              placeholder="rgba(0, 0, 0, 0.5)"
              value={style?.backgroundColor ?? ''}
              onChange={(event) => {
              const nextColor = event.target.value;
              if (!nextColor) {
                updateTextTrackStyle(track.id, { backgroundColor: undefined });
                return;
              }
              updateTextTrackStyle(track.id, {
                backgroundColor: combineHexWithAlpha(nextColor, trackBackgroundParsed.alphaFloat),
              });
            }}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <button
              className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
              onClick={() => updateTextTrackStyle(track.id, { backgroundColor: undefined })}
            >
              Remove background
            </button>
          </div>

          <RangeField
            label={`Horizontal position (${position?.x ?? 50}%)`}
            min={0}
            max={100}
            step={1}
            value={position?.x ?? 50}
            onChange={(value) => updateTextTrackPosition(track.id, { x: value })}
          />

          <RangeField
            label={`Vertical position (${position?.y ?? 80}%)`}
            min={0}
            max={100}
            step={1}
            value={position?.y ?? 80}
            onChange={(value) => updateTextTrackPosition(track.id, { y: value })}
          />
        </div>
      );
    }

    const track = currentProject.tracks.find((t) => t.id === selection.trackId);
    const clip = track?.clips.find((c) => c.id === selection.clipId);

    if (!track || !clip) {
      return <div className="text-sm text-red-500">Clip not found.</div>;
    }

    if (clip.type === 'text') {
      const textClip = clip as TextClip;
      return (
        <div className="space-y-4">
          <SectionTitle title="Text clip" subtitle={track.name} />

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Text content</label>
            <textarea
              value={textClip.text}
              onChange={(event) => handleTextClipChange(track.id, clip.id, { text: event.target.value })}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Font</label>
              <select
                value={textClip.style.fontFamily}
                onChange={(event) => handleTextStyleChange(track.id, clip.id, { fontFamily: event.target.value })}
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <RangeField
                label={`Font size (${textClip.style.fontSize}px)`}
                min={12}
                max={96}
                step={1}
                value={textClip.style.fontSize}
                onChange={(value) => handleTextStyleChange(track.id, clip.id, { fontSize: value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Color</label>
              <input
                type="color"
                value={colorInputValue(textClip.style.color, '#ffffff')}
                onChange={(event) => handleTextStyleChange(track.id, clip.id, { color: event.target.value })}
                className="h-10 w-full cursor-pointer"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Background</label>
              <input
                type="text"
                value={textClip.style.backgroundColor ?? ''}
                placeholder="rgba(0, 0, 0, 0.5)"
                onChange={(event) => {
                  const parsed = parseColorWithAlpha(textClip.style.backgroundColor);
                  handleTextStyleChange(track.id, clip.id, {
                    backgroundColor: event.target.value
                      ? combineHexWithAlpha(event.target.value, parsed.alphaFloat)
                      : undefined,
                  });
                }}
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          <RangeField
            label={`Scale (${textClip.transform.scale.toFixed(2)})`}
            min={0.5}
            max={3}
            step={0.05}
            value={textClip.transform.scale}
            onChange={(value) => updateClip(track.id, clip.id, {
              transform: {
                ...textClip.transform,
                scale: value,
              },
            })}
          />

          <RangeField
            label="Rotation (deg)"
            min={-180}
            max={180}
            step={1}
            value={textClip.transform.rotation}
            onChange={(value) => updateClip(track.id, clip.id, {
              transform: {
                ...textClip.transform,
                rotation: value,
              },
            })}
          />

          <RangeField
            label={`Horizontal position (${textClip.position.x}%)`}
            min={0}
            max={100}
            step={1}
            value={textClip.position.x}
            onChange={(value) => handleTextPositionChange(track.id, clip.id, { x: value })}
          />

          <RangeField
            label={`Vertical position (${textClip.position.y}%)`}
            min={0}
            max={100}
            step={1}
            value={textClip.position.y}
            onChange={(value) => handleTextPositionChange(track.id, clip.id, { y: value })}
          />
        </div>
      );
    }

    if (clip.type === 'image') {
      const imageClip = clip as ImageClip;
      return (
        <div className="space-y-4">
          <SectionTitle title="Image clip" subtitle={track.name} />

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Fit preset</label>
            <div className="grid grid-cols-2 gap-2">
              <button className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800" onClick={() => fitImageClip(track.id, clip.id, 'contain')}>
                Contain
              </button>
              <button className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800" onClick={() => fitImageClip(track.id, clip.id, 'cover')}>
                Cover
              </button>
              <button className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800" onClick={() => fitImageClip(track.id, clip.id, 'fit-width')}>
                Fit width
              </button>
              <button className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800" onClick={() => fitImageClip(track.id, clip.id, 'fit-height')}>
                Fit height
              </button>
            </div>
          </div>

          <RangeField
            label={`Scale (${imageClip.transform.scale.toFixed(2)})`}
            min={0.1}
            max={4}
            step={0.05}
            value={imageClip.transform.scale}
            onChange={(value) => updateClip(track.id, clip.id, {
              transform: {
                ...imageClip.transform,
                scale: value,
              },
            })}
          />

          <RangeField
            label="Rotation (deg)"
            min={-180}
            max={180}
            step={1}
            value={imageClip.transform.rotation}
            onChange={(value) => updateClip(track.id, clip.id, {
              transform: {
                ...imageClip.transform,
                rotation: value,
              },
            })}
          />

          <RangeField
            label={`Horizontal position (${imageClip.position.x}%)`}
            min={0}
            max={100}
            step={1}
            value={imageClip.position.x}
            onChange={(value) => updateClip(track.id, clip.id, {
              position: { ...imageClip.position, x: value },
            })}
          />

          <RangeField
            label={`Vertical position (${imageClip.position.y}%)`}
            min={0}
            max={100}
            step={1}
            value={imageClip.position.y}
            onChange={(value) => updateClip(track.id, clip.id, {
              position: { ...imageClip.position, y: value },
            })}
          />
        </div>
      );
    }

    if (clip.type === 'audio') {
      return (
        <div className="space-y-4">
          <SectionTitle title="Audio clip" subtitle={track.name} />
          <RangeField
            label={`Volume (${clip.volume.toFixed(2)})`}
            min={0}
            max={1}
            step={0.05}
            value={clip.volume}
            onChange={(value) => updateClip(track.id, clip.id, { volume: value })}
          />
        </div>
      );
    }

    return <div className="text-sm text-gray-500">Unsupported clip type.</div>;
  };

  return (
    <div className="flex h-full flex-col bg-white/80 p-4 shadow-sm dark:bg-gray-900/70">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Inspector</h3>
          {selection ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {selection.type === 'track' ? 'Track adjustments' : 'Clip adjustments'}
            </p>
          ) : null}
        </div>
        {selection && (
          <button
            onClick={clearInspectorSelection}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        {renderContent()}
      </div>
    </div>
  );
}

type RangeFieldProps = {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
};

function RangeField({ label, min, max, step, value, onChange }: RangeFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full"
      />
    </div>
  );
}

type SectionTitleProps = {
  title: string;
  subtitle?: string;
};

function SectionTitle({ title, subtitle }: SectionTitleProps) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h4>
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
      )}
    </div>
  );
}







