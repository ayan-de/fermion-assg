// Media constraint presets
export const mediaConstraints = {
  // High quality for streaming
  hd: {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 },
      facingMode: 'user',
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 44100,
      channelCount: 2,
    },
  },

  // Standard quality
  sd: {
    video: {
      width: { ideal: 640 },
      height: { ideal: 480 },
      frameRate: { ideal: 24 },
      facingMode: 'user',
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  },
};

// Check if browser supports required features
export const checkBrowserSupport = () => {
  const support = {
    getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    webRTC: !!(window.RTCPeerConnection || window.webkitRTCPeerConnection),
    webSockets: !!window.WebSocket,
  };

  return {
    ...support,
    isSupported: Object.values(support).every(Boolean),
  };
};

// Get available media devices
export const getMediaDevices = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    
    return {
      videoDevices: devices.filter(device => device.kind === 'videoinput'),
      audioDevices: devices.filter(device => device.kind === 'audioinput'),
      audioOutputDevices: devices.filter(device => device.kind === 'audiooutput'),
    };
  } catch (error) {
    console.error('Error getting media devices:', error);
    return {
      videoDevices: [],
      audioDevices: [],
      audioOutputDevices: [],
    };
  }
};

// Request permissions for camera and microphone
export const requestMediaPermissions = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    
    // Stop the stream immediately as we just wanted to request permissions
    stream.getTracks().forEach(track => track.stop());
    
    return true;
  } catch (error) {
    console.warn('Media permissions denied:', error);
    return false;
  }
};