"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";

export function AdminParentsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = query.trim();
    if (trimmed) {
      params.set("q", trimmed);
    } else {
      params.delete("q");
    }
    const qs = params.toString();
    router.push(qs ? `/admin/parents?${qs}` : "/admin/parents");
  }

  function handleReset() {
    setQuery("");
    router.push("/admin/parents");
  }

  const phoneFilter = searchParams.get("phone");

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-border-surface bg-surface-section p-4 sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <Input
          label="Ara"
          placeholder="Veli adı, e-posta veya telefon"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit">Filtrele</Button>
        <Button type="button" variant="outline" onClick={handleReset}>
          Temizle
        </Button>
        {phoneFilter ? (
          <span className="inline-flex items-center rounded-full bg-surface-tint-mixed px-3 py-1.5 text-xs font-semibold text-navy-900">
            Telefon filtresi: {phoneFilter === "missing" ? "eksik" : "dolu"}
          </span>
        ) : null}
      </div>
    </form>
  );
}
