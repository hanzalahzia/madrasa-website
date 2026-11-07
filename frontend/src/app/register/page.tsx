"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/field";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (form.name.trim().length < 2) {
      setError(t("form.required"));
      return;
    }
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      setError(t("form.passwordHint"));
      return;
    }
    if (form.password !== form.confirm) {
      setError(t("auth.passwordMismatch"));
      return;
    }
    setLoading(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password
      });
      toast.success(t("auth.accountCreated"));
      router.push("/portal");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("state.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow={t("nav.register")}
      title={t("auth.createAccount")}
      subtitle={t("auth.createSubtitle")}
      footer={
        <span>
          {t("auth.haveAccount")}{" "}
          <Link href="/login" className="font-medium text-brand-800 underline underline-offset-4">
            {t("auth.signIn")}
          </Link>
        </span>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <FormField label={t("form.fullName")} htmlFor="reg-name" required>
          <Input id="reg-name" value={form.name} onChange={(event) => update("name", event.target.value)} autoComplete="name" required />
        </FormField>
        <FormField label={t("form.email")} htmlFor="reg-email" required>
          <Input id="reg-email" type="email" dir="ltr" value={form.email} onChange={(event) => update("email", event.target.value)} autoComplete="email" required />
        </FormField>
        <FormField label={t("form.phone")} htmlFor="reg-phone">
          <Input id="reg-phone" type="tel" dir="ltr" value={form.phone} onChange={(event) => update("phone", event.target.value)} autoComplete="tel" />
        </FormField>
        <FormField label={t("form.password")} htmlFor="reg-password" hint={t("form.passwordHint")} required>
          <Input id="reg-password" type="password" dir="ltr" value={form.password} onChange={(event) => update("password", event.target.value)} autoComplete="new-password" required />
        </FormField>
        <FormField label={t("form.confirmPassword")} htmlFor="reg-confirm" required>
          <Input id="reg-confirm" type="password" dir="ltr" value={form.confirm} onChange={(event) => update("confirm", event.target.value)} autoComplete="new-password" required />
        </FormField>
        {error ? <p className="rounded-lg bg-red-50 p-2.5 text-xs text-red-800">{error}</p> : null}
        <Button type="submit" loading={loading} className="w-full">
          {t("nav.register")}
        </Button>
        <p className="text-[11px] leading-relaxed text-muted">{t("auth.demoNotice")}</p>
      </form>
    </AuthShell>
  );
}
