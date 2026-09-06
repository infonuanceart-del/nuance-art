/**
 * Driver MongoDB (Mongoose). Activé dès que MONGODB_URI est renseigné.
 * Expose exactement la même interface que le store fichier.
 */
import mongoose from 'mongoose';

const { Schema } = mongoose;

const TailleSchema = new Schema(
  { l: Number, h: Number, prix: Number, ref: String },
  { _id: false },
);

const ProduitSchema = new Schema(
  {
    slug: { type: String, unique: true, index: true },
    titre: String,
    artiste: String,
    epoque: String,
    technique: String,
    description: String,
    theme: { type: String, index: true },
    format: { type: String, index: true },
    couleur: { type: String, index: true },
    ratio: Number,
    image: String,
    thumb: String,
    source: String,
    tailles: [TailleSchema],
    prixMin: Number,
    pieces: [String],
    nouveaute: Boolean,
    bestseller: Boolean,
    promo: { type: Number, default: 0 },
    note: Number,
    avis: Number,
    actif: { type: Boolean, default: true },
    ordre: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false },
);

const CommandeSchema = new Schema(
  {
    ref: { type: String, unique: true, index: true },
    client: {
      nom: String, tel: String, email: String,
      ville: String, adresse: String, note: String,
    },
    articles: [Schema.Types.Mixed],
    sousTotal: Number,
    livraison: Number,
    total: Number,
    paiement: String,
    statut: { type: String, default: 'nouvelle' },
  },
  { timestamps: true, versionKey: false },
);

const ReglagesSchema = new Schema({ cle: { type: String, unique: true }, valeur: Schema.Types.Mixed }, { versionKey: false });
const AdminSchema = new Schema({ email: { type: String, unique: true }, hash: String, nom: String }, { versionKey: false });

// En dev, Next recharge les modules : on met les modèles et la connexion en cache
// global pour éviter les erreurs « OverwriteModelError ».
const g = globalThis;
g.__nuance ??= { conn: null, promesse: null };

function modele(nom, schema) {
  return mongoose.models[nom] || mongoose.model(nom, schema);
}

async function connecter(uri) {
  if (g.__nuance.conn) return g.__nuance.conn;
  g.__nuance.promesse ??= mongoose
    .connect(uri, { dbName: process.env.MONGODB_DB || 'nuanceart', serverSelectionTimeoutMS: 8000 })
    .then((m) => {
      g.__nuance.conn = m;
      return m;
    });
  return g.__nuance.promesse;
}

const nu = (d) => (d ? JSON.parse(JSON.stringify(d)) : d);

export function creerStoreMongo(uri) {
  const Produit = modele('Produit', ProduitSchema);
  const Commande = modele('Commande', CommandeSchema);
  const Reglage = modele('Reglage', ReglagesSchema);
  const Admin = modele('Admin', AdminSchema);
  const pret = () => connecter(uri);

  return {
    type: 'mongodb',

    produits: {
      async tous() {
        await pret();
        return nu(await Produit.find().sort({ ordre: 1, createdAt: -1 }).lean());
      },
      async parSlug(slug) {
        await pret();
        return nu(await Produit.findOne({ slug }).lean());
      },
      async creer(doc) {
        await pret();
        return nu((await Produit.create(doc)).toObject());
      },
      async modifier(slug, patch) {
        await pret();
        const { slug: _ignore, ...reste } = patch;
        return nu(await Produit.findOneAndUpdate({ slug }, reste, { new: true }).lean());
      },
      async supprimer(slug) {
        await pret();
        const r = await Produit.deleteOne({ slug });
        return r.deletedCount > 0;
      },
      async remplacerTout(liste) {
        await pret();
        await Produit.deleteMany({});
        await Produit.insertMany(liste);
        return liste.length;
      },
    },

    commandes: {
      async toutes() {
        await pret();
        return nu(await Commande.find().sort({ createdAt: -1 }).lean());
      },
      async creer(doc) {
        await pret();
        return nu((await Commande.create(doc)).toObject());
      },
      async modifierStatut(ref, statut) {
        await pret();
        return nu(await Commande.findOneAndUpdate({ ref }, { statut }, { new: true }).lean());
      },
    },

    reglages: {
      async lire() {
        await pret();
        const docs = await Reglage.find().lean();
        return Object.fromEntries(docs.map((d) => [d.cle, d.valeur]));
      },
      async ecrire(patch) {
        await pret();
        await Promise.all(
          Object.entries(patch).map(([cle, valeur]) =>
            Reglage.updateOne({ cle }, { cle, valeur }, { upsert: true }),
          ),
        );
        return this.lire();
      },
    },

    admins: {
      async parEmail(email) {
        await pret();
        return nu(await Admin.findOne({ email: String(email).toLowerCase() }).lean());
      },
      async creer(doc) {
        await pret();
        return nu(await Admin.findOneAndUpdate({ email: doc.email }, doc, { upsert: true, new: true }).lean());
      },
    },
  };
}
