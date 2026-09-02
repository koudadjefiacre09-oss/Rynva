# RYNVA

Plateforme créative alimentée par l'IA — image, vidéo, design, audio, chat.
**CREATE • EDIT • INNOVATE**

## État du projet : Phases 1, 2 & 4 — Design system, Auth, IA

Ce dépôt contient la **fondation réelle** de RYNVA, pas une maquette :

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Design system RYNVA : tokens de couleur, typographie (Inter), rayons, spacing 4/8
- Composants UI de base réels et réutilisables : `Button`, `Card`, `Badge`, `Input`
- Layout dashboard avec sidebar persistante (desktop) + topbar (recherche, crédits, notifications, profil)
- Landing page + pages publiques `/features`, `/pricing`, `/about`
- Authentification Supabase complète : email/password, OAuth Google, mot de passe oublié,
  onboarding, middleware de protection des routes (`middleware.ts`, `lib/supabase/`)
- IA provider-agnostique (`lib/ai/`) : AI Image / Video / AI Photo (retrait de fond, HD) / Design /
  Audio via Replicate, AI Chat via Claude (Grok, puis OpenAI, en repli) — routes `/api/ai/*` + UI `/ai/*`
- Galerie des générations (`/projects`, section "Projets récents" du dashboard) : chaque
  génération est automatiquement sauvegardée dans Supabase Storage + table `generations`,
  téléchargeable, supprimable, et une image peut être envoyée vers AI Video pour être animée
- Personnages réutilisables (`/characters`) + AI Scene (`/ai/scene`) : créez un personnage
  (généré ou importé), puis combinez 2-3 personnages dans une scène en gardant leur visage
  cohérent (`runwayml/gen4-image` sur Replicate — 3 références max, limite du modèle)

Tout ce qui précède est du **vrai code fonctionnel**, pas simulé — mais l'auth, l'IA et la
galerie ont besoin de vraies clés/tables dans Supabase pour s'activer (voir ci-dessous).
Sans clés, le site tourne comme en Phase 1 pure : aucune fonctionnalité ne prétend marcher
sans l'être.

Ce que ce dépôt **ne contient pas encore** (prochaines phases, voir plus bas) :
historique/favoris dédiés, notifications, crédits, paiements.

### Base de données

Le schéma vit dans `supabase/migrations/*.sql`, à exécuter dans l'ordre une fois chacun
dans votre projet Supabase : **Dashboard → SQL Editor → New query**, coller le contenu du
fichier, **Run**.

- `0001_generations.sql` — table `generations` + bucket de stockage privé `generations`
- `0002_characters_and_deletes.sql` — table `characters` (bibliothèque de personnages)
- `0003_scene_generation_type.sql` — autorise le type `scene` dans `generations`

Toutes les tables ont RLS activée : un utilisateur ne voit/modifie que ses propres lignes.

## Installation

```bash
npm install
cp .env.example .env.local
# renseigner les variables Supabase / Stripe / AI provider dans .env.local
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Variables d'environnement

Voir `.env.example`. Aucune clé réelle n'est présente dans le code — toutes les clés
sensibles (`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `REPLICATE_API_TOKEN`,
`ANTHROPIC_API_KEY`, `XAI_API_KEY`, `OPENAI_API_KEY`) doivent rester côté serveur et ne jamais être
exposées au navigateur.

## Prochaines phases

| Phase | Contenu |
|---|---|
| 2 | ✅ Authentification Supabase réelle (email/password, OAuth), onboarding, middleware |
| 3 | 🟡 Projets (galerie des générations ✅), historique, favoris, notifications |
| 4 | ✅ AI Image / Video / Design / Audio (Replicate) / Chat (Claude, Grok, OpenAI en repli) — architecture provider-agnostic |
| 5 | Crédits, abonnements Stripe, parrainage |
| 6 | Espace admin, sécurité RLS, logs |
| 7 | Tests, performance, accessibilité, SEO, mise en production |

## Structure

```
app/            routes (App Router), dont api/ai/* (routes de génération)
components/ui/  primitifs de design system
components/layout/  sidebar, topbar
components/marketing/  header/footer + sections des pages publiques
components/auth/   formulaires et layout d'authentification
components/ai/     studios de génération (image/vidéo/design/audio/chat)
lib/supabase/   clients + middleware Supabase (auth)
lib/ai/         types, interface provider, adapters Replicate/OpenAI
lib/validations/  schémas zod
```
