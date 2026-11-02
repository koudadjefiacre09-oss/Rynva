import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { detectImageFormat } from "@/lib/ai/retouch/formats";
import { decodeBmp } from "@/lib/ai/retouch/bmp";
import { writeBmp24 } from "./helpers";

const head = (buf: Uint8Array) => buf.subarray(0, 64);

async function sample(format: "jpeg" | "png" | "webp" | "gif" | "tiff" | "avif") {
  const img = sharp({ create: { width: 80, height: 60, channels: 3, background: { r: 200, g: 120, b: 90 } } });
  return img.toFormat(format).toBuffer();
}

describe("detectImageFormat (magic bytes)", () => {
  it.each(["jpeg", "png", "webp", "gif", "tiff", "avif"] as const)("detects real %s files", async (format) => {
    const buf = await sample(format);
    expect(detectImageFormat(head(buf), "bin")?.format).toBe(format);
  });

  it("ignores a misleading extension: a PNG named .jpg is a PNG", async () => {
    const buf = await sample("png");
    expect(detectImageFormat(head(buf), "jpg")?.format).toBe("png");
  });

  it("detects BMP", () => {
    const bmp = writeBmp24(4, 4, () => [1, 2, 3]);
    expect(detectImageFormat(head(bmp), "bmp")?.format).toBe("bmp");
  });

  it("detects HEIC, AVIF and CR3 by their ftyp brand", () => {
    const ftyp = (brand: string, compat: string[]) => {
      const b = Buffer.alloc(32);
      b.writeUInt32BE(16 + compat.length * 4, 0);
      b.write("ftyp", 4, "ascii");
      b.write(brand, 8, "ascii");
      compat.forEach((c, i) => b.write(c, 16 + i * 4, "ascii"));
      return b;
    };
    expect(detectImageFormat(ftyp("heic", ["mif1", "heic"]))?.format).toBe("heic");
    expect(detectImageFormat(ftyp("mif1", ["mif1", "avif"]))?.format).toBe("avif");
    expect(detectImageFormat(ftyp("crx ", ["crx ", "isom"]))).toMatchObject({ format: "raw", label: "RAW Canon CR3" });
    expect(detectImageFormat(ftyp("isom", ["mp41"]))).toBeNull(); // an MP4 is not an image
  });

  it("tells TIFF-based RAW files apart from plain TIFF", async () => {
    const tiff = await sample("tiff");
    expect(detectImageFormat(head(tiff), "tif")?.format).toBe("tiff");
    expect(detectImageFormat(head(tiff), "nef")).toMatchObject({ format: "raw", label: "RAW Nikon NEF" });
    const cr2 = Buffer.from(tiff);
    cr2.write("CR", 8, "ascii");
    expect(detectImageFormat(head(cr2), "")?.label).toBe("RAW Canon CR2");
    const raf = Buffer.concat([Buffer.from("FUJIFILMCCD-RAW 0201"), Buffer.alloc(64)]);
    expect(detectImageFormat(head(raf))?.label).toBe("RAW Fujifilm RAF");
  });

  it("rejects SVG, HTML, PDF and random bytes", () => {
    const reject = (s: string) => detectImageFormat(new TextEncoder().encode(s.padEnd(64, " ")), "jpg");
    expect(reject('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')).toBeNull();
    expect(reject("<!DOCTYPE html><html><body>")).toBeNull();
    expect(reject("%PDF-1.7\n%âãÏÓ")).toBeNull();
    expect(detectImageFormat(Uint8Array.from({ length: 64 }, (_, i) => (i * 37) % 251), "png")).toBeNull();
  });
});

describe("decodeBmp", () => {
  it("decodes a 24-bit BMP pixel-exactly (bottom-up rows)", () => {
    const bmp = writeBmp24(5, 3, (x, y) => [x * 40, y * 80, 7]);
    const out = decodeBmp(bmp, 1e6);
    expect(out.width).toBe(5);
    expect(out.height).toBe(3);
    const at = (x: number, y: number) => Array.from(out.data.subarray((y * 5 + x) * 4, (y * 5 + x) * 4 + 4));
    expect(at(0, 0)).toEqual([0, 0, 7, 255]);
    expect(at(4, 2)).toEqual([160, 160, 7, 255]);
  });

  it("rejects truncated files and oversized dimensions", () => {
    const bmp = writeBmp24(50, 50, () => [0, 0, 0]);
    expect(() => decodeBmp(bmp.subarray(0, 200), 1e6)).toThrow(/tronqué|corrompu/);
    expect(() => decodeBmp(bmp, 100)).toThrow(/trop grande/);
  });
});
