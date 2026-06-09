# 🏛️ Plan architectural — « Demeure »

> **Demeure** — *Étude biblique de la Genèse à l'Apocalypse*
> Application mobile d'étude biblique pour groupes et églises.
> Document rédigé le 2026-06-09.

---

## 📋 Décisions validées

| Aspect | Décision |
|---|---|
| **Nom** | Demeure — *Étude biblique de la Genèse à l'Apocalypse* |
| **Cible** | Groupes / églises (étude collective) |
| **Plateformes** | iOS + Android (mobile) |
| **Techno** | React Native (Expo) |
| **Versions Bible** | Segond 1910 (libre de droits) au départ, extensible |
| **Langues** | Multilingue (FR, EN…) |
| **Lecture** | Chapitre par chapitre, **hors-ligne** |
| **Quiz** | **Un quiz par livre, débloqué après lecture complète** (compréhension / mémorisation) |
| **Notes** | Personnelles, **locales** (sur l'appareil uniquement) |
| **Groupes** | Création + invitation (code / lien), plan d'étude commun hebdomadaire |
| **Notifications** | Rappels de lecture, nouveaux messages, nouveau passage |
| **Auth** | Sign in with Apple + Google |
| **Backend** | Supabase (auth + groupes + plans + notifications) |
| **Design** | Chaleureux / spirituel, tons papier & sépia doux, couleur **terre cuite** ; mode sombre/clair, taille du texte & police réglables |

---

## 1. Vue d'ensemble de l'architecture

```
┌─────────────────────────────────────────────────────┐
│                  APP MOBILE (Expo / RN)              │
│  ┌───────────────┐         ┌──────────────────────┐ │
│  │  DONNÉES       │         │  DONNÉES PARTAGÉES    │ │
│  │  LOCALES       │         │  (cloud)              │ │
│  │  • Bible (SQLite)        │  • Comptes / auth     │ │
│  │  • Notes perso │         │  • Groupes & membres  │ │
│  │  • Surlignages │         │  • Plans d'étude      │ │
│  │  • Préférences │         │  • Messages           │ │
│  └───────────────┘         └──────────┬───────────┘ │
└────────────────────────────────────────┼─────────────┘
                                          │ HTTPS / Realtime
                                ┌─────────▼──────────┐
                                │     SUPABASE        │
                                │  Auth · Postgres    │
                                │  Realtime · Storage │
                                └─────────┬──────────┘
                                          │
                                ┌─────────▼──────────┐
                                │  Notifications push │
                                │  (Expo Push)        │
                                └────────────────────┘
```

**Principe directeur :** *local-first pour la lecture et l'intime* (Bible + notes fonctionnent sans réseau), *cloud pour le collectif* (groupes, plans, messages).

---

## 2. Stack technique recommandée

| Couche | Choix | Justification |
|---|---|---|
| **Framework** | **Expo** (React Native) | Build iOS+Android, OTA updates, Expo Push intégré |
| **Langage** | TypeScript | Robustesse, écosystème React déjà maîtrisé |
| **Navigation** | Expo Router | Routage par fichiers (proche de Next.js) |
| **Bible locale** | **SQLite** (`expo-sqlite` / Drizzle) | Lecture rapide hors-ligne, recherche plein-texte (FTS) |
| **Notes locales** | SQLite (même base) ou MMKV | Privé, persistant, rapide |
| **État global** | Zustand + React Query | Léger ; React Query pour le cache Supabase |
| **Backend** | **Supabase** | Auth, Postgres, Realtime, RLS |
| **Auth** | Sign in with Apple + Google (via Supabase Auth) | Natif, conforme aux exigences Apple |
| **Push** | Expo Notifications + table tokens Supabase | Rappels & messages |
| **i18n** | `i18next` / `expo-localization` | Multilingue FR/EN |
| **UI / Thème** | Système de thème maison (tokens) ou Tamagui | Sépia / terre cuite + dark/light |

---

## 3. Modèle de données

### A. Données LOCALES (SQLite sur l'appareil)

```
bible_versions      (id, code, nom, langue, copyright)
books               (id, version_id, ordre, nom, nom_court, testament)
chapters            (id, book_id, numero)
verses              (id, chapter_id, numero, texte)   ← FTS pour la recherche

notes               (id, book, chapter, verse, contenu, created_at, updated_at)
highlights          (id, book, chapter, verse, couleur)
bookmarks           (id, book, chapter, verse, label)
reading_progress    (book, chapter, lu_at)
preferences         (theme, taille_police, police, langue)

-- Quiz (questions embarquées comme la Bible)
quizzes             (id, book, titre, description)
quiz_questions      (id, quiz_id, enonce, ordre, verset_ref?)   -- verset_ref = renvoi à l'Écriture
quiz_options        (id, question_id, texte, is_correct)
quiz_attempts       (id, quiz_id, score, total, completed_at)   -- résultats perso (locaux)
```

### B. Données CLOUD (Supabase / Postgres, protégées par RLS)

```
profiles        (id→auth.users, nom, avatar_url, push_token)
groups          (id, nom, description, code_invitation, owner_id, created_at)
group_members   (group_id, user_id, role[admin|membre], joined_at)
study_plans     (id, group_id, titre, description)
plan_sessions   (id, plan_id, semaine, titre, passage_ref, date_prevue)
                 -- ex: {book:'Jean', chapter:15, verses:'1-17'}
messages        (id, group_id, session_id?, user_id, contenu, created_at)
reminders       (id, group_id, type, message, scheduled_at)
```

> Note : les **scores de quiz restent personnels et locaux** (pas de table cloud) — décision validée.

> **Sécurité (RLS) :** un membre ne voit que les groupes auxquels il appartient ; seul un `admin` modifie le plan et envoie des annonces. Les **notes personnelles ne quittent jamais l'appareil**.

---

## 4. Parcours utilisateur clés

1. **Onboarding** → Sign in (Apple/Google) → choix langue & version → téléchargement Bible locale.
2. **Lecture** → Genèse…Apocalypse, navigation livre/chapitre, réglages (thème, police, taille), appui long sur un verset → note / surlignage / marque-page.
3. **Quiz du livre** → une fois tous les chapitres d'un livre lus, le quiz se débloque → questions à choix multiple (renvoi possible au verset) → score, correction, possibilité de recommencer.
4. **Rejoindre / créer un groupe** → créer (devient admin, génère code + lien) ou rejoindre via code/lien.
5. **Plan d'étude commun** → l'admin définit le passage de la semaine → membres notifiés → tous lisent le même texte.
6. **Échanges** → fil de discussion par session de plan ; annonces de l'admin.
7. **Notifications** → rappel de lecture, nouveau passage publié, nouveau message.

---

## 5. Architecture des dossiers (proposée)

```
APPLI_BIBLIQUE/
├── app/                    # Écrans (Expo Router)
│   ├── (auth)/             # login, onboarding
│   ├── (tabs)/             # Lire · Groupes · Plans · Profil
│   ├── reader/[book]/[chapter].tsx
│   └── groups/[id]/...
├── src/
│   ├── components/         # UI réutilisable (Verse, ThemeText…)
│   ├── theme/              # tokens couleurs (terre cuite, sépia), dark/light
│   ├── db/                 # SQLite : schéma, requêtes Bible & notes
│   ├── lib/supabase/       # client, auth, requêtes groupes/plans
│   ├── features/           # reader, notes, quiz, groups, plans, notifications
│   ├── i18n/               # fr.json, en.json
│   └── store/              # Zustand
├── assets/
│   ├── bibles/segond1910.(sqlite|json)   # texte embarqué
│   ├── quiz/                             # banques de questions par livre (JSON)
│   └── fonts/
└── supabase/
    ├── migrations/         # tables + RLS
    └── functions/          # edge functions (push, invitations)
```

---

## 6. Identité visuelle « Demeure »

- **Palette terre cuite / sépia :**
  - Primaire (terre cuite) : `#C0683F`
  - Fond clair (papier) : `#F5EFE6` · texte : `#3A2E25`
  - Fond sombre : `#1E1814` · texte : `#E8DECF`
  - Accent doré discret pour les surlignages
- **Typographie :** une serif chaleureuse pour la lecture (ex. *Lora*, *Source Serif*), choisie / ajustable par l'utilisateur.
- **Ton :** marges généreuses, ambiance « livre », transitions douces.

---

## 7. Phases de réalisation (roadmap)

| Phase | Contenu | Résultat | Statut |
|---|---|---|---|
| **0 — Setup** | Expo + TS + Expo Router + thème + navigation 4 onglets | Squelette qui tourne iOS/Android | ✅ |
| **1 — Bible MVP** | Import Segond 1910 → SQLite, lecteur hors-ligne, réglages | Lire toute la Bible, dark/clair, police | ⬜ |
| **2 — Étude perso** | Notes, surlignages, marque-pages (locaux) | Étude individuelle complète | ⬜ |
| **3 — Quiz par livre** | Questions embarquées, déblocage après lecture, score & correction | Compréhension vérifiée par livre | ⬜ |
| **4 — Comptes** | Supabase Auth (Apple+Google), profils | Connexion | ⬜ |
| **5 — Groupes** | Créer/rejoindre, membres, rôles, RLS | Dimension collective de base | ⬜ |
| **6 — Plans + Messages** | Plan hebdo, sessions, fil de discussion | Cœur « église » | ⬜ |
| **7 — Notifications** | Expo Push (rappels, nouveau passage, messages) | Engagement | ⬜ |
| **8 — Polish + stores** | i18n complet, accessibilité, publication App Store / Play | Lancement | ⬜ |

---

## 8. Points d'attention

- ⚖️ **Droits des textes :** rester sur des versions **libres** (Segond 1910, KJV, WEB) tant qu'aucune licence n'est obtenue pour Semeur / NIV.
- 🍎 **Exigence Apple :** Sign in with Apple **obligatoire** dès qu'un autre login social (Google) est proposé — déjà prévu.
- 📦 **Taille de l'app :** la Bible embarquée reste légère (~5 Mo en SQLite) ; versions supplémentaires en téléchargement à la demande.
- 🔒 **Confidentialité :** notes 100 % locales = argument fort et simple à tenir.

---

## 9. Quiz par livre (détail)

**Objectif :** après avoir lu un livre (Genèse, Exode… Apocalypse), l'utilisateur passe un quiz pour vérifier et ancrer sa compréhension. Parfait pour l'animation d'un groupe.

- **Déblocage :** le quiz d'un livre devient disponible quand `reading_progress` couvre tous ses chapitres (badge « Quiz disponible »).
- **Format des questions :** choix multiple (1 bonne réponse), avec renvoi optionnel au verset concerné (lien vers le lecteur).
- **Résultats :** score affiché, correction question par question, possibilité de recommencer ; suivi des scores perso en local (`quiz_attempts`).
- **Embarqué & hors-ligne :** les questions sont fournies avec l'app (comme le texte biblique), donc disponibles sans connexion.

### ✅ Décisions validées

1. **Origine des questions :** **pré-fournies dans l'app** — banque de questions rédigée et livrée pour chaque livre (rédaction confiée à l'assistant). Pas de création par l'animateur dans cette version.
2. **Scores :** **strictement personnels et locaux** (`quiz_attempts`). Pas de classement de groupe, pas de table cloud.

**Production des questions (à faire en Phase 3) :**
- Une banque par livre (66 livres), questions à choix multiple, avec renvoi au verset.
- Format de stockage : fichier(s) **JSON** versionné(s) dans `assets/quiz/` puis importé(s) en SQLite au premier lancement.
- Volume cible indicatif : ~8–12 questions par livre au départ (ajustable).

---

## 10. Sources possibles pour le texte Segond 1910 (libre de droits)

- Formats publics couramment disponibles : **JSON**, **USFM**, **OSIS**, **SQLite**.
- Pistes : dépôts open-source de Bibles (ex. projets « bible-databases » sur GitHub), exports YouVersion/SWORD du domaine public.
- ⚠️ Vérifier que la source correspond bien à l'édition **Segond 1910** (et non une révision sous copyright) avant intégration.

---

*Prochaine étape proposée : Phase 0 — création du projet Expo + mise en place du thème terre cuite.*
