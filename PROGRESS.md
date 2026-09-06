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

### API separee sur Render (2026-09-06) — etape 1 sur 3 de l'architecture eclatee

Choix client : vitrine exportee en statique hebergee d'un cote, API Node de
l'autre, comme Para Lirana.

- `serveur/` : service Express autonome. `render.yaml` a la racine le decrit
  (build, sonde `/sante`, variables attendues) — deployable via Blueprint.
- **Base MongoDB Atlas obligatoire** : le service refuse de demarrer sans
  `MONGODB_URI`, plutot que de tomber en silence sur un store fichier que Render
  efface a chaque deploiement. Cluster `cluster0.xtuikmn.mongodb.net`, base
  `nuanceart`, seede avec les 81 oeuvres.
- **Jeton Bearer et non cookie httpOnly** : la vitrine statique sera servie
  depuis un autre domaine, elle ne peut pas recevoir de cookie de l'API. Le
  jeton vit dans `localStorage` — d'ou 12 h de validite et un secret long.
- **`serveur/partage/` est genere**, jamais edite : `scripts/sync-partage.mjs`
  recopie `lib/{taxonomie,prix,produit,cloudinary}.js` et `lib/store/mongo.js`.
  La copie est necessaire parce que le `package.json` de la racine ne declare
  pas `"type": "module"` — importes tels quels, ces fichiers seraient lus comme
  du CommonJS et leur `export` rejete. Modifier `lib/`, jamais `partage/`.
- CORS pilote par `ORIGINES_AUTORISEES` (liste separee par des virgules). Sans
  le vrai domaine de la vitrine, le navigateur bloquera chaque appel.
- Verifie contre le vrai cluster : catalogue public, connexion et refus, CRUD
  complet, bridage des valeurs, commande publique avec recalcul des prix, refus
  d'une oeuvre inconnue, changement de statut, reglages, televersement
  Cloudinary de bout en bout. Donnees de test supprimees ensuite.

**Reste de l'architecture eclatee** : (2) instantane de pre-build + `output:
'export'` pour la vitrine, (3) admin en application cliente appelant l'API.
Attention : l'export statique supprime `revalidatePath`, tout le mecanisme de
rafraichissement decrit plus bas devient caduc de ce cote.

### Vitrine et admin en export statique (2026-09-06) — etapes 2 et 3 sur 3

L'architecture eclatee est complete. `npm run build` produit `out/`, 109 pages,
aucun serveur Next en production.

- `scripts/snapshot.mjs` (script **prebuild**, donc automatique) va chercher
  `/api/catalogue` et ecrit `data/snapshot.json`. `lib/catalogue.js` remplace
  `lib/store` cote vitrine et lit ce fichier — les pages n'ont eu qu'un import
  a changer. Si l'API ne repond pas, le script reutilise l'instantane precedent
  en le disant tres fort, et n'echoue que s'il n'y en a aucun.
- **Consequence assumee : la vitrine ne se met plus a jour toute seule.** Elle
  est figee a l'instantane du build. `revalidatePath` n'existe plus en export
  statique : `lib/revalidation.js` et `app/api/` ont ete supprimes.
- L'admin est devenue une **application cliente** : `lib/api.js` (jeton Bearer
  dans localStorage), `components/admin/Garde.jsx` pour la redirection, et
  `useDonnees.js` qui mutualise chargement / erreur / rechargement / sortie sur
  401. `lib/auth.js` a disparu, l'authentification vit dans `serveur/auth.js`.
- La fiche produit passe de `/admin/produits/[slug]` a
  **`/admin/produits/editer?slug=…`** : un export statique ne peut pas fabriquer
  une route dynamique pour un slug qui n'existe pas encore au build.
- `/commande/merci` lisait `searchParams` cote serveur : converti en composant
  client sous `Suspense`, exige par `useSearchParams`.
- `next.config.mjs` : `output: 'export'`, `images.unoptimized`, `trailingSlash`
  (chaque page devient un dossier avec son index.html, servi sans reecriture).
  `npm start` ne peut plus etre `next start` : il sert `out/`.

**Verifie pour de vrai** : build 109 pages, `out/` servi en local sur le port
3210, toutes les pages en 200, accueil et fiches contenant bien le catalogue et
les JSON-LD ; preflight CORS accepte depuis la vitrine ; commande reelle passee
depuis la vitrine statique vers l'API (1280 DH, montant recalcule par le serveur
et verifie contre le catalogue) ; dans un vrai navigateur (Edge sans interface) :
`/admin/` sans jeton redirige vers la connexion sans laisser fuiter l'interface,
et avec un jeton valide le tableau de bord se remplit depuis l'API (81 oeuvres).
Donnees de test supprimees.

## Reste à faire (reprise)

1. **Héberger la vitrine** : publier `out/` (Hostinger, Netlify, Vercel statique…),
   puis ajouter le domaine reel a `ORIGINES_AUTORISEES` sur Render — sinon le
   navigateur bloquera tous les appels a l'API.
2. **Pages éditoriales** : `/a-propos`, `/contact`, `/livraison-retours`, `/cgv`
   (dossiers créés dans `app/(boutique)/`, vides).
3. **SEO** : `app/sitemap.js` (ou route handler), `robots`, image OG `public/og.jpg`.
4. **Passe finale** : revue visuelle mobile, remplacer les coordonnées placeholder
   (elles se changent maintenant depuis `/admin/reglages`, plus dans le code).
5. Vérifier le studio au doigt sur un vrai téléphone (événements pointer).
6. Confort d'admin, si le client le demande : recherche dans les commandes,
   export CSV, deuxième compte administrateur.
7. **Faire tourner les identifiants exposes pendant la mise au point** : cle
   Cloudinary, et mot de passe de l'utilisateur Atlas `infonuanceart_db_user`
   (Atlas > Database Access > Edit > Edit Password). Penser a reporter la
   nouvelle URI dans `.env.local` et dans Render.
8. **Mot de passe administrateur** : celui du seed initial est trop faible pour une
   boutique en ligne, et l'API est publique. Choisir une valeur forte dans
   `ADMIN_PASSWORD` (`.env.local`) puis relancer `npm run seed`. Ne jamais ecrire
   un mot de passe reel dans ce fichier : il est publie.
9. `npm audit` signale sharp < 0.35 et postcss (via Next) en « high ». Antérieur à
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
