import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export class FFmpegProcess {
  private process: ChildProcess | null = null;
  private outputPath: string;

  constructor(outputPath: string) {
    this.outputPath = outputPath;
  }

  // Start FFmpeg process for HLS streaming
  start(rtpPort: number): Promise<void> {
    return new Promise((resolve, reject) => {
      // Ensure output directory exists
      const outputDir = path.dirname(this.outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // FFmpeg command to convert RTP stream to HLS (not tested yet)
      const ffmpegArgs = [
        '-f', 'rtp',
        '-i', `rtp://127.0.0.1:${rtpPort}`,
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-tune', 'zerolatency',
        '-profile:v', 'baseline',
        '-level', '3.0',
        '-s', '1280x720',
        '-r', '30',
        '-g', '60',
        '-sc_threshold', '0',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-ac', '2',
        '-ar', '44100',
        '-f', 'hls',
        '-hls_time', '2',
        '-hls_list_size', '10',
        '-hls_flags', 'delete_segments',
        '-hls_allow_cache', '0',
        this.outputPath
      ];

      console.log('Starting FFmpeg with args:', ffmpegArgs.join(' '));

      // Spawn FFmpeg process
      this.process = spawn('ffmpeg', ffmpegArgs);

      // Handle FFmpeg events
      this.process.on('error', (error) => {
        console.error('FFmpeg process error:', error);
        reject(error);
      });

      this.process.stderr?.on('data', (data) => {
        console.log('FFmpeg stderr:', data.toString());
      });

      this.process.on('close', (code) => {
        console.log(`FFmpeg process exited with code ${code}`);
      });

      // Consider FFmpeg started after a short delay
      setTimeout(() => {
        resolve();
      }, 2000);
    });
  }

  // Stop FFmpeg process
  stop(): void {
    if (this.process) {
      this.process.kill('SIGTERM');
      this.process = null;
    }
  }
}