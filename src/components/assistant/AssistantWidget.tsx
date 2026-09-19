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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
        "Hello! I am your **ERP Assistant**.\n\nIf you encounter any error or unexpected behavior, click **Check Failure** to run an automated root-cause diagnosis.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [recentFailure, setRecentFailure] = useState<FailedRequestInfo | null>(null);
  const [hasUnviewedFailure, setHasUnviewedFailure] = useState<boolean>(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Subscribe to error tracker
  useEffect(() => {
    const unsubscribe = errorTracker.subscribe(() => {
      const latest = errorTracker.getLatest();
      setRecentFailure(latest);
      if (latest) {
        setHasUnviewedFailure(true);
      }
    });

    const initial = errorTracker.getLatest();
    if (initial) {
      setRecentFailure(initial);
      setHasUnviewedFailure(true);
    }

    return () => {
      unsubscribe();
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setHasUnviewedFailure(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend?: string, type = "chat", extraMeta?: any) => {
    const text = (textToSend !== undefined ? textToSend : input).trim();
    if (!text && type !== "check_failure") return;

    const userMsgId = `user-${Date.now()}`;
    const newMessages: ChatMessage[] = [
      ...messages,
      {
        id: userMsgId,
        role: "user",
        content: text || (type === "check_failure" ? "Investigate recent failure on this page" : ""),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        metadata: extraMeta,
      },
    ];

    setMessages(newMessages);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const pagePath = window.location.pathname + window.location.search;
      const currentUser = sessionStorage.getItem("username") || "operator";
      const currentCompany = sessionStorage.getItem("company") || "";

      const payload = {
        prompt: text || "Diagnose why the last request failed.",
        type,
        metadata: {
          page: pagePath,
          client_error: extraMeta || recentFailure,
          user: currentUser,
          company: currentCompany,
        },
        conversation_id: conversationId,
      };

      const res = await httpClient.post("/assistant/chat", payload, {
        timeout: 120000,
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

  const handleCheckFailure = () => {
    const latest = errorTracker.getLatest();
    const promptText = latest?.url
      ? `Check failure for request: ${latest.method || "POST"} ${latest.url} (Status ${latest.status || "failed"})`
      : "Check failure for recent operation on this page";

    handleSendMessage(promptText, "check_failure", latest);
  };

  const handleResetChat = () => {
    setConversationId(null);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content:
          "Conversation reset.\n\nHow can I help you? If something went wrong, click **Check Failure** above.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
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

      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <Card className="fixed bottom-20 right-5 z-50 w-[420px] max-w-[92vw] h-[580px] max-h-[82vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden rounded-2xl p-0 gap-0 animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <CardHeader className="px-4 py-3 border-b flex flex-row items-center justify-between space-y-0 bg-slate-50 dark:bg-slate-950">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                <Bot className="size-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  ERP Assistant
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-emerald-600 border-emerald-300">
                    Online
                  </Badge>
                </CardTitle>
                <p className="text-[11px] text-muted-foreground">Diagnostics & Ops Guide</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleResetChat}
                title="New Chat / Reset"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsOpen(false)}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </Button>
            </div>
          </CardHeader>

          {/* Action Toolbar */}
          <div className="px-3 py-2 border-b bg-slate-100/70 dark:bg-slate-900/60 flex items-center justify-between gap-2">
            <Button
              size="sm"
              variant={hasUnviewedFailure || recentFailure ? "destructive" : "outline"}
              onClick={handleCheckFailure}
              disabled={loading}
              className="h-7 text-xs flex items-center gap-1.5 shadow-xs font-medium"
            >
              <AlertTriangle className="size-3.5" />
              Check Failure
            </Button>
            <span className="text-[11px] text-muted-foreground truncate max-w-[190px]">
              {recentFailure ? (
                <span className="text-red-600 font-medium">
                  {recentFailure.method} {recentFailure.status || "err"}
                </span>
              ) : (
                "No active errors"
              )}
            </span>
          </div>

          {/* Messages Area */}
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
                  <span>Investigating logs & system state...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 border-t bg-slate-50/50 dark:bg-slate-950/50">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                placeholder="Ask assistant or describe the issue..."
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <Button
                size="sm"
                onClick={() => handleSendMessage()}
                disabled={loading || !input.trim()}
                className="h-8 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
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
 * Lightweight markdown-like formatter for code blocks, bold, headers, and bullet points.
 */
function FormattedContent({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split("\n");

  return (
    <div className="space-y-1">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Empty line
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Header ###
        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={idx} className="font-bold text-xs mt-1.5 mb-0.5 text-foreground">
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
    </div>
  );
}

function renderInlineStyles(text: string): React.ReactNode {
  // Parse inline `code` and **bold**
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
