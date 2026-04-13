"use client";

import { usePathname } from "next/navigation";
import SupportChat from "./support-chat";
import VisitorAssistant from "./visitor-assistant";

export default function ChatRouter() {
  const pathname = usePathname();

  // Admin pages — no widget
  if (pathname.startsWith("/admin")) return null;

  // App and demo pages — support chat
  if (pathname.startsWith("/app") || pathname.startsWith("/demo") || pathname.startsWith("/onboarding")) {
    return <SupportChat />;
  }

  // Auth pages — no widget (clean signup/signin experience)
  if (pathname.startsWith("/signin") || pathname.startsWith("/signup") || pathname.startsWith("/forgot-password") || pathname.startsWith("/reset-password")) {
    return null;
  }

  // Everything else (marketing pages) — visitor assistant
  return <VisitorAssistant />;
}
