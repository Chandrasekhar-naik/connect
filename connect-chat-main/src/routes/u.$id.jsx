import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, resolveAssetUrl } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Phone } from "lucide-react";
export const Route = createFileRoute("/u/$id")({
    head: () => ({ meta: [{ title: "Profile - Pulse" }] }),
    component: ViewProfile,
});
function ViewProfile() {
    const { id } = Route.useParams();
    const { token } = useAuth();
    const [profile, setProfile] = useState(null);
    useEffect(() => {
        if (!token)
            return;
        api.getUserById(token, id).then(({ user }) => setProfile(user)).catch(() => setProfile(null));
    }, [id, token]);
    return (<main className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link to="/chat"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5"/></Button></Link>
          <h1 className="text-lg font-semibold">Profile</h1>
        </div>
      </header>
      <div className="max-w-2xl mx-auto p-6">
        <Card className="p-8 space-y-6 text-center">
          <Avatar className="h-28 w-28 mx-auto">
            <AvatarImage src={resolveAssetUrl(profile?.avatar_url) ?? undefined}/>
            <AvatarFallback className="text-3xl">{profile?.name?.[0]?.toUpperCase() ?? "?"}</AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-semibold">{profile?.name ?? "-"}</h2>
          <div className="space-y-2 text-left max-w-sm mx-auto">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <Mail className="h-4 w-4 text-muted-foreground"/>
              <span className="text-sm">{profile?.email ?? "-"}</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <Phone className="h-4 w-4 text-muted-foreground"/>
              <span className="text-sm">{profile?.phone ?? "-"}</span>
            </div>
          </div>
        </Card>
      </div>
    </main>);
}
