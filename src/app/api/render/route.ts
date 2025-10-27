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

    // Validate request
    if (!project || !options) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    console.log('Render request received:', { project: project.name, options });

    // Execute server-side rendering pipeline
    const outputPath = await renderVideoServerSide(project, options);
    const filename = path.basename(outputPath);

    return NextResponse.json({
      success: true,
      message: 'Render completed successfully',
      downloadUrl: `/api/download/${filename}`
    });

  } catch (error) {
    console.error('Render error:', error);
    return NextResponse.json({ 
      error: 'Render failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// Alternative: Move renderVideo function here (server-side only)
async function renderVideoServerSide(project: any, options: any) {
  try {
    // Step 1: Bundle Remotion composition
    console.log('Bundling Remotion composition...');
    const bundleLocation = await bundle({
      entryPoint: path.resolve('./src/compositions/registerRoot.tsx'),
      webpackOverride: (config) => config,
    });

    // Step 2: Select composition
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'MainComposition',
      inputProps: { project },
    });

    // Step 3: Render frames with Remotion
    console.log('Rendering frames with Remotion...');
    const tempDir = path.join(process.cwd(), 'temp-frames');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const framePattern = path.join(tempDir, 'frame-%d.png');

    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      outputLocation: framePattern,
      imageFormat: 'png',
      scale: 1,
      inputProps: { project },
    });
    

    // Step 4: Encode with FFmpeg
    console.log('Encoding with FFmpeg...');
    const timestamp = Date.now();
    const outputPath = path.join(process.cwd(), 'export', `video_${timestamp}.${options.format}`);
    
    // Ensure export directory exists
    const exportDir = path.join(process.cwd(), 'export');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const finalOutputPath = await encodeWithFFmpeg({
      framePattern,
      outputPath,
      format: options.format,
      settings: options.settings,
      includeAudio: options.includeAudio,
      audioPath: project.audioFile,
      project
    });

    // Cleanup temp files
    console.log('Cleaning up temporary files...');
    await cleanupTempFiles(tempDir);

    return finalOutputPath;

  } catch (error) {
    console.error('Render error:', error);
    throw error;
  }
}

async function encodeWithFFmpeg(options: {
  framePattern: string;
  outputPath: string;
  format: 'mp4' | 'mov';
  settings: any;
  includeAudio: boolean;
  audioPath?: string;
  project: any;
}): Promise<string> {
  const {
    framePattern,
    outputPath,
    format,
    settings,
    includeAudio,
    audioPath,
    project
  } = options;

  return new Promise((resolve, reject) => {
    const ffmpegPath = ffmpegStatic as string;
    
    // Build FFmpeg command
    const args = [
      '-y', // Overwrite output file
      '-framerate', settings.fps.toString(),
      '-i', framePattern,
    ];

    // Add audio if provided
    if (includeAudio && audioPath && fs.existsSync(audioPath)) {
      args.push('-i', audioPath);
    }

    // Video encoding settings
    args.push(
      '-c:v', 'libx264',
      '-pix_fmt', settings.pixelFormat,
      '-profile:v', settings.profile,
      '-crf', settings.crf.toString(),
      '-preset', 'medium',
      '-movflags', '+faststart'
    );

    // Audio settings
    if (includeAudio && audioPath) {
      args.push(
        '-c:a', 'aac',
        '-b:a', '128k',
        '-shortest' // End when shortest input ends
      );
    }

    // Output file
    args.push(outputPath);

    console.log('FFmpeg command:', ffmpegPath, args.join(' '));

    const ffmpeg = spawn(ffmpegPath, args);

    let errorOutput = '';

    ffmpeg.stderr.on('data', (data) => {
      const output = data.toString();
      errorOutput += output;
      
      // Parse progress from FFmpeg output
      const progressMatch = output.match(/frame=\s*(\d+)/);
      if (progressMatch) {
        const frame = parseInt(progressMatch[1]);
        const totalFrames = Math.ceil((project.duration / 1000) * settings.fps);
        const progress = Math.min(100, (frame / totalFrames) * 100);
        
        console.log(`Progress: ${progress.toFixed(1)}%`);
      }
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        console.log('FFmpeg encoding completed successfully');
        resolve(outputPath);
      } else {
        console.error('FFmpeg encoding failed:', errorOutput);
        reject(new Error(`FFmpeg failed with code ${code}: ${errorOutput}`));
      }
    });

    ffmpeg.on('error', (error) => {
      console.error('FFmpeg spawn error:', error);
      reject(error);
    });
  });
}

async function cleanupTempFiles(tempDir: string): Promise<void> {
  try {
    const files = fs.readdirSync(tempDir);
    for (const file of files) {
      fs.unlinkSync(path.join(tempDir, file));
    }
    fs.rmdirSync(tempDir);
  } catch (error) {
    console.warn('Failed to cleanup temp files:', error);
  }
}
