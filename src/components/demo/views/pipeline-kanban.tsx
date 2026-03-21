"use client";

import { useState, type DragEvent } from "react";
import { formatCurrency, type Contact, type StageDefinition } from "../data";

interface PipelineKanbanProps {
  contacts: Contact[];
  stages: StageDefinition[];
  onSelectContact: (id: string) => void;
  onUpdateContact?: (id: string, updates: Partial<Contact>) => void;
}

export default function PipelineKanban({ contacts, stages, onSelectContact, onUpdateContact }: PipelineKanbanProps) {
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  function handleDragStart(e: DragEvent, contactId: string) {
    e.dataTransfer.setData("text/plain", contactId);
    setDraggedId(contactId);
  }

  function handleDragOver(e: DragEvent, stageLabel: string) {
    e.preventDefault();
    setDragOverStage(stageLabel);
  }

  function handleDragLeave() {
    setDragOverStage(null);
  }

  function handleDrop(e: DragEvent, stageLabel: string) {
    e.preventDefault();
    const contactId = e.dataTransfer.getData("text/plain");
    if (contactId && onUpdateContact) {
      onUpdateContact(contactId, { stage: stageLabel as Contact["stage"] });
    }
    setDragOverStage(null);
    setDraggedId(null);
  }

  // Filter out "Lost" stage
  const activeStages = stages.filter(s => !s.label.toLowerCase().includes("lost"));

  return (
    <div className="p-4 lg:p-6 max-w-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Pipeline Board</h2>
          <p className="text-sm text-muted mt-0.5">Drag deals between stages</p>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none" style={{ minHeight: "calc(100vh - 200px)" }}>
        {activeStages.map(stage => {
          const stageContacts = contacts.filter(c => c.stage === stage.label);
          const stageValue = stageContacts.reduce((a, c) => a + c.value, 0);
          const isOver = dragOverStage === stage.label;

          return (
            <div
              key={stage.label}
              className={`flex-shrink-0 w-72 flex flex-col rounded-xl border transition-colors ${
                isOver ? "border-accent bg-accent/5" : "border-border bg-surface/50"
              }`}
              onDragOver={(e) => handleDragOver(e, stage.label)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.label)}
            >
              {/* Column header */}
              <div className="p-3 border-b border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${stage.bgColor} ${stage.color}`}>
                    {stage.label}
                  </span>
                  <span className="text-xs text-muted">{stageContacts.length}</span>
                </div>
                <div className="text-sm font-semibold text-foreground tabular-nums">
                  {formatCurrency(stageValue)}
                </div>
              </div>

              {/* Cards */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                {stageContacts.map(contact => (
                  <div
                    key={contact.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, contact.id)}
                    onClick={() => onSelectContact(contact.id)}
                    className={`bg-white rounded-lg border border-border p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${
                      draggedId === contact.id ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-7 h-7 rounded-full ${contact.avatarColor} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                        {contact.avatar}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-foreground truncate">{contact.name}</div>
                        <div className="text-xs text-muted truncate">{contact.company}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(contact.value)}</span>
                      <span className="text-[10px] text-muted">{contact.owner}</span>
                    </div>
                    {contact.tags.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {contact.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="px-1.5 py-0.5 rounded text-[9px] bg-gray-100 text-gray-600">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {stageContacts.length === 0 && (
                  <div className="text-center py-8 text-xs text-muted">No deals</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
