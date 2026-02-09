import { getRequiredSession } from '@/lib/auth';
import { MainLayout } from '@/components/layout/main-layout';
import { UserSettingsPage } from '@/components/pages/user-settings-page';

export default async function UserSettingsRoute() {
  await getRequiredSession();

  return (
    <MainLayout>
      <UserSettingsPage />
    </MainLayout>
  );
}
