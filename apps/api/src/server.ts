import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { mediasoupWorker } from './mediasoup/worker';
import { FFmpegProcess } from './utils/ffmpeg';
import { 
  Transport, 
  Producer, 
  Consumer, 
  PlainTransport 
} from 'mediasoup/node/lib/types';
import * as path from 'path';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:3000", // my frontend URL
    methods: ["GET", "POST"]
  }
});

// Data structures to manage rooms and participants
interface Participant {
  id: string;
  transport?: Transport;
  producer?: Producer;
  consumers: Map<string, Consumer>;
}

interface Room {
  id: string;
  participants: Map<string, Participant>;
  plainTransport?: PlainTransport;
  ffmpegProcess?: FFmpegProcess;
}

const rooms = new Map<string, Room>();

// Serve static HLS files
app.use('/hls', express.static(path.join(__dirname, '../hls')));

// Initialize mediasoup
async function initializeMediasoup() {
  try {
    await mediasoupWorker.init();
    console.log('Mediasoup initialized successfully');
  } catch (error) {
    console.error('Failed to initialize mediasoup:', error);
    process.exit(1);
  }
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join room for streaming
  socket.on('join-room', async (roomId: string) => {
    try {
      socket.join(roomId);
      
      // Create room if it doesn't exist
      if (!rooms.has(roomId)) {
        const room: Room = {
          id: roomId,
          participants: new Map(),
        };
        rooms.set(roomId, room);
        
        // Start HLS streaming for this room
        await setupHLSStreaming(room);
      }

      const room = rooms.get(roomId)!;
      
      // Add participant to room
      const participant: Participant = {
        id: socket.id,
        consumers: new Map(),
      };
      room.participants.set(socket.id, participant);

      // Send router capabilities to client
      const router = mediasoupWorker.getRouter();
      socket.emit('router-capabilities', router.rtpCapabilities);

      console.log(`Client ${socket.id} joined room ${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Create WebRTC transport
  socket.on('create-transport', async (data: { roomId: string, direction: 'send' | 'recv' }) => {
    try {
      const { roomId, direction } = data;
      const room = rooms.get(roomId);
      
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      const router = mediasoupWorker.getRouter();
      const transport = await router.createWebRtcTransport({
        listenIps: [{ ip: '0.0.0.0', announcedIp: '127.0.0.1' }],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
      });

      // Store transport reference
      const participant = room.participants.get(socket.id);
      if (participant) {
        participant.transport = transport;
      }

      // Send transport parameters to client
      socket.emit('transport-created', {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      });

      console.log(`Transport created for ${socket.id} in room ${roomId}`);
    } catch (error) {
      console.error('Error creating transport:', error);
      socket.emit('error', { message: 'Failed to create transport' });
    }
  });

  // Connect transport
  socket.on('connect-transport', async (data: { 
    roomId: string, 
    dtlsParameters: any 
  }) => {
    try {
      const { roomId, dtlsParameters } = data;
      const room = rooms.get(roomId);
      const participant = room?.participants.get(socket.id);

      if (!participant?.transport) {
        socket.emit('error', { message: 'Transport not found' });
        return;
      }

      await participant.transport.connect({ dtlsParameters });
      socket.emit('transport-connected');

      console.log(`Transport connected for ${socket.id}`);
    } catch (error) {
      console.error('Error connecting transport:', error);
      socket.emit('error', { message: 'Failed to connect transport' });
    }
  });

  // Create producer (for sending media)
  socket.on('produce', async (data: {
    roomId: string,
    kind: 'audio' | 'video',
    rtpParameters: any
  }) => {
    try {
      const { roomId, kind, rtpParameters } = data;
      const room = rooms.get(roomId);
      const participant = room?.participants.get(socket.id);

      if (!participant?.transport) {
        socket.emit('error', { message: 'Transport not found' });
        return;
      }

      const producer = await participant.transport.produce({
        kind,
        rtpParameters,
      });

      participant.producer = producer;

      // Notify other participants about new producer
      socket.to(roomId).emit('new-producer', {
        producerId: producer.id,
        participantId: socket.id,
        kind,
      });

      // Send producer to HLS streaming
      if (room?.plainTransport) {
        await createPlainTransportConsumer(room, producer);
      }

      socket.emit('producer-created', { producerId: producer.id });
      console.log(`Producer created for ${socket.id}, kind: ${kind}`);
    } catch (error) {
      console.error('Error creating producer:', error);
      socket.emit('error', { message: 'Failed to create producer' });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Clean up participant from all rooms
    rooms.forEach((room) => {
      if (room.participants.has(socket.id)) {
        const participant = room.participants.get(socket.id);
        
        // Close producer
        if (participant?.producer) {
          participant.producer.close();
        }

        // Close consumers
        participant?.consumers.forEach((consumer) => {
          consumer.close();
        });

        // Remove participant
        room.participants.delete(socket.id);

        // If room is empty, clean up HLS resources
        if (room.participants.size === 0) {
          if (room.ffmpegProcess) {
            room.ffmpegProcess.stop();
          }
          if (room.plainTransport) {
            room.plainTransport.close();
          }
          rooms.delete(room.id);
        }
      }
    });
  });
});

// Setup HLS streaming for a room
async function setupHLSStreaming(room: Room): Promise<void> {
  try {
    const router = mediasoupWorker.getRouter();
    
    // Create plain transport for FFmpeg
    const plainTransport = await router.createPlainTransport({
      listenIp: { ip: '127.0.0.1', announcedIp: '127.0.0.1' },
      rtcpMux: false,
      comedia: true,
    });

    room.plainTransport = plainTransport;

    // Setup FFmpeg process
    const hlsPath = path.join(__dirname, '../hls', `${room.id}.m3u8`);
    room.ffmpegProcess = new FFmpegProcess(hlsPath);

    console.log(`HLS streaming setup for room ${room.id}`);
  } catch (error) {
    console.error('Error setting up HLS streaming:', error);
  }
}

// Create consumer on plain transport for HLS
async function createPlainTransportConsumer(room: Room, producer: Producer): Promise<void> {
  try {
    if (!room.plainTransport) return;

    const consumer = await room.plainTransport.consume({
      producerId: producer.id,
      rtpCapabilities: mediasoupWorker.getRouter().rtpCapabilities,
      paused: false,
    });

    // Start FFmpeg with the RTP port
    if (room.ffmpegProcess && producer.kind === 'video') {
      const rtpPort = (room.plainTransport as any).tuple.localPort;
      await room.ffmpegProcess.start(rtpPort);
    }

    console.log(`Plain transport consumer created for producer ${producer.id}`);
  } catch (error) {
    console.error('Error creating plain transport consumer:', error);
  }
}

// API endpoint to get HLS playlist
app.get('/api/hls/:roomId', (req, res) => {
  const { roomId } = req.params;
  const hlsPath = `/hls/${roomId}.m3u8`;
  res.json({ hlsUrl: `http://localhost:3001${hlsPath}` });
});

// Start server
const PORT = process.env.PORT || 3001;

async function startServer() {
  await initializeMediasoup();
  
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await mediasoupWorker.close();
  process.exit(0);
});