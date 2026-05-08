import { useState } from "react";
import { Send } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { apiGet, apiPost } from "@/lib/api";

interface Contact {
  user_id: number;
  full_name: string;
  role: string;
}

interface ContactsResponse {
  contacts: Contact[];
}

interface ComposeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin?: boolean;
  defaultRecipientId?: number;
  defaultSubject?: string;
  parentId?: number;
  invalidateKeys?: string[][];
}

export function ComposeDialog({
  open,
  onOpenChange,
  isAdmin = false,
  defaultRecipientId,
  defaultSubject = "",
  parentId,
  invalidateKeys = [],
}: ComposeDialogProps) {
  const queryClient = useQueryClient();
  const [isBroadcast, setIsBroadcast] = useState(false);
  const [recipientId, setRecipientId] = useState<string>(defaultRecipientId ? String(defaultRecipientId) : "");
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState("");

  const contactsQuery = useQuery({
    queryKey: ["messages", "contacts"],
    queryFn: () => apiGet<ContactsResponse>("/messages/contacts"),
    enabled: open,
  });

  const sendMutation = useMutation({
    mutationFn: () =>
      apiPost("/messages", {
        recipient_id: isBroadcast ? null : Number(recipientId),
        subject,
        body,
        parent_id: parentId ?? null,
        broadcast: isBroadcast,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["messages"] }),
        ...invalidateKeys.map((key) => queryClient.invalidateQueries({ queryKey: key })),
      ]);
      toast({ title: "Message sent", description: isBroadcast ? "Broadcast delivered to all users." : "Your message has been sent." });
      setBody("");
      setSubject(defaultSubject);
      setRecipientId(defaultRecipientId ? String(defaultRecipientId) : "");
      setIsBroadcast(false);
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to send",
        description: error instanceof Error ? error.message : "Message could not be delivered.",
        variant: "destructive",
      });
    },
  });

  const canSend = body.trim().length > 0 && subject.trim().length > 0 && (isBroadcast || recipientId !== "");

  const contacts = contactsQuery.data?.contacts ?? [];
  const grouped = contacts.reduce<Record<string, Contact[]>>((acc, c) => {
    (acc[c.role] ??= []).push(c);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{parentId ? "Reply" : "New Message"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {isAdmin && !parentId && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsBroadcast(false)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${!isBroadcast ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"}`}
              >
                Direct Message
              </button>
              <button
                type="button"
                onClick={() => setIsBroadcast(true)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${isBroadcast ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"}`}
              >
                Broadcast to All
              </button>
            </div>
          )}

          {!isBroadcast && !parentId && (
            <div className="space-y-1.5">
              <Label>To</Label>
              <Select value={recipientId} onValueChange={setRecipientId}>
                <SelectTrigger>
                  <SelectValue placeholder={contactsQuery.isLoading ? "Loading contacts…" : "Select recipient"} />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(grouped).map(([role, members]) => (
                    <div key={role}>
                      <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{role}</p>
                      {members.map((c) => (
                        <SelectItem key={c.user_id} value={String(c.user_id)}>
                          {c.full_name}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isBroadcast && (
            <div className="rounded-lg border border-warning/20 bg-warning/5 p-3 text-sm text-muted-foreground">
              This message will be visible to all active users in the system.
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Subject</Label>
            <Input placeholder="Enter subject…" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Message</Label>
            <Textarea
              placeholder="Write your message…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[120px] resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => sendMutation.mutate()}
              disabled={!canSend || sendMutation.isPending}
              className="gradient-primary text-primary-foreground hover:opacity-90"
            >
              <Send className="mr-2 h-4 w-4" />
              {sendMutation.isPending ? "Sending…" : isBroadcast ? "Broadcast" : "Send"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
