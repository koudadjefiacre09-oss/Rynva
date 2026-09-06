/**
 * Turns a display name into 1-2 uppercase initials for avatar fallbacks.
 * Plain, framework-agnostic — kept out of any "use client" file so Server
 * Components can import it too. It used to live in user-menu.tsx (a client
 * component); a Server Component importing a named export from a "use
 * client" module gets a client-reference stub instead of the real function,
 * which crashed /admin's server render with "initialsOf is not a function".
 */
export function initialsOf(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}
