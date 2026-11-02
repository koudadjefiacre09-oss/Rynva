import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verifies a Replicate webhook signature (Standard Webhooks scheme):
 *   signed content = `${webhook-id}.${webhook-timestamp}.${raw body}`
 *   key            = base64-decoded secret after the "whsec_" prefix
 *   header         = space-separated "v1,<base64 HMAC-SHA256>" entries
 * The timestamp must be within `toleranceSeconds` to prevent replays.
 */
export function verifyReplicateWebhook(
  headers: { id: string | null; timestamp: string | null; signature: string | null },
  body: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
  toleranceSeconds = 300
): boolean {
  const { id, timestamp, signature } = headers;
  if (!id || !timestamp || !signature || !secret) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(nowSeconds - ts) > toleranceSeconds) return false;

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest();

  return signature.split(" ").some((part) => {
    const [version, value] = part.split(",");
    if (version !== "v1" || !value) return false;
    const given = Buffer.from(value, "base64");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}
