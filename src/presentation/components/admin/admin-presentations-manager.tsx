"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

import type { PresentationWithAssignments } from "@/core/domain/presentation";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Textarea } from "@/presentation/components/ui/textarea";

type InstructorOption = { id: string; fullName: string; email: string };

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

export function AdminPresentationsManager() {
  const [items, setItems] = useState<PresentationWithAssignments[]>([]);
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedInstructors, setSelectedInstructors] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editInstructorIds, setEditInstructorIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [presentationsRes, instructorsRes] = await Promise.all([
        fetch("/api/v1/admin/presentations", { cache: "no-store" }),
        fetch("/api/v1/admin/instructors/options", { cache: "no-store" }),
      ]);
      const presentationsJson = (await presentationsRes.json()) as {
        data?: PresentationWithAssignments[];
        error?: string;
      };
      const instructorsJson = (await instructorsRes.json()) as {
        data?: InstructorOption[];
        error?: string;
      };
      if (!presentationsRes.ok) {
        throw new Error(presentationsJson.error ?? "Sunumlar yüklenemedi.");
      }
      if (!instructorsRes.ok) {
        throw new Error(instructorsJson.error ?? "Eğitmenler yüklenemedi.");
      }
      setItems(presentationsJson.data ?? []);
      setInstructors(instructorsJson.data ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Yükleme hatası");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function toggleInstructor(id: string, list: string[], setList: (next: string[]) => void) {
    setList(list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const rawFile = formData.get("file");

    try {
      formData.set("instructorIds", selectedInstructors.join(","));

      if (rawFile instanceof File && rawFile.size > 0) {
        const lower = rawFile.name.toLowerCase();
        const isPptx =
          lower.endsWith(".pptx") ||
          lower.endsWith(".ppt") ||
          rawFile.type.includes("presentation") ||
          rawFile.type.includes("powerpoint");

        if (isPptx) {
          formData.set("originalFileName", rawFile.name);
        }
        setProgress("Sunum kaydediliyor…");
      }

      const response = await fetch("/api/v1/admin/presentations", {
        method: "POST",
        body: formData,
      });
      const json = (await response.json()) as {
        error?: string;
        meta?: { message?: string };
      };
      if (!response.ok) {
        throw new Error(json.error ?? "Yükleme başarısız.");
      }

      form.reset();
      setSelectedInstructors([]);
      setSuccess(json.meta?.message ?? "Sunum yüklendi.");
      await load();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Yükleme hatası");
    } finally {
      setProgress(null);
      setSaving(false);
    }
  }

  function startEdit(item: PresentationWithAssignments) {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditDescription(item.description);
    setEditCategory(item.category);
    setEditInstructorIds(item.instructorIds);
    setSuccess(null);
    setError(null);
  }

  async function handleSaveEdit() {
    if (!editingId) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/admin/presentations/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          category: editCategory,
          instructorIds: editInstructorIds,
        }),
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(json.error ?? "Güncelleme başarısız.");
      }
      setEditingId(null);
      setSuccess("Sunum güncellendi.");
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Güncelleme hatası");
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePublish(item: PresentationWithAssignments) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/admin/presentations/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !item.isPublished }),
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(json.error ?? "Yayın durumu güncellenemedi.");
      }
      await load();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Güncelleme hatası");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: PresentationWithAssignments) {
    if (!window.confirm(`“${item.title}” sunumu silinsin mi?`)) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/admin/presentations/${item.id}`, { method: "DELETE" });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(json.error ?? "Silinemedi.");
      }
      setSuccess("Sunum silindi.");
      await load();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Silme hatası");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[1.75rem] border border-border-surface bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
          Yeni sunum
        </p>
        <h2 className="mt-2 text-2xl font-bold text-navy-950">PowerPoint sunum yükle</h2>
        <p className="mt-2 text-sm text-muted">
          .pptx yükleyin. Eğitmen siteye girip indirmeden tarayıcıda tam ekran sunar. İsterseniz
          hazır PDF de yükleyebilirsiniz.
        </p>

        <form onSubmit={handleCreate} className="mt-6 grid gap-4">
          <Input name="title" placeholder="Sunum başlığı" required />
          <Input name="category" placeholder="Kategori / ders (ör. 3D Yazıcı)" />
          <Textarea name="description" placeholder="Kısa açıklama" rows={3} />
          <div>
            <label className="mb-2 block text-sm font-semibold text-navy-950">
              PowerPoint dosyası (.pptx)
            </label>
            <input
              name="file"
              type="file"
              accept=".pptx,.ppt,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/pdf,.pdf"
              required
              className="block w-full text-sm text-muted file:mr-4 file:rounded-xl file:border-0 file:bg-document-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-navy-950">Erişim verilecek eğitmenler</p>
            <div className="grid max-h-48 gap-2 overflow-y-auto rounded-2xl border border-border-surface p-3 sm:grid-cols-2">
              {instructors.length === 0 ? (
                <p className="text-sm text-subtle">Aktif eğitmen bulunamadı.</p>
              ) : (
                instructors.map((instructor) => (
                  <label
                    key={instructor.id}
                    className="flex cursor-pointer items-start gap-2 rounded-xl px-2 py-1.5 hover:bg-surface-section"
                  >
                    <input
                      type="checkbox"
                      checked={selectedInstructors.includes(instructor.id)}
                      onChange={() =>
                        toggleInstructor(instructor.id, selectedInstructors, setSelectedInstructors)
                      }
                      className="mt-1"
                    />
                    <span className="text-sm text-navy-950">
                      <span className="font-semibold">{instructor.fullName}</span>
                      <span className="block text-xs text-subtle">{instructor.email}</span>
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? progress || "Yükleniyor…" : "Sunumu Kaydet"}
          </Button>
          {progress ? <p className="text-sm font-medium text-document-primary">{progress}</p> : null}
        </form>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      ) : null}

      <section className="rounded-[1.75rem] border border-border-surface bg-white p-8 shadow-sm">
        <h2 className="text-xl font-bold text-navy-950">Yüklü sunumlar</h2>
        {loading ? (
          <p className="mt-4 text-sm text-muted">Yükleniyor…</p>
        ) : items.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Henüz sunum yok.</p>
        ) : (
          <ul className="mt-6 space-y-4">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border border-border-surface p-5"
              >
                {editingId === item.id ? (
                  <div className="grid gap-3">
                    <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                    <Input value={editCategory} onChange={(e) => setEditCategory(e.target.value)} />
                    <Textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={3}
                    />
                    <div className="grid max-h-40 gap-2 overflow-y-auto rounded-xl border border-border-surface p-3 sm:grid-cols-2">
                      {instructors.map((instructor) => (
                        <label key={instructor.id} className="flex items-start gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={editInstructorIds.includes(instructor.id)}
                            onChange={() =>
                              toggleInstructor(instructor.id, editInstructorIds, setEditInstructorIds)
                            }
                          />
                          {instructor.fullName}
                        </label>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" onClick={() => void handleSaveEdit()} disabled={saving}>
                        Kaydet
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setEditingId(null)}>
                        Vazgeç
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-lg font-bold text-navy-950">{item.title}</p>
                      <p className="mt-1 text-sm text-muted">
                        {[item.category || null, `${item.pageCount || "?"} slayt`, formatDate(item.updatedAt)]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {item.description ? (
                        <p className="mt-2 text-sm text-subtle">{item.description}</p>
                      ) : null}
                      <p className="mt-2 text-xs text-subtle">
                        Eğitmenler:{" "}
                        {item.assignments.length > 0
                          ? item.assignments
                              .map((a) => a.instructorName || a.instructorEmail || a.instructorId)
                              .join(", ")
                          : "Atanmamış"}
                        {item.isPublished ? "" : " · gizli"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" onClick={() => startEdit(item)}>
                        Düzenle
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void handleTogglePublish(item)}
                        disabled={saving}
                      >
                        {item.isPublished ? "Gizle" : "Yayınla"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void handleDelete(item)}
                        disabled={saving}
                      >
                        Sil
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
