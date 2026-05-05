import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Phone } from "lucide-react";

export const Route = createFileRoute("/u/$id")({
  head: () => ({ meta: [{ title: "Profile — Pulse" }] }),
  component: ViewProfile,
});

function ViewProfile() {
  const { id } = Route.useParams();
  const [p, setP] = useState<{ name: string; email: string | null; phone: string | null; avatar_url: string | null } | null>(null);

  useEffect(() => {
    supabase.from("profiles").select("name,email,phone,avatar_url").eq("id", id).single().then(({ data }) => setP(data as any));
  }, [id]);

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link to="/chat"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <h1 className="text-lg font-semibold">Profile</h1>
        </div>
      </header>
      <div className="max-w-2xl mx-auto p-6">
        <Card className="p-8 space-y-6 text-center">
          <Avatar className="h-28 w-28 mx-auto">
            <AvatarImage src={p?.avatar_url ?? undefined} />
            <AvatarFallback className="text-3xl">{p?.name?.[0]?.toUpperCase() ?? "?"}</AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-semibold">{p?.name ?? "—"}</h2>
          <div className="space-y-2 text-left max-w-sm mx-auto">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{p?.email ?? "—"}</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{p?.phone ?? "—"}</span>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
