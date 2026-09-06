import { exigerAdmin } from '@/lib/auth';
import BarreLaterale from '@/components/admin/BarreLaterale';

/**
 * Coquille des pages protégées. La page de connexion vit hors de ce groupe :
 * elle n'hérite donc pas de la garde et ne peut pas boucler sur elle-même.
 */
export default async function LayoutEspaceAdmin({ children }) {
  const session = await exigerAdmin();

  return (
    <div className="admin-shell">
      <BarreLaterale nom={session.nom} email={session.email} />
      <div className="admin-main">{children}</div>
    </div>
  );
}
