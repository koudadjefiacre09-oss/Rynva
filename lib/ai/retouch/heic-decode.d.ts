declare module "heic-decode" {
  interface DecodedHeic {
    width: number;
    height: number;
    /** RGBA, 8 bits per channel. */
    data: Uint8ClampedArray;
  }
  export default function decode(input: { buffer: ArrayBufferLike | Uint8Array }): Promise<DecodedHeic>;
}
