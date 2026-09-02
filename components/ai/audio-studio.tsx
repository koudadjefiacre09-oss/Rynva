"use client";

import { GenerationStudio } from "@/components/ai/generation-studio";

interface AudioResult {
  url: string;
  prompt: string;
}

export function AudioStudio() {
  return (
    <GenerationStudio<AudioResult>
      title="AI Audio"
      description="Décrivez la voix off, musique ou effet sonore que vous voulez générer."
      endpoint="/api/ai/audio"
      successMessage="Votre audio est prêt !"
      placeholder="Ex : une voix off chaleureuse annonçant le lancement de RYNVA, ton confiant"
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
      renderResult={(result) => <audio controls src={result.url} className="w-full" />}
    />
  );
}
