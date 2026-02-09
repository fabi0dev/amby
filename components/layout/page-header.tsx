'use client';

import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  /**
   * Exibe o botão de voltar alinhado à esquerda.
   * Quando `onBack` não é informado, usa `router.back()`.
   */
  showBackButton?: boolean;
  /**
   * Callback opcional para sobrescrever o comportamento padrão do botão de voltar.
   */
  onBack?: () => void;
  /**
   * Área de ações alinhada à direita (botões, menus, etc).
   */
  actions?: ReactNode;
  /**
   * Classe para controlar a largura máxima do conteúdo interno.
   * Ex: "max-w-3xl", "max-w-5xl". Default: "max-w-3xl".
   */
  maxWidthClassName?: string;
  /**
   * Classe extra para o wrapper externo.
   */
  className?: string;
}

export function PageHeader({
  title,
  description,
  showBackButton = false,
  onBack,
  actions,
  maxWidthClassName = 'max-w-3xl',
  className,
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    router.back();
  };

  return (
    <div className={cn('border-b border-border bg-card', className)}>
      <div className={cn('flex items-center gap-4 mx-auto px-6 md:px-8 py-6', maxWidthClassName)}>
        {showBackButton && (
          <Button variant="ghost" size="icon" onClick={handleBack} className="h-9 w-9">
            <ArrowLeft size={22} />
          </Button>
        )}

        <div className="flex-1">
          <h1 className="text-3xl font-bold">{title}</h1>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
