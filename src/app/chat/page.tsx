"use client";

import { AppHeader } from "@/components/app/header";
import { Chat } from "@/components/chat/Chat";

export default function ChatPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-6rem)]">
        <Chat />
      </main>
    </div>
  );
}
