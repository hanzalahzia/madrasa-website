"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/field";
import { LoadingPanel } from "@/components/ui/feedback";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingPanel />}>
      <ResetForm />
    </Suspense>
  );
}

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!token) {
      setError(t("state.notFoundHint"));
      return;
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError(t("form.passwordHint"));
      return;
    }
    if (password !== confirm) {
      setError(t("auth.passwordMismatch"));
      return;
    }
    setLoading(true);
    try {
      await api("/auth/reset-password", { method: "POST", body: { token, password } });
      toast.success(t("auth.resetSuccess"));
      router.push("/login");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("state.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow={t("nav.login")}
      title={t("auth.resetTitle")}
      subtitle={t("auth.resetSubtitle")}
      footer={
        <Link href="/login" className="font-medium text-brand-800 underline underline-offset-4">
          {t("auth.signIn")}
        </Link>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <FormField label={t("form.newPassword")} htmlFor="reset-password" hint={t("form.passwordHint")} required>
          <Input
            id="reset-password"
            type="password"
            dir="ltr"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </FormField>
        <FormField label={t("form.confirmPassword")} htmlFor="reset-confirm" required>
          <Input
            id="reset-confirm"
            type="password"
            dir="ltr"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            required
          />
        </FormField>
        {error ? <p className="rounded-lg bg-red-50 p-2.5 text-xs text-red-800">{error}</p> : null}
        <Button type="submit" loading={loading} className="w-full">
          {t("action.save")}
        </Button>
      </form>
    </AuthShell>
  );
}
