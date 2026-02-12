import { getRequiredSession } from '@/lib/auth';
import { DocspaceLayout } from '@/apps/docspace/layout';
import { PreferencesPage } from '@/components/pages/preferences-page';

export async function DocspacePreferencesSettingsRoute() {
  await getRequiredSession();

  return (
    <DocspaceLayout>
      <PreferencesPage />
    </DocspaceLayout>
  );
}

