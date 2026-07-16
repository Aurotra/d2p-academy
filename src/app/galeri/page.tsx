import Link from "next/link";

import type { GalleryAlbum } from "@/core/domain/gallery";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { SupabaseGalleryRepository } from "@/infrastructure/repositories/supabase-gallery-repository";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Galeri",
  description:
    "D2P Academy eğitim fotoğrafları. 2026 ve sonraki yıllardaki atölyelerden kareler.",
};

function formatEventDate(value: string | null): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeZone: "Europe/Istanbul",
  }).format(new Date(`${value}T12:00:00`));
}

function albumYear(album: GalleryAlbum, fallbackYear: number): number {
  if (album.eventDate) {
    return Number(album.eventDate.slice(0, 4));
  }
  return fallbackYear;
}

function groupAlbumsByYear(albums: GalleryAlbum[]): Array<{ year: number; albums: GalleryAlbum[] }> {
  const fallbackYear = new Date().getFullYear();
  const byYear = new Map<number, GalleryAlbum[]>();

  for (const album of albums) {
    const year = albumYear(album, fallbackYear);
    const list = byYear.get(year) ?? [];
    list.push(album);
    byYear.set(year, list);
  }

  return Array.from(byYear.entries())
    .sort(([left], [right]) => right - left)
    .map(([year, yearAlbums]) => ({ year, albums: yearAlbums }));
}

function AlbumCard({ album }: { album: GalleryAlbum }) {
  const dateLabel = formatEventDate(album.eventDate);

  return (
    <Link
      href={`/galeri/${album.slug}`}
      className="group block overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:border-sky-300 hover:shadow-md"
    >
      <div className="aspect-[4/3] overflow-hidden bg-slate-100">
        {album.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={album.coverImageUrl}
            alt={album.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Kapak yok
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold text-slate-900 group-hover:text-sky-800">{album.title}</h3>
        <p className="mt-2 text-sm text-slate-600">
          {[album.locationName, dateLabel].filter(Boolean).join(" · ") ||
            `${album.photoCount} fotoğraf`}
        </p>
        <p className="mt-1 text-xs font-semibold text-sky-700">{album.photoCount} fotoğraf →</p>
      </div>
    </Link>
  );
}

export default async function GalleryPage() {
  const client = await createSupabaseServerClient();

  if (!client) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-slate-600">
        Galeri şu an yüklenemiyor.
      </div>
    );
  }

  const repository = new SupabaseGalleryRepository(client);
  const albums = await repository.listPublishedAlbums();
  const yearGroups = groupAlbumsByYear(albums);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
            Galeri
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
            Eğitimlerimizden kareler
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Atölyelerimizden seçilmiş kareler. Her eğitim kendi albümünde; yıllar geçtikçe arşiv
            burada büyür.
          </p>
        </div>

        {albums.length === 0 ? (
          <div className="mt-12 rounded-[2rem] border border-dashed border-slate-200 bg-white px-6 py-16 text-center text-slate-500">
            Henüz yayınlanmış albüm yok. Çok yakında eğitim fotoğrafları burada olacak.
          </div>
        ) : (
          <div className="mt-12 space-y-14">
            {yearGroups.map(({ year, albums: yearAlbums }) => (
              <section key={year} aria-labelledby={`year-${year}`}>
                <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-sky-100 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                      Yıl
                    </p>
                    <h2 id={`year-${year}`} className="mt-1 text-2xl font-bold text-slate-900">
                      {year} Eğitimlerimiz
                    </h2>
                  </div>
                  <p className="text-sm font-medium text-slate-500">
                    {yearAlbums.length} albüm ·{" "}
                    {yearAlbums.reduce((sum, album) => sum + album.photoCount, 0)} fotoğraf
                  </p>
                </div>
                <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {yearAlbums.map((album) => (
                    <li key={album.id}>
                      <AlbumCard album={album} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
