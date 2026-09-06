# Nuance Art

Boutique en ligne de tableaux et d'affiches d'art, avec un **studio d'essayage** qui
place l'œuvre à l'échelle réelle sur la photo du mur du client, et un espace
d'administration maison.

Next.js 15 (App Router), CSS pur, aucun framework d'interface.

## Démarrer

```bash
npm install
cp .env.example .env.local   # puis compléter le fichier
npm run seed                 # remplit la base depuis data/catalogue.json
npm run dev                  # http://localhost:3210
```

`npm run seed` affiche les identifiants du compte administrateur. Si `ADMIN_PASSWORD`
n'est pas renseigné dans `.env.local`, un mot de passe est tiré au hasard et affiché
une seule fois — notez-le.

> Le store fichier garde les données en mémoire : **redémarrer `npm run dev` après un
> `npm run seed`**, sinon l'ancien catalogue reste affiché.

## Configuration

Tout passe par `.env.local` (jamais commité, voir `.env.example`).

| Variable | Rôle |
|---|---|
| `MONGODB_URI` | Vide → store fichier `.data/db.json`. Renseigné → MongoDB, sans changer une page. |
| `AUTH_SECRET` | Signe le cookie admin. Chaîne aléatoire longue : qui la connaît peut forger une session. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Compte créé par `npm run seed`. |
| `CLOUDINARY_*` | Vide → images écrites dans `public/media/art`. Renseigné → envoi sur le CDN. |

## Architecture

```
app/(boutique)/   vitrine publique — accueil, catalogue, fiche, studio, panier, commande
app/(admin)/      espace d'administration, racine séparée (ni en-tête ni pied de page)
app/api/          routes serveur ; tout ce qui écrit exige une session admin
lib/store/        même interface pour MongoDB et pour le store fichier
lib/produit.js    validation serveur des fiches saisies dans l'admin
```

Les deux dossiers entre parenthèses sont des **groupes de routes** : ils n'apparaissent
jamais dans les URL publiques.

## Points d'attention

- Les pages publiques sont pré-rendues. Toute route d'écriture appelle
  `rafraichirBoutique()` (`lib/revalidation.js`), sans quoi une modification faite dans
  l'admin resterait invisible jusqu'au prochain déploiement. Le chemin doit contenir le
  groupe : `revalidatePath('/(boutique)', 'layout')`.
- Le repli disque pour les images ne convient pas à Vercel ni Render, dont le système de
  fichiers est effacé à chaque déploiement : y configurer Cloudinary.
- Le catalogue de démonstration provient de l'API Open Access du **Metropolitan Museum**
  (domaine public, CC0).

`PROGRESS.md` tient le journal détaillé de construction : ce qui est fait, ce qui reste,
et les pièges déjà rencontrés.
