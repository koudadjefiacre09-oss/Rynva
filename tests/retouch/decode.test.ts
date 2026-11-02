import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { decodeImage, DecodeError } from "@/lib/ai/retouch/decode.server";
import { writeBmp24 } from "./helpers";

/** 120×80 image, left half red, right half blue. */
function halves() {
  return sharp({ create: { width: 120, height: 80, channels: 3, background: "#000" } }).composite([
    { input: { create: { width: 60, height: 80, channels: 3, background: "#ff0000" } }, left: 0, top: 0 },
    { input: { create: { width: 60, height: 80, channels: 3, background: "#0000ff" } }, left: 60, top: 0 },
  ]);
}

describe("decodeImage", () => {
  it("applies EXIF orientation (6 = rotate 90° clockwise)", async () => {
    const jpeg = await halves().jpeg({ quality: 95 }).withMetadata({ orientation: 6 }).toBuffer();
    const out = await decodeImage(jpeg, "jpg");
    expect([out.width, out.height]).toEqual([80, 120]); // portrait after rotation
    // red was on the left → after a 90° CW rotation it is on top
    const top = out.rgb.subarray((5 * 80 + 40) * 3, (5 * 80 + 40) * 3 + 3);
    expect(top[0]).toBeGreaterThan(200);
    expect(top[2]).toBeLessThan(60);
  });

  it("converts an embedded Display-P3 profile to sRGB", async () => {
    // Same bytes, tagged P3 vs untagged: a P3 (0,255,0) is outside sRGB, so
    // a colour-managed decode must give different (clipped) sRGB values.
    const raw = { raw: { width: 64, height: 64, channels: 3 as const } };
    const green = Buffer.alloc(64 * 64 * 3);
    for (let i = 0; i < green.length; i += 3) green[i + 1] = 255;
    const tagged = await sharp(green, raw).withIccProfile("p3").png().toBuffer();
    const plain = await sharp(green, raw).png().toBuffer();
    const a = await decodeImage(tagged, "png");
    const b = await decodeImage(plain, "png");
    expect(Array.from(b.rgb.subarray(0, 3))).toEqual([0, 255, 0]);
    expect(Array.from(a.rgb.subarray(0, 3))).not.toEqual([0, 255, 0]);
    expect(a.rgb[0]).toBeLessThan(30); // P3 green is outside sRGB: red stays near 0
    expect(a.rgb[1]).toBeGreaterThan(200);
  });

  it("decodes BMP, GIF (first frame), TIFF, WebP and AVIF", async () => {
    const bmp = writeBmp24(70, 66, (x) => [x, 100, 200]);
    expect((await decodeImage(bmp, "bmp")).format.format).toBe("bmp");
    for (const f of ["gif", "tiff", "webp", "avif"] as const) {
      const buf = await halves().toFormat(f).toBuffer();
      const out = await decodeImage(buf, f);
      expect(out.format.format).toBe(f);
      expect([out.width, out.height]).toEqual([120, 80]);
    }
  });

  it("keeps real transparency only", async () => {
    const transparent = await sharp({ create: { width: 64, height: 64, channels: 4, background: { r: 9, g: 9, b: 9, alpha: 0.5 } } }).png().toBuffer();
    const opaque = await sharp({ create: { width: 64, height: 64, channels: 4, background: { r: 9, g: 9, b: 9, alpha: 1 } } }).png().toBuffer();
    expect((await decodeImage(transparent, "png")).alpha).not.toBeNull();
    expect((await decodeImage(opaque, "png")).alpha).toBeNull();
  });

  it("downscales only when asked, preserving aspect ratio", async () => {
    const big = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: "#888" } }).jpeg().toBuffer();
    const full = await decodeImage(big, "jpg");
    expect([full.width, full.height]).toEqual([3000, 2000]);
    const preview = await decodeImage(big, "jpg", { maxLongEdge: 1500 });
    expect([preview.width, preview.height, preview.sourceWidth]).toEqual([1500, 1000, 3000]);
  });

  it("rejects corrupt, unknown and too-small files with explicit errors", async () => {
    const jpeg = await halves().jpeg().toBuffer();
    await expect(decodeImage(jpeg.subarray(0, 300), "jpg")).rejects.toThrow(/corrompu|illisible/);
    await expect(decodeImage(Buffer.from("<svg></svg>".padEnd(100)), "svg")).rejects.toBeInstanceOf(DecodeError);
    const tiny = await sharp({ create: { width: 20, height: 20, channels: 3, background: "#fff" } }).png().toBuffer();
    await expect(decodeImage(tiny, "png")).rejects.toThrow(/trop petite/);
  });

  it("refuses a RAW file without a usable embedded preview instead of faking it", async () => {
    const tiff = await halves().tiff().toBuffer();
    await expect(decodeImage(tiff, "nef")).rejects.toThrow(/aperçu exploitable/);
  });
});
