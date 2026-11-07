"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth, portalPathFor } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/field";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { login, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) router.replace(portalPathFor(user.role));
  }, [user, router]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await login(email.trim(), password);
      toast.success(t("auth.signIn"));
      router.push(portalPathFor(result.user.role));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("auth.invalid"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow={t("nav.login")}
      title={t("auth.signIn")}
      subtitle={t("auth.signInSubtitle")}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link href="/forgot-password" className="font-medium text-brand-800 underline underline-offset-4">
            {t("auth.forgot")}
          </Link>
          <span>
            {t("auth.noAccount")}{" "}
            <Link href="/register" className="font-medium text-brand-800 underline underline-offset-4">
              {t("nav.register")}
            </Link>
          </span>
        </div>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <FormField label={t("form.email")} htmlFor="login-email" required>
          <Input
            id="login-email"
            type="email"
            dir="ltr"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </FormField>
        <FormField label={t("form.password")} htmlFor="login-password" required>
          <Input
            id="login-password"
            type="password"
            dir="ltr"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </FormField>
        {error ? <p className="rounded-lg bg-red-50 p-2.5 text-xs text-red-800">{error}</p> : null}
        <Button type="submit" loading={loading} className="w-full">
          {loading ? t("auth.signingIn") : t("auth.signIn")}
        </Button>
        <p className="text-[11px] leading-relaxed text-muted">{t("auth.demoNotice")}</p>
      </form>
    </AuthShell>
  );
}
