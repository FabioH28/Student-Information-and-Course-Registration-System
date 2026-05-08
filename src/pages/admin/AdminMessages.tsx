import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Megaphone, MessageSquare, Pencil, Reply, Send } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ComposeDialog } from "@/components/messages/ComposeDialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/DataState";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiGet, apiPut } from "@/lib/api";
import { formatRelativeDateTime } from "@/lib/formatters";

interface MessagesInboxResponse {
  total: number;
  unread: number;
  items: Array<{
    id: number;
    sender_id: number;
    sender_name: string;
    sender_role: string;
    subject: string;
    body: string;
    parent_id: number | null;
    is_broadcast: number;
    sent_at: string;
    read_at: string | null;
  }>;
}

interface MessagesSentResponse {
  items: Array<{
    id: number;
    recipient_id: number | null;
    recipient_name: string;
    subject: string;
    body: string;
    is_broadcast: number;
    sent_at: string;
  }>;
}

export default function AdminMessages() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"inbox" | "sent">("inbox");
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: number; subject: string; senderId: number } | null>(null);

  const inboxQuery = useQuery({
    queryKey: ["messages", "inbox"],
    queryFn: () => apiGet<MessagesInboxResponse>("/messages/inbox"),
  });

  const sentQuery = useQuery({
    queryKey: ["messages", "sent"],
    queryFn: () => apiGet<MessagesSentResponse>("/messages/sent"),
    enabled: tab === "sent",
  });

  const markMsgReadMutation = useMutation({
    mutationFn: (id: number) => apiPut(`/messages/${id}/read`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["messages", "inbox"] }),
  });

  if (inboxQuery.isLoading) return <LoadingState lines={5} />;
  if (inboxQuery.isError) {
    return (
      <ErrorState
        description={inboxQuery.error instanceof Error ? inboxQuery.error.message : "Messages could not be loaded."}
        onRetry={() => void inboxQuery.refetch()}
      />
    );
  }

  const inbox = inboxQuery.data;
  const sent = sentQuery.data?.items ?? [];
  const broadcasts = sent.filter((m) => m.is_broadcast);
  const direct = sent.filter((m) => !m.is_broadcast);

  return (
    <div className="space-y-6">
      <PageHeader title="Messages" description="Direct messages and system-wide broadcasts">
        <Button
          size="sm"
          className="gradient-primary text-primary-foreground hover:opacity-90"
          onClick={() => { setReplyTo(null); setComposeOpen(true); }}
        >
          <Pencil className="mr-2 h-4 w-4" /> Compose
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Total Received" value={inbox?.total ?? 0} icon={MessageSquare} variant="primary" delay={0.05} />
        <StatCard title="Unread" value={inbox?.unread ?? 0} icon={Mail} variant="warning" delay={0.1} />
        <StatCard title="Broadcasts Sent" value={broadcasts.length} icon={Megaphone} variant="info" delay={0.15} />
      </div>

      <div className="flex gap-1 rounded-xl border bg-muted/30 p-1">
        <button
          type="button"
          onClick={() => setTab("inbox")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === "inbox" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Mail className="h-4 w-4" />
          Inbox
          {(inbox?.unread ?? 0) > 0 && (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">{inbox?.unread}</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab("sent")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === "sent" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Send className="h-4 w-4" />
          Sent
        </button>
      </div>

      {tab === "inbox" && (
        <>
          {(inbox?.items ?? []).length === 0 ? (
            <EmptyState title="No messages" description="Messages from students and staff will appear here." />
          ) : (
            <div className="space-y-3">
              {inbox!.items.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className={`rounded-xl border bg-card p-4 shadow-card transition-colors hover:bg-muted/30 ${msg.read_at === null && !msg.is_broadcast ? "border-l-4 border-l-primary" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    {msg.is_broadcast ? <Megaphone className="h-4 w-4 shrink-0 text-warning" /> : <Mail className="h-4 w-4 shrink-0 text-primary" />}
                    <p className="truncate text-sm font-semibold text-foreground">{msg.subject}</p>
                    {msg.read_at === null && !msg.is_broadcast && <StatusBadge variant="warning">Unread</StatusBadge>}
                    {msg.is_broadcast && <StatusBadge variant="info">Broadcast</StatusBadge>}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    From {msg.sender_name} ({msg.sender_role}) · {formatRelativeDateTime(msg.sent_at)}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{msg.body}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {msg.read_at === null && !msg.is_broadcast && (
                      <Button variant="outline" size="sm" onClick={() => markMsgReadMutation.mutate(msg.id)} disabled={markMsgReadMutation.isPending}>Mark as read</Button>
                    )}
                    {!msg.is_broadcast && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setReplyTo({ id: msg.id, subject: `Re: ${msg.subject}`, senderId: msg.sender_id }); setComposeOpen(true); }}
                      >
                        <Reply className="mr-1.5 h-3.5 w-3.5" /> Reply
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "sent" && (
        <>
          {sentQuery.isLoading ? (
            <LoadingState lines={3} />
          ) : sent.length === 0 ? (
            <EmptyState title="No sent messages" description="Messages and broadcasts you send will appear here." />
          ) : (
            <div className="space-y-3">
              {sent.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="rounded-xl border bg-card p-4 shadow-card"
                >
                  <div className="flex items-center gap-2">
                    {msg.is_broadcast ? <Megaphone className="h-4 w-4 shrink-0 text-warning" /> : <Mail className="h-4 w-4 shrink-0 text-primary" />}
                    <p className="truncate text-sm font-semibold text-foreground">{msg.subject}</p>
                    {msg.is_broadcast ? <StatusBadge variant="info">Broadcast</StatusBadge> : null}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    To: {msg.recipient_name} · {formatRelativeDateTime(msg.sent_at)}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{msg.body}</p>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      <ComposeDialog
        open={composeOpen}
        onOpenChange={(open) => { setComposeOpen(open); if (!open) setReplyTo(null); }}
        isAdmin
        defaultRecipientId={replyTo?.senderId}
        defaultSubject={replyTo?.subject}
        parentId={replyTo?.id}
        invalidateKeys={[["messages", "inbox"], ["messages", "sent"]]}
      />
    </div>
  );
}
