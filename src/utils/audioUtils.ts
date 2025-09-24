// Audio utilities for analyzing audio files and calculating duration

export interface AudioAnalysis {
  duration: number; // milliseconds
  waveform: number[]; // normalized amplitude values
  peaks: number[]; // beat detection peaks
  sampleRate: number;
}

export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;

  constructor() {
    // Initialize AudioContext when needed
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  async analyzeAudio(audioFile: File): Promise<AudioAnalysis> {
    if (!this.audioContext) {
      throw new Error('AudioContext not available');
    }

    try {
      // Read audio file as ArrayBuffer
      const arrayBuffer = await audioFile.arrayBuffer();
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      const duration = this.audioBuffer.duration * 1000; // Convert to milliseconds
      const sampleRate = this.audioBuffer.sampleRate;
      
      // Extract waveform data
      const waveform = this.extractWaveform();
      
      // Detect beats/peaks
      const peaks = this.detectPeaks(waveform);

      return {
        duration,
        waveform,
        peaks,
        sampleRate
      };
    } catch (error) {
      console.error('Error analyzing audio:', error);
      throw new Error('Failed to analyze audio file');
    }
  }

  private extractWaveform(): number[] {
    if (!this.audioBuffer) return [];

    const channelData = this.audioBuffer.getChannelData(0); // Use first channel
    const samples = 1000; // Number of samples for waveform visualization
    const blockSize = Math.floor(channelData.length / samples);
    const waveform: number[] = [];

    for (let i = 0; i < samples; i++) {
      let sum = 0;
      const start = i * blockSize;
      const end = Math.min(start + blockSize, channelData.length);
      
      for (let j = start; j < end; j++) {
        sum += Math.abs(channelData[j]);
      }
      
      waveform.push(sum / (end - start));
    }

    return waveform;
  }

  private detectPeaks(waveform: number[]): number[] {
    const peaks: number[] = [];
    const threshold = 0.1; // Minimum amplitude for peak detection
    const minDistance = 10; // Minimum samples between peaks

    for (let i = 1; i < waveform.length - 1; i++) {
      if (
        waveform[i] > threshold &&
        waveform[i] > waveform[i - 1] &&
        waveform[i] > waveform[i + 1] &&
        (peaks.length === 0 || i - peaks[peaks.length - 1] > minDistance)
      ) {
        peaks.push(i);
      }
    }

    return peaks;
  }

  // Get audio duration without full analysis
  async getAudioDuration(audioFile: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      
      audio.addEventListener('loadedmetadata', () => {
        resolve(audio.duration * 1000); // Convert to milliseconds
      });
      
      audio.addEventListener('error', () => {
        reject(new Error('Failed to load audio file'));
      });
      
      audio.src = URL.createObjectURL(audioFile);
    });
  }

  // Create audio element for playback
  createAudioElement(src: string): HTMLAudioElement {
    const audio = new Audio(src);
    audio.crossOrigin = 'anonymous';
    return audio;
  }

  // Dispose resources
  dispose() {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}

// Utility functions for audio processing
export const audioUtils = {
  // Format duration in milliseconds to readable string
  formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  },

  // Calculate frame number from time
  timeToFrame(timeMs: number, fps: number): number {
    return Math.round((timeMs / 1000) * fps);
  },

  // Calculate time from frame number
  frameToTime(frame: number, fps: number): number {
    return (frame / fps) * 1000;
  },

  // Check if audio file format is supported
  isSupportedAudioFormat(filename: string): boolean {
    const supportedFormats = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return supportedFormats.includes(extension);
  },

  // Get audio file extension
  getAudioExtension(filename: string): string {
    return filename.toLowerCase().substring(filename.lastIndexOf('.') + 1);
  }
};

// Global audio analyzer instance
export const globalAudioAnalyzer = new AudioAnalyzer();
