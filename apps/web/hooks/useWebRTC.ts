import { useEffect, useState, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { Device } from 'mediasoup-client';
import { Transport, Producer } from 'mediasoup-client/lib/types';

interface UseWebRTCProps {
  socket: Socket | null;
  roomId: string;
}

export const useWebRTC = ({ socket, roomId }: UseWebRTCProps) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const deviceRef = useRef<Device | null>(null);
  const transportRef = useRef<Transport | null>(null);
  const producersRef = useRef<Map<string, Producer>>(new Map());

  // Initialize WebRTC device
  const initializeDevice = async (routerCapabilities: any) => {
    try {
      const device = new Device();
      await device.load({ routerRtpCapabilities: routerCapabilities });
      deviceRef.current = device;
      console.log('WebRTC device initialized');
    } catch (error) {
      console.error('Failed to initialize WebRTC device:', error);
    }
  };

  // Create send transport
  const createSendTransport = async () => {
    if (!socket || !deviceRef.current) return;

    return new Promise<void>((resolve, reject) => {
      // Request transport creation
      socket.emit('create-transport', { roomId, direction: 'send' });

      socket.once('transport-created', async (params: any) => {
        try {
          const transport = deviceRef.current!.createSendTransport(params);

          // Handle transport events
          transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
            try {
              socket.emit('connect-transport', { roomId, dtlsParameters });
              socket.once('transport-connected', () => callback());
            } catch (error) {
              errback(error);
            }
          });

          transport.on('produce', async (parameters, callback, errback) => {
            try {
              socket.emit('produce', {
                roomId,
                kind: parameters.kind,
                rtpParameters: parameters.rtpParameters,
              });

              socket.once('producer-created', ({ producerId }: any) => {
                callback({ id: producerId });
              });
            } catch (error) {
              errback(error);
            }
          });

          transportRef.current = transport;
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  // Start streaming
  const startStreaming = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });

      setLocalStream(stream);

      // Create send transport
      await createSendTransport();

      if (!transportRef.current) {
        throw new Error('Transport not created');
      }

      // Produce video track
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const videoProducer = await transportRef.current.produce({
          track: videoTrack,
        });
        producersRef.current.set('video', videoProducer);
      }

      // Produce audio track
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        const audioProducer = await transportRef.current.produce({
          track: audioTrack,
        });
        producersRef.current.set('audio', audioProducer);
      }

      setIsStreaming(true);
      console.log('Streaming started');
    } catch (error) {
      console.error('Failed to start streaming:', error);
    }
  };

  // Stop streaming
  const stopStreaming = () => {
    // Close producers
    producersRef.current.forEach((producer) => {
      producer.close();
    });
    producersRef.current.clear();

    // Close transport
    if (transportRef.current) {
      transportRef.current.close();
      transportRef.current = null;
    }

    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    setIsStreaming(false);
    console.log('Streaming stopped');
  };

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    // Handle router capabilities
    socket.on('router-capabilities', initializeDevice);

    return () => {
      socket.off('router-capabilities', initializeDevice);
    };
  }, [socket]);

  // Join room when socket is ready
  useEffect(() => {
    if (socket && roomId) {
      socket.emit('join-room', roomId);
    }
  }, [socket, roomId]);

  return {
    localStream,
    isStreaming,
    startStreaming,
    stopStreaming,
  };
};