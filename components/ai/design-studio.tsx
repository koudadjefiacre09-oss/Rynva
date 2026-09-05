"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { GenerationStudio } from "@/components/ai/generation-studio";

interface DesignResult {
  url: string;
  prompt: string;
  generationId?: string;
}

export function DesignStudio() {
  return (
    <GenerationStudio<DesignResult>
      title="AI Design"
      description="Décrivez le design à créer : message, style visuel, palette."
      endpoint="/api/ai/design"
      successMessage="Votre design est prêt !"
      placeholder="Ex : une affiche de lancement produit, style minimaliste, dégradé violet/bleu"
      fields={[
        {
          name: "format",
          label: "Format",
          options: [
            { value: "post", label: "Post réseaux sociaux" },
            { value: "story", label: "Story" },
            { value: "poster", label: "Affiche" },
            { value: "banner", label: "Bannière" },
          ],
        },
      ]}
      renderResult={(result) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={result.url} alt={result.prompt} className="w-full rounded-md" />
      )}
      renderExtraActions={(result) => (
        <Link
          href={`/ai/video?sourceUrl=${encodeURIComponent(result.url)}${
            result.generationId ? `&sourceId=${result.generationId}` : ""
          }`}
          className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3.5 py-2 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Animer
        </Link>
      )}
    />
  );
}
