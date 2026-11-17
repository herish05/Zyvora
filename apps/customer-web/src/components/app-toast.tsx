"use client";

import { useEffect, useRef, useState } from "react";

type ToastTone = "success" | "info" | "warning";

type ToastState = {
  id: number;
  message: string;
  tone: ToastTone;
  visible: boolean;
  actionLabel?: string;
  onAction?: () => void;
} | null;

type ShowToastOptions = {
  tone?: ToastTone;
  actionLabel?: string;
  onAction?: () => void;
};

const toneClassMap: Record<ToastTone, string> = {
  success: "border-[#2f7a4f] bg-[#edf8f1] text-[#1e5a39]",
  info: "border-[#1f5f74] bg-[#ebf6fb] text-[#154a5b]",
  warning: "border-[#9a4f06] bg-[#fff3e4] text-[#7a3f05]"
};

export const useAppToast = (durationMs = 1800) => {
  const [toast, setToast] = useState<ToastState>(null);
  const hideTimeoutRef = useRef<number | null>(null);
  const removeTimeoutRef = useRef<number | null>(null);

  const clearTimers = () => {
    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    if (removeTimeoutRef.current) {
      window.clearTimeout(removeTimeoutRef.current);
      removeTimeoutRef.current = null;
    }
  };

  const hideToast = () => {
    clearTimers();
    setToast((current) => {
      if (!current) {
        return null;
      }
      return { ...current, visible: false };
    });

    removeTimeoutRef.current = window.setTimeout(() => {
      setToast(null);
      removeTimeoutRef.current = null;
    }, 220);
  };

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  const showToast = (message: string, options: ShowToastOptions = {}) => {
    clearTimers();

    const nextId = Date.now();
    setToast({
      id: nextId,
      message,
      tone: options.tone ?? "info",
      visible: true,
      actionLabel: options.actionLabel,
      onAction: options.onAction
    });

    hideTimeoutRef.current = window.setTimeout(() => {
      setToast((current) => (current?.id === nextId ? { ...current, visible: false } : current));
      removeTimeoutRef.current = window.setTimeout(() => {
        setToast((current) => (current?.id === nextId ? null : current));
        removeTimeoutRef.current = null;
      }, 220);
      hideTimeoutRef.current = null;
    }, durationMs);
  };

  return { toast, showToast, hideToast };
};

export function AppToast({
  message,
  tone,
  visible,
  actionLabel,
  onAction,
  onClose
}: {
  message: string;
  tone: ToastTone;
  visible: boolean;
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
}) {
  const handleAction = () => {
    if (onAction) {
      onAction();
    }
    onClose();
  };

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 max-w-xs rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm transition-all duration-200 sm:max-w-sm ${
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <div className={`rounded-lg border px-3 py-2 text-sm ${toneClassMap[tone]}`}>
        <div className="flex items-start gap-2">
          <p className="leading-5">{message}</p>
          {actionLabel && onAction ? (
            <button
              type="button"
              onClick={handleAction}
              className="ml-1 rounded-md border border-current px-2 py-0.5 text-xs font-medium opacity-90 transition hover:opacity-100"
            >
              {actionLabel}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto text-xs opacity-70 transition hover:opacity-100"
            aria-label="Close toast"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
