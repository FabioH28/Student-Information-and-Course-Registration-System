import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, BellRing, CalendarDays, CircleDollarSign, Mail, Megaphone, MessageSquare, Pencil, Reply, Sparkles } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ComposeDialog } from "@/components/messages/ComposeDialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/DataState";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "@/components/ui/use-toast";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { formatRelativeDateTime, titleize } from "@/lib/formatters";

interface StudentInboxResponse {
  total: number;
  unread: number;
  items: Array<{
    recipient_id: number;
    notification_id: number;
    category: string;
    severity: string;
    title: string;
    message: string;
    action_label: string | null;
    action_url: string | null;
    created_at: string;
    delivered_at: string | null;
    read_at: string | null;
  }>;
}

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

function getCategoryIcon(category: string) {
  switch (category) {
    case "academic": return Sparkles;
    case "finance": return CircleDollarSign;
    case "registration": return BellRing;
    case "event": return CalendarDays;
    case "campus": return Megaphone;
    case "warning": return AlertTriangle;
    default: return BellRing;
  }
}

function getSeverityVariant(severity: string) {
  if (severity === "danger") return "danger" as const;
  if (severity === "warning") return "warning" as const;
  if (severity === "success") return "success" as const;
  return "info" as const;
}

export default function StudentInbox() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"notifications" | "messages">("notifications");
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: number; subject: string; senderId: number } | null>(null);

  const inboxQuery = useQuery({
    queryKey: ["student", "inbox"],
    queryFn: () => apiGet<StudentInboxResponse>("/students/me/inbox"),
  });

  const messagesQuery = useQuery({
    queryKey: ["messages", "inbox"],
    queryFn: () => apiGet<MessagesInboxResponse>("/messages/inbox"),
  });

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["student", "inbox"] }),
      queryClient.invalidateQueries({ queryKey: ["student", "dashboard"] }),
    ]);
  };

  const markAllReadMutation = useMutation({
    mutationFn: () => apiPost("/students/me/inbox/read-all", {}),
    onSuccess: async () => {
      await invalidateAll();
      toast({ title: "Inbox updated", description: "All visible notifications are marked as read." });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (recipientId: number) => apiPost(`/students/me/inbox/${recipientId}/read`, {}),
    onSuccess: () => invalidateAll(),
  });

  const archiveMutation = useMutation({
    mutationFn: (recipientId: number) => apiPost(`/students/me/inbox/${recipientId}/archive`, {}),
    onSuccess: async () => {
      await invalidateAll();
      toast({ title: "Notification archived", description: "The item has been removed from your main inbox." });
    },
  });

  const markMsgReadMutation = useMutation({
    mutationFn: (id: number) => apiPut(`/messages/${id}/read`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["messages", "inbox"] }),
  });

  const isLoading = inboxQuery.isLoading || messagesQuery.isLoading;
  if (isLoading) return <LoadingState lines={5} />;
  if (inboxQuery.isError) {
    return (
      <ErrorState
        description={inboxQuery.error instanceof Error ? inboxQuery.error.message : "Inbox data could not be loaded."}
        onRetry={() => void inboxQuery.refetch()}
      />
    );
  }

  const inbox = inboxQuery.data;
  const messages = messagesQuery.data?.items ?? [];
  const unreadMessages = messagesQuery.data?.unread ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Inbox" description="Notifications and direct messages">
        <Button
          size="sm"
          className="gradient-primary text-primary-foreground hover:opacity-90"
          onClick={() => { setReplyTo(null); setComposeOpen(true); }}
        >
          <Pencil className="mr-2 h-4 w-4" /> New Message
        </Button>
      </PageHeader>

      <div className="flex gap-1 rounded-xl border bg-muted/30 p-1">
        <button
          type="button"
          onClick={() => setTab("notifications")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === "notifications" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <BellRing className="h-4 w-4" />
          Notifications
          {inbox && inbox.unread > 0 && (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">{inbox.unread}</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab("messages")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === "messages" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <MessageSquare className="h-4 w-4" />
          Messages
          {unreadMessages > 0 && (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">{unreadMessages}</span>
          )}
        </button>
      </div>

      {tab === "notifications" && (
        <>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => markAllReadMutation.mutate()} disabled={markAllReadMutation.isPending || (inbox?.unread ?? 0) === 0}>
              {markAllReadMutation.isPending ? "Updating..." : "Mark all as read"}
            </Button>
          </div>
          {!inbox || inbox.items.length === 0 ? (
            <EmptyState title="Your inbox is clear" description="Notifications will appear here as the system sends them." />
          ) : (
            <div className="space-y-3">
              {inbox.items.map((item, index) => {
                const Icon = getCategoryIcon(item.category);
                const variant = getSeverityVariant(item.severity);
                return (
                  <motion.div
                    key={item.recipient_id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="rounded-xl border bg-card p-4 shadow-card transition-colors hover:bg-muted/30"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                      <div className="rounded-lg bg-muted p-2.5">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{titleize(item.category)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge variant={variant}>{titleize(item.severity)}</StatusBadge>
                            {item.read_at === null && <StatusBadge variant="warning">Unread</StatusBadge>}
                            <span className="text-xs text-muted-foreground">{formatRelativeDateTime(item.created_at)}</span>
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">{item.message}</p>
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          {item.action_label && item.action_url ? (
                            <a href={item.action_url} className="inline-flex text-sm font-medium text-primary hover:underline">{item.action_label}</a>
                          ) : null}
                          {item.read_at === null ? (
                            <Button variant="outline" size="sm" onClick={() => markReadMutation.mutate(item.recipient_id)} disabled={markReadMutation.isPending}>Mark as read</Button>
                          ) : null}
                          <Button variant="ghost" size="sm" onClick={() => archiveMutation.mutate(item.recipient_id)} disabled={archiveMutation.isPending}>Archive</Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === "messages" && (
        <>
          {messages.length === 0 ? (
            <EmptyState
              title="No messages yet"
              description="Use New Message to contact your instructors or the administration."
            />
          ) : (
            <div className="space-y-3">
              {messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className={`rounded-xl border bg-card p-4 shadow-card transition-colors hover:bg-muted/30 ${msg.read_at === null && !msg.is_broadcast ? "border-l-4 border-l-primary" : ""}`}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
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
                    </div>
                  </div>
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

      <ComposeDialog
        open={composeOpen}
        onOpenChange={(open) => { setComposeOpen(open); if (!open) setReplyTo(null); }}
        defaultRecipientId={replyTo?.senderId}
        defaultSubject={replyTo?.subject}
        parentId={replyTo?.id}
        invalidateKeys={[["messages", "inbox"]]}
      />
    </div>
  );
}
