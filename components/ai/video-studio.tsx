"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowUp,
  Download,
  Mic,
  Smartphone,
  Video,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { notifySuccess } from "@/lib/toast";

interface VideoResult {
  url: string;
  prompt: string;
}

const DURATIONS = [
  { value: "5", label: "5 secondes" },
  { value: "10", label: "10 secondes" },
  { value: "15", label: "15 secondes" },
] as const;

function AnimateFromImage({
  sourceImageUrl,
  sourceGenerationId,
}: {
  sourceImageUrl: string;
  sourceGenerationId?: string;
}) {
  const [prompt, setPrompt] = useState("");
  const [durationSeconds, setDurationSeconds] = useState<"5" | "10" | "15">("5");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VideoResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ai/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, durationSeconds, sourceImageUrl, sourceGenerationId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
      } else {
        setResult(data);
        notifySuccess("Votre vidéo est prête !");
      }
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="-m-4 min-h-[calc(100vh-4rem)] bg-zinc-50 px-4 py-8 dark:bg-zinc-950 lg:-m-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[380px_1fr] lg:items-start">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Animer une image
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Décrivez le mouvement à donner à votre création.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={sourceImageUrl} alt="Image à animer" className="max-h-48 w-full object-contain" />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="animate-prompt" className="text-xs font-medium text-zinc-500">
              Mouvement
            </label>
            <textarea
              id="animate-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex : la caméra recule doucement, les nuages défilent en arrière-plan"
              rows={4}
              maxLength={4000}
              className="resize-none rounded-2xl border border-zinc-200 bg-zinc-50 p-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-300 focus-visible:outline-none dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-white dark:placeholder:text-zinc-500"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-zinc-500">Durée</span>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDurationSeconds(d.value)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                    durationSeconds === d.value
                      ? "border-zinc-300 bg-zinc-100 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                      : "border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:border-zinc-800 dark:text-zinc-500 dark:hover:border-zinc-700 dark:hover:text-zinc-300"
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!prompt.trim() || loading}
            className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-medium text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:bg-white dark:text-zinc-900 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-500"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-zinc-900/30 dark:border-t-zinc-900" />
                Animation...
              </>
            ) : (
              <>
                <ArrowUp className="h-4 w-4" />
                Animer
              </>
            )}
          </button>
        </form>

        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 lg:min-h-[600px]">
          {error ? (
            <p className="max-w-sm rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-center text-sm text-danger">
              {error}
            </p>
          ) : loading ? (
            <div className="flex flex-col items-center gap-3 text-zinc-400 dark:text-zinc-500">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-500 dark:border-zinc-800 dark:border-t-zinc-400" />
              <p className="text-sm">Animation en cours...</p>
            </div>
          ) : result ? (
            <div className="flex w-full max-w-lg flex-col items-center gap-4">
              <video controls src={result.url} className="w-full rounded-2xl" />
              <a href={result.url} download target="_blank" rel="noreferrer">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3.5 py-2 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900">
                  <Download className="h-3.5 w-3.5" />
                  Télécharger
                </span>
              </a>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
                <Video className="h-6 w-6" />
              </span>
              <p className="text-sm text-zinc-400 dark:text-zinc-500">
                Votre vidéo apparaîtra ici une fois générée.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Text-to-video (default /ai/video flow) ─────────────────────────────────

const RESOLUTIONS = ["480p", "720p", "1080p"] as const;
type Resolution = (typeof RESOLUTIONS)[number];

const BAR_DURATIONS = ["6", "10", "15"] as const;
type BarDuration = (typeof BAR_DURATIONS)[number];

const RATIOS = ["2:3", "1:1", "16:9", "9:16"] as const;
type Ratio = (typeof RATIOS)[number];

const PILL_ACTIVE = "bg-white text-zinc-900 shadow-sm font-medium dark:bg-zinc-700 dark:text-white";
const PILL_INACTIVE = "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200";

// Minimal typing for the (non-standard, Chromium-only) Web Speech API —
// there's no official DOM lib type for it.
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

function TextToVideo() {
  const [prompt, setPrompt] = useState("");
  const [resolution, setResolution] = useState<Resolution>("720p");
  const [duration, setDuration] = useState<BarDuration>("6");
  const [audioOn, setAudioOn] = useState(true);
  const [ratio, setRatio] = useState<Ratio>("2:3");
  const [ratioMenuOpen, setRatioMenuOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VideoResult | null>(null);

  const ratioMenuRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [speechSupported, setSpeechSupported] = useState(false);

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    setSpeechSupported(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
    return () => recognitionRef.current?.stop();
  }, []);

  useEffect(() => {
    if (!ratioMenuOpen) return;
    function handlePointerDown(e: MouseEvent) {
      if (ratioMenuRef.current && !ratioMenuRef.current.contains(e.target as Node)) {
        setRatioMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [ratioMenuOpen]);

  function toggleListening() {
    if (!speechSupported) return;
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.lang = "fr-FR";
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0]?.transcript ?? "")
        .join(" ");
      setPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ai/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, durationSeconds: duration, resolution }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
      } else {
        setResult(data);
        notifySuccess("Votre vidéo est prête !");
      }
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="-m-4 min-h-[calc(100vh-4rem)] bg-zinc-50 px-4 py-8 dark:bg-zinc-950 lg:-m-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[380px_1fr] lg:items-start">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Générez votre vidéo
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Décrivez la scène ou l&rsquo;action à transformer en vidéo courte.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="video-prompt" className="text-xs font-medium text-zinc-500">
                Prompt
              </label>
              <button
                type="button"
                onClick={toggleListening}
                disabled={!speechSupported}
                title={
                  speechSupported
                    ? listening
                      ? "Arrêter la dictée"
                      : "Dicter le prompt"
                    : "Reconnaissance vocale non supportée par ce navigateur"
                }
                aria-pressed={listening}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                  listening
                    ? "border-red-300 bg-red-50 text-red-500 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400"
                    : "border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                )}
              >
                <Mic className="h-3.5 w-3.5" />
              </button>
            </div>
            <textarea
              id="video-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex : un vaisseau spatial traversant un anneau de saturne, plan large, cinématique"
              rows={5}
              maxLength={4000}
              className="resize-none rounded-2xl border border-zinc-200 bg-zinc-50 p-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-300 focus-visible:outline-none dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-white dark:placeholder:text-zinc-500"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-zinc-500">Résolution</span>
            <div className="flex w-fit items-center gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-800">
              {RESOLUTIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setResolution(r)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs transition-colors",
                    resolution === r ? PILL_ACTIVE : PILL_INACTIVE
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-zinc-500">Durée</span>
            <div className="flex w-fit items-center gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-800">
              {BAR_DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs transition-colors",
                    duration === d ? PILL_ACTIVE : PILL_INACTIVE
                  )}
                >
                  {d}s
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Format</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAudioOn((v) => !v)}
                title={audioOn ? "Audio activé" : "Audio désactivé"}
                aria-pressed={audioOn}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border transition-colors",
                  audioOn
                    ? "border-zinc-300 bg-zinc-100 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                    : "border-zinc-200 text-zinc-400 dark:border-zinc-700 dark:text-zinc-600"
                )}
              >
                {audioOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>

              <div className="relative" ref={ratioMenuRef}>
                <button
                  type="button"
                  onClick={() => setRatioMenuOpen((v) => !v)}
                  className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  {ratio}
                </button>
                {ratioMenuOpen && (
                  <div className="absolute right-0 top-full z-20 mt-1.5 w-24 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                    {RATIOS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          setRatio(r);
                          setRatioMenuOpen(false);
                        }}
                        className={cn(
                          "block w-full px-3 py-1.5 text-left text-xs transition-colors",
                          r === ratio
                            ? "font-medium text-zinc-900 dark:text-white"
                            : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        )}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!prompt.trim() || loading}
            className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-medium text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:bg-white dark:text-zinc-900 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-500"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-zinc-900/30 dark:border-t-zinc-900" />
                Génération...
              </>
            ) : (
              <>
                <ArrowUp className="h-4 w-4" />
                Générer
              </>
            )}
          </button>
        </form>

        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 lg:min-h-[600px]">
          {error ? (
            <p className="max-w-sm rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-center text-sm text-danger">
              {error}
            </p>
          ) : loading ? (
            <div className="flex flex-col items-center gap-3 text-zinc-400 dark:text-zinc-500">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-500 dark:border-zinc-800 dark:border-t-zinc-400" />
              <p className="text-sm">Génération en cours...</p>
            </div>
          ) : result ? (
            <div className="flex w-full max-w-lg flex-col items-center gap-4">
              <video controls src={result.url} className="w-full rounded-2xl" />
              <a href={result.url} download target="_blank" rel="noreferrer">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3.5 py-2 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900">
                  <Download className="h-3.5 w-3.5" />
                  Télécharger
                </span>
              </a>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
                <Video className="h-6 w-6" />
              </span>
              <p className="text-sm text-zinc-400 dark:text-zinc-500">
                Votre vidéo apparaîtra ici une fois générée.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VideoStudioInner() {
  const searchParams = useSearchParams();
  const sourceImageUrl = searchParams.get("sourceUrl");
  const sourceGenerationId = searchParams.get("sourceId") ?? undefined;

  if (sourceImageUrl) {
    return (
      <AnimateFromImage sourceImageUrl={sourceImageUrl} sourceGenerationId={sourceGenerationId} />
    );
  }

  return <TextToVideo />;
}

export function VideoStudio() {
  return (
    <Suspense fallback={null}>
      <VideoStudioInner />
    </Suspense>
  );
}
