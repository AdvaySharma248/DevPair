import { create } from 'zustand';
import {
  DEFAULT_CODE,
  EMPTY_CODE,
  getDefaultCode,
  isSupportedLanguage,
  type SupportedLanguage,
} from '@/lib/default-code';

export type UserRole = 'mentor' | 'student';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  createdAt?: Date | string;
  defaultLanguage?: string | null;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  timestamp: Date;
}

export interface Session {
  id: string;
  title: string;
  status: 'active' | 'scheduled' | 'ended';
  mentorId: string;
  mentorName: string;
  studentId?: string | null;
  studentName?: string | null;
  createdAt: Date;
  code?: string | null;
  language?: string | null;
  inviteCode?: string | null;
  drafts?: Partial<Record<SupportedLanguage, string>> | null;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  compileOutput: string;
  status: string;
  statusCode: number;
  time: string;
  memory: string;
  simulated?: boolean;
}

const DEFAULT_CODE_VALUES = new Set(Object.values(DEFAULT_CODE));
const FALLBACK_LANGUAGE: SupportedLanguage = 'javascript';
type SessionDraftMap = Partial<Record<SupportedLanguage, string>>;

function shouldSwapToStarterCode(code: string) {
  const trimmedCode = code.trim();

  return !trimmedCode || code === EMPTY_CODE || DEFAULT_CODE_VALUES.has(code);
}

function createInitialDrafts(language: SupportedLanguage): SessionDraftMap {
  return {
    [language]: getDefaultCode(language),
  };
}

function resolvePreferredLanguage(preferredLanguage?: string | null): SupportedLanguage {
  if (!isSupportedLanguage(preferredLanguage)) {
    return FALLBACK_LANGUAGE;
  }

  return preferredLanguage;
}

function cloneDrafts(drafts?: SessionDraftMap | null): SessionDraftMap {
  return drafts ? { ...drafts } : {};
}

function getDraftCode(drafts: SessionDraftMap, language: SupportedLanguage) {
  return drafts[language] ?? getDefaultCode(language);
}

function mergeSessionDrafts(
  session: Session,
  preferredLanguage: SupportedLanguage,
) {
  const drafts = cloneDrafts(session.drafts);

  if (isSupportedLanguage(session.language) && session.code !== null && session.code !== undefined) {
    drafts[session.language] = session.code;
  }

  const activeLanguage = resolvePreferredLanguage(session.language || preferredLanguage);

  if (!(activeLanguage in drafts)) {
    drafts[activeLanguage] =
      session.code && !shouldSwapToStarterCode(session.code)
        ? session.code
        : getDefaultCode(activeLanguage);
  }

  if (Object.keys(drafts).length === 0) {
    drafts[activeLanguage] = getDefaultCode(activeLanguage);
  }

  return {
    activeLanguage,
    drafts,
    code: getDraftCode(drafts, activeLanguage),
  };
}

function normalizeTimedSessionStatus(session: Session) {
  if (
    session.status === 'scheduled' &&
    session.createdAt.getTime() <= Date.now()
  ) {
    return {
      ...session,
      status: 'active' as const,
    };
  }

  return session;
}

interface MentorshipState {
  // Auth state
  user: User | null;
  isAuthenticated: boolean;
  
  // View state
  currentView: 'dashboard' | 'workspace' | 'profile';
  
  // Session state
  currentSession: Session | null;
  sessions: Session[];
  
  // Chat state
  messages: Message[];
  
  // Editor state
  code: string;
  language: SupportedLanguage;
  drafts: SessionDraftMap;
  remoteCodeSyncVersion: number;
  stdin: string;
  
  // Video state
  isMuted: boolean;
  isCameraOff: boolean;
  
  // UI state
  leftPanelCollapsed: boolean;
  chatVisible: boolean;
  videoVisible: boolean;

  // Editor state
  editorVisible: boolean;
  editorMinimized: boolean;
  editorFocused: boolean;

  // Execution state
  isRunning: boolean;
  executionResult: ExecutionResult | null;
  outputPanelOpen: boolean;

  // Actions
  setUser: (user: User | null) => void;
  logout: () => void;
  setCurrentView: (view: 'dashboard' | 'workspace' | 'profile') => void;
  setCurrentSession: (session: Session | null) => void;
  setSessions: (sessions: Session[]) => void;
  addSession: (session: Session) => void;
  updateSession: (session: Session) => void;
  activateDueSessions: () => void;
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  clearMessages: () => void;
  applyRemoteCodeUpdate: (code: string, language: string) => void;
  setCode: (code: string) => void;
  setLanguage: (language: string) => void;
  setStdin: (stdin: string) => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleLeftPanel: () => void;
  toggleChat: () => void;
  toggleVideo: () => void;
  // Editor actions
  closeEditor: () => void;
  minimizeEditor: () => void;
  focusEditor: () => void;
  restoreEditor: () => void;
  toggleEditorFocus: () => void;
  endSession: () => void;
  joinSession: (session: Session) => void;
  leaveSession: () => void;
  // Execution actions
  setIsRunning: (running: boolean) => void;
  setExecutionResult: (result: ExecutionResult | null) => void;
  clearExecutionResult: () => void;
  toggleOutputPanel: () => void;
}

