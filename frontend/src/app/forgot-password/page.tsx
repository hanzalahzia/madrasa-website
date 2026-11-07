"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/field";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const result = await api<{ message: string; devResetUrl?: string }>("/auth/forgot-password", {
        method: "POST",
        body: { email: email.trim() }
      });
      setMessage(result.message);
      setDevLink(result.devResetUrl || null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("state.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow={t("nav.login")}
      title={t("auth.forgotTitle")}
      subtitle={t("auth.forgotSubtitle")}
      footer={
        <Link href="/login" className="font-medium text-brand-800 underline underline-offset-4">
          {t("auth.signIn")}
        </Link>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <FormField label={t("form.email")} htmlFor="forgot-email" required>
          <Input
            id="forgot-email"
            type="email"
            dir="ltr"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </FormField>
        {message ? <p className="rounded-lg bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-900">{message}</p> : null}
        {devLink ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
            <p className="font-semibold">{t("auth.devLink")}</p>
            <p className="mt-1">{t("auth.devLinkHint")}</p>
            <Link href={devLink} className="mt-2 inline-block break-all font-medium underline underline-offset-4">
              {devLink}
            </Link>
          </div>
        ) : null}
        {error ? <p className="rounded-lg bg-red-50 p-2.5 text-xs text-red-800">{error}</p> : null}
        <Button type="submit" loading={loading} className="w-full">
          {t("auth.sendRecovery")}
        </Button>
      </form>
    </AuthShell>
  );
}
