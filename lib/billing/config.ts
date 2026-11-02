/**
 * Payments are not wired to a real provider yet (Stripe comes later).
 *
 * The old Pro checkout only *simulated* a payment: any card number with the
 * right format upgraded the account to unlimited Pro. It now only runs in
 * local development, or when ALLOW_SIMULATED_PAYMENTS=true is set on purpose
 * (e.g. a private staging). In production the checkout shows a "coming soon"
 * state and the server action refuses to upgrade.
 */
export const simulatedPaymentsAllowed =
  process.env.NODE_ENV !== "production" || process.env.ALLOW_SIMULATED_PAYMENTS === "true";

export const PAYMENTS_UNAVAILABLE_MESSAGE =
  "Le paiement en ligne arrive très bientôt. En attendant, écrivez-nous à hello@rynva.app pour passer à Pro.";
