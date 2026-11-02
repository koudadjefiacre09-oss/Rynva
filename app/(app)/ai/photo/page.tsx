import type { Metadata } from "next";
import { Suspense } from "react";
import { PhotoStudio } from "@/components/ai/photo-studio";

export const metadata: Metadata = { title: "Photo" };

export default function AiPhotoPage() {
  return (
    <Suspense fallback={null}>
      <PhotoStudio />
    </Suspense>
  );
}
