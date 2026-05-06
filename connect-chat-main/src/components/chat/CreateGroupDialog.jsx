import { useEffect, useState } from "react";
import { api, resolveAssetUrl } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
export function CreateGroupDialog({ open, onOpenChange, onCreated }) {
    const { user, token } = useAuth();
    const [users, setUsers] = useState([]);
    const [selected, setSelected] = useState(new Set());
    const [name, setName] = useState("");
    const [busy, setBusy] = useState(false);
    useEffect(() => {
        if (!open || !user || !token)
            return;
        setSelected(new Set());
        setName("");
        api.listUsers(token, "", 200).then(({ users }) => setUsers(users)).catch((error) => toast.error(error.message));
    }, [open, user, token]);
    const create = async () => {
        if (!user || !token)
            return;
        if (!name.trim())
            return toast.error("Group name required");
        if (selected.size < 1)
            return toast.error("Pick at least one member");
        setBusy(true);
        try {
            const response = await api.createGroupChat(token, {
                name: name.trim(),
                member_ids: Array.from(selected),
            });
            toast.success("Group created");
            onOpenChange(false);
            onCreated(response.chat.id);
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to create group");
        }
        finally {
            setBusy(false);
        }
    };
    return (<Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Create group</DialogTitle></DialogHeader>
        <Input placeholder="Group name" value={name} onChange={(e) => setName(e.target.value)}/>
        <ScrollArea className="h-72 border rounded-lg">
          <ul className="p-2">
            {users.map((item) => (<li key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
                <Checkbox checked={selected.has(item.id)} onCheckedChange={(checked) => {
                setSelected((prev) => {
                    const next = new Set(prev);
                    if (checked)
                        next.add(item.id);
                    else
                        next.delete(item.id);
                    return next;
                });
            }}/>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={resolveAssetUrl(item.avatar_url) ?? undefined}/>
                  <AvatarFallback>{item.name[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-sm">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{item.phone ?? item.email}</div>
                </div>
              </li>))}
          </ul>
        </ScrollArea>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={create} disabled={busy}>Create group</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);
}
