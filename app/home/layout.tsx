import { MainLayout } from '@/components/layout/main-layout';

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <MainLayout>{children}</MainLayout>;
}
