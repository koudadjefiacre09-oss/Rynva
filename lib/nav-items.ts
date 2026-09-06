import {
  LayoutGrid,
  Image as ImageIcon,
  Video,
  Camera,
  Palette,
  AudioLines,
  MessageSquare,
  Users,
  Clapperboard,
  FolderKanban,
  History,
  Star,
} from "lucide-react";

// Shared between the desktop Sidebar and the mobile nav drawer
// (components/layout/mobile-nav.tsx) so the two never drift apart.
export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/ai/image", label: "Image", icon: ImageIcon },
  { href: "/ai/video", label: "Video", icon: Video },
  { href: "/ai/photo", label: "Photo", icon: Camera },
  { href: "/ai/design", label: "Design", icon: Palette },
  { href: "/ai/audio", label: "Audio", icon: AudioLines },
  { href: "/ai/scene", label: "Scene", icon: Clapperboard },
  { href: "/ai/chat", label: "Chat", icon: MessageSquare },
  { href: "/characters", label: "Personnages", icon: Users },
  { href: "/projects", label: "Projets", icon: FolderKanban },
  { href: "/history", label: "Historique", icon: History },
  { href: "/favorites", label: "Favoris", icon: Star },
] as const;

// The subset shown in the mobile bottom nav (components/layout/mobile-bottom-nav.tsx)
// — a bottom bar only has room for a handful of destinations before it gets cramped.
export const BOTTOM_NAV_ITEMS = [
  { href: "/dashboard", label: "Accueil", icon: LayoutGrid },
  { href: "/ai/image", label: "Créer", icon: ImageIcon },
  { href: "/projects", label: "Projets", icon: FolderKanban },
  { href: "/favorites", label: "Favoris", icon: Star },
] as const;
