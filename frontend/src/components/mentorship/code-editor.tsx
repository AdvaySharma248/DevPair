'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import Editor, { BeforeMount, OnMount } from '@monaco-editor/react';
import { useMentorshipStore, type ExecutionResult } from '@/store/mentorship-store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Play,
  ChevronUp,
  ChevronDown,
  Trash2,
  Clock,
  Cpu,
  AlertCircle,
  CheckCircle,
  Terminal,
  X,
  Minus,
  Maximize2,
  Copy,
  Download,
  RotateCcw,
} from 'lucide-react';
import { editor } from 'monaco-editor';
import { cn } from '@/lib/utils';
import { getDefaultCode, isSupportedLanguage, type SupportedLanguage } from '@/lib/default-code';
import { registerEditorSnippets } from '@/lib/monaco-snippets';
import {
  emitRealtimeCodeChange,
  emitRealtimeExecutionResult,
} from '@/lib/devpair-socket';

const LANGUAGES: Array<{ value: SupportedLanguage; label: string }> = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
];

function isExecutionSuccess(result: ExecutionResult | null | undefined) {
  return !!result && (result.statusCode === 3 || result.status === 'Accepted');
}

function buildExecutionErrorResult(message: string, statusCode = 500): ExecutionResult {
  return {
    stdout: '',
    stderr: message,
    compileOutput: '',
    status: 'Error',
    statusCode,
    time: 'N/A',
    memory: 'N/A',
  };
}

