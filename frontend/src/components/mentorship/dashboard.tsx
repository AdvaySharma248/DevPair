'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Code2,
  LogOut,
  Plus,
  Calendar,
  Users,
  Video,
  Clock,
  Play,
  Eye,
  Link2,
  Search,
  Activity,
  Circle,
  UserCheck,
  Timer,
  Sparkles,
  Copy,
  Pencil
} from 'lucide-react';
import { useMentorshipStore, Session } from '@/store/mentorship-store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';
import { mapApiSession } from '@/lib/session-api';

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toTimeInputValue(date: Date) {
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Dashboard Navbar
function DashboardNav() {
  const { user, logout, setCurrentView } = useMentorshipStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      // Small delay for UI feedback
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Call logout to clear state and localStorage
      logout();
      
      toast({
        title: 'Logged out successfully',
        type: 'success',
      });
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        title: 'Logout failed. Please try again.',
        type: 'error',
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="h-12 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <Code2 className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold text-foreground">DevPair</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Dashboard</span>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <>
            {/* Profile Button */}
            <button
              onClick={() => setCurrentView('profile')}
              className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-secondary/50 transition-colors group"
            >
              <Avatar className="h-7 w-7 border border-border group-hover:border-primary/30 transition-colors">
                <AvatarFallback className="bg-secondary text-foreground text-[11px] font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-foreground group-hover:text-primary transition-colors">{user.name}</span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-2 py-0 h-5",
                  user.role === 'mentor'
                    ? 'border-primary/40 text-primary'
                    : 'border-green-500/40 text-green-500'
                )}
              >
                {user.role === 'mentor' ? 'Mentor' : 'Student'}
              </Badge>
            </button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary/50 disabled:opacity-50"
                  >
                    {isLoggingOut ? (
                      <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <LogOut className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">{isLoggingOut ? 'Logging out...' : 'Logout'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}
      </div>
    </header>
  );
}

// Stats Section
function StatsSection() {
  const { user, sessions } = useMentorshipStore();
  
  const isMentor = user?.role === 'mentor';
  
  const stats = isMentor ? [
    { title: 'Total Sessions', value: sessions.length, icon: Calendar, color: 'text-muted-foreground' },
    { title: 'Active', value: sessions.filter(s => s.status === 'active').length, icon: Play, color: 'text-green-500' },
    { title: 'Students', value: new Set(sessions.map(s => s.studentId).filter(Boolean)).size, icon: Users, color: 'text-primary' },
    { title: 'Upcoming', value: sessions.filter(s => s.status === 'scheduled').length, icon: Clock, color: 'text-amber-500' },
  ] : [
    { title: 'Sessions Joined', value: sessions.length, icon: Calendar, color: 'text-muted-foreground' },
    { title: 'Active Now', value: sessions.filter(s => s.status === 'active').length, icon: Play, color: 'text-green-500' },
    { title: 'Mentor Assigned', value: sessions[0]?.mentorName ? 1 : 0, icon: UserCheck, color: 'text-primary' },
    { title: 'Upcoming', value: sessions.filter(s => s.status === 'scheduled').length, icon: Clock, color: 'text-amber-500' },
  ];

  return (
    <div className="flex items-stretch gap-4 px-6 py-4">
      {stats.map((stat) => (
        <div 
          key={stat.title} 
          className="flex-1 flex items-center justify-between p-4 rounded-lg bg-secondary/20 border border-border/50 hover:border-border hover:bg-secondary/30 transition-colors"
        >
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-muted-foreground">{stat.title}</span>
            <span className={cn("text-2xl font-semibold tabular-nums", stat.color)}>{stat.value}</span>
          </div>
          <stat.icon className={cn("h-5 w-5 opacity-20", stat.color)} />
        </div>
      ))}
    </div>
  );
}

