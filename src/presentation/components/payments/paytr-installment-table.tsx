"use client";

import Script from "next/script";

import "./paytr-installment-table.css";

interface PaytrInstallmentTableProps {
  scriptUrl: string;
  nonce?: string;
}

export function PaytrInstallmentTable({ scriptUrl, nonce }: PaytrInstallmentTableProps) {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-border-surface bg-white px-3 py-5">
      <p className="px-2 text-sm font-semibold text-navy-950">Kartlara göre taksit seçenekleri</p>
      <p className="mt-1 px-2 text-xs text-muted">
        Taksit, bankanızın ve kartınızın uygunluğuna göre ödeme formunda da çıkar.
      </p>
      <div id="paytr_taksit_tablosu" className="mt-3 min-h-[80px]" />
      <Script src={scriptUrl} strategy="afterInteractive" nonce={nonce} />
    </div>
  );
}
