"use client";

import { Phone, Mail, Calendar, FileText, MessageSquare } from "lucide-react";
import { type Contact, type Touchpoint } from "../../data";

const typeIcons = { call: Phone, email: Mail, meeting: Calendar, note: FileText };

interface RecentActivityProps {
  touchpoints: Touchpoint[];
  contacts: Contact[];
  onSelectContact?: (id: string) => void;
}

export default function RecentActivity({ touchpoints, contacts, onSelectContact }: RecentActivityProps) {
  const recent = touchpoints.slice(0, 5);

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
      </div>
      <div className="divide-y divide-border">
        {recent.map((t) => {
          const contact = contacts.find((c) => c.id === t.contactId);
          const Icon = typeIcons[t.type];
          return (
            <div
              key={t.id}
              className="flex gap-3 px-5 py-3 hover:bg-surface/50 transition-colors cursor-pointer"
              onClick={() => contact && onSelectContact?.(contact.id)}
            >
              <div className="w-8 h-8 rounded-full bg-accent-light flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground">{t.title}</div>
                <div className="text-xs text-muted truncate">
                  {contact ? `${contact.name} · ` : ""}{t.type} · {t.date}
                </div>
              </div>
            </div>
          );
        })}
        {recent.length === 0 && (
          <div className="px-5 py-8 text-center">
            <MessageSquare className="w-8 h-8 text-muted/30 mx-auto mb-2" />
            <p className="text-sm text-muted">No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
}
