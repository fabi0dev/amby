'use client';

import { cn } from '@/lib/utils';

type AuthAlertVariant = 'success' | 'error';

interface AuthAlertProps {
  variant: AuthAlertVariant;
  children: React.ReactNode;
  className?: string;
  role?: 'alert' | 'status';
}

const variantStyles: Record<AuthAlertVariant, string> = {
  success:
    'rounded-lg border border-primary/30 bg-primary/10 px-3 py-2.5 text-sm text-primary transition-opacity duration-200',
  error:
    'rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive transition-opacity duration-200',
};

export function AuthAlert({
  variant,
  children,
  className,
  role = variant === 'error' ? 'alert' : 'status',
}: AuthAlertProps) {
  return (
    <div className={cn(variantStyles[variant], className)} role={role}>
      {children}
    </div>
  );
}
