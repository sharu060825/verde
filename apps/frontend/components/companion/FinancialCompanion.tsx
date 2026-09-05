'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { VerdeIcon } from '@/components/VerdeIcon';
import { X, Send, Sparkles, ArrowRight } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  followups?: string[];
  timestamp: string;
}

interface ProactiveInsight {
  id: string;
  type: 'ALERT' | 'OPPORTUNITY' | 'ACHIEVEMENT' | 'INFO';
  message: string;
  actionPrompt?: string;
  actionQuery?: string;
}

export function FinancialCompanion() {
  const { user } = useAuth();
  const pathname = usePathname();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [proactiveInsight, setProactiveInsight] = useState<ProactiveInsight | null>(null);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const launcherRef = useRef<HTMLButtonElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isChatOpen) {
        setIsChatOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isChatOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isChatOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        launcherRef.current &&
        !launcherRef.current.contains(e.target as Node)
      ) {
        setIsChatOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isChatOpen]);

  // Fetch initial proactive insights
  useEffect(() => {
    if (!user) return;

    apiFetch<{ insights: ProactiveInsight[] }>(`/api/chat/proactive?page=${pathname}`)
      .then((res) => {
        if (res.insights && res.insights.length > 0) {
          setProactiveInsight(res.insights[0]);
        }
      })
      .catch(() => {});
  }, [user, pathname]);

  // Contextual page suggestions
  const getContextualSuggestions = () => {
    switch (pathname) {
      case '/analytics':
        return [
          'Where am I overspending?',
          'Analyze this month',
          'How much can I save?',
        ];
      case '/budgets':
        return [
          'Check my budgets',
          'Where am I overspending?',
          'How much can I spend this week?',
        ];
      case '/expenses':
        return [
          'Show me my biggest expenses',
          'Where is my money going?',
          'How much can I save?',
        ];
      default:
        return [
          'Where is my money going?',
          'Where am I overspending?',
          'How much can I spend this week?',
          'How much can I save?',
        ];
    }
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, isChatOpen]);

  // Focus input on panel open
  useEffect(() => {
    if (isChatOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isChatOpen]);

  // Do not render for unauthenticated visitors or auth pages
  if (!user || pathname === '/login' || pathname === '/register') {
    return null;
  }

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isThinking) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await apiFetch<{
        reply: string;
        suggested_followups?: string[];
        proactive_insights?: ProactiveInsight[];
      }>('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: query,
          history: historyPayload,
          currentPage: pathname,
        }),
      });

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        followups: res.suggested_followups,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (res.proactive_insights && res.proactive_insights.length > 0) {
        setProactiveInsight(res.proactive_insights[0]);
      }
    } catch {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: "I'm unable to connect to your financial records at the moment. Please try again shortly.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  const formatMessageText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <div key={lineIdx} className={line.trim() === '' ? 'h-2' : 'my-0.5'}>
          {parts.map((part, partIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={partIdx} className="font-semibold text-[#0a0d0b]">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return <span key={partIdx}>{part}</span>;
          })}
        </div>
      );
    });
  };

  return (
    <>
      {/* Launcher Button (Bottom-Right) */}
      <div className="fixed bottom-5 right-5 z-40 pointer-events-none">
        {!isChatOpen && (
          <button
            ref={launcherRef}
            type="button"
            aria-label="Open financial companion"
            onClick={() => setIsChatOpen(true)}
            className="pointer-events-auto flex items-center gap-2.5 rounded-2xl border border-[#e6ebe8] bg-white px-4 py-2.5 shadow-lg shadow-black/8 transition hover:border-[#15803d] hover:bg-[#f0fdf4]"
          >
            <VerdeIcon size="sm" isThinking={false} />
            <span className="text-xs font-semibold text-[#0a0d0b]">Financial Companion</span>
            {proactiveInsight && (
              <span className="h-2 w-2 rounded-full bg-[#15803d]" title="Observation available" />
            )}
          </button>
        )}
      </div>

      {/* Assistant Panel / Bottom Sheet */}
      <AnimatePresence>
        {isChatOpen && (
          <>
            {/* Backdrop for Mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setIsChatOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs sm:hidden"
            />

            {/* Panel */}
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed inset-x-0 bottom-0 z-50 flex h-[82vh] flex-col border-t border-[#e6ebe8] bg-white text-[#0a0d0b] shadow-2xl sm:bottom-5 sm:right-5 sm:left-auto sm:h-[580px] sm:w-[400px] sm:rounded-2xl sm:border sm:border-[#e6ebe8]"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#e6ebe8] bg-white px-4 py-3 sm:rounded-t-2xl">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#e6ebe8] bg-[#f0fdf4]">
                    <VerdeIcon size="sm" isThinking={isThinking} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-bold tracking-wide text-[#0a0d0b] uppercase">Financial Companion</h3>
                      <span className="rounded-md bg-[#f0fdf4] px-1.5 py-0.2 text-[9px] font-semibold text-[#15803d] border border-[#bbf7d0]">
                        VERDE
                      </span>
                    </div>
                    <p className="text-[10px] text-[#4b554f]">Contextual financial intelligence</p>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label="Close financial companion"
                  onClick={() => setIsChatOpen(false)}
                  className="rounded-lg p-1.5 text-[#838e87] hover:bg-[#f8faf9] hover:text-[#0a0d0b] transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Proactive Observation Header Chip */}
              {proactiveInsight && (
                <div className="border-b border-[#bbf7d0] bg-[#f0fdf4] p-3 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-[#15803d] font-semibold">
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Financial Observation
                    </span>
                    <button
                      type="button"
                      onClick={() => setProactiveInsight(null)}
                      className="text-[#838e87] hover:text-[#0a0d0b]"
                      aria-label="Dismiss observation"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="mt-1 text-[#0f5132] text-[11px] leading-snug">{proactiveInsight.message}</p>
                  {proactiveInsight.actionQuery && (
                    <button
                      type="button"
                      onClick={() => handleSendMessage(proactiveInsight.actionQuery)}
                      className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#15803d] hover:underline"
                    >
                      <span>{proactiveInsight.actionPrompt || 'Explore details'}</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}

              {/* Message Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs bg-[#f8faf9]/50">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-2">
                    <VerdeIcon size="lg" isThinking={false} />
                    <p className="mt-3 text-xs font-bold text-[#0a0d0b] uppercase tracking-wider">
                      Connected to your financial data
                    </p>
                    <p className="mt-1 text-[11px] text-[#4b554f] max-w-xs">
                      Ask about your balances, spending leaks, category trends, or affordability limits.
                    </p>

                    <div className="mt-4 flex flex-col gap-1.5 w-full max-w-xs text-left">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#838e87]">
                        Suggested Queries
                      </span>
                      {getContextualSuggestions().map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendMessage(suggestion)}
                          className="rounded-xl border border-[#e6ebe8] bg-white p-2.5 text-left text-[11px] text-[#0a0d0b] transition hover:border-[#15803d] hover:bg-[#f0fdf4] shadow-xs"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[88%] rounded-2xl p-3 leading-relaxed text-[11px] ${
                          m.role === 'user'
                            ? 'bg-[#15803d] text-white'
                            : 'bg-white text-[#0a0d0b] border border-[#e6ebe8] shadow-2xs'
                        }`}
                      >
                        {formatMessageText(m.content)}
                      </div>
                      <span className="mt-0.5 px-1 text-[9px] text-[#838e87]">{m.timestamp}</span>

                      {/* Follow-up suggestion pills */}
                      {m.role === 'assistant' && m.followups && m.followups.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {m.followups.map((chip, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSendMessage(chip)}
                              className="rounded-full border border-[#d1d8d3] bg-white px-2.5 py-0.5 text-[10px] text-[#4b554f] transition hover:border-[#15803d] hover:text-[#15803d]"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}

                {/* Subtle Thinking State */}
                {isThinking && (
                  <div className="flex items-center gap-2 text-[11px] text-[#15803d] bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-2.5 max-w-fit">
                    <VerdeIcon size="sm" isThinking />
                    <span>Analyzing financial ledger...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions Bar */}
              {messages.length > 0 && !isThinking && (
                <div className="flex gap-1.5 overflow-x-auto border-t border-[#e6ebe8] bg-white px-3 py-1.5 text-[10px] scrollbar-none">
                  {getContextualSuggestions().map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(suggestion)}
                      className="shrink-0 rounded-full border border-[#e6ebe8] bg-[#f8faf9] px-2.5 py-1 text-[#4b554f] hover:border-[#15803d] hover:text-[#15803d]"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {/* Message Input */}
              <div className="border-t border-[#e6ebe8] bg-white p-3 sm:rounded-b-2xl">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2 rounded-xl border border-[#d1d8d3] bg-[#f8faf9] px-3 py-1.5 focus-within:border-[#15803d] focus-within:bg-white transition"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about your finances..."
                    className="flex-1 bg-transparent text-xs text-[#0a0d0b] placeholder-[#838e87] outline-none"
                    disabled={isThinking}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isThinking}
                    className="rounded-lg bg-[#15803d] p-1.5 text-white transition hover:bg-[#166534] disabled:opacity-40"
                    title="Send query"
                  >
                    <Send className="h-3 w-3" />
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
