# Nuance Art

Boutique en ligne de tableaux et d'affiches d'art, avec un **studio d'essayage** qui
place l'œuvre à l'échelle réelle sur la photo du mur du client, et un espace
d'administration maison.

Next.js 15 (App Router), CSS pur, aucun framework d'interface.

**Architecture en deux moities.** La vitrine et l'administration sont exportees en
fichiers statiques (`out/`) et hebergees n'importe ou ; tout ce qui lit ou ecrit
en direct passe par l'API du dossier `serveur/`, deployee sur Render. Il n'y a
aucun serveur Next en production.

## Démarrer

```bash
npm install
cp .env.example .env.local   # puis compléter le fichier
npm run seed                 # remplit la base depuis data/catalogue.json
npm run dev                  # http://localhost:3210
```

Pour construire le site publiable :

```bash
npm run build                # prend l'instantané, puis exporte dans out/
npm start                    # sert out/ en local pour vérifier
```

`npm run build` lance d'abord `scripts/snapshot.mjs`, qui va chercher le catalogue
sur l'API et l'écrit dans `data/snapshot.json`. **Le site en ligne ne change donc
qu'à la reconstruction** : une modification faite dans l'admin n'apparaît pas
toute seule sur la vitrine.

`npm run seed` affiche les identifiants du compte administrateur. Si `ADMIN_PASSWORD`
n'est pas renseigné dans `.env.local`, un mot de passe est tiré au hasard et affiché
une seule fois — notez-le.

> Après un `npm run seed`, relancer `npm run snapshot` pour que la vitrine voie les
> nouvelles données.

## Configuration

Tout passe par `.env.local` (jamais commité, voir `.env.example`).

| Variable | Rôle |
|---|---|
| `NEXT_PUBLIC_API_URL` | Adresse de l'API. Lue par la vitrine **et** par le script d'instantané. |
| `MONGODB_URI` | Utilisée par `npm run seed` et par l'API. La vitrine n'y touche plus. |
| `AUTH_SECRET` | Signe les jetons admin, **côté API**. Doit être identique ici et sur Render. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Compte créé par `npm run seed`. |
| `CLOUDINARY_*` | Utilisées par l'API (`serveur/`) pour le stockage des images. |

## Architecture

```
app/(boutique)/   vitrine publique — accueil, catalogue, fiche, studio, panier, commande
app/(admin)/      administration : application cliente qui appelle l'API
serveur/          API Express déployée sur Render (voir serveur/README.md)
lib/catalogue.js  lecture de data/snapshot.json à la construction
lib/api.js        client de l'API côté navigateur (jeton Bearer, localStorage)
lib/produit.js    validation des fiches — partagée avec l'API
scripts/snapshot.mjs  instantané du catalogue, lancé avant chaque build
```

Les deux dossiers entre parenthèses sont des **groupes de routes** : ils n'apparaissent
jamais dans les URL publiques.

## Points d'attention

- **La vitrine ne se met pas à jour toute seule.** Elle est figée à l'instantané pris
  au moment du build. Après une modification dans l'admin, il faut reconstruire et
  redéployer. C'est le prix de l'export statique — assumé, pas un oubli.
- L'administration garde son jeton dans `localStorage`, pas dans un cookie httpOnly :
  servie depuis un autre domaine que l'API, elle ne peut pas recevoir de cookie. La
  vraie barrière reste l'API, qui refuse en 401 toute requête sans jeton.
- `ORIGINES_AUTORISEES` sur l'API doit contenir le domaine exact de la vitrine, sinon
  le navigateur bloque chaque appel. `curl` ne le détecte pas : seul un vrai navigateur
  applique le CORS.
- Le catalogue de démonstration provient de l'API Open Access du **Metropolitan Museum**
  (domaine public, CC0).

`PROGRESS.md` tient le journal détaillé de construction : ce qui est fait, ce qui reste,
et les pièges déjà rencontrés.
