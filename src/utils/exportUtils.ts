import { Project, TextClip, ImageClip, AudioClip } from '@/types';

// Export project to JSON format
export function exportToJSON(project: Project): string {
  const exportData = {
    version: '1.0',
    name: project.name,
    duration: project.duration,
    fps: project.fps,
    resolution: project.resolution,
    aspectRatio: project.aspectRatio,
    tracks: project.tracks.map(track => ({
      ...track,
      clips: track.clips.map(clip => {
        // Remove any temporary properties
        const { trackId, ...cleanClip } = clip as any;
        return cleanClip;
      })
    })),
    audioFile: project.audioFile,
    exportedAt: new Date().toISOString(),
    exportedBy: 'Auto-Video Editor'
  };

  return JSON.stringify(exportData, null, 2);
}

// Export project to FCPXML format (Final Cut Pro)
export function exportToFCPXML(project: Project): string {
  const frameRate = project.fps || 30;
  const toFrames = (ms: number) => Math.round((ms / 1000) * frameRate);
  const toTimecode = (ms: number) => {
    const framesTotal = toFrames(ms);
    const hours = Math.floor(framesTotal / (3600 * frameRate));
    const minutes = Math.floor((framesTotal % (3600 * frameRate)) / (60 * frameRate));
    const seconds = Math.floor((framesTotal % (60 * frameRate)) / frameRate);
    const frames = framesTotal % frameRate;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.9">
  <resources>
    <format id="r1" name="FFVideoFormat${project.resolution.height}p${frameRate}" frameDuration="${1}/${frameRate}s" width="${project.resolution.width}" height="${project.resolution.height}" colorSpace="1-1-1 (Rec. 709)"/>
    <effect id="r2" name="Basic Title" uid=".../Titles.localized/Bumper:Opener.localized/Basic Title.localized/Basic Title.moti"/>
  </resources>
  <library>
    <event name="Auto-Video Event">
      <project name="${project.name}">
        <sequence format="r1" tcStart="0s" tcFormat="NDF" audioLayout="stereo" audioRate="48k">
          <spine>
            ${generateFCPXMLSpine(project, toTimecode)}
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>`;

  return xml;
}

function generateFCPXMLSpine(project: Project, formatTime: (ms: number) => string): string {
  let spine = '';
  
  // Process each track
  project.tracks.forEach((track, trackIndex) => {
    if (track.type === 'image') {
      track.clips.forEach((clip, clipIndex) => {
        if (clip.type === 'image') {
          const imageClip = clip as ImageClip;
          spine += `            <asset-clip name="${imageClip.src}" start="${formatTime(imageClip.start)}" duration="${formatTime(imageClip.end - imageClip.start)}" tcFormat="NDF">
              <video ref="r1" offset="0s" name="${imageClip.src}" start="0s" duration="${formatTime(imageClip.end - imageClip.start)}"/>
            </asset-clip>\n`;
        }
      });
    } else if (track.type === 'audio') {
      track.clips.forEach((clip, clipIndex) => {
        if (clip.type === 'audio') {
          const audioClip = clip as AudioClip;
          spine += `            <asset-clip name="Audio" start="${formatTime(audioClip.start)}" duration="${formatTime(audioClip.end - audioClip.start)}" tcFormat="NDF">
              <audio ref="r2" offset="0s" name="Audio" start="0s" duration="${formatTime(audioClip.end - audioClip.start)}"/>
            </asset-clip>\n`;
        }
      });
    }
  });

  // Add text clips as titles
  project.tracks.forEach((track) => {
    if (track.type === 'text') {
      track.clips.forEach((clip) => {
        if (clip.type === 'text') {
          const textClip = clip as TextClip;
          spine += `            <title name="Title" lane="1" offset="${formatTime(textClip.start)}" ref="r2" start="${formatTime(textClip.start)}" duration="${formatTime(textClip.end - textClip.start)}">
              <text>
                <text-style ref="ts1">${textClip.text}</text-style>
              </text>
              <text-style-def id="ts1">
                <text-style font="${textClip.style.fontFamily}" fontSize="${textClip.style.fontSize}" fontFace="Regular" fontColor="1 1 1 1"/>
              </text-style-def>
            </title>\n`;
        }
      });
    }
  });

  return spine;
}

// Export project to After Effects JSON format
export function exportToAEJSON(project: Project): string {
  const aeData = {
    "v": "5.5.2",
    "fr": project.fps,
    "ip": 0,
    "op": Math.ceil(project.duration / 1000 * project.fps),
    "w": project.resolution.width,
    "h": project.resolution.height,
    "nm": project.name,
    "ddd": 0,
    "assets": [],
    "layers": generateAELayers(project),
    "markers": []
  };

  return JSON.stringify(aeData, null, 2);
}

function generateAELayers(project: Project): any[] {
  const layers: any[] = [];
  let layerIndex = 1;

  // Add background layer
  layers.push({
    "ddd": 0,
    "ind": layerIndex++,
    "ty": 1, // Solid layer
    "nm": "Background",
    "sr": 1,
    "ks": {
      "o": { "a": 0, "k": 100 },
      "r": { "a": 0, "k": 0 },
      "p": { "a": 0, "k": [project.resolution.width / 2, project.resolution.height / 2, 0] },
      "a": { "a": 0, "k": [0, 0, 0] },
      "s": { "a": 0, "k": [100, 100, 100] }
    },
    "ao": 0,
    "sw": project.resolution.width,
    "sh": project.resolution.height,
    "sc": "#000000",
    "ip": 0,
    "op": Math.ceil(project.duration / 1000 * project.fps),
    "st": 0,
    "bm": 0
  });

  // Add image layers
  project.tracks.forEach((track) => {
    if (track.type === 'image') {
      track.clips.forEach((clip) => {
        if (clip.type === 'image') {
          const imageClip = clip as ImageClip;
          layers.push({
            "ddd": 0,
            "ind": layerIndex++,
            "ty": 2, // Image layer
            "nm": imageClip.src,
            "sr": 1,
            "ks": {
              "o": { "a": 0, "k": 100 },
              "r": { "a": 0, "k": imageClip.transform.rotation },
              "p": { "a": 0, "k": [imageClip.position.x * project.resolution.width / 100, imageClip.position.y * project.resolution.height / 100, 0] },
              "a": { "a": 0, "k": [0, 0, 0] },
              "s": { "a": 0, "k": [imageClip.transform.scale * 100, imageClip.transform.scale * 100, 100] }
            },
            "ao": 0,
            "w": project.resolution.width,
            "h": project.resolution.height,
            "ip": Math.ceil(imageClip.start / 1000 * project.fps),
            "op": Math.ceil(imageClip.end / 1000 * project.fps),
            "st": 0,
            "bm": 0
          });
        }
      });
    }
  });

  // Add text layers
  project.tracks.forEach((track) => {
    if (track.type === 'text') {
      track.clips.forEach((clip) => {
        if (clip.type === 'text') {
          const textClip = clip as TextClip;
          layers.push({
            "ddd": 0,
            "ind": layerIndex++,
            "ty": 5, // Text layer
            "nm": "Text",
            "sr": 1,
            "ks": {
              "o": { "a": 0, "k": 100 },
              "r": { "a": 0, "k": textClip.transform.rotation },
              "p": { "a": 0, "k": [textClip.position.x * project.resolution.width / 100, textClip.position.y * project.resolution.height / 100, 0] },
              "a": { "a": 0, "k": [0, 0, 0] },
              "s": { "a": 0, "k": [textClip.transform.scale * 100, textClip.transform.scale * 100, 100] }
            },
            "ao": 0,
            "t": {
              "d": {
                "k": [
                  {
                    "s": {
                      "f": textClip.style.fontFamily,
                      "s": textClip.style.fontSize,
                      "t": textClip.text,
                      "j": 2,
                      "tr": 0,
                      "lh": textClip.style.fontSize * 1.2,
                      "ls": 0,
                      "fc": [1, 1, 1]
                    },
                    "t": 0
                  }
                ]
              }
            },
            "ip": Math.ceil(textClip.start / 1000 * project.fps),
            "op": Math.ceil(textClip.end / 1000 * project.fps),
            "st": 0,
            "bm": 0
          });
        }
      });
    }
  });

  return layers;
}

// Utility function to download file
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

// Export functions for different formats
export const exportFormats = {
  json: {
    name: 'Project JSON',
    extension: '.json',
    mimeType: 'application/json',
    exportFn: exportToJSON
  },
  fcp: {
    name: 'Final Cut Pro XML',
    extension: '.fcpxml',
    mimeType: 'application/xml',
    exportFn: exportToFCPXML
  },
  ae: {
    name: 'After Effects JSON',
    extension: '.json',
    mimeType: 'application/json',
    exportFn: exportToAEJSON
  }
};
