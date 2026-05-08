import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Megaphone, MessageSquare, Pencil, Reply } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ComposeDialog } from "@/components/messages/ComposeDialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/DataState";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
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

export default function StaffInbox() {
  const queryClient = useQueryClient();
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: number; subject: string; senderId: number } | null>(null);

  const messagesQuery = useQuery({
    queryKey: ["messages", "inbox"],
    queryFn: () => apiGet<MessagesInboxResponse>("/messages/inbox"),
  });

  const markMsgReadMutation = useMutation({
    mutationFn: (id: number) => apiPut(`/messages/${id}/read`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["messages", "inbox"] }),
  });

  if (messagesQuery.isLoading) return <LoadingState lines={5} />;
  if (messagesQuery.isError) {
    return (
      <ErrorState
        description={messagesQuery.error instanceof Error ? messagesQuery.error.message : "Messages could not be loaded."}
        onRetry={() => void messagesQuery.refetch()}
      />
    );
  }

  const messages = messagesQuery.data?.items ?? [];
  const unread = messagesQuery.data?.unread ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Inbox" description="Direct messages and campus-wide broadcasts">
        <Button
          size="sm"
          className="gradient-primary text-primary-foreground hover:opacity-90"
          onClick={() => { setReplyTo(null); setComposeOpen(true); }}
        >
          <Pencil className="mr-2 h-4 w-4" /> New Message
        </Button>
      </PageHeader>

      {unread > 0 && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
          You have <span className="font-semibold text-primary">{unread}</span> unread message{unread !== 1 ? "s" : ""}.
        </div>
      )}

      {messages.length === 0 ? (
        <EmptyState
          title="No messages"
          description="Messages and system broadcasts addressed to you will appear here."
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
              <div className="flex items-center gap-2">
                {msg.is_broadcast ? (
                  <Megaphone className="h-4 w-4 shrink-0 text-warning" />
                ) : (
                  <Mail className="h-4 w-4 shrink-0 text-primary" />
                )}
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markMsgReadMutation.mutate(msg.id)}
                    disabled={markMsgReadMutation.isPending}
                  >
                    Mark as read
                  </Button>
                )}
                {!msg.is_broadcast && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setReplyTo({ id: msg.id, subject: `Re: ${msg.subject}`, senderId: msg.sender_id });
                      setComposeOpen(true);
                    }}
                  >
                    <Reply className="mr-1.5 h-3.5 w-3.5" /> Reply
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
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
