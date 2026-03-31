'use client';

import { io, type Socket } from 'socket.io-client';

interface ApiMessagePayload {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'mentor' | 'student';
  content: string;
  timestamp: string;
}

interface CodeUpdatePayload {
  code: string;
  language: string;
}

interface WebRtcReadyPayload {
  sessionId: string;
  readyUserId: string;
  readyUserRole: 'mentor' | 'student';
}

interface WebRtcSessionDescriptionPayload {
  type?: RTCSdpType | string;
  sdp?: string;
}

interface WebRtcIceCandidatePayload {
  candidate?: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string | null;
}

interface PresenceEventPayload {
  sessionId: string;
  userId: string;
  userName: string;
  userRole: 'mentor' | 'student';
  online: boolean;
  onlineCount: number;
}

interface JoinSessionAck {
  ok?: true;
  sessionId?: string;
  room?: string;
  onlineUserIds?: string[];
  error?: string;
}

interface SendMessageAck {
  ok?: true;
  messageId?: string;
  sessionId?: string;
  error?: string;
}

interface ClientToServerEvents {
  'join-session': (
    payload: { sessionId: string },
    acknowledge?: (response: JoinSessionAck) => void,
  ) => void;
  'send-message': (
    payload: { sessionId: string; content: string },
    acknowledge?: (response: SendMessageAck) => void,
  ) => void;
  'code-change': (
    payload: { sessionId: string; code: string; language: string },
  ) => void;
  'webrtc-ready': (payload: { sessionId: string }) => void;
  'webrtc-offer': (
    payload: { sessionId: string; offer: WebRtcSessionDescriptionPayload },
  ) => void;
  'webrtc-answer': (
    payload: { sessionId: string; answer: WebRtcSessionDescriptionPayload },
  ) => void;
  'webrtc-ice-candidate': (
    payload: { sessionId: string; candidate: WebRtcIceCandidatePayload },
  ) => void;
  'typing-start': (payload: { sessionId: string }) => void;
  'typing-stop': (payload: { sessionId: string }) => void;
}

interface ServerToClientEvents {
  'receive-message': (message: ApiMessagePayload) => void;
  'code-update': (payload: CodeUpdatePayload) => void;
  'webrtc-ready': (payload: WebRtcReadyPayload) => void;
  'webrtc-offer': (
    payload: { sessionId: string; offer: WebRtcSessionDescriptionPayload },
  ) => void;
  'webrtc-answer': (
    payload: { sessionId: string; answer: WebRtcSessionDescriptionPayload },
  ) => void;
  'webrtc-ice-candidate': (
    payload: { sessionId: string; candidate: WebRtcIceCandidatePayload },
  ) => void;
  'user-joined': (payload: PresenceEventPayload) => void;
  'user-left': (payload: PresenceEventPayload) => void;
  'typing-start': (payload: { sessionId: string; userName: string }) => void;
  'typing-stop': (payload: { sessionId: string; userName: string }) => void;
}

type DevPairClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socketInstance: DevPairClientSocket | null = null;

function getSocketServerUrl() {
  return process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000';
}

export function getDevPairSocket() {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!socketInstance) {
    socketInstance = io(getSocketServerUrl(), {
      withCredentials: true,
      autoConnect: false,
      transports: ['websocket', 'polling'],
    }) as DevPairClientSocket;
  }

  return socketInstance;
}

export function connectDevPairSocket() {
  const socket = getDevPairSocket();

  if (!socket) {
    return null;
  }

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function disconnectDevPairSocket() {
  if (socketInstance?.connected) {
    socketInstance.disconnect();
  }
}

export function joinRealtimeSession(sessionId: string) {
  const socket = connectDevPairSocket();

  if (!socket) {
    return Promise.reject(new Error('Realtime socket unavailable'));
  }

  return new Promise<JoinSessionAck>((resolve, reject) => {
    socket.emit('join-session', { sessionId }, (response) => {
      if (response?.error) {
        reject(new Error(response.error));
        return;
      }

      resolve(response);
    });
  });
}

export function sendRealtimeMessage(sessionId: string, content: string) {
  const socket = connectDevPairSocket();

  if (!socket) {
    return Promise.reject(new Error('Realtime socket unavailable'));
  }

  return new Promise<SendMessageAck>((resolve, reject) => {
    socket.emit('send-message', { sessionId, content }, (response) => {
      if (response?.error) {
        reject(new Error(response.error));
        return;
      }

      resolve(response);
    });
  });
}

export function emitRealtimeCodeChange(sessionId: string, code: string, language: string) {
  const socket = connectDevPairSocket();

  if (!socket) {
    return;
  }

  socket.emit('code-change', {
    sessionId,
    code,
    language,
  });
}

export function emitTypingStart(sessionId: string) {
  const socket = connectDevPairSocket();

  if (!socket) {
    return;
  }

  socket.emit('typing-start', { sessionId });
}

export function emitTypingStop(sessionId: string) {
  const socket = connectDevPairSocket();

  if (!socket) {
    return;
  }

  socket.emit('typing-stop', { sessionId });
}

export function emitWebRtcReady(sessionId: string) {
  const socket = connectDevPairSocket();

  if (!socket) {
    return;
  }

  socket.emit('webrtc-ready', { sessionId });
}

export function emitWebRtcOffer(
  sessionId: string,
  offer: RTCSessionDescriptionInit,
) {
  const socket = connectDevPairSocket();

  if (!socket) {
    return;
  }

  socket.emit('webrtc-offer', {
    sessionId,
    offer: {
      type: offer.type,
      sdp: offer.sdp,
    },
  });
}

export function emitWebRtcAnswer(
  sessionId: string,
  answer: RTCSessionDescriptionInit,
) {
  const socket = connectDevPairSocket();

  if (!socket) {
    return;
  }

  socket.emit('webrtc-answer', {
    sessionId,
    answer: {
      type: answer.type,
      sdp: answer.sdp,
    },
  });
}

export function emitWebRtcIceCandidate(
  sessionId: string,
  candidate: RTCIceCandidateInit,
) {
  const socket = connectDevPairSocket();

  if (!socket) {
    return;
  }

  socket.emit('webrtc-ice-candidate', {
    sessionId,
    candidate,
  });
}
