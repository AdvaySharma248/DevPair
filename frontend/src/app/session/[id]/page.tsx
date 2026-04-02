'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Link2 } from 'lucide-react';
import { AuthPage } from '@/components/mentorship/auth-page';
import { Workspace } from '@/components/mentorship/workspace';
import { Button } from '@/components/ui/button';
import { useMentorshipStore } from '@/store/mentorship-store';
import { mapApiMessage, mapApiSession } from '@/lib/session-api';
import { restoreBackendSessionFromFirebase } from '@/lib/firebase-auth';

export default function SessionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const sessionId = useMemo(() => {
    const rawId = params?.id;
    return Array.isArray(rawId) ? rawId[0] : rawId;
  }, [params]);
  const {
    user,
    isAuthenticated,
    currentSession,
    setUser,
    joinSession,
    setMessages,
    addSession,
    updateSession,
    activateDueSessions,
  } = useMentorshipStore();
  const [isHydratingUser, setIsHydratingUser] = useState(true);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const hydrateUser = async () => {
      const storedUser = localStorage.getItem('mentorship_user');

      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (isMounted) {
            setUser(parsedUser);
          }
        } catch {
          localStorage.removeItem('mentorship_user');
        }
      }

      try {
        const response = await fetch('/api/auth/me');

        if (!isMounted) {
          return;
        }

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else if (response.status === 401) {
          const restoredUser = await restoreBackendSessionFromFirebase();

          if (restoredUser) {
            setUser(restoredUser);
            return;
          }

          setUser(null);
        }
      } catch (sessionError) {
        console.error('Failed to hydrate user session:', sessionError);
      } finally {
        if (isMounted) {
          setIsHydratingUser(false);
        }
      }
    };

    hydrateUser();

    return () => {
      isMounted = false;
    };
  }, [setUser]);

  useEffect(() => {
    activateDueSessions();

    const intervalId = window.setInterval(() => {
      activateDueSessions();
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [activateDueSessions]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('mentorship_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('mentorship_user');
    }
  }, [user]);

  useEffect(() => {
    if (!sessionId) {
      setError('Session not found');
      setIsLoadingSession(false);
      return;
    }

    if (isHydratingUser) {
      return;
    }

    if (!user) {
      setIsLoadingSession(false);
      return;
    }

    let isCancelled = false;

    const loadSession = async () => {
      setIsLoadingSession(true);
      setError('');

      try {
        const sessionResponse = await fetch(`/api/session/${sessionId}`);
        const sessionData = await sessionResponse.json();

        if (!sessionResponse.ok) {
          throw new Error(sessionData.error || 'Failed to load session');
        }

        let finalSession = mapApiSession(sessionData.session);
        let finalMessages = (sessionData.messages ?? []).map(mapApiMessage);

        if (user.role === 'student' && !finalSession.studentId) {
          const joinResponse = await fetch(`/api/session/${sessionId}/join`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
          });
          const joinData = await joinResponse.json();

          if (!joinResponse.ok) {
            throw new Error(joinData.error || 'Failed to join session');
          }

          const refreshedResponse = await fetch(`/api/session/${sessionId}`);
          const refreshedData = await refreshedResponse.json();

          if (!refreshedResponse.ok) {
            throw new Error(refreshedData.error || 'Failed to refresh session');
          }

          finalSession = mapApiSession(refreshedData.session);
          finalMessages = (refreshedData.messages ?? []).map(mapApiMessage);
        }

        if (isCancelled) {
          return;
        }

        joinSession(finalSession);
        setMessages(finalMessages);

        const existingSession = useMentorshipStore
          .getState()
          .sessions.some((session) => session.id === finalSession.id);

        if (existingSession) {
          updateSession(finalSession);
        } else {
          addSession(finalSession);
        }
      } catch (loadError) {
        if (!isCancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load session');
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingSession(false);
        }
      }
    };

    loadSession();

    return () => {
      isCancelled = true;
    };
  }, [
    addSession,
    isHydratingUser,
    joinSession,
    sessionId,
    setMessages,
    updateSession,
    user,
  ]);

  if (isHydratingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading session...
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <AuthPage />;
  }

  if (currentSession?.id === sessionId) {
    return <Workspace />;
  }

  if (isLoadingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Opening invite link...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
          <Link2 className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-lg font-semibold text-foreground">Invite link unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error || 'We could not open this session link.'}
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Button
            variant="outline"
            className="border-border text-muted-foreground hover:text-foreground"
            onClick={() => router.push('/')}
          >
            Go to dashboard
          </Button>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => router.refresh()}
          >
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
