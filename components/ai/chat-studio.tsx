"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };

export function ChatStudio() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
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

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
          Chat
        </h1>
        <p className="mt-1 text-sm text-zinc-500">Discutez avec l&apos;assistant RYNVA.</p>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-zinc-200/60 bg-white shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900 dark:shadow-none">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.length === 0 && (
            <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">
              Posez une question pour démarrer la conversation.
            </p>
          )}
          {messages.map((message, i) => (
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
          ))}
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
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
