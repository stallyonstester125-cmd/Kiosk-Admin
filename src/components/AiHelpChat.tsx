"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { Bot, LoaderCircle, MessageCircle, Send, Trash2, X } from "lucide-react";
import { AiSupportMessage, getAiSupportReply } from "@/lib/admin-api";
import { usePathname } from "next/navigation";

const QUICK_QUESTIONS = [
  "How does Kitchen work?",
  "How do I add a product?",
  "How do permissions work?",
  "How do I create a coupon?",
  "How do I manage staff?",
  "How do I export transactions?",
];
const MAX_HISTORY = 12;

export default function AiHelpChat() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<AiSupportMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEditModalChange = (event: CustomEvent) => {
      setIsEditModalOpen(event.detail.isEditing);
    };
    window.addEventListener('edit-modal-state-change', handleEditModalChange as EventListener);
    return () => window.removeEventListener('edit-modal-state-change', handleEditModalChange as EventListener);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending, isOpen]);

  const sendMessage = async (value = message) => {
    const content = value.trim();
    if (!content || isSending) return;

    const previousConversation = messages.slice(-MAX_HISTORY);
    const userMessage: AiSupportMessage = { role: "user", content };
    setMessages((current) => [...current, userMessage]);
    setMessage("");
    setError("");
    setIsSending(true);
    try {
      const reply = await getAiSupportReply({
        message: content,
        conversation: previousConversation,
        currentPath: pathname,
      });
      const assistantMessage: AiSupportMessage = { role: "assistant", content: reply };
      setMessages((current) => [...current, assistantMessage].slice(-MAX_HISTORY));
    } catch {
      setError("AI Help is temporarily unavailable. Please try again in a moment.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  // Open chat
  const openChat = () => {
    setIsOpen(true);
  };

  // Render the floating launcher button (shown when chat is closed)
  const floatingButton = (
    <button
      type="button"
      onClick={openChat}
      className="fixed bottom-5 right-4 sm:bottom-24 sm:right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-orange)] text-white shadow-lg transition hover:bg-[var(--brand-orange-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-orange)] focus:ring-offset-2"
      aria-label="Open AI Help"
      title="POS Admin Help"
    >
      <MessageCircle className="h-6 w-6" />
    </button>
  );

  // Render the chat panel when open
  const chatPanel = (
    <section
      className="fixed bottom-3 right-3 z-50 flex h-[min(520px,calc(100vh-24px))] w-[calc(100vw-24px)] max-w-[380px] sm:bottom-6 sm:right-6 sm:h-[min(520px,calc(100vh-48px))] sm:w-[calc(100vw-48px)] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
      aria-label="AI Help Assistant"
      style={{
        right: "12px",
        bottom: "12px",
      }}
    >
      {/* Header - Fixed */}
      <header className="flex-shrink-0 flex items-center justify-between bg-[var(--brand-orange)] px-4 py-3 text-white rounded-t-2xl">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <div>
            <h2 className="text-sm font-semibold">POS Admin Help</h2>
            <p className="text-xs text-white/80">Ask about this Admin Panel</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setMessages([]);
              setError("");
            }}
            className="rounded p-1.5 hover:bg-white/20"
            aria-label="Clear conversation"
            title="Clear conversation"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded p-1.5 hover:bg-white/20"
            aria-label="Close AI Help"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Message Area - Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              I can explain the documented Admin Panel features and permissions.
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_QUESTIONS.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => void sendMessage(question)}
                  disabled={isSending}
                  className="rounded-full border border-[var(--brand-orange)] px-3 py-1.5 text-left text-xs font-medium text-[var(--brand-orange)] hover:bg-[var(--brand-orange-light)] disabled:opacity-50"
                >
                  {question}
                </button>
              ))}
            </div>
          </>
        )}
        {messages.map((chatMessage, index) => (
          <div
            key={`${chatMessage.role}-${index}`}
            className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
              chatMessage.role === "user"
                ? "ml-auto bg-[var(--brand-orange)] text-white"
                : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
            }`}
          >
            {chatMessage.content}
          </div>
        ))}
        {isSending && (
          <div className="flex items-center gap-2 rounded-2xl bg-zinc-100 px-3 py-2 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Thinking…
          </div>
        )}
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Footer - Fixed */}
      <form onSubmit={handleSubmit} className="flex-shrink-0 flex items-end gap-2 border-t border-zinc-200 p-3 dark:border-zinc-700">
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={2000}
          rows={2}
          placeholder="Ask a question…"
          className="min-w-0 flex-1 resize-none rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-[var(--brand-orange)] focus:ring-1 focus:ring-[var(--brand-orange)] dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
        />
        <button
          type="submit"
          disabled={isSending || !message.trim()}
          className="flex-shrink-0 rounded-lg bg-[var(--brand-orange)] p-2.5 text-white hover:bg-[var(--brand-orange-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </section>
  );

  return (
    <div className="fixed bottom-5 right-4 z-50 sm:bottom-6 sm:right-6">
      {!isMobile || !isEditModalOpen ? (
        isOpen ? chatPanel : floatingButton
      ) : null}
    </div>
  );
}
