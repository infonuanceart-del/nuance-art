import { Suspense } from 'react';
import Merci from '@/components/Merci';

export const metadata = {
  title: 'Merci pour votre commande',
  robots: { index: false, follow: false },
};

/**
 * La reference arrive dans l'URL (?ref=…). En export statique il n'y a pas de
 * rendu serveur pour la lire : elle est donc lue cote navigateur, dans un
 * composant client place sous Suspense — exige par useSearchParams.
 */
export default function PageMerci() {
  return (
    <Suspense fallback={<div className="wrap section" style={{ minHeight: '50vh' }} />}>
      <Merci />
    </Suspense>
  );
}
