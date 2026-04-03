'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  User,
  Calendar,
  Clock,
  Users,
  Play,
  Code2,
  Settings,
  FileText,
  Edit3,
  Check,
  ArrowLeft,
  Copy,
  Link2,
  Eye,
  Timer,
  Circle,
  Sparkles,
  Trophy,
  Target,
  LogOut
} from 'lucide-react';
import { useMentorshipStore, Session } from '@/store/mentorship-store';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { logoutEverywhere } from '@/lib/firebase-auth';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Profile Navigation
function ProfileNav() {
  const { user, setCurrentView, logout } = useMentorshipStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      await logoutEverywhere();
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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentView('dashboard')}
          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2.5">
          <User className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Profile</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <>
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

// Profile Summary Sidebar
function ProfileSummary() {
  const { user, sessions } = useMentorshipStore();
  const isMentor = user?.role === 'mentor';

  // Calculate stats
  const activeSessions = sessions.filter(s => s.status === 'active').length;
  const studentsMentored = isMentor
    ? new Set(sessions.map(s => s.studentId).filter(Boolean)).size
    : 0;

  // Profile completion calculation
  const profileFields = [
    !!user?.name?.trim(),
    !!user?.email?.trim(),
    !!user?.bio?.trim(),
    !!user?.defaultLanguage?.trim(),
  ];
  const completionPercent = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Avatar Section */}
      <div className="p-6 flex flex-col items-center border-b border-border">
        <Avatar className="h-24 w-24 border-2 border-primary/20 mb-4">
          <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>

        <h2 className="text-lg font-semibold text-foreground mb-1">{user?.name}</h2>

        <Badge
          variant="outline"
          className={cn(
            "text-[11px] px-3 py-0.5 h-6",
            isMentor
              ? 'border-primary/40 text-primary bg-primary/5'
              : 'border-green-500/40 text-green-500 bg-green-500/5'
          )}
        >
          {isMentor ? 'Mentor' : 'Student'}
        </Badge>

        {user?.bio && (
          <p className="text-xs text-muted-foreground text-center mt-3 leading-relaxed">
            {user.bio}
          </p>
        )}
      </div>

      {/* Profile Completion */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-muted-foreground">Profile completion</span>
          <span className="text-[11px] font-medium text-foreground">{completionPercent}%</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="p-6 space-y-3">
        <h3 className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Statistics</h3>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Active</span>
            </div>
            <span className="text-sm font-semibold text-foreground tabular-nums">{activeSessions}</span>
          </div>

          {isMentor && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Students</span>
              </div>
              <span className="text-sm font-semibold text-foreground tabular-nums">{studentsMentored}</span>
            </div>
          )}
        </div>
      </div>

      {/* Member Since */}
      <div className="px-6 py-4 border-t border-border mt-auto">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>Member since {user?.createdAt
            ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            : 'January 2025'}
          </span>
        </div>
      </div>
    </div>
  );
}

