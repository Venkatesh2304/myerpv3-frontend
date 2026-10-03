import React, { useState, useEffect, useRef } from "react";
import {
  Bot,
  AlertTriangle,
  Send,
  X,
  RefreshCw,
  Sparkles,
  ChevronDown,
  Terminal,
  Info,
  CheckCircle2,
  Wrench,
  Flame,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { httpClient } from "@/lib/dataprovider";
import { errorTracker, FailedRequestInfo } from "@/lib/error-tracker";
import { useCompany } from "@/providers/company-provider";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  isError?: boolean;
  metadata?: any;
}

export function AssistantWidget() {
  const { company: companyContext } = useCompany();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I am your **HUL ERP Assistant**.\n\nI can help you navigate reports, check system locks, or troubleshoot errors without technical jargon.\n\nIf something went wrong, click **Fix Failure** below or describe what happened in your own words.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [recentFailure, setRecentFailure] = useState<FailedRequestInfo | null>(null);
  const [hasUnviewedFailure, setHasUnviewedFailure] = useState<boolean>(false);

  // Model selection state: low, medium, high (persisted in localStorage, default: medium)
  type ModelType = "low" | "medium" | "high";
  const [modelType, setModelType] = useState<ModelType>(() => {
    try {
      const saved = localStorage.getItem("assistant_model_type");
      return saved === "low" || saved === "medium" || saved === "high" ? saved : "medium";
    } catch {
      return "medium";
    }
  });

  const handleModelChange = (type: ModelType) => {
    setModelType(type);
    try {
      localStorage.setItem("assistant_model_type", type);
    } catch {
      // ignore
    }
  };

  // 15-second floating error banner state
  const [errorBanner, setErrorBanner] = useState<{
    visible: boolean;
    failure: FailedRequestInfo | null;
    secondsLeft: number;
  }>({
    visible: false,
    failure: null,
    secondsLeft: 15,
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bannerTimerRef = useRef<any>(null);

  // Subscribe to error tracker for real-time failure capture
  useEffect(() => {
    const unsubscribe = errorTracker.subscribe((failure: FailedRequestInfo) => {
      setRecentFailure(failure);
      setHasUnviewedFailure(true);

      // Start or reset 15-second countdown for the middle-right floating button
      if (bannerTimerRef.current) {
        clearInterval(bannerTimerRef.current);
      }

      setErrorBanner({
        visible: true,
        failure,
        secondsLeft: 15,
      });

      const interval = setInterval(() => {
        setErrorBanner((prev) => {
          if (!prev.visible || prev.secondsLeft <= 1) {
            clearInterval(interval);
            return { ...prev, visible: false, secondsLeft: 0 };
          }
          return { ...prev, secondsLeft: prev.secondsLeft - 1 };
        });
      }, 1000);

      bannerTimerRef.current = interval;
    });

    const initial = errorTracker.getLatest();
    if (initial && (Date.now() - new Date(initial.timestamp).getTime() < 2 * 60 * 1000)) {
      setRecentFailure(initial);
    }

    return () => {
      unsubscribe();
      if (bannerTimerRef.current) {
        clearInterval(bannerTimerRef.current);
      }
    };
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setHasUnviewedFailure(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  /**
   * Dispatches message to backend /assistant/chat
   */
  const handleSendMessage = async (textToSend?: string, type = "chat", extraMeta?: any) => {
    const text = (textToSend !== undefined ? textToSend : input).trim();
    // Only diagnose failures when explicitly requested ("check_failure" or clicking "Fix this")
    const isDiagnosingFailure = type === "check_failure" || Boolean(extraMeta);
    const failureToDiagnose = isDiagnosingFailure ? (extraMeta || recentFailure) : null;
    if (!text && !failureToDiagnose) return;

    const effectiveType = failureToDiagnose && !text ? "check_failure" : type;
    const userDisplayContent = text || (failureToDiagnose ? "Fix recent error on this page" : "");

    const userMsgId = `user-${Date.now()}`;
    const newMessages: ChatMessage[] = [
      ...messages,
      {
        id: userMsgId,
        role: "user",
        content: userDisplayContent,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        metadata: failureToDiagnose,
      },
    ];

    setMessages(newMessages);
    if (textToSend === undefined) setInput("");
    setLoading(true);

    try {
      const pagePath = window.location.pathname + window.location.search;
      const currentUser = sessionStorage.getItem("username") || "operator";
      const currentCompany =
        companyContext?.id ||
        sessionStorage.getItem("selectedCompanyId") ||
        sessionStorage.getItem("company") ||
        "devaki_hul";

      // Background request telemetry passed to backend
      const payload = {
        prompt: text, // can be empty or operator's custom description
        type: effectiveType,
        model_type: modelType,
        metadata: {
          page: pagePath,
          client_error: failureToDiagnose,
          user: currentUser,
          company: currentCompany,
          model_type: modelType,
        },
        conversation_id: conversationId,
      };

      const res = await httpClient.post("/assistant/chat", payload, {
        timeout: 630000,
      });

      if (res.data?.conversation_id) {
        setConversationId(res.data.conversation_id);
      }

      const assistantReply = res.data?.response || "No response received from assistant.";
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: assistantReply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);

      if (effectiveType === "check_failure") {
        setRecentFailure(null);
      }
    } catch (err: any) {
      console.error("Assistant chat error:", err);
      const errMsg =
        err.response?.data?.response ||
        err.response?.data?.error ||
        err.message ||
        "Could not connect to ERP Assistant service.";
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `⚠️ **Error communicating with assistant:**\n${errMsg}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Action triggered when user clicks the 15-second floating side button:
   * Opens chat drawer AND immediately dispatches diagnosis with failed API details.
   */
  const handleFloatingBannerClick = () => {
    const failure = errorBanner.failure || recentFailure;
    if (bannerTimerRef.current) {
      clearInterval(bannerTimerRef.current);
    }
    setErrorBanner((prev) => ({ ...prev, visible: false }));
    setIsOpen(true);
    setHasUnviewedFailure(false);

    // Immediately send with the background request failure details
    handleSendMessage("", "check_failure", failure);
  };

  /**
   * Action triggered inside the chat drawer when clicking "Fix Failure":
   * Uses whatever note user entered in input, or sends empty prompt if untouched.
   */
  const handleFixFailureClick = () => {
    handleSendMessage(input, "check_failure", recentFailure);
  };

  const handleResetChat = () => {
    setConversationId(null);
    setRecentFailure(null);
    setHasUnviewedFailure(false);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content:
          "Conversation reset.\n\nHow can I help you? Ask about reports, operations, or click **Fix Failure** if something went wrong.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // If user presses Enter with empty input and there's a recent failure, trigger fix
      if (!input.trim() && recentFailure) {
        handleFixFailureClick();
      } else if (input.trim()) {
        handleSendMessage();
      }
    }
  };

  return (
    <>
      {/* 1. Floating 15-Second "Fix Error" Side Button (Middle-Right) */}
      {errorBanner.visible && errorBanner.failure && !isOpen && (
        <div className="fixed right-3 top-[42%] -translate-y-1/2 z-50 animate-in fade-in slide-in-from-right-10 duration-300">
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-rose-600 text-white px-3.5 py-2.5 rounded-full shadow-2xl border-2 border-white/80 dark:border-slate-800 hover:scale-105 transition-all cursor-pointer group">
            <button
              onClick={handleFloatingBannerClick}
              className="flex items-center gap-2 text-xs font-semibold tracking-wide cursor-pointer focus:outline-none"
            >
              <AlertTriangle className="size-4 text-amber-300 animate-bounce" />
              <span>Fix Error</span>
              <span className="bg-black/25 text-[10px] font-mono px-1.5 py-0.5 rounded-full border border-white/20">
                {errorBanner.secondsLeft}s
              </span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (bannerTimerRef.current) clearInterval(bannerTimerRef.current);
                setErrorBanner((prev) => ({ ...prev, visible: false }));
              }}
              className="p-1 rounded-full hover:bg-black/20 text-white/80 hover:text-white cursor-pointer transition-colors ml-1"
              title="Dismiss banner"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Persistent Bottom-Right Assistant Floating Button */}
      <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative flex items-center justify-center size-13 rounded-full shadow-xl transition-all duration-200 cursor-pointer ${
            isOpen
              ? "bg-slate-800 text-white hover:bg-slate-900"
              : hasUnviewedFailure
              ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
              : "bg-blue-600 hover:bg-blue-700 text-white hover:scale-105"
          }`}
          title={isOpen ? "Close Assistant" : "ERP Assistant & Diagnostics"}
        >
          {isOpen ? (
            <X className="size-6" />
          ) : (
            <>
              <Bot className="size-6" />
              {hasUnviewedFailure && (
                <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-black border border-white">
                  !
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {/* 3. Floating Chat Drawer / Modal */}
      {isOpen && (
        <Card
          className={`fixed z-50 flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden rounded-2xl p-0 gap-0 transition-all duration-300 ease-in-out ${
            isExpanded
              ? "bottom-4 right-4 w-[960px] max-w-[96vw] h-[88vh] max-h-[90vh]"
              : "bottom-20 right-5 w-[440px] max-w-[94vw] h-[600px] max-h-[85vh]"
          }`}
        >
          {/* Header */}
          <CardHeader className="px-4 py-3 border-b flex flex-row items-center justify-between space-y-0 bg-slate-50 dark:bg-slate-950">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                <Bot className="size-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  HUL ERP Assistant
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-emerald-600 border-emerald-300">
                    Online
                  </Badge>
                </CardTitle>
                <p className="text-[11px] text-muted-foreground">Distributor Operations & Diagnostics</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Collapse to compact size" : "Expand to wide size"}
                className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {isExpanded ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleResetChat}
                title="New Chat / Reset"
                className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <RefreshCw className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </Button>
            </div>
          </CardHeader>

          {/* Action Toolbar: Fix Failure quick chip & Model Level Selector */}
          <div className="px-3 py-1.5 border-b bg-slate-100/80 dark:bg-slate-900/70 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Button
                size="sm"
                variant={recentFailure ? "destructive" : "outline"}
                onClick={handleFixFailureClick}
                disabled={loading}
                className="h-7 text-xs flex items-center gap-1.5 shadow-xs font-medium cursor-pointer"
              >
                <AlertTriangle className="size-3.5" />
                Fix Failure
              </Button>
              {recentFailure ? (
                <span className="text-[10px] text-red-600 dark:text-red-400 font-medium truncate max-w-[120px]" title={recentFailure.url}>
                  {recentFailure.method} {recentFailure.status || "Error"}
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                  System Normal
                </span>
              )}
            </div>

            {/* Model Type Selector: Low | Medium | High */}
            <div className="flex items-center gap-0.5 bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-300/40 dark:border-slate-700/50 shrink-0">
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 px-1 select-none">
                Model:
              </span>
              {(["low", "medium", "high"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleModelChange(m)}
                  className={`px-1.5 py-0.5 text-[10px] font-medium rounded-md transition-all capitalize cursor-pointer ${
                    modelType === m
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                  title={
                    m === "low"
                      ? "Low Effort: Fastest response, concise analysis"
                      : m === "medium"
                      ? "Medium Effort: Balanced speed & reasoning (Default)"
                      : "High Effort: Deep reasoning, multi-step analysis"
                  }
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Messages Container */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="size-7 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="size-4" />
                  </div>
                )}
                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed break-words ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-xs max-w-[85%]"
                      : msg.isError
                      ? "bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200 border border-red-200 dark:border-red-900 rounded-bl-xs w-full max-w-full"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-xs border border-slate-200/60 dark:border-slate-700/60 w-full max-w-full"
                  }`}
                >
                  <FormattedContent content={msg.content} />
                  <div
                    className={`text-[9px] mt-1 text-right ${
                      msg.role === "user" ? "text-blue-200" : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="size-7 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="size-4" />
                </div>
                <div className="rounded-2xl rounded-bl-xs px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 text-xs border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2 text-muted-foreground">
                  <span className="flex space-x-1">
                    <span className="size-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="size-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="size-1.5 bg-blue-600 rounded-full animate-bounce"></span>
                  </span>
                  <span>Investigating server logs & domain state...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 border-t bg-slate-50/50 dark:bg-slate-950/50">
            {recentFailure && (
              <div className="mb-2 px-2 py-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg text-[11px] text-amber-800 dark:text-amber-300 flex items-center justify-between">
                <span className="truncate">
                  ⚠️ Error captured: {recentFailure.method} {recentFailure.url?.split("?")[0] || ""}
                </span>
                <div className="flex items-center gap-1.5 shrink-0 ml-1">
                  <span className="text-[10px] text-amber-600 dark:text-amber-400">
                    Type note or hit Send
                  </span>
                  <button
                    onClick={() => setRecentFailure(null)}
                    className="p-0.5 rounded hover:bg-amber-200/60 dark:hover:bg-amber-900/60 text-amber-600 hover:text-amber-900 cursor-pointer transition-colors"
                    title="Dismiss captured error"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                placeholder={
                  recentFailure
                    ? "Describe what failed (or hit Send for auto-fix)..."
                    : "Ask about reports, billing, or operations..."
                }
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <Button
                size="sm"
                onClick={() => {
                  if (!input.trim() && recentFailure) {
                    handleFixFailureClick();
                  } else {
                    handleSendMessage();
                  }
                }}
                disabled={loading || (!input.trim() && !recentFailure)}
                className="h-8 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                title={!input.trim() && recentFailure ? "Auto-diagnose captured failure" : "Send message"}
              >
                <Send className="size-3.5" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}

/**
 * Helper to test if a line is a markdown table delimiter (e.g. | :--- | :---: | ---: |)
 */
function isTableDelimiter(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes("|")) return false;
  const parts = trimmed.split("|").map((p) => p.trim()).filter(Boolean);
  return parts.length > 0 && parts.every((p) => /^:?-+:?$/.test(p));
}

function parseAlignment(cell: string): "left" | "center" | "right" {
  const trimmed = cell.trim();
  const left = trimmed.startsWith(":");
  const right = trimmed.endsWith(":");
  if (left && right) return "center";
  if (right) return "right";
  return "left";
}

function parseTableRow(line: string): string[] {
  const trimmed = line.trim();
  const clean = trimmed.replace(/^\|/, "").replace(/\|$/, "");
  return clean.split("|").map((c) => c.trim());
}

/**
 * Lightweight markdown formatter for tables, code blocks, bold, headers, lists, and <details>.
 */
function FormattedContent({ content }: { content: string }) {
  if (!content) return null;

  // Handle collapsible <details> sections
  const detailsRegex = /<details>([\s\S]*?)<\/details>/g;
  const sections: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = detailsRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      sections.push(
        <PlainMarkdownBlock key={lastIndex} text={content.substring(lastIndex, match.index)} />
      );
    }

    const insideDetails = match[1];
    const summaryMatch = insideDetails.match(/<summary>([\s\S]*?)<\/summary>/);
    const summaryText = summaryMatch ? summaryMatch[1].replace(/<[^>]+>/g, "").trim() : "Technical Details";
    const bodyText = insideDetails.replace(/<summary>[\s\S]*?<\/summary>/, "").trim();

    sections.push(
      <details
        key={match.index}
        className="mt-2 text-[11px] bg-slate-200/50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700"
      >
        <summary className="font-semibold cursor-pointer text-slate-700 dark:text-slate-300 select-none hover:text-foreground">
          {summaryText}
        </summary>
        <div className="mt-2 pt-2 border-t border-slate-300 dark:border-slate-700">
          <PlainMarkdownBlock text={bodyText} />
        </div>
      </details>
    );

    lastIndex = detailsRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    sections.push(<PlainMarkdownBlock key={lastIndex} text={content.substring(lastIndex)} />);
  }

  return <div className="space-y-1 w-full">{sections}</div>;
}

function PlainMarkdownBlock({ text }: { text: string }) {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Fenced code block
    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      nodes.push(
        <pre
          key={`code-${i}`}
          className="my-2 p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[10px] leading-normal overflow-x-auto border border-slate-800"
        >
          {lang && (
            <div className="text-[9px] text-slate-400 uppercase mb-1 font-sans">{lang}</div>
          )}
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    // 2. Markdown Table
    if (trimmed.includes("|") && i + 1 < lines.length && isTableDelimiter(lines[i + 1])) {
      const headers = parseTableRow(lines[i]);
      const delimParts = parseTableRow(lines[i + 1]);
      const alignments = delimParts.map(parseAlignment);
      const rows: string[][] = [];
      i += 2;

      while (i < lines.length && lines[i].trim().includes("|") && lines[i].trim() !== "") {
        rows.push(parseTableRow(lines[i]));
        i++;
      }

      nodes.push(
        <div
          key={`table-${i}`}
          className="my-2.5 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 shadow-xs"
        >
          <table className="w-full border-collapse text-[11px]">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                {headers.map((h, hi) => {
                  const align = alignments[hi] || "left";
                  const alignClass =
                    align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
                  return (
                    <th
                      key={hi}
                      className={`px-3 py-1.5 whitespace-nowrap ${alignClass}`}
                    >
                      {renderInlineStyles(h)}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((r, ri) => (
                <tr
                  key={ri}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                >
                  {r.map((cell, ci) => {
                    const align = alignments[ci] || "left";
                    const alignClass =
                      align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
                    return (
                      <td
                        key={ci}
                        className={`px-3 py-1.5 text-slate-700 dark:text-slate-300 ${alignClass}`}
                      >
                        {renderInlineStyles(cell)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // 3. Blockquote
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      nodes.push(
        <blockquote
          key={`quote-${i}`}
          className="border-l-3 border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 px-3 py-1.5 rounded-r-lg my-1.5 text-slate-700 dark:text-slate-300 text-[11px]"
        >
          {quoteLines.map((ql, qli) => (
            <p key={qli}>{renderInlineStyles(ql)}</p>
          ))}
        </blockquote>
      );
      continue;
    }

    // 4. Empty line / paragraph break
    if (!trimmed) {
      nodes.push(<div key={`empty-${i}`} className="h-1.5" />);
      i++;
      continue;
    }

    // 5. Horizontal rule
    if (trimmed === "---") {
      nodes.push(
        <hr key={`hr-${i}`} className="my-2 border-slate-200 dark:border-slate-700" />
      );
      i++;
      continue;
    }

    // 6. Headers
    if (trimmed.startsWith("#### ")) {
      nodes.push(
        <h5 key={`h4-${i}`} className="font-semibold text-xs mt-2 mb-0.5 text-foreground">
          {renderInlineStyles(trimmed.slice(5))}
        </h5>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith("### ")) {
      nodes.push(
        <h4 key={`h3-${i}`} className="font-bold text-xs mt-2.5 mb-1 text-foreground">
          {renderInlineStyles(trimmed.slice(4))}
        </h4>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      nodes.push(
        <h3 key={`h2-${i}`} className="font-bold text-sm mt-3 mb-1 text-foreground">
          {renderInlineStyles(trimmed.slice(3))}
        </h3>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith("# ")) {
      nodes.push(
        <h2 key={`h1-${i}`} className="font-bold text-base mt-3 mb-1.5 text-foreground">
          {renderInlineStyles(trimmed.slice(2))}
        </h2>
      );
      i++;
      continue;
    }

    // 7. Bullet list
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      nodes.push(
        <div key={`bullet-${i}`} className="flex items-start gap-1.5 pl-1 my-0.5">
          <span className="text-primary mt-1 text-[8px] shrink-0">•</span>
          <span className="flex-1">{renderInlineStyles(trimmed.slice(2))}</span>
        </div>
      );
      i++;
      continue;
    }

    // 8. Numbered list
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      nodes.push(
        <div key={`num-${i}`} className="flex items-start gap-1.5 pl-1 my-0.5">
          <span className="font-semibold text-primary shrink-0">{numMatch[1]}.</span>
          <span className="flex-1">{renderInlineStyles(numMatch[2])}</span>
        </div>
      );
      i++;
      continue;
    }

    // 9. Standard paragraph line
    nodes.push(
      <p key={`p-${i}`} className="leading-relaxed">
        {renderInlineStyles(line)}
      </p>
    );
    i++;
  }

  return <>{nodes}</>;
}

function renderInlineStyles(text: string): React.ReactNode {
  if (!text) return text;
  const parts: React.ReactNode[] = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s)]+))/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.substring(lastIdx, match.index));
    }
    const token = match[0];

    // Inline Code
    if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={match.index}
          className="bg-slate-200/80 dark:bg-slate-700/80 text-pink-600 dark:text-pink-400 px-1 py-0.5 rounded text-[10px] font-mono"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    // Bold
    else if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={match.index} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>
      );
    }
    // Italic
    else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(
        <em key={match.index} className="italic text-foreground">
          {token.slice(1, -1)}
        </em>
      );
    }
    // Markdown Link [text](url)
    else if (match[2] && match[3]) {
      const linkText = match[2];
      const linkUrl = match[3];
      const isDownload =
        linkText.toLowerCase().includes("download") ||
        linkUrl.endsWith(".xlsx") ||
        linkUrl.endsWith(".xls") ||
        linkUrl.endsWith(".csv") ||
        linkUrl.endsWith(".pdf") ||
        linkUrl.includes("/media/exports/");

      if (isDownload) {
        parts.push(
          <a
            key={match.index}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 my-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/80 rounded-lg font-semibold text-xs shadow-xs transition-colors"
          >
            <span>📥</span>
            <span>{linkText}</span>
          </a>
        );
      } else {
        parts.push(
          <a
            key={match.index}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 font-semibold underline underline-offset-2 hover:text-blue-800 dark:hover:text-blue-300 transition-colors inline-flex items-center gap-1"
          >
            {linkText}
          </a>
        );
      }
    }
    // Raw URL
    else if (match[4]) {
      parts.push(
        <a
          key={match.index}
          href={match[4]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 font-semibold underline underline-offset-2 hover:text-blue-800 dark:hover:text-blue-300 transition-colors break-all"
        >
          {match[4]}
        </a>
      );
    }
    lastIdx = regex.lastIndex;
  }

  if (lastIdx < text.length) {
    parts.push(text.substring(lastIdx));
  }

  return parts.length > 0 ? parts : text;
}

