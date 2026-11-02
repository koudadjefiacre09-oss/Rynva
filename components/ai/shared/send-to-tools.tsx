import Link from "next/link";
import { Wand2, Clapperboard, Eraser, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { toolHref, type ToolTarget } from "@/lib/ai/tool-links";

const TOOLS: { target: ToolTarget; label: string; icon: typeof Wand2 }[] = [
  { target: "retouch", label: "Retoucher", icon: Wand2 },
  { target: "animate", label: "Animer", icon: Clapperboard },
  { target: "bg-remove", label: "Enlever le fond", icon: Eraser },
  { target: "hd-enhance", label: "HD", icon: Sparkles },
];

/**
 * "Send this creation to another tool" row, shown under every still result
 * so the tools chain into one workflow instead of eight separate pages.
 */
export function SendToTools({
  url,
  generationId,
  exclude = [],
  size = "md",
  className,
}: {
  url: string;
  generationId?: string;
  exclude?: ToolTarget[];
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {TOOLS.filter((t) => !exclude.includes(t.target)).map(({ target, label, icon: Icon }) => (
        <Link
          key={target}
          href={toolHref(target, url, generationId)}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border border-zinc-200 font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900",
            size === "sm" ? "px-2 py-1 text-[11px]" : "px-3.5 py-2 text-xs"
          )}
        >
          <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
          {label}
        </Link>
      ))}
    </div>
  );
}
