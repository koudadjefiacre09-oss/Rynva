import type { Metadata } from "next";
import { PhotoStudio } from "@/components/ai/photo-studio";

export const metadata: Metadata = { title: "AI Photo" };

export default function AiPhotoPage() {
  return <PhotoStudio />;
}
