import { useEffect, useMemo, useState } from "react";
import { api, resolveAssetUrl } from "@/lib/api";
import { toChatListItem } from "@/lib/chat";
import { getSocket } from "@/lib/socket";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Users, MessageCircle, MoreVertical, Sun, Moon, LogOut, UserCog, User as UserIcon } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
export function ContactsPanel({ selectedChat, onSelectChat, online, onCreateGroup, }) {
    const { user, token, signOut } = useAuth();
    const navigate = useNavigate();
    const [chats, setChats] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [q, setQ] = useState("");
    const [tab, setTab] = useState("chats");
    const loadUsers = async () => {
        if (!token)
            return;
        const { users } = await api.listUsers(token, "", 200);
        setAllUsers(users);
    };
    const loadChats = async () => {
        if (!token)
            return;
        const { chats } = await api.listChats(token);
        const nextChats = chats.map((chat) => {
            const item = toChatListItem(chat);
            return {
                ...item,
                last_message: chat.lastMessage && item.last_message
                    ? item.last_message
                    : chat.lastMessage ?? null,
            };
        });
        nextChats.sort((a, b) => (b.last_at ?? "").localeCompare(a.last_at ?? ""));
        setChats(nextChats);
    };
    useEffect(() => {
        if (!user || !token)
            return;
        loadUsers().catch((error) => toast.error(error.message));
        loadChats().catch((error) => toast.error(error.message));
        const socket = getSocket(token);
        const refreshChats = () => {
            loadChats().catch(() => { });
        };
        socket.on("new-message", refreshChats);
        socket.on("user-joined", refreshChats);
        socket.on("user-left", refreshChats);
        const interval = window.setInterval(() => {
            loadUsers().catch(() => { });
            loadChats().catch(() => { });
        }, 10000);
        return () => {
            window.clearInterval(interval);
            socket.off("new-message", refreshChats);
            socket.off("user-joined", refreshChats);
            socket.off("user-left", refreshChats);
        };
    }, [user, token]);
    const filteredChats = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term)
            return chats;
        return chats.filter((chat) => {
            const name = chat.is_group ? chat.name : chat.other?.name;
            return (name ?? "").toLowerCase().includes(term) || (chat.other?.phone ?? "").includes(term);
        });
    }, [q, chats]);
    const filteredPeople = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term)
            return allUsers;
        return allUsers.filter((person) => {
            return person.name.toLowerCase().includes(term) || (person.phone ?? "").includes(term);
        });
    }, [q, allUsers]);
    const startDirect = async (otherId) => {
        if (!token)
            return;
        try {
            const { chat_id } = await api.getOrCreateDirectChat(token, otherId);
            const peer = allUsers.find((item) => item.id === otherId) ?? null;
            onSelectChat(chat_id, peer);
            setTab("chats");
            loadChats().catch(() => { });
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to start chat");
        }
    };
    const toggleTheme = () => {
        const isDark = document.documentElement.classList.toggle("dark");
        localStorage.setItem("theme", isDark ? "dark" : "light");
    };
    return (<aside className="w-full md:w-80 lg:w-96 border-r bg-card flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 hover:opacity-80">
              <Avatar className="h-10 w-10">
                <AvatarImage src={resolveAssetUrl(user?.avatar_url) ?? undefined}/>
                <AvatarFallback>{user?.name?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
              </Avatar>
              <div className="text-left hidden sm:block">
                <div className="text-sm font-semibold leading-tight">{user?.name ?? "You"}</div>
                <div className="text-xs text-muted-foreground">Online</div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}><UserCog className="h-4 w-4 mr-2"/>Edit profile</DropdownMenuItem>
            <DropdownMenuItem onClick={toggleTheme}><Sun className="h-4 w-4 mr-2 dark:hidden"/><Moon className="h-4 w-4 mr-2 hidden dark:inline"/>Toggle theme</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={async () => { await signOut(); navigate({ to: "/logout" }); }}>
              <LogOut className="h-4 w-4 mr-2"/>Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={onCreateGroup} title="Create group"><Users className="h-5 w-5"/></Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5"/></Button>
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
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or phone" className="pl-9"/>
        </div>
        <div className="flex gap-1 text-xs">
          <button onClick={() => setTab("chats")} className={`flex-1 py-1.5 rounded-md font-medium ${tab === "chats" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted"}`}>Chats</button>
          <button onClick={() => setTab("people")} className={`flex-1 py-1.5 rounded-md font-medium ${tab === "people" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted"}`}>People</button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {tab === "chats" ? (<ul className="p-2">
            {filteredChats.length === 0 && (<li className="text-center text-sm text-muted-foreground py-12 px-4">
                No chats yet. Switch to <button className="text-primary underline" onClick={() => setTab("people")}>People</button> to start one.
              </li>)}
            {filteredChats.map((chat) => {
                const name = chat.is_group ? chat.name ?? "Group" : chat.other?.name ?? "Unknown";
                const avatar = resolveAssetUrl(chat.is_group ? chat.avatar_url : chat.other?.avatar_url);
                const isOnline = !chat.is_group && chat.other && online.has(chat.other.id);
                return (<li key={chat.id}>
                  <button onClick={() => onSelectChat(chat.id, chat.other, name, avatar)} className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${selectedChat === chat.id ? "bg-accent" : "hover:bg-muted"}`}>
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={avatar ?? undefined}/>
                        <AvatarFallback>{chat.is_group ? <Users className="h-5 w-5"/> : name[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      {isOnline && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-online ring-2 ring-card"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{name}</div>
                      <div className="text-xs text-muted-foreground truncate">{chat.last_message ?? "No messages yet"}</div>
                    </div>
                  </button>
                </li>);
            })}
          </ul>) : (<ul className="p-2">
            {filteredPeople.map((person) => (<li key={person.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted">
                <div className="relative">
                  <Avatar className="h-11 w-11">
                    <AvatarImage src={resolveAssetUrl(person.avatar_url) ?? undefined}/>
                    <AvatarFallback>{person.name[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {online.has(person.id) && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-online ring-2 ring-card"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{person.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{person.phone ?? person.email}</div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => navigate({ to: "/u/$id", params: { id: person.id } })} title="View profile">
                    <UserIcon className="h-4 w-4"/>
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => startDirect(person.id)} title="Message">
                    <MessageCircle className="h-4 w-4"/>
                  </Button>
                </div>
              </li>))}
          </ul>)}
      </ScrollArea>
    </aside>);
}
