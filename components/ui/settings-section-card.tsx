import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SettingsSectionCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  /** Estilo de zona de perigo (borda destrutiva) */
  danger?: boolean;
  className?: string;
}

export function SettingsSectionCard({
  title,
  description,
  icon,
  children,
  danger = false,
  className,
}: SettingsSectionCardProps) {
  return (
    <section className={cn('space-y-4', className)}>
      <div className="mb-4">
        <h2
          className={cn(
            'text-xl font-semibold flex items-center gap-2',
            danger && 'text-destructive',
          )}
        >
          {icon}
          {title}
        </h2>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      <div className={cn('bg-card rounded-lg border p-6', danger && 'border-destructive/20')}>
        {children}
      </div>
    </section>
  );
}
