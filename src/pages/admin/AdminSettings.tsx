import { useQuery } from "@tanstack/react-query";

import { EmptyState, ErrorState, LoadingState } from "@/components/app/DataState";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiGet } from "@/lib/api";
import { formatDateTime, titleize } from "@/lib/formatters";

interface AdminSettingsResponse {
  items: Array<{
    id: number;
    setting_key: string;
    setting_label: string;
    value_type: string;
    value_text: string | null;
    description: string | null;
    updated_at: string;
  }>;
}

export default function AdminSettings() {
  const settingsQuery = useQuery({
    queryKey: ["system-admin", "settings"],
    queryFn: () => apiGet<AdminSettingsResponse>("/system-admin/settings"),
  });

  if (settingsQuery.isLoading) {
    return <LoadingState lines={5} />;
  }

  if (settingsQuery.isError) {
    return (
      <ErrorState
        description={settingsQuery.error instanceof Error ? settingsQuery.error.message : "System settings could not be loaded."}
        onRetry={() => void settingsQuery.refetch()}
      />
    );
  }

  const settings = settingsQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="System configuration and platform preferences" />

      {settings.length === 0 ? (
        <EmptyState title="No settings found" description="System settings will appear here once they are seeded or configured." />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-card">
          <div className="divide-y divide-border">
            {settings.map((setting) => (
              <div key={setting.id} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-start md:justify-between">
                <div className="max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{setting.setting_label}</p>
                    <StatusBadge variant="default">{titleize(setting.value_type)}</StatusBadge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{setting.setting_key}</p>
                  {setting.description && <p className="mt-2 text-sm text-muted-foreground">{setting.description}</p>}
                </div>
                <div className="text-left md:min-w-[240px] md:text-right">
                  <p className="text-sm font-medium text-foreground">{setting.value_text ?? "-"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Updated {formatDateTime(setting.updated_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
