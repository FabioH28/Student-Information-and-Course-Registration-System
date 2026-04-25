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

export interface EditableStudentProfile {
  phone: string | null;
  date_of_birth: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state_region: string | null;
  postal_code: string | null;
  country: string | null;
}

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: EditableStudentProfile | null;
}

interface ProfileFormState {
  phone: string;
  date_of_birth: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state_region: string;
  postal_code: string;
  country: string;
}

function getInitialState(profile: EditableStudentProfile | null): ProfileFormState {
  return {
    phone: profile?.phone ?? "",
    date_of_birth: profile?.date_of_birth?.slice(0, 10) ?? "",
    address_line_1: profile?.address_line_1 ?? "",
    address_line_2: profile?.address_line_2 ?? "",
    city: profile?.city ?? "",
    state_region: profile?.state_region ?? "",
    postal_code: profile?.postal_code ?? "",
    country: profile?.country ?? "",
  };
}

export function ProfileEditDialog({ open, onOpenChange, profile }: ProfileEditDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProfileFormState>(getInitialState(profile));

  useEffect(() => {
    if (open) {
      setForm(getInitialState(profile));
    }
  }, [open, profile]);

  const mutation = useMutation({
    mutationFn: () =>
      apiPut("/students/me/profile", {
        phone: form.phone,
        date_of_birth: form.date_of_birth || null,
        address_line_1: form.address_line_1,
        address_line_2: form.address_line_2,
        city: form.city,
        state_region: form.state_region,
        postal_code: form.postal_code,
        country: form.country,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["student", "profile"] }),
        queryClient.invalidateQueries({ queryKey: ["student", "dashboard"] }),
      ]);
      toast({
        title: "Profile updated",
        description: "Your contact details were saved successfully.",
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
          <DialogTitle>Edit Contact Profile</DialogTitle>
          <DialogDescription>
            Keep your phone number, date of birth, and mailing details current so campus teams can reach you correctly.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="student-phone">Phone</Label>
            <Input id="student-phone" value={form.phone} onChange={(event) => setField("phone", event.target.value)} placeholder="+1 555 000 0000" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="student-dob">Date of Birth</Label>
            <Input id="student-dob" type="date" value={form.date_of_birth} onChange={(event) => setField("date_of_birth", event.target.value)} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="student-address-1">Address Line 1</Label>
            <Input
              id="student-address-1"
              value={form.address_line_1}
              onChange={(event) => setField("address_line_1", event.target.value)}
              placeholder="123 Campus Avenue"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="student-address-2">Address Line 2</Label>
            <Input
              id="student-address-2"
              value={form.address_line_2}
              onChange={(event) => setField("address_line_2", event.target.value)}
              placeholder="Apartment, suite, or residence hall"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="student-city">City</Label>
            <Input id="student-city" value={form.city} onChange={(event) => setField("city", event.target.value)} placeholder="Berlin" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="student-state">State / Region</Label>
            <Input
              id="student-state"
              value={form.state_region}
              onChange={(event) => setField("state_region", event.target.value)}
              placeholder="Berlin"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="student-postal">Postal Code</Label>
            <Input
              id="student-postal"
              value={form.postal_code}
              onChange={(event) => setField("postal_code", event.target.value)}
              placeholder="10115"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="student-country">Country</Label>
            <Input
              id="student-country"
              value={form.country}
              onChange={(event) => setField("country", event.target.value)}
              placeholder="Germany"
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
