'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMentorshipStore } from '@/store/mentorship-store';
import {
  Users,
  Clock,
  Circle,
  StopCircle,
  Calendar,
  Video,
  VideoOff,
  MessageSquare,
  MessageSquareOff,
  PanelLeftClose,
  LogOut,
  Code2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface LeftPanelProps {
  onCollapse?: () => void;
}

export function LeftPanel({ onCollapse }: LeftPanelProps) {
  const [isEndingSession, setIsEndingSession] = useState(false);
  const {
    currentSession,
    user,
    leftPanelCollapsed,
    endSession,
    chatVisible,
    videoVisible,
    toggleChat,
    toggleVideo,
    leaveSession,
    editorVisible,
    editorMinimized,
    restoreEditor,
  } = useMentorshipStore();

  if (leftPanelCollapsed) {
    return null;
  }

  const handleEndSession = async () => {
    if (!currentSession || isEndingSession) {
      return;
    }

    if (confirm('Are you sure you want to end this session?')) {
      setIsEndingSession(true);

      try {
        const response = await fetch(`/api/session/${currentSession.id}/end`, {
          method: 'POST',
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to end session');
        }

        endSession();
        leaveSession();
        toast({
          title: 'Session ended successfully',
          type: 'success',
        });
      } catch (error) {
        console.error('Failed to end session:', error);
        toast({
          title: error instanceof Error ? error.message : 'Failed to end session',
          type: 'error',
        });
      } finally {
        setIsEndingSession(false);
      }
    }
  };

  const sessionDuration = currentSession 
    ? Math.floor((Date.now() - new Date(currentSession.createdAt).getTime()) / 60000)
    : 0;

  return (
    <div className="flex flex-col h-full border-r border-border bg-card">
      {/* Panel Header with Collapse Button */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${currentSession?.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`} />
          <span className="text-[11px] font-medium text-foreground uppercase tracking-wide">Session</span>
        </div>
        <div className="flex items-center gap-1">
          {onCollapse && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-secondary"
                    onClick={onCollapse}
                  >
                    <PanelLeftClose className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="text-xs">Hide Sidebar <kbd className="ml-1 px-1 py-0.5 bg-[#30363d] rounded text-[10px]">⌘B</kbd></p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Session Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {currentSession?.status === 'active' ? (
                  <>
                    <Circle className="h-2.5 w-2.5 fill-green-500 text-green-500 animate-pulse" />
                    <span className="text-xs text-green-500 font-medium">Active Session</span>
                  </>
                ) : (
                  <>
                    <StopCircle className="h-2.5 w-2.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Ended</span>
                  </>
                )}
              </div>
            </div>
            {currentSession && (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3 text-primary" />
                <span className="text-foreground font-medium">{sessionDuration} min</span>
                <span className="text-border">•</span>
                <span>elapsed</span>
              </div>
            )}
          </div>

          <Separator className="bg-border" />

          {/* Session Details */}
          <div className="space-y-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Details</span>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">
                  {currentSession && new Date(currentSession.createdAt).toLocaleDateString('en-US', { 
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">
                  {currentSession && new Date(currentSession.createdAt).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Participants */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Participants</span>
            </div>
            <div className="space-y-1.5">
              {/* Mentor */}
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-secondary/30 border border-border/50">
                <Avatar className="h-7 w-7 border border-primary/30">
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-medium">
                    {currentSession?.mentorName?.charAt(0) || 'M'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">
                    {currentSession?.mentorName || 'Mentor'}
                  </div>
                  <span className="text-[10px] text-primary">Mentor</span>
                </div>
                <Circle className="h-1.5 w-1.5 fill-green-500 text-green-500" />
              </div>

              {/* Student */}
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-secondary/30 border border-border/50">
                <Avatar className="h-7 w-7 border border-green-500/30">
                  <AvatarFallback className="bg-green-500/10 text-green-500 text-[10px] font-medium">
                    {currentSession?.studentName?.charAt(0) || 'S'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">
                    {currentSession?.studentName || 'Student'}
                  </div>
                  <span className="text-[10px] text-green-500">Student</span>
                </div>
                <Circle className="h-1.5 w-1.5 fill-green-500 text-green-500" />
              </div>
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Panel Controls */}
          <div className="space-y-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Panel Controls</span>
            <div className="space-y-1.5">
              {editorMinimized && (
                <Button
                  variant="default"
                  size="sm"
                  className="w-full justify-start h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={restoreEditor}
                >
                  <Code2 className="h-3.5 w-3.5 mr-2" />
                  Restore Editor
                </Button>
              )}
              {!editorVisible && !editorMinimized && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start h-8 text-xs border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                  onClick={restoreEditor}
                >
                  <Code2 className="h-3.5 w-3.5 mr-2" />
                  Show Editor
                </Button>
              )}
              <Button
                variant={chatVisible ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  "w-full justify-start h-8 text-xs",
                  chatVisible
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
                aria-label={chatVisible ? 'Hide chat panel' : 'Show chat panel'}
                aria-pressed={chatVisible}
                onClick={toggleChat}
              >
                {chatVisible ? (
                  <>
                    <MessageSquare className="h-3.5 w-3.5 mr-2" />
                    Chat Panel Visible
                  </>
                ) : (
                  <>
                    <MessageSquareOff className="h-3.5 w-3.5 mr-2" />
                    Chat Panel Hidden
                  </>
                )}
              </Button>
              <Button
                variant={videoVisible ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  "w-full justify-start h-8 text-xs",
                  videoVisible
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
                aria-label={videoVisible ? 'Hide video panel' : 'Show video panel'}
                aria-pressed={videoVisible}
                onClick={toggleVideo}
              >
                {videoVisible ? (
                  <>
                    <Video className="h-3.5 w-3.5 mr-2" />
                    Video Panel Visible
                  </>
                ) : (
                  <>
                    <VideoOff className="h-3.5 w-3.5 mr-2" />
                    Video Panel Hidden
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Session Actions */}
      <div className="p-3 border-t border-border space-y-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 border-border text-muted-foreground hover:text-foreground text-xs"
          onClick={leaveSession}
        >
          <LogOut className="h-3.5 w-3.5 mr-2" />
          Leave Session
        </Button>
        
        {/* End Session Button - Only for Mentor */}
        {user?.role === 'mentor' && currentSession?.status === 'active' && (
          <Button
            variant="destructive"
            size="sm"
            className="w-full h-8 text-xs"
            onClick={handleEndSession}
            disabled={isEndingSession}
          >
            <StopCircle className="h-3.5 w-3.5 mr-2" />
            {isEndingSession ? 'Ending...' : 'End Session'}
          </Button>
        )}
      </div>
    </div>
  );
}
