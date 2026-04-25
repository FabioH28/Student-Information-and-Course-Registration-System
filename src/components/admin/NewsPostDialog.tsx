import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { apiPost, apiPut } from "@/lib/api";

export interface NewsPostItem {
  id: number;
  post_type: string;
  title: string;
  summary: string;
  body: string | null;
  priority: string;
  status: string;
  featured: boolean;
  visible_from: string | null;
  visible_until: string | null;
  published_at: string | null;
  activity_at: string;
}

interface NewsPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post?: NewsPostItem | null;
}

interface NewsPostFormState {
  post_type: "announcement" | "notice" | "update" | "feature";
  title: string;
  summary: string;
  body: string;
  priority: "notice" | "update" | "important" | "urgent";
  status: "draft" | "scheduled" | "published" | "archived";
  featured: boolean;
  visible_from: string;
  visible_until: string;
}

function toDateTimeLocalInput(value: string | null | undefined) {
  return value ? value.slice(0, 16) : "";
}

function getInitialState(post?: NewsPostItem | null): NewsPostFormState {
  if (!post) {
    return {
      post_type: "announcement",
      title: "",
      summary: "",
      body: "",
      priority: "notice",
      status: "draft",
      featured: false,
      visible_from: "",
      visible_until: "",
    };
  }

  return {
    post_type: post.post_type as NewsPostFormState["post_type"],
    title: post.title,
    summary: post.summary,
    body: post.body ?? "",
    priority: post.priority as NewsPostFormState["priority"],
    status: post.status as NewsPostFormState["status"],
    featured: post.featured,
    visible_from: toDateTimeLocalInput(post.visible_from),
    visible_until: toDateTimeLocalInput(post.visible_until),
  };
}

export function NewsPostDialog({ open, onOpenChange, post }: NewsPostDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<NewsPostFormState>(getInitialState(post));

  useEffect(() => {
    if (open) {
      setForm(getInitialState(post));
    }
  }, [open, post]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.title.trim() || !form.summary.trim()) {
        throw new Error("Title and summary are required.");
      }

      const payload = {
        post_type: form.post_type,
        title: form.title.trim(),
        summary: form.summary.trim(),
        body: form.body.trim() || null,
        priority: form.priority,
        status: form.status,
        featured: form.featured,
        visible_from: form.visible_from || null,
        visible_until: form.visible_until || null,
      };

      if (post) {
        return apiPut(`/communications/posts/${post.id}`, payload);
      }

      return apiPost("/communications/posts", payload);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["communications", "overview"] }),
        queryClient.invalidateQueries({ queryKey: ["instructor", "announcements"] }),
        queryClient.invalidateQueries({ queryKey: ["student", "news"] }),
      ]);
      toast({
        title: post ? "Post updated" : "Post created",
        description: "The publishing queue has been refreshed.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: post ? "Unable to update post" : "Unable to create post",
        description: error instanceof Error ? error.message : "The post could not be saved.",
      });
    },
  });

  const setField = <K extends keyof NewsPostFormState>(key: K, value: NewsPostFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{post ? "Edit News Post" : "New News Post"}</DialogTitle>
          <DialogDescription>Draft or publish campus communication with the fields the production system will depend on later.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Post Type</Label>
                <Select value={form.post_type} onValueChange={(value) => setField("post_type", value as NewsPostFormState["post_type"])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="notice">Notice</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="feature">Feature</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(value) => setField("priority", value as NewsPostFormState["priority"])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="notice">Notice</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="important">Important</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="news-title">Title</Label>
              <Input id="news-title" value={form.title} onChange={(event) => setField("title", event.target.value)} placeholder="Registration closes this Friday" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="news-summary">Summary</Label>
              <Textarea id="news-summary" rows={4} value={form.summary} onChange={(event) => setField("summary", event.target.value)} placeholder="Short summary shown in feeds and cards" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="news-body">Body</Label>
              <Textarea id="news-body" rows={8} value={form.body} onChange={(event) => setField("body", event.target.value)} placeholder="Optional full message body" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="news-visible-from">Visible From</Label>
                <Input id="news-visible-from" type="datetime-local" value={form.visible_from} onChange={(event) => setField("visible_from", event.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="news-visible-until">Visible Until</Label>
                <Input id="news-visible-until" type="datetime-local" value={form.visible_until} onChange={(event) => setField("visible_until", event.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(value) => setField("status", value as NewsPostFormState["status"])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-muted/30 px-4 py-3">
              <Checkbox id="news-featured" checked={form.featured} onCheckedChange={(checked) => setField("featured", checked === true)} />
              <div className="space-y-1">
                <Label htmlFor="news-featured" className="text-sm font-medium">
                  Feature this post
                </Label>
                <p className="text-xs text-muted-foreground">Featured posts get priority treatment in the student and communications news views.</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="button" className="gradient-primary text-primary-foreground hover:opacity-90" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : post ? "Save Changes" : "Create Post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
