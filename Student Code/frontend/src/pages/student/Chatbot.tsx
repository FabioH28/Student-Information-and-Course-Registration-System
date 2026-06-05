import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Send, Sparkles, User as UserIcon, Cpu, Wifi, WifiOff, RefreshCw, Trash2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  studentsApi, gradesApi, offeringsApi, attendanceApi,
  registrationsApi, notificationsApi, progressionApi,
} from "@/lib/api";
import { gpaQualitativeLabel, gpaSeverity, dedupTimetable } from "@/lib/utils";

// ── Ollama config ──────────────────────────────────────────────────────────────
const OLLAMA_URL = (import.meta.env.VITE_OLLAMA_URL as string | undefined) ?? "http://localhost:11434";

interface ModelOption {
  id: string;        // ollama tag
  label: string;
  hint: string;
}

const MODEL_OPTIONS: ModelOption[] = [
  { id: "llama3.2:3b", label: "Llama 3.2 · 3B",  hint: "Fast · low memory" },
  { id: "llama3.1:8b", label: "Llama 3.1 · 8B",  hint: "Smarter · slower" },
  { id: "local",       label: "Local rules",      hint: "No LLM, deterministic" },
];

interface Message {
  role: "user" | "ai";
  text: string;
  ts: number;
  model?: string;
}

const QUICK_PROMPTS = [
  "How is my GPA doing?",
  "What's on my schedule today?",
  "Am I at academic risk?",
  "Which courses am I taking?",
  "Any unread notifications?",
  "Give me study advice for this semester",
];

