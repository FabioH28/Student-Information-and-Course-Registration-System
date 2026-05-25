import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Sparkles, User as UserIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  studentsApi, gradesApi, offeringsApi, attendanceApi,
  registrationsApi, notificationsApi, progressionApi,
} from "@/lib/api";
import { gpaQualitativeLabel, gpaSeverity } from "@/lib/utils";

interface Message {
  role: "user" | "ai";
  text: string;
  ts: number;
}

const QUICK_PROMPTS = [
  "How is my GPA?",
  "What's on my schedule today?",
  "Am I at academic risk?",
  "Which courses am I taking?",
  "Any unread notifications?",
  "What are my latest grades?",
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

  const profile = useQuery({ queryKey: ["student-me"], queryFn: studentsApi.me });
  const grades = useQuery({ queryKey: ["grades-me"], queryFn: gradesApi.my });
  const courses = useQuery({ queryKey: ["student-my-courses"], queryFn: offeringsApi.studentMyCourses });
  const timetable = useQuery({ queryKey: ["student-timetable"], queryFn: offeringsApi.studentTimetable });
  const attendance = useQuery({ queryKey: ["student-attendance"], queryFn: attendanceApi.studentGrouped });
  const registrations = useQuery({ queryKey: ["registrations-me"], queryFn: registrationsApi.my });
  const notifications = useQuery({ queryKey: ["notifications"], queryFn: () => notificationsApi.list() });
  const progression = useQuery({ queryKey: ["student-progression"], queryFn: progressionApi.me });

  const firstName = user?.display_name?.split(" ")[0] ?? user?.name?.split(" ")[0] ?? "there";

  const [messages, setMessages] = useState<Message[]>([{
    role: "ai",
    ts: Date.now(),
    text: `Hi ${firstName}, I'm your CIS assistant. I can answer questions about your grades, schedule, courses, attendance, and academic risk — using your live account data. Try one of the suggestions below.`,
  }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const answer = useMemo(() => {
    return (q: string): string => {
      const text = q.toLowerCase();
      const has = (...words: string[]) => words.some((w) => text.includes(w));

      // GPA / academic standing
      if (has("gpa", "grade point", "average")) {
        if (!profile.data) return "I can't see your profile yet — give it a second to load.";
        const g = Number(profile.data.gpa);
        const level = gpaQualitativeLabel(g);
        const ctx = progression.data ? ` You're in ${progression.data.degree_level}, ${progression.data.current_academic_year}.` : "";
        return `Your cumulative GPA is ${g.toFixed(2)} — that's ${level}.${ctx}`;
      }

      // Today / schedule
      if (has("today", "schedule", "timetable", "next class", "class today")) {
        const today = todayName();
        const list = (timetable.data ?? []).filter((e) => e.day_of_week === today)
          .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
        if (list.length === 0) return `No classes scheduled for ${today}. Enjoy the day off.`;
        const now = new Date();
        const nowMin = now.getHours() * 60 + now.getMinutes();
        const upcoming = list.find((e) => timeToMinutes(e.end_time) >= nowMin);
        const summary = list.map((e) => `• ${e.start_time}–${e.end_time}  ${e.course_code ?? ""} ${e.course_name}`).join("\n");
        const next = upcoming
          ? `\n\nNext up: ${upcoming.course_code ?? upcoming.course_name} at ${upcoming.start_time}${upcoming.room ? ` in ${upcoming.room}` : ""}.`
          : "\n\nAll of today's classes are done.";
        return `Here's your ${today}:\n${summary}${next}`;
      }

      // Risk
      if (has("risk", "danger", "fail", "absences", "absence")) {
        const total = attendance.data?.length ?? 0;
        const absent = attendance.data?.filter((a) => a.status === "absent").length ?? 0;
        const rate = total ? Math.round((absent / total) * 100) : 0;
        const gpa = Number(profile.data?.gpa ?? 0);
        const failed = grades.data?.filter((g) => g.pass_status === "failed" || g.exam_blocked_due_to_absence).length ?? 0;
        const flags: string[] = [];
        if (gpaSeverity(gpa) === "critical") flags.push(`GPA ${gpa.toFixed(2)} below safe threshold`);
        if (rate >= 15) flags.push(`absence rate ${rate}% above 15%`);
        if (failed > 0) flags.push(`${failed} failed/blocked course${failed === 1 ? "" : "s"}`);
        if (flags.length === 0) return `You look clear — no risk flags. Absence rate ${rate}%, GPA ${gpa.toFixed(2)}. Visit Risk Warning for full breakdown.`;
        return `You have ${flags.length} risk indicator${flags.length === 1 ? "" : "s"}: ${flags.join("; ")}. Open Risk Warning for the full picture and suggestions.`;
      }

      // Courses
      if (has("course", "subject", "enrolled", "taking")) {
        const active = (registrations.data ?? []).filter((r) => r.status === "active").length;
        const list = (courses.data ?? []).slice(0, 8).map((c) => `• ${c.course_code ?? "—"}  ${c.course_name}`).join("\n");
        if (!list) return "You're not actively enrolled in any courses yet. Try Available Subjects to request enrollment.";
        return `You have ${active} active registration${active === 1 ? "" : "s"}:\n${list}`;
      }

      // Notifications
      if (has("notif", "inbox", "unread", "message")) {
        const unread = (notifications.data ?? []).filter((n) => !n.is_read).length;
        if (unread === 0) return "Inbox is clean — no unread notifications.";
        const sample = (notifications.data ?? []).filter((n) => !n.is_read).slice(0, 3).map((n) => `• ${n.title}`).join("\n");
        return `You have ${unread} unread notification${unread === 1 ? "" : "s"}:\n${sample}\n\nOpen Inbox to mark them as read.`;
      }

      // Grades
      if (has("grade", "score", "marks", "results")) {
        const list = grades.data ?? [];
        if (list.length === 0) return "No published grades yet. Your instructors will publish them as they're finalized.";
        const sample = list.slice(0, 5).map((g) => `• ${g.course_code ?? "—"}: ${g.final_grade ?? "pending"} (${g.pass_status ?? "—"})`).join("\n");
        return `Latest published grades:\n${sample}`;
      }

      // Credits / progression
      if (has("credit", "graduate", "graduation", "progress", "year")) {
        if (!progression.data) return "I can't see your progression data right now.";
        const p = progression.data;
        return `You've passed ${p.total_passed_credits} credits. Graduation requires ${p.graduation_required_credits}. ${p.message}`;
      }

      // Help
      if (has("help", "what can you", "what do you", "how do you")) {
        return "I can answer questions about: your GPA, today's schedule, current courses, attendance, risk flags, unread notifications, published grades, and graduation progress. I read your live account — I don't make things up.";
      }

      return "I'm not sure how to answer that yet. Try asking about your GPA, today's schedule, courses, attendance, grades, notifications, or academic risk.";
    };
  }, [profile.data, grades.data, courses.data, timetable.data, attendance.data, registrations.data, notifications.data, progression.data]);

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: "user", text, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);
    const reply = answer(text);
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "ai", text: reply, ts: Date.now() }]);
      setTyping(false);
    }, 350 + Math.min(900, reply.length * 6));
  };

  const isReady = !profile.isLoading && !courses.isLoading && !grades.isLoading;

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 flex items-center gap-3 rounded-xl border bg-card p-4 shadow-card"
      >
        <div className="rounded-xl bg-gradient-to-br from-primary to-primary/70 p-2.5">
          <Bot className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground">CIS Academic Assistant</h3>
          <p className="flex items-center gap-1.5 text-xs">
            <span className={`h-1.5 w-1.5 rounded-full ${isReady ? "bg-success" : "bg-warning"}`} />
            <span className={isReady ? "text-success" : "text-warning"}>{isReady ? "Ready · reading your live data" : "Loading your data..."}</span>
          </p>
        </div>
      </motion.div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pb-4">
        <AnimatePresence>
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
                {msg.text}
              </div>
            </motion.div>
          ))}
          {typing && (
            <motion.div
              key="typing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl rounded-bl-md border bg-card px-4 py-3">
                <span className="inline-flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {messages.length <= 1 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => send(p)}
              className="rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          placeholder="Ask about your GPA, schedule, grades..."
          className="flex-1 rounded-xl border bg-muted/40 px-4 py-3 text-sm transition-colors focus:border-primary/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <Button onClick={() => send(input)} disabled={!input.trim()} className="px-4">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
