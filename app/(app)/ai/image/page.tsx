import type { Metadata } from "next";
import { ImageStudio } from "@/components/ai/image-studio";

export const metadata: Metadata = { title: "AI Image" };

export default function AiImagePage() {
  return <ImageStudio />;
}