const DAY_LABEL = new Intl.DateTimeFormat("en-US", { weekday: "long" });
function todayName() { return DAY_LABEL.format(new Date()); }
function timeToMinutes(value?: string | null) {
  if (!value) return 0;
  const [h, m] = value.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export default function Chatbot() {
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Live student data
  const profile = useQuery({ queryKey: ["student-me"], queryFn: studentsApi.me });
  const grades = useQuery({ queryKey: ["grades-me"], queryFn: gradesApi.my });
  const courses = useQuery({ queryKey: ["student-my-courses"], queryFn: offeringsApi.studentMyCourses });
  const timetable = useQuery({ queryKey: ["student-timetable"], queryFn: offeringsApi.studentTimetable });
  const attendance = useQuery({ queryKey: ["student-attendance"], queryFn: attendanceApi.studentGrouped });
  const registrations = useQuery({ queryKey: ["registrations-me"], queryFn: registrationsApi.my });
  const notifications = useQuery({ queryKey: ["notifications"], queryFn: () => notificationsApi.list() });
  const progression = useQuery({ queryKey: ["student-progression"], queryFn: progressionApi.me });

  // Ollama probe
  const [ollamaOnline, setOllamaOnline] = useState<boolean | null>(null);
  const [installedModels, setInstalledModels] = useState<string[]>([]);
  const probeOllama = async () => {
    try {
      const res = await fetch(`${OLLAMA_URL}/api/tags`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setInstalledModels((data.models ?? []).map((m: { name: string }) => m.name));
      setOllamaOnline(true);
    } catch {
      setOllamaOnline(false);
      setInstalledModels([]);
    }
  };
  useEffect(() => { probeOllama(); }, []);

  const [model, setModel] = useState<string>("llama3.2:3b");
  const firstName = user?.display_name?.split(" ")[0] ?? user?.name?.split(" ")[0] ?? "there";

  const [messages, setMessages] = useState<Message[]>([{
    role: "ai",
    ts: Date.now(),
    text: `Hi ${firstName}, I'm your CIS assistant. I can answer questions about your grades, schedule, courses, attendance, and academic risk using your live account data. Pick a model below and ask anything.`,
  }]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  // ── Build the live student context for the LLM system prompt ────────────────
  const studentContext = useMemo(() => {
    const today = todayName();
    const todays = dedupTimetable(timetable.data ?? []).filter((e) => e.day_of_week === today)
      .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
    const gpaNum = Number(profile.data?.gpa ?? 0);
    const totalAtt = attendance.data?.length ?? 0;
    const absentCount = attendance.data?.filter((a) => a.status === "absent").length ?? 0;
    const absenceRate = totalAtt ? Math.round((absentCount / totalAtt) * 100) : 0;
    const unread = (notifications.data ?? []).filter((n) => !n.is_read).length;
    const failed = (grades.data ?? []).filter((g) => g.pass_status === "failed" || g.exam_blocked_due_to_absence).length;
    const activeRegs = (registrations.data ?? []).filter((r) => r.status === "active").length;
    const courseList = (courses.data ?? []).slice(0, 10)
      .map((c) => `${c.course_code ?? "—"} (${c.course_name}, ${c.credits ?? "?"} cr)`).join("; ");
    const todaysList = todays.length
      ? todays.map((e) => `${e.start_time}-${e.end_time} ${e.course_code ?? ""} ${e.course_name}${e.room ? " @"+e.room : ""}`).join("; ")
      : "no classes scheduled";
    const recentGrades = (grades.data ?? []).slice(0, 5)
      .map((g) => `${g.course_code ?? "—"}: ${g.final_grade ?? "pending"} (${g.pass_status ?? "—"})`).join("; ");

    return `You are the CIS Academic Assistant for ${firstName}, a university student at Campus Information System.
Speak in 2-4 short paragraphs, conversational and friendly. Be concise — no markdown headers.

LIVE STUDENT DATA (read-only, do not invent fields):
- Name: ${firstName}
- Student code: ${profile.data?.student_code ?? "unknown"}
- Current semester: ${profile.data?.current_semester ?? "?"}
- Cumulative GPA: ${gpaNum.toFixed(2)} (qualitative: ${gpaQualitativeLabel(gpaNum)}, severity: ${gpaSeverity(gpaNum)})
- Active enrolled courses: ${activeRegs}${courseList ? `\n  Courses: ${courseList}` : ""}
- Today (${today}): ${todaysList}
- Attendance: ${absentCount} absent of ${totalAtt} sessions (${absenceRate}% absence rate; 15% threshold blocks exam)
- Published grades so far: ${grades.data?.length ?? 0}${recentGrades ? `\n  Recent: ${recentGrades}` : ""}
- Failed / exam-blocked courses: ${failed}
- Unread notifications: ${unread}
${progression.data ? `- Academic year: ${progression.data.current_academic_year}; credits passed: ${progression.data.total_passed_credits}/${progression.data.graduation_required_credits}; can progress: ${progression.data.can_progress_to_next_year ? "yes" : "no"}` : ""}

RULES:
- Only answer using the data above or general academic-advice common sense.
- If the user asks for something outside this scope (e.g. coding help), politely steer back.
- Never invent grades, courses, or notifications that aren't listed.
- If you don't have data on something (e.g. assignment due dates), say so honestly.`;
  }, [firstName, profile.data, grades.data, courses.data, timetable.data, attendance.data, registrations.data, notifications.data, progression.data]);

  // ── Deterministic fallback (the old rules engine) ───────────────────────────
  const deterministic = useMemo(() => (q: string): string => {
    const text = q.toLowerCase();
    const has = (...words: string[]) => words.some((w) => text.includes(w));
    if (has("gpa", "grade point", "average")) {
      const g = Number(profile.data?.gpa ?? 0);
      return `Your cumulative GPA is ${g.toFixed(2)} — that's ${gpaQualitativeLabel(g)}.`;
    }
    if (has("today", "schedule", "next class")) {
      const today = todayName();
      const list = dedupTimetable(timetable.data ?? []).filter((e) => e.day_of_week === today);
      if (list.length === 0) return `No classes scheduled for ${today}.`;
      return `Today (${today}):\n` + list.map((e) => `• ${e.start_time}–${e.end_time}  ${e.course_code ?? ""} ${e.course_name}`).join("\n");
    }
    if (has("risk", "absence", "fail")) {
      const total = attendance.data?.length ?? 0;
      const absent = attendance.data?.filter((a) => a.status === "absent").length ?? 0;
      const rate = total ? Math.round((absent / total) * 100) : 0;
      const failed = grades.data?.filter((g) => g.pass_status === "failed" || g.exam_blocked_due_to_absence).length ?? 0;
      return `Absence rate ${rate}% · ${failed} failed/blocked course(s). See Risk Warning for the full breakdown.`;
    }
    if (has("course", "subject")) {
      const list = (courses.data ?? []).slice(0, 8).map((c) => `• ${c.course_code} ${c.course_name}`).join("\n");
      return list || "You are not actively enrolled in any courses yet.";
    }
    if (has("notif", "unread", "inbox")) {
      const unread = (notifications.data ?? []).filter((n) => !n.is_read).length;
      return unread === 0 ? "Inbox is clean." : `You have ${unread} unread notification(s). Check your Inbox.`;
    }
    if (has("grade", "score", "results")) {
      const list = grades.data ?? [];
      if (!list.length) return "No published grades yet.";
      return list.slice(0, 5).map((g) => `• ${g.course_code ?? "—"}: ${g.final_grade ?? "pending"}`).join("\n");
    }
    return "I can answer about GPA, today's schedule, courses, attendance, grades, notifications, or risk. Try one of the suggestions above. (Switch to an LLM model for free-form Q&A.)";
  }, [profile.data, grades.data, courses.data, timetable.data, attendance.data, notifications.data]);

  // ── Send (LLM or fallback) ──────────────────────────────────────────────────
  const send = async (text: string) => {
    if (!text.trim() || streaming) return;
    const userMsg: Message = { role: "user", text, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setStreaming(true);

    if (model === "local" || ollamaOnline === false) {
      const reply = deterministic(text);
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: "ai", text: reply, ts: Date.now(), model: "local" }]);
        setStreaming(false);
      }, 250);
      return;
    }

    // Stream from Ollama
    const aiIndex = messages.length + 1; // index of the upcoming AI message
    setMessages((prev) => [...prev, { role: "ai", text: "", ts: Date.now(), model }]);

    abortRef.current = new AbortController();
    try {
      const history = messages
        .filter((m) => m.text)
        .slice(-10)  // last 10 turns for context
        .map((m) => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text }));

      const res = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: studentContext },
            ...history,
            { role: "user", content: text },
          ],
          stream: true,
          options: { temperature: 0.4, num_predict: 400 },
        }),
      });
      if (!res.ok || !res.body) throw new Error(`Ollama HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let accumulated = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const chunk = JSON.parse(line);
            const piece = chunk.message?.content ?? "";
            if (piece) {
              accumulated += piece;
              setMessages((prev) => {
                const next = [...prev];
                if (next[aiIndex]) next[aiIndex] = { ...next[aiIndex], text: accumulated };
                return next;
              });
            }
          } catch { /* incomplete JSON, keep buffering */ }
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ollama request failed";
      setMessages((prev) => {
        const next = [...prev];
        const fallback = deterministic(text);
        if (next[aiIndex]) next[aiIndex] = { ...next[aiIndex], text: `⚠️ ${msg}. Falling back to local rules:\n\n${fallback}` };
        return next;
      });
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const stop = () => {
    abortRef.current?.abort();
    setStreaming(false);
  };

  const reset = () => {
    setMessages([{
      role: "ai", ts: Date.now(),
      text: `Hi ${firstName}, conversation reset. Ask me anything about your academics.`,
    }]);
  };

  const isLocal = model === "local";
  const isReady = !profile.isLoading && !courses.isLoading;
  const modelInstalled = isLocal || installedModels.includes(model);
  const statusText = isLocal
    ? "Local rules mode · using your live data"
    : ollamaOnline === null ? "Probing Ollama..."
    : ollamaOnline === false ? "Ollama not reachable — will fall back to local rules"
    : !modelInstalled ? `Model ${model} not installed — run: ollama pull ${model}`
    : `Connected to Ollama · ${model}`;
  const statusColor = isLocal ? "text-info"
    : ollamaOnline === false ? "text-warning"
    : !modelInstalled ? "text-warning"
    : "text-success";

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-3 rounded-xl border bg-card p-4 shadow-card"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-primary to-primary/70 p-2.5">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground">CIS Academic Assistant</h3>
            <p className="flex items-center gap-1.5 text-xs">
              <span className={`h-1.5 w-1.5 rounded-full ${
                isLocal ? "bg-info" : ollamaOnline === false ? "bg-warning" : !modelInstalled ? "bg-warning" : "bg-success"
              }`} />
              <span className={statusColor}>{statusText}</span>
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { probeOllama(); reset(); }} title="Refresh + reset chat">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" onClick={reset} title="Clear conversation">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Cpu className="h-3.5 w-3.5" /> Model:
          </span>
          {MODEL_OPTIONS.map((opt) => {
            const isInstalled = opt.id === "local" || installedModels.includes(opt.id);
            const isActive = model === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setModel(opt.id)}
                disabled={streaming}
                className={`group relative rounded-lg border px-3 py-1.5 text-xs transition-all ${
                  isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                } ${streaming ? "opacity-50" : ""}`}
                title={opt.hint}
              >
                <span className="font-medium">{opt.label}</span>
                {!isInstalled && opt.id !== "local" && (
                  <span className="ml-1.5 text-[10px] text-warning">not installed</span>
                )}
              </button>
            );
          })}
          <span className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground">
            {ollamaOnline === false
              ? <><WifiOff className="h-3 w-3 text-warning" /> Ollama offline</>
              : <><Wifi className="h-3 w-3 text-success" /> {OLLAMA_URL.replace(/^https?:\/\//, "")}</>}
          </span>
        </div>
      </motion.div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pb-4">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
              }`}>
                {msg.role === "user" ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "rounded-br-md bg-primary text-primary-foreground"
                  : "rounded-bl-md border bg-card text-foreground"
              }`}>
                {msg.text || (streaming && msg.role === "ai" && i === messages.length - 1
                  ? <span className="inline-flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
                    </span>
                  : msg.text)}
                {msg.model && msg.role === "ai" && msg.text && (
                  <span className="ml-2 text-[10px] text-muted-foreground">· {msg.model}</span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {messages.length <= 1 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => send(p)}
              disabled={streaming || !isReady}
              className="rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              <Sparkles className="mr-1 inline h-3 w-3" />{p}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2 border-t pt-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send(input))}
          placeholder={isReady ? "Ask anything about your academics..." : "Loading your data..."}
          disabled={!isReady}
          className="flex-1 rounded-xl border bg-muted/40 px-4 py-3 text-sm transition-colors focus:border-primary/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
        />
        {streaming ? (
          <Button onClick={stop} variant="outline" className="px-4">Stop</Button>
        ) : (
          <Button onClick={() => send(input)} disabled={!input.trim() || !isReady} className="px-4">
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
