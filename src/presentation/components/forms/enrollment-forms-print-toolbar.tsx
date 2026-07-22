"use client";

import { useEffect, useRef } from "react";

interface EnrollmentFormsPrintToolbarProps {
  pdfTitle: string;
}

export function EnrollmentFormsPrintToolbar({ pdfTitle }: EnrollmentFormsPrintToolbarProps) {
  const originalTitleRef = useRef<string | null>(null);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = pdfTitle;

    return () => {
      document.title = previousTitle;
    };
  }, [pdfTitle]);

  function handlePrint() {
    originalTitleRef.current = document.title;
    document.title = pdfTitle;

    const restoreTitle = () => {
      if (originalTitleRef.current !== null) {
        document.title = originalTitleRef.current;
        originalTitleRef.current = null;
      }
      window.removeEventListener("afterprint", restoreTitle);
    };

    window.addEventListener("afterprint", restoreTitle);
    window.print();
  }

  return (
    <div className="no-print flex flex-col gap-3 rounded-2xl border border-slate-300 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div>
        <p className="text-sm font-bold text-navy-950">Form çıktısı</p>
        <p className="mt-1 text-sm text-slate-600">
          Tanışma, Onaylar, Ön test ve Son test sonuçlarını tek dosyada alın. Yazdır penceresinde
          &quot;PDF olarak kaydet&quot; seçeneğini kullanın.
        </p>
        <p className="mt-2 text-xs font-semibold text-slate-500">
          Önerilen dosya adı: <span className="text-navy-950">{pdfTitle}.pdf</span>
        </p>
      </div>
      <button
        type="button"
        onClick={handlePrint}
        className="inline-flex shrink-0 items-center justify-center rounded-xl bg-navy-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-document-primary"
      >
        PDF / Yazdır
      </button>
    </div>
  );
}
