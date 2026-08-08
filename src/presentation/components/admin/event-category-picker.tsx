"use client";

import type { EventCategoryOption } from "@/core/domain/admin-event";

const GROUP_ORDER = [
  "Üretim & 3D",
  "Teknoloji & Kodlama",
  "STEM & Keşif",
  "Sanat & İletişim",
  "Kamp & Program",
  "Kurumsal & Özel",
  "Genel",
] as const;

function groupCategories(categories: EventCategoryOption[]): Array<{
  groupName: string;
  items: EventCategoryOption[];
}> {
  const buckets = new Map<string, EventCategoryOption[]>();

  for (const category of categories) {
    const groupName = category.groupName || "Genel";
    const items = buckets.get(groupName) ?? [];
    items.push(category);
    buckets.set(groupName, items);
  }

  const orderedGroups = [
    ...GROUP_ORDER.filter((group) => buckets.has(group)),
    ...[...buckets.keys()].filter((group) => !GROUP_ORDER.includes(group as (typeof GROUP_ORDER)[number])),
  ];

  return orderedGroups.map((groupName) => ({
    groupName,
    items: buckets.get(groupName) ?? [],
  }));
}

interface EventCategoryPickerProps {
  idPrefix: string;
  categories: EventCategoryOption[];
  value: string;
  onChange: (categoryId: string) => void;
}

export function EventCategoryPicker({
  idPrefix,
  categories,
  value,
  onChange,
}: EventCategoryPickerProps) {
  const groups = groupCategories(categories);

  return (
    <div className="md:col-span-2">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-navy-900">Etkinlik Kategorisi</p>
          <p className="mt-0.5 text-xs text-subtle">
            Programın içerik alanını seçin. Bu bilgi etkinlik kartlarında ve filtrelerde görünür.
          </p>
        </div>
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs font-semibold text-subtle underline-offset-2 hover:text-[var(--text-on-surface-soft)] hover:underline"
          >
            Seçimi temizle
          </button>
        ) : null}
      </div>

      <div className="space-y-4 rounded-2xl border border-border-surface bg-surface-section/50 p-4">
        <label
          htmlFor={`${idPrefix}-category-none`}
          className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
            value === ""
              ? "border-document-primary bg-white ring-2 ring-document-primary/20"
              : "border-border-surface bg-white hover:border-secondary/40"
          }`}
        >
          <input
            id={`${idPrefix}-category-none`}
            type="radio"
            name={`${idPrefix}-category`}
            value=""
            checked={value === ""}
            onChange={() => onChange("")}
            className="sr-only"
          />
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-section text-xs font-bold text-subtle">
            —
          </span>
          <span>
            <span className="block text-sm font-semibold text-navy-950">Kategorisiz</span>
            <span className="block text-xs text-subtle">Henüz sınıflandırılmamış etkinlikler</span>
          </span>
        </label>

        {groups.map((group) => (
          <section key={group.groupName} className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-subtle">
              {group.groupName}
            </h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {group.items.map((category) => {
                const inputId = `${idPrefix}-category-${category.id}`;
                const isSelected = value === category.id;

                return (
                  <label
                    key={category.id}
                    htmlFor={inputId}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition ${
                      isSelected
                        ? "border-document-primary bg-white ring-2 ring-document-primary/20"
                        : "border-border-surface bg-white hover:border-secondary/40"
                    }`}
                  >
                    <input
                      id={inputId}
                      type="radio"
                      name={`${idPrefix}-category`}
                      value={category.id}
                      checked={isSelected}
                      onChange={() => onChange(category.id)}
                      className="sr-only"
                    />
                    <span
                      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white shadow-sm"
                      style={{ backgroundColor: category.color }}
                      aria-hidden
                    >
                      {category.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-navy-950">{category.name}</span>
                      {category.description ? (
                        <span className="mt-0.5 block text-xs leading-relaxed text-subtle">
                          {category.description}
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
