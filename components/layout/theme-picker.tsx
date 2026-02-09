'use client';

import { Check, Desktop, Moon, Sun } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export type ThemeValue = 'light' | 'dark' | 'system';

interface ThemePickerProps {
  value: ThemeValue;
  onChange: (value: ThemeValue) => void;
  onSelect?: () => void;
  className?: string;
}

const options: { value: ThemeValue; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Desktop },
];

export function ThemePicker({ value, onChange, onSelect, className }: ThemePickerProps) {
  return (
    <div className={cn('flex flex-col gap-1 px-1', className)}>
      <p className="px-3 pb-2 text-xs font-semibold text-muted-foreground uppercase">Tema</p>
      {options.map(({ value: optionValue, label, icon: Icon }) => {
        const isActive = value === optionValue;
        return (
          <button
            key={optionValue}
            type="button"
            onClick={() => {
              onChange(optionValue);
              onSelect?.();
            }}
            className={cn(
              'flex w-full items-center justify-between gap-2 rounded-md px-3 py-1.5 text-sm transition-colors',
              isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent/40',
            )}
          >
            <span className="flex items-center gap-2">
              <Icon size={22} />
              <span>{label}</span>
            </span>
            <Check size={22} className={isActive ? 'opacity-100' : 'opacity-0'} />
          </button>
        );
      })}
    </div>
  );
}
