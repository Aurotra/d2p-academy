"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";

type CouponRow = {
  id: string;
  code: string;
  discountRate: number;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
};

type CouponFormState = {
  code: string;
  discountRate: string;
  maxUses: string;
  isActive: boolean;
  expiresAt: string;
};

const emptyForm: CouponFormState = {
  code: "",
  discountRate: "10",
  maxUses: "",
  isActive: true,
  expiresAt: "",
};

function toLocalDatetimeValue(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function couponToForm(coupon: CouponRow): CouponFormState {
  return {
    code: coupon.code,
    discountRate: String(coupon.discountRate),
    maxUses: coupon.maxUses != null ? String(coupon.maxUses) : "",
    isActive: coupon.isActive,
    expiresAt: toLocalDatetimeValue(coupon.expiresAt),
  };
}

function buildPayload(form: CouponFormState) {
  const expiresLocal = form.expiresAt.trim();
  return {
    code: form.code.trim().toUpperCase(),
    discountRate: Number(form.discountRate),
    maxUses: form.maxUses.trim() ? Number(form.maxUses) : null,
    isActive: form.isActive,
    expiresAt: expiresLocal ? new Date(expiresLocal).toISOString() : null,
  };
}

function formatDate(value: string | null): string {
  if (!value) return "Süresiz";
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

export function AdminCouponsManager() {
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [createForm, setCreateForm] = useState<CouponFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CouponFormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadCoupons = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/admin/coupons");
      const payload = (await response.json()) as {
        data?: { coupons: CouponRow[] };
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Kuponlar alınamadı.");
      }

      setCoupons(payload.data?.coupons ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Yükleme hatası.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCoupons();
  }, [loadCoupons]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(createForm)),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Kupon oluşturulamadı.");
      }

      setCreateForm(emptyForm);
      await loadCoupons();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Kayıt hatası.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId || !editForm) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/admin/coupons/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(editForm)),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Kupon güncellenemedi.");
      }

      setEditingId(null);
      setEditForm(null);
      await loadCoupons();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Güncelleme hatası.");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeCoupon(id: string) {
    if (!window.confirm("Bu kuponu silmek istediğinize emin misiniz?")) return;

    setError(null);
    const response = await fetch(`/api/v1/admin/coupons/${id}`, { method: "DELETE" });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(payload.error ?? "Silme başarısız.");
      return;
    }

    if (editingId === id) {
      setEditingId(null);
      setEditForm(null);
    }

    await loadCoupons();
  }

  function renderFormFields(
    form: CouponFormState,
    setForm: (next: CouponFormState) => void,
    idPrefix: string,
  ) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          id={`${idPrefix}-code`}
          label="İndirim kodu"
          value={form.code}
          onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })}
          placeholder="YAZ25"
          required
        />
        <Input
          id={`${idPrefix}-rate`}
          label="İndirim oranı (%)"
          type="number"
          min={0.01}
          max={100}
          step={0.01}
          value={form.discountRate}
          onChange={(event) => setForm({ ...form, discountRate: event.target.value })}
          required
        />
        <Input
          id={`${idPrefix}-max`}
          label="Maks. kullanım (boş = limitsiz)"
          type="number"
          min={1}
          step={1}
          value={form.maxUses}
          onChange={(event) => setForm({ ...form, maxUses: event.target.value })}
          placeholder="ör. 50"
        />
        <Input
          id={`${idPrefix}-expires`}
          label="Son kullanım (opsiyonel)"
          type="datetime-local"
          value={form.expiresAt}
          onChange={(event) => setForm({ ...form, expiresAt: event.target.value })}
        />
        <label className="flex items-center gap-2 text-sm text-navy-900 md:col-span-2">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
          />
          Aktif
        </label>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-950">İndirim Kodları</h1>
        <p className="mt-1 text-sm text-muted">
          Kartla ödemeli etkinliklerde kullanılacak kuponları yönetin. Sayaç yalnızca başarılı
          ödeme sonrası artar.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="rounded-[2rem] border border-border-surface bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-navy-950">Yeni kupon</h2>
        <form onSubmit={(event) => void handleCreate(event)} className="mt-6 space-y-4">
          {renderFormFields(createForm, setCreateForm, "create")}
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Kaydediliyor..." : "Kupon Ekle"}
          </Button>
        </form>
      </div>

      <div className="rounded-[2rem] border border-border-surface bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-navy-950">Kupon listesi</h2>
        {isLoading ? (
          <p className="mt-4 text-sm text-muted">Yükleniyor...</p>
        ) : coupons.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Henüz kupon yok.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {coupons.map((coupon) => {
              const isEditing = editingId === coupon.id && editForm;
              const remaining =
                coupon.maxUses != null
                  ? Math.max(0, coupon.maxUses - coupon.usedCount)
                  : null;

              return (
                <div key={coupon.id} className="rounded-2xl border border-border-surface p-4">
                  {isEditing ? (
                    <form onSubmit={(event) => void handleUpdate(event)} className="space-y-4">
                      {renderFormFields(editForm, (next) => setEditForm(next), `edit-${coupon.id}`)}
                      <div className="flex gap-2">
                        <Button type="submit" disabled={isSaving}>
                          Kaydet
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditingId(null);
                            setEditForm(null);
                          }}
                        >
                          İptal
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <Badge tone="cyan">{coupon.code}</Badge>
                          <Badge tone={coupon.isActive ? "neutral" : "navy"}>
                            {coupon.isActive ? "Aktif" : "Pasif"}
                          </Badge>
                          <Badge tone="neutral">%{coupon.discountRate}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted">
                          Kullanım: {coupon.usedCount}
                          {coupon.maxUses != null ? ` / ${coupon.maxUses}` : " (limitsiz)"}
                          {remaining != null ? ` · kalan ${remaining}` : null}
                        </p>
                        <p className="mt-1 text-sm text-muted">
                          Son tarih: {formatDate(coupon.expiresAt)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="primary"
                          onClick={() => {
                            setEditingId(coupon.id);
                            setEditForm(couponToForm(coupon));
                          }}
                        >
                          Düzenle
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => void removeCoupon(coupon.id)}
                        >
                          Sil
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
