'use client';

import { PageHeader } from '@/components/layout/page-header';
import { SettingsSectionCard } from '@/components/ui/settings-section-card';
import { useUIStore, type DefaultPageEditMode } from '@/stores/ui-store';
import { cn } from '@/lib/utils';
import type { ThemeValue } from '@/components/layout/theme-picker';

const THEME_OPTIONS: { value: ThemeValue; label: string }[] = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'system', label: 'Sistema' },
];

export function PreferencesPage() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const fullWidth = useUIStore((s) => s.fullWidth);
  const setFullWidth = useUIStore((s) => s.setFullWidth);
  const defaultPageEditMode = useUIStore((s) => s.defaultPageEditMode);
  const setDefaultPageEditMode = useUIStore((s) => s.setDefaultPageEditMode);

  return (
    <div className="flex h-full flex-col w-full">
      <PageHeader
        title="Preferências"
        description="Aparência e configurações pessoais"
        showBackButton
      />

      <div className="flex-1 overflow-y-auto flex justify-center mx-auto">
        <div className="w-full max-w-3xl px-6 py-8 md:px-8 animate-fade-in-up space-y-6">
          {/* Tema */}
          <SettingsSectionCard title="Tema">
            <p className="text-sm text-muted-foreground mb-3">
              Escolha seu esquema de cores preferido.
            </p>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as ThemeValue)}
              className="w-full max-w-xs h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Selecionar tema"
            >
              {THEME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </SettingsSectionCard>

          <SettingsSectionCard title="Usar largura total do documento">
            <p className="text-sm text-muted-foreground mb-3">
              Escolha a largura preferida do documento.
            </p>
            <button
              type="button"
              role="switch"
              aria-checked={fullWidth}
              onClick={() => setFullWidth(!fullWidth)}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent p-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                fullWidth ? 'bg-primary' : 'bg-input',
              )}
            >
              <span
                className={cn(
                  'pointer-events-none absolute left-0.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-background shadow ring-0 transition-transform',
                  fullWidth ? 'translate-x-5' : 'translate-x-0',
                )}
              />
            </button>
          </SettingsSectionCard>

          <SettingsSectionCard title="Modo de edição de documento padrão">
            <p className="text-sm text-muted-foreground mb-3">
              Escolha o modo de edição de documento preferido. Evite edições acidentais.
            </p>
            <div className="flex rounded-md border border-input bg-muted/30 p-0.5 w-fit">
              {(['edit', 'read'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setDefaultPageEditMode(mode as DefaultPageEditMode)}
                  className={cn(
                    'rounded-md px-4 py-2 text-sm font-medium transition-colors',
                    defaultPageEditMode === mode
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {mode === 'edit' ? 'Editar' : 'Ler'}
                </button>
              ))}
            </div>
          </SettingsSectionCard>
        </div>
      </div>
    </div>
  );
}
