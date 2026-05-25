import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BellRing, Mail, Megaphone, MessageSquare, Pencil, Send, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

interface NotificationItem { id: number; title: string; message: string; type: string; is_read: boolean; created_at: string; }
interface MessageItem {
  id: number; sender_id: number; sender_name?: string; sender_role?: string; recipient_name?: string;
  subject: string; body: string; is_broadcast: number; sent_at: string; read_at: string | null;
}
interface MessagesResponse { total: number; unread: number; items: MessageItem[]; }
interface Contact { user_id: number; full_name: string; role: string; }

function rel(value: string) {
  return new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

type Tab = "notifications" | "messages" | "sent";

export default function StudentInbox() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("notifications");
  const [composeOpen, setComposeOpen] = useState(false);
  const [reply, setReply] = useState<{ recipientId: number; subject: string } | null>(null);

  const notifications = useQuery({ queryKey: ["notifications"], queryFn: () => api.get<NotificationItem[]>("/notifications") });
  const inbox = useQuery({ queryKey: ["messages-inbox"], queryFn: () => api.get<MessagesResponse>("/messages/inbox") });
  const sent = useQuery({ queryKey: ["messages-sent"], queryFn: () => api.get<MessagesResponse>("/messages/sent"), enabled: tab === "sent" });

  const markNotif = useMutation({
    mutationFn: (id: number) => api.put(`/notifications/${id}/read`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const markAllNotif = useMutation({
    mutationFn: () => api.put("/notifications/read-all", {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const markMsg = useMutation({
    mutationFn: (id: number) => api.put(`/messages/${id}/read`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["messages-inbox"] }),
  });

  const notifItems = notifications.data ?? [];
  const notifUnread = notifItems.filter((n) => !n.is_read).length;
  const msgItems = inbox.data?.items ?? [];
  const msgUnread = inbox.data?.unread ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <PageHeader title="Inbox" subtitle="Notifications and direct messages" />
        <Button size="sm" onClick={() => { setReply(null); setComposeOpen(true); }}>
          <Pencil className="mr-2 h-4 w-4" /> New Message
        </Button>
      </div>

      <div className="flex gap-1 rounded-xl border bg-muted/30 p-1">
        {([["notifications", "Notifications", BellRing, notifUnread], ["messages", "Messages", MessageSquare, msgUnread], ["sent", "Sent", Send, 0]] as const).map(
          ([key, label, Icon, count]) => (
            <button key={key} type="button" onClick={() => setTab(key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              <Icon className="h-4 w-4" /> {label}
              {count > 0 && <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">{count}</span>}
            </button>
          ),
        )}
      </div>

      {tab === "notifications" && (
        <>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" disabled={notifUnread === 0 || markAllNotif.isPending} onClick={() => markAllNotif.mutate()}>
              Mark all as read
            </Button>
          </div>
          {notifItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Your inbox is clear.</p>
          ) : (
            <div className="space-y-3">
              {notifItems.map((n, i) => (
                <motion.div key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="rounded-xl border bg-card p-4 shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{n.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {!n.is_read && <StatusBadge variant="warning">Unread</StatusBadge>}
                      <span className="text-xs text-muted-foreground">{rel(n.created_at)}</span>
                    </div>
                  </div>
                  {!n.is_read && (
                    <div className="mt-3">
                      <Button variant="outline" size="sm" disabled={markNotif.isPending} onClick={() => markNotif.mutate(n.id)}>Mark as read</Button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "messages" && (
        msgItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages yet. Use New Message to contact staff or instructors.</p>
        ) : (
          <div className="space-y-3">
            {msgItems.map((m) => (
              <div key={m.id} className={`rounded-xl border bg-card p-4 shadow-card ${m.read_at === null && !m.is_broadcast ? "border-l-4 border-l-primary" : ""}`}>
                <div className="flex items-center gap-2">
                  {m.is_broadcast ? <Megaphone className="h-4 w-4 text-amber-500" /> : <Mail className="h-4 w-4 text-primary" />}
                  <p className="truncate text-sm font-semibold text-foreground">{m.subject}</p>
                  {m.read_at === null && !m.is_broadcast && <StatusBadge variant="warning">Unread</StatusBadge>}
                  {m.is_broadcast === 1 && <StatusBadge variant="info">Broadcast</StatusBadge>}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">From {m.sender_name} ({m.sender_role}) · {rel(m.sent_at)}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{m.body}</p>
                <div className="mt-3 flex gap-2">
                  {m.read_at === null && !m.is_broadcast && (
                    <Button variant="outline" size="sm" disabled={markMsg.isPending} onClick={() => markMsg.mutate(m.id)}>Mark as read</Button>
                  )}
                  {m.is_broadcast === 0 && (
                    <Button variant="outline" size="sm" onClick={() => { setReply({ recipientId: m.sender_id, subject: `Re: ${m.subject}` }); setComposeOpen(true); }}>Reply</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === "sent" && (
        (sent.data?.items ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No sent messages.</p>
        ) : (
          <div className="space-y-3">
            {sent.data!.items.map((m) => (
              <div key={m.id} className="rounded-xl border bg-card p-4 shadow-card">
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4 text-primary" />
                  <p className="truncate text-sm font-semibold text-foreground">{m.subject}</p>
                  {m.is_broadcast === 0 && (
                    <StatusBadge variant={m.read_at === null ? "warning" : "success"}>{m.read_at === null ? "Unread by recipient" : "Read"}</StatusBadge>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">To {m.recipient_name} · {rel(m.sent_at)}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{m.body}</p>
              </div>
            ))}
          </div>
        )
      )}

      {composeOpen && (
        <ComposeModal
          defaultRecipientId={reply?.recipientId}
          defaultSubject={reply?.subject ?? ""}
          onClose={() => { setComposeOpen(false); setReply(null); }}
          onSent={() => {
            queryClient.invalidateQueries({ queryKey: ["messages-inbox"] });
            queryClient.invalidateQueries({ queryKey: ["messages-sent"] });
          }}
        />
      )}
    </div>
  );
}

function ComposeModal({ defaultRecipientId, defaultSubject, onClose, onSent }: {
  defaultRecipientId?: number; defaultSubject: string; onClose: () => void; onSent: () => void;
}) {
  const [recipientId, setRecipientId] = useState(defaultRecipientId ? String(defaultRecipientId) : "");
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const contacts = useQuery({ queryKey: ["message-contacts"], queryFn: () => api.get<{ contacts: Contact[] }>("/messages/contacts") });

  useEffect(() => {
    setRecipientId(defaultRecipientId ? String(defaultRecipientId) : "");
    setSubject(defaultSubject);
    setBody("");
  }, [defaultRecipientId, defaultSubject]);

  const send = useMutation({
    mutationFn: () => api.post("/messages", { recipient_id: Number(recipientId), subject, body, broadcast: false }),
    onSuccess: () => { onSent(); onClose(); },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : "Could not send message."),
  });

  const canSend = recipientId !== "" && subject.trim() && body.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl border bg-card p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">{defaultRecipientId ? "Reply" : "New Message"}</h3>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">To</label>
            <select value={recipientId} onChange={(e) => setRecipientId(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">{contacts.isLoading ? "Loading contacts…" : "Select recipient"}</option>
              {(contacts.data?.contacts ?? []).map((c) => (
                <option key={c.user_id} value={c.user_id}>{c.full_name} ({c.role})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Subject</label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Enter subject…" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Message</label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your message…" className="min-h-[120px]" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button disabled={!canSend || send.isPending} onClick={() => { setError(null); send.mutate(); }}>
              <Send className="mr-2 h-4 w-4" /> {send.isPending ? "Sending…" : "Send"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
