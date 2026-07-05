import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Sparkles } from "lucide-react";
import { getChatHistory, sendChatMessage } from "@/lib/assistant.functions";
import { PageHeader } from "@/components/dashboard-bits";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ChatMarkdown } from "@/components/chat-markdown";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({ meta: [{ title: "AI Mentor — Skilltern" }] }),
  component: AssistantPage,
});

type Msg = { role: string; content: string; id?: string };

const SUGGESTIONS = [
  "How do I make my resume stand out for internships?",
  "What skills should I learn for a frontend role?",
  "How do I prepare for an internship interview?",
  "Build me a 4-week plan to become hireable.",
];

function AssistantPage() {
  const qc = useQueryClient();
  const historyQ = useQuery({ queryKey: ["chat"], queryFn: () => getChatHistory() });
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<Msg[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages: Msg[] = [...(historyQ.data?.messages ?? []), ...pending];

  const send = useMutation({
    mutationFn: (message: string) => sendChatMessage({ data: { message } }),
    onSuccess: async () => {
      setPending([]);
      await qc.invalidateQueries({ queryKey: ["chat"] });
    },
    onError: () => {
      setPending((p) => [...p, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, send.isPending]);

  const submit = (text: string) => {
    const message = text.trim();
    if (!message || send.isPending) return;
    setPending([{ role: "user", content: message }]);
    setInput("");
    send.mutate(message);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col lg:h-[calc(100vh-5rem)]">
      <PageHeader title="AI Mentor" description="Your personal career coach for the Bangladeshi internship market." />

      <Card className="flex min-h-0 flex-1 flex-col p-0">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.length === 0 && !send.isPending ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="h-6 w-6" />
              </span>
              <h2 className="mt-4 font-display text-lg font-semibold">Ask me anything</h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                I know your profile and the local job market. Try one of these:
              </p>
              <div className="mt-5 grid w-full max-w-md gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    className="rounded-lg border border-border p-3 text-left text-sm transition-colors hover:border-primary/40 hover:bg-sidebar/50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={m.id ?? i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                    m.role === "user"
                      ? "whitespace-pre-line bg-primary text-primary-foreground"
                      : "bg-muted text-foreground",
                  )}
                >
                  {m.role === "user" ? m.content : <ChatMarkdown content={m.content} />}
                </div>
              </div>
            ))
          )}
          {send.isPending && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-muted px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
          className="flex gap-2 border-t border-border p-4"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your career mentor…"
            disabled={send.isPending}
          />
          <Button type="submit" size="icon" disabled={send.isPending || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </Card>
    </div>
  );
}
