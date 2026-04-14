"use client";

import { useState } from "react";
import {
  GitBranch,
  GripVertical,
  ChevronRight,
  Plus,
  Trash2,
  Check,
  RotateCcw,
  Shield,
} from "lucide-react";
import { type Contact, type StageDefinition } from "@/components/demo/data";

const stageColorOptions = [
  { color: "text-blue-700", bgColor: "bg-blue-100", label: "Blue" },
  { color: "text-purple-700", bgColor: "bg-purple-100", label: "Purple" },
  { color: "text-amber-700", bgColor: "bg-amber-100", label: "Amber" },
  { color: "text-orange-700", bgColor: "bg-orange-100", label: "Orange" },
  { color: "text-emerald-700", bgColor: "bg-emerald-100", label: "Emerald" },
  { color: "text-red-700", bgColor: "bg-red-100", label: "Red" },
  { color: "text-cyan-700", bgColor: "bg-cyan-100", label: "Cyan" },
  { color: "text-pink-700", bgColor: "bg-pink-100", label: "Pink" },
  { color: "text-indigo-700", bgColor: "bg-indigo-100", label: "Indigo" },
  { color: "text-teal-700", bgColor: "bg-teal-100", label: "Teal" },
];

interface PipelineSectionProps {
  pipelineStages: StageDefinition[];
  onUpdateStages: (stages: StageDefinition[], reassignments?: Record<string, string>) => void;
  contacts: Contact[];
}

