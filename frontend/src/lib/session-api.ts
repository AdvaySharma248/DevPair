import type { Message, Session } from '@/store/mentorship-store';

export interface ApiSessionRecord {
  id: string;
  title: string;
  status: Session['status'];
  mentorId: string;
  mentorName?: string | null;
  studentId?: string | null;
  studentName?: string | null;
  createdAt: string;
  code?: string | null;
  language?: string | null;
  inviteCode?: string | null;
}

export interface ApiMessageRecord {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: Message['senderRole'];
  content: string;
  timestamp: string;
}

export function mapApiSession(session: ApiSessionRecord): Session {
  return {
    id: session.id,
    title: session.title,
    status: session.status,
    mentorId: session.mentorId,
    mentorName: session.mentorName || 'Mentor',
    studentId: session.studentId ?? null,
    studentName: session.studentName ?? null,
    createdAt: new Date(session.createdAt),
    code: session.code ?? null,
    language: session.language ?? null,
    inviteCode: session.inviteCode ?? null,
  };
}

export function mapApiMessage(message: ApiMessageRecord): Message {
  return {
    id: message.id,
    senderId: message.senderId,
    senderName: message.senderName,
    senderRole: message.senderRole,
    content: message.content,
    timestamp: new Date(message.timestamp),
  };
}
