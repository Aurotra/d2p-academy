"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { InstructorPresentationCard } from "@/core/domain/presentation";
import { Button } from "@/presentation/components/ui/button";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

export default function InstructorPresentationsPage() {
  const [items, setItems] = useState<InstructorPresentationCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const response = await fetch("/api/v1/instructor/presentations", { cache: "no-store" });
        const json = (await response.json()) as {
          data?: InstructorPresentationCard[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(json.error ?? "Sunumlar yüklenemedi.");
        }
        if (!cancelled) {
          setItems(json.data ?? []);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Yükleme hatası");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-secondary">
          Sunumlarım
        </p>
        <h1 className="mt-2 text-3xl font-bold text-navy-950">Atanan ders sunumları</h1>
        <p className="mt-2 text-sm text-muted">
          Sunumu başlattığınızda tarayıcı tam ekrana geçer. Dosya indirmeye gerek yoktur.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted">Yükleniyor…</p>
      ) : items.length === 0 ? (
        <div className="rounded-[1.75rem] border border-border-surface bg-white p-8 text-sm text-muted shadow-sm">
          Henüz size atanmış bir sunum yok. Admin panelinden atama yapıldığında burada görünür.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="flex flex-col overflow-hidden rounded-[1.5rem] border border-border-surface bg-white shadow-sm"
            >
              <div className="flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                <div className="rounded-2xl border border-white/70 bg-white/80 px-5 py-4 text-center shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-document-primary">
                    {item.fileName.toLowerCase().endsWith(".pptx") ||
                    item.fileName.toLowerCase().endsWith(".ppt")
                      ? "PPTX"
                      : "PDF"}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-navy-950">
                    {item.pageCount > 0 ? item.pageCount : "—"}
                  </p>
                  <p className="text-xs text-subtle">slayt</p>
                </div>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h2 className="text-lg font-bold text-navy-950">{item.title}</h2>
                <p className="mt-1 text-sm text-muted">
                  {[item.category || null, formatDate(item.updatedAt)].filter(Boolean).join(" · ")}
                </p>
                {item.description ? (
                  <p className="mt-2 line-clamp-3 text-sm text-subtle">{item.description}</p>
                ) : null}
                <div className="mt-auto pt-5">
                  <Link href={`/instructor/presentations/${item.id}`}>
                    <Button className="w-full">Sunumu Başlat</Button>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
