'use client';

import { APP_NAME } from '@/lib/config';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface AuthFormWrapperProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  /** Delay base para animações (ex: 2 = auth-form-enter-delay-2) */
  enterDelayBase?: number;
  className?: string;
}

export function AuthFormWrapper({
  title,
  description,
  children,
  footer,
  enterDelayBase = 2,
  className,
}: AuthFormWrapperProps) {
  const delay = (n: number) => `auth-form-enter auth-form-enter-delay-${enterDelayBase + n}`;

  return (
    <div
      className={cn(
        'auth-panel-right flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16',
        className,
      )}
    >
      <div className="mx-auto w-full max-w-sm space-y-8">
        <div className={cn('lg:hidden text-center', delay(0))}>
          <Link
            href="/"
            className="text-2xl font-semibold tracking-tight text-foreground transition-opacity hover:opacity-90"
          >
            {APP_NAME}
          </Link>
        </div>

        <div className={delay(1)}>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        </div>

        {children}

        <p className={cn('text-center text-sm text-muted-foreground', delay(6))}>{footer}</p>
      </div>
    </div>
  );
}
