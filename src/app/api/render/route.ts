import { NextRequest, NextResponse } from 'next/server';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { spawn, exec } from 'child_process';
import path from 'path';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs';

// Helper to detect available GPU encoders
let bestEncoder: string | null = null;
const detectBestEncoder = (): Promise<string> => {
  return new Promise((resolve) => {
    if (bestEncoder) return resolve(bestEncoder);

    const ffmpegPath = ffmpegStatic as string;
    exec(`${ffmpegPath} -encoders`, (error, stdout) => {
      if (error) {
        console.warn("Could not execute 'ffmpeg -encoders', defaulting to CPU.", error);
        bestEncoder = 'libx264';
        return resolve(bestEncoder);
      }

      // Prioritized list of encoders
      const encoderPriority = [
        { name: 'h264_nvenc', label: 'NVIDIA NVENC' },
        { name: 'h264_amf', label: 'AMD AMF' },
        { name: 'h264_qsv', label: 'Intel Quick Sync' }
      ];

      for (const encoder of encoderPriority) {
        if (stdout.includes(encoder.name)) {
          console.log(`GPU encoder detected: ${encoder.label}`);
          bestEncoder = encoder.name;
          return resolve(bestEncoder);
        }
      }

      console.log('No supported GPU encoder found, defaulting to CPU (libx264).');
      bestEncoder = 'libx264';
      resolve(bestEncoder);
    });
  });
};
// Detect encoder on server start
detectBestEncoder();

export async function POST(request: NextRequest) {
  try {
    const { project, options } = await request.json();
    if (!project || !options) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    const encoder = await detectBestEncoder();
    const outputPath = await renderVideoServerSide(project, options, encoder);
    const filename = path.basename(outputPath);

    return NextResponse.json({
      success: true,
      downloadUrl: `/api/download/${filename}`,
      encoderUsed: encoder
    });
  } catch (error) {
    console.error('[API_ERROR]', error);
    return NextResponse.json({ error: 'Render failed', details: (error as Error).message }, { status: 500 });
  }
}

async function renderVideoServerSide(project: any, options: any, encoder: string) {
  const tempDir = path.join(process.cwd(), 'temp-frames', `render-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    const bundleLocation = await bundle({ entryPoint: path.resolve('./src/compositions/registerRoot.tsx') });
    const composition = await selectComposition({ serveUrl: bundleLocation, id: 'MainComposition', inputProps: { project } });

    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      imageFormat: 'png',
      outputLocation: path.join(tempDir, 'frame-%d.png'),
      inputProps: { project },
    });

    const exportDir = path.join(process.cwd(), 'export');
    fs.mkdirSync(exportDir, { recursive: true });
    const outputPath = path.join(exportDir, `video_${Date.now()}.${options.format}`);

    await encodeWithFFmpeg({
      framePattern: path.join(tempDir, 'frame-%d.png'),
      outputPath,
      encoder,
      settings: options.settings,
      audioPath: project.audioFile,
      project
    });

    return outputPath;
  } finally {
    fs.rm(tempDir, { recursive: true, force: true }, () => {});
  }
}

async function encodeWithFFmpeg(options: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const { framePattern, outputPath, encoder, settings, audioPath, project } = options;
    const ffmpegPath = ffmpegStatic as string;

    const args = [
      '-y', '-framerate', settings.fps.toString(), '-i', framePattern
    ];

    if (audioPath && !audioPath.startsWith('blob:')) {
      args.push('-i', audioPath);
    }

    // Encoder settings
    args.push('-c:v', encoder);
    if (encoder === 'libx264') {
        args.push('-preset', 'medium', '-crf', '18');
    }
    args.push('-pix_fmt', 'yuv420p');


    if (audioPath && !audioPath.startsWith('blob:')) {
      args.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
    } else {
      args.push('-an'); // No audio
    }

    args.push(outputPath);

    const ffmpeg = spawn(ffmpegPath, args);
    let errorOutput = '';
    ffmpeg.stderr.on('data', (data) => { errorOutput += data.toString(); });
    ffmpeg.on('close', (code) => {
      if (code === 0) resolve(outputPath);
      else reject(new Error(`FFmpeg failed with code ${code}: ${errorOutput}`));
    });
    ffmpeg.on('error', (err) => reject(err));
  });
}
