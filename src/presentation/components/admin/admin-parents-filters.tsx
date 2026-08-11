"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";

const SEARCH_DEBOUNCE_MS = 300;

export function AdminParentsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const trimmed = query.trim();
    const current = (searchParams.get("q") ?? "").trim();

    if (trimmed === current) {
      return;
    }

    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (trimmed) {
        params.set("q", trimmed);
      } else {
        params.delete("q");
      }
      const qs = params.toString();
      router.replace(qs ? `/admin/parents?${qs}` : "/admin/parents");
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [query, router, searchParams]);

  function handleReset() {
    setQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    const qs = params.toString();
    router.push(qs ? `/admin/parents?${qs}` : "/admin/parents");
  }

  const phoneFilter = searchParams.get("phone");
  const activeQuery = (searchParams.get("q") ?? "").trim();

  return (
    <div className="rounded-2xl border border-border-surface bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input
            label="Veli adı ara"
            placeholder="Örn. Ayşe Yılmaz, çocuk adı veya telefon"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={handleReset} disabled={!query.trim()}>
            Aramayı temizle
          </Button>
          {activeQuery ? (
            <span className="inline-flex items-center rounded-full bg-surface-tint-mixed px-3 py-1.5 text-xs font-semibold text-navy-900">
              Arama: {activeQuery}
            </span>
          ) : null}
          {phoneFilter ? (
            <span className="inline-flex items-center rounded-full bg-surface-tint-mixed px-3 py-1.5 text-xs font-semibold text-navy-900">
              Telefon filtresi: {phoneFilter === "missing" ? "eksik" : "dolu"}
            </span>
          ) : null}
        </div>
      </div>
      <p className="mt-3 text-xs text-subtle">
        Liste en son kayıt olan veliden başlayarak sıralanır. Yazdıkça arama otomatik güncellenir.
      </p>
    </div>
  );
}
