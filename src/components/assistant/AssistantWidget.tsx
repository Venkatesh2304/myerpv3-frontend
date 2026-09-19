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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { httpClient } from "@/lib/dataprovider";
import { errorTracker, FailedRequestInfo } from "@/lib/error-tracker";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  isError?: boolean;
  metadata?: any;
}

export function AssistantWidget() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
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
    if (initial) {
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
    // Allow empty prompt if type is check_failure or an active failure is present
    const failureToDiagnose = extraMeta || recentFailure;
    if (!text && type !== "check_failure" && !failureToDiagnose) return;

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
      const currentCompany = sessionStorage.getItem("company") || "";

      // Background request telemetry passed to backend
      const payload = {
        prompt: text, // can be empty or operator's custom description
        type: effectiveType,
        metadata: {
          page: pagePath,
          client_error: failureToDiagnose,
          user: currentUser,
          company: currentCompany,
        },
        conversation_id: conversationId,
      };

      const res = await httpClient.post("/assistant/chat", payload, {
        timeout: 90000,
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
        <Card className="fixed bottom-20 right-5 z-50 w-[430px] max-w-[94vw] h-[600px] max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden rounded-2xl p-0 gap-0 animate-in fade-in slide-in-from-bottom-5 duration-200">
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
                onClick={handleResetChat}
                title="New Chat / Reset"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </Button>
            </div>
          </CardHeader>

          {/* Action Toolbar: Fix Failure quick chip & error indicator */}
          <div className="px-3 py-2 border-b bg-slate-100/80 dark:bg-slate-900/70 flex items-center justify-between gap-2">
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
            <span className="text-[11px] text-muted-foreground truncate max-w-[210px]">
              {recentFailure ? (
                <span className="text-red-600 font-medium truncate">
                  {recentFailure.method} {recentFailure.url?.split("?")[0] || ""} ({recentFailure.status || "Error"})
                </span>
              ) : (
                "System Normal"
              )}
            </span>
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
                  className={`rounded-2xl px-3.5 py-2.5 max-w-[85%] text-xs leading-relaxed break-words ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-xs"
                      : msg.isError
                      ? "bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200 border border-red-200 dark:border-red-900 rounded-bl-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-xs border border-slate-200/60 dark:border-slate-700/60"
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
                <span className="text-[10px] text-amber-600 dark:text-amber-400 shrink-0 ml-1">
                  Type note or hit Send
                </span>
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
 * Lightweight markdown-like formatter for code blocks, bold, headers, lists, and <details>.
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
        className="mt-2 text-[11px] bg-slate-200/50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-300 dark:border-slate-700"
      >
        <summary className="font-semibold cursor-pointer text-slate-700 dark:text-slate-300 select-none">
          {summaryText}
        </summary>
        <div className="mt-1.5 pt-1 border-t border-slate-300 dark:border-slate-700">
          <PlainMarkdownBlock text={bodyText} />
        </div>
      </details>
    );

    lastIndex = detailsRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    sections.push(<PlainMarkdownBlock key={lastIndex} text={content.substring(lastIndex)} />);
  }

  return <div className="space-y-1">{sections}</div>;
}

function PlainMarkdownBlock({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <>
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Header ###
        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={idx} className="font-bold text-xs mt-2 mb-0.5 text-foreground">
              {renderInlineStyles(trimmed.slice(4))}
            </h4>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h3 key={idx} className="font-bold text-sm mt-2 mb-1 text-foreground">
              {renderInlineStyles(trimmed.slice(3))}
            </h3>
          );
        }

        // Horizontal rule
        if (trimmed === "---") {
          return <hr key={idx} className="my-1.5 border-slate-200 dark:border-slate-700" />;
        }

        // Bullet point
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1">
              <span className="text-primary mt-1 text-[8px]">•</span>
              <span className="flex-1">{renderInlineStyles(trimmed.slice(2))}</span>
            </div>
          );
        }

        // Numbered list
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1">
              <span className="font-semibold text-primary">{numMatch[1]}.</span>
              <span className="flex-1">{renderInlineStyles(numMatch[2])}</span>
            </div>
          );
        }

        // Standard line
        return <p key={idx}>{renderInlineStyles(line)}</p>;
      })}
    </>
  );
}

function renderInlineStyles(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.substring(lastIdx, match.index));
    }
    const token = match[0];
    if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={match.index}
          className="bg-slate-200/80 dark:bg-slate-700/80 text-pink-600 dark:text-pink-400 px-1 py-0.5 rounded text-[10px] font-mono"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={match.index} className="font-semibold">
          {token.slice(2, -2)}
        </strong>
      );
    }
    lastIdx = regex.lastIndex;
  }

  if (lastIdx < text.length) {
    parts.push(text.substring(lastIdx));
  }

  return parts.length > 0 ? parts : text;
}
