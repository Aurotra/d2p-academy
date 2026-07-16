"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import type { GalleryAlbum, GalleryPhoto } from "@/core/domain/gallery";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/create-browser-client";
import { SupabaseGalleryRepository } from "@/infrastructure/repositories/supabase-gallery-repository";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(
    new Date(`${value}T12:00:00`),
  );
}

export function AdminGalleryManager() {
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState("");
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [locationName, setLocationName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [description, setDescription] = useState("");

  const loadAlbums = useCallback(async () => {
    const client = createSupabaseBrowserClient();
    if (!client) {
      setError("Supabase bağlantısı kurulamadı.");
      setIsLoading(false);
      return;
    }

    try {
      const repository = new SupabaseGalleryRepository(client);
      const items = await repository.listAllAlbums();
      setAlbums(items);
      setSelectedAlbumId((current) => {
        if (current && items.some((album) => album.id === current)) {
          return current;
        }
        return items[0]?.id ?? "";
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Albümler yüklenemedi.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadPhotos = useCallback(async (albumId: string) => {
    if (!albumId) {
      setPhotos([]);
      return;
    }

    const client = createSupabaseBrowserClient();
    if (!client) return;

    try {
      const repository = new SupabaseGalleryRepository(client);
      setPhotos(await repository.listPhotos(albumId));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Fotoğraflar yüklenemedi.");
    }
  }, []);

  useEffect(() => {
    void loadAlbums();
  }, [loadAlbums]);

  useEffect(() => {
    if (selectedAlbumId) {
      void loadPhotos(selectedAlbumId);
    }
  }, [selectedAlbumId, loadPhotos]);

  async function handleCreateAlbum(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!title.trim()) {
      setError("Albüm başlığı zorunludur.");
      return;
    }

    const client = createSupabaseBrowserClient();
    if (!client) {
      setError("Supabase bağlantısı kurulamadı.");
      return;
    }

    setIsSaving(true);
    try {
      const repository = new SupabaseGalleryRepository(client);
      const album = await repository.createAlbum({
        title: title.trim(),
        locationName: locationName.trim() || null,
        eventDate: eventDate || null,
        description: description.trim(),
        isPublished: true,
      });

      setTitle("");
      setLocationName("");
      setEventDate("");
      setDescription("");
      setSelectedAlbumId(album.id);
      setSuccess(`Albüm oluşturuldu: ${album.title}`);
      await loadAlbums();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Albüm oluşturulamadı.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUploadPhotos(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedAlbumId) {
      setError("Önce bir albüm seçin veya oluşturun.");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const files = formData.getAll("files").filter((item): item is File => item instanceof File && item.size > 0);

    if (files.length === 0) {
      setError("Lütfen en az bir fotoğraf seçin.");
      return;
    }

    const client = createSupabaseBrowserClient();
    if (!client) {
      setError("Supabase bağlantısı kurulamadı.");
      return;
    }

    setIsSaving(true);
    try {
      const repository = new SupabaseGalleryRepository(client);
      let uploaded = 0;

      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          continue;
        }

        const storagePath = `${selectedAlbumId}/${Date.now()}-${sanitizeFileName(file.name)}`;
        const { error: uploadError } = await client.storage.from("gallery").upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        const { data: publicUrlData } = client.storage.from("gallery").getPublicUrl(storagePath);
        await repository.addPhoto({
          albumId: selectedAlbumId,
          imageUrl: publicUrlData.publicUrl,
        });
        uploaded += 1;
      }

      form.reset();
      setSuccess(`${uploaded} fotoğraf yüklendi.`);
      await loadAlbums();
      await loadPhotos(selectedAlbumId);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Yükleme başarısız.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeletePhoto(photoId: string) {
    if (!window.confirm("Bu fotoğrafı silmek istediğinize emin misiniz?")) return;

    const client = createSupabaseBrowserClient();
    if (!client) return;

    setIsSaving(true);
    setError(null);
    try {
      await new SupabaseGalleryRepository(client).deletePhoto(photoId);
      await loadPhotos(selectedAlbumId);
      await loadAlbums();
      setSuccess("Fotoğraf silindi.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Silinemedi.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleTogglePublish(album: GalleryAlbum) {
    const client = createSupabaseBrowserClient();
    if (!client) return;

    setIsSaving(true);
    setError(null);
    try {
      await new SupabaseGalleryRepository(client).setPublished(album.id, !album.isPublished);
      await loadAlbums();
      setSuccess(album.isPublished ? "Albüm gizlendi." : "Albüm yayınlandı.");
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Güncellenemedi.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteAlbum(album: GalleryAlbum) {
    if (!window.confirm(`“${album.title}” albümünü ve tüm fotoğraflarını silmek istediğinize emin misiniz?`)) {
      return;
    }

    const client = createSupabaseBrowserClient();
    if (!client) return;

    setIsSaving(true);
    setError(null);
    try {
      await new SupabaseGalleryRepository(client).deleteAlbum(album.id);
      if (selectedAlbumId === album.id) {
        setSelectedAlbumId("");
        setPhotos([]);
      }
      await loadAlbums();
      setSuccess("Albüm silindi.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Albüm silinemedi.");
    } finally {
      setIsSaving(false);
    }
  }

  const selectedAlbum = albums.find((album) => album.id === selectedAlbumId) ?? null;

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
          Galeri
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Eğitim Fotoğrafları</h1>
        <p className="mt-2 text-sm text-slate-600">
          Albüm oluştururken <strong>tarih</strong> girin; sitede otomatik olarak{" "}
          <strong>2026 Eğitimlerimiz</strong> gibi yıl başlıklarının altında birikir. Honaz, Muğla
          vb. her eğitim ayrı albüm olabilir. Yayınlananlar{" "}
          <Link href="/galeri" className="font-semibold text-document-primary underline">
            /galeri
          </Link>{" "}
          sayfasında görünür.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </p>
      ) : null}

      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Yeni albüm</h2>
        <form onSubmit={handleCreateAlbum} className="mt-4 grid gap-4 md:grid-cols-2">
          <Input
            label="Başlık"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Örn: Honaz 3D Atölyesi"
            required
          />
          <Input
            label="Yer"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="Örn: Honaz"
          />
          <Input
            label="Tarih"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
          <Input
            label="Kısa açıklama"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="İsteğe bağlı"
          />
          <div className="md:col-span-2">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Kaydediliyor..." : "Albüm Oluştur"}
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Fotoğraf yükle</h2>
        {isLoading ? (
          <p className="mt-4 text-sm text-slate-600">Yükleniyor...</p>
        ) : albums.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">Önce bir albüm oluşturun.</p>
        ) : (
          <form onSubmit={handleUploadPhotos} className="mt-4 space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Albüm
              <select
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                value={selectedAlbumId}
                onChange={(e) => setSelectedAlbumId(e.target.value)}
              >
                {albums.map((album) => (
                  <option key={album.id} value={album.id}>
                    {album.title}
                    {album.locationName ? ` · ${album.locationName}` : ""}
                    {album.isPublished ? "" : " (gizli)"}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Fotoğraflar (birden fazla seçebilirsiniz)
              <input
                name="files"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="mt-2 block w-full text-sm"
              />
            </label>
            <Button type="submit" disabled={isSaving || !selectedAlbumId}>
              {isSaving ? "Yükleniyor..." : "Fotoğrafları Yükle"}
            </Button>
          </form>
        )}
      </div>

      {selectedAlbum ? (
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{selectedAlbum.title}</h2>
              <p className="text-sm text-slate-600">
                {[selectedAlbum.locationName, formatDate(selectedAlbum.eventDate)]
                  .filter((part) => part && part !== "—")
                  .join(" · ")}{" "}
                · {photos.length} fotoğraf
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={isSaving}
                onClick={() => void handleTogglePublish(selectedAlbum)}
              >
                {selectedAlbum.isPublished ? "Gizle" : "Yayınla"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={isSaving}
                onClick={() => void handleDeleteAlbum(selectedAlbum)}
              >
                Albümü Sil
              </Button>
              <Link
                href={`/galeri/${selectedAlbum.slug}`}
                className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold text-document-primary underline"
              >
                Sitede gör
              </Link>
            </div>
          </div>

          {photos.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">Bu albümde fotoğraf yok.</p>
          ) : (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {photos.map((photo) => (
                <li key={photo.id} className="overflow-hidden rounded-2xl border border-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.imageUrl} alt="" className="aspect-[4/3] w-full object-cover" />
                  <div className="p-3">
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={isSaving}
                      onClick={() => void handleDeletePhoto(photo.id)}
                      className="text-xs"
                    >
                      Sil
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
