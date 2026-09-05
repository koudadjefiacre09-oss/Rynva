"use client";

import { AudioLines } from "lucide-react";
import { GenerationStudio } from "@/components/ai/generation-studio";

interface AudioResult {
  url: string;
  prompt: string;
}

export function AudioStudio() {
  return (
    <GenerationStudio<AudioResult>
      title="Générez votre audio"
      description="Décrivez la voix off, musique ou effet sonore que vous voulez générer."
      endpoint="/api/ai/audio"
      successMessage="Votre audio est prêt !"
      placeholder="Ex : une voix off chaleureuse annonçant le lancement de RYNVA, ton confiant"
      emptyIcon={AudioLines}
      emptyLabel="Votre audio apparaîtra ici une fois généré."
      fields={[
        {
          name: "voice",
          label: "Voix",
          options: [
            { value: "neutral", label: "Neutre" },
            { value: "warm", label: "Chaleureuse" },
            { value: "energetic", label: "Énergique" },
            { value: "narration", label: "Narration" },
          ],
        },
      ]}
      renderResult={(result) => (
        <div className="flex w-full flex-col items-center justify-center gap-4 rounded-2xl bg-zinc-100 p-6 dark:bg-zinc-800/60">
          <AudioLines className="h-10 w-10 text-zinc-400 dark:text-zinc-500" />
          <audio controls src={result.url} className="w-full" />
        </div>
      )}
    />
  );
}