// Sessions Tab Content
function SessionsTab() {
  const { sessions, user } = useMentorshipStore();
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'active' | 'scheduled' | 'ended'>('all');

  const isMentor = user?.role === 'mentor';

  const getStatusBadge = (status: Session['status']) => {
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
    }
  };

  const filteredSessions = sessions.filter(session => {
    return filter === 'all' || session.status === filter;
  });

  const copyInviteLink = (sessionId: string) => {
    const link = `${window.location.origin}/session/${sessionId}`;
    navigator.clipboard.writeText(link);
    toast({ title: 'Invite link copied to clipboard', type: 'success' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <div className="flex items-center border border-border rounded-md overflow-hidden">
          {(['all', 'active', 'scheduled', 'ended'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 text-[11px] uppercase tracking-wide transition-colors",
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

      {/* Sessions List */}
      <ScrollArea className="flex-1">
        {filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FileText className="h-10 w-10 mb-4 opacity-20" />
            <p className="text-sm">No sessions found</p>
            <p className="text-xs mt-1">Create a session to generate an invite link</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className="group grid items-center gap-4 px-6 py-3 hover:bg-secondary/30 transition-colors grid-cols-[40px_minmax(0,1fr)_auto_auto]"
              >
                {/* Column 1: Icon */}
                <div className="w-10 h-10 rounded-lg bg-secondary/50 border border-border flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/30 transition-colors">
                  <Code2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>

                {/* Column 2: Title */}
                <div className="min-w-0 flex flex-col justify-center">
                  <p className="text-sm font-medium text-foreground truncate leading-tight mb-1">
                    {session.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-tight truncate">
                    {new Date(session.createdAt).toLocaleDateString()}
                    <span className="mx-1.5 text-border">•</span>
                    {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* Column 3: Status */}
                <div className="flex justify-end">
                  {getStatusBadge(session.status)}
                </div>

                {/* Column 4: Actions */}
                <div className="flex min-w-fit items-center justify-end gap-2">
                  {session.status === 'active' && (
                    <>
                      <Button
                        size="sm"
                        className="h-8 shrink-0 px-3 text-[11px] bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => router.push(`/session/${session.id}`)}
                      >
                        <Play className="h-3 w-3 mr-1.5" />
                        Join
                      </Button>
                      {isMentor && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 shrink-0 px-3 text-[11px] border-border text-muted-foreground hover:text-foreground"
                                onClick={() => copyInviteLink(session.id)}
                              >
                                <Link2 className="h-3 w-3 mr-1.5" />
                                Copy Link
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p className="text-xs">{`${window.location.origin}/session/${session.id}`}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </>
                  )}
                  {session.status === 'ended' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 shrink-0 px-3 text-[11px] border-border text-muted-foreground hover:text-foreground"
                    >
                      <Eye className="h-3 w-3 mr-1.5" />
                      View
                    </Button>
                  )}
                  {session.status === 'scheduled' && isMentor && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 shrink-0 px-3 text-[11px] border-border text-muted-foreground hover:text-foreground"
                            onClick={() => copyInviteLink(session.id)}
                          >
                            <Link2 className="h-3 w-3 mr-1.5" />
                            Copy Link
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="text-xs">{`${window.location.origin}/session/${session.id}`}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// Overview Tab Content
function OverviewTab() {
  const { sessions, user } = useMentorshipStore();
  const isMentor = user?.role === 'mentor';

  const recentSessions = sessions.slice(0, 5);
  const activeCount = sessions.filter(s => s.status === 'active').length;
  const completedCount = sessions.filter(s => s.status === 'ended').length;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 p-6">
        <div className="p-4 rounded-lg bg-secondary/20 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-[11px] text-muted-foreground">This Week</span>
          </div>
          <span className="text-2xl font-semibold text-foreground tabular-nums">
            {sessions.filter(s => {
              const sessionDate = new Date(s.createdAt);
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return sessionDate >= weekAgo;
            }).length}
          </span>
        </div>

        <div className="p-4 rounded-lg bg-secondary/20 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Play className="h-4 w-4 text-green-500" />
            <span className="text-[11px] text-muted-foreground">Active Now</span>
          </div>
          <span className="text-2xl font-semibold text-foreground tabular-nums">{activeCount}</span>
        </div>

        <div className="p-4 rounded-lg bg-secondary/20 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span className="text-[11px] text-muted-foreground">Completed</span>
          </div>
          <span className="text-2xl font-semibold text-foreground tabular-nums">{completedCount}</span>
        </div>
      </div>

      <Separator className="bg-border" />

      {/* Recent Sessions */}
      <div className="p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Recent Sessions</h3>

        {recentSessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p className="text-xs">No recent sessions</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/30 transition-colors"
              >
                <div className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  session.status === 'active' ? 'bg-green-500' :
                  session.status === 'scheduled' ? 'bg-amber-500' : 'bg-muted-foreground/50'
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{session.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(session.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px]",
                    session.status === 'active' ? 'border-green-500/30 text-green-500' :
                    session.status === 'scheduled' ? 'border-amber-500/30 text-amber-500' :
                    'border-border text-muted-foreground'
                  )}
                >
                  {session.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator className="bg-border" />

      {/* Activity Summary */}
      <div className="p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Activity Summary</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-secondary/10 border border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total Time</span>
            </div>
            <span className="text-xl font-semibold text-foreground">
              {sessions.length * 45}m
            </span>
          </div>

          <div className="p-4 rounded-lg bg-secondary/10 border border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <Code2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Languages</span>
            </div>
            <span className="text-xl font-semibold text-foreground">3</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Settings Tab Content
function SettingsTab() {
  const { user, setUser } = useMentorshipStore();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [defaultLanguage, setDefaultLanguage] = useState(
    user?.defaultLanguage || 'javascript',
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setName(user?.name || '');
    setBio(user?.bio || '');
    setDefaultLanguage(user?.defaultLanguage || 'javascript');
  }, [user]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          bio: bio.trim() ? bio.trim() : null,
          defaultLanguage,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setUser(data.user);
      toast({ title: 'Profile updated successfully', type: 'success' });
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast({
        title: error instanceof Error ? error.message : 'Failed to update profile',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-6 space-y-8 max-w-xl">
        {/* Basic Info */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">Basic Info</h3>
          <p className="text-[11px] text-muted-foreground mb-4">Update your personal information</p>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-[11px] text-muted-foreground mb-2 block">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-secondary border-border text-foreground h-10 text-sm focus:border-primary/50"
                placeholder="Your name"
              />
            </div>

            <div>
              <Label htmlFor="bio" className="text-[11px] text-muted-foreground mb-2 block">Bio</Label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground min-h-[80px] focus:border-primary/50 focus:outline-none resize-none"
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>
        </div>

        <Separator className="bg-border" />

        {/* Account */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">Account</h3>
          <p className="text-[11px] text-muted-foreground mb-4">Your account details</p>

          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-[11px] text-muted-foreground mb-2 block">Email</Label>
              <Input
                id="email"
                value={user?.email || ''}
                disabled
                className="bg-secondary/50 border-border text-muted-foreground h-10 text-sm cursor-not-allowed"
              />
              <p className="text-[10px] text-muted-foreground/60 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <Label className="text-[11px] text-muted-foreground mb-2 block">Role</Label>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/30 border border-border">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[11px]",
                    user?.role === 'mentor'
                      ? 'border-primary/40 text-primary'
                      : 'border-green-500/40 text-green-500'
                  )}
                >
                  {user?.role === 'mentor' ? 'Mentor' : 'Student'}
                </Badge>
                <span className="text-xs text-muted-foreground">Account type</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="bg-border" />

        {/* Preferences */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">Preferences</h3>
          <p className="text-[11px] text-muted-foreground mb-4">Customize your experience</p>

          <div className="space-y-4">
            <div>
              <Label htmlFor="language" className="text-[11px] text-muted-foreground mb-2 block">Default Language</Label>
              <select
                id="language"
                value={defaultLanguage}
                onChange={(e) => setDefaultLanguage(e.target.value)}
                className="w-full bg-secondary border border-border rounded-md px-3 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none"
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4">
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="h-9 px-6 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium"
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Saving...
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5 mr-1.5" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Main Profile Component
export function Profile() {
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'settings'>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'sessions', label: 'Sessions', icon: Code2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ProfileNav />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Profile Summary */}
        <div className="w-72 shrink-0 hidden md:block">
          <ProfileSummary />
        </div>

        {/* Right Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center gap-1 px-6 py-2 border-b border-border bg-card">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'sessions' && <SessionsTab />}
            {activeTab === 'settings' && <SettingsTab />}
          </div>
        </div>
      </div>

      {/* Mobile Profile Summary */}
      <div className="md:hidden border-t border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {useMentorshipStore.getState().user?.name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {useMentorshipStore.getState().user?.name}
            </p>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-2 py-0 h-5",
                useMentorshipStore.getState().user?.role === 'mentor'
                  ? 'border-primary/40 text-primary'
                  : 'border-green-500/40 text-green-500'
              )}
            >
              {useMentorshipStore.getState().user?.role === 'mentor' ? 'Mentor' : 'Student'}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
