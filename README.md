# Les Secrets Gourmands d'Argenteuil

Jeu de devinettes en ligne : les participants scannent un QR code (sur une table,
une affiche, au dos d'un menu), répondent à 5 devinettes sur Argenteuil et
laissent, s'ils le souhaitent, un avis. Toutes les réponses sont enregistrées et
restituées dans un tableau de bord pour l'organisateur.

- **Côté visiteur** : accueil → prénom / quartier (facultatifs) → 5 devinettes →
  score, récapitulatif et avis. Pensé pour le téléphone, anonyme, 2 minutes.
- **Côté organisateur** (`/admin`) : chiffres clés, graphiques, avis, exports
  CSV, bilan imprimable (A4 / PDF) et générateur de QR codes.

## Sommaire

1. [Installation en local](#1-installation-en-local)
2. [Créer le projet Supabase](#2-créer-le-projet-supabase)
3. [Variables d'environnement](#3-variables-denvironnement)
4. [Déployer sur Vercel, pas à pas](#4-déployer-sur-vercel-pas-à-pas)
5. [Modifier les questions et les textes](#5-modifier-les-questions-et-les-textes)
6. [Générer les QR codes](#6-générer-les-qr-codes)
7. [L'espace organisateur](#7-lespace-organisateur)
8. [Données de démonstration : `seed` et `reset`](#8-données-de-démonstration--seed-et-reset)
9. [Confidentialité et sécurité](#9-confidentialité-et-sécurité)
10. [Organisation du code](#10-organisation-du-code)
11. [Avant le jour J : la liste de vérification](#11-avant-le-jour-j--la-liste-de-vérification)
12. [En cas de souci](#12-en-cas-de-souci)

---

## 1. Installation en local

Prérequis : [Node.js](https://nodejs.org) 20 ou plus récent.

```bash
npm install
```

```bash
cp .env.example .env.local
```

Remplissez ensuite `.env.local` (voir les sections 2 et 3), puis lancez le site :

```bash
npm run dev
```

Le jeu est sur <http://localhost:3000> et l'espace organisateur sur
<http://localhost:3000/admin>.

Autres commandes utiles :

| Commande            | Rôle                                                    |
| ------------------- | ------------------------------------------------------- |
| `npm run build`     | Construit la version de production                      |
| `npm run start`     | Lance la version construite                             |
| `npm run lint`      | Vérifie le code (ESLint)                                |
| `npm run typecheck` | Vérifie les types TypeScript                            |
| `npm run seed`      | Ajoute ~80 fausses participations pour une démonstration |
| `npm run reset`     | Vide la base avant le vrai lancement                    |

## 2. Créer le projet Supabase

1. Créez un compte sur [supabase.com](https://supabase.com) puis un nouveau
   projet. Choisissez une **région européenne** (Paris ou Francfort, par
   exemple) : les données restent ainsi dans l'Union européenne.
2. Dans le menu, ouvrez **SQL Editor** → **New query**.
3. Copiez-collez tout le contenu de [`supabase/schema.sql`](supabase/schema.sql)
   et cliquez sur **Run**. Trois tables sont créées : `sessions`, `answers`,
   `feedback`. Le script peut être relancé sans risque.
4. Ouvrez **Project Settings → API** (ou **API Keys**) et notez :
   - l'adresse du projet (**Project URL**) → `SUPABASE_URL` ;
   - la clé **`service_role`** (sur les projets récents : **Secret key**, qui
     commence par `sb_secret_…`) → `SUPABASE_SERVICE_ROLE_KEY`.

> ⚠️ Cette clé donne tous les droits sur la base. Elle ne doit jamais être
> publiée, ni préfixée par `NEXT_PUBLIC_`. Le site ne l'utilise que côté serveur.

La sécurité « RLS » est activée sur les trois tables, **sans aucune règle
publique** : personne ne peut lire ou écrire directement dans la base depuis
Internet. Tout passe par les routes du site.

## 3. Variables d'environnement

| Variable                    | Rôle                                                                 | Exemple                         |
| --------------------------- | -------------------------------------------------------------------- | ------------------------------- |
| `SUPABASE_URL`              | Adresse du projet Supabase                                           | `https://abcd1234.supabase.co`  |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé secrète du projet Supabase (serveur uniquement)                  | `eyJ…` ou `sb_secret_…`         |
| `ADMIN_PASSWORD`            | Mot de passe de l'espace organisateur. Choisissez-le long.           | une phrase de plusieurs mots    |
| `NEXT_PUBLIC_SITE_URL`      | **Facultatif.** Adresse vers laquelle pointent les QR codes. Par défaut : `https://qcm-argenteuil.vercel.app`. À renseigner seulement si l'adresse change. | `https://jeu.exemple.fr` |

En local, elles vont dans `.env.local` (fichier jamais envoyé sur GitHub). Sur
Vercel, elles se règlent dans les paramètres du projet (section suivante).

## 4. Déployer sur Vercel, pas à pas

1. Envoyez le code sur GitHub (c'est déjà le cas si vous lisez ce fichier dans
   votre dépôt).
2. Sur [vercel.com](https://vercel.com), cliquez sur **Add New… → Project** et
   importez le dépôt. Vercel reconnaît Next.js tout seul : ne changez rien aux
   réglages de construction.
3. Nommez le projet **`qcm-argenteuil`** : le site sera alors à l'adresse
   `https://qcm-argenteuil.vercel.app`, celle qu'utilisent les QR codes.
4. Avant de valider, dépliez **Environment Variables** et ajoutez les trois
   variables obligatoires de la section 3 (`SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`).
5. Cliquez sur **Deploy**.
6. Ouvrez le site, jouez une partie, puis vérifiez dans `/admin` qu'elle
   apparaît.

Si un jour le site change d'adresse (nom de domaine personnalisé, par
exemple) : ajoutez `NEXT_PUBLIC_SITE_URL` avec la nouvelle adresse dans
**Settings → Environment Variables**, puis relancez un déploiement
(**Deployments → ⋯ → Redeploy**). Sans nouveau déploiement, les QR codes
garderaient l'ancienne adresse.

Chaque envoi sur la branche principale du dépôt redéploie ensuite le site
automatiquement.

## 5. Modifier les questions et les textes

Tout le contenu se trouve dans le dossier [`data/`](data) :

| Fichier                                  | Contenu                                                              |
| ---------------------------------------- | -------------------------------------------------------------------- |
| [`data/questions.ts`](data/questions.ts) | Les devinettes, leurs 4 réponses, la bonne réponse et l'anecdote     |
| [`data/site.ts`](data/site.ts)           | Titre, sous-titre, phrase de fin, messages de score, page confidentialité |
| [`data/districts.ts`](data/districts.ts) | La liste des quartiers proposés                                      |

Une devinette ressemble à ceci :

```ts
{
  id: 1,
  text: "Je relie deux rives au-dessus de la Seine. […] Qui suis-je ?",
  options: [
    { id: "pont-argenteuil", label: "Le pont d'Argenteuil", correct: true },
    { id: "pont-bezons", label: "Le pont de Bezons" },
    { id: "pont-saint-ouen", label: "Le pont de Saint-Ouen" },
    { id: "pont-neuilly", label: "Le pont de Neuilly" },
  ],
  anecdote: "Claude Monet, installé à Argenteuil de 1871 à 1878, […]",
},
```

- `label` (le texte affiché), `text` et `anecdote` se modifient librement, à
  tout moment.
- `correct: true` désigne la bonne réponse — une seule par devinette.
- `id` est l'identifiant enregistré en base : **ne le changez plus une fois le
  jeu lancé**, sinon les anciennes réponses ne seraient plus reconnues dans les
  statistiques.
- L'ordre des réponses est mélangé à chaque partie : leur ordre dans le fichier
  n'a pas d'importance.
- Vous pouvez ajouter ou retirer des devinettes : le score, la barre de
  progression et le tableau de bord s'adaptent.

En cas d'erreur de saisie (deux bonnes réponses, identifiant en double…), le
site refuse de démarrer et indique la devinette concernée.

Les apostrophes droites (`'`) sont converties automatiquement en apostrophes
typographiques (`’`) à l'affichage : écrivez simplement.

## 6. Générer les QR codes

1. Connectez-vous sur `/admin`, puis ouvrez **QR codes**.
2. Choisissez le support : **Table**, **Affiche**, **Menu**, ou **Autre…** pour
   saisir le vôtre (par exemple « marché »). Le support est ajouté à l'adresse
   sous la forme `?src=table` : le tableau de bord indique ensuite quel support
   a été scanné.
3. Téléchargez le QR code en **PNG haute résolution** (2048 × 2048 px) ou en
   **SVG** (vectoriel, pour un imprimeur).
4. Ou imprimez directement un gabarit prêt à l'emploi :
   - **Affichette A5** ;
   - **Chevalet de table** : une feuille A4 à plier en deux, lisible des deux
     côtés.

   Dans la fenêtre d'impression, réglez les marges sur « Aucune » et cochez
   « Graphiques d'arrière-plan » pour conserver le fond crème.

Les QR codes mènent à `https://qcm-argenteuil.vercel.app` (l'adresse exacte
est affichée sous « Adresse encodée »).

> ⚠️ Un QR code imprimé ne se modifie plus : vérifiez l'adresse encodée, et
> testez un QR code avec votre téléphone avant de lancer l'impression.

## 7. L'espace organisateur

Accessible sur `/admin`, protégé par le mot de passe `ADMIN_PASSWORD` (session
de 12 heures).

**Tableau de bord**

- Chiffres clés : participants, parties terminées et taux de complétion, score
  moyen, note moyenne du jeu, nombre de commentaires.
- Taux de bonnes réponses par devinette, de la plus facile à la plus difficile.
- Répartition des réponses de chaque devinette, bonne réponse mise en évidence :
  ce que les participants connaissent — ou pas — de leur ville.
- Distribution des scores, participations dans le temps (par heure ou par
  jour), entonnoir d'abandon, répartition par quartier et par source.
- Commentaires des participants, avec une recherche par mot.

**Filtres** — période (du / au), source, et case « Inclure les parties
rejouées » (décochée par défaut). Ils s'appliquent à tout : chiffres,
graphiques, avis, exports et bilan imprimable. Les dates sont à l'heure de
Paris.

**Exports**

- **Exporter en CSV** : les réponses brutes, une ligne par réponse.
- **Exporter les avis en CSV** : notes et commentaires.
- **Version imprimable** : un bilan de trois pages A4 (synthèse, détail des
  devinettes, public et avis) à imprimer ou à enregistrer en PDF pour une
  réunion.

Les fichiers CSV s'ouvrent directement dans Excel (séparateur « ; », accents
conservés).

## 8. Données de démonstration : `seed` et `reset`

Pour que le tableau de bord soit parlant pendant une démonstration :

```bash
npm run seed
```

Ce script ajoute environ 80 fausses participations réalistes : une grande
soirée il y a trois jours puis des visites étalées, des scores variés, des
abandons en cours de route, plusieurs sources, des notes et des commentaires,
et quelques parties rejouées. Il lit les clés dans `.env.local` et refuse
d'écrire dans une base qui contient déjà des participations (ajoutez
`-- --force` pour passer outre, ou `-- --count 150` pour changer le nombre).

**Avant le vrai lancement**, videz la base :

```bash
npm run reset
```

Le script affiche ce qui va être supprimé et demande de taper `SUPPRIMER` pour
confirmer. L'opération est irréversible : exportez les CSV avant si vous
souhaitez garder une trace.

## 9. Confidentialité et sécurité

**Ce qui est enregistré** : les réponses et le score ; le prénom et le quartier
si le visiteur les indique ; la note et le commentaire s'il laisse un avis ; la
date, le type d'appareil (téléphone ou ordinateur) et le support scanné. Ni
adresse IP, ni nom, ni e-mail.

**Sur le téléphone du visiteur** : un identifiant anonyme tiré au hasard,
conservé dans le navigateur, pour retenir la partie et éviter les doublons.
Aucun cookie de suivi, aucun outil de mesure d'audience tiers.

**Page `/confidentialite`** : elle résume ces points pour les participants.
Trois réglages sont à adapter dans [`data/site.ts`](data/site.ts) (objet
`privacy`) :

- `contactEmail` — l'adresse de contact pour les demandes (vide par défaut :
  la page renvoie alors vers l'équipe organisatrice) ;
- `retentionMonths` — la durée de conservation annoncée (12 mois par défaut) ;
- `hostedInEU` — à passer à `true` si le projet Supabase est bien dans une
  région européenne, pour afficher la mention correspondante.

**Côté technique**

- La clé Supabase n'est utilisée que sur le serveur ; la RLS bloque tout accès
  direct à la base.
- Le score est toujours recalculé par le serveur à partir des réponses
  enregistrées : celui que pourrait envoyer un navigateur est ignoré.
- Une seule réponse par question et un seul avis par partie (contraintes en
  base).
- Limitation de débit par adresse IP sur les routes d'enregistrement. Les
  plafonds sont volontairement larges, car tous les téléphones connectés au
  même Wi-Fi partagent la même adresse.
- L'espace organisateur utilise un cookie `httpOnly` signé ; les tentatives de
  connexion sont limitées.

**Si le réseau flanche** : le jeu continue. Chaque réponse est d'abord gardée
sur le téléphone, puis envoyée ; en cas d'échec, l'envoi est retenté en
silence, y compris lors d'une visite ultérieure. Un message n'apparaît que si
les envois échouent de façon répétée.

## 10. Organisation du code

```
app/
  (public)/            Pages visiteur : accueil, /jeu, /resultat, /confidentialite
  admin/               Espace organisateur : connexion, tableau de bord, QR codes,
                       pages imprimables
  api/                 Routes d'enregistrement (session, answer, complete, feedback)
                       et exports CSV (admin/export)
components/
  quiz/                Écrans du jeu
  admin/               Tableau de bord, graphiques (Recharts), générateur de QR codes
  illustrations/       Dessins SVG maison (pont, asperges, figue, vague)
  ui/                  Boutons
data/                  ← Le contenu à modifier : questions, textes, quartiers
lib/
  client/              État de la partie sur le téléphone et file d'envoi vers l'API
  server/              Accès Supabase, limitation de débit, données du tableau de bord
  stats.ts             Calcul des statistiques
  auth.ts              Session organisateur (cookie signé)
scripts/               npm run seed / npm run reset
supabase/schema.sql    Schéma de la base, à coller dans Supabase
middleware.ts          Protection de /admin et /api/admin
```

Technologies : Next.js 15 (App Router), TypeScript, Tailwind CSS 4, Supabase
(Postgres), Recharts, `qrcode`.

## 11. Avant le jour J : la liste de vérification

- [ ] `supabase/schema.sql` exécuté dans Supabase ; les trois variables
      obligatoires renseignées sur Vercel.
- [ ] Le site répond bien sur `https://qcm-argenteuil.vercel.app`.
- [ ] Une partie jouée de bout en bout sur un téléphone, en 4G ; elle apparaît
      dans `/admin`.
- [ ] Liste des quartiers (`data/districts.ts`) et page confidentialité
      (`data/site.ts`) relues et validées.
- [ ] `npm run reset` lancé pour effacer les données de démonstration.
- [ ] QR codes générés, imprimés, et **testés** avec deux téléphones différents.
- [ ] Mot de passe de l'espace organisateur transmis aux bonnes personnes.
- [ ] Plus aucune mise en ligne prévue pendant l'événement : un redéploiement
      en cours de partie oblige les visiteurs à recharger la page (leurs
      réponses sont conservées).

## 12. En cas de souci

| Symptôme                                                        | Piste                                                                                         |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `/admin` affiche « La base de données n'est pas encore branchée » | `SUPABASE_URL` ou `SUPABASE_SERVICE_ROLE_KEY` manquante. Après correction sur Vercel : redéployer. |
| `/admin` affiche « Impossible de lire les données »             | Le schéma n'a pas été exécuté, ou la clé n'est pas la clé secrète (`service_role`).            |
| La connexion indique que `ADMIN_PASSWORD` est manquante         | Ajoutez la variable, puis redéployez.                                                          |
| Le QR code mène à une mauvaise adresse                          | Vérifiez que le projet Vercel s'appelle bien `qcm-argenteuil`, ou réglez `NEXT_PUBLIC_SITE_URL`, redéployez, puis régénérez le QR code. |
| Un visiteur voit « Connexion instable »                         | Ses réponses sont gardées sur son téléphone et partiront dès le retour du réseau.              |
| Les parties n'apparaissent pas dans le tableau de bord          | Vérifiez les filtres (période, source) et les journaux du projet sur Vercel (onglet **Logs**). |
