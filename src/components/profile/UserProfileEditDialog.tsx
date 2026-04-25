import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { apiPut } from "@/lib/api";

export interface EditableUserProfile {
  first_name: string;
  last_name: string;
  phone: string | null;
  title: string | null;
  office_location: string | null;
}

interface UserProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: EditableUserProfile | null;
}

interface ProfileFormState {
  first_name: string;
  last_name: string;
  phone: string;
  title: string;
  office_location: string;
}

function getInitialState(profile: EditableUserProfile | null): ProfileFormState {
  return {
    first_name: profile?.first_name ?? "",
    last_name: profile?.last_name ?? "",
    phone: profile?.phone ?? "",
    title: profile?.title ?? "",
    office_location: profile?.office_location ?? "",
  };
}

export function UserProfileEditDialog({ open, onOpenChange, profile }: UserProfileEditDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProfileFormState>(getInitialState(profile));

  useEffect(() => {
    if (open) {
      setForm(getInitialState(profile));
    }
  }, [open, profile]);

  const mutation = useMutation({
    mutationFn: () =>
      apiPut("/users/me/profile", {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim() || null,
        title: form.title.trim() || null,
        office_location: form.office_location.trim() || null,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["profile", "me"] }),
        queryClient.invalidateQueries({ queryKey: ["auth", "me"] }),
      ]);
      toast({
        title: "Profile updated",
        description: "Your profile changes were saved successfully.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Unable to update profile",
        description: error instanceof Error ? error.message : "Please try again in a moment.",
      });
    },
  });

  const setField = <K extends keyof ProfileFormState>(key: K, value: ProfileFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your contact details and staff-facing profile information used across the CIS workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="profile-first-name">First Name</Label>
            <Input id="profile-first-name" value={form.first_name} onChange={(event) => setField("first_name", event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-last-name">Last Name</Label>
            <Input id="profile-last-name" value={form.last_name} onChange={(event) => setField("last_name", event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-phone">Phone</Label>
            <Input id="profile-phone" value={form.phone} onChange={(event) => setField("phone", event.target.value)} placeholder="+1 555 000 0000" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-title">Title</Label>
            <Input id="profile-title" value={form.title} onChange={(event) => setField("title", event.target.value)} placeholder="Registrar Officer" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="profile-office-location">Office Location</Label>
            <Input
              id="profile-office-location"
              value={form.office_location}
              onChange={(event) => setField("office_location", event.target.value)}
              placeholder="Administration Block"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="button" className="gradient-primary text-primary-foreground hover:opacity-90" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
