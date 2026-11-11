"use client";

import { useMemo, useRef, useState } from "react";

import type { DifficultyLevel, Product, ProductCategory } from "@/core/domain/store";
import { isKitActivated } from "@/lib/store/activation";
import {
  STORE_CATEGORY_LABELS,
  STORE_DIFFICULTY_LEVELS,
} from "@/shared/constants/store-products";
import { BRAND_SURFACE_CARD } from "@/shared/constants/brand-surfaces";
import { ActivationModal } from "@/presentation/components/store/activation-modal";
import { ProductCard } from "@/presentation/components/store/product-card";
import { useActivatedKits } from "@/presentation/components/store/use-activated-kits";

type CategoryFilter = "all" | ProductCategory;
type DifficultyFilter = "all" | DifficultyLevel;

const CATEGORY_TABS: Array<{ id: CategoryFilter; label: string }> = [
  { id: "all", label: "Tümü" },
  { id: "education-kit", label: STORE_CATEGORY_LABELS["education-kit"] },
  { id: "ready-device", label: STORE_CATEGORY_LABELS["ready-device"] },
  { id: "3d-design-part", label: STORE_CATEGORY_LABELS["3d-design-part"] },
  { id: "electronics", label: STORE_CATEGORY_LABELS.electronics },
  { id: "bundle", label: STORE_CATEGORY_LABELS.bundle },
];

interface StoreCatalogProps {
  products: readonly Product[];
}

export function StoreCatalog({ products }: StoreCatalogProps) {
  const { kits, hydrated } = useActivatedKits();
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const activateButtonRef = useRef<HTMLButtonElement>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("tr-TR");
    return products.filter((product) => {
      if (category !== "all" && product.category !== category) {
        return false;
      }
      if (difficulty !== "all" && product.specs.difficulty !== difficulty) {
        return false;
      }
      if (!needle) {
        return true;
      }
      const haystack = `${product.title} ${product.subtitle} ${product.description}`.toLocaleLowerCase(
        "tr-TR",
      );
      return haystack.includes(needle);
    });
  }, [products, category, difficulty, query]);

  function resetFilters() {
    setCategory("all");
    setDifficulty("all");
    setQuery("");
  }

  return (
    <div>
      <div className={`${BRAND_SURFACE_CARD} p-5 sm:p-6`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-document-primary">
              Mağaza
            </p>
            <h1 className="mt-2 text-3xl font-black text-navy-950 sm:text-4xl">
              Eğitim kitleri ve 3D tasarım parçaları
            </h1>
            <p className="mt-3 text-base leading-7 text-muted">
              Fiziksel kiti temin edin, kutu üzerindeki kodu etkinleştirin, dijital müfredatla
              adım adım inşa edin.
            </p>
          </div>
          <button
            ref={activateButtonRef}
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-navy-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-navy-900"
          >
            Kit Kodu Etkinleştir
          </button>
        </div>

        <ol className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { step: "1", title: "Kiti temin et", body: "Mağazadan uygun eğitim setini seçin." },
            {
              step: "2",
              title: "Kodu etkinleştir",
              body: "Kutu kartındaki D2P kodunu buradan girin.",
            },
            {
              step: "3",
              title: "İnşa et & takip et",
              body: "Müfredat adımlarını işaretleyerek ilerleyin.",
            },
          ].map((item) => (
            <li
              key={item.step}
              className="rounded-2xl border border-border-surface bg-surface-base px-4 py-4"
            >
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">
                Adım {item.step}
              </p>
              <p className="mt-1 text-sm font-bold text-navy-950">{item.title}</p>
              <p className="mt-1 text-sm text-muted">{item.body}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-8 space-y-4">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Ürün kategorileri">
          {CATEGORY_TABS.map((tab) => {
            const selected = category === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setCategory(tab.id)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  selected
                    ? "border-document-primary bg-document-primary text-white"
                    : "border-border-surface bg-white text-navy-900 hover:border-secondary/40"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="sr-only" htmlFor="store-search">
            Ürün ara
          </label>
          <input
            id="store-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ürün, alt başlık veya açıklamada ara…"
            className="w-full rounded-xl border border-border-surface bg-white px-4 py-3 text-sm text-navy-950 outline-none ring-secondary/30 focus:ring-2 sm:max-w-md"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDifficulty("all")}
              className={`rounded-full border px-3 py-2 text-xs font-semibold ${
                difficulty === "all"
                  ? "border-navy-950 bg-navy-950 text-white"
                  : "border-border-surface bg-white text-navy-900"
              }`}
            >
              Tüm zorluklar
            </button>
            {STORE_DIFFICULTY_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setDifficulty(level)}
                className={`rounded-full border px-3 py-2 text-xs font-semibold ${
                  difficulty === level
                    ? "border-navy-950 bg-navy-950 text-white"
                    : "border-border-surface bg-white text-navy-900"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className={`mt-10 ${BRAND_SURFACE_CARD} px-6 py-16 text-center`}>
          <p className="text-lg font-bold text-navy-950">Eşleşen ürün bulunamadı</p>
          <p className="mt-2 text-sm text-muted">
            Arama ve filtre kombinasyonunu daralttınız. Filtreleri sıfırlayıp yeniden deneyin.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-5 inline-flex rounded-full bg-document-primary px-5 py-2.5 text-sm font-bold text-white"
          >
            Filtreleri Sıfırla
          </button>
        </div>
      ) : (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product) => (
            <li key={product.id}>
              <ProductCard
                product={product}
                isActivated={
                  hydrated && isKitActivated(product.slug, kits)
                }
              />
            </li>
          ))}
        </ul>
      )}

      <ActivationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        returnFocusRef={activateButtonRef}
      />
    </div>
  );
}
