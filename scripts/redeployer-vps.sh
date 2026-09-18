#!/usr/bin/env bash
#
# Redeploie Nuance Art sur le VPS : recupere le code pousse sur GitHub,
# relance l'API, reconstruit la vitrine et bascule dessus.
#
# Depuis le PC, apres un `git push` :
#   ssh nuanceart nuance-art/scripts/redeployer-vps.sh
# Revenir au build precedent de la vitrine si la nouvelle version pose souci :
#   ssh nuanceart nuance-art/scripts/redeployer-vps.sh --retour
#
# La vitrine est construite dans .next-neuf pendant que le site en ligne
# continue de servir .next ; les deux ne sont echanges qu'une fois le build
# reussi. Un build rate laisse donc le site intact. Le build remplace est garde
# dans .next-precedent pour --retour.
#
# Inutile apres une simple modification dans l'administration : la vitrine se
# rafraichit seule. Ce script ne sert qu'aux changements de code.

set -euo pipefail

DEPOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$DEPOT"

# Deux redeploiements simultanes se marcheraient sur .next-neuf.
exec 9>/tmp/nuance-art-redeploiement.lock
flock -n 9 || { echo "Un redeploiement est deja en cours." >&2; exit 1; }

etape() { printf '\n==> %s\n' "$*"; }

# Attend jusqu'a 30 s qu'une adresse locale reponde 2xx/3xx.
repond() {
  local url="$1" nom="$2"
  for _ in $(seq 1 30); do
    if curl -fs -o /dev/null -m 5 "$url"; then
      echo "$nom repond."
      return 0
    fi
    sleep 1
  done
  echo "ERREUR : $nom ne repond pas sur $url" >&2
  return 1
}

# Echange .next et .next-precedent, puis relance la vitrine.
echanger_builds() {
  mv .next .next-echange
  mv .next-precedent .next
  mv .next-echange .next-precedent
  pm2 restart vitrine >/dev/null
}

if [[ "${1:-}" == "--retour" ]]; then
  [[ -d .next-precedent ]] || { echo "Aucun build precedent a restaurer." >&2; exit 1; }
  etape "Retour au build precedent de la vitrine"
  echanger_builds
  repond http://127.0.0.1:3210/ "La vitrine"
  echo "Seule la vitrine est revenue en arriere : le code et l'API restent a jour."
  echo "Relancer --retour revient a la version la plus recente."
  exit 0
fi

etape "Recuperation du code"
avant="$(git rev-parse HEAD)"
git pull --ff-only --quiet
apres="$(git rev-parse HEAD)"
if [[ "$avant" == "$apres" ]]; then
  echo "Deja a jour ($(git log --oneline -1))."
else
  git log --oneline "$avant..$apres"
fi

# Vrai si l'un des chemins a change entre les deux versions.
a_change() { [[ "$avant" != "$apres" ]] && ! git diff --quiet "$avant" "$apres" -- "$@"; }

if a_change package-lock.json || [[ ! -d node_modules ]]; then
  etape "Dependances de la vitrine"
  npm ci --no-audit --no-fund
fi

if a_change serveur/package-lock.json || [[ ! -d serveur/node_modules ]]; then
  etape "Dependances de l'API"
  (cd serveur && npm ci --omit=dev --no-audit --no-fund)
fi

# Avant la vitrine : ses pages interrogent l'API pendant le build.
etape "Relance de l'API"
(cd serveur && node scripts/sync-partage.mjs)
pm2 restart api >/dev/null
repond http://127.0.0.1:4310/sante "L'API"

etape "Construction de la vitrine (le site en ligne continue de servir)"
rm -rf .next-neuf
NEXT_DIST_DIR=.next-neuf npm run build

etape "Bascule sur le nouveau build"
rm -rf .next-precedent
mv .next .next-precedent
mv .next-neuf .next
pm2 restart vitrine >/dev/null

if ! repond http://127.0.0.1:3210/ "La vitrine"; then
  etape "Le nouveau build ne repond pas : retour automatique a l'ancien"
  echanger_builds
  repond http://127.0.0.1:3210/ "La vitrine (ancien build)"
  exit 1
fi

pm2 save >/dev/null
etape "Termine : $(git log --oneline -1)"
