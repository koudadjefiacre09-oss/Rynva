/**
 * RYNVA uses separate providers (see README "Prochaines phases", Phase 4)
 * instead of one generic key, because image/video/design/audio and chat need
 * very different APIs:
 *  - Replicate (REPLICATE_API_TOKEN): image, video, design, audio — one
 *    account, many hosted open models.
 *  - Chat: Anthropic (ANTHROPIC_API_KEY) preferred, then xAI Grok
 *    (XAI_API_KEY), then OpenAI (OPENAI_API_KEY) — first one configured
 *    wins, see lib/ai/providers/index.ts.
 */
export const isReplicateConfigured = Boolean(process.env.REPLICATE_API_TOKEN);
export const isAnthropicConfigured = Boolean(process.env.ANTHROPIC_API_KEY);
export const isGrokConfigured = Boolean(process.env.XAI_API_KEY);
export const isOpenAiConfigured = Boolean(process.env.OPENAI_API_KEY);

export const AI_CONFIG_ERROR =
  "Aucun modèle IA n'est encore branché pour cet outil. Ajoutez REPLICATE_API_TOKEN et/ou une clé de chat (ANTHROPIC_API_KEY, XAI_API_KEY ou OPENAI_API_KEY) dans .env.local (voir .env.example) puis relancez le serveur.";
