"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";

import type { Product } from "@/core/domain/store";
import {
  curriculumProgressPercent,
  getCompletedSteps,
  isKitActivated,
  toggleCurriculumStep,
} from "@/lib/store/activation";
import { BRAND_SURFACE_CARD } from "@/shared/constants/brand-surfaces";
import { formatTryPrice } from "@/shared/utils/format-try";
import { ActivationModal } from "@/presentation/components/store/activation-modal";
import {
  curriculumTypeLabel,
  stockStatusClass,
  stockStatusLabel,
} from "@/presentation/components/store/store-labels";
import { useActivatedKits } from "@/presentation/components/store/use-activated-kits";

type DetailTab = "bom" | "curriculum" | "specs";

interface ProductDetailProps {
  product: Product;
}

function BomColumn({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className={`${BRAND_SURFACE_CARD} h-full p-5 ${items.length === 0 ? "opacity-70" : ""}`}>
      <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-navy-950">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Bu üründe yer almamaktadır.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item} className="text-sm leading-6 text-[var(--text-on-surface-soft)]">
              • {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ProductDetail({ product }: ProductDetailProps) {
  const { kits, hydrated } = useActivatedKits();
  const [tab, setTab] = useState<DetailTab>("bom");
  const [modalOpen, setModalOpen] = useState(false);
  const activateRef = useRef<HTMLButtonElement>(null);
  const tabsLabelId = useId();
  const image = product.images[0];
  const hasCourse = product.educationIntegration.hasDigitalCourse;
  const isReadyDevice = product.category === "ready-device";
  const kitComingSoon = product.educationIntegration.kitVersionStatus === "coming_soon";
  const productComingSoon = product.stockStatus === "coming_soon";
  const activated = hydrated && isKitActivated(product.slug, kits);
  const completedSteps = activated ? getCompletedSteps(product.slug, kits) : [];
  const progress = curriculumProgressPercent(product, completedSteps);

  function handleToggleStep(step: number) {
    toggleCurriculumStep(
      product.slug,
      step,
      product.educationIntegration.curriculumPreview.length,
    );
  }

  const hasCurriculum = product.educationIntegration.curriculumPreview.length > 0;
  const tabs: Array<{ id: DetailTab; label: string }> = [
    { id: "bom", label: "Kutu İçeriği" },
    ...(hasCurriculum ? [{ id: "curriculum" as const, label: "Eğitim Müfredatı" }] : []),
    { id: "specs", label: "Teknik Özellikler" },
  ];
  const highlights = product.highlights ?? [];

  return (
    <div>
      <nav aria-label="Sayfa yolu" className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="font-semibold text-document-primary hover:underline">
              Ana Sayfa
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/magaza" className="font-semibold text-document-primary hover:underline">
              Mağaza
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="font-medium text-navy-950">{product.title}</li>
        </ol>
      </nav>

      <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:items-start">
        <div>
          <div className={`${BRAND_SURFACE_CARD} overflow-hidden`}>
            <div className="aspect-[4/3] bg-surface-section">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image.src}
                  alt={image.alt}
                  className="h-full w-full object-contain p-4"
                  draggable={false}
                />
              ) : null}
            </div>
          </div>
        </div>

        <div>
          <div className="flex flex-wrap gap-2">
            {isReadyDevice ? (
              <span className="rounded-full border border-navy-950/20 bg-navy-950/5 px-3 py-1 text-xs font-semibold text-navy-950">
                Tak-Çalıştır Hazır Cihaz
              </span>
            ) : null}
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${stockStatusClass(product.stockStatus)}`}
            >
              {stockStatusLabel(product.stockStatus)}
            </span>
            {kitComingSoon ? (
              <span className="rounded-full border border-accent-dark/30 bg-accent/20 px-3 py-1 text-xs font-semibold text-accent-dark">
                DIY Eğitim Kiti yakında
              </span>
            ) : null}
          </div>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-navy-950 sm:text-4xl">
            {product.title}
          </h1>
          <p className="mt-2 text-lg font-semibold leading-snug text-document-primary sm:text-xl">
            {product.subtitle}
          </p>

          <div className="mt-5 flex flex-wrap items-end gap-3 border-y border-border-surface py-4">
            <p className="text-3xl font-black text-navy-950 sm:text-4xl">
              {productComingSoon ? "Yakında" : formatTryPrice(product.price)}
            </p>
            <p className="pb-1 text-sm text-muted">
              {productComingSoon
                ? "Satışa çıktığında buradan sipariş verebileceksiniz"
                : "KDV dahil · Güvenli PayTR ödeme"}
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            {productComingSoon ? (
              <span className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-full border border-accent-dark/30 bg-accent/20 px-6 py-3 text-sm font-bold text-accent-dark">
                Yakında satışa çıkacak
              </span>
            ) : (
              <Link
                href={`/magaza/${product.slug}/satin-al`}
                className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-bold text-white transition hover:brightness-105"
              >
                Satın Al
              </Link>
            )}
            <Link
              href="/magaza"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-border-surface bg-white px-6 py-3 text-sm font-semibold text-navy-950"
            >
              Tüm ürünler
            </Link>
          </div>

          <div className="mt-6 space-y-3 text-base leading-7 text-[var(--text-on-surface-soft)]">
            {product.description.split(/\n\n+/).map((paragraph) => (
              <p key={paragraph.slice(0, 48)}>{paragraph}</p>
            ))}
          </div>

          {highlights.length > 0 ? (
            <ul className="mt-5 space-y-2.5 rounded-2xl border border-border-surface bg-surface-section/70 p-4">
              {highlights.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-6 text-navy-950">
                  <span
                    aria-hidden
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {kitComingSoon ? (
            <div className="mt-5 rounded-2xl border border-accent-dark/25 bg-accent/15 p-4">
              <p className="text-sm font-bold text-navy-950">Kit versiyonu yakında</p>
              <p className="mt-1 text-sm leading-6 text-accent-dark">
                Bu ürün şu an kurulu ve kullanıma hazır cihaz olarak satılmaktadır. Kendin Yap
                (DIY) Eğitim Kiti versiyonu yakında eklenecektir.
              </p>
            </div>
          ) : null}

          {hasCourse ? (
            <div className="mt-5 rounded-2xl border border-document-primary/20 bg-document-primary/5 p-4">
              <p className="text-sm font-bold text-navy-950">Dijital eğitim &amp; aktivasyon dahil</p>
              <p className="mt-1 text-sm text-muted">
                {activated
                  ? "Bu kit hesabınızda etkin. İlerlemeyi görüntüleyebilir veya adımları güncelleyebilirsiniz."
                  : "Kutu içindeki aktivasyon koduyla müfredat kilidini açın."}
              </p>
              <button
                ref={activateRef}
                type="button"
                onClick={() => setModalOpen(true)}
                className="mt-3 inline-flex rounded-full bg-navy-950 px-4 py-2.5 text-sm font-bold text-white"
              >
                {activated ? "İlerlememi Gör" : "Kodu Etkinleştir"}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-10">
        <div
          className="flex flex-wrap gap-2 border-b border-border-surface pb-3"
          role="tablist"
          aria-labelledby={tabsLabelId}
        >
          <span id={tabsLabelId} className="sr-only">
            Teknik detay sekmeleri
          </span>
          {tabs.map((item) => {
            const selected = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`tab-${item.id}`}
                aria-selected={selected}
                aria-controls={`panel-${item.id}`}
                onClick={() => setTab(item.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  selected
                    ? "bg-document-primary text-white"
                    : "bg-white text-navy-900 ring-1 ring-border-surface"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          {tab === "bom" ? (
            <div
              role="tabpanel"
              id="panel-bom"
              aria-labelledby="tab-bom"
              className="grid gap-4 lg:grid-cols-3"
            >
              <BomColumn title="3D Baskı Parçalar" items={product.bomList.printedParts} />
              <BomColumn title="Elektronik Komponentler" items={product.bomList.electronicParts} />
              <BomColumn title="Dijital Erişim" items={product.bomList.digitalAccess} />
            </div>
          ) : null}

          {tab === "curriculum" ? (
            <div role="tabpanel" id="panel-curriculum" aria-labelledby="tab-curriculum">
              {hasCourse ? (
                <div className="space-y-4">
                  {activated ? (
                    <div className={`${BRAND_SURFACE_CARD} p-5`}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-navy-950">İlerleme</p>
                        <span className="text-sm font-bold text-document-primary">%{progress}</span>
                      </div>
                      <div
                        className="mt-2 h-2 overflow-hidden rounded-full bg-surface-section"
                        role="progressbar"
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className="h-full rounded-full bg-document-primary transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className={`${BRAND_SURFACE_CARD} p-5`}>
                      <p className="text-sm font-bold text-navy-950">
                        Kiti etkinleştirdiğinizde interaktif adım takibi açılır
                      </p>
                      <button
                        type="button"
                        onClick={() => setModalOpen(true)}
                        className="mt-3 inline-flex rounded-full bg-navy-950 px-4 py-2.5 text-sm font-bold text-white"
                      >
                        Kodu Gir
                      </button>
                    </div>
                  )}

                  <ul className="space-y-3">
                    {product.educationIntegration.curriculumPreview.map((step) => {
                      const done = completedSteps.includes(step.step);
                      return (
                        <li key={step.step} className={`${BRAND_SURFACE_CARD} p-4`}>
                          {activated ? (
                            <label className="flex cursor-pointer items-start gap-3">
                              <input
                                type="checkbox"
                                checked={done}
                                onChange={() => handleToggleStep(step.step)}
                                className="mt-1 h-4 w-4 accent-document-primary"
                              />
                              <span>
                                <span className="block text-sm font-bold text-navy-950">
                                  {step.step}. {step.title}
                                </span>
                                <span className="mt-1 block text-xs text-muted">
                                  {curriculumTypeLabel(step.type)} · {step.duration}
                                </span>
                              </span>
                            </label>
                          ) : (
                            <div>
                              <p className="text-sm font-bold text-navy-950">
                                {step.step}. {step.title}
                              </p>
                              <p className="mt-1 text-xs text-muted">
                                {curriculumTypeLabel(step.type)} · {step.duration}
                              </p>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <div className={`${BRAND_SURFACE_CARD} space-y-3 p-5`}>
                  <h3 className="text-lg font-bold text-navy-950">Kurulum ve atölye kullanımı</h3>
                  <p className="text-sm leading-7 text-muted">
                    Bu ürünün ayrı bir dijital müfredatı yoktur. Parçaları temiz bir yüzeyde
                    ayırın, montaj vidalarını sıkmadan önce hizayı kontrol edin ve atölyede
                    kabloları stand yuvalarına sabitleyerek çalışın.
                  </p>
                  <ul className="space-y-2 text-sm text-[var(--text-on-surface-soft)]">
                    <li>• Montaj süresi: {product.specs.assemblyTime}</li>
                    <li>• Önerilen yaş grubu: {product.specs.ageGroup}</li>
                    <li>• Malzeme: {product.specs.material}</li>
                  </ul>
                </div>
              )}
            </div>
          ) : null}

          {tab === "specs" ? (
            <div role="tabpanel" id="panel-specs" aria-labelledby="tab-specs">
              <div className={`${BRAND_SURFACE_CARD} overflow-hidden`}>
                <table className="w-full text-left text-sm">
                  <tbody>
                    {[
                      ["Zorluk", product.specs.difficulty],
                      ["Yaş grubu", product.specs.ageGroup],
                      ["Kurulum süresi", product.specs.assemblyTime],
                      ["Malzeme", product.specs.material],
                      ["Mikrodenetleyici", product.specs.microcontroller ?? "—"],
                      ["Stok durumu", stockStatusLabel(product.stockStatus)],
                      ["Kategori", product.category],
                    ].map(([label, value]) => (
                      <tr key={label} className="border-b border-border-surface last:border-none">
                        <th className="w-1/3 px-4 py-3 font-semibold text-navy-950">{label}</th>
                        <td className="px-4 py-3 text-muted">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <ActivationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        preferredSlug={product.slug}
        returnFocusRef={activateRef}
      />
    </div>
  );
}
