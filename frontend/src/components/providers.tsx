"use client";

import { MotionConfig } from "motion/react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { LanguageProvider } from "@/lib/language-context";
import { NavigationProgress, ScrollProgress } from "@/components/motion/primitives";
import type { Locale } from "@/lib/i18n";

export function Providers({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  return (
    <LanguageProvider initialLocale={initialLocale}>
      <AuthProvider>
        <CartProvider>
          <MotionConfig reducedMotion="user">
            <NavigationProgress />
            <ScrollProgress />
            {children}
            <Toaster
              position="top-center"
              richColors
              closeButton
              toastOptions={{ className: "font-sans" }}
            />
          </MotionConfig>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
