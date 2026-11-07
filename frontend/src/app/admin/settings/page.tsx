"use client";

import { useEffect, useState } from "react";
import { ImagePlus, Save, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage, uploadImage } from "@/lib/api";
import { useApi, invalidateApiCache } from "@/lib/use-api";
import type { Localized } from "@/lib/i18n";
import type { PublicSettings } from "@/lib/types";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckRow, FormField, Input, LocalizedField } from "@/components/ui/field";
import { ErrorState, LoadingPanel } from "@/components/ui/feedback";

interface AdminSettings extends PublicSettings {
  _id?: string;
  updatedAt?: string;
}

interface SettingsForm {
  siteName: string;
  logoUrl: string;
  brandSubtitle: Localized;
  heroTitle: Localized;
  heroSubtitle: Localized;
  heroNote: Localized;
  heroImage: string;
  tagline: Localized;
  aboutShort: Localized;
  announcementBar: Localized;
  contactPhone: string;
  contactPhoneAlt: string;
  contactEmail: string;
  address: Localized;
  officeHours: Localized;
  admissionEmail: string;
  admissionsOpen: boolean;
  facebook: string;
  instagram: string;
  youtube: string;
  whatsapp: string;
  shippingFee: string;
  freeShippingAbove: string;
  codEnabled: boolean;
  bankTransferEnabled: boolean;
  bankDetails: Localized;
  shippingPolicy: Localized;
  paymentPolicy: Localized;
  cancellationPolicy: Localized;
  returnPolicy: Localized;
  mapEmbedUrl: string;
}

const empty: Localized = { en: "", ur: "", ar: "" };

const blank: SettingsForm = {
  siteName: "",
  logoUrl: "",
  brandSubtitle: empty,
  heroTitle: empty,
  heroSubtitle: empty,
  heroNote: empty,
  heroImage: "",
  tagline: empty,
  aboutShort: empty,
  announcementBar: empty,
  contactPhone: "",
  contactPhoneAlt: "",
  contactEmail: "",
  address: empty,
  officeHours: empty,
  admissionEmail: "",
  admissionsOpen: true,
  facebook: "",
  instagram: "",
  youtube: "",
  whatsapp: "",
  shippingFee: "250",
  freeShippingAbove: "5000",
  codEnabled: true,
  bankTransferEnabled: false,
  bankDetails: empty,
  shippingPolicy: empty,
  paymentPolicy: empty,
  cancellationPolicy: empty,
  returnPolicy: empty,
  mapEmbedUrl: ""
};

function ImageField({
  label,
  value,
  onChange,
  hint
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadImage(file);
      onChange(uploaded.url);
      toast.success("Image uploaded");
    } catch (caught) {
      toast.error(errorMessage(caught));
    } finally {
      setUploading(false);
    }
  };

  return (
    <FormField label={label} hint={hint}>
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder="https://… or /uploads/…" />
          <label
            className={`inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-brand-950/15 bg-white px-3 text-xs font-semibold text-brand-900 shadow-sm transition hover:border-brand-700/40 hover:bg-brand-950/[0.03] ${uploading ? "pointer-events-none opacity-60" : ""}`}
          >
            <ImagePlus className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
              className="sr-only"
              disabled={uploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                void upload(file);
              }}
            />
          </label>
        </div>
        {value ? (
          <img src={value} alt="" className="h-20 w-auto max-w-full rounded-xl border border-brand-950/10 bg-brand-950/[0.03] object-contain p-1" />
        ) : null}
      </div>
    </FormField>
  );
}

