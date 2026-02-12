import { getRequiredSession } from '@/lib/auth';
import { DocspaceLayout } from '@/apps/docspace/layout';
import { UserSettingsPage } from '@/components/pages/user-settings-page';

export async function DocspaceUserSettingsRoute() {
  await getRequiredSession();

  return (
    <DocspaceLayout>
      <UserSettingsPage />
    </DocspaceLayout>
  );
}

