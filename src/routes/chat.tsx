import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePresence } from "@/hooks/usePresence";
import { ContactsPanel, type Profile } from "@/components/chat/ContactsPanel";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { CreateGroupDialog } from "@/components/chat/CreateGroupDialog";

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "Chat — Pulse" }] }),
  component: ChatPage,
});

function ChatPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const online = usePresence();
  const [selected, setSelected] = useState<string | null>(null);
  const [peer, setPeer] = useState<Profile | null>(null);
  const [headerName, setHeaderName] = useState<string | null>(null);
  const [headerAvatar, setHeaderAvatar] = useState<string | null>(null);
  const [groupOpen, setGroupOpen] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  useEffect(() => { if (!loading && !user) navigate({ to: "/" }); }, [user, loading, navigate]);
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  if (!user) return null;

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      <div className={`${mobileShowChat ? "hidden" : "flex"} md:flex w-full md:w-auto`}>
        <ContactsPanel
          selectedChat={selected}
          online={online}
          onSelectChat={(id, p, name, avatar) => {
            setSelected(id); setPeer(p ?? null); setHeaderName(name ?? p?.name ?? null); setHeaderAvatar(avatar ?? p?.avatar_url ?? null);
            setMobileShowChat(true);
          }}
          onCreateGroup={() => setGroupOpen(true)}
        />
      </div>
      <div className={`${mobileShowChat ? "flex" : "hidden"} md:flex flex-1`}>
        <ChatPanel
          chatId={selected}
          peer={peer}
          headerName={headerName}
          headerAvatar={headerAvatar}
          online={online}
          onBack={() => setMobileShowChat(false)}
        />
      </div>
      <CreateGroupDialog open={groupOpen} onOpenChange={setGroupOpen} onCreated={(id) => { setSelected(id); setPeer(null); setHeaderName(null); setHeaderAvatar(null); setMobileShowChat(true); }} />
    </div>
  );
}
