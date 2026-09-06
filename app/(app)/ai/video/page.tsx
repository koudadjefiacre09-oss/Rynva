import type { Metadata } from "next";
import { VideoStudio } from "@/components/ai/video-studio";

export const metadata: Metadata = { title: "Video" };

export default function AiVideoPage() {
  return <VideoStudio />;
}
