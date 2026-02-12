'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { ChatDock } from '@/components/chat/chat-dock';
import { docspaceConfig } from './config';

interface DocspaceLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout principal do app Docspace.
 * Reaproveita o MainLayout e adiciona o chat (específico do Docspace).
 */
export function DocspaceLayout({ children }: DocspaceLayoutProps) {
  return (
    <>
      <MainLayout>{children}</MainLayout>
      <ChatDock />
    </>
  );
}

export const DOCSPACE_APP = docspaceConfig;

