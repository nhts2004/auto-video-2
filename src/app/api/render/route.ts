import { NextRequest, NextResponse } from 'next/server';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import type { ExportOptions, Project, RenderSettings } from '@/types';
import path from 'path';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import { pathToFileURL } from 'url';

const EXPORT_DIR = path.join(process.cwd(), 'export');
const ASSETS_DIR = path.join(EXPORT_DIR, 'assets');
const SUPPORTED_FORMATS: SupportedFormat[] = ['mp4', 'mov'];
const MIME_EXTENSION_MAP: Record<string, string> = {
  'audio/mpeg': '.mp3',
  'audio/mp3': '.mp3',
  'audio/wav': '.wav',
  'audio/x-wav': '.wav',
  'audio/ogg': '.ogg',
  'audio/aac': '.aac',
  'audio/mp4': '.m4a',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

type SupportedFormat = Extract<ExportOptions['format'], 'mp4' | 'mov'>;
type SupportedCodec = RenderSettings['codec'];

type RenderOptions = {
  format: SupportedFormat;
  settings?: Partial<RenderSettings>;
  includeAudio?: boolean;
};

type ProjectPayload = Partial<Project> & { name?: string };

type AssetManifestEntry = {
  id: string;
  type: 'srt' | 'image' | 'audio';
  previewUrl: string | null;
  name: string;
};

type PreparedPayload = {
  project: ProjectPayload;
  options: RenderOptions;
  cleanup?: () => Promise<void>;
};

export async function POST(request: NextRequest) {
  let cleanup: (() => Promise<void>) | undefined;

  try {
    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Invalid request: expected multipart/form-data payload.' },
        { status: 400 },
      );
    }

    const formData = await request.formData();
    const prepared = await parseMultipartPayload(formData);
    cleanup = prepared.cleanup;

    const { project, options } = prepared;

    if (!project || !options || !isSupportedFormat(options.format)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    console.log('Render request received:', { project: project.name, options });

    const outputPath = await renderVideoServerSide(project, options);
    const filename = path.basename(outputPath);

    return NextResponse.json({
      success: true,
      message: 'Render completed successfully',
      downloadUrl: `/api/download/${filename}`,
    });
  } catch (error) {
    console.error('Render error:', error);
    return NextResponse.json(
      {
        error: 'Render failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  } finally {
    if (cleanup) {
      cleanup().catch((err) => console.warn('Failed to cleanup assets:', err));
    }
  }
}

async function parseMultipartPayload(formData: FormData): Promise<PreparedPayload> {
  const projectRaw = formData.get('project');
  const optionsRaw = formData.get('options');
  const manifestRaw = formData.get('manifest');

  if (typeof projectRaw !== 'string' || typeof optionsRaw !== 'string') {
    throw new Error('Invalid form data payload');
  }

  const project = JSON.parse(projectRaw) as ProjectPayload;
  const options = JSON.parse(optionsRaw) as RenderOptions;
  const manifest: AssetManifestEntry[] = Array.isArray(manifestRaw)
    ? []
    : JSON.parse(typeof manifestRaw === 'string' ? manifestRaw : '[]');

  ensureDirectory(ASSETS_DIR);

  const filesToCleanup: string[] = [];
  const assetMap: Array<{ previewUrl: string | null; fileUrl: string; type: 'image' | 'audio' }> = [];

  for (const entry of manifest) {
    if (entry.type !== 'image' && entry.type !== 'audio') {
      continue;
    }

    const formFile = formData.get(`file_${entry.id}`);
    if (!(formFile instanceof File)) {
      continue;
    }

    const arrayBuffer = await formFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const extension = deriveExtension(formFile.name, formFile.type);
    const filename = `${Date.now()}-${entry.id}${extension}`;
    const assetPath = path.join(ASSETS_DIR, filename);

    await fsPromises.writeFile(assetPath, buffer);
    filesToCleanup.push(assetPath);

    assetMap.push({
      previewUrl: entry.previewUrl,
      fileUrl: pathToFileURL(assetPath).href,
      type: entry.type,
    });
  }

  const projectCopy = typeof structuredClone === 'function'
    ? structuredClone(project)
    : JSON.parse(JSON.stringify(project));

  const replaceSrc = (src: string | undefined | null) => {
    if (!src) return src;
    const asset = assetMap.find((item) => item.previewUrl === src);
    return asset ? asset.fileUrl : src;
  };

  if (Array.isArray(projectCopy.tracks)) {
    type Track = { clips?: Array<{ type?: string; src?: string }>; [key: string]: any };

    projectCopy.tracks = projectCopy.tracks.map((track: Track) => {
      if (!Array.isArray(track.clips)) {
        return track;
      }

      return {
        ...track,
        clips: track.clips.map((clip: { type?: string; src?: string } & Record<string, any>) => {
          if (clip.type === 'image' || clip.type === 'audio') {
            return {
              ...clip,
              src: replaceSrc(clip.src),
            };
          }
          return clip;
        }),
      };
    });
  }

  if (projectCopy.audioFile) {
    projectCopy.audioFile = replaceSrc(projectCopy.audioFile) ?? projectCopy.audioFile;
  }

  const cleanup = async () => {
    await Promise.allSettled(filesToCleanup.map((filePath) => fsPromises.unlink(filePath)));
  };

  return { project: projectCopy, options, cleanup };
}

async function renderVideoServerSide(project: ProjectPayload, options: RenderOptions) {
  try {
    console.log('Bundling Remotion composition...');
    const bundleLocation = await bundle({
      entryPoint: path.resolve('./src/compositions/registerRoot.tsx'),
      webpackOverride: (config) => config,
    });

    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'MainComposition',
      inputProps: { project },
    });

    console.log('Rendering media...');

    ensureDirectory(EXPORT_DIR);

    const outputFilename = createOutputFilename(project?.name, options.format);
    const outputPath = path.join(EXPORT_DIR, outputFilename);

    const codec = resolveCodec(options.settings?.codec);
    const audioCodec = resolveAudioCodec(codec, options.includeAudio);

    await renderMedia({
      serveUrl: bundleLocation,
      codec,
      audioCodec,
      composition,
      muted: options.includeAudio === false,
      outputLocation: outputPath,
      imageFormat: 'png',
      jpegQuality: 95,
      pixelFormat: options.settings?.pixelFormat as 'yuv420p' ?? 'yuv420p',
      crf: options.settings?.crf,
      overwrite: true,
      dumpBrowserLogs: true,
      logLevel: 'info',
    });

    return outputPath;
  } catch (error) {
    console.error('Render error:', error);
    throw error;
  }
}

