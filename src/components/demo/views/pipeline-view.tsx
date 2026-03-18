"use client";

import { useState, useMemo } from "react";
import { Search, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { formatCurrency, type Stage, type Contact, type StageDefinition } from "../data";

interface PipelineViewProps {
  contacts: Contact[];
  stages: StageDefinition[];
  onSelectContact: (id: string) => void;
  ownerLabels: string[];
}

type SortKey = "name" | "company" | "value" | "lastContact" | "owner";
type SortDir = "asc" | "desc";

export default function PipelineView({ contacts, stages, onSelectContact, ownerLabels }: PipelineViewProps) {
  const [stageFilter, setStageFilter] = useState<Stage | "All">("All");
  const [ownerFilter, setOwnerFilter] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const activeStages = stages.filter((s) => !s.label.toLowerCase().includes("lost"));

  const stageSummary = useMemo(() => {
    return activeStages.map((s) => {
      const items = contacts.filter((c) => c.stage === s.label);
      return {
        ...s,
        count: items.length,
        value: items.reduce((a, c) => a + c.value, 0),
      };
    });
  }, [activeStages, contacts]);

  const totalPipeline = stageSummary.reduce((a, s) => a + s.value, 0);
  const totalDeals = stageSummary.reduce((a, s) => a + s.count, 0);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "value" ? "desc" : "asc");
    }
  }

  const filtered = useMemo(() => {
    let result = contacts.filter((c) => !c.stage.toLowerCase().includes("lost"));

    if (stageFilter !== "All") {
      result = result.filter((c) => c.stage === stageFilter);
    }

    if (ownerFilter !== "All") {
      result = result.filter((c) => c.owner === ownerFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "company":
          cmp = a.company.localeCompare(b.company);
          break;
        case "value":
          cmp = a.value - b.value;
          break;
        case "owner":
          cmp = a.owner.localeCompare(b.owner);
          break;
        case "lastContact":
          cmp = a.lastContact.localeCompare(b.lastContact);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [stageFilter, ownerFilter, search, sortKey, sortDir]);

  const filteredValue = filtered.reduce((a, c) => a + c.value, 0);

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return null;
    return sortDir === "asc" ? (
      <ChevronUp className="w-3 h-3 inline ml-0.5" />
    ) : (
      <ChevronDown className="w-3 h-3 inline ml-0.5" />
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Sales Pipeline</h2>
          <p className="text-sm text-muted mt-0.5">
            {totalDeals} active deals · {formatCurrency(totalPipeline)} total value
          </p>
        </div>
      </div>

      {/* Funnel summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {stageSummary.map((s) => (
          <button
            key={s.label}
            onClick={() => setStageFilter(stageFilter === s.label ? "All" : s.label)}
            className={`rounded-lg border p-3 text-left transition-all ${
              stageFilter === s.label
                ? "border-accent bg-accent-light ring-1 ring-accent"
                : "border-border bg-white hover:shadow-md"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${s.bgColor} ${s.color}`}
              >
                {s.label}
              </span>
              <span className="text-xs text-muted">{s.count}</span>
            </div>
            <div className="text-base font-bold text-foreground tabular-nums">
              {formatCurrency(s.value)}
            </div>
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-2 bg-white border border-border rounded-lg px-3 py-1.5 flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-muted shrink-0" />
          <input
            type="text"
            placeholder="Search deals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm bg-transparent outline-none flex-1 text-foreground placeholder:text-muted"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="pipeline-owner" className="text-xs font-medium text-muted whitespace-nowrap">Owner</label>
          <select
            id="pipeline-owner"
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="text-sm bg-white border border-border rounded-lg px-3 py-1.5 text-foreground outline-none focus:ring-1 focus:ring-accent cursor-pointer"
          >
            <option value="All">All owners</option>
            {ownerLabels.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs text-muted">
          {filtered.length} deal{filtered.length !== 1 ? "s" : ""} ·{" "}
          {formatCurrency(filteredValue)}
        </span>
        {(stageFilter !== "All" || ownerFilter !== "All" || search) && (
          <button
            onClick={() => {
              setStageFilter("All");
              setOwnerFilter("All");
              setSearch("");
            }}
            className="text-xs text-accent hover:text-accent-dark font-medium"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-surface border-b border-border">
              <th
                onClick={() => handleSort("name")}
                className="text-left text-xs font-medium text-muted px-4 py-3 cursor-pointer hover:text-foreground select-none"
              >
                Deal <SortIcon col="name" />
              </th>
              <th className="text-left text-xs font-medium text-muted px-4 py-3 hidden sm:table-cell">
                Stage
              </th>
              <th
                onClick={() => handleSort("value")}
                className="text-right text-xs font-medium text-muted px-4 py-3 cursor-pointer hover:text-foreground select-none"
              >
                Value <SortIcon col="value" />
              </th>
              <th
                onClick={() => handleSort("owner")}
                className="text-left text-xs font-medium text-muted px-4 py-3 hidden md:table-cell cursor-pointer hover:text-foreground select-none"
              >
                Owner <SortIcon col="owner" />
              </th>
              <th className="text-left text-xs font-medium text-muted px-4 py-3 hidden lg:table-cell">
                Last Contact
              </th>
              <th className="text-left text-xs font-medium text-muted px-4 py-3 hidden lg:table-cell">
                Tags
              </th>
              <th className="w-8 px-2"></th>
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
                        <div className="text-sm font-medium text-foreground truncate">
                          {c.name}
                        </div>
                        <div className="text-xs text-muted truncate">{c.company}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {stageInfo && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${stageInfo.bgColor} ${stageInfo.color}`}
                      >
                        {c.stage}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-semibold text-foreground tabular-nums">
                      {formatCurrency(c.value)}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-sm text-muted">{c.owner}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs text-muted">{c.lastContact}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex gap-1 flex-wrap">
                      {c.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-2">
                    <ChevronRight className="w-4 h-4 text-muted" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm text-muted">
            No deals match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