function OutputPanel() {
  const {
    stdin,
    setStdin,
    executionResult,
    isRunning,
    outputPanelOpen,
    toggleOutputPanel,
    clearExecutionResult,
  } = useMentorshipStore();
  const [outputHeight, setOutputHeight] = useState(220);
  const [isResizing, setIsResizing] = useState(false);
  const [activeTab, setActiveTab] = useState<'input' | 'output' | 'error'>('input');

  const resizeStartY = useRef(0);
  const currentHeightRef = useRef(220);

  useEffect(() => {
    currentHeightRef.current = outputHeight;
  }, [outputHeight]);

  useEffect(() => {
    if (isRunning) {
      const timeoutId = window.setTimeout(() => {
        setActiveTab('output');
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }

    if (executionResult) {
      const timeoutId = window.setTimeout(() => {
        setActiveTab(isExecutionSuccess(executionResult) ? 'output' : 'error');
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [executionResult, isRunning]);

  const handleResizeStart = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setIsResizing(true);
    resizeStartY.current = event.clientY;

    const startHeight = currentHeightRef.current;

    const onMouseMove = (nextEvent: MouseEvent) => {
      requestAnimationFrame(() => {
        const delta = resizeStartY.current - nextEvent.clientY;
        const newHeight = Math.max(180, Math.min(520, startHeight + delta));
        setOutputHeight(newHeight);
      });
    };

    const onMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, []);

  const getStatusIcon = () => {
    if (activeTab === 'input') {
      return <Terminal className="w-3 h-3 text-muted-foreground" />;
    }

    if (isRunning) {
      return <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
    }

    if (!executionResult) {
      return <Terminal className="w-3 h-3 text-muted-foreground" />;
    }

    if (isExecutionSuccess(executionResult)) {
      return <CheckCircle className="w-3 h-3 text-[#24b39b]" />;
    }

    return <AlertCircle className="w-3 h-3 text-red-500" />;
  };

  const getStatusColor = () => {
    if (!executionResult) {
      return 'text-muted-foreground';
    }

    return isExecutionSuccess(executionResult) ? 'text-[#24b39b]' : 'text-red-500';
  };

  return (
    <div
      className={cn(
        'border-t border-border bg-[#111111] transition-all duration-200',
        outputPanelOpen ? '' : 'h-8',
      )}
      style={{ height: outputPanelOpen ? outputHeight : 32 }}
      suppressHydrationWarning
    >
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'input' | 'output' | 'error')}
        className="h-full gap-0"
      >
        {outputPanelOpen ? (
          <div
            className={cn(
              'h-1 w-full cursor-row-resize hover:bg-primary/20 transition-colors',
              isResizing && 'bg-primary/30',
            )}
            onMouseDown={handleResizeStart}
          />
        ) : null}

        <div className="flex items-center justify-between border-b border-border bg-[#1a1a1a] px-3 h-8">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-[11px] font-medium text-foreground">Console</span>
            {outputPanelOpen ? (
              <TabsList className="h-6 rounded-md bg-[#111111] p-0.5">
                <TabsTrigger value="input" className="h-5 px-2 text-[10px]">
                  Input
                </TabsTrigger>
                <TabsTrigger value="output" className="h-5 px-2 text-[10px]">
                  Output
                </TabsTrigger>
                <TabsTrigger value="error" className="h-5 px-2 text-[10px]">
                  Error
                </TabsTrigger>
              </TabsList>
            ) : null}
            {activeTab !== 'input' && executionResult ? (
              <span className={cn('text-[10px] font-medium', getStatusColor())}>
                {executionResult.status}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-1">
            {activeTab !== 'input' && executionResult ? (
              <>
                <div className="mr-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{executionResult.time}</span>
                  <Cpu className="w-3 h-3 ml-2" />
                  <span>{executionResult.memory}</span>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={clearExecutionResult}
                        className="rounded p-1 transition-colors hover:bg-secondary"
                      >
                        <Trash2 className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-xs">Clear Output</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            ) : null}
            {activeTab === 'input' && outputPanelOpen ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
                onClick={() => setStdin('')}
                disabled={!stdin}
              >
                Clear Input
              </Button>
            ) : null}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleOutputPanel}
                    className="rounded p-1 transition-colors hover:bg-secondary"
                  >
                    {outputPanelOpen ? (
                      <ChevronDown className="w-3 h-3 text-muted-foreground" />
                    ) : (
                      <ChevronUp className="w-3 h-3 text-muted-foreground" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">{outputPanelOpen ? 'Collapse' : 'Expand'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {outputPanelOpen ? (
          <div
            className="font-mono text-[12px] leading-relaxed"
            style={{ height: outputHeight - 32 - 4 }}
            suppressHydrationWarning
          >
            <TabsContent value="input" className="mt-0 h-full">
              <div className="flex h-full flex-col gap-2 bg-[#1b1b1b] p-3">
                <div className="space-y-1">
                  <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Custom Input
                  </div>
                  <div className="text-[10px] text-muted-foreground/80">
                    Type exactly what your program should read from stdin, just like an online compiler.
                  </div>
                </div>
                <Textarea
                  value={stdin}
                  onChange={(event) => setStdin(event.target.value)}
                  placeholder={'Example:\n4\n2 7 11 15\n9'}
                  className="h-full min-h-0 flex-1 resize-none border-border bg-[#111111] px-3 py-2 text-[#f5f5f5] text-[12px] placeholder:text-muted-foreground/70 focus-visible:ring-1"
                />
              </div>
            </TabsContent>

            <TabsContent value="output" className="mt-0 h-full">
              <div className="h-full overflow-auto p-3">
                {isRunning ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span>Running...</span>
                  </div>
                ) : executionResult ? (
                  executionResult.stdout ? (
                    <pre className="text-[#e6edf3] whitespace-pre-wrap break-words">
                      {executionResult.stdout}
                    </pre>
                  ) : (
                    <span className="text-muted-foreground italic">No output</span>
                  )
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                    <Terminal className="mb-2 h-6 w-6 opacity-50" />
                    <span className="text-xs">Run your code to see stdout here.</span>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="error" className="mt-0 h-full">
              <div className="h-full overflow-auto p-3">
                {isRunning ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span>Running...</span>
                  </div>
                ) : executionResult ? (
                  <div className="space-y-2">
                    {executionResult.compileOutput ? (
                      <div>
                        <div className="mb-1 flex items-center gap-1 text-[10px] text-yellow-500">
                          <AlertCircle className="w-3 h-3" />
                          Compiler Output
                        </div>
                        <pre className="text-yellow-400 whitespace-pre-wrap break-words">
                          {executionResult.compileOutput}
                        </pre>
                      </div>
                    ) : null}

                    {executionResult.stderr ? (
                      <div>
                        <div className="mb-1 flex items-center gap-1 text-[10px] text-red-500">
                          <AlertCircle className="w-3 h-3" />
                          Error
                        </div>
                        <pre className="text-red-400 whitespace-pre-wrap break-words">
                          {executionResult.stderr}
                        </pre>
                      </div>
                    ) : null}

                    {!executionResult.stderr && !executionResult.compileOutput ? (
                      <span className="text-muted-foreground italic">No errors</span>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                    <Terminal className="mb-2 h-6 w-6 opacity-50" />
                    <span className="text-xs">Compile and runtime errors will appear here.</span>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        ) : null}
      </Tabs>
    </div>
  );
}

export function CodeEditor() {
  const {
    currentSession,
    code,
    drafts,
    language,
    remoteCodeSyncVersion,
    setCode,
    setLanguage,
    stdin,
    closeEditor,
    minimizeEditor,
    toggleEditorFocus,
    editorFocused,
    isRunning,
    setIsRunning,
    setExecutionResult,
  } = useMentorshipStore();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const currentSessionId = currentSession?.id;
  const codeSyncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressRemoteCodeRef = useRef<string | null>(null);

  useEffect(() => {
    suppressRemoteCodeRef.current = code;
  }, [code, remoteCodeSyncVersion]);

  useEffect(() => {
    return () => {
      if (codeSyncTimeoutRef.current) {
        clearTimeout(codeSyncTimeoutRef.current);
      }
    };
  }, []);

  const queueCodeSync = useCallback(
    (nextCode: string, nextLanguage: SupportedLanguage) => {
      if (!currentSessionId) {
        return;
      }

      if (codeSyncTimeoutRef.current) {
        clearTimeout(codeSyncTimeoutRef.current);
      }

      codeSyncTimeoutRef.current = setTimeout(() => {
        emitRealtimeCodeChange(currentSessionId, nextCode, nextLanguage);
      }, 200);
    },
    [currentSessionId],
  );

  const handleEditorWillMount: BeforeMount = (monaco) => {
    monaco.editor.defineTheme('devpair-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '8f8f8f', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'f5a623' },
        { token: 'string', foreground: 'd7ba7d' },
        { token: 'number', foreground: 'b5cea8' },
        { token: 'type', foreground: 'f0c56b' },
        { token: 'function', foreground: 'e5e5e5' },
        { token: 'variable', foreground: 'f5f5f5' },
        { token: 'constant', foreground: 'b5cea8' },
      ],
      colors: {
        'editor.background': '#111111',
        'editor.foreground': '#f5f5f5',
        'editor.lineHighlightBackground': '#181818',
        'editor.selectionBackground': '#3a3a3a80',
        'editor.inactiveSelectionBackground': '#33333355',
        'editorLineNumber.foreground': '#5f5f5f',
        'editorLineNumber.activeForeground': '#b9b9b9',
        'editorCursor.foreground': '#f5a623',
        'editor.selectionHighlightBackground': '#f5a62318',
        'editorIndentGuide.background': '#242424',
        'editorIndentGuide.activeBackground': '#353535',
        'editorWhitespace.foreground': '#303030',
        'editorBracketMatch.background': '#f5a62318',
        'editorBracketMatch.border': '#f5a623',
        'minimap.background': '#111111',
        'minimap.selectionHighlight': '#3a3a3a80',
        'scrollbarSlider.background': '#56565633',
        'scrollbarSlider.hoverBackground': '#6a6a6a55',
        'scrollbarSlider.activeBackground': '#80808077',
      },
    });

    registerEditorSnippets(monaco);
  };

  const handleEditorDidMount: OnMount = (mountedEditor) => {
    editorRef.current = mountedEditor;
    mountedEditor.focus();
  };

  const handleLanguageChange = useCallback(
    (nextLanguageValue: string) => {
      const nextLanguage = isSupportedLanguage(nextLanguageValue)
        ? nextLanguageValue
        : 'javascript';
      const nextCode = drafts[nextLanguage] ?? getDefaultCode(nextLanguage);

      setLanguage(nextLanguage);
      queueCodeSync(nextCode, nextLanguage);
    },
    [drafts, queueCodeSync, setLanguage],
  );

  const handleEditorChange = useCallback(
    (value?: string) => {
      const nextCode = value || '';

      if (
        suppressRemoteCodeRef.current !== null &&
        nextCode === suppressRemoteCodeRef.current
      ) {
        suppressRemoteCodeRef.current = null;
        return;
      }

      setCode(nextCode);
      queueCodeSync(nextCode, language);
    },
    [language, queueCodeSync, setCode],
  );

  const copyCode = useCallback(() => {
    if (editorRef.current) {
      void navigator.clipboard.writeText(editorRef.current.getValue());
    }
  }, []);

  const downloadCode = useCallback(() => {
    if (!editorRef.current) {
      return;
    }

    const codeValue = editorRef.current.getValue();
    const extensions: Record<SupportedLanguage, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
    };
    const ext = extensions[language];
    const blob = new Blob([codeValue], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `solution.${ext}`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [language]);

  const resetCode = useCallback(() => {
    const nextCode = getDefaultCode(language);
    setCode(nextCode);
    queueCodeSync(nextCode, language);
  }, [language, queueCodeSync, setCode]);

  const runCode = useCallback(async () => {
    if (isRunning || !editorRef.current) {
      return;
    }

    const codeValue = editorRef.current.getValue();

    if (!codeValue.trim()) {
      return;
    }

    setIsRunning(true);

    try {
      const response = await fetch('/api/run-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: codeValue,
          language,
          stdin,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          payload &&
          typeof payload === 'object' &&
          'error' in payload &&
          typeof payload.error === 'string'
            ? payload.error
            : 'Failed to execute code. Please try again.';
        throw buildExecutionErrorResult(message, response.status);
      }

      const result = payload as ExecutionResult;
      setExecutionResult(result);

      if (currentSessionId) {
        emitRealtimeExecutionResult(currentSessionId, result);
      }
    } catch (error) {
      console.error('Run code error:', error);
      const fallbackResult =
        error &&
        typeof error === 'object' &&
        'status' in error &&
        'statusCode' in error
          ? (error as ExecutionResult)
          : buildExecutionErrorResult('Failed to execute code. Please try again.');
      setExecutionResult(fallbackResult);

      if (currentSessionId) {
        emitRealtimeExecutionResult(currentSessionId, fallbackResult);
      }
    } finally {
      setIsRunning(false);
    }
  }, [currentSessionId, isRunning, language, setExecutionResult, setIsRunning, stdin]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        void runCode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [runCode]);

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded overflow-hidden">
      <div
        className="flex items-center justify-between px-2 py-1.5 border-b border-border bg-card shrink-0 select-none"
        onDoubleClick={toggleEditorFocus}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={closeEditor}
                    className="w-3 h-3 rounded-full bg-[#f85149] hover:bg-[#ff6b6b] transition-colors flex items-center justify-center group"
                  >
                    <X className="w-1.5 h-1.5 text-[#1b1610] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Close Editor</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={minimizeEditor}
                    className="w-3 h-3 rounded-full bg-[#d29922] hover:bg-[#f0b429] transition-colors flex items-center justify-center group"
                  >
                    <Minus className="w-1.5 h-1.5 text-[#1b1610] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Minimize to floating window</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleEditorFocus}
                    className={cn(
                      'w-3 h-3 rounded-full transition-colors flex items-center justify-center group',
                      editorFocused ? 'bg-[#f0c56b]' : 'bg-[#f0c56b] hover:bg-[#f4cf83]',
                    )}
                  >
                    <Maximize2 className="w-1.5 h-1.5 text-[#1b1610] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">{editorFocused ? 'Exit Focus Mode' : 'Focus Mode'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="h-3 w-px bg-border" />

          <span className="text-[10px] text-muted-foreground ml-1">
            solution.{language === 'javascript' ? 'js' : language === 'typescript' ? 'ts' : language}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => void runCode()}
                  disabled={isRunning}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-medium transition-all',
                    'bg-[#f5a623] hover:bg-[#ffb53d] text-[#1b1610]',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                  )}
                >
                  {isRunning ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Running...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" />
                      <span>Run</span>
                    </>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Execute code <kbd className="ml-1 px-1 py-0.5 bg-secondary rounded text-[10px]">Ctrl+Enter</kbd></p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="h-4 w-px bg-border mx-1" />

          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-28 h-6 bg-secondary border-border text-[10px] text-foreground">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {LANGUAGES.map((lang) => (
                <SelectItem
                  key={lang.value}
                  value={lang.value}
                  className="text-foreground text-[10px] focus:bg-secondary"
                >
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={copyCode}
              title="Copy code"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={downloadCode}
              title="Download code"
            >
              <Download className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={resetCode}
              title="Reset code"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={handleEditorChange}
          beforeMount={handleEditorWillMount}
          onMount={handleEditorDidMount}
          theme="devpair-dark"
          options={{
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
            fontLigatures: true,
            lineHeight: 20,
            padding: { top: 8, bottom: 8 },
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            renderWhitespace: 'selection',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            quickSuggestions: {
              other: true,
              comments: false,
              strings: false,
            },
            suggestOnTriggerCharacters: true,
            snippetSuggestions: 'top',
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              indentation: true,
            },
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
              verticalScrollbarSize: 6,
              horizontalScrollbarSize: 6,
              alwaysConsumeMouseWheel: false,
            },
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false,
          }}
        />
      </div>

      <OutputPanel />
    </div>
  );
}
