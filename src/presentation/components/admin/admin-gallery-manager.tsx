"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";

import type { GalleryAlbum, GalleryPhoto } from "@/core/domain/gallery";
import { optimizeGalleryImage } from "@/lib/gallery/optimize-image";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/create-browser-client";
import { SupabaseGalleryRepository } from "@/infrastructure/repositories/supabase-gallery-repository";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";

interface UploadItem {
  id: string;
  name: string;
  progress: number;
  status: "queued" | "optimizing" | "uploading" | "done" | "error";
  error?: string;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(
    new Date(`${value}T12:00:00`),
  );
}

function reorderIds(ids: string[], fromId: string, toId: string): string[] {
  const next = [...ids];
  const from = next.indexOf(fromId);
  const to = next.indexOf(toId);
  if (from < 0 || to < 0 || from === to) return ids;
  next.splice(from, 1);
  next.splice(to, 0, fromId);
  return next;
}

export function AdminGalleryManager() {
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [deletedAlbums, setDeletedAlbums] = useState<GalleryAlbum[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState("");
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [deletedPhotos, setDeletedPhotos] = useState<GalleryPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [dragAlbumId, setDragAlbumId] = useState<string | null>(null);
  const [dragPhotoId, setDragPhotoId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [locationName, setLocationName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [description, setDescription] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadingRef = useRef(false);

  const isUploading = uploads.some(
    (item) => item.status === "queued" || item.status === "optimizing" || item.status === "uploading",
  );

  useEffect(() => {
    uploadingRef.current = isUploading;
  }, [isUploading]);

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (!uploadingRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  const loadAlbums = useCallback(async () => {
    const client = createSupabaseBrowserClient();
    if (!client) {
      setError("Supabase bağlantısı kurulamadı.");
      setIsLoading(false);
      return;
    }

    try {
      const repository = new SupabaseGalleryRepository(client);
      const [active, all] = await Promise.all([
        repository.listAllAlbums(false),
        repository.listAllAlbums(true),
      ]);
      setAlbums(active);
      setDeletedAlbums(all.filter((album) => album.deletedAt));
      setSelectedAlbumId((current) => {
        if (current && active.some((album) => album.id === current)) return current;
        return active[0]?.id ?? "";
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
      setDeletedPhotos([]);
      return;
    }

    const client = createSupabaseBrowserClient();
    if (!client) return;

    try {
      const repository = new SupabaseGalleryRepository(client);
      const all = await repository.listPhotos(albumId, true);
      const active = all.filter((photo) => !photo.deletedAt);
      const removed = all.filter((photo) => photo.deletedAt);
      setPhotos(await signAdminPhotos(client, active));
      setDeletedPhotos(removed);
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

  async function uploadFiles(files: File[]) {
    if (!selectedAlbumId) {
      setError("Önce bir albüm seçin veya oluşturun.");
      return;
    }

    const client = createSupabaseBrowserClient();
    if (!client) {
      setError("Supabase bağlantısı kurulamadı.");
      return;
    }

    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      setError("Lütfen en az bir görsel seçin.");
      return;
    }

    setError(null);
    setSuccess(null);

    const queue: UploadItem[] = imageFiles.map((file, index) => ({
      id: `${Date.now()}-${index}-${file.name}`,
      name: file.name,
      progress: 0,
      status: "queued",
    }));
    setUploads(queue);

    const repository = new SupabaseGalleryRepository(client);
    let uploaded = 0;

    for (let index = 0; index < imageFiles.length; index += 1) {
      const file = imageFiles[index];
      const itemId = queue[index].id;

      setUploads((current) =>
        current.map((item) =>
          item.id === itemId ? { ...item, status: "optimizing", progress: 15 } : item,
        ),
      );

      try {
        const optimized = await optimizeGalleryImage(file);
        setUploads((current) =>
          current.map((item) =>
            item.id === itemId ? { ...item, status: "uploading", progress: 40 } : item,
          ),
        );

        const displayPath = `${selectedAlbumId}/${optimized.display.name}`;
        const thumbPath = `${selectedAlbumId}/thumbs/${optimized.thumb.name}`;

        const { error: displayError } = await client.storage
          .from("gallery")
          .upload(displayPath, optimized.display, {
            contentType: "image/webp",
            upsert: false,
            cacheControl: "31536000",
          });
        if (displayError) throw new Error(displayError.message);

        setUploads((current) =>
          current.map((item) => (item.id === itemId ? { ...item, progress: 70 } : item)),
        );

        const { error: thumbError } = await client.storage
          .from("gallery")
          .upload(thumbPath, optimized.thumb, {
            contentType: "image/webp",
            upsert: false,
            cacheControl: "31536000",
          });
        if (thumbError) throw new Error(thumbError.message);

        const { data: displaySigned } = await client.storage
          .from("gallery")
          .createSignedUrl(displayPath, 60 * 60);
        const { data: thumbSigned } = await client.storage
          .from("gallery")
          .createSignedUrl(thumbPath, 60 * 60);

        await repository.addPhoto({
          albumId: selectedAlbumId,
          storagePath: displayPath,
          thumbStoragePath: thumbPath,
          imageUrl: displaySigned?.signedUrl ?? displayPath,
          thumbUrl: thumbSigned?.signedUrl ?? thumbPath,
          altText: file.name.replace(/\.[^.]+$/, "").replaceAll("_", " "),
        });

        uploaded += 1;
        setUploads((current) =>
          current.map((item) =>
            item.id === itemId ? { ...item, status: "done", progress: 100 } : item,
          ),
        );
      } catch (uploadError) {
        const message = uploadError instanceof Error ? uploadError.message : "Yükleme hatası";
        setUploads((current) =>
          current.map((item) =>
            item.id === itemId ? { ...item, status: "error", error: message, progress: 100 } : item,
          ),
        );
      }
    }

    setSuccess(`${uploaded} fotoğraf optimize edilip yüklendi.`);
    await loadAlbums();
    await loadPhotos(selectedAlbumId);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleAlbumDrop(targetId: string) {
    if (!dragAlbumId || dragAlbumId === targetId) return;
    const nextIds = reorderIds(
      albums.map((album) => album.id),
      dragAlbumId,
      targetId,
    );
    setAlbums((current) =>
      nextIds
        .map((id) => current.find((album) => album.id === id))
        .filter((album): album is GalleryAlbum => Boolean(album)),
    );
    setDragAlbumId(null);

    const client = createSupabaseBrowserClient();
    if (!client) return;
    try {
      await new SupabaseGalleryRepository(client).reorderAlbums(nextIds);
      setSuccess("Albüm sırası kaydedildi.");
    } catch (reorderError) {
      setError(reorderError instanceof Error ? reorderError.message : "Sıra kaydedilemedi.");
      await loadAlbums();
    }
  }

  async function handlePhotoDrop(targetId: string) {
    if (!dragPhotoId || dragPhotoId === targetId || !selectedAlbumId) return;
    const nextIds = reorderIds(
      photos.map((photo) => photo.id),
      dragPhotoId,
      targetId,
    );
    setPhotos((current) =>
      nextIds
        .map((id) => current.find((photo) => photo.id === id))
        .filter((photo): photo is GalleryPhoto => Boolean(photo)),
    );
    setDragPhotoId(null);

    const client = createSupabaseBrowserClient();
    if (!client) return;
    try {
      await new SupabaseGalleryRepository(client).reorderPhotos(selectedAlbumId, nextIds);
      setSuccess("Fotoğraf sırası kaydedildi.");
    } catch (reorderError) {
      setError(reorderError instanceof Error ? reorderError.message : "Sıra kaydedilemedi.");
      await loadPhotos(selectedAlbumId);
    }
  }

  async function handleSetCover(photoId: string) {
    if (!selectedAlbumId) return;
    const client = createSupabaseBrowserClient();
    if (!client) return;
    setIsSaving(true);
    try {
      await new SupabaseGalleryRepository(client).setCoverPhoto(selectedAlbumId, photoId);
      await loadAlbums();
      setSuccess("Kapak fotoğrafı güncellendi.");
    } catch (coverError) {
      setError(coverError instanceof Error ? coverError.message : "Kapak ayarlanamadı.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSoftDeletePhoto(photoId: string) {
    if (!window.confirm("Fotoğraf çöp kutusuna alınsın mı? 30 gün içinde geri alabilirsiniz.")) {
      return;
    }
    const client = createSupabaseBrowserClient();
    if (!client) return;
    setIsSaving(true);
    try {
      await new SupabaseGalleryRepository(client).softDeletePhoto(photoId);
      await loadPhotos(selectedAlbumId);
      await loadAlbums();
      setSuccess("Fotoğraf çöp kutusuna taşındı.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Silinemedi.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRestorePhoto(photoId: string) {
    const client = createSupabaseBrowserClient();
    if (!client) return;
    setIsSaving(true);
    try {
      await new SupabaseGalleryRepository(client).restorePhoto(photoId);
      await loadPhotos(selectedAlbumId);
      await loadAlbums();
      setSuccess("Fotoğraf geri alındı.");
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : "Geri alınamadı.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSoftDeleteAlbum(album: GalleryAlbum) {
    if (
      !window.confirm(
        `“${album.title}” albümü çöp kutusuna alınsın mı? 30 gün içinde geri alabilirsiniz.`,
      )
    ) {
      return;
    }
    const client = createSupabaseBrowserClient();
    if (!client) return;
    setIsSaving(true);
    try {
      await new SupabaseGalleryRepository(client).softDeleteAlbum(album.id);
      if (selectedAlbumId === album.id) {
        setSelectedAlbumId("");
        setPhotos([]);
      }
      await loadAlbums();
      setSuccess("Albüm çöp kutusuna taşındı.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Albüm silinemedi.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRestoreAlbum(albumId: string) {
    const client = createSupabaseBrowserClient();
    if (!client) return;
    setIsSaving(true);
    try {
      await new SupabaseGalleryRepository(client).restoreAlbum(albumId);
      await loadAlbums();
      setSuccess("Albüm geri alındı.");
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : "Geri alınamadı.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleTogglePublish(album: GalleryAlbum) {
    const client = createSupabaseBrowserClient();
    if (!client) return;
    setIsSaving(true);
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

  async function handleAltTextSave(photo: GalleryPhoto, altText: string) {
    const client = createSupabaseBrowserClient();
    if (!client) return;
    try {
      await new SupabaseGalleryRepository(client).updatePhotoMeta(photo.id, { altText });
      setPhotos((current) =>
        current.map((item) => (item.id === photo.id ? { ...item, altText } : item)),
      );
    } catch (metaError) {
      setError(metaError instanceof Error ? metaError.message : "Alt text kaydedilemedi.");
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
          Yüklenen görseller otomatik WebP’ye küçültülür (max 1920px + 400px thumbnail). Albüm /
          fotoğraf sırası sürükle-bırak ile değişir. Silinenler 30 gün geri alınabilir. Site:{" "}
          <Link href="/galeri" className="font-semibold text-document-primary underline">
            /galeri
          </Link>
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
            <Button type="submit" disabled={isSaving || isUploading}>
              Albüm Oluştur
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Albüm sırası</h2>
        <p className="mt-1 text-sm text-slate-500">Sürükleyerek sıralayın (üsttekiler sitede önce).</p>
        {isLoading ? (
          <p className="mt-4 text-sm text-slate-600">Yükleniyor...</p>
        ) : albums.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">Henüz albüm yok.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {albums.map((album) => (
              <li
                key={album.id}
                draggable
                onDragStart={() => setDragAlbumId(album.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => void handleAlbumDrop(album.id)}
                className={`flex cursor-grab items-center justify-between rounded-xl border px-4 py-3 ${
                  selectedAlbumId === album.id
                    ? "border-sky-300 bg-sky-50"
                    : "border-slate-100 bg-slate-50"
                }`}
              >
                <button
                  type="button"
                  className="text-left"
                  onClick={() => setSelectedAlbumId(album.id)}
                >
                  <p className="font-semibold text-slate-900">{album.title}</p>
                  <p className="text-xs text-slate-500">
                    {[album.locationName, formatDate(album.eventDate)].filter(Boolean).join(" · ")} ·{" "}
                    {album.photoCount} fotoğraf
                    {album.isPublished ? "" : " · gizli"}
                  </p>
                </button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isSaving}
                    onClick={() => void handleTogglePublish(album)}
                    className="text-xs"
                  >
                    {album.isPublished ? "Gizle" : "Yayınla"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isSaving}
                    onClick={() => void handleSoftDeleteAlbum(album)}
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

      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Fotoğraf yükle</h2>
        {!selectedAlbum ? (
          <p className="mt-4 text-sm text-slate-600">Önce bir albüm seçin.</p>
        ) : (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-slate-600">
              Seçili albüm: <strong>{selectedAlbum.title}</strong>
            </p>
            <div
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDraggingFiles(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setIsDraggingFiles(false)}
              onDrop={(event: DragEvent<HTMLDivElement>) => {
                event.preventDefault();
                setIsDraggingFiles(false);
                const files = Array.from(event.dataTransfer.files);
                void uploadFiles(files);
              }}
              className={`rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
                isDraggingFiles
                  ? "border-sky-400 bg-sky-50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <p className="text-sm font-medium text-slate-700">
                Fotoğrafları buraya sürükleyin veya seçin
              </p>
              <p className="mt-1 text-xs text-slate-500">
                JPG/PNG/WebP · otomatik 1920px WebP + 400px thumbnail
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="mt-4 block w-full text-sm"
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []);
                  void uploadFiles(files);
                }}
              />
            </div>

            {uploads.length > 0 ? (
              <ul className="space-y-2">
                {uploads.map((item) => (
                  <li key={item.id} className="rounded-xl border border-slate-100 px-3 py-2">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate font-medium text-slate-700">{item.name}</span>
                      <span className="text-slate-500">
                        {item.status === "optimizing"
                          ? "Optimize…"
                          : item.status === "uploading"
                            ? "Yükleniyor…"
                            : item.status === "done"
                              ? "Tamam"
                              : item.status === "error"
                                ? "Hata"
                                : "Sırada"}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full transition-all ${
                          item.status === "error" ? "bg-red-400" : "bg-sky-500"
                        }`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    {item.error ? <p className="mt-1 text-xs text-red-600">{item.error}</p> : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </div>

      {selectedAlbum ? (
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{selectedAlbum.title}</h2>
              <p className="text-sm text-slate-600">
                Sürükleyerek sıralayın · Kapak seçin · Alt text ekleyin
              </p>
            </div>
            <Link
              href={`/galeri/${selectedAlbum.slug}`}
              className="text-sm font-semibold text-document-primary underline"
            >
              Sitede gör
            </Link>
          </div>

          {photos.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">Bu albümde fotoğraf yok.</p>
          ) : (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {photos.map((photo) => (
                <li
                  key={photo.id}
                  draggable
                  onDragStart={() => setDragPhotoId(photo.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => void handlePhotoDrop(photo.id)}
                  className="cursor-grab overflow-hidden rounded-2xl border border-slate-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.thumbUrl || photo.imageUrl}
                    alt={photo.altText || photo.caption || ""}
                    className="aspect-[4/3] w-full object-cover"
                  />
                  <div className="space-y-2 p-3">
                    {selectedAlbum.coverPhotoId === photo.id ? (
                      <p className="text-xs font-bold text-sky-700">Kapak fotoğrafı</p>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={isSaving}
                        onClick={() => void handleSetCover(photo.id)}
                        className="text-xs"
                      >
                        Kapak Yap
                      </Button>
                    )}
                    <label className="block text-xs font-semibold text-slate-600">
                      Alt text
                      <input
                        defaultValue={photo.altText}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                        onBlur={(event) => {
                          const value = event.target.value.trim();
                          if (value !== photo.altText) {
                            void handleAltTextSave(photo, value);
                          }
                        }}
                      />
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={isSaving}
                      onClick={() => void handleSoftDeletePhoto(photo.id)}
                      className="text-xs"
                    >
                      Çöp kutusuna
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {deletedPhotos.length > 0 ? (
            <div className="mt-8 border-t border-slate-100 pt-6">
              <h3 className="text-sm font-bold text-slate-800">Çöp kutusu (fotoğraflar)</h3>
              <ul className="mt-3 space-y-2">
                {deletedPhotos.map((photo) => (
                  <li
                    key={photo.id}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"
                  >
                    <span className="truncate text-slate-600">{photo.altText || photo.id}</span>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={isSaving}
                      onClick={() => void handleRestorePhoto(photo.id)}
                      className="text-xs"
                    >
                      Geri al
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {deletedAlbums.length > 0 ? (
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Çöp kutusu (albümler)</h2>
          <ul className="mt-4 space-y-2">
            {deletedAlbums.map((album) => (
              <li
                key={album.id}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-slate-800">{album.title}</p>
                  <p className="text-xs text-slate-500">30 gün içinde kalıcı silinebilir</p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isSaving}
                  onClick={() => void handleRestoreAlbum(album.id)}
                >
                  Geri al
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

async function signAdminPhotos(
  client: NonNullable<ReturnType<typeof createSupabaseBrowserClient>>,
  photos: GalleryPhoto[],
): Promise<GalleryPhoto[]> {
  return Promise.all(
    photos.map(async (photo) => {
      let imageUrl = photo.imageUrl;
      let thumbUrl = photo.thumbUrl;

      if (photo.storagePath) {
        const { data } = await client.storage
          .from("gallery")
          .createSignedUrl(photo.storagePath, 60 * 60);
        if (data?.signedUrl) imageUrl = data.signedUrl;
      }
      if (photo.thumbStoragePath) {
        const { data } = await client.storage
          .from("gallery")
          .createSignedUrl(photo.thumbStoragePath, 60 * 60);
        if (data?.signedUrl) thumbUrl = data.signedUrl;
      }

      return { ...photo, imageUrl, thumbUrl: thumbUrl || imageUrl };
    }),
  );
}
