"use client";

import { useState } from "react";
import { Users, Mail, CheckCircle2, Search, X } from "lucide-react";
import { formatDate, KpiCard, type PersonRecord } from "./_shared";

interface PeopleSectionProps {
  people: PersonRecord[];
}

export default function PeopleSection({ people }: PeopleSectionProps) {
  const [peopleFilter, setPeopleFilter] = useState<"all" | "user" | "subscriber" | "both">("all");
  const [peopleSearch, setPeopleSearch] = useState("");

  const subscriberCount = people.filter((p) => p.type === "subscriber" || p.type === "both").length;
  const userCount = people.filter((p) => p.type === "user" || p.type === "both").length;

  const filteredPeople = people.filter((p) => {
    if (peopleFilter !== "all" && p.type !== peopleFilter) {
      if (peopleFilter === "both" && p.type !== "both") return false;
      if (peopleFilter === "user" && p.type !== "user" && p.type !== "both") return false;
      if (peopleFilter === "subscriber" && p.type !== "subscriber" && p.type !== "both") return false;
    }
    if (peopleSearch) {
      const q = peopleSearch.toLowerCase();
      return p.email.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || (p.workspace_name || "").toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-6 max-w-7xl space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Users} iconBg="bg-gray-100" iconColor="text-gray-600" value={people.length} label="Total People" />
        <KpiCard icon={Users} iconBg="bg-blue-50" iconColor="text-blue-600" value={userCount} label="Users" />
        <KpiCard icon={Mail} iconBg="bg-violet-50" iconColor="text-violet-600" value={subscriberCount} label="Subscribers" />
        <KpiCard icon={CheckCircle2} iconBg="bg-emerald-50" iconColor="text-emerald-600" value={people.filter((p) => p.type === "both").length} label="User + Subscriber" />
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 max-w-md min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={peopleSearch}
            onChange={(e) => setPeopleSearch(e.target.value)}
            placeholder="Search by name, email, workspace..."
            className="text-sm bg-transparent outline-none flex-1 text-gray-800 placeholder:text-gray-400"
          />
          {peopleSearch && <button onClick={() => setPeopleSearch("")} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>}
        </div>
        <div className="flex gap-1">
          {(["all", "user", "subscriber", "both"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setPeopleFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                peopleFilter === f ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-700 bg-gray-100"
              }`}
            >
              {f === "all" ? "All" : f === "user" ? "Users" : f === "subscriber" ? "Subscribers" : "Both"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500">Person</th>
                <th className="text-center px-5 py-2.5 text-xs font-medium text-gray-500">Type</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500">Workspace</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500">Role</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPeople.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="font-medium text-gray-900">{p.name || "\u2014"}</div>
                    <div className="text-xs text-gray-400">{p.email}</div>
                  </td>
                  <td className="px-5 py-3 text-center">
                    {p.type === "both" ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700">User + Subscriber</span>
                    ) : p.type === "user" ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700">User</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-100 text-violet-700">Subscriber</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{p.workspace_name || "\u2014"}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs capitalize">{p.role || "\u2014"}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{formatDate(p.created_at)}</td>
                </tr>
              ))}
              {filteredPeople.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">No people found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
