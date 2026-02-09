'use client';

import { useState } from 'react';
import { ChatCircleDots } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { ChatWidget } from './chat-widget';

export function ChatDock() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          size="icon"
          variant={open ? 'secondary' : 'default'}
          className="group h-12 w-12 rounded-full shadow-lg transition-transform duration-200 hover:scale-105 hover:shadow-xl"
          onClick={() => setOpen(true)}
          title="Chat com IA"
        >
          <ChatCircleDots
            size={24}
            weight="duotone"
            className="transition-transform duration-200 group-hover:scale-110"
          />
        </Button>
      </div>

      <ChatWidget open={open} onOpenChange={setOpen} />
    </>
  );
}
