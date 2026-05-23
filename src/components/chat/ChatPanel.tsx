import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Paperclip, Send, Image as ImgIcon, Smile, MessageCircle, Check, CheckCheck, ArrowLeft, User as UserIcon, Users } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import type { Profile } from "./ContactsPanel";

type Msg = {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string | null;
  type: "text" | "image" | "file";
  file_url: string | null;
  file_name: string | null;
  created_at: string;
};

function fmtTime(d: string) {
  const dt = new Date(d);
  if (isToday(dt)) return format(dt, "HH:mm");
  if (isYesterday(dt)) return "Yesterday";
  return format(dt, "MMM d");
}

export function ChatPanel({
  chatId,
  peer,
  headerName,
  headerAvatar,
  online,
  onBack,
}: {
  chatId: string | null;
  peer: Profile | null;
  headerName: string | null;
  headerAvatar: string | null;
  online: Set<string>;
  onBack: () => void;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [members, setMembers] = useState<Profile[]>([]);
  const [isGroup, setIsGroup] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [reads, setReads] = useState<Map<string, Set<string>>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!chatId || !user) return;
    let cancelled = false;
    (async () => {
      const { data: chat } = await supabase.from("chats").select("is_group").eq("id", chatId).single();
      if (cancelled) return;
      setIsGroup(!!chat?.is_group);
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at");
      if (cancelled) return;
      setMessages((msgs ?? []) as Msg[]);

      const { data: mems } = await supabase.from("chat_members").select("user_id").eq("chat_id", chatId);
      const ids = (mems ?? []).map((m) => m.user_id);
      const { data: profs } = ids.length ? await supabase.from("profiles").select("*").in("id", ids) : { data: [] };
      if (cancelled) return;
      setMembers((profs ?? []) as Profile[]);

      // load reads
      const msgIds = (msgs ?? []).map((m) => m.id);
      if (msgIds.length) {
        const { data: rs } = await supabase.from("message_reads").select("message_id, user_id").in("message_id", msgIds);
        const map = new Map<string, Set<string>>();
        (rs ?? []).forEach((r) => {
          if (!map.has(r.message_id)) map.set(r.message_id, new Set());
          map.get(r.message_id)!.add(r.user_id);
        });
        if (!cancelled) setReads(map);
      }
    })();

    const ch = supabase
      .channel(`chat:${chatId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${chatId}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Msg]);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "typing_status", filter: `chat_id=eq.${chatId}` }, async () => {
        const { data } = await supabase
          .from("typing_status")
          .select("user_id, updated_at")
          .eq("chat_id", chatId)
          .gte("updated_at", new Date(Date.now() - 4000).toISOString());
        setTypingUsers(((data ?? []).map((t) => t.user_id) as string[]).filter((id) => id !== user.id));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "message_reads" }, (payload) => {
        const r = payload.new as { message_id: string; user_id: string };
        setReads((prev) => {
          const next = new Map(prev);
          if (!next.has(r.message_id)) next.set(r.message_id, new Set());
          next.get(r.message_id)!.add(r.user_id);
          return next;
        });
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [chatId, user]);

  // autoscroll + mark read
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    if (!user || !chatId) return;
    const unread = messages.filter((m) => m.sender_id !== user.id && !(reads.get(m.id)?.has(user.id)));
    if (unread.length) {
      supabase.from("message_reads").upsert(unread.map((m) => ({ message_id: m.id, user_id: user.id })), { onConflict: "message_id,user_id" }).then(() => {});
    }
    // notifications
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted" && document.hidden) {
      const last = messages[messages.length - 1];
      if (last && last.sender_id !== user.id) {
        const sender = members.find((m) => m.id === last.sender_id);
        new Notification(sender?.name ?? "New message", { body: last.type === "text" ? last.content ?? "" : `📎 ${last.type}` });
      }
    }
  }, [messages, user, chatId, members, reads]);

  const sendText = async () => {
    const content = text.trim();
    if (!content || !chatId || !user) return;
    setText("");
    const { error } = await supabase.from("messages").insert({
      chat_id: chatId, sender_id: user.id, content, type: "text",
    });
    if (error) toast.error(error.message);
    await supabase.from("typing_status").delete().eq("chat_id", chatId).eq("user_id", user.id);
  };

  const handleTyping = async (v: string) => {
    setText(v);
    if (!chatId || !user) return;
    await supabase.from("typing_status").upsert({ chat_id: chatId, user_id: user.id, updated_at: new Date().toISOString() });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(async () => {
      await supabase.from("typing_status").delete().eq("chat_id", chatId).eq("user_id", user.id);
    }, 3000);
  };

  const upload = async (file: File, kind: "image" | "file") => {
    if (!chatId || !user) return;
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uErr } = await supabase.storage.from("chat-files").upload(path, file);
    if (uErr) return toast.error(uErr.message);
    const { data: pub } = supabase.storage.from("chat-files").getPublicUrl(path);
    const { error } = await supabase.from("messages").insert({
      chat_id: chatId, sender_id: user.id, content: file.name, type: kind, file_url: pub.publicUrl, file_name: file.name,
    });
    if (error) toast.error(error.message);
  };

  if (!chatId) {
    return (
      <section className="flex-1 hidden md:flex items-center justify-center bg-background">
        <div className="text-center max-w-sm p-8">
          <div className="mx-auto h-20 w-20 rounded-3xl flex items-center justify-center mb-6" style={{ background: "var(--gradient-primary)" }}>
            <MessageCircle className="h-10 w-10 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Pick up where you left off</h2>
          <p className="text-muted-foreground">Select a chat from the left, or find someone in People to start a new conversation.</p>
        </div>
      </section>
    );
  }

  const headerOnline = peer && online.has(peer.id);
  const typingNames = typingUsers.map((id) => members.find((m) => m.id === id)?.name).filter(Boolean) as string[];

  return (
    <section className="flex-1 flex flex-col h-full bg-background">
      <header className="px-4 py-3 border-b bg-card flex items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={headerAvatar ?? undefined} />
            <AvatarFallback>{isGroup ? <Users className="h-5 w-5" /> : headerName?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          {headerOnline && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-online ring-2 ring-card" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{headerName ?? "Chat"}</div>
          <div className="text-xs text-muted-foreground truncate">
            {typingNames.length > 0
              ? `${typingNames.join(", ")} is typing…`
              : isGroup
              ? `${members.length} members`
              : headerOnline
              ? "Online"
              : "Offline"}
          </div>
        </div>
        {peer && (
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/u/$id", params: { id: peer.id } })} title="View profile">
            <UserIcon className="h-5 w-5" />
          </Button>
        )}
      </header>

      <ScrollArea className="flex-1">
        <div ref={scrollRef as any} className="p-4 space-y-2 overflow-y-auto h-full">
          {messages.map((m, i) => {
            const mine = m.sender_id === user?.id;
            const sender = members.find((x) => x.id === m.sender_id);
            const showSender = isGroup && !mine && messages[i - 1]?.sender_id !== m.sender_id;
            const readBy = reads.get(m.id);
            const seenByOther = mine && readBy && Array.from(readBy).some((id) => id !== user?.id);
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 shadow-sm ${mine ? "bg-bubble-me text-bubble-me-foreground rounded-br-md" : "bg-bubble-them text-bubble-them-foreground rounded-bl-md border"}`}>
                  {showSender && <div className="text-xs font-semibold text-primary mb-0.5">{sender?.name}</div>}
                  {m.type === "text" && <div className="whitespace-pre-wrap break-words">{m.content}</div>}
                  {m.type === "image" && (
                    <a href={m.file_url ?? "#"} target="_blank" rel="noreferrer">
                      <img src={m.file_url ?? ""} alt={m.file_name ?? ""} className="rounded-lg max-h-72 object-cover" />
                    </a>
                  )}
                  {m.type === "file" && (
                    <a href={m.file_url ?? "#"} target="_blank" rel="noreferrer" className="flex items-center gap-2 underline">
                      <Paperclip className="h-4 w-4" /> {m.file_name}
                    </a>
                  )}
                  <div className="flex items-center gap-1 justify-end text-[10px] opacity-70 mt-0.5">
                    <span>{fmtTime(m.created_at)}</span>
                    {mine && (seenByOther ? <CheckCheck className="h-3 w-3 text-primary" /> : <Check className="h-3 w-3" />)}
                  </div>
                </div>
              </div>
            );
          })}
          {typingNames.length > 0 && (
            <div className="flex justify-start">
              <div className="bg-bubble-them border rounded-2xl rounded-bl-md px-3 py-2 text-sm text-muted-foreground flex gap-1">
                <span className="animate-bounce">•</span><span className="animate-bounce [animation-delay:120ms]">•</span><span className="animate-bounce [animation-delay:240ms]">•</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <footer className="p-3 border-t bg-card flex items-center gap-2">
        <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "image")} />
        <input ref={fileInputRef} type="file" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "file")} />
        <Button variant="ghost" size="icon" onClick={() => imageInputRef.current?.click()}><ImgIcon className="h-5 w-5" /></Button>
        <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}><Paperclip className="h-5 w-5" /></Button>
        <Input
          placeholder="Type a message"
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendText(); } }}
          className="flex-1"
        />
        <Button onClick={sendText} size="icon" disabled={!text.trim()}><Send className="h-4 w-4" /></Button>
      </footer>
    </section>
  );
}
