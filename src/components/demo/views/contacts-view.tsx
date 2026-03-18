"use client";

import { useState } from "react";
import { Search, Filter, ChevronRight, AlertCircle } from "lucide-react";
import { formatCurrency, type Stage, type Contact, type StageDefinition } from "../data";

interface ContactsViewProps {
  contacts: Contact[];
  stages: StageDefinition[];
  onSelectContact: (id: string) => void;
}

export default function ContactsView({ contacts, stages, onSelectContact }: ContactsViewProps) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<Stage | "All" | "Unassigned">("All");

  const unassignedCount = contacts.filter((c) => c.owner === "Unassigned").length;

  const filtered = contacts
    .filter((c) => {
      if (stageFilter === "Unassigned") {
        if (c.owner !== "Unassigned") return false;
      } else if (stageFilter !== "All" && c.stage !== stageFilter) {
        return false;
      }
      if (search) {
        const q = search.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Contacts</h2>
          <p className="text-sm text-muted mt-0.5">{contacts.length} total contacts</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-border rounded-lg px-3 py-1.5 flex-1 sm:w-56">
            <Search className="w-4 h-4 text-muted shrink-0" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-sm bg-transparent outline-none flex-1 text-foreground placeholder:text-muted"
            />
          </div>
        </div>
      </div>

      {/* Stage filter pills */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        <Filter className="w-4 h-4 text-muted shrink-0" />
        <button
          onClick={() => setStageFilter("All")}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
            stageFilter === "All"
              ? "bg-accent text-white"
              : "bg-white border border-border text-muted hover:text-foreground"
          }`}
        >
          All
        </button>
        {stages.map((s) => (
          <button
            key={s.label}
            onClick={() => setStageFilter(s.label)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
              stageFilter === s.label
                ? `${s.bgColor} ${s.color}`
                : "bg-white border border-border text-muted hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
        {unassignedCount > 0 && (
          <button
            onClick={() => setStageFilter("Unassigned")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 inline-flex items-center gap-1 ${
              stageFilter === "Unassigned"
                ? "bg-amber-100 text-amber-700"
                : "bg-white border border-amber-300 text-amber-600 hover:bg-amber-50"
            }`}
          >
            <AlertCircle className="w-3 h-3" />
            Unassigned ({unassignedCount})
          </button>
        )}
      </div>

      {/* Contact table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface border-b border-border">
                <th className="text-left text-xs font-medium text-muted px-4 py-3">Name</th>
                <th className="text-left text-xs font-medium text-muted px-4 py-3 hidden md:table-cell">Company</th>
                <th className="text-left text-xs font-medium text-muted px-4 py-3 hidden sm:table-cell">Stage</th>
                <th className="text-right text-xs font-medium text-muted px-4 py-3">Value</th>
                <th className="text-left text-xs font-medium text-muted px-4 py-3 hidden lg:table-cell">Owner</th>
                <th className="text-left text-xs font-medium text-muted px-4 py-3 hidden lg:table-cell">Last Contact</th>
                <th className="w-10 px-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => {
                const stageInfo = stages.find((s) => s.label === c.stage);
                return (
                  <tr
                    key={c.id}
                    onClick={() => onSelectContact(c.id)}
                    className="hover:bg-surface/50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full ${c.avatarColor} flex items-center justify-center text-[11px] font-bold text-white shrink-0`}
                        >
                          {c.avatar}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{c.name}</div>
                          <div className="text-xs text-muted truncate md:hidden">{c.company}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-foreground">{c.company}</span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {stageInfo && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${stageInfo.bgColor} ${stageInfo.color}`}>
                          {c.stage}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-semibold text-foreground tabular-nums">
                        {formatCurrency(c.value)}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {c.owner === "Unassigned" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          <AlertCircle className="w-3 h-3" />
                          Unassigned
                        </span>
                      ) : (
                        <span className="text-sm text-muted">{c.owner}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-muted">{c.lastContact}</span>
                    </td>
                    <td className="px-2">
                      <ChevronRight className="w-4 h-4 text-muted" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm text-muted">
            No contacts match your search.
          </div>
        )}
      </div>
    </div>
  );
}
