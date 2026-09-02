import { Image as ImageIcon, Video, Palette, AudioLines, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const tools = [
  { icon: ImageIcon, label: "AI Image", desc: "Générez des visuels à partir d'un simple prompt." },
  { icon: Video, label: "AI Video", desc: "Transformez une idée en vidéo courte, prête à publier." },
  { icon: Palette, label: "AI Design", desc: "Créez des designs pour vos réseaux et vos supports." },
  { icon: AudioLines, label: "AI Audio", desc: "Générez voix off, musique et effets sonores." },
  { icon: MessageSquare, label: "AI Chat", desc: "Un assistant créatif pour affiner vos idées." },
];

export function ToolsTeaser() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Un studio, cinq outils IA
          </h2>
          <p className="mt-3 text-text-secondary">
            Tout ce qu&apos;il faut pour créer, du premier brouillon au rendu final.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Card key={tool.label} className="p-5">
                <CardContent className="flex flex-col items-start gap-3 p-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-brand">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{tool.label}</p>
                    <p className="mt-1 text-xs text-text-muted">{tool.desc}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
