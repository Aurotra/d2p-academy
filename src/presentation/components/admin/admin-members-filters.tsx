"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Select } from "@/presentation/components/ui/select";

export function AdminMembersFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [role, setRole] = useState(searchParams.get("role") ?? "all");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    const trimmed = query.trim();
    if (trimmed) {
      params.set("q", trimmed);
    }
    if (role !== "all") {
      params.set("role", role);
    }
    const qs = params.toString();
    router.push(qs ? `/admin/members?${qs}` : "/admin/members");
  }

  function handleReset() {
    setQuery("");
    setRole("all");
    router.push("/admin/members");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <Input
          label="Ara"
          placeholder="Ad, soyad veya e-posta"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className="sm:w-48">
        <Select label="Tür" value={role} onChange={(event) => setRole(event.target.value)}>
          <option value="all">Tümü</option>
          <option value="parent">Veliler</option>
          <option value="student">Üye öğrenciler</option>
        </Select>
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
