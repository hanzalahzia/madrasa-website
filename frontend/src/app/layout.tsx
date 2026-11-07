import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Amiri, Cormorant_Garamond, Manrope, Noto_Nastaliq_Urdu } from "next/font/google";
import { Providers } from "@/components/providers";
import { SiteChrome } from "@/components/site/site-chrome";
import { dirFor, normalizeLocale } from "@/lib/i18n";
import { absoluteUrl, english, getSiteSettings, siteBaseUrl } from "@/lib/server-site";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap"
});

const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-arabic",
  display: "swap"
});

const nastaliq = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-urdu",
  display: "swap"
});

const siteUrl = siteBaseUrl();

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const siteName = settings.siteName || "Madrasa Miftah ul Uloom";
  const description =
    english(settings.heroSubtitle) ||
    english(settings.aboutShort) ||
    "Madrasa Miftah ul Uloom is a centre of Islamic learning offering structured programmes in Qur'an, Arabic and the Islamic sciences, alongside an Islamic bookstore and secure student portal.";
  const image = absoluteUrl(settings.heroImage || settings.logoUrl);

  return {
    metadataBase: new URL(siteUrl),
    applicationName: siteName,
    title: {
      default: `${siteName} | Islamic Education`,
      template: `%s | ${siteName}`
    },
    description,
    keywords: [
      siteName,
      "Islamic school",
      "Qur'an program",
      "Hifz",
      "Arabic language",
      "Islamic bookstore",
      "madrasa admissions"
    ],
    authors: [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
    alternates: { canonical: siteUrl },
    openGraph: {
      type: "website",
      siteName,
      title: `${siteName} | Islamic Education`,
      description,
      url: siteUrl,
      images: image ? [{ url: image, alt: siteName }] : undefined
    },
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description,
      images: image ? [image] : undefined
    },
    icons: {
      icon: settings.logoUrl || "/branding/emblem-placeholder.svg"
    },
    robots: {
      index: true,
      follow: true
    }
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#064e3b",
  colorScheme: "light"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get("mmu_locale")?.value);
  const dir = dirFor(locale);
  const settings = await getSiteSettings();
  const siteName = settings.siteName || "Madrasa Miftah ul Uloom";
  const description =
    english(settings.heroSubtitle) ||
    english(settings.aboutShort) ||
    "A centre of Islamic learning offering structured programmes in Qur'an, Arabic and the Islamic sciences.";
  const sameAs = Object.values(settings.socials || {}).filter(
    (value): value is string => typeof value === "string" && value.length > 0
  );
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: siteName,
    description,
    url: siteUrl,
    logo: absoluteUrl(settings.logoUrl) || `${siteUrl}/branding/emblem-placeholder.svg`,
    sameAs
  };

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${manrope.variable} ${cormorant.variable} ${amiri.variable} ${nastaliq.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body>
        <Providers initialLocale={locale}>
          <SiteChrome>{children}</SiteChrome>
        </Providers>
      </body>
    </html>
  );
}
