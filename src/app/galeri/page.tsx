import Link from "next/link";

import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { SupabaseGalleryRepository } from "@/infrastructure/repositories/supabase-gallery-repository";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Galeri",
  description: "D2P Academy eğitim ve atölye fotoğrafları. Honaz ve diğer programlardan kareler.",
};

function formatEventDate(value: string | null): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeZone: "Europe/Istanbul",
  }).format(new Date(`${value}T12:00:00`));
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
            Galeri
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
            Eğitimlerden kareler
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Atölyelerimizde çekilen fotoğraflar. Honaz ve diğer programlardan anılar burada.
          </p>
        </div>

        {albums.length === 0 ? (
          <div className="mt-12 rounded-[2rem] border border-dashed border-slate-200 bg-white px-6 py-16 text-center text-slate-500">
            Henüz yayınlanmış albüm yok. Çok yakında eğitim fotoğrafları burada olacak.
          </div>
        ) : (
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((album) => {
              const dateLabel = formatEventDate(album.eventDate);
              return (
                <li key={album.id}>
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
                      <h2 className="text-lg font-bold text-slate-900 group-hover:text-sky-800">
                        {album.title}
                      </h2>
                      <p className="mt-2 text-sm text-slate-600">
                        {[album.locationName, dateLabel].filter(Boolean).join(" · ") ||
                          `${album.photoCount} fotoğraf`}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-sky-700">
                        {album.photoCount} fotoğraf →
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
