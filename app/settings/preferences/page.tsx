import { getRequiredSession } from '@/lib/auth';
import { MainLayout } from '@/components/layout/main-layout';
import { PreferencesPage } from '@/components/pages/preferences-page';

export default async function PreferencesSettingsRoute() {
  await getRequiredSession();

  return (
    <MainLayout>
      <PreferencesPage />
    </MainLayout>
  );
}
