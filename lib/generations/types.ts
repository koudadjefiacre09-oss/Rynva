export type GenerationType =
  | "image"
  | "video"
  | "design"
  | "audio"
  | "photo-bg-remove"
  | "photo-enhance"
  | "scene";

export interface GenerationRow {
  id: string;
  user_id: string;
  type: GenerationType;
  prompt: string | null;
  storage_path: string;
  source_generation_id: string | null;
  metadata: Record<string, unknown>;
  is_favorite: boolean;
  created_at: string;
}
