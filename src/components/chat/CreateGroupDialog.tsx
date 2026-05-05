import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import type { Profile } from "./ContactsPanel";

export function CreateGroupDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: (chatId: string) => void }) {
  const { user } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setSelected(new Set()); setName("");
    supabase.from("profiles").select("*").neq("id", user.id).order("name").then(({ data }) => setUsers((data ?? []) as Profile[]));
  }, [open, user]);

  const create = async () => {
    if (!user) return;
    if (!name.trim()) return toast.error("Group name required");
    if (selected.size < 1) return toast.error("Pick at least one member");
    setBusy(true);
    const { data: chat, error } = await supabase.from("chats").insert({ is_group: true, name: name.trim(), created_by: user.id }).select().single();
    if (error || !chat) { setBusy(false); return toast.error(error?.message ?? "Failed"); }
    const rows = [{ chat_id: chat.id, user_id: user.id }, ...Array.from(selected).map((uid) => ({ chat_id: chat.id, user_id: uid }))];
    const { error: mErr } = await supabase.from("chat_members").insert(rows);
    setBusy(false);
    if (mErr) return toast.error(mErr.message);
    toast.success("Group created");
    onOpenChange(false);
    onCreated(chat.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Create group</DialogTitle></DialogHeader>
        <Input placeholder="Group name" value={name} onChange={(e) => setName(e.target.value)} />
        <ScrollArea className="h-72 border rounded-lg">
          <ul className="p-2">
            {users.map((u) => (
              <li key={u.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
                <Checkbox checked={selected.has(u.id)} onCheckedChange={(c) => {
                  setSelected((prev) => { const n = new Set(prev); if (c) n.add(u.id); else n.delete(u.id); return n; });
                }} />
                <Avatar className="h-8 w-8"><AvatarImage src={u.avatar_url ?? undefined} /><AvatarFallback>{u.name[0]?.toUpperCase()}</AvatarFallback></Avatar>
                <div className="flex-1 text-sm">
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-muted-foreground">{u.phone ?? u.email}</div>
                </div>
              </li>
            ))}
          </ul>
        </ScrollArea>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={create} disabled={busy}>Create group</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
