import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Your Password — WorkChores",
  description: "Create a new password for your WorkChores account.",
  robots: { index: false },
  alternates: {
    canonical: "https://workchores.com/reset-password",
  },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
