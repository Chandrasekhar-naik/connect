import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Users, MessageCircle, MoreVertical, Sun, Moon, LogOut, UserCog, User as UserIcon } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export type Profile = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
};

export type ChatListItem = {
  id: string;
  is_group: boolean;
  name: string | null;
  avatar_url: string | null;
  other?: Profile | null;
  last_message?: string | null;
  last_at?: string | null;
};

export function ContactsPanel({
  selectedChat,
  onSelectChat,
  online,
  onCreateGroup,
}: {
  selectedChat: string | null;
  onSelectChat: (id: string, peer?: Profile | null, name?: string | null, avatar?: string | null) => void;
  online: Set<string>;
  onCreateGroup: () => void;
}) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [me, setMe] = useState<Profile | null>(null);
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"chats" | "people">("chats");

  // load me
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => setMe(data as Profile));
  }, [user]);

  // load all users
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").neq("id", user.id).order("name").then(({ data }) => setAllUsers((data ?? []) as Profile[]));
  }, [user]);

  // load chats
  const loadChats = async () => {
    if (!user) return;
    const { data: memberRows } = await supabase
      .from("chat_members")
      .select("chat_id")
      .eq("user_id", user.id);
    const ids = (memberRows ?? []).map((r) => r.chat_id);
    if (ids.length === 0) return setChats([]);
    const { data: chatRows } = await supabase
      .from("chats")
      .select("*")
      .in("id", ids)
      .order("updated_at", { ascending: false });
    const { data: members } = await supabase
      .from("chat_members")
      .select("chat_id, user_id")
      .in("chat_id", ids);
    const otherIds = Array.from(
      new Set((members ?? []).filter((m) => m.user_id !== user.id).map((m) => m.user_id))
    );
    const { data: profs } =
      otherIds.length > 0
        ? await supabase.from("profiles").select("*").in("id", otherIds)
        : { data: [] as Profile[] };
    const profMap = new Map((profs ?? []).map((p) => [p.id, p as Profile]));
    const { data: lastMsgs } = await supabase
      .from("messages")
      .select("chat_id, content, type, created_at")
      .in("chat_id", ids)
      .order("created_at", { ascending: false });
    const lastByChat = new Map<string, any>();
    (lastMsgs ?? []).forEach((m) => {
      if (!lastByChat.has(m.chat_id)) lastByChat.set(m.chat_id, m);
    });
    const items: ChatListItem[] = (chatRows ?? []).map((c) => {
      const otherMember = (members ?? []).find((m) => m.chat_id === c.id && m.user_id !== user.id);
      const other = otherMember ? profMap.get(otherMember.user_id) ?? null : null;
      const last = lastByChat.get(c.id);
      return {
        id: c.id,
        is_group: c.is_group,
        name: c.name,
        avatar_url: c.avatar_url,
        other,
        last_message: last ? (last.type === "text" ? last.content : `📎 ${last.type}`) : null,
        last_at: last?.created_at ?? c.updated_at,
      };
    });
    items.sort((a, b) => (b.last_at ?? "").localeCompare(a.last_at ?? ""));
    setChats(items);
  };

  useEffect(() => {
    loadChats();
    if (!user) return;
    const ch = supabase
      .channel("chats-refresh")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, loadChats)
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_members" }, loadChats)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filteredChats = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return chats;
    return chats.filter((c) => {
      const name = c.is_group ? c.name : c.other?.name;
      return (name ?? "").toLowerCase().includes(t) || (c.other?.phone ?? "").includes(t);
    });
  }, [q, chats]);

  const filteredPeople = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return allUsers;
    return allUsers.filter((u) => u.name.toLowerCase().includes(t) || (u.phone ?? "").includes(t));
  }, [q, allUsers]);

  const startDirect = async (otherId: string) => {
    const { data, error } = await supabase.rpc("get_or_create_direct_chat", { _other_user: otherId });
    if (error) return toast.error(error.message);
    const peer = allUsers.find((u) => u.id === otherId) ?? null;
    onSelectChat(data as string, peer);
    setTab("chats");
    loadChats();
  };

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  };

  return (
    <aside className="w-full md:w-80 lg:w-96 border-r bg-card flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 hover:opacity-80">
              <Avatar className="h-10 w-10">
                <AvatarImage src={me?.avatar_url ?? undefined} />
                <AvatarFallback>{me?.name?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
              </Avatar>
              <div className="text-left hidden sm:block">
                <div className="text-sm font-semibold leading-tight">{me?.name ?? "You"}</div>
                <div className="text-xs text-muted-foreground">Online</div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}><UserCog className="h-4 w-4 mr-2" />Edit profile</DropdownMenuItem>
            <DropdownMenuItem onClick={toggleTheme}><Sun className="h-4 w-4 mr-2 dark:hidden" /><Moon className="h-4 w-4 mr-2 hidden dark:inline" />Toggle theme</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={async () => { await signOut(); navigate({ to: "/logout" }); }}>
              <LogOut className="h-4 w-4 mr-2" />Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={onCreateGroup} title="Create group"><Users className="h-5 w-5" /></Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={toggleTheme}>Toggle theme</DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/about">About</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="p-3 border-b space-y-3">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or phone" className="pl-9" />
        </div>
        <div className="flex gap-1 text-xs">
          <button onClick={() => setTab("chats")} className={`flex-1 py-1.5 rounded-md font-medium ${tab === "chats" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted"}`}>Chats</button>
          <button onClick={() => setTab("people")} className={`flex-1 py-1.5 rounded-md font-medium ${tab === "people" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted"}`}>People</button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {tab === "chats" ? (
          <ul className="p-2">
            {filteredChats.length === 0 && (
              <li className="text-center text-sm text-muted-foreground py-12 px-4">
                No chats yet. Switch to <button className="text-primary underline" onClick={() => setTab("people")}>People</button> to start one.
              </li>
            )}
            {filteredChats.map((c) => {
              const name = c.is_group ? c.name ?? "Group" : c.other?.name ?? "Unknown";
              const avatar = c.is_group ? c.avatar_url : c.other?.avatar_url;
              const isOnline = !c.is_group && c.other && online.has(c.other.id);
              return (
                <li key={c.id}>
                  <button
                    onClick={() => onSelectChat(c.id, c.other, name, avatar)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${selectedChat === c.id ? "bg-accent" : "hover:bg-muted"}`}
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={avatar ?? undefined} />
                        <AvatarFallback>{c.is_group ? <Users className="h-5 w-5" /> : name[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      {isOnline && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-online ring-2 ring-card" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{name}</div>
                      <div className="text-xs text-muted-foreground truncate">{c.last_message ?? "No messages yet"}</div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <ul className="p-2">
            {filteredPeople.map((p) => (
              <li key={p.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted">
                <div className="relative">
                  <Avatar className="h-11 w-11">
                    <AvatarImage src={p.avatar_url ?? undefined} />
                    <AvatarFallback>{p.name[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {online.has(p.id) && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-online ring-2 ring-card" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{p.phone ?? p.email}</div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => navigate({ to: "/u/$id", params: { id: p.id } })} title="View profile">
                    <UserIcon className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => startDirect(p.id)} title="Message">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </aside>
  );
}
