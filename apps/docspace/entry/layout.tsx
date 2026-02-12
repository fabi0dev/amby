import { DocspaceLayout as DocspaceLayoutComponent } from '@/apps/docspace/layout';

export default function DocspaceEntryLayout({ children }: { children: React.ReactNode }) {
  return <DocspaceLayoutComponent>{children}</DocspaceLayoutComponent>;
}
