import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import SupportChat from "@/components/support-chat";
import { ErrorBoundary } from "@/components/error-boundary";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WorkChores — The Operations Platform",
  description:
    "CRM, vendor management, HR, budgets, and tasks — one platform for the people who run the business.",
  metadataBase: new URL("https://workchores.com"),
  alternates: { canonical: "/" },
  openGraph: {
    title: "WorkChores — The Operations Platform",
    description: "CRM, vendor management, HR, budgets, and tasks — one platform for the people who run the business.",
    type: "website",
    url: "https://workchores.com",
    siteName: "WorkChores",
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://workchores.com" },
    { "@type": "ListItem", position: 2, name: "CRM", item: "https://workchores.com/crm" },
    { "@type": "ListItem", position: 3, name: "Vendor Management", item: "https://workchores.com/vendor-management" },
    { "@type": "ListItem", position: 4, name: "Task Tracker", item: "https://workchores.com/task-tracker" },
    { "@type": "ListItem", position: 5, name: "Blog", item: "https://workchores.com/blog" },
    { "@type": "ListItem", position: 6, name: "About", item: "https://workchores.com/about" },
    { "@type": "ListItem", position: 7, name: "Contact", item: "https://workchores.com/contact" },
  ],
};

function BreadcrumbSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <BreadcrumbSchema />
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-white focus:text-accent focus:rounded-lg focus:shadow-lg focus:text-sm focus:font-medium">
          Skip to content
        </a>
        {children}
        <ErrorBoundary fallback={null}><SupportChat /></ErrorBoundary>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
