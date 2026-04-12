import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password — WorkChores",
  description: "Reset your WorkChores password. Enter your email and we'll send you a link to create a new one.",
  robots: { index: false },
  alternates: {
    canonical: "https://workchores.com/forgot-password",
  },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
