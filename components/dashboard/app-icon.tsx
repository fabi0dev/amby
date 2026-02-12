'use client';

import {
  FileText,
  Folder,
  ChartLine,
  Calendar,
  ListChecks,
  type IconProps,
} from '@phosphor-icons/react';

const ICON_MAP = {
  FileText,
  Folder,
  ChartLine,
  Calendar,
  ListChecks,
} as const;

type IconName = keyof typeof ICON_MAP;

interface AppIconProps extends IconProps {
  name: string;
}

export function AppIcon({ name, size = 28, ...rest }: AppIconProps) {
  const Icon = ICON_MAP[name as IconName] ?? FileText;
  return <Icon size={size} weight="duotone" {...rest} />;
}
