# Nuance Art — journal de construction

Boutique en ligne de tableaux / affiches d'art (référence client : massinart.ma),
avec **studio d'essayage sur la photo du mur du client** et **page promotions**.

## Décisions prises (validées par le client le 2026-09-05)

| Sujet | Choix |
|---|---|
| Architecture | Full-stack : Next.js 15 (App Router) + base + `/admin` maison |
| Langue | Français uniquement (arabe possible plus tard) |
| Essai en pièce | Studio canvas 100 % navigateur (pas d'IA générative) |
| Catalogue | Catalogue de démonstration réel, remplaçable par l'admin |
| CSS | CSS pur, aucun framework |

## Lancer le projet

```bash
npm install
npm run seed      # remplit la base depuis data/catalogue.json
npm run dev       # http://localhost:3210
```

Admin : `/admin`. Les identifiants sont ceux de `ADMIN_EMAIL` / `ADMIN_PASSWORD`
dans `.env.local` (fichier non commite ; partir de `.env.example`).

**Base de données** : `MONGODB_URI` vide dans `.env.local` → le site utilise le store
fichier `.data/db.json` (démo immédiate, zéro installation). Dès qu'on renseigne une
URI Atlas, `npm run seed` et le site basculent sur MongoDB sans changer une page.
⚠ Le store fichier garde les données en mémoire : **redémarrer `npm run dev` après un
`npm run seed`**, sinon l'ancien catalogue reste affiché.

## Données de démonstration

- **81 œuvres** issues de l'API Open Access du **Metropolitan Museum** (CC0, domaine
  public), 12 collections. `scripts/build_catalogue.mjs` télécharge, optimise en webp
  (1400 px + vignette 520 px), déduit format et couleur dominante, ajoute la grille de
  tailles/prix en dirhams.
  (L'Art Institute of Chicago a été essayé d'abord : son API répond mais **le serveur
  d'images IIIF renvoie 403** depuis ici. Ne pas y revenir.)
- **Titres français** relus à la main dans `data/titres_fr.json`, appliqués par le seed ;
  le titre d'origine est conservé dans `titreOriginal` et cité dans la description.
- **6 photos de pièces** CC0 (Wikimedia Commons, fichiers « (Unsplash) ») dans
  `data/pieces.json`. `scripts/build_pieces.mjs` les note automatiquement (mur clair,
  peu texturé, peu saturé) ; la sélection finale des 6 a été faite à l'œil parmi 12.

## Fait et vérifié à l'écran

- Design system complet (`app/globals.css` + `app/studio.css`), Fraunces + Manrope.
- En-tête méga-menu + recherche instantanée + tiroir mobile, pied de page, toasts.
- **Accueil** : héros avec œuvre accrochée sur un vrai mur (rotation auto), bandeau,
  rassurance, bento collections, best-sellers, section studio, promotions, par pièce,
  atelier, avis, FAQ (JSON-LD), CTA WhatsApp.
- **Studio** (`components/Studio.jsx`) : photo perso ou appareil photo, échelle réelle
  via largeur du mur, glisser/tourner, poignée d'angle qui s'aimante sur les formats
  vendus, 5 cadres + passe-partout + ombre, mur de plusieurs cadres, export PNG
  filigrané, ajout au panier. Tout en local, rien n'est envoyé au serveur.
- **Catalogue** filtrable (thème, format, couleur, pièce, promo, recherche, 5 tris),
  filtres dans l'URL — pages `/tableaux` et `/collections/[theme]`.
- **Fiche produit** : cadre et format en direct, prix recalculé, JSON-LD Product +
  BreadcrumbList, studio en fenêtre superposée, œuvres similaires.
- **Promotions** : héros + compte à rebours, chiffres clés, code promo, catalogue filtré.
- **Panier**, **commande** (validation FR, COD/virement, repli WhatsApp), **merci**,
  **favoris**.
- `app/api/commandes/route.js` : POST public (**prix recalculés côté serveur**),
  GET/PATCH réservés à l'admin.

### Espace d'administration (fait et vérifié en conditions réelles)

- **Deux racines** : `app/(boutique)/` et `app/(admin)/`. Les URL sont inchangées —
  les groupes entre parenthèses n'apparaissent jamais dans le chemin — mais l'admin
  ne charge ni l'en-tête, ni le pied de page, ni le catalogue de la boutique.
- **Connexion** `/admin/connexion` : JWT en cookie httpOnly (12 h), mot de passe
  bcrypt, message identique que l'e-mail existe ou non, cinq essais par minute.
  La garde vit dans `app/(admin)/admin/(espace)/layout.js` ; la page de connexion
  est hors de ce groupe, elle ne peut donc pas boucler sur elle-même.
- **API** : `/api/admin/connexion` + `deconnexion`, `/api/produits` (GET, POST,
  PATCH en lot pour les remises), `/api/produits/[slug]` (GET, PATCH, DELETE),
  `/api/reglages` (GET, PUT), `/api/televersement` (image → webp 1400 px + vignette
  520 px, comme `scripts/build_catalogue.mjs`). Toutes refusent en 401 sans session.
- **Écrans** : tableau de bord (6 KPI + dernières commandes), œuvres (recherche,
  filtres thème/état, bascule en ligne, suppression), fiche œuvre (création et
  modification, grille de tailles, téléversement, pièces conseillées, mise en avant),
  commandes (filtres par statut, détail dépliant, changement de statut, appel et
  WhatsApp en un clic), promotions (remise en lot + bandeau de la page /promotions),
  réglages (coordonnées ; les valeurs fixées dans le code sont affichées mais non
  modifiables, pour ne pas faire diverger prix affiché et prix facturé).
- **Validation côté serveur** dans `lib/produit.js` : le formulaire est libre, c'est
  l'API qui borne les valeurs (remise ≤ 90 %, note ≤ 5, pièces inconnues ignorées,
  tailles triées par prix, `prixMin` et `ratio` recalculés, slug unique).
