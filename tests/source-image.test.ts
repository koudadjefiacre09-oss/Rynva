import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { resolveSourceImage, SourceImageError } from "@/lib/ai/source-image.server";
import { toolHref } from "@/lib/ai/tool-links";

const dataUrl = (mime: string, bytes: Buffer) => `data:${mime};base64,${bytes.toString("base64")}`;

describe("resolveSourceImage (without Supabase)", () => {
  it("accepts real JPEG/PNG/WebP data URLs and passes https URLs through", async () => {
    for (const f of ["jpeg", "png", "webp"] as const) {
      const img = await sharp({ create: { width: 8, height: 8, channels: 3, background: "#f00" } }).toFormat(f).toBuffer();
      const url = dataUrl(`image/${f}`, img);
      expect(await resolveSourceImage(url, null)).toBe(url);
    }
    expect(await resolveSourceImage("https://example.com/a.png", null)).toBe("https://example.com/a.png");
  });

  it("rejects disguised files, non-https URLs and oversized images", async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    await expect(resolveSourceImage(dataUrl("image/png", svg), null)).rejects.toBeInstanceOf(SourceImageError);
    await expect(resolveSourceImage("http://example.com/a.png", null)).rejects.toBeInstanceOf(SourceImageError);
    await expect(resolveSourceImage("javascript:alert(1)", null)).rejects.toBeInstanceOf(SourceImageError);
    const gif = await sharp({ create: { width: 8, height: 8, channels: 3, background: "#f00" } }).gif().toBuffer();
    await expect(resolveSourceImage(dataUrl("image/gif", gif), null)).rejects.toThrow(/JPEG, PNG ou WebP/);
    const big = Buffer.alloc(9 * 1024 * 1024, 0xff);
    big[0] = 0xff; big[1] = 0xd8; big[2] = 0xff;
    await expect(resolveSourceImage(dataUrl("image/jpeg", big), null)).rejects.toThrow(/trop volumineuse/);
  });
});

describe("toolHref", () => {
  it("builds links that send a creation to another tool", () => {
    const url = "https://x.supabase.co/storage/v1/object/sign/a b.png?token=1&x=2";
    expect(toolHref("animate", url, "gen-1")).toBe(`/ai/video?sourceUrl=${encodeURIComponent(url)}&sourceId=gen-1`);
    expect(toolHref("retouch", url)).toBe(`/ai/photo?tool=retouch&sourceUrl=${encodeURIComponent(url)}`);
    expect(toolHref("bg-remove", url)).toContain("tool=bg-remove");
  });
});
