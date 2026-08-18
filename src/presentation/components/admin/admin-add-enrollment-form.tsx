"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";

import { formatTryCentsDisplay } from "@/core/domain/payment";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Select } from "@/presentation/components/ui/select";

interface AdminAddEnrollmentFormProps {
  eventId: string;
  eventTitle: string;
  defaultPriceTryCents?: number | null;
}

type PaymentMethod = "none" | "havale";

function defaultAmountTry(cents: number | null | undefined): string {
  if (cents == null || cents <= 0) {
    return "";
  }
  return (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
}

export function AdminAddEnrollmentForm({
  eventId,
  eventTitle,
  defaultPriceTryCents = null,
}: AdminAddEnrollmentFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("none");
  const [amountTry, setAmountTry] = useState(() => defaultAmountTry(defaultPriceTryCents));
  const [receiptNo, setReceiptNo] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const havaleHint = useMemo(() => {
    if (defaultPriceTryCents != null && defaultPriceTryCents > 0) {
      return `Kurs ücreti ${formatTryCentsDisplay(defaultPriceTryCents)}. Farklı tutar geldiyse değiştirin.`;
    }
    return "Etkinlikte kart ücreti yok; gelen havalenin tutarını yazın.";
  }, [defaultPriceTryCents]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/v1/admin/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          query: query.trim(),
          paymentMethod,
          ...(paymentMethod === "havale"
            ? {
                amountTry: amountTry.trim(),
                receiptNo: receiptNo.trim() || undefined,
                note: note.trim() || undefined,
              }
            : {}),
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        data?: {
          student?: { full_name?: string };
          amountTryCents?: number;
          paymentMethod?: string;
        };
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Kayıt eklenemedi.");
      }

      const name = payload.data?.student?.full_name ?? query;
      if (payload.data?.paymentMethod === "havale" && payload.data.amountTryCents) {
        setSuccess(
          `${name} havale ile kaydedildi (${formatTryCentsDisplay(payload.data.amountTryCents)}).`,
        );
      } else {
        setSuccess(`${name} etkinliğe eklendi.`);
      }
      setQuery("");
      setReceiptNo("");
      setNote("");
      setAmountTry(defaultAmountTry(defaultPriceTryCents));
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "İşlem başarısız.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[1.25rem] border border-border-surface bg-surface-section/60 p-4 sm:p-5"
    >
      <p className="text-sm font-semibold text-navy-950">Öğrenci ekle — {eventTitle}</p>
      <p className="mt-1 text-xs text-muted">
        Kullanıcı adı (e-postasız çocuk) veya e-posta adresi ile ekleyin. Havale geldiyse önce
        bankayı kontrol edin, sonra burada işaretleyin.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Input
          label="Kullanıcı adı veya e-posta"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ayse_2015 veya ogrenci@okul.com"
          required
        />
        <Select
          id="enrollment-payment-method"
          label="Ödeme"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
        >
          <option value="none">Ödemesiz ekle</option>
          <option value="havale">Havale alındı</option>
        </Select>
      </div>
      {paymentMethod === "havale" ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Input
            label="Tutar (₺)"
            value={amountTry}
            onChange={(e) => setAmountTry(e.target.value)}
            inputMode="decimal"
            placeholder="150"
          />
          <Input
            label="Dekont no (opsiyonel)"
            value={receiptNo}
            onChange={(e) => setReceiptNo(e.target.value)}
            placeholder="Banka referansı"
          />
          <div className="sm:col-span-2">
            <Input
              label="Not (opsiyonel)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Gönderen adı, tarih…"
            />
            <p className="mt-1 text-xs text-muted">{havaleHint}</p>
          </div>
        </div>
      ) : null}
      <div className="mt-3">
        <Button type="submit" disabled={isSubmitting || !query.trim()}>
          {isSubmitting
            ? "Kaydediliyor..."
            : paymentMethod === "havale"
              ? "Havale ile kaydet"
              : "Kaydet"}
        </Button>
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      {success ? <p className="mt-2 text-sm text-emerald-700">{success}</p> : null}
    </form>
  );
}