export default function PipelineSection({ pipelineStages, onUpdateStages, contacts }: PipelineSectionProps) {
  const [editingStages, setEditingStages] = useState<StageDefinition[]>(pipelineStages);
  const [pipelineDirty, setPipelineDirty] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [removedStages, setRemovedStages] = useState<string[]>([]);
  const [reassignments, setReassignments] = useState<Record<string, string>>({});
  const [newStageName, setNewStageName] = useState("");
  const [dragStageIdx, setDragStageIdx] = useState<number | null>(null);
  const [dragOverStageIdx, setDragOverStageIdx] = useState<number | null>(null);

  function handleStageRename(index: number, newLabel: string) {
    const updated = [...editingStages];
    updated[index] = { ...updated[index], label: newLabel };
    setEditingStages(updated);
    setPipelineDirty(true);
  }

  function handleStageColorChange(index: number, colorOption: typeof stageColorOptions[0]) {
    const updated = [...editingStages];
    updated[index] = { ...updated[index], color: colorOption.color, bgColor: colorOption.bgColor };
    setEditingStages(updated);
    setPipelineDirty(true);
  }

  function handleRemoveStage(index: number) {
    const updated = [...editingStages];
    updated.splice(index, 1);
    setEditingStages(updated);
    setPipelineDirty(true);
  }

  function handleAddStage() {
    if (!newStageName.trim()) return;
    const usedColors = editingStages.map((s) => s.color);
    const availableColor = stageColorOptions.find((c) => !usedColors.includes(c.color)) || stageColorOptions[0];
    setEditingStages([
      ...editingStages,
      { label: newStageName.trim(), color: availableColor.color, bgColor: availableColor.bgColor },
    ]);
    setNewStageName("");
    setPipelineDirty(true);
  }

  function handleStageDragStart(index: number) { setDragStageIdx(index); }
  function handleStageDragEnter(index: number) { setDragOverStageIdx(index); }
  function handleStageDragEnd() {
    if (dragStageIdx !== null && dragOverStageIdx !== null && dragStageIdx !== dragOverStageIdx) {
      const reordered = [...editingStages];
      const [removed] = reordered.splice(dragStageIdx, 1);
      reordered.splice(dragOverStageIdx, 0, removed);
      setEditingStages(reordered);
      setPipelineDirty(true);
    }
    setDragStageIdx(null);
    setDragOverStageIdx(null);
  }

  function handleSavePipeline() {
    const currentLabels = pipelineStages.map((s) => s.label);
    const newLabels = editingStages.map((s) => s.label);
    const removed = currentLabels.filter((l) => !newLabels.includes(l));
    const affectedStages = removed.filter((label) => contacts.some((c) => c.stage === label));

    if (affectedStages.length > 0) {
      setRemovedStages(affectedStages);
      const defaultReassignments: Record<string, string> = {};
      affectedStages.forEach((s) => { defaultReassignments[s] = newLabels[0] || ""; });
      setReassignments(defaultReassignments);
      setShowReassignModal(true);
    } else {
      onUpdateStages(editingStages);
      setPipelineDirty(false);
    }
  }

  function handleConfirmReassignment() {
    onUpdateStages(editingStages, reassignments);
    setShowReassignModal(false);
    setRemovedStages([]);
    setReassignments({});
    setPipelineDirty(false);
  }

  function handleCancelPipelineChanges() {
    setEditingStages(pipelineStages);
    setPipelineDirty(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Pipeline</h2>
        <p className="text-sm text-muted mt-1">Customize your sales funnel stages</p>
      </div>

      {/* Info banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200">
        <GitBranch className="w-4 h-4 text-blue-600 shrink-0" />
        <span className="text-sm text-blue-800">
          Customize your sales funnel stages. Drag to reorder, rename, or add new stages to match your workflow.
        </span>
      </div>

      {/* Company-wide warning */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200">
        <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="text-sm font-medium text-amber-900">Company-wide setting</span>
          <p className="text-xs text-amber-700 mt-0.5">
            Changes to the pipeline affect <span className="font-medium">all team members</span>. Contacts on removed stages will need to be reassigned.
          </p>
        </div>
      </div>

      {/* Funnel editor */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Pipeline Stages</h3>
            <p className="text-xs text-muted mt-0.5">{editingStages.length} stages &middot; Drag to reorder</p>
          </div>
          {pipelineDirty && (
            <div className="flex items-center gap-2">
              <button onClick={handleCancelPipelineChanges} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted border border-border hover:bg-surface rounded-lg transition-colors">
                <RotateCcw className="w-3.5 h-3.5" /> Discard
              </button>
              <button onClick={handleSavePipeline} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors">
                <Check className="w-3.5 h-3.5" /> Save Changes
              </button>
            </div>
          )}
        </div>

        {/* Visual funnel preview */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {editingStages.map((s, i) => (
              <div key={i} className="flex items-center gap-1 shrink-0">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${s.bgColor} ${s.color}`}>{s.label}</span>
                {i < editingStages.length - 1 && <ChevronRight className="w-3 h-3 text-muted/40" />}
              </div>
            ))}
          </div>
        </div>

        {/* Stage list */}
        <div className="divide-y divide-border">
          {editingStages.map((stage, index) => {
            const contactCount = contacts.filter((c) => c.stage === stage.label).length;
            return (
              <div
                key={index}
                draggable
                onDragStart={() => handleStageDragStart(index)}
                onDragEnter={() => handleStageDragEnter(index)}
                onDragEnd={handleStageDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className={`flex items-center gap-3 px-5 py-3 group cursor-grab active:cursor-grabbing transition-colors ${dragOverStageIdx === index ? "bg-accent/5" : "hover:bg-surface/50"}`}
              >
                <GripVertical className="w-4 h-4 text-muted/30 group-hover:text-muted shrink-0 transition-colors" />
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-medium text-muted w-5 text-center">{index + 1}</span>
                  <span className={`w-3 h-3 rounded-full ${stage.bgColor} border ${stage.color.replace("text-", "border-")}`} />
                </div>
                <input
                  type="text"
                  value={stage.label}
                  onChange={(e) => handleStageRename(index, e.target.value)}
                  className="flex-1 text-sm font-medium bg-transparent text-foreground outline-none border-b border-transparent focus:border-accent transition-colors"
                />
                {/* Color picker dots */}
                <div className="hidden group-hover:flex items-center gap-1">
                  {stageColorOptions.slice(0, 6).map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => handleStageColorChange(index, opt)}
                      className={`w-4 h-4 rounded-full ${opt.bgColor} border ${opt.color.replace("text-", "border-")} transition-transform hover:scale-125 ${stage.color === opt.color ? "ring-2 ring-offset-1 ring-accent" : ""}`}
                      title={opt.label}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {contactCount > 0 && (
                    <span className="text-[10px] text-muted bg-surface px-1.5 py-0.5 rounded-full">{contactCount} deal{contactCount !== 1 ? "s" : ""}</span>
                  )}
                  {editingStages.length > 2 && (
                    <button onClick={() => handleRemoveStage(index)} className="p-1 text-muted/30 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100" title="Remove stage" aria-label="Remove stage">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add new stage */}
        <div className="px-5 py-3 border-t border-border bg-surface/30">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-accent shrink-0" />
            <input
              type="text"
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddStage()}
              placeholder="Add a new stage..."
              className="flex-1 text-sm bg-transparent text-foreground outline-none placeholder:text-muted"
            />
            {newStageName.trim() && (
              <button onClick={handleAddStage} className="px-3 py-1 text-xs font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors">Add</button>
            )}
          </div>
        </div>
      </div>

      {/* Stage templates */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Quick Templates</h3>
          <p className="text-xs text-muted mt-0.5">Start from a common pipeline template.</p>
        </div>
        <div className="p-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { name: "B2B Sales", desc: "Classic 6-stage funnel", stages: [
              { label: "Lead", color: "text-blue-700", bgColor: "bg-blue-100" },
              { label: "Qualified", color: "text-purple-700", bgColor: "bg-purple-100" },
              { label: "Proposal", color: "text-amber-700", bgColor: "bg-amber-100" },
              { label: "Negotiation", color: "text-orange-700", bgColor: "bg-orange-100" },
              { label: "Closed Won", color: "text-emerald-700", bgColor: "bg-emerald-100" },
              { label: "Closed Lost", color: "text-red-700", bgColor: "bg-red-100" },
            ]},
            { name: "SaaS Pipeline", desc: "Product-led growth", stages: [
              { label: "Awareness", color: "text-blue-700", bgColor: "bg-blue-100" },
              { label: "Interest", color: "text-cyan-700", bgColor: "bg-cyan-100" },
              { label: "Demo", color: "text-purple-700", bgColor: "bg-purple-100" },
              { label: "Trial", color: "text-amber-700", bgColor: "bg-amber-100" },
              { label: "Negotiation", color: "text-orange-700", bgColor: "bg-orange-100" },
              { label: "Closed Won", color: "text-emerald-700", bgColor: "bg-emerald-100" },
              { label: "Closed Lost", color: "text-red-700", bgColor: "bg-red-100" },
            ]},
            { name: "Simple 3-Stage", desc: "Minimal pipeline", stages: [
              { label: "New", color: "text-blue-700", bgColor: "bg-blue-100" },
              { label: "In Progress", color: "text-amber-700", bgColor: "bg-amber-100" },
              { label: "Won", color: "text-emerald-700", bgColor: "bg-emerald-100" },
              { label: "Lost", color: "text-red-700", bgColor: "bg-red-100" },
            ]},
            { name: "Real Estate", desc: "Property sales flow", stages: [
              { label: "Inquiry", color: "text-blue-700", bgColor: "bg-blue-100" },
              { label: "Viewing", color: "text-purple-700", bgColor: "bg-purple-100" },
              { label: "Offer", color: "text-amber-700", bgColor: "bg-amber-100" },
              { label: "Under Contract", color: "text-orange-700", bgColor: "bg-orange-100" },
              { label: "Closed Won", color: "text-emerald-700", bgColor: "bg-emerald-100" },
              { label: "Closed Lost", color: "text-red-700", bgColor: "bg-red-100" },
            ]},
            { name: "Consulting", desc: "Service engagement", stages: [
              { label: "Discovery", color: "text-blue-700", bgColor: "bg-blue-100" },
              { label: "Scoping", color: "text-purple-700", bgColor: "bg-purple-100" },
              { label: "Proposal", color: "text-amber-700", bgColor: "bg-amber-100" },
              { label: "SOW Review", color: "text-orange-700", bgColor: "bg-orange-100" },
              { label: "Engaged", color: "text-emerald-700", bgColor: "bg-emerald-100" },
            ]},
            { name: "Recruiting", desc: "Hiring pipeline", stages: [
              { label: "Applied", color: "text-blue-700", bgColor: "bg-blue-100" },
              { label: "Phone Screen", color: "text-cyan-700", bgColor: "bg-cyan-100" },
              { label: "Interview", color: "text-purple-700", bgColor: "bg-purple-100" },
              { label: "Technical", color: "text-indigo-700", bgColor: "bg-indigo-100" },
              { label: "Offer", color: "text-amber-700", bgColor: "bg-amber-100" },
              { label: "Hired", color: "text-emerald-700", bgColor: "bg-emerald-100" },
              { label: "Rejected", color: "text-red-700", bgColor: "bg-red-100" },
              { label: "Withdrawn", color: "text-orange-700", bgColor: "bg-orange-100" },
            ]},
          ].map((template) => (
            <button
              key={template.name}
              onClick={() => { setEditingStages(template.stages); setPipelineDirty(true); }}
              className="text-left rounded-lg border border-border p-3 hover:border-accent/50 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-medium text-foreground">{template.name}</div>
                <span className="text-[10px] text-muted">{template.stages.length} stages</span>
              </div>
              <p className="text-[11px] text-muted mb-2">{template.desc}</p>
              <div className="flex flex-wrap gap-1">
                {template.stages.map((s, i) => (
                  <span key={i} className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${s.bgColor} ${s.color}`}>{s.label}</span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Reassignment modal */}
      {showReassignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowReassignModal(false)} />
          <div className="relative bg-white rounded-xl border border-border shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-base font-semibold text-foreground">Reassign Contacts</h3>
              <p className="text-sm text-muted mt-1">The following stages are being removed and have contacts assigned. Choose where to move them.</p>
            </div>
            <div className="p-5 space-y-4">
              {removedStages.map((oldStage) => {
                const count = contacts.filter((c) => c.stage === oldStage).length;
                const oldStageInfo = pipelineStages.find((s) => s.label === oldStage);
                return (
                  <div key={oldStage} className="rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {oldStageInfo && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${oldStageInfo.bgColor} ${oldStageInfo.color}`}>{oldStage}</span>
                        )}
                        <span className="text-xs text-red-600 font-medium">Removing</span>
                      </div>
                      <span className="text-xs text-muted">{count} contact{count !== 1 ? "s" : ""} affected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted shrink-0">Move to:</span>
                      <select
                        value={reassignments[oldStage] || ""}
                        onChange={(e) => setReassignments((prev) => ({ ...prev, [oldStage]: e.target.value }))}
                        className="flex-1 text-sm bg-white border border-border rounded-lg px-3 py-1.5 text-foreground outline-none focus:ring-1 focus:ring-accent cursor-pointer"
                      >
                        {editingStages.map((s) => (
                          <option key={s.label} value={s.label}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-5 py-4 border-t border-border bg-surface/30 flex items-center justify-end gap-2">
              <button onClick={() => setShowReassignModal(false)} className="px-4 py-2 text-sm font-medium text-muted border border-border hover:bg-surface rounded-lg transition-colors">Cancel</button>
              <button onClick={handleConfirmReassignment} className="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors">Confirm &amp; Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
