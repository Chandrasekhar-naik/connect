import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pulse — Real-time Chat" },
      { name: "description", content: "Modern real-time chat. Sign in or create an account to start chatting." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("login");

  // login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // signup
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!loading && user) navigate({ to: "/chat" });
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { name, phone },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Account created — you're in!");
  };

  const handleGoogle = async () => {
    setBusy(true);
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) {
      toast.error("Google sign-in failed");
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-background">
      <section className="hidden lg:flex flex-col justify-between p-12 text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
            <MessageCircle className="h-5 w-5" />
          </div>
          <span className="text-xl font-semibold tracking-tight">Pulse</span>
        </div>
        <div className="space-y-6 max-w-md">
          <h1 className="text-5xl font-bold leading-tight tracking-tight">
            Conversations<br />that move at the speed of you.
          </h1>
          <p className="text-lg opacity-90">
            Real-time messaging, group chats, file sharing, read receipts, and presence — all in one elegant workspace.
          </p>
        </div>
        <Link to="/about" className="text-sm underline-offset-4 hover:underline opacity-90">About Pulse →</Link>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-12">
        <Card className="w-full max-w-md p-8 shadow-[var(--shadow-soft)]">
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <MessageCircle className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">Pulse</span>
          </div>
          <h2 className="text-2xl font-semibold mb-1">Welcome</h2>
          <p className="text-sm text-muted-foreground mb-6">Sign in or create an account to start chatting.</p>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="login">Log in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="le">Email</Label>
                  <Input id="le" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lp">Password</Label>
                  <Input id="lp" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sn">Name</Label>
                  <Input id="sn" required value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sp">Phone</Label>
                  <Input id="sp" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="se">Email</Label>
                  <Input id="se" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="spw">Password</Label>
                  <Input id="spw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={busy}>
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
            Continue with Google
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-6">
            <Link to="/about" className="hover:underline">About Us</Link>
          </p>
        </Card>
      </section>
    </main>
  );
}
