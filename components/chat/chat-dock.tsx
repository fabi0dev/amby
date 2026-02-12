'use client';

import { ChatCircleDots } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { ChatWidget } from './chat-widget';
import { useUIStore } from '@/stores/ui-store';

export function ChatDock() {
  const chatOpen = useUIStore((s) => s.chatOpen);
  const setChatOpen = useUIStore((s) => s.setChatOpen);

  return (
    <>
      <div className="chat-dock-enter fixed bottom-6 right-6 z-40">
        <Button
          size="icon"
          variant={chatOpen ? 'secondary' : 'default'}
          className="group h-12 w-12 rounded-full shadow-lg transition-transform duration-200 hover:scale-105 hover:shadow-xl"
          onClick={() => setChatOpen(true)}
          title="Chat com IA"
        >
          <ChatCircleDots
            size={24}
            weight="duotone"
            className="transition-transform duration-200 group-hover:scale-110"
          />
        </Button>
      </div>

      <ChatWidget open={chatOpen} onOpenChange={setChatOpen} />
    </>
  );
}
