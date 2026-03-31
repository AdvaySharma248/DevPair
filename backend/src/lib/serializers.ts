import type {
  Message,
  Prisma,
  Session,
  SessionStatus,
  User,
  UserRole,
} from "@prisma/client";

export type ApiUserRole = "mentor" | "student";
export type ApiSessionStatus = "active" | "scheduled" | "ended";

export interface ApiUser {
  id: string;
  email: string;
  name: string;
  role: ApiUserRole;
  avatar?: string | null;
  bio?: string | null;
  createdAt?: string;
  defaultLanguage?: string | null;
}

export interface ApiSession {
  id: string;
  title: string;
  status: ApiSessionStatus;
  mentorId: string;
  mentorName: string;
  studentId?: string | null;
  studentName?: string | null;
  createdAt: string;
  code?: string | null;
  language?: string | null;
  inviteCode?: string | null;
}

export interface ApiMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: ApiUserRole;
  content: string;
  timestamp: string;
}

export type SessionWithParticipants = Prisma.SessionGetPayload<{
  include: {
    mentor: true;
    student: true;
  };
}>;

export type MessageWithSender = Prisma.MessageGetPayload<{
  include: {
    sender: true;
  };
}>;

function normalizeRole(role: UserRole): ApiUserRole {
  return role.toLowerCase() as ApiUserRole;
}

function normalizeStatus(status: SessionStatus): ApiSessionStatus {
  return status.toLowerCase() as ApiSessionStatus;
}

export function serializeUser(user: User): ApiUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: normalizeRole(user.role),
    avatar: user.avatar ?? null,
    bio: user.bio ?? null,
    createdAt: user.createdAt.toISOString(),
    defaultLanguage: user.defaultLanguage ?? null,
  };
}

export function serializeSession(session: SessionWithParticipants | Session): ApiSession {
  const mentorName =
    "mentor" in session && session.mentor ? session.mentor.name : "Mentor";
  const studentName =
    "student" in session && session.student ? session.student.name : null;

  return {
    id: session.id,
    title: session.title,
    status: normalizeStatus(session.status),
    mentorId: session.mentorId,
    mentorName,
    studentId: session.studentId ?? null,
    studentName,
    createdAt: session.createdAt.toISOString(),
    code: session.code ?? null,
    language: session.language ?? null,
    inviteCode: "inviteCode" in session ? session.inviteCode ?? null : null,
  };
}

export function serializeMessage(message: MessageWithSender | Message): ApiMessage {
  const senderName =
    "sender" in message && message.sender ? message.sender.name : "Unknown";
  const senderRole =
    "sender" in message && message.sender
      ? normalizeRole(message.sender.role)
      : "student";

  return {
    id: message.id,
    senderId: message.senderId,
    senderName,
    senderRole,
    content: message.content,
    timestamp: message.createdAt.toISOString(),
  };
}
