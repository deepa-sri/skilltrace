"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, FileText, Send, Sparkles, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DemoNote, SectionCard, surface } from "@/components/shared/cards";
import { Icon, IconTile } from "@/components/shared/icon";
import { PageHeader } from "@/components/shared/page-header";
import { aiAnswers, aiFallbackAnswer, aiInsights, aiRecommendations, aiSuggestions } from "@/lib/mock-data";
import { toneSoft } from "@/lib/tones";
import { cn } from "@/lib/utils";

function Answer({ answer }) {
  return (
    <div className="grid grid-cols-1 gap-3 text-sm text-slate-700">
      <p className="flex items-center gap-2 font-medium text-slate-900">
        <Icon name="ai" className="size-4 text-blue-600" />
        {answer.intro}
      </p>
      <ol className="grid list-decimal gap-2 pl-5">
        {answer.points.map((p) => (
          <li key={p.title}>
            <span className="font-semibold text-slate-900">{p.title}:</span> {p.text}
          </li>
        ))}
      </ol>
      <dl className="grid grid-cols-3 gap-2">
        {answer.metrics.map((m) => (
          <div key={m.label} className="rounded-xl bg-white p-2.5 ring-1 ring-slate-200/70">
            <dt className="text-[11px] text-muted-foreground">{m.label}</dt>
            <dd className="text-base font-bold text-blue-600">{m.value}</dd>
          </div>
        ))}
      </dl>
      <Collapsible defaultOpen className="group/sources">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-blue-600">
            Sources ({answer.sources.length})
            <ChevronDown className="transition-transform group-data-[state=open]/sources:rotate-180" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="flex flex-wrap gap-1.5 pt-1">
          {answer.sources.map((s) => (
            <Badge key={s} variant="outline" className="gap-1 rounded-md bg-white font-normal text-slate-600">
              <FileText /> {s}
            </Badge>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function Recommendations() {
  return (
    <ul className="grid grid-cols-1 gap-2">
      {aiRecommendations.map((r) => (
        <li key={r.title} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
          <IconTile name={r.icon} tone={r.tone} />
          <div>
            <p className="text-sm font-semibold text-slate-900">{r.title}</p>
            <p className="text-xs text-muted-foreground">{r.detail}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function AiAssistant() {
  const [messages, setMessages] = useState([
    { role: "user", text: aiSuggestions[0] },
    { role: "ai", answer: aiAnswers[aiSuggestions[0]] },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [tab, setTab] = useState("assistant");
  const endRef = useRef(null);
  const timer = useRef();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, thinking]);
  useEffect(() => () => clearTimeout(timer.current), []);

  function ask(question) {
    const text = question.trim();
    if (!text || thinking) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setThinking(true);
    // ponytail: canned answers from mock data; swap for the AI endpoint when the backend is wired.
    timer.current = setTimeout(() => {
      setMessages((m) => [...m, { role: "ai", answer: aiAnswers[text] ?? aiFallbackAnswer }]);
      setThinking(false);
    }, 900);
  }

  return (
    <div className="grid grid-cols-1 gap-5">
      <PageHeader title="AI Insights & Recommendations" description="Get data-driven insights and recommendations" />

      <Tabs value={tab} onValueChange={setTab} className="gap-5">
        <TabsList className="h-11 rounded-xl bg-slate-100 p-1 max-md:w-full">
          <TabsTrigger value="assistant" className="rounded-lg px-4 data-[state=active]:text-blue-600">
            <Sparkles /> Assistant
          </TabsTrigger>
          <TabsTrigger value="insights" className="rounded-lg px-4 data-[state=active]:text-blue-600">
            <Icon name="analytics" className="size-4" /> Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assistant" className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section aria-label="AI assistant conversation" className={cn(surface, "flex min-w-0 flex-col")}>
            <div className="scrollbar-none flex gap-2 overflow-x-auto border-b border-slate-100 p-4">
              {aiSuggestions.map((s) => (
                <Button key={s} variant="outline" size="sm" className="h-auto max-w-72 flex-none rounded-full py-1.5 text-left text-xs whitespace-normal" onClick={() => ask(s)} disabled={thinking}>
                  {s}
                </Button>
              ))}
            </div>

            <div className="grid max-h-[62vh] min-h-80 content-start gap-4 overflow-y-auto p-4 md:p-5" aria-live="polite">
              {messages.map((m, i) =>
                m.role === "user" ? (
                  <div key={i} className="flex justify-end gap-2">
                    <p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">{m.text}</p>
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-600 max-sm:hidden">
                      <UserRound className="size-4" aria-hidden="true" />
                    </span>
                  </div>
                ) : (
                  <div key={i} className="max-w-[95%] rounded-2xl rounded-tl-sm bg-slate-50 p-4 ring-1 ring-slate-100">
                    <Answer answer={m.answer} />
                  </div>
                )
              )}
              {thinking && (
                <div className="grid max-w-[80%] gap-2 rounded-2xl bg-slate-50 p-4" aria-label="Generating answer">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              )}
              <div ref={endRef} />
            </div>

            <form
              className="flex items-center gap-2 border-t border-slate-100 p-3 md:p-4"
              onSubmit={(e) => {
                e.preventDefault();
                ask(input);
              }}
            >
              <Input
                aria-label="Ask a question about your skilling data"
                placeholder="Ask a question about your skilling data..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="h-12 rounded-full bg-slate-50 px-5"
              />
              <Button type="submit" size="icon" className="size-12 shrink-0 rounded-full" disabled={!input.trim() || thinking} aria-label="Send question">
                <Send />
              </Button>
            </form>
          </section>

          <SectionCard title="Recommendations">
            <Recommendations />
          </SectionCard>
        </TabsContent>

        <TabsContent value="insights">
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {aiInsights.map((ins) => (
              <li key={ins.title} className={cn(surface, "p-5")}>
                <Badge variant="outline" className={cn("rounded-md border-transparent", toneSoft[ins.tone])}>
                  {ins.tag}
                </Badge>
                <h2 className="mt-3 font-bold text-slate-900">{ins.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{ins.detail}</p>
                <Button variant="link" className="mt-2 h-auto p-0"
                  onClick={() => {
                    setTab("assistant");
                    ask(`Tell me more: ${ins.title}`);
                  }}
                >
                  Ask the assistant
                </Button>
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>
      <DemoNote />
    </div>
  );
}
