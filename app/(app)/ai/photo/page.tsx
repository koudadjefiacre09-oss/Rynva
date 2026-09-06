import type { Metadata } from "next";
import { PhotoStudio } from "@/components/ai/photo-studio";

export const metadata: Metadata = { title: "Photo" };

export default function AiPhotoPage() {
  return <PhotoStudio />;
}
