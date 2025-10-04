import { Chat } from "@/components/chat/Chat";
import { AppHeader } from "@/components/app/header";

export default function ChatPage() {
    return (
    <div className="flex flex-col h-screen">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-auto">
        <Chat />
      </main>
    </div>
  );
}
