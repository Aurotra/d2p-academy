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
    const params = new URLSearchParams();
    const trimmed = query.trim();
    if (trimmed) {
      params.set("q", trimmed);
    }
    const qs = params.toString();
    router.push(qs ? `/admin/parents?${qs}` : "/admin/parents");
  }

  function handleReset() {
    setQuery("");
    router.push("/admin/parents");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <Input
          label="Ara"
          placeholder="Veli adı, e-posta veya telefon"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit">Filtrele</Button>
        <Button type="button" variant="outline" onClick={handleReset}>
          Temizle
        </Button>
      </div>
    </form>
  );
}
