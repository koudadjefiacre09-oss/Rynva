"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

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

export function ChatStudio() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
      } else {
        setMessages((prev) => [...prev, data.message]);
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

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col gap-4">
      <div className="flex items-center gap-3">
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

      <div className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-zinc-200/60 bg-white shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900 dark:shadow-none">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.length === 0 ? (
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
