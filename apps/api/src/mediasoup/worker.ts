import * as mediasoup from 'mediasoup';
import { config } from './config';
import { Worker, Router } from 'mediasoup/node/lib/types';

class MediasoupWorker {
  private worker: Worker | null = null;
  private router: Router | null = null;

  // Initialize mediasoup worker
  async init(): Promise<void> {
    try {
      console.log('Creating mediasoup worker...');
      
      // Create worker
      this.worker = await mediasoup.createWorker({
        rtcMinPort: config.worker.rtcMinPort,
        rtcMaxPort: config.worker.rtcMaxPort,
        logLevel: config.worker.logLevel,
        logTags: config.worker.logTags,
      });

      // Handle worker events
      this.worker.on('died', () => {
        console.error('Mediasoup worker died, exiting...');
        process.exit(1);
      });

      // Create router
      this.router = await this.worker.createRouter({
        mediaCodecs: config.router.mediaCodecs,
      });

      console.log('Mediasoup worker and router created successfully');
    } catch (error) {
      console.error('Failed to create mediasoup worker:', error);
      throw error;
    }
  }

  // Get router instance
  getRouter(): Router {
    if (!this.router) {
      throw new Error('Router not initialized');
    }
    return this.router;
  }

  // Get worker instance
  getWorker(): Worker {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }
    return this.worker;
  }

  // Close worker
  async close(): Promise<void> {
    if (this.worker) {
      this.worker.close();
    }
  }
}

export const mediasoupWorker = new MediasoupWorker();