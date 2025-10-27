import { NextRequest, NextResponse } from 'next/server';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { spawn } from 'child_process';
import path from 'path';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs';

export async function POST(request: NextRequest) {
  try {
    const { project, options } = await request.json();

    if (!project || !options) {
      return NextResponse.json({ error: 'Invalid request data', details: 'Project or options missing.' }, { status: 400 });
    }

    console.log('Render request received for project:', project.name);
    const outputPath = await renderVideoServerSide(project, options);
    const filename = path.basename(outputPath);

    return NextResponse.json({
      success: true,
      message: 'Render completed successfully',
      downloadUrl: `/api/download/${filename}`
    });

  } catch (error) {
    console.error('[API_ERROR] Full error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during render.';
    return NextResponse.json({
      error: 'Render failed',
      details: errorMessage
    }, { status: 500 });
  }
}

async function renderVideoServerSide(project: any, options: any) {
  let bundleLocation: string | null = null;
  let tempDir: string | null = null;

  try {
    // Step 1: Bundle Remotion composition
    try {
      console.log('Step 1/4: Bundling Remotion composition...');
      bundleLocation = await bundle({
        entryPoint: path.resolve('./src/compositions/registerRoot.tsx'),
        webpackOverride: (config) => config,
      });
      console.log('Bundling complete.');
    } catch (err) {
      throw new Error(`Remotion bundling failed: ${(err as Error).message}`);
    }

    // Step 2: Select composition
    let composition;
    try {
      console.log('Step 2/4: Selecting composition...');
      composition = await selectComposition({
        serveUrl: bundleLocation,
        id: 'MainComposition',
        inputProps: { project },
      });
      console.log('Composition selected.');
    } catch (err) {
      throw new Error(`Failed to select Remotion composition: ${(err as Error).message}`);
    }

    // Step 3: Render frames with Remotion
    tempDir = path.join(process.cwd(), 'temp-frames', `render-${Date.now()}`);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const framePattern = path.join(tempDir, 'frame-%d.png');

    try {
      console.log('Step 3/4: Rendering frames with Remotion...');
      await renderMedia({
        composition,
        serveUrl: bundleLocation,
        outputLocation: framePattern,
        imageFormat: 'png',
        scale: 1,
        inputProps: { project },
      });
      console.log('Frame rendering complete.');
    } catch (err) {
      throw new Error(`Remotion 'renderMedia' failed: ${(err as Error).message}`);
    }

    // Step 4: Encode with FFmpeg
    const exportDir = path.join(process.cwd(), 'export');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    const outputPath = path.join(exportDir, `video_${Date.now()}.${options.format}`);

    try {
      console.log('Step 4/4: Encoding with FFmpeg...');
      const finalOutputPath = await encodeWithFFmpeg({
        framePattern,
        outputPath,
        format: options.format,
        settings: options.settings,
        includeAudio: options.includeAudio,
        audioPath: project.audioFile, // This is still a blob URL, may fail.
        project
      });
      console.log('FFmpeg encoding complete.');
      return finalOutputPath;
    } catch (err) {
      throw new Error(`FFmpeg encoding failed: ${(err as Error).message}`);
    }
  } finally {
    // Cleanup temp files
    if (tempDir && fs.existsSync(tempDir)) {
      console.log('Cleaning up temporary files...');
      await cleanupTempFiles(tempDir);
    }
  }
}

async function encodeWithFFmpeg(options: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const { framePattern, outputPath, settings, includeAudio, audioPath, project } = options;
    const ffmpegPath = ffmpegStatic as string;

    const args = [
      '-y',
      '-framerate', settings.fps.toString(),
      '-i', framePattern,
    ];

    // NOTE: audioPath is likely a blob: URL and will not work on the server.
    // This part of the logic needs a more robust solution like uploading the audio file.
    // For now, we proceed assuming it might be a local path for debugging.
    if (includeAudio && audioPath) {
      // A simple check to see if it's a blob URL
      if (audioPath.startsWith('blob:')) {
        console.warn(`Audio path is a blob URL ('${audioPath}'), which is inaccessible to the server. Skipping audio.`);
      } else if (fs.existsSync(audioPath)) {
        args.push('-i', audioPath);
      } else {
        console.warn(`Audio file not found at path: ${audioPath}. Skipping audio.`);
      }
    }

    args.push(
      '-c:v', 'libx24',
      '-pix_fmt', settings.pixelFormat || 'yuv420p',
      '-profile:v', settings.profile || 'high',
      '-crf', (settings.crf || 18).toString(),
      '-preset', 'medium',
      '-movflags', '+faststart'
    );

    if (includeAudio && audioPath && !audioPath.startsWith('blob:')) {
      args.push('-c:a', 'aac', '-b:a', '128k', '-shortest');
    }

    args.push(outputPath);

    console.log('Executing FFmpeg command:', ffmpegPath, args.join(' '));

    const ffmpeg = spawn(ffmpegPath, args);
    let errorOutput = '';
    ffmpeg.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve(outputPath);
      } else {
        reject(new Error(`FFmpeg process exited with code ${code}. Stderr: ${errorOutput}`));
      }
    });

    ffmpeg.on('error', (err) => {
      reject(new Error(`Failed to spawn FFmpeg process: ${err.message}`));
    });
  });
}

async function cleanupTempFiles(tempDir: string): Promise<void> {
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log(`Cleaned up directory: ${tempDir}`);
  } catch (error) {
    console.warn('Failed to cleanup temp files:', error);
  }
}