// Quick Actions Toolbar
function QuickActionsToolbar() {
  const { user, sessions, addSession, updateSession } = useMentorshipStore();
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [scheduledTitle, setScheduledTitle] = useState('');
  const [scheduledDate, setScheduledDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  });
  const [scheduledTime, setScheduledTime] = useState('10:00');
  const [joinCode, setJoinCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isMentor = user?.role === 'mentor';
  const preferredLanguage = user?.defaultLanguage || 'javascript';

  const combineScheduleDateTime = () => {
    if (!scheduledDate || !scheduledTime) {
      return null;
    }

    const isoValue = new Date(`${scheduledDate}T${scheduledTime}`);

    if (Number.isNaN(isoValue.getTime())) {
      return null;
    }

    return isoValue.toISOString();
  };

  const handleCreateSession = async () => {
    if (!sessionTitle.trim() || !user) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: sessionTitle,
          mentorId: user.id,
          studentId: 'pending',
          language: preferredLanguage,
        }),
      });

      if (response.ok) {
        const { session } = await response.json();
        addSession(mapApiSession(session));
        setSessionTitle('');
        setIsCreateOpen(false);
        toast({
          title: 'Session created successfully',
          description: session.inviteCode
            ? `Invite code: ${session.inviteCode}`
            : undefined,
          type: 'success',
        });
      } else {
        const data = await response.json();
        toast({
          title: data.error || 'Failed to create session',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Failed to create session:', error);
      toast({
        title: 'Failed to create session',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleSession = async () => {
    if (!scheduledTitle.trim() || !user) return;

    const scheduledAt = combineScheduleDateTime();

    if (!scheduledAt) {
      toast({
        title: 'Please choose a valid date and time',
        type: 'error',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: scheduledTitle,
          mentorId: user.id,
          studentId: 'pending',
          language: preferredLanguage,
          status: 'scheduled',
          createdAt: scheduledAt,
        }),
      });

      if (response.ok) {
        const { session } = await response.json();
        addSession(mapApiSession(session));
        setScheduledTitle('');
        setIsScheduleOpen(false);
        toast({
          title: 'Session scheduled successfully',
          type: 'success',
        });
      } else {
        const data = await response.json();
        toast({
          title: data.error || 'Failed to schedule session',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Failed to schedule session:', error);
      toast({
        title: 'Failed to schedule session',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinSession = async () => {
    if (!joinCode.trim() || !user) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/session/join-by-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteCode: joinCode.trim().toUpperCase(),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join session');
      }

      const joinedSession = mapApiSession(data.session);

      if (sessions.some((session) => session.id === joinedSession.id)) {
        updateSession(joinedSession);
      } else {
        addSession(joinedSession);
      }

      setJoinCode('');
      setIsJoinOpen(false);
      toast({
        title: 'Joined session successfully',
        type: 'success',
      });
      router.push(`/session/${joinedSession.id}`);
    } catch (error) {
      console.error('Failed to join session:', error);
      toast({
        title: error instanceof Error ? error.message : 'Failed to join session',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4 px-6 py-4 border-y border-border bg-secondary/10">
      <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Quick Actions</span>
      
      <div className="h-4 w-px bg-border" />
      
      {isMentor ? (
        <div className="flex items-center gap-3">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="h-8 bg-primary text-primary-foreground hover:bg-primary/90 text-xs px-4"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Create Session
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-foreground text-sm">Create New Session</DialogTitle>
                <DialogDescription className="text-muted-foreground text-xs">
                  Start a new coding session with a student.
                </DialogDescription>
              </DialogHeader>
              <div className="py-3">
                <Label htmlFor="title" className="text-foreground text-xs">Session Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Two Sum Problem"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  className="bg-secondary border-border text-foreground h-9 text-sm mt-2"
                />
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateOpen(false)}
                  className="border-border text-muted-foreground h-8"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground h-8"
                  onClick={handleCreateSession}
                  disabled={!sessionTitle.trim() || isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50 text-xs px-4"
              >
                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-foreground text-sm">Schedule Session</DialogTitle>
                <DialogDescription className="text-muted-foreground text-xs">
                  Plan a session for later and create an invite-ready placeholder.
                </DialogDescription>
              </DialogHeader>
              <div className="py-3 space-y-4">
                <div>
                  <Label htmlFor="schedule-title" className="text-foreground text-xs">Session Title</Label>
                  <Input
                    id="schedule-title"
                    placeholder="e.g., Dynamic Programming Review"
                    value={scheduledTitle}
                    onChange={(e) => setScheduledTitle(e.target.value)}
                    className="bg-secondary border-border text-foreground h-9 text-sm mt-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="schedule-date" className="text-foreground text-xs">Date</Label>
                    <Input
                      id="schedule-date"
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="bg-secondary border-border text-foreground h-9 text-sm mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="schedule-time" className="text-foreground text-xs">Time</Label>
                    <Input
                      id="schedule-time"
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="bg-secondary border-border text-foreground h-9 text-sm mt-2"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsScheduleOpen(false)}
                  className="border-border text-muted-foreground h-8"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground h-8"
                  onClick={handleScheduleSession}
                  disabled={!scheduledTitle.trim() || !scheduledDate || !scheduledTime || isLoading}
                >
                  {isLoading ? 'Scheduling...' : 'Schedule'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                className="h-8 bg-primary text-primary-foreground hover:bg-primary/90 text-xs px-4"
              >
                <Link2 className="h-3.5 w-3.5 mr-1.5" />
                Join via Code
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-foreground text-sm">Join Session</DialogTitle>
                <DialogDescription className="text-muted-foreground text-xs">
                  Enter the session code shared by your mentor.
                </DialogDescription>
              </DialogHeader>
              <div className="py-3">
                <Label htmlFor="code" className="text-foreground text-xs">Session Code</Label>
                <Input
                  id="code"
                  placeholder="Enter session code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="bg-secondary border-border text-foreground h-9 text-sm mt-2"
                />
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsJoinOpen(false)}
                  className="border-border text-muted-foreground h-8"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground h-8"
                  onClick={handleJoinSession}
                  disabled={!joinCode.trim() || isLoading}
                >
                  {isLoading ? 'Joining...' : 'Join'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50 text-xs px-4"
          >
            <Users className="h-3.5 w-3.5 mr-1.5" />
            Browse Mentors
          </Button>
        </div>
      )}
    </div>
  );
}

// Sessions Table
function SessionsTable() {
  const { sessions, user, joinSession, updateSession } = useMentorshipStore();
  const [filter, setFilter] = useState<'all' | 'active' | 'scheduled' | 'ended'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');

  const isMentor = user?.role === 'mentor';

  const copyInviteCode = (session: Session, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!session.inviteCode) {
      toast({
        title: 'Invite code unavailable',
        type: 'error',
      });
      return;
    }

    navigator.clipboard.writeText(session.inviteCode);
    setCopiedKey(`${session.id}:code`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const copyInviteLink = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = `${window.location.origin}/session/${sessionId}`;
    navigator.clipboard.writeText(link);
    setCopiedKey(`${sessionId}:link`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const openSessionDetails = async (session: Session, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSession(session);
    setIsDetailsOpen(true);
    setIsDetailsLoading(true);

    try {
      const response = await fetch(`/api/session/${session.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load session details');
      }

      const mappedSession = mapApiSession(data.session);
      setSelectedSession(mappedSession);
      updateSession(mappedSession);
    } catch (error) {
      console.error('Failed to load session details:', error);
      toast({
        title: error instanceof Error ? error.message : 'Failed to load session details',
        type: 'error',
      });
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const openEditDialog = (session: Session, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSession(session);
    setEditTitle(session.title);
    setEditDate(toDateInputValue(session.createdAt));
    setEditTime(toTimeInputValue(session.createdAt));
    setIsEditOpen(true);
  };

  const handleDetailsDialogChange = (open: boolean) => {
    setIsDetailsOpen(open);
    if (!open) {
      setSelectedSession(null);
      setIsDetailsLoading(false);
    }
  };

  const handleEditDialogChange = (open: boolean) => {
    setIsEditOpen(open);
    if (!open) {
      setEditingSession(null);
      setEditTitle('');
      setEditDate('');
      setEditTime('');
      setIsSavingEdit(false);
    }
  };

  const handleSaveScheduledSession = async () => {
    if (!editingSession) {
      return;
    }

    const nextDate = new Date(`${editDate}T${editTime}`);

    if (!editTitle.trim() || Number.isNaN(nextDate.getTime())) {
      toast({
        title: 'Please provide a valid title, date, and time',
        type: 'error',
      });
      return;
    }

    setIsSavingEdit(true);

    try {
      const response = await fetch(`/api/session/${editingSession.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editTitle,
          createdAt: nextDate.toISOString(),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update scheduled session');
      }

      const updatedSession = mapApiSession(data.session);
      updateSession(updatedSession);
      setSelectedSession((currentSession) =>
        currentSession?.id === updatedSession.id ? updatedSession : currentSession,
      );
      handleEditDialogChange(false);
      toast({
        title: 'Scheduled session updated',
        type: 'success',
      });
    } catch (error) {
      console.error('Failed to update scheduled session:', error);
      toast({
        title:
          error instanceof Error ? error.message : 'Failed to update scheduled session',
        type: 'error',
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const filteredSessions = sessions.filter(session => {
    const matchesFilter = filter === 'all' || session.status === filter;
    const matchesSearch = session.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium bg-green-500/10 text-green-500 border border-green-500/20 w-[72px]">
            <Circle className="h-1.5 w-1.5 fill-green-500" />
            Active
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20 w-[72px]">
            <Timer className="h-3 w-3" />
            Scheduled
          </span>
        );
      case 'ended':
        return (
          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded text-[11px] font-medium bg-muted/50 text-muted-foreground border border-border w-[72px]">
            Ended
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col px-6 py-5">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground">Your Sessions</h2>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sessions..."
              className="h-8 w-44 pl-9 bg-secondary/50 border-border text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/50"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center border border-border rounded-md overflow-hidden">
            {(['all', 'active', 'scheduled', 'ended'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1.5 text-[11px] uppercase tracking-wide transition-colors",
                  filter === f
                    ? "bg-primary/15 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="rounded-lg border border-border overflow-hidden">
        {filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground bg-secondary/10">
            <Video className="h-8 w-8 mb-3 opacity-30" />
            <p className="text-sm">No sessions found</p>
            <p className="text-xs mt-1">
              {isMentor
                ? 'Create a session to generate an invite link'
                : 'Join a session to get started'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => session.status === 'active' && joinSession(session)}
                className={cn(
                  "group flex items-center gap-4 px-4 h-14 transition-all",
                  session.status === 'active' ? "cursor-pointer" : "",
                  "hover:bg-secondary/30 relative",
                  "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-primary before:opacity-0 hover:before:opacity-100 before:transition-opacity"
                )}
              >
                {/* Icon */}
                <div className="w-10 h-10 shrink-0 rounded-lg bg-secondary/50 border border-border flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/30 transition-colors">
                  <Code2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>

                {/* Title + Subtext - grows to fill space */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <p className="text-sm font-medium text-foreground truncate leading-tight mb-1">{session.title}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight truncate">
                    {user?.role === 'mentor' ? (
                      <>with <span className="text-foreground/70">{session.studentName || 'Pending student'}</span></>
                    ) : (
                      <>with <span className="text-foreground/70">{session.mentorName}</span></>
                    )}
                    <span className="mx-1.5 text-border">•</span>
                    {new Date(session.createdAt).toLocaleDateString()}
                    <span className="mx-1.5 text-border">•</span>
                    {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* Status Badge - fixed width */}
                <div className="shrink-0">
                  {getStatusBadge(session.status)}
                </div>

                {/* Actions - flex container with gap */}
                <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Copy Link - Only for mentors on active/scheduled sessions */}
                  {isMentor && (session.status === 'active' || session.status === 'scheduled') && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 min-w-[84px] px-3 text-[11px] border-border text-muted-foreground hover:text-foreground shrink-0"
                            onClick={(e) => copyInviteLink(session.id, e)}
                          >
                            {copiedKey === `${session.id}:link` ? (
                              <>
                                <Copy className="h-3 w-3 mr-1.5 text-green-500" />
                                <span className="text-green-500">Copied</span>
                              </>
                            ) : (
                              <>
                                <Link2 className="h-3 w-3 mr-1.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="text-xs max-w-[200px] truncate">{`${window.location.origin}/session/${session.id}`}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {isMentor && session.inviteCode && (session.status === 'active' || session.status === 'scheduled') && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 min-w-[92px] px-3 text-[11px] border-border text-muted-foreground hover:text-foreground shrink-0"
                            onClick={(e) => copyInviteCode(session, e)}
                          >
                            {copiedKey === `${session.id}:code` ? (
                              <>
                                <Copy className="h-3 w-3 mr-1.5 text-green-500" />
                                <span className="text-green-500">Copied</span>
                              </>
                            ) : (
                              <span>{session.inviteCode}</span>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="text-xs">Click to copy invite code</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {/* Primary Action */}
                  {session.status === 'active' && (
                    <Button
                      size="sm"
                      className="h-8 min-w-[72px] px-4 text-[11px] bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        joinSession(session);
                      }}
                    >
                      <Play className="h-3 w-3 mr-1.5" />
                      Join
                    </Button>
                  )}
                  {session.status === 'ended' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 min-w-[72px] px-4 text-[11px] border-border text-muted-foreground hover:text-foreground shrink-0"
                      onClick={(e) => openSessionDetails(session, e)}
                    >
                      <Eye className="h-3 w-3 mr-1.5" />
                      View
                    </Button>
                  )}
                  {session.status === 'scheduled' && (
                    <>
                      {isMentor && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 min-w-[72px] px-4 text-[11px] border-border text-muted-foreground hover:text-foreground shrink-0"
                          onClick={(e) => openEditDialog(session, e)}
                        >
                          <Pencil className="h-3 w-3 mr-1.5" />
                          Edit
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 min-w-[72px] px-4 text-[11px] border-border text-muted-foreground hover:text-foreground shrink-0"
                        onClick={(e) => openSessionDetails(session, e)}
                      >
                        <Clock className="h-3 w-3 mr-1.5" />
                        Details
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isDetailsOpen} onOpenChange={handleDetailsDialogChange}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground text-sm">
              Session Details
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Review the schedule, participants, and invite information for this session.
            </DialogDescription>
          </DialogHeader>

          {selectedSession && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-border bg-secondary/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {selectedSession.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(selectedSession.createdAt).toLocaleDateString([], {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}{' '}
                      at{' '}
                      {new Date(selectedSession.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {getStatusBadge(selectedSession.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-secondary/10 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Mentor
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {selectedSession.mentorName}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/10 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Student
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {selectedSession.studentName || 'Pending student'}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-secondary/10 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Invite Link
                </p>
                <p className="mt-2 break-all text-xs text-foreground/80">
                  {`${window.location.origin}/session/${selectedSession.id}`}
                </p>
                {selectedSession.inviteCode && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Invite code: <span className="text-foreground">{selectedSession.inviteCode}</span>
                  </p>
                )}
              </div>

              {isDetailsLoading && (
                <p className="text-xs text-muted-foreground">Refreshing latest session details...</p>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            {selectedSession && isMentor && selectedSession.status === 'scheduled' && (
              <Button
                variant="outline"
                size="sm"
                className="border-border text-muted-foreground h-8"
                onClick={() => {
                  handleDetailsDialogChange(false);
                  setEditingSession(selectedSession);
                  setEditTitle(selectedSession.title);
                  setEditDate(toDateInputValue(selectedSession.createdAt));
                  setEditTime(toTimeInputValue(selectedSession.createdAt));
                  setIsEditOpen(true);
                }}
              >
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Edit Schedule
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="border-border text-muted-foreground h-8"
              onClick={() => handleDetailsDialogChange(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={handleEditDialogChange}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground text-sm">Edit Scheduled Session</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Update the title or the scheduled time for this session.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="edit-session-title" className="text-foreground text-xs">
                Session Title
              </Label>
              <Input
                id="edit-session-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="bg-secondary border-border text-foreground h-9 text-sm mt-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-session-date" className="text-foreground text-xs">
                  Date
                </Label>
                <Input
                  id="edit-session-date"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="bg-secondary border-border text-foreground h-9 text-sm mt-2"
                />
              </div>
              <div>
                <Label htmlFor="edit-session-time" className="text-foreground text-xs">
                  Time
                </Label>
                <Input
                  id="edit-session-time"
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="bg-secondary border-border text-foreground h-9 text-sm mt-2"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditDialogChange(false)}
              className="border-border text-muted-foreground h-8"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-primary text-primary-foreground h-8"
              onClick={handleSaveScheduledSession}
              disabled={!editingSession || !editTitle.trim() || !editDate || !editTime || isSavingEdit}
            >
              {isSavingEdit ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Activity Log
function ActivityLog() {
  const { sessions } = useMentorshipStore();

  // Generate activity items from sessions
  const activities = sessions.slice(0, 6).map((session) => {
    // Determine activity type and message based on status
    const getActivityInfo = () => {
      switch (session.status) {
        case 'active':
          return {
            message: `Session "${session.title}" started`,
            dotColor: 'bg-green-500',
          };
        case 'scheduled':
          return {
            message: `Session "${session.title}" scheduled`,
            dotColor: 'bg-amber-500',
          };
        case 'ended':
          return {
            message: `Session "${session.title}" ended`,
            dotColor: 'bg-muted-foreground/50',
          };
        default:
          return {
            message: `Session "${session.title}"`,
            dotColor: 'bg-muted-foreground/50',
          };
      }
    };

    const info = getActivityInfo();
    
    return {
      id: session.id,
      message: info.message,
      dotColor: info.dotColor,
      time: new Date(session.createdAt).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }).toLowerCase(),
      date: new Date(session.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
    };
  });

  return (
    <div className="flex flex-col mt-6 px-6 py-5 bg-secondary/5">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
        </div>
        <button className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
          View all
        </button>
      </div>

      {/* Activity List */}
      {activities.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Activity className="h-8 w-8 mx-auto mb-3 opacity-30" />
          <p className="text-xs">No recent activity</p>
          <p className="text-[11px] mt-1 text-muted-foreground/60">
            Activity will appear here as you use the platform
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {activities.map((activity) => (
            <div 
              key={activity.id} 
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/50 transition-colors cursor-default"
            >
              {/* Status Dot */}
              <div className={cn(
                "w-2 h-2 rounded-full shrink-0",
                activity.dotColor
              )} />
              
              {/* Activity Message */}
              <p className="flex-1 text-[13px] text-foreground/90 truncate">
                {activity.message}
              </p>
              
              {/* Timestamp */}
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground/70 shrink-0">
                <span>{activity.date}</span>
                <span className="text-border">•</span>
                <span>{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Welcome Banner
function WelcomeBanner() {
  const { user } = useMentorshipStore();
  
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground mb-0.5">
          Welcome back, {user?.name}
        </h1>
        <p className="text-xs text-muted-foreground">
          {user?.role === 'mentor' 
            ? 'Manage your mentorship sessions and track student progress.' 
            : 'Continue your learning journey and join upcoming sessions.'}
        </p>
      </div>
      <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
        <Sparkles className="h-5 w-5 text-primary/60" />
      </div>
    </div>
  );
}

// Main Dashboard Component
export function Dashboard() {
  const { user, setSessions } = useMentorshipStore();

  // Load sessions on mount
  useEffect(() => {
    const loadSessions = async () => {
      if (!user) return;
      
      try {
        const response = await fetch('/api/session');
        if (response.ok) {
          const { sessions: data } = await response.json();
          setSessions(data.map(mapApiSession));
        }
      } catch (error) {
        console.error('Failed to load sessions:', error);
      }
    };

    loadSessions();
  }, [user, setSessions]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardNav />
      
      <main className="flex-1 flex flex-col">
        <div className="max-w-5xl mx-auto w-full">
          {/* Welcome Banner */}
          <WelcomeBanner />
          
          {/* Stats Row */}
          <div className="border-y border-border bg-secondary/5">
            <StatsSection />
          </div>
          
          {/* Quick Actions Toolbar */}
          <QuickActionsToolbar />
          
          {/* Sessions Table */}
          <SessionsTable />
          
          {/* Activity Log */}
          <ActivityLog />
        </div>
      </main>
    </div>
  );
}
