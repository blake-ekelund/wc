import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — WorkChores",
  description: "Sign in to your WorkChores account to manage contacts, deals, tasks, and your sales pipeline.",
  openGraph: {
    title: "Sign In — WorkChores",
    description: "Sign in to your WorkChores account to manage contacts, deals, tasks, and your sales pipeline.",
    type: "website",
    url: "https://workchores.com/signin",
  },
  alternates: {
    canonical: "https://workchores.com/signin",
  },
};

export default function SigninLayout({ children }: { children: React.ReactNode }) {
  return children;
}
