import { PageHeader } from "@/components/ui/page-header";

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="System configuration and preferences" />
      <div className="bg-card rounded-xl border p-8 shadow-card text-center">
        <p className="text-muted-foreground">Settings page coming soon.</p>
      </div>
    </div>
  );
}
