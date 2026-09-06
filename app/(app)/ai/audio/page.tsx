import type { Metadata } from "next";
import { AudioStudio } from "@/components/ai/audio-studio";

export const metadata: Metadata = { title: "Audio" };

export default function AiAudioPage() {
  return <AudioStudio />;
}
