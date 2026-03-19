"use client";

import { useState } from "react";
import { Phone, Mail, Calendar, FileText } from "lucide-react";
import { type Touchpoint, type Contact } from "../data";

const typeIcons = { call: Phone, email: Mail, meeting: Calendar, note: FileText };
const typeLabels = { call: "Call", email: "Email", meeting: "Meeting", note: "Note" };
const typeColors = {
  call: "bg-blue-100 text-blue-700",
  email: "bg-purple-100 text-purple-700",
  meeting: "bg-amber-100 text-amber-700",
  note: "bg-gray-100 text-gray-600",
};

type FilterType = "all" | "call" | "email" | "meeting" | "note";

interface ActivityViewProps {
  touchpoints: Touchpoint[];
  contacts: Contact[];
  onSelectContact: (id: string) => void;
}

export default function ActivityView({ touchpoints, contacts, onSelectContact }: ActivityViewProps) {
  const [filter, setFilter] = useState<FilterType>("all");

  const filtered = filter === "all"
    ? touchpoints
    : touchpoints.filter((t) => t.type === filter);

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-foreground">Activity Feed</h2>
        <p className="text-sm text-muted mt-0.5">All touchpoints and interactions</p>
      </div>

      {/* Type filters */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
        {(["all", "call", "email", "meeting", "note"] as FilterType[]).map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 ${
              filter === type
                ? "bg-accent text-white"
                : "bg-white border border-border text-muted hover:text-foreground"
            }`}
          >
            {type === "all" ? "All" : typeLabels[type]}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="divide-y divide-border">
          {filtered.map((t) => {
            const contact = contacts.find((c) => c.id === t.contactId);
            const Icon = typeIcons[t.type];
            return (
              <div
                key={t.id}
                className="flex gap-4 px-5 py-4 hover:bg-surface/50 transition-colors cursor-pointer"
                onClick={() => contact && onSelectContact(contact.id)}
              >
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className="w-9 h-9 rounded-full bg-accent-light flex items-center justify-center">
                    <Icon className="w-4 h-4 text-accent" />
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${typeColors[t.type]}`}>
                    {typeLabels[t.type]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium text-foreground">{t.title}</div>
                      {contact && (
                        <div className="flex items-center gap-2 mt-0.5">
                          <div
                            className={`w-4 h-4 rounded-full ${contact.avatarColor} flex items-center justify-center text-[7px] font-bold text-white`}
                          >
                            {contact.avatar}
                          </div>
                          <span className="text-xs text-muted">
                            {contact.name} · {contact.company}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[10px] text-muted whitespace-nowrap">{t.date}</div>
                      <div className="text-[10px] text-muted mt-0.5">{t.owner}</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted mt-2 leading-relaxed">{t.description}</p>
                </div>
              </div>
            );
          })}
        </div>
        {filtered.length === 0 && touchpoints.length === 0 && (
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">No activity yet</h3>
            <p className="text-sm text-muted max-w-md mx-auto leading-relaxed">
              Activity appears here as you log calls, emails, meetings, and notes with your contacts. Open a contact and start tracking interactions.
            </p>
          </div>
        )}
        {filtered.length === 0 && touchpoints.length > 0 && (
          <div className="text-center py-12 text-sm text-muted">
            No activity for this filter.
          </div>
        )}
      </div>
    </div>
  );
}
