import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
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
            { title: "Pulse - Real-time Chat" },
            { name: "description", content: "Modern real-time chat. Sign in or create an account to start chatting." },
        ],
    }),
    component: Landing,
});
function Landing() {
    const { user, loading, signIn, signUp } = useAuth();
    const navigate = useNavigate();
    const [busy, setBusy] = useState(false);
    const [tab, setTab] = useState("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    useEffect(() => {
        if (!loading && user)
            navigate({ to: "/chat" });
    }, [user, loading, navigate]);
    const handleLogin = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            await signIn(email, password);
            toast.success("Welcome back");
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : "Login failed");
        }
        finally {
            setBusy(false);
        }
    };
    const handleSignup = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            await signUp({ email, password, name, phone });
            toast.success("Account created and ready to use");
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : "Signup failed");
        }
        finally {
            setBusy(false);
        }
    };
    return (<main className="min-h-screen grid lg:grid-cols-2 bg-background">
      <section className="hidden lg:flex flex-col justify-between p-12 text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
            <MessageCircle className="h-5 w-5"/>
          </div>
          <span className="text-xl font-semibold tracking-tight">Pulse</span>
        </div>
        <div className="space-y-6 max-w-md">
          <h1 className="text-5xl font-bold leading-tight tracking-tight">
            Conversations<br />that move at the speed of you.
          </h1>
          <p className="text-lg opacity-90">
            Real-time messaging, group chats, file sharing, and presence updates powered by a React, Express, and MongoDB stack.
          </p>
        </div>
        <Link to="/about" className="text-sm underline-offset-4 hover:underline opacity-90">About Pulse -&gt;</Link>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-12">
        <Card className="w-full max-w-md p-8 shadow-[var(--shadow-soft)]">
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <MessageCircle className="h-6 w-6 text-primary"/>
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
                  <Input id="le" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lp">Password</Label>
                  <Input id="lp" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}/>
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin"/> : "Log in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sn">Name</Label>
                  <Input id="sn" required value={name} onChange={(e) => setName(e.target.value)}/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sp">Phone</Label>
                  <Input id="sp" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="se">Email</Label>
                  <Input id="se" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="spw">Password</Label>
                  <Input id="spw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}/>
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin"/> : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="text-center text-xs text-muted-foreground mt-6">
            <Link to="/about" className="hover:underline">About Us</Link>
          </p>
        </Card>
      </section>
    </main>);
}
