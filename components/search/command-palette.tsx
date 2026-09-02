"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { AI_TOOLS, type AiTool } from "@/lib/ai-tools";
import { TYPE_LABEL } from "@/components/gallery/project-card";
import type { GenerationWithUrl } from "@/lib/generations/list";

// Types whose signed URL is a static image — safe to use directly as a thumbnail.
const IMAGE_TYPES = new Set(["image", "design", "photo-bg-remove", "photo-enhance", "scene"]);

type ResultKind = "tool" | "project";

interface Result {
  kind: ResultKind;
  key: string;
  label: string;
  sublabel: string;
  href: string;
  imageSrc?: string;
  thumbnailUrl?: string;
}

export function CommandPalette({ recentGenerations = [] }: { recentGenerations?: GenerationWithUrl[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global ⌘K / Ctrl+K listener — works from anywhere in the app shell.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      // Wait a frame so the input exists before focusing.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const toolResults: Result[] = useMemo(
    () =>
      AI_TOOLS.map((tool: AiTool) => ({
        kind: "tool" as const,
        key: tool.href,
        label: `AI ${tool.label}`,
        sublabel: tool.desc,
        href: tool.href,
        imageSrc: tool.imageSrc,
      })),
    []
  );

  const projectResults: Result[] = useMemo(
    () =>
      recentGenerations.map((item) => ({
        kind: "project" as const,
        key: item.id,
        label: item.prompt?.trim() || TYPE_LABEL[item.type],
        sublabel: TYPE_LABEL[item.type],
        href: "/projects",
        thumbnailUrl: IMAGE_TYPES.has(item.type) ? item.url : undefined,
      })),
    [recentGenerations]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = [...toolResults, ...projectResults];
    if (!q) return all;
    return all.filter(
      (r) => r.label.toLowerCase().includes(q) || r.sublabel.toLowerCase().includes(q)
    );
  }, [query, toolResults, projectResults]);

  const filteredTools = results.filter((r) => r.kind === "tool");
  const filteredProjects = results.filter((r) => r.kind === "project");

  function go(result: Result) {
    setOpen(false);
    router.push(result.href);
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = results[activeIndex];
      if (target) go(target);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden flex-1 items-center gap-2.5 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-left text-sm text-zinc-400 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500 dark:hover:border-zinc-700 sm:flex"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">Rechercher un outil, un projet...</span>
        <kbd className="shrink-0 rounded-md border border-zinc-300 bg-white px-1.5 py-0.5 text-[11px] font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
          ⌘K
        </kbd>
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Rechercher"
        className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white sm:hidden"
      >
        <Search className="h-4.5 w-4.5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 p-4 pt-[15vh] backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Recherche"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center gap-3 border-b border-zinc-100 px-4 dark:border-zinc-800">
              <Search className="h-4.5 w-4.5 shrink-0 text-zinc-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleInputKeyDown}
                placeholder="Rechercher un outil ou un projet..."
                className="h-14 flex-1 bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none dark:text-white dark:placeholder:text-zinc-500"
              />
              <kbd className="hidden shrink-0 rounded-md border border-zinc-200 px-1.5 py-0.5 text-[11px] font-medium text-zinc-400 dark:border-zinc-700 dark:text-zinc-500 sm:inline">
                Échap
              </kbd>
            </div>

            <div className="max-h-96 overflow-y-auto p-2">
              {results.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-zinc-400">Aucun résultat.</p>
              ) : (
                <>
                  {filteredTools.length > 0 && (
                    <ResultGroup label="Outils IA">
                      {filteredTools.map((r) => (
                        <ResultRow
                          key={r.key}
                          result={r}
                          active={results.indexOf(r) === activeIndex}
                          onHover={() => setActiveIndex(results.indexOf(r))}
                          onSelect={() => go(r)}
                        />
                      ))}
                    </ResultGroup>
                  )}
                  {filteredProjects.length > 0 && (
                    <ResultGroup label="Projets récents">
                      {filteredProjects.map((r) => (
                        <ResultRow
                          key={r.key}
                          result={r}
                          active={results.indexOf(r) === activeIndex}
                          onHover={() => setActiveIndex(results.indexOf(r))}
                          onSelect={() => go(r)}
                        />
                      ))}
                    </ResultGroup>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ResultGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1 last:mb-0">
      <p className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-600">
        {label}
      </p>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function ResultRow({
  result,
  active,
  onHover,
  onSelect,
}: {
  result: Result;
  active: boolean;
  onHover: () => void;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onMouseEnter={onHover}
      onClick={onSelect}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors",
        active ? "bg-zinc-100 dark:bg-zinc-800" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
      )}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
        {result.imageSrc ? (
          <Image src={result.imageSrc} alt="" width={36} height={36} className="h-full w-full object-contain" />
        ) : result.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={result.thumbnailUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs font-semibold text-zinc-400">{result.sublabel[0]}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">{result.label}</p>
        <p className="truncate text-xs text-zinc-500">{result.sublabel}</p>
      </div>
    </button>
  );
}
