"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import type { Product } from "@/core/domain/store";
import {
  activateCode,
  curriculumProgressPercent,
  getCompletedSteps,
  isKitActivated,
  TEST_ACTIVATION_CODES,
  toggleCurriculumStep,
  type ActivationResult,
} from "@/lib/store/activation";
import { getStoreProductBySlug } from "@/shared/constants/store-products";
import { curriculumTypeLabel } from "@/presentation/components/store/store-labels";

type ModalPhase = "form" | "tracker";

interface ActivationModalProps {
  open: boolean;
  onClose: () => void;
  preferredSlug?: string;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}

export function ActivationModal({
  open,
  onClose,
  preferredSlug,
  returnFocusRef,
}: ActivationModalProps) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [phase, setPhase] = useState<ModalPhase>("form");
  const [trackedProduct, setTrackedProduct] = useState<Product | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [bundleNotice, setBundleNotice] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setCode("");
    setError(null);
    setInfo(null);
    setBundleNotice(false);

    if (preferredSlug) {
      const product = getStoreProductBySlug(preferredSlug);
      if (product?.educationIntegration.hasDigitalCourse && isKitActivated(preferredSlug)) {
        setTrackedProduct(product);
        setCompletedSteps(getCompletedSteps(preferredSlug));
        setPhase("tracker");
        setInfo("Bu kit daha önce etkinleştirildi, kaldığınız yerden devam edebilirsiniz.");
        return;
      }
    }

    setPhase("form");
    setTrackedProduct(null);
    setCompletedSteps([]);
  }, [open, preferredSlug]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    const focusReturnTarget = returnFocusRef?.current ?? null;
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      focusReturnTarget?.focus();
    };
  }, [open, onClose, returnFocusRef]);

  if (!open) {
    return null;
  }

  function applySuccess(result: Extract<ActivationResult, { ok: true }>) {
    const product = getStoreProductBySlug(result.primarySlug);
    if (!product) {
      setError("Ürün kaydı bulunamadı.");
      return;
    }

    setTrackedProduct(product);
    setCompletedSteps(getCompletedSteps(result.primarySlug));
    setPhase("tracker");
    setBundleNotice(result.unlockedBundleChildren);
    setError(null);
    setInfo(
      result.alreadyActivated
        ? "Bu kit daha önce etkinleştirildi, kaldığınız yerden devam edebilirsiniz."
        : "Kit başarıyla etkinleştirildi. Müfredat takibini başlatabilirsiniz.",
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = activateCode(code);
    if (!result.ok) {
      setError(result.error);
      setInfo(null);
      return;
    }
    applySuccess(result);
  }

  function handleToggleStep(step: number) {
    if (!trackedProduct) {
      return;
    }
    const updated = toggleCurriculumStep(
      trackedProduct.slug,
      step,
      trackedProduct.educationIntegration.curriculumPreview.length,
    );
    if (updated) {
      setCompletedSteps(updated.completedSteps);
    }
  }

  const progress = trackedProduct
    ? curriculumProgressPercent(trackedProduct, completedSteps)
    : 0;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-navy-950/50 backdrop-blur-[2px]"
        aria-label="Modali kapat"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[81] max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[1.5rem] border border-border-surface bg-white p-5 shadow-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
              Kit aktivasyonu
            </p>
            <h2 id={titleId} className="mt-1 text-xl font-black text-navy-950">
              {phase === "form" ? "Kit kodunu etkinleştir" : "Süreç izleme paneli"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border-surface px-3 py-1 text-sm font-semibold text-navy-900 hover:bg-surface-section"
          >
            Kapat
          </button>
        </div>

        {phase === "form" ? (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <label className="block text-sm font-semibold text-navy-950" htmlFor="activation-code">
              Aktivasyon kodu
            </label>
            <input
              ref={inputRef}
              id="activation-code"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="D2P-XXXX-XXXX"
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-xl border border-border-surface bg-surface-base px-4 py-3 font-mono text-sm tracking-wide text-navy-950 outline-none ring-secondary/30 focus:ring-2"
            />
            <p className="text-xs text-muted">
              Test kodları:{" "}
              {TEST_ACTIVATION_CODES.map((testCode, index) => (
                <span key={testCode}>
                  {index > 0 ? " | " : null}
                  <button
                    type="button"
                    className="font-semibold text-document-primary underline-offset-2 hover:underline"
                    onClick={() => {
                      setCode(testCode);
                      setError(null);
                      inputRef.current?.focus();
                    }}
                  >
                    {testCode}
                  </button>
                </span>
              ))}
            </p>
            {error ? (
              <p role="alert" aria-live="polite" className="rounded-xl bg-primary/10 px-3 py-2 text-sm text-primary">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-bold text-white transition hover:brightness-105"
            >
              Kodu doğrula
            </button>
          </form>
        ) : trackedProduct ? (
          <div className="mt-5 space-y-5">
            {info ? (
              <p aria-live="polite" className="rounded-xl bg-secondary/10 px-3 py-2 text-sm text-secondary">
                {info}
              </p>
            ) : null}
            {bundleNotice ? (
              <p className="rounded-xl bg-accent/20 px-3 py-2 text-sm text-accent-dark">
                Tam Donanım Seti ile birlikte Radar ve Robotik Kıskaç eğitimleriniz de açıldı!
              </p>
            ) : null}

            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-navy-950">{trackedProduct.title}</p>
                <span className="text-sm font-bold text-document-primary">%{progress}</span>
              </div>
              <div
                className="mt-2 h-2 overflow-hidden rounded-full bg-surface-section"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-document-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <ul className="space-y-2">
              {trackedProduct.educationIntegration.curriculumPreview.map((step) => {
                const done = completedSteps.includes(step.step);
                return (
                  <li key={step.step}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border-surface bg-surface-base px-3 py-3">
                      <input
                        type="checkbox"
                        checked={done}
                        onChange={() => handleToggleStep(step.step)}
                        className="mt-1 h-4 w-4 accent-document-primary"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-navy-950">
                          {step.step}. {step.title}
                        </span>
                        <span className="mt-1 block text-xs text-muted">
                          {curriculumTypeLabel(step.type)} · {step.duration}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>

            <Link
              href={`/magaza/${trackedProduct.slug}`}
              onClick={onClose}
              className="inline-flex w-full items-center justify-center rounded-full border border-border-surface bg-white px-5 py-3 text-sm font-bold text-navy-950 transition hover:border-secondary/40 hover:bg-surface-tint-green/40"
            >
              Ürün sayfasına git →
            </Link>
            <button
              type="button"
              onClick={() => {
                setPhase("form");
                setTrackedProduct(null);
                setInfo(null);
                setBundleNotice(false);
                setError(null);
                window.setTimeout(() => inputRef.current?.focus(), 0);
              }}
              className="w-full text-center text-sm font-semibold text-document-primary hover:underline"
            >
              Başka bir kod gir
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
