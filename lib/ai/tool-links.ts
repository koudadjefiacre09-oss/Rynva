/** Links that send a creation to another RYNVA tool. */
export type ToolTarget = "retouch" | "animate" | "bg-remove" | "hd-enhance";

export function toolHref(target: ToolTarget, url: string, generationId?: string): string {
  const src = encodeURIComponent(url);
  if (target === "animate") return `/ai/video?sourceUrl=${src}${generationId ? `&sourceId=${generationId}` : ""}`;
  return `/ai/photo?tool=${target}&sourceUrl=${src}`;
}
