import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SettingsSectionCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  /** Estilo de zona de perigo (borda destrutiva) */
  danger?: boolean;
  className?: string;
}

export function SettingsSectionCard({
  title,
  icon,
  children,
  danger = false,
  className,
}: SettingsSectionCardProps) {
  return (
    <section className={cn('space-y-4', className)}>
      <h2
        className={cn(
          'text-xl font-semibold mb-4 flex items-center gap-2',
          danger && 'text-destructive',
        )}
      >
        {icon}
        {title}
      </h2>
      <div className={cn('bg-card rounded-lg border p-6', danger && 'border-destructive/20')}>
        {children}
      </div>
    </section>
  );
}
