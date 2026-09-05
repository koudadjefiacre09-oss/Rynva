// Short, warm, time-aware dashboard greeting — swaps "Bonjour"/"Bonsoir"
// depending on the hour, and rotates a small pool of short taglines so the
// dashboard doesn't say the exact same sentence on every visit.
const EVENING_TAGLINES = [
  "on crée quoi ce soir ?",
  "prêt à créer ?",
  "place à la création !",
];

const DAY_TAGLINES = [
  "commencez à créer !",
  "on crée quoi aujourd'hui ?",
  "prêt à créer ?",
];

/** hour is injectable for tests; defaults to the server's current time. */
export function getGreeting(firstName?: string, hour: number = new Date().getHours()): string {
  const isEvening = hour >= 18 || hour < 5;
  const salutation = isEvening ? "Bonsoir" : "Bonjour";
  const taglines = isEvening ? EVENING_TAGLINES : DAY_TAGLINES;
  const tagline = taglines[Math.floor(Math.random() * taglines.length)];
  const name = firstName ? `, ${firstName}` : "";

  return `${salutation}${name}, ${tagline}`;
}
