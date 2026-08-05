"use client";

import { useEffect } from "react";

type FeedbackTone = "success" | "error" | "warning";

interface AdminFeedbackToastProps {
  success?: string | null;
  error?: string | null;
  warning?: string | null;
  onDismiss?: () => void;
}

function resolveFeedback(
  success?: string | null,
  error?: string | null,
  warning?: string | null,
): { message: string; tone: FeedbackTone } | null {
  if (error) {
    return { message: error, tone: "error" };
  }
  if (warning) {
    return { message: warning, tone: "warning" };
  }
  if (success) {
    return { message: success, tone: "success" };
  }
  return null;
}

const TONE_STYLES: Record<FeedbackTone, string> = {
  success: "border-emerald-300 bg-emerald-50 text-emerald-950 shadow-emerald-900/10",
  error: "border-red-300 bg-red-50 text-red-800 shadow-red-900/10",
  warning: "border-amber-300 bg-amber-50 text-amber-950 shadow-amber-900/10",
};

export function AdminFeedbackToast({
  success,
  error,
  warning,
  onDismiss,
}: AdminFeedbackToastProps) {
  const feedback = resolveFeedback(success, error, warning);

  useEffect(() => {
    if (!feedback || !onDismiss) {
      return;
    }

    const timer = window.setTimeout(() => {
      onDismiss();
    }, 12000);

    return () => window.clearTimeout(timer);
  }, [feedback, onDismiss]);

  if (!feedback) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-5 left-5 z-[70] w-[min(100vw-2.5rem,28rem)] rounded-2xl border px-4 py-3 text-sm shadow-xl ${TONE_STYLES[feedback.tone]}`}
    >
      <div className="flex items-start gap-3">
        <p className="flex-1 whitespace-pre-line leading-relaxed">{feedback.message}</p>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold opacity-70 transition hover:bg-black/5 hover:opacity-100"
          >
            Kapat
          </button>
        ) : null}
      </div>
    </div>
  );
}
