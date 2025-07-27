// Types shared between frontend and backend
export interface PeerConnection {
  id: string;
  socketId: string;
  isStreamer: boolean;
}

export interface StreamRoom {
  id: string;
  streamers: PeerConnection[];
  viewers: string[]; // socket IDs of viewers
}

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join-room' | 'leave-room';
  data: any;
  from: string;
  to?: string;
  roomId: string;
}

export interface HLSStreamInfo {
  streamUrl: string;
  roomId: string;
  isActive: boolean;
}