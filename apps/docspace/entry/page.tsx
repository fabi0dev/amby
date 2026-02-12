import { redirect } from 'next/navigation';

/**
 * Entrada antiga do Docspace (lista de workspaces).
 * Agora o fluxo é: Dashboard → workspace → apps do workspace (ex: Docspace).
 */
export default function DocspaceEntryPage() {
  redirect('/dashboard');
}
