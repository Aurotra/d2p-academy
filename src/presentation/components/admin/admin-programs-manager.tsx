"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

import type { ProgramDefinition } from "@/core/domain/program";
import { formatProgramDuration } from "@/shared/utils/program-duration";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";

type ProgramFormState = {
  programCode: string;
  name: string;
  durationWeeks: string;
  durationHours: string;
  isActive: boolean;
};

const emptyForm: ProgramFormState = {
  programCode: "",
  name: "",
  durationWeeks: "",
  durationHours: "",
  isActive: true,
};

function programToForm(program: ProgramDefinition): ProgramFormState {
  return {
    programCode: program.programCode,
    name: program.name,
    durationWeeks: program.durationWeeks?.toString() ?? "",
    durationHours: program.durationHours?.toString() ?? "",
    isActive: program.isActive,
  };
}

function buildPayload(form: ProgramFormState) {
  return {
    programCode: form.programCode.trim().toUpperCase(),
    name: form.name.trim(),
    durationWeeks: form.durationWeeks ? Number(form.durationWeeks) : null,
    durationHours: form.durationHours ? Number(form.durationHours) : null,
    isActive: form.isActive,
  };
}

export function AdminProgramsManager() {
  const [programs, setPrograms] = useState<ProgramDefinition[]>([]);
  const [createForm, setCreateForm] = useState<ProgramFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ProgramFormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadPrograms = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/admin/programs");
      const payload = (await response.json()) as {
        data?: { programs: ProgramDefinition[] };
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Programlar alınamadı.");
      }

      setPrograms(payload.data?.programs ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Yükleme hatası.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPrograms();
  }, [loadPrograms]);

  const programsMissingDuration = useMemo(
    () =>
      programs.filter(
        (program) =>
          program.isActive &&
          program.durationWeeks == null &&
          program.durationHours == null,
      ),
    [programs],
  );

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/admin/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(createForm)),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Program oluşturulamadı.");
      }

      setCreateForm(emptyForm);
      await loadPrograms();
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
      const response = await fetch(`/api/v1/admin/programs/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(editForm)),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Program güncellenemedi.");
      }

      setEditingId(null);
      setEditForm(null);
      await loadPrograms();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Güncelleme hatası.");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeProgram(id: string) {
    if (!window.confirm("Bu programı silmek istediğinize emin misiniz?")) return;

    setError(null);
    const response = await fetch(`/api/v1/admin/programs/${id}`, { method: "DELETE" });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(payload.error ?? "Silme başarısız.");
      return;
    }

    if (editingId === id) {
      setEditingId(null);
      setEditForm(null);
    }

    await loadPrograms();
  }

  function renderFormFields(
    form: ProgramFormState,
    setForm: (next: ProgramFormState) => void,
    idPrefix: string,
    codeDisabled = false,
  ) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          id={`${idPrefix}-code`}
          label="Program kodu"
          value={form.programCode}
          onChange={(event) => setForm({ ...form, programCode: event.target.value.toUpperCase() })}
          maxLength={4}
          disabled={codeDisabled}
          required
        />
        <Input
          id={`${idPrefix}-name`}
          label="Program adı"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          required
        />
        <Input
          id={`${idPrefix}-weeks`}
          label="Süre (hafta)"
          type="number"
          min={0}
          step={0.5}
          value={form.durationWeeks}
          onChange={(event) => setForm({ ...form, durationWeeks: event.target.value })}
          placeholder="ör. 2 veya 1.5"
        />
        <Input
          id={`${idPrefix}-hours`}
          label="Süre (saat, bilgi amaçlı)"
          type="number"
          min={0}
          step={0.5}
          value={form.durationHours}
          onChange={(event) => setForm({ ...form, durationHours: event.target.value })}
          placeholder="ör. 16"
        />
        <label className="flex items-center gap-2 text-sm text-navy-900 md:col-span-2">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
          />
          Aktif (talep formunda göster)
        </label>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Program Tanımları</h1>
        <p className="mt-1 text-sm text-slate-600">
          Kurs talep formunda gösterilecek program sürelerini buradan yönetin.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      {programsMissingDuration.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
          <p className="font-semibold">Süre bilgisi eksik programlar</p>
          <p className="mt-1 leading-6 text-amber-900/90">
            {programsMissingDuration.length} aktif programda hafta veya saat süresi girilmemiş (
            {programsMissingDuration.map((program) => program.programCode).join(", ")}). Veli kurs
            talebi formunda bu programlar için otomatik bitiş tarihi önerisi çalışmaz.
          </p>
        </div>
      ) : null}

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-navy-950">Yeni program</h2>
        <form onSubmit={(event) => void handleCreate(event)} className="mt-6 space-y-4">
          {renderFormFields(createForm, setCreateForm, "create")}
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Kaydediliyor..." : "Program Ekle"}
          </Button>
        </form>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-navy-950">Program listesi</h2>
        {isLoading ? (
          <p className="mt-4 text-sm text-slate-600">Yükleniyor...</p>
        ) : programs.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">Henüz program tanımı yok.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {programs.map((program) => {
              const isEditing = editingId === program.id && editForm;

              return (
                <div key={program.id} className="rounded-2xl border border-slate-100 p-4">
                  {isEditing ? (
                    <form onSubmit={(event) => void handleUpdate(event)} className="space-y-4">
                      {renderFormFields(editForm, (next) => setEditForm(next), `edit-${program.id}`, true)}
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
                          <Badge tone="cyan">{program.programCode}</Badge>
                          <Badge tone={program.isActive ? "neutral" : "navy"}>
                            {program.isActive ? "Aktif" : "Pasif"}
                          </Badge>
                        </div>
                        <h3 className="mt-2 font-semibold text-navy-950">{program.name}</h3>
                        <p className="mt-1 text-sm text-slate-600">
                          Süre: {formatProgramDuration(program) ?? "Henüz girilmedi"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="primary"
                          onClick={() => {
                            setEditingId(program.id);
                            setEditForm(programToForm(program));
                          }}
                        >
                          Düzenle
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => void removeProgram(program.id)}
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
