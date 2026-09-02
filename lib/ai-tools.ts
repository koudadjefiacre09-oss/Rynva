// Canonical list of AI tools — used by the dashboard grid and the ⌘K command
// palette, so both stay in sync automatically.
export interface AiTool {
  href: string;
  label: string;
  desc: string;
  imageSrc: string;
  badge?: string;
}

export const AI_TOOLS: AiTool[] = [
  {
    href: "/ai/image",
    label: "Image",
    desc: "Générez des visuels à partir d'un prompt",
    imageSrc: "/icones/image.png",
  },
  {
    href: "/ai/video",
    label: "Video",
    desc: "Transformez une idée en vidéo courte",
    imageSrc: "/icones/video.png",
  },
  {
    href: "/ai/photo",
    label: "Photo",
    desc: "Retirez l'arrière-plan ou améliorez la HD",
    imageSrc: "/icones/photo.png",
    badge: "Nouveau",
  },
  {
    href: "/ai/design",
    label: "Design",
    desc: "Créez un design pour vos réseaux",
    imageSrc: "/icones/design.png",
  },
  {
    href: "/ai/audio",
    label: "Audio",
    desc: "Générez une voix off ou un effet sonore",
    imageSrc: "/icones/audio.png",
  },
  {
    href: "/ai/chat",
    label: "Chat",
    desc: "Discutez avec l'assistant créatif",
    imageSrc: "/icones/chat.jpg",
  },
];
