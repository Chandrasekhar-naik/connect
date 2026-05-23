import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { MessageCircle, Zap, Lock, Users, Image as ImgIcon } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Pulse Chat" },
      { name: "description", content: "Learn about Pulse, a modern real-time chat experience." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-primary" />
            <span className="font-semibold">Pulse</span>
          </Link>
          <Link to="/"><Button variant="ghost">Back to login</Button></Link>
        </div>
      </header>
      <section className="max-w-3xl mx-auto px-6 py-20 space-y-8">
        <h1 className="text-5xl font-bold tracking-tight">About Pulse</h1>
        <p className="text-lg text-muted-foreground">
          Pulse is a beautifully simple real-time chat app — built for fast, focused conversations
          with friends, teams and groups. Direct messages, group chats, presence, file sharing
          and read receipts come standard.
        </p>
        <div className="grid sm:grid-cols-2 gap-4 pt-4">
          {[
            { icon: Zap, title: "Real-time", body: "Messages appear instantly via live channels." },
            { icon: Users, title: "Groups", body: "Create groups in seconds, chat with your crew." },
            { icon: ImgIcon, title: "Files & images", body: "Share anything from a photo to a PDF." },
            { icon: Lock, title: "Private", body: "Row-level security. Only members see chats." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border p-5 bg-card">
              <f.icon className="h-5 w-5 text-primary mb-3" />
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