export default function AdminSettingsPage() {
  const settings = useApi<AdminSettings>("/admin/settings");
  const [form, setForm] = useState<SettingsForm>(blank);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!settings.data) return;
    setForm({
      siteName: settings.data.siteName || "",
      logoUrl: settings.data.logoUrl || "",
      brandSubtitle: settings.data.brandSubtitle || empty,
      heroTitle: settings.data.heroTitle || empty,
      heroSubtitle: settings.data.heroSubtitle || empty,
      heroNote: settings.data.heroNote || empty,
      heroImage: settings.data.heroImage || "",
      tagline: settings.data.tagline || empty,
      aboutShort: settings.data.aboutShort || empty,
      announcementBar: settings.data.announcementBar || empty,
      contactPhone: settings.data.contactPhone || "",
      contactPhoneAlt: settings.data.contactPhoneAlt || "",
      contactEmail: settings.data.contactEmail || "",
      address: settings.data.address || empty,
      officeHours: settings.data.officeHours || empty,
      admissionEmail: settings.data.admissionEmail || "",
      admissionsOpen: settings.data.admissionsOpen !== false,
      facebook: settings.data.socials?.facebook || "",
      instagram: settings.data.socials?.instagram || "",
      youtube: settings.data.socials?.youtube || "",
      whatsapp: settings.data.socials?.whatsapp || "",
      shippingFee: String(settings.data.shippingFee ?? 250),
      freeShippingAbove: String(settings.data.freeShippingAbove ?? 5000),
      codEnabled: settings.data.codEnabled !== false,
      bankTransferEnabled: Boolean(settings.data.bankTransferEnabled),
      bankDetails: settings.data.bankDetails || empty,
      shippingPolicy: settings.data.shippingPolicy || empty,
      paymentPolicy: settings.data.paymentPolicy || empty,
      cancellationPolicy: settings.data.cancellationPolicy || empty,
      returnPolicy: settings.data.returnPolicy || empty,
      mapEmbedUrl: settings.data.mapEmbedUrl || ""
    });
  }, [settings.data]);

  const update = <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api("/admin/settings", {
        method: "PUT",
        body: {
          siteName: form.siteName,
          logoUrl: form.logoUrl,
          brandSubtitle: form.brandSubtitle,
          heroTitle: form.heroTitle,
          heroSubtitle: form.heroSubtitle,
          heroNote: form.heroNote,
          heroImage: form.heroImage,
          tagline: form.tagline,
          aboutShort: form.aboutShort,
          announcementBar: form.announcementBar,
          contactPhone: form.contactPhone,
          contactPhoneAlt: form.contactPhoneAlt,
          contactEmail: form.contactEmail,
          address: form.address,
          officeHours: form.officeHours,
          admissionEmail: form.admissionEmail,
          admissionsOpen: form.admissionsOpen,
          socials: {
            facebook: form.facebook,
            instagram: form.instagram,
            youtube: form.youtube,
            whatsapp: form.whatsapp
          },
          shippingFee: Number(form.shippingFee) || 0,
          freeShippingAbove: Number(form.freeShippingAbove) || 0,
          codEnabled: form.codEnabled,
          bankTransferEnabled: form.bankTransferEnabled,
          bankDetails: form.bankDetails,
          shippingPolicy: form.shippingPolicy,
          paymentPolicy: form.paymentPolicy,
          cancellationPolicy: form.cancellationPolicy,
          returnPolicy: form.returnPolicy,
          mapEmbedUrl: form.mapEmbedUrl
        }
      });
      toast.success("Settings saved");
      invalidateApiCache();
      settings.reload();
    } catch (caught) {
      toast.error(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  if (settings.loading && !settings.data) return <LoadingPanel label="Loading settings…" />;
  if (settings.error && !settings.data) return <ErrorState description={settings.error} onRetry={settings.reload} />;

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold-700">System</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-brand-950">Site settings</h1>
          <p className="mt-1 text-sm text-muted">Brand, contact details, bookstore rules and published policies.</p>
        </div>
        <Button type="submit" loading={saving}>
          <Save className="h-4 w-4" /> Save settings
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Identity</CardTitle>
            <CardDescription>Names, tagline and announcement bar used across the website.</CardDescription>
          </div>
          <Settings2 className="h-5 w-5 text-brand-700" />
        </CardHeader>
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Site name" required>
              <Input value={form.siteName} onChange={(event) => update("siteName", event.target.value)} required />
            </FormField>
            <FormField label="Admissions status">
              <CheckRow label="Admissions open" hint="Controls the admissions call-to-action.">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-brand-900"
                  checked={form.admissionsOpen}
                  onChange={(event) => update("admissionsOpen", event.target.checked)}
                />
              </CheckRow>
            </FormField>
          </div>
          <LocalizedField label="Tagline" value={form.tagline} onChange={(value) => update("tagline", value)} />
          <LocalizedField
            label="About (short)"
            value={form.aboutShort}
            onChange={(value) => update("aboutShort", value)}
            multiline
            rows={3}
          />
          <LocalizedField
            label="Announcement bar"
            value={form.announcementBar}
            onChange={(value) => update("announcementBar", value)}
          />
        </div>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Branding & homepage</CardTitle>
            <CardDescription>Logo, header subtitle and the homepage hero. Leave a field blank to use the built-in default.</CardDescription>
          </div>
          <ImagePlus className="h-5 w-5 text-brand-700" />
        </CardHeader>
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <ImageField
              label="Logo"
              value={form.logoUrl}
              onChange={(value) => update("logoUrl", value)}
              hint="Used in the header, footer and portal."
            />
            <ImageField
              label="Hero image"
              value={form.heroImage}
              onChange={(value) => update("heroImage", value)}
              hint="Optional image shown on the homepage hero."
            />
          </div>
          <LocalizedField
            label="Brand subtitle"
            value={form.brandSubtitle}
            onChange={(value) => update("brandSubtitle", value)}
            hint="Shown under the site name in the header."
          />
          <LocalizedField label="Hero title" value={form.heroTitle} onChange={(value) => update("heroTitle", value)} />
          <LocalizedField
            label="Hero subtitle"
            value={form.heroSubtitle}
            onChange={(value) => update("heroSubtitle", value)}
            multiline
            rows={3}
          />
          <LocalizedField label="Hero note" value={form.heroNote} onChange={(value) => update("heroNote", value)} />
        </div>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Contact</CardTitle>
            <CardDescription>Phone numbers, email addresses and office hours.</CardDescription>
          </div>
        </CardHeader>
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Primary phone">
              <Input value={form.contactPhone} onChange={(event) => update("contactPhone", event.target.value)} />
            </FormField>
            <FormField label="Alternate phone">
              <Input value={form.contactPhoneAlt} onChange={(event) => update("contactPhoneAlt", event.target.value)} />
            </FormField>
            <FormField label="Contact email">
              <Input type="email" value={form.contactEmail} onChange={(event) => update("contactEmail", event.target.value)} />
            </FormField>
            <FormField label="Admissions email">
              <Input
                type="email"
                value={form.admissionEmail}
                onChange={(event) => update("admissionEmail", event.target.value)}
              />
            </FormField>
          </div>
          <LocalizedField label="Address" value={form.address} onChange={(value) => update("address", value)} multiline rows={2} />
          <LocalizedField label="Office hours" value={form.officeHours} onChange={(value) => update("officeHours", value)} multiline rows={2} />
          <FormField label="Map embed URL" hint="Use a trusted Google Maps embed URL. Unsafe URLs are ignored on the public site.">
            <Input value={form.mapEmbedUrl} onChange={(event) => update("mapEmbedUrl", event.target.value)} />
          </FormField>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Social links</CardTitle>
            <CardDescription>Shown in the website footer.</CardDescription>
          </div>
        </CardHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Facebook URL">
            <Input value={form.facebook} onChange={(event) => update("facebook", event.target.value)} />
          </FormField>
          <FormField label="Instagram URL">
            <Input value={form.instagram} onChange={(event) => update("instagram", event.target.value)} />
          </FormField>
          <FormField label="YouTube URL">
            <Input value={form.youtube} onChange={(event) => update("youtube", event.target.value)} />
          </FormField>
          <FormField label="WhatsApp URL">
            <Input value={form.whatsapp} onChange={(event) => update("whatsapp", event.target.value)} />
          </FormField>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Bookstore</CardTitle>
            <CardDescription>Shipping charges and payment options.</CardDescription>
          </div>
        </CardHeader>
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Shipping fee">
              <Input
                type="number"
                min={0}
                value={form.shippingFee}
                onChange={(event) => update("shippingFee", event.target.value)}
              />
            </FormField>
            <FormField label="Free shipping above">
              <Input
                type="number"
                min={0}
                value={form.freeShippingAbove}
                onChange={(event) => update("freeShippingAbove", event.target.value)}
              />
            </FormField>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <CheckRow label="Cash on delivery" hint="Allow customers to pay on delivery.">
              <input
                type="checkbox"
                className="h-4 w-4 accent-brand-900"
                checked={form.codEnabled}
                onChange={(event) => update("codEnabled", event.target.checked)}
              />
            </CheckRow>
            <CheckRow label="Bank transfer" hint="Show bank details after checkout.">
              <input
                type="checkbox"
                className="h-4 w-4 accent-brand-900"
                checked={form.bankTransferEnabled}
                onChange={(event) => update("bankTransferEnabled", event.target.checked)}
              />
            </CheckRow>
          </div>
          <LocalizedField
            label="Bank details"
            value={form.bankDetails}
            onChange={(value) => update("bankDetails", value)}
            multiline
            rows={3}
          />
        </div>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Policies</CardTitle>
            <CardDescription>Displayed on the terms and bookstore help pages.</CardDescription>
          </div>
        </CardHeader>
        <div className="space-y-5">
          <LocalizedField label="Shipping policy" value={form.shippingPolicy} onChange={(value) => update("shippingPolicy", value)} multiline rows={3} />
          <LocalizedField label="Payment policy" value={form.paymentPolicy} onChange={(value) => update("paymentPolicy", value)} multiline rows={3} />
          <LocalizedField
            label="Cancellation policy"
            value={form.cancellationPolicy}
            onChange={(value) => update("cancellationPolicy", value)}
            multiline
            rows={3}
          />
          <LocalizedField label="Return policy" value={form.returnPolicy} onChange={(value) => update("returnPolicy", value)} multiline rows={3} />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" loading={saving}>
          <Save className="h-4 w-4" /> Save settings
        </Button>
      </div>
    </form>
  );
}