function ensureDirectory(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function createOutputFilename(projectName: string | undefined, format: SupportedFormat) {
  const safeName = projectName
    ? projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    : 'video';
  const timestamp = Date.now();
  return `${safeName || 'video'}-${timestamp}.${format}`;
}

function resolveCodec(requested: SupportedCodec | undefined): SupportedCodec {
  if (requested === 'h265') {
    return 'h265';
  }

  return 'h264';
}

function resolveAudioCodec(codec: SupportedCodec, includeAudio?: boolean) {
  if (!includeAudio) {
    return null;
  }

  if (codec === 'h264' || codec === 'h265') {
    return 'aac';
  }

  return 'aac';
}

function isSupportedFormat(format: unknown): format is SupportedFormat {
  return typeof format === 'string' && SUPPORTED_FORMATS.includes(format as SupportedFormat);
}

function deriveExtension(filename: string, mime: string) {
  const ext = path.extname(filename);
  if (ext) {
    return ext;
  }

  if (mime && MIME_EXTENSION_MAP[mime]) {
    return MIME_EXTENSION_MAP[mime];
  }

  if (mime.startsWith('image/')) {
    return '.' + mime.split('/')[1];
  }

  if (mime.startsWith('audio/')) {
    return '.' + mime.split('/')[1];
  }

  return '';
}

