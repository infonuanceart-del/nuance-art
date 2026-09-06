import Garde from '@/components/admin/Garde';

/**
 * Coquille des pages protegees.
 *
 * La garde est passee cote navigateur : la vitrine et l'admin sont un export
 * statique, il n'y a plus de rendu serveur pour lire un cookie. Ce n'est pas
 * une faiblesse — la vraie barriere est l'API, qui refuse en 401 toute requete
 * sans jeton valide. Cette garde ne fait qu'eviter d'afficher une interface
 * vide a quelqu'un qui n'est pas connecte.
 */
export default function LayoutEspaceAdmin({ children }) {
  return <Garde>{children}</Garde>;
}
