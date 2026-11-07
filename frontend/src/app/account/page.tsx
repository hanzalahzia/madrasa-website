"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { KeyRound, LayoutDashboard, UserRound } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth, portalPathFor } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { formatDate, formatStatus } from "@/lib/format";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { Badge, Card } from "@/components/ui/card";
import { Button, ButtonLink } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/field";
import { LoadingPanel } from "@/components/ui/feedback";

export default function AccountPage() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const { user, loading, refresh } = useAuth();
  const [profile, setProfile] = useState({ name: "", phone: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (user) setProfile({ name: user.name, phone: user.phone || "" });
  }, [user]);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSavingProfile(true);
    try {
      await api("/auth/profile", { method: "PATCH", body: profile });
      await refresh();
      toast.success(t("state.saved"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("state.error"));
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (passwords.newPassword !== passwords.confirm) {
      setError(t("auth.passwordMismatch"));
      return;
    }
    setSavingPassword(true);
    try {
      await api("/auth/change-password", {
        method: "POST",
        body: { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword }
      });
      setPasswords({ currentPassword: "", newPassword: "", confirm: "" });
      toast.success(t("auth.passwordChanged"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("state.error"));
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading || !user) {
    return (
      <Section>
        <LoadingPanel label={t("state.loading")} />
      </Section>
    );
  }

  return (
    <>
      <PageHero
        eyebrow={t("auth.myAccount")}
        title={user.name}
        description={user.email}
        breadcrumbs={[{ label: t("nav.home"), href: "/" }, { label: t("auth.myAccount") }]}
        compact
      >
        <div className="flex flex-wrap gap-2">
          <Badge tone="gold">{formatStatus(user.role, locale)}</Badge>
          {user.createdAt ? <Badge tone="neutral">{formatDate(user.createdAt, locale)}</Badge> : null}
        </div>
      </PageHero>
      <Section>
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card>
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-brand-950">
              <UserRound className="h-5 w-5" /> {t("auth.profile")}
            </h2>
            <form onSubmit={saveProfile} className="mt-4 space-y-4">
              <FormField label={t("form.fullName")} htmlFor="account-name">
                <Input id="account-name" value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} />
              </FormField>
              <FormField label={t("form.email")} htmlFor="account-email">
                <Input id="account-email" value={user.email} disabled dir="ltr" />
              </FormField>
              <FormField label={t("form.phone")} htmlFor="account-phone">
                <Input
                  id="account-phone"
                  dir="ltr"
                  value={profile.phone}
                  onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))}
                />
              </FormField>
              <Button type="submit" loading={savingProfile}>
                {savingProfile ? t("action.saving") : t("action.save")}
              </Button>
            </form>
            <div className="mt-5 flex flex-wrap gap-2 border-t border-brand-950/10 pt-4">
              <ButtonLink href={portalPathFor(user.role)} variant="outline" size="sm">
                <LayoutDashboard className="h-4 w-4" /> {user.role === "super_admin" ? t("nav.admin") : t("nav.portal")}
              </ButtonLink>
              <Link href="/books" className="inline-flex items-center px-3 text-xs font-medium text-brand-800 underline underline-offset-4">
                {t("nav.books")}
              </Link>
            </div>
          </Card>
          <Card>
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-brand-950">
              <KeyRound className="h-5 w-5" /> {t("auth.changePassword")}
            </h2>
            <form onSubmit={savePassword} className="mt-4 space-y-4">
              <FormField label={t("form.currentPassword")} htmlFor="account-current">
                <Input
                  id="account-current"
                  type="password"
                  dir="ltr"
                  autoComplete="current-password"
                  value={passwords.currentPassword}
                  onChange={(event) => setPasswords((current) => ({ ...current, currentPassword: event.target.value }))}
                />
              </FormField>
              <FormField label={t("form.newPassword")} htmlFor="account-new" hint={t("form.passwordHint")}>
                <Input
                  id="account-new"
                  type="password"
                  dir="ltr"
                  autoComplete="new-password"
                  value={passwords.newPassword}
                  onChange={(event) => setPasswords((current) => ({ ...current, newPassword: event.target.value }))}
                />
              </FormField>
              <FormField label={t("form.confirmPassword")} htmlFor="account-confirm">
                <Input
                  id="account-confirm"
                  type="password"
                  dir="ltr"
                  autoComplete="new-password"
                  value={passwords.confirm}
                  onChange={(event) => setPasswords((current) => ({ ...current, confirm: event.target.value }))}
                />
              </FormField>
              {error ? <p className="rounded-lg bg-red-50 p-2.5 text-xs text-red-800">{error}</p> : null}
              <Button type="submit" loading={savingPassword}>
                {t("auth.changePassword")}
              </Button>
            </form>
          </Card>
        </div>
      </Section>
    </>
  );
}
