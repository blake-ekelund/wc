import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About WorkChores — Simple CRM Built for Small Teams",
  description: "WorkChores is a CRM platform built for small teams that sell. Learn about our mission, values, and why we believe business tools should be simple, honest, and affordable.",
  openGraph: {
    title: "About WorkChores — Simple CRM Built for Small Teams",
    description: "WorkChores is a CRM platform built for small teams that sell. Learn about our mission, values, and why we believe business tools should be simple, honest, and affordable.",
    type: "website",
    url: "https://workchores.com/about",
  },
  alternates: {
    canonical: "https://workchores.com/about",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
