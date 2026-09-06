# API Nuance Art

Service Node/Express deploye sur Render. Il porte tout ce qui ecrit : catalogue,
commandes, reglages, images. La vitrine est exportee en statique et hebergee
ailleurs ; elle appelle cette API.

## Lancer en local

```bash
cd serveur
npm install
npm run dev        # http://localhost:4310
```

`npm run dev` regenere d'abord `partage/`. Les variables sont lues dans le
`.env.local` de la racine du depot.

## Variables

| Variable | Obligatoire | Role |
|---|---|---|
| `MONGODB_URI` | oui | Cluster Atlas. Le service **refuse de demarrer** sans. |
| `MONGODB_DB` | non | Nom de base, `nuanceart` par defaut. |
| `AUTH_SECRET` | oui | Signe les jetons admin. 16 caracteres minimum, aleatoire. |
| `ORIGINES_AUTORISEES` | oui | Domaines de la vitrine, separes par des virgules. |
| `CLOUDINARY_*` | pour les images | Sans elles, `/api/televersement` repond 503. |
| `PORT` | non | Fourni par Render. 4310 en local. |

## Routes

Publiques :

| Methode | Chemin | Role |
|---|---|---|
| GET | `/sante` | Sonde de sante de Render. Ne touche pas la base. |
| GET | `/api/catalogue` | Oeuvres actives + reglages, en une requete. Lu par le pre-build de la vitrine. |
| POST | `/api/commandes` | Passage de commande. Les prix sont recalcules cote serveur. |

Reservees a l'administration — en-tete `Authorization: Bearer <jeton>` :

| Methode | Chemin | Role |
|---|---|---|
| POST | `/api/admin/connexion` | Renvoie `{ jeton, nom }`. |
| POST | `/api/admin/deconnexion` | Sortie explicite ; le client jette le jeton. |
| GET | `/api/produits` | Catalogue complet, oeuvres masquees comprises. |
| POST | `/api/produits` | Creation. |
| PATCH | `/api/produits` | Remise appliquee a une selection. |
| GET PATCH DELETE | `/api/produits/:slug` | Fiche. |
| GET PATCH | `/api/commandes` | Liste, changement de statut. |
| GET PUT | `/api/reglages` | Reglages boutique. |
| POST | `/api/televersement` | Image (champ `fichier`) vers Cloudinary. |

## Code partage avec la vitrine

`partage/` est **genere**, pas ecrit a la main : `scripts/sync-partage.mjs`
recopie `lib/taxonomie.js`, `lib/prix.js`, `lib/produit.js`, `lib/cloudinary.js`
et `lib/store/mongo.js` depuis la racine du depot. Il n'y a donc qu'une source
de verite pour la validation des fiches et le calcul des prix.

La copie existe parce que le `package.json` de la racine ne declare pas
`"type": "module"` : importes directement, ces fichiers seraient lus comme du
CommonJS et leur syntaxe `export` serait rejetee.

**Modifier `lib/` a la racine, jamais `partage/`.** La synchronisation est
relancee par `npm run dev` et par le `buildCommand` de Render.

## Difference d'authentification avec l'application Next

L'application Next pose un cookie httpOnly. Impossible ici : la vitrine est
servie depuis un autre domaine que l'API. Le jeton part donc dans l'en-tete
`Authorization` et l'administration le conserve dans `localStorage` — lisible
par le JavaScript de la page, d'ou une duree de vie courte (12 h) et un secret
long.