- Vérifié en production locale : garde 401/307, mauvais mot de passe rejeté, création,
  modification, bascule, remise en lot, suppression, réglages, cycle complet d'une
  commande client jusqu'au changement de statut.

### Images : Cloudinary (2026-09-06)

- `lib/cloudinary.js` + `/api/televersement`. Si les trois variables Cloudinary sont
  renseignées, l'original part sur le CDN et on ne stocke que des **URL de
  transformation** (`c_limit,f_webp,q_82,w_1400` et `…,q_74,w_520`) : changer une
  taille plus tard ne demandera aucun ré-envoi. Sinon, repli automatique sur sharp
  et `public/media/art`, comme avant — même principe que `MONGODB_URI` vide.
- Le repli disque ne convient **pas** à Vercel ni Render : le disque y est effacé à
  chaque déploiement. Sur ces hébergeurs, Cloudinary est obligatoire et les trois
  variables doivent être posées dans le panneau du service.
- Le site n'utilise pas `next/image` (que des balises `<img>`) : aucun
  `remotePatterns` à déclarer dans `next.config.mjs`.
- Vérifié : envoi réel d'un PNG 1600×1000 par l'API admin, ratio 1.6 déduit, les deux
  URL renvoient bien du `image/webp`. Fichier de test supprimé du compte ensuite.

## Reste à faire (reprise)

1. **Pages éditoriales** : `/a-propos`, `/contact`, `/livraison-retours`, `/cgv`
   (dossiers créés dans `app/(boutique)/`, vides).
2. **SEO** : `app/sitemap.js` (ou route handler), `robots`, image OG `public/og.jpg`.
3. **Passe finale** : revue visuelle mobile, remplacer les coordonnées placeholder
   (elles se changent maintenant depuis `/admin/reglages`, plus dans le code).
4. Vérifier le studio au doigt sur un vrai téléphone (événements pointer).
5. Confort d'admin, si le client le demande : recherche dans les commandes,
   export CSV, deuxième compte administrateur.
6. **Faire tourner la clé Cloudinary** : celle en place a été exposée pendant la mise
   au point. En générer une dédiée dans la console, la coller dans `.env.local`, puis
   supprimer les anciennes.
7. `npm audit` signale sharp < 0.35 et postcss (via Next) en « high ». Antérieur à
   Cloudinary ; à traiter dans une passe de mise à jour, le correctif est cassant.

## Pièges déjà rencontrés

- `next/font` : ne pas passer `weight` **et** `axes` ensemble sur une police variable.
- `.frame` déclare `position: relative` ; dans le héros l'œuvre doit rester absolue —
  corrigé par `.scene .scene-art { position: absolute }` dans `studio.css`, chargé
  après `globals.css`.
- Le projet est sous OneDrive : si `.next` se corrompt (EINVAL / MODULE_NOT_FOUND),
  mettre OneDrive en pause ou déplacer le dossier.
- **`revalidatePath` et les groupes de routes** : la boutique est pré-rendue ; sans
  purge, une modification faite dans l'admin n'apparaît jamais en production.
  `revalidatePath('/', 'layout')` ne suffit pas ici — il ne rafraîchissait que la
  fiche demandée et laissait l'accueil et le catalogue sur l'ancienne version. Le
  chemin doit contenir le groupe : `revalidatePath('/(boutique)', 'layout')`
  (`lib/revalidation.js`, appelé par toutes les routes d'écriture).
- `sharp` est passé de `devDependencies` à `dependencies` : il ne sert plus seulement
  au script de catalogue, il traite aussi les images téléversées depuis l'admin.
