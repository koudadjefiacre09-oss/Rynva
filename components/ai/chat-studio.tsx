"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Bot, User, Plus, Trash2, History, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { deleteConversation, loadConversation } from "@/app/(app)/ai/chat/actions";
import type { ChatConversation } from "@/lib/chat/types";

type Message = { role: "user" | "assistant"; content: string };

// Inspired by the reference's quick-action chips — but RYNVA's chat is a
// creative brainstorming assistant, not a task manager, so these prefill the
// input with real things it can actually help with, not fake "create a
// task" / "generate report" actions it doesn't support.
const QUICK_PROMPTS = [
  "Aide-moi à affiner mon prompt pour une image",
  "Trouve-moi des idées de concept créatif",
  "Rédige une description pour ma création",
  "Améliore ce texte",
];

function truncateTitle(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  return trimmed.length > 60 ? `${trimmed.slice(0, 60)}…` : trimmed;
}

export function ChatStudio({ initialConversations = [] }: { initialConversations?: ChatConversation[] }) {
  const [conversations, setConversations] = useState<ChatConversation[]>(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(content: string) {
    const trimmed = content.trim();
    if (!trimmed || loading) return;

    const nextMessages: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, conversationId: activeId ?? undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        return;
      }

      setMessages((prev) => [...prev, data.message]);

      // First message of a brand new conversation — the server just
      // created the row; reflect it in the sidebar without a refetch.
      if (data.conversationId && data.conversationId !== activeId) {
        setActiveId(data.conversationId);
        setConversations((prev) => [
          { id: data.conversationId, title: truncateTitle(trimmed), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          ...prev,
        ]);
      } else if (data.conversationId) {
        // Existing conversation just got a new exchange — bump it to the top.
        setConversations((prev) => {
          const target = prev.find((c) => c.id === data.conversationId);
          if (!target) return prev;
          return [{ ...target, updatedAt: new Date().toISOString() }, ...prev.filter((c) => c.id !== data.conversationId)];
        });
      }
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await send(input);
  }

  function startNewConversation() {
    setActiveId(null);
    setMessages([]);
    setError(null);
    setMobileHistoryOpen(false);
  }

  async function selectConversation(id: string) {
    if (id === activeId) {
      setMobileHistoryOpen(false);
      return;
    }
    setSwitching(true);
    setError(null);
    try {
      const rows = await loadConversation(id);
      setMessages(rows.map((r) => ({ role: r.role, content: r.content })));
      setActiveId(id);
    } finally {
      setSwitching(false);
      setMobileHistoryOpen(false);
    }
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!window.confirm("Supprimer cette conversation ?")) return;
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (id === activeId) startNewConversation();
    await deleteConversation(id);
  }

  const sidebarContent = (
    <>
      <button
        type="button"
        onClick={startNewConversation}
        className="mx-3 mt-3 flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        <Plus className="h-4 w-4" />
        Nouvelle conversation
      </button>

      <div className="mt-3 flex-1 overflow-y-auto px-2 pb-3">
        {conversations.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
            Vos conversations apparaîtront ici.
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {conversations.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => selectConversation(c.id)}
                className={cn(
                  "group flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                  c.id === activeId
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{c.title}</span>
                  <span className="block text-[11px] text-zinc-400 dark:text-zinc-500">
                    {formatRelativeTime(c.updatedAt)}
                  </span>
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => handleDelete(e, c.id)}
                  aria-label="Supprimer la conversation"
                  className="shrink-0 rounded-lg p-1.5 text-zinc-300 opacity-0 transition-opacity hover:bg-zinc-200 hover:text-zinc-600 group-hover:opacity-100 dark:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* History — persistent column on desktop, overlay drawer on mobile
          (chat conversations only exist for signed-in users, so this whole
          column is empty/hidden for guests until they sign up). */}
      <div className="hidden w-64 shrink-0 flex-col rounded-3xl border border-zinc-200/60 bg-white shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900 dark:shadow-none lg:flex">
        {sidebarContent}
      </div>

      {mobileHistoryOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileHistoryOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-2xl dark:bg-zinc-900">
            <div className="flex items-center justify-between px-4 pt-4">
              <span className="text-sm font-semibold text-zinc-900 dark:text-white">Historique</span>
              <button
                type="button"
                onClick={() => setMobileHistoryOpen(false)}
                aria-label="Fermer"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main conversation panel — fills the remaining width instead of a
          narrow centered column, now that there's a sidebar alongside it. */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-zinc-200/60 bg-white shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900 dark:shadow-none">
        <div className="flex items-center gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setMobileHistoryOpen(true)}
            aria-label="Ouvrir l'historique"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white lg:hidden"
          >
            <History className="h-4 w-4" />
          </button>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-brand text-white">
            <Bot className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
              Assistant RYNVA
            </h1>
            <p className="text-xs text-zinc-500">
              Explorez des idées, affinez un prompt, itérez sur un texte.
            </p>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {switching ? (
            <div className="flex h-full items-center justify-center">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-500 dark:border-zinc-800 dark:border-t-zinc-400" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
              <p className="text-sm text-zinc-400 dark:text-zinc-500">
                Posez une question pour démarrer la conversation.
              </p>
              <div className="grid w-full max-w-md grid-cols-1 gap-2 sm:grid-cols-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => send(prompt)}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-left text-xs text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800/60 dark:bg-zinc-800/40 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message, i) => (
              <div key={i} className={cn("flex gap-3", message.role === "user" && "flex-row-reverse")}>
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    message.role === "user" ? "bg-zinc-100 dark:bg-zinc-800" : "bg-gradient-brand"
                  )}
                >
                  {message.role === "user" ? (
                    <User className="h-4 w-4 text-zinc-500" />
                  ) : (
                    <Bot className="h-4 w-4 text-white" />
                  )}
                </div>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                    message.role === "user"
                      ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                      : "border border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-brand">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="flex items-center gap-1 rounded-2xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-300 [animation-delay:-0.3s] dark:bg-zinc-600" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-300 [animation-delay:-0.15s] dark:bg-zinc-600" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-300 dark:bg-zinc-600" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {error && (
          <p className="mx-5 mb-3 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2 border-t border-zinc-100 p-3 dark:border-zinc-800">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Écrivez votre message..."
            className="h-11 flex-1 rounded-full border border-zinc-200 bg-zinc-100/80 px-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-white dark:placeholder:text-zinc-500 dark:focus-visible:border-zinc-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Envoyer"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-zinc-300 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
