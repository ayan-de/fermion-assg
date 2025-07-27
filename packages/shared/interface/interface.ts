import { 
  Transport, 
  Producer, 
  Consumer, 
  PlainTransport 
} from '../../../node_modules/mediasoup/node/lib/types';

import { FFmpegProcess } from '../../../apps/api/src/utils/ffmpeg';
// Data structures to manage rooms and participants
export interface Participant {
  id: string;
  transport?: Transport;
  producer?: Producer;
  consumers: Map<string, Consumer>;
}

export interface Room {
  id: string;
  participants: Map<string, Participant>;
  plainTransport?: PlainTransport;
  ffmpegProcess?: FFmpegProcess;
}