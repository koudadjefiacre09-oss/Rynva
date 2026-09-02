import type { Metadata } from "next";
import { DesignStudio } from "@/components/ai/design-studio";

export const metadata: Metadata = { title: "AI Design" };

export default function AiDesignPage() {
  return <DesignStudio />;
}
