import Image from "next/image";
import Link from "next/link";

const tools = [
  { icon: "/icones/image.png", label: "Image", desc: "Visuels à partir d'un prompt.", href: "/ai/image" },
  { icon: "/icones/video.png", label: "Vidéo", desc: "Idées transformées en clips.", href: "/ai/video" },
  { icon: "/icones/photo.png", label: "Photo", desc: "Retouche et détourage instantanés.", href: "/ai/photo" },
  { icon: "/icones/design.png", label: "Design", desc: "Posts, stories et bannières.", href: "/ai/design" },
  { icon: "/icones/audio.png", label: "Audio", desc: "Voix off, musique, effets.", href: "/ai/audio" },
  { icon: "/icones/chat.jpg", label: "Chat", desc: "Un assistant créatif dédié.", href: "/ai/chat" },
];

export function ToolsTeaser() {
  return (
    <section className="relative bg-black px-6 py-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_center,_theme(colors.orange.600/0.1),_transparent_65%)]" />

      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Un studio, six outils IA
          </h2>
          <p className="mt-3 text-zinc-400">
            Tout ce qu&apos;il faut pour créer, du premier brouillon au rendu final.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {tools.map((tool) => (
            <Link
              key={tool.label}
              href={tool.href}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-8 text-center transition-colors hover:border-orange-600/50 hover:bg-zinc-950"
            >
              <div className="relative flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-b from-zinc-900 to-black shadow-[0_0_30px_-8px_rgba(234,88,12,0.35)] transition-transform duration-300 group-hover:scale-105">
                <Image
                  src={tool.icon}
                  alt={`Outil ${tool.label}`}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-md object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{tool.label}</p>
                <p className="mt-1 text-xs text-zinc-500">{tool.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
