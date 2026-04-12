import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact WorkChores — We'd Love to Hear From You",
  description: "Get in touch with the WorkChores team. Email us at support@workchores.com, use our live chat, or fill out our contact form. We respond within 24 hours, usually faster.",
  openGraph: {
    title: "Contact WorkChores — We'd Love to Hear From You",
    description: "Get in touch with the WorkChores team. Email us at support@workchores.com or use our live chat. We respond within 24 hours.",
    type: "website",
    url: "https://workchores.com/contact",
  },
  alternates: {
    canonical: "https://workchores.com/contact",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
