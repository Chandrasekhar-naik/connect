import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { api, resolveAssetUrl } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
export const Route = createFileRoute("/profile")({
    head: () => ({ meta: [{ title: "Edit Profile - Pulse" }] }),
    component: EditProfile,
});
function EditProfile() {
    const { user, token, loading, refreshUser, setUser } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [busy, setBusy] = useState(false);
    const [pw1, setPw1] = useState("");
    const [pw2, setPw2] = useState("");
    const [pwBusy, setPwBusy] = useState(false);
    const fileRef = useRef(null);
    useEffect(() => {
        if (!loading && !user)
            navigate({ to: "/" });
    }, [user, loading, navigate]);
    useEffect(() => {
        if (!user)
            return;
        setName(user.name ?? "");
        setPhone(user.phone ?? "");
        setAvatarUrl(resolveAssetUrl(user.avatar_url) ?? null);
    }, [user]);
    const onPick = async (file) => {
        if (!user || !token)
            return;
        setBusy(true);
        try {
            const response = await api.uploadAvatar(token, file);
            const nextAvatarUrl = response.avatar_url;
            setAvatarUrl(nextAvatarUrl);
            setUser({ ...user, avatar_url: nextAvatarUrl });
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : "Avatar upload failed");
        }
        finally {
            setBusy(false);
        }
    };
    const save = async () => {
        if (!token)
            return;
        setBusy(true);
        try {
            await api.updateProfile(token, { name, phone });
            await refreshUser();
            toast.success("Profile updated");
            navigate({ to: "/chat" });
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : "Profile update failed");
        }
        finally {
            setBusy(false);
        }
    };
    const changePassword = async () => {
        if (!token)
            return;
        if (pw1.length < 6)
            return toast.error("Password must be at least 6 characters");
        if (pw1 !== pw2)
            return toast.error("Passwords do not match");
        setPwBusy(true);
        try {
            await api.updateProfile(token, { password: pw1 });
            setPw1("");
            setPw2("");
            toast.success("Password updated");
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : "Password update failed");
        }
        finally {
            setPwBusy(false);
        }
    };
    if (!user)
        return null;
    return (<main className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link to="/chat"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5"/></Button></Link>
          <h1 className="text-lg font-semibold">Edit profile</h1>
        </div>
      </header>
      <div className="max-w-2xl mx-auto p-6">
        <Card className="p-8 space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="h-28 w-28">
                <AvatarImage src={avatarUrl ?? undefined}/>
                <AvatarFallback className="text-3xl">{name[0]?.toUpperCase() ?? "U"}</AvatarFallback>
              </Avatar>
              <button onClick={() => fileRef.current?.click()} className="absolute bottom-0 right-0 h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
                <Camera className="h-4 w-4"/>
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])}/>
            </div>
          </div>
          <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)}/></div>
          <div className="space-y-2"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)}/></div>
          <div className="space-y-2"><Label>Email</Label><Input value={user.email ?? ""} disabled/></div>
          <Button onClick={save} disabled={busy} className="w-full">
            {busy ? <Loader2 className="h-4 w-4 animate-spin"/> : "Save changes"}
          </Button>
        </Card>

        <Card className="p-8 space-y-6 mt-6">
          <div>
            <h2 className="text-lg font-semibold">Change password</h2>
            <p className="text-sm text-muted-foreground">Update the password used to sign in.</p>
          </div>
          <div className="space-y-2"><Label>New password</Label><Input type="password" value={pw1} onChange={(e) => setPw1(e.target.value)} minLength={6}/></div>
          <div className="space-y-2"><Label>Confirm new password</Label><Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} minLength={6}/></div>
          <Button onClick={changePassword} disabled={pwBusy || !pw1 || !pw2} variant="secondary" className="w-full">
            {pwBusy ? <Loader2 className="h-4 w-4 animate-spin"/> : "Update password"}
          </Button>
        </Card>
      </div>
    </main>);
}
