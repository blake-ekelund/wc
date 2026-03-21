"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Undo2 } from "lucide-react";

interface UndoToastProps {
  message: string;
  duration?: number; // ms, default 5000
  onUndo: () => void;
  onDismiss: () => void;
}

export default function UndoToast({ message, duration = 5000, onUndo, onDismiss }: UndoToastProps) {
  const [progress, setProgress] = useState(100);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = 50; // update every 50ms
    const decrement = (interval / duration) * 100;
    const timer = setInterval(() => {
      setProgress(p => {
        const next = p - decrement;
        if (next <= 0) {
          clearInterval(timer);
          setVisible(false);
          setTimeout(onDismiss, 300);
          return 0;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [duration, onDismiss]);

  const handleUndo = useCallback(() => {
    setVisible(false);
    onUndo();
  }, [onUndo]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-foreground text-background rounded-xl shadow-2xl px-4 py-3 flex items-center gap-3 min-w-[300px]">
        <span className="text-sm flex-1">{message}</span>
        <button
          onClick={handleUndo}
          className="flex items-center gap-1.5 text-sm font-medium text-accent-light hover:text-white transition-colors shrink-0"
        >
          <Undo2 className="w-3.5 h-3.5" />
          Undo
        </button>
        <button onClick={() => { setVisible(false); onDismiss(); }} className="text-muted hover:text-background transition-colors">
          <X className="w-4 h-4" />
        </button>
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 rounded-b-xl overflow-hidden">
          <div
            className="h-full bg-accent transition-all ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
