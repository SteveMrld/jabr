# JABR — Pipeline éditorial

**De l'idée au livre, sans friction.**

Plateforme SaaS de Jabrilia Éditions pour la gestion du pipeline éditorial complet.

## Stack

- **Next.js 15** + TypeScript + Tailwind CSS
- **Déploiement** : Vercel (auto-deploy depuis `main`)
- **URL** : [jabr-ten.vercel.app](https://jabr-ten.vercel.app)

## Routes

- `/` — Landing page
- `/demo` — Dashboard complet (Phase 1)

## Modules

| Module | Statut |
|--------|--------|
| Dashboard | ✅ Fonctionnel |
| Catalogue (10 titres) | ✅ Fonctionnel |
| Fiche projet + Pipeline 8 étapes | ✅ Fonctionnel |
| Diagnostic couverture | ✅ Fonctionnel |
| Couvertures (audit qualité) | ✅ Fonctionnel |
| Registre ISBN (37/100) | ✅ Fonctionnel |
| Collections (3) | ✅ Fonctionnel |
| Analytics | ✅ Fonctionnel |
| Distribution (6 canaux) | ✅ Fonctionnel |
| Calibrage | 🔲 Placeholder |
| Audiobooks | 🔲 Placeholder |
| Paramètres | 🔲 Placeholder |

## Développement local

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Charte graphique

- **Or** `#C8952E` — couleur primaire
- **Mauve** `#2D1B4E` — fond sidebar / dark mode
- **Orange** `#E07A2F` — alertes, warnings
- **Blanc cassé** `#FAF7F2` — fond principal
- **Typographie** : Playfair Display (titres) + Inter (UI) + JetBrains Mono (code/ISBN)

---

*Jabrilia Éditions — Mars 2026*