export const useMentorshipStore = create<MentorshipState>((set) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  currentView: 'dashboard',
  currentSession: null,
  sessions: [],
  messages: [],
  code: getDefaultCode(FALLBACK_LANGUAGE),
  language: FALLBACK_LANGUAGE,
  drafts: createInitialDrafts(FALLBACK_LANGUAGE),
  remoteCodeSyncVersion: 0,
  stdin: '',
  isMuted: true,
  isCameraOff: true,
  leftPanelCollapsed: false,
  chatVisible: true,
  videoVisible: true,
  // Editor state
  editorVisible: true,
  editorMinimized: false,
  editorFocused: false,

  // Execution state
  isRunning: false,
  executionResult: null,
  outputPanelOpen: true,

  // Actions
  setUser: (user) => set((state) => {
    const preferredLanguage = resolvePreferredLanguage(user?.defaultLanguage);

    if (state.currentSession) {
      return {
        user,
        isAuthenticated: !!user,
      };
    }

    const drafts = cloneDrafts(state.drafts);

    if (!(preferredLanguage in drafts) || shouldSwapToStarterCode(drafts[preferredLanguage] ?? '')) {
      drafts[preferredLanguage] = getDefaultCode(preferredLanguage);
    }

    return {
      user,
      isAuthenticated: !!user,
      drafts,
      language: preferredLanguage,
      code: drafts[preferredLanguage] ?? getDefaultCode(preferredLanguage),
    };
  }),
  
  logout: () => {
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mentorship_user');
      sessionStorage.clear();
    }
    
    // Reset all state
    set({
      user: null,
      isAuthenticated: false,
      currentView: 'dashboard',
      currentSession: null,
      sessions: [],
      messages: [],
      chatVisible: true,
      videoVisible: true,
      leftPanelCollapsed: false,
      editorVisible: true,
      editorMinimized: false,
      editorFocused: false,
      drafts: createInitialDrafts(FALLBACK_LANGUAGE),
      code: getDefaultCode(FALLBACK_LANGUAGE),
      language: FALLBACK_LANGUAGE,
      remoteCodeSyncVersion: 0,
      stdin: '',
      isMuted: true,
      isCameraOff: true,
      executionResult: null,
      isRunning: false,
      outputPanelOpen: true,
    });
  },
  
  setCurrentView: (view) => set({ currentView: view }),
  
  setCurrentSession: (session) => set({ 
    currentSession: session ? normalizeTimedSessionStatus(session) : null,
  }),
  
  setSessions: (sessions) => set({ 
    sessions: sessions.map(normalizeTimedSessionStatus),
  }),
  
  addSession: (session) => set((state) => ({ 
    sessions: [normalizeTimedSessionStatus(session), ...state.sessions] 
  })),

  updateSession: (session) => set((state) => {
    const sessions = state.sessions
      .map((existingSession) =>
        existingSession.id === session.id
          ? normalizeTimedSessionStatus(session)
          : normalizeTimedSessionStatus(existingSession),
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return {
      sessions,
      currentSession:
        state.currentSession?.id === session.id
          ? normalizeTimedSessionStatus({
              ...state.currentSession,
              ...session,
              drafts: session.drafts ?? state.currentSession.drafts ?? null,
            })
          : state.currentSession
            ? normalizeTimedSessionStatus(state.currentSession)
            : state.currentSession,
    };
  }),

  activateDueSessions: () => set((state) => ({
    sessions: state.sessions.map(normalizeTimedSessionStatus),
    currentSession: state.currentSession
      ? normalizeTimedSessionStatus(state.currentSession)
      : null,
  })),
  
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),

  setMessages: (messages) => set({ messages }),
  
  clearMessages: () => set({ messages: [] }),

  applyRemoteCodeUpdate: (code, language) =>
    set((state) => {
      const nextLanguage = resolvePreferredLanguage(language);

      if (state.code === code && state.language === nextLanguage) {
        return state;
      }

      const drafts = {
        ...state.drafts,
        [nextLanguage]: code,
      };

      return {
        code,
        language: nextLanguage,
        drafts,
        remoteCodeSyncVersion: state.remoteCodeSyncVersion + 1,
        currentSession: state.currentSession
          ? {
              ...state.currentSession,
              code,
              language: nextLanguage,
              drafts,
            }
          : state.currentSession,
      };
    }),
  
  setCode: (code) =>
    set((state) => {
      const drafts = {
        ...state.drafts,
        [state.language]: code,
      };

      return {
        code,
        drafts,
        currentSession: state.currentSession
          ? {
              ...state.currentSession,
              code,
              language: state.language,
              drafts,
            }
          : state.currentSession,
      };
    }),
  
  setLanguage: (language) =>
    set((state) => {
      const nextLanguage = resolvePreferredLanguage(language);
      const drafts = cloneDrafts(state.drafts);

      if (!(nextLanguage in drafts)) {
        drafts[nextLanguage] = getDefaultCode(nextLanguage);
      }

      const nextCode = getDraftCode(drafts, nextLanguage);

      return {
        language: nextLanguage,
        code: nextCode,
        drafts,
        currentSession: state.currentSession
          ? {
              ...state.currentSession,
              language: nextLanguage,
              code: nextCode,
              drafts,
            }
          : state.currentSession,
      };
    }),

  setStdin: (stdin) => set({ stdin }),
  
  toggleMute: () => set((state) => ({ 
    isMuted: !state.isMuted 
  })),
  
  toggleCamera: () => set((state) => ({ 
    isCameraOff: !state.isCameraOff 
  })),
  
  toggleLeftPanel: () => set((state) => ({ 
    leftPanelCollapsed: !state.leftPanelCollapsed 
  })),
  
  toggleChat: () => set((state) => ({ 
    chatVisible: !state.chatVisible 
  })),
  
  toggleVideo: () => set((state) => ({
    videoVisible: !state.videoVisible
  })),

  // Editor actions
  closeEditor: () => set({
    editorVisible: false,
    editorMinimized: false,
    editorFocused: false
  }),

  minimizeEditor: () => set({
    editorVisible: false,
    editorMinimized: true,
    editorFocused: false
  }),

  focusEditor: () => set({
    editorVisible: true,
    editorMinimized: false,
    editorFocused: true,
    chatVisible: false,
    videoVisible: false,
  }),

  restoreEditor: () => set({
    editorVisible: true,
    editorMinimized: false,
    editorFocused: false,
  }),

  toggleEditorFocus: () => set((state) => {
    if (state.editorFocused) {
      // Exit focus mode - restore previous state
      return {
        editorFocused: false,
        chatVisible: true,
        videoVisible: true,
      };
    } else {
      // Enter focus mode
      return {
        editorFocused: true,
        chatVisible: false,
        videoVisible: false,
      };
    }
  }),

  endSession: () => set((state) => ({
    currentSession: state.currentSession 
      ? { ...state.currentSession, status: 'ended' } 
      : null,
    sessions: state.currentSession
      ? state.sessions.map((session) =>
          session.id === state.currentSession?.id
            ? { ...session, status: 'ended' }
            : session,
        )
      : state.sessions,
  })),
  
  joinSession: (session) => set((state) => {
    const preferredLanguage = resolvePreferredLanguage(state.user?.defaultLanguage);
    const { activeLanguage, drafts, code } = mergeSessionDrafts(session, preferredLanguage);
    const normalizedSession = normalizeTimedSessionStatus({
      ...session,
      language: activeLanguage,
      code,
      drafts,
    });

    return {
      currentSession: normalizedSession,
      currentView: 'workspace',
      messages: [],
      language: activeLanguage,
      code,
      drafts,
      remoteCodeSyncVersion: 0,
      stdin: '',
      isMuted: true,
      isCameraOff: true,
      leftPanelCollapsed: false,
      chatVisible: true,
      videoVisible: true,
      editorVisible: true,
      editorMinimized: false,
      editorFocused: false,
      executionResult: null,
      isRunning: false,
      outputPanelOpen: true,
    };
  }),
  
  leaveSession: () => set((state) => {
    const preferredLanguage = resolvePreferredLanguage(state.user?.defaultLanguage);
    const drafts = createInitialDrafts(preferredLanguage);

    return {
      currentSession: null,
      currentView: 'dashboard',
      messages: [],
      language: preferredLanguage,
      code: drafts[preferredLanguage] ?? getDefaultCode(preferredLanguage),
      drafts,
      remoteCodeSyncVersion: 0,
      stdin: '',
      isMuted: true,
      isCameraOff: true,
      executionResult: null,
      isRunning: false,
      outputPanelOpen: true,
    };
  }),

  // Execution actions
  setIsRunning: (isRunning) => set((state) => ({
    isRunning,
    outputPanelOpen: isRunning ? true : state.outputPanelOpen,
  })),

  setExecutionResult: (executionResult) => set({ 
    executionResult,
    outputPanelOpen: true,
  }),

  clearExecutionResult: () => set({ 
    executionResult: null,
  }),

  toggleOutputPanel: () => set((state) => ({ 
    outputPanelOpen: !state.outputPanelOpen 
  })),
}));
