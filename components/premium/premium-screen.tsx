"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Crown,
  Check,
  X,
  CreditCard,
  ShieldCheck,
  Sparkles,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { notifySuccess } from "@/lib/toast";
import { upgradeToPro } from "@/app/(app)/premium/actions";

type PlanId = "free" | "pro" | "enterprise";
type Billing = "monthly" | "yearly";
type Step = "plans" | "payment" | "success";

interface Plan {
  id: PlanId;
  name: string;
  price: number;
  description: string;
  badge?: string;
  features: { label: string; ok: boolean }[];
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    description: "Pour démarrer",
    features: [
      { label: "50 crédits / mois", ok: true },
      { label: "Qualité standard", ok: true },
      { label: "Suppression d'arrière-plan", ok: true },
      { label: "Génération d'image", ok: true },
      { label: "Amélioration HD", ok: false },
      { label: "Génération vidéo", ok: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 14,
    description: "Pour les créateurs sérieux",
    badge: "Le plus populaire",
    features: [
      { label: "1 000 crédits / mois", ok: true },
      { label: "Qualité HD & 4K", ok: true },
      { label: "Suppression d'arrière-plan", ok: true },
      { label: "Génération d'image", ok: true },
      { label: "Amélioration HD", ok: true },
      { label: "Génération vidéo", ok: true },
      { label: "File GPU prioritaire", ok: true },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 49,
    description: "Pour les équipes & agences",
    features: [
      { label: "Crédits illimités", ok: true },
      { label: "Tout ce qui est dans Pro", ok: true },
      { label: "Espaces d'équipe", ok: true },
      { label: "Accès API", ok: true },
      { label: "Support dédié", ok: true },
    ],
  },
];

const GUARANTEES = [
  { icon: "🔒", label: "Annulez à tout moment" },
  { icon: "💳", label: "Paiement sécurisé" },
  { icon: "✅", label: "Remboursé sous 7 jours" },
];

const INPUT_CLASS =
  "h-11 rounded-2xl border border-zinc-200 bg-zinc-100/80 px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-white dark:placeholder:text-zinc-500";

function formatCard(v: string) {
  return v
    .replace(/\D/g, "")
    .replace(/(\d{4})/g, "$1 ")
    .trim()
    .slice(0, 19);
}
function formatExpiry(v: string) {
  const d = v.replace(/\D/g, "");
  return d.length >= 2 ? `${d.slice(0, 2)}/${d.slice(2, 4)}` : d;
}

export function PremiumScreen() {
  const [step, setStep] = useState<Step>("plans");
  const [billing, setBilling] = useState<Billing>("monthly");
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("pro");
  const [method, setMethod] = useState<"card" | "apple" | "google">("card");
  const [name, setName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const proPlan = PLANS.find((p) => p.id === "pro")!;
  const proPrice = billing === "yearly" ? Math.round(proPlan.price * 0.8) : proPlan.price;
  const cardComplete = name.trim() && cardNumber.length >= 19 && expiry.length === 5 && cvc.length === 3;

  function handlePay() {
    setError(null);
    startTransition(async () => {
      // Simulated processing delay — no real charge, no payment provider wired.
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const result = await upgradeToPro();
      if (result.error) {
        setError(result.error);
        return;
      }
      notifySuccess("Votre abonnement Pro est actif, 1 000 crédits ont été ajoutés !");
      setStep("success");
    });
  }

  if (step === "success") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-5 py-10 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-400">
          <Check className="h-9 w-9" strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
          Welcome to Pro!
        </h1>
        <p className="max-w-xs text-sm text-zinc-500">
          Votre abonnement est actif. 1 000 crédits ont été ajoutés à votre compte.
        </p>
        <div className="flex w-full flex-col gap-2">
          {[
            "1 000 crédits IA ajoutés",
            "Qualité HD & 4K débloquée",
            "Génération vidéo activée",
            "File GPU prioritaire active",
          ].map((f) => (
            <div
              key={f}
              className="flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-500 text-white">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
              <span className="text-sm text-zinc-900 dark:text-white">{f}</span>
            </div>
          ))}
        </div>
        <Link
          href="/dashboard"
          className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-zinc-900 text-sm font-medium text-white transition-colors hover:bg-black dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Commencer à créer
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  if (step === "payment") {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <button
          type="button"
          onClick={() => setStep("plans")}
          className="w-fit text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
        >
          ← Retour aux offres
        </button>

        <div className="rounded-2xl border border-brand-purple/20 bg-gradient-to-br from-brand-purple/5 to-brand-blue/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">RYNVA Pro</p>
              <p className="text-xs text-zinc-500">
                {billing === "yearly" ? "Annuel" : "Mensuel"} · 1 000 crédits
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gradient-brand">${proPrice}</p>
              <p className="text-xs text-zinc-500">/mois</p>
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Méthode de paiement
          </p>
          <div className="flex gap-2">
            {(
              [
                { id: "apple", label: "Apple Pay", icon: "🍎" },
                { id: "google", label: "Google Pay", icon: "G" },
                { id: "card", label: "Carte", icon: "💳" },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={cn(
                  "flex-1 rounded-xl border px-3 py-2.5 text-xs font-medium transition-colors",
                  method === m.id
                    ? "border-transparent bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
                )}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>
        </div>

        {method === "card" ? (
          <>
            <div
              className={cn(
                "relative overflow-hidden rounded-2xl p-5 text-white transition-colors",
                cardNumber ? "bg-gradient-brand" : "bg-zinc-800"
              )}
            >
              <div className="mb-7 flex items-center justify-between">
                <div className="h-7 w-10 rounded-md border border-amber-200/50 bg-amber-300/40" />
                <span className="text-sm font-semibold text-white/80">
                  {cardNumber.startsWith("4") ? "Visa" : cardNumber.startsWith("5") ? "Mastercard" : "💳"}
                </span>
              </div>
              <p className="mb-3.5 text-lg font-semibold tracking-widest">
                {cardNumber || "•••• •••• •••• ••••"}
              </p>
              <div className="flex justify-between text-xs">
                <div>
                  <p className="text-white/50">TITULAIRE</p>
                  <p className="font-medium">{name || "Votre nom"}</p>
                </div>
                <div>
                  <p className="text-white/50">EXPIRE</p>
                  <p className="font-medium">{expiry || "MM/AA"}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom du titulaire"
                className={INPUT_CLASS}
              />
              <input
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCard(e.target.value))}
                placeholder="1234 5678 9012 3456"
                inputMode="numeric"
                className={INPUT_CLASS}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  placeholder="MM/AA"
                  inputMode="numeric"
                  className={INPUT_CLASS}
                />
                <input
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 3))}
                  placeholder="CVC"
                  inputMode="numeric"
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="mb-1 text-3xl">{method === "apple" ? "🍎" : "G"}</p>
            <p className="text-sm font-medium text-zinc-900 dark:text-white">
              {method === "apple" ? "Apple Pay" : "Google Pay"}
            </p>
            <p className="mt-1 text-xs text-zinc-500">Simulation — cliquez sur payer pour continuer</p>
          </div>
        )}

        <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          Chiffrement SSL 256 bits · Simulation, aucun débit réel
        </div>

        {error && (
          <p className="rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-center text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handlePay}
          disabled={pending || (method === "card" && !cardComplete)}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-zinc-900 text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
          {pending ? "Traitement…" : `Pay $${proPrice}.00`}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div className="text-center">
        <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 dark:bg-amber-950/30 dark:text-amber-400">
          <Crown className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-gradient-brand">
          Libérez votre créativité
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500">
          Plus de crédits, une meilleure qualité, une génération plus rapide.
        </p>
      </div>

      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
          {(["monthly", "yearly"] as const).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBilling(b)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-colors",
                billing === b
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              {b === "monthly" ? (
                "Mensuel"
              ) : (
                <>
                  Annuel
                  <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                    -20%
                  </span>
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PLANS.map((plan) => {
          const price = billing === "yearly" ? Math.round(plan.price * 0.8) : plan.price;
          const selected = selectedPlan === plan.id;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelectedPlan(plan.id)}
              className={cn(
                "relative flex flex-col gap-4 rounded-2xl border-2 p-5 text-left transition-colors",
                selected
                  ? "border-zinc-900 bg-white shadow-md dark:border-white dark:bg-zinc-900"
                  : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              )}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-5 rounded-full bg-gradient-brand px-2.5 py-1 text-[10px] font-semibold text-white">
                  {plan.badge}
                </span>
              )}
              <div>
                <p className="text-base font-semibold text-zinc-900 dark:text-white">{plan.name}</p>
                <p className="text-xs text-zinc-500">{plan.description}</p>
              </div>
              <div>
                <span className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  {price === 0 ? "Gratuit" : `$${price}`}
                </span>
                {price > 0 && (
                  <span className="text-sm text-zinc-500">
                    /{billing === "yearly" ? "mo, facturé annuellement" : "mois"}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                {plan.features.map((f) => (
                  <div key={f.label} className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded",
                        f.ok ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "bg-transparent"
                      )}
                    >
                      {f.ok ? (
                        <Check className="h-2.5 w-2.5" strokeWidth={3} />
                      ) : (
                        <X className="h-2.5 w-2.5 text-zinc-300 dark:text-zinc-700" />
                      )}
                    </span>
                    <span
                      className={cn(
                        "text-xs",
                        f.ok ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400 dark:text-zinc-600"
                      )}
                    >
                      {f.label}
                    </span>
                  </div>
                ))}
              </div>
              <span
                className={cn(
                  "absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-md border-2",
                  selected
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                    : "border-zinc-200 dark:border-zinc-700"
                )}
              >
                {selected && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>

      {selectedPlan === "pro" && (
        <button
          type="button"
          onClick={() => setStep("payment")}
          className="mx-auto inline-flex h-12 w-full max-w-sm items-center justify-center gap-2 rounded-full bg-zinc-900 text-sm font-medium text-white transition-colors hover:bg-black dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Sparkles className="h-4 w-4" />
          Passer à Pro — ${proPrice}/mois
        </button>
      )}
      {selectedPlan === "enterprise" && (
        <a
          href="mailto:sales@rynva.app"
          className="mx-auto inline-flex h-12 w-full max-w-sm items-center justify-center gap-2 rounded-full border border-zinc-300 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Contacter les ventes
        </a>
      )}

      <div className="grid grid-cols-3 gap-3">
        {GUARANTEES.map((g) => (
          <div
            key={g.label}
            className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-center dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="mb-1 text-lg">{g.icon}</p>
            <p className="text-[11px] font-medium text-zinc-500">{g.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
