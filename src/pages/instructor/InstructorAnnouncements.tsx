import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Megaphone, Newspaper, Plus } from "lucide-react";

import { EmptyState, ErrorState, LoadingState } from "@/components/app/DataState";
import { NewsPostDialog, type NewsPostItem } from "@/components/admin/NewsPostDialog";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiGet } from "@/lib/api";
import { formatDate, titleize } from "@/lib/formatters";

interface CommunicationsOverviewResponse {
  posts: NewsPostItem[];
  events: Array<unknown>;
}

function getStatusVariant(status: string) {
  if (status === "published") {
    return "success" as const;
  }
  if (status === "scheduled") {
    return "info" as const;
  }
  return "warning" as const;
}

export default function InstructorAnnouncements() {
  const [postOpen, setPostOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const postsQuery = useQuery({
    queryKey: ["instructor", "announcements"],
    queryFn: () => apiGet<CommunicationsOverviewResponse>("/communications/overview"),
  });

  if (postsQuery.isLoading) {
    return <LoadingState lines={5} />;
  }

  if (postsQuery.isError) {
    return (
      <ErrorState
        description={postsQuery.error instanceof Error ? postsQuery.error.message : "Announcements could not be loaded."}
        onRetry={() => void postsQuery.refetch()}
      />
    );
  }

  const posts = postsQuery.data?.posts ?? [];
  const selectedPost = posts.find((item) => item.id === selectedPostId) ?? null;

  return (
    <div className="space-y-6">
      <PageHeader title="Course Announcements" description="Draft or update teaching-related notices and published announcements">
        <Button size="sm" className="gradient-primary text-primary-foreground hover:opacity-90" onClick={() => setPostOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Announcement
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Published Posts" value={posts.filter((item) => item.status === "published").length} icon={Newspaper} variant="primary" />
        <StatCard title="Drafts" value={posts.filter((item) => item.status === "draft").length} icon={Megaphone} variant="warning" />
        <StatCard title="Featured" value={posts.filter((item) => item.featured).length} icon={Megaphone} variant="success" />
      </div>

      {posts.length === 0 ? (
        <EmptyState title="No announcements yet" description="Create the first teaching or course announcement for your students." />
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <button
              key={post.id}
              type="button"
              onClick={() => setSelectedPostId(post.id)}
              className="flex w-full flex-col gap-3 rounded-xl border bg-card p-5 text-left shadow-card transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">{post.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{post.summary}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {titleize(post.post_type)} - {titleize(post.priority)} - {formatDate(post.activity_at)}
                </p>
              </div>
              <StatusBadge variant={getStatusVariant(post.status)}>{titleize(post.status)}</StatusBadge>
            </button>
          ))}
        </div>
      )}

      <NewsPostDialog open={postOpen} onOpenChange={setPostOpen} />
      <NewsPostDialog
        open={Boolean(selectedPost)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPostId(null);
          }
        }}
        post={selectedPost}
      />
    </div>
  );
}
