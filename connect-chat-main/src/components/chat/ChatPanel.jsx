import { useEffect, useRef, useState } from "react";
import { api, resolveAssetUrl } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Paperclip, Send, Image as ImgIcon, MessageCircle, Check, ArrowLeft, User as UserIcon, Users } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
function fmtTime(value) {
    const date = new Date(value);
    if (isToday(date))
        return format(date, "HH:mm");
    if (isYesterday(date))
        return "Yesterday";
    return format(date, "MMM d");
}
export function ChatPanel({ chatId, peer, headerName, headerAvatar, online, onBack, }) {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [members, setMembers] = useState([]);
    const [isGroup, setIsGroup] = useState(false);
    const [typingUsers, setTypingUsers] = useState([]);
    const fileInputRef = useRef(null);
    const imageInputRef = useRef(null);
    const scrollRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    useEffect(() => {
        if (!chatId || !user || !token)
            return;
        let cancelled = false;
        const loadChat = async () => {
            const [chatResponse, membersResponse, messagesResponse] = await Promise.all([
                api.listChats(token),
                api.getChatMembers(token, chatId),
                api.getMessages(token, chatId, 100),
            ]);
            if (cancelled)
                return;
            const chat = chatResponse.chats.find((item) => item.id === chatId);
            setIsGroup(Boolean(chat?.is_group));
            setMembers(membersResponse.members);
            setMessages(messagesResponse.messages);
            await api.markChatAsRead(token, chatId).catch(() => { });
        };
        loadChat().catch((error) => {
            if (!cancelled)
                toast.error(error.message);
        });
        return () => {
            cancelled = true;
        };
    }, [chatId, user, token]);
    useEffect(() => {
        if (!chatId || !token || !user)
            return;
        const socket = getSocket(token);
        const seenIds = new Set();
        socket.emit("join-chat", chatId);
        const onNewMessage = (message) => {
            const nextChatId = message.chat_id ?? message.chatId;
            if (nextChatId !== chatId)
                return;
            setMessages((prev) => {
                if (prev.some((item) => item.id === message.id)) {
                    return prev;
                }
                return [...prev, message];
            });
            if (message.sender_id !== user.id && !seenIds.has(message.id)) {
                seenIds.add(message.id);
                api.markChatAsRead(token, chatId).catch(() => { });
                socket.emit("message-read", { messageId: message.id, chatId });
            }
        };
        const onTyping = (payload) => {
            if (payload.chatId !== chatId || payload.userId === user.id)
                return;
            setTypingUsers((prev) => (prev.includes(payload.userId) ? prev : [...prev, payload.userId]));
        };
        const onStoppedTyping = (payload) => {
            if (payload.chatId !== chatId)
                return;
            setTypingUsers((prev) => prev.filter((item) => item !== payload.userId));
        };
        socket.on("new-message", onNewMessage);
        socket.on("user-typing", onTyping);
        socket.on("user-stopped-typing", onStoppedTyping);
        return () => {
            socket.emit("leave-chat", chatId);
            socket.off("new-message", onNewMessage);
            socket.off("user-typing", onTyping);
            socket.off("user-stopped-typing", onStoppedTyping);
            setTypingUsers([]);
        };
    }, [chatId, token, user]);
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted" && document.hidden) {
            const last = messages[messages.length - 1];
            if (last && last.sender_id !== user?.id) {
                const sender = members.find((member) => member.id === last.sender_id);
                new Notification(sender?.name ?? "New message", {
                    body: last.type === "text" ? last.content : `Attachment: ${last.type}`,
                });
            }
        }
    }, [messages, members, user]);
    const sendText = async () => {
        const content = text.trim();
        if (!content || !chatId || !token)
            return;
        setText("");
        getSocket(token).emit("send-message", {
            chatId,
            content,
            type: "text",
        });
        getSocket(token).emit("stop-typing", chatId);
    };
    const handleInputChange = (value) => {
        setText(value);
        if (!chatId || !token)
            return;
        const socket = getSocket(token);
        if (value.trim()) {
            socket.emit("start-typing", chatId);
            if (typingTimeoutRef.current) {
                window.clearTimeout(typingTimeoutRef.current);
            }
            typingTimeoutRef.current = window.setTimeout(() => {
                socket.emit("stop-typing", chatId);
            }, 1200);
        }
        else {
            socket.emit("stop-typing", chatId);
        }
    };
    const upload = async (file, kind) => {
        if (!chatId || !token)
            return;
        try {
            const uploadResponse = await api.uploadAttachment(token, file);
            getSocket(token).emit("send-message", {
                chatId,
                content: file.name,
                type: kind,
                file_url: uploadResponse.file.url,
                file_name: uploadResponse.file.name,
                file_size: uploadResponse.file.size,
            });
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : "Upload failed");
        }
    };
    if (!chatId) {
        return (<section className="flex-1 hidden md:flex items-center justify-center bg-background">
        <div className="text-center max-w-sm p-8">
          <div className="mx-auto h-20 w-20 rounded-3xl flex items-center justify-center mb-6" style={{ background: "var(--gradient-primary)" }}>
            <MessageCircle className="h-10 w-10 text-primary-foreground"/>
          </div>
          <h2 className="text-2xl font-semibold mb-2">Pick up where you left off</h2>
          <p className="text-muted-foreground">Select a chat from the left, or find someone in People to start a new conversation.</p>
        </div>
      </section>);
    }
    const headerOnline = peer && online.has(peer.id);
    const typingNames = typingUsers
        .map((id) => members.find((member) => member.id === id)?.name)
        .filter(Boolean);
    return (<section className="flex-1 flex flex-col h-full bg-background">
      <header className="px-4 py-3 border-b bg-card flex items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}><ArrowLeft className="h-5 w-5"/></Button>
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={resolveAssetUrl(headerAvatar) ?? undefined}/>
            <AvatarFallback>{isGroup ? <Users className="h-5 w-5"/> : headerName?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          {headerOnline && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-online ring-2 ring-card"/>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{headerName ?? "Chat"}</div>
          <div className="text-xs text-muted-foreground truncate">
            {typingNames.length > 0
            ? `${typingNames.join(", ")} typing...`
            : isGroup
                ? `${members.length} members`
                : headerOnline
                    ? "Online"
                    : "Offline"}
          </div>
        </div>
        {peer && (<Button variant="ghost" size="icon" onClick={() => navigate({ to: "/u/$id", params: { id: peer.id } })} title="View profile">
            <UserIcon className="h-5 w-5"/>
          </Button>)}
      </header>

      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="p-4 space-y-2 overflow-y-auto h-full">
          {messages.map((message, index) => {
            const mine = message.sender_id === user?.id;
            const sender = members.find((member) => member.id === message.sender_id);
            const showSender = isGroup && !mine && messages[index - 1]?.sender_id !== message.sender_id;
            return (<div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 shadow-sm ${mine ? "bg-bubble-me text-bubble-me-foreground rounded-br-md" : "bg-bubble-them text-bubble-them-foreground rounded-bl-md border"}`}>
                  {showSender && <div className="text-xs font-semibold text-primary mb-0.5">{sender?.name}</div>}
                  {message.type === "text" && <div className="whitespace-pre-wrap break-words">{message.content}</div>}
                  {message.type === "image" && (<a href={resolveAssetUrl(message.file_url) ?? "#"} target="_blank" rel="noreferrer">
                      <img src={resolveAssetUrl(message.file_url) ?? ""} alt={message.file_name ?? ""} className="rounded-lg max-h-72 object-cover"/>
                    </a>)}
                  {message.type === "file" && (<a href={resolveAssetUrl(message.file_url) ?? "#"} target="_blank" rel="noreferrer" className="flex items-center gap-2 underline">
                      <Paperclip className="h-4 w-4"/> {message.file_name}
                    </a>)}
                  <div className="flex items-center gap-1 justify-end text-[10px] opacity-70 mt-0.5">
                    <span>{fmtTime(message.createdAt)}</span>
                    {mine && <Check className="h-3 w-3"/>}
                  </div>
                </div>
              </div>);
        })}
        </div>
      </ScrollArea>

      <footer className="p-3 border-t bg-card flex items-center gap-2">
        <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "image")}/>
        <input ref={fileInputRef} type="file" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "file")}/>
        <Button variant="ghost" size="icon" onClick={() => imageInputRef.current?.click()}><ImgIcon className="h-5 w-5"/></Button>
        <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}><Paperclip className="h-5 w-5"/></Button>
        <Input placeholder="Type a message" value={text} onChange={(e) => handleInputChange(e.target.value)} onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendText();
            }
        }} className="flex-1"/>
        <Button onClick={sendText} size="icon" disabled={!text.trim()}><Send className="h-4 w-4"/></Button>
      </footer>
    </section>);
}
