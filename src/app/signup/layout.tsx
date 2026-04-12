import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up Free — WorkChores CRM for Small Teams",
  description: "Create your free WorkChores account in 60 seconds. Get contact management, deal pipeline, task tracking, and team collaboration — no credit card required.",
  keywords: "free CRM, small business CRM, sign up, WorkChores, contact management, deal pipeline",
  openGraph: {
    title: "Sign Up Free — WorkChores CRM for Small Teams",
    description: "Create your free WorkChores account in 60 seconds. Contact management, deal pipeline, and task tracking — no credit card required.",
    type: "website",
    url: "https://workchores.com/signup",
  },
  alternates: {
    canonical: "https://workchores.com/signup",
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
