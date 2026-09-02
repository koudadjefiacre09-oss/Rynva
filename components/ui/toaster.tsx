"use client";

import { Toaster as SonnerToaster } from "sonner";

/**
 * Global toast host — mounted once in app/layout.tsx. Fully unstyled so our
 * own classNames (Magnific-style: white card, dark text, soft shadow) apply
 * instead of sonner's defaults; dark: variants follow the app's theme toggle.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      theme="light"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3.5 shadow-md dark:border-zinc-800 dark:bg-zinc-900",
          title: "text-sm font-medium text-zinc-900 dark:text-white",
          description: "text-xs text-zinc-500 dark:text-zinc-400",
          icon: "shrink-0",
          closeButton:
            "!bg-white !border-zinc-200 !text-zinc-400 hover:!text-zinc-700 dark:!bg-zinc-900 dark:!border-zinc-700 dark:!text-zinc-500",
        },
      }}
    />
  );
}
