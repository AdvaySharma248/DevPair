'use client';

import { io, type Socket } from 'socket.io-client';
import { waitForFirebaseAuthState } from './firebase';

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

export interface ExecutionResultPayload {
  stdout: string;
  stderr: string;
  compileOutput: string;
  status: string;
  statusCode: number;
  time: string;
  memory: string;
  simulated?: boolean;
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
  'execution-result': (
    payload: { sessionId: string; result: ExecutionResultPayload },
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
  'execution-result': (payload: {
    sessionId: string;
    result: ExecutionResultPayload;
  }) => void;
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
let socketConnectionPromise: Promise<DevPairClientSocket> | null = null;

const SOCKET_CONNECTION_TIMEOUT_MS = 10_000;

function getSocketServerUrl() {
  return process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000';
}

async function getSocketAuthPayload() {
  try {
    const firebaseUser = await waitForFirebaseAuthState();

    if (!firebaseUser) {
      return {};
    }

    const firebaseIdToken = await firebaseUser.getIdToken();
    return firebaseIdToken ? { firebaseIdToken } : {};
  } catch (error) {
    console.error('Failed to prepare realtime socket auth:', error);
    return {};
  }
}

function ensureSocketConnection(socket: DevPairClientSocket) {
  if (socket.connected) {
    return Promise.resolve(socket);
  }

  if (socketConnectionPromise) {
    return socketConnectionPromise;
  }

  socketConnectionPromise = new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error('Timed out connecting to realtime server'));
    }, SOCKET_CONNECTION_TIMEOUT_MS);

    const handleConnect = () => {
      cleanup();
      resolve(socket);
    };

    const handleConnectError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleConnectError);
      socketConnectionPromise = null;
    };

    socket.on('connect', handleConnect);
    socket.on('connect_error', handleConnectError);
    socket.connect();
  });

  return socketConnectionPromise;
}

export function getDevPairSocket() {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!socketInstance) {
    socketInstance = io(getSocketServerUrl(), {
      withCredentials: true,
      autoConnect: false,
      auth: (callback) => {
        void getSocketAuthPayload()
          .then((payload) => callback(payload))
          .catch(() => callback({}));
      },
      transports: ['websocket', 'polling'],
    }) as DevPairClientSocket;

    socketInstance.on('connect_error', (error) => {
      console.error('Realtime socket connection failed:', error.message);
    });
  }

  return socketInstance;
}

export function connectDevPairSocket() {
  const socket = getDevPairSocket();

  if (!socket) {
    return null;
  }

  if (!socket.connected) {
    void ensureSocketConnection(socket).catch((error) => {
      console.error('Realtime socket connection setup failed:', error);
    });
  }

  return socket;
}

export function disconnectDevPairSocket() {
  socketConnectionPromise = null;

  if (socketInstance?.connected) {
    socketInstance.disconnect();
  }
}

export async function joinRealtimeSession(sessionId: string) {
  const initialSocket = connectDevPairSocket();

  if (!initialSocket) {
    return Promise.reject(new Error('Realtime socket unavailable'));
  }

  const socket = await ensureSocketConnection(initialSocket);

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
  const initialSocket = connectDevPairSocket();

  if (!initialSocket) {
    return Promise.reject(new Error('Realtime socket unavailable'));
  }

  return ensureSocketConnection(initialSocket).then((socket) =>
    new Promise<SendMessageAck>((resolve, reject) => {
      socket.emit('send-message', { sessionId, content }, (response) => {
        if (response?.error) {
          reject(new Error(response.error));
          return;
        }

        resolve(response);
      });
    }),
  );
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

export function emitRealtimeExecutionResult(
  sessionId: string,
  result: ExecutionResultPayload,
) {
  const socket = connectDevPairSocket();

  if (!socket) {
    return;
  }

  socket.emit('execution-result', {
    sessionId,
    result,
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
