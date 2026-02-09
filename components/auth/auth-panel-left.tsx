'use client';

import { APP_NAME, AUTH } from '@/lib/config';
import { cn } from '@/lib/utils';

interface AuthPanelLeftProps {
  title: string;
  description: string;
  className?: string;
}

export function AuthPanelLeft({ title, description, className }: AuthPanelLeftProps) {
  return (
    <div
      className={cn(
        'auth-panel-left hidden w-1/2 flex-col justify-between p-12 text-primary-foreground lg:flex bg-primary',
        className,
      )}
    >
      <div className="auth-form-enter auth-form-enter-delay-1">
        <span className="text-2xl font-semibold tracking-tight">{APP_NAME}</span>
      </div>
      <div className="space-y-5 auth-form-enter auth-form-enter-delay-2">
        <h2 className="text-3xl font-bold leading-tight tracking-tight">{title}</h2>
        <p className="max-w-md text-primary-foreground/90 text-lg leading-relaxed">{description}</p>
      </div>
      <p className="text-sm text-primary-foreground/75 auth-form-enter auth-form-enter-delay-3">
        {AUTH.tagline}
      </p>
    </div>
  );
}
