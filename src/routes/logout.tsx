import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

export const Route = createFileRoute("/logout")({
  head: () => ({ meta: [{ title: "Signed out — Pulse" }] }),
  component: Logout,
});

function Logout() {
  useEffect(() => { supabase.auth.signOut(); }, []);
  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="text-center max-w-sm">
        <div className="mx-auto h-14 w-14 rounded-2xl flex items-center justify-center mb-6" style={{ background: "var(--gradient-primary)" }}>
          <MessageCircle className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-semibold mb-2">You've been signed out</h1>
        <p className="text-muted-foreground mb-6">Come back anytime — your chats are waiting.</p>
        <Link to="/"><Button>Login again</Button></Link>
      </div>
    </main>
  );
}
