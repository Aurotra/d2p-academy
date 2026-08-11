#!/usr/bin/env node

/**
 * Fix unusable gallery photo alt_text values (WhatsApp/camera filenames).
 *
 * Dry-run (default):
 *   node scripts/fix-gallery-alt-text.mjs
 *
 * Apply updates:
 *   node scripts/fix-gallery-alt-text.mjs --apply
 *
 * Does NOT change storage paths, image URLs, captions, or file names.
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (from env or .env.local).
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(fileName) {
  const filePath = resolve(process.cwd(), fileName);
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq <= 0) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

/** Mirrors src/shared/utils/gallery-photo-alt.ts */
function isUnusableGalleryAlt(value) {
  const alt = value?.trim() ?? "";
  if (!alt) {
    return true;
  }

  if (/^\d+$/.test(alt)) {
    return true;
  }

  const normalized = alt.toLowerCase().replace(/\s+/g, " ");

  return (
    /whatsapp\s*image/i.test(normalized) ||
    /^img[_\s-]?\d+/i.test(normalized) ||
    /^dsc[_\s-]?\d+/i.test(normalized) ||
    /^dscn?\d+/i.test(normalized) ||
    /^pxl[_\s-]?\d+/i.test(normalized) ||
    /^screenshot/i.test(normalized) ||
    /^photo[_\s-]?\d+/i.test(normalized) ||
    /^image[_\s-]?\d+/i.test(normalized) ||
    /^file[_\s-]?\d+/i.test(normalized) ||
    /^\d{4}[-_]\d{2}[-_]\d{2}/.test(normalized)
  );
}

function buildAlt(albumTitle) {
  const title = albumTitle?.trim() || "D2P Academy";
  return `${title} — Denizli D2P Academy atölye fotoğrafı`;
}

const apply = process.argv.includes("--apply");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Load .env.local or export them.",
  );
  process.exit(1);
}

const client = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await client
  .from("gallery_photos")
  .select(
    `
    id,
    alt_text,
    storage_path,
    album_id,
    gallery_albums!gallery_photos_album_id_fkey ( title )
  `,
  )
  .is("deleted_at", null);

if (error) {
  console.error("Failed to load gallery_photos:", error.message);
  process.exit(1);
}

const rows = data ?? [];
const changes = [];

for (const row of rows) {
  const album = Array.isArray(row.gallery_albums)
    ? row.gallery_albums[0]
    : row.gallery_albums;
  const albumTitle = album?.title ?? "D2P Academy";
  const currentAlt = row.alt_text ?? "";

  if (!isUnusableGalleryAlt(currentAlt)) {
    continue;
  }

  const nextAlt = buildAlt(albumTitle);
  if (currentAlt.trim() === nextAlt) {
    continue;
  }

  changes.push({
    id: row.id,
    albumId: row.album_id,
    albumTitle,
    storagePath: row.storage_path,
    before: currentAlt || "(empty)",
    after: nextAlt,
  });
}

console.log(`Mode: ${apply ? "APPLY" : "DRY-RUN"}`);
console.log(`Scanned photos: ${rows.length}`);
console.log(`Would update: ${changes.length}`);
console.log("");

const sample = changes.slice(0, 15);
if (sample.length === 0) {
  console.log("No unusable alt_text rows found. Nothing to do.");
  process.exit(0);
}

console.log("Sample before → after (up to 15):");
for (const item of sample) {
  console.log(`- id=${item.id}`);
  console.log(`  album: ${item.albumTitle}`);
  console.log(`  before: ${item.before}`);
  console.log(`  after:  ${item.after}`);
  console.log(`  storage_path (unchanged): ${item.storagePath}`);
}

if (!apply) {
  console.log("");
  console.log("Dry-run only. Re-run with --apply to write updates.");
  process.exit(0);
}

let updated = 0;
let failed = 0;

for (const item of changes) {
  const { error: updateError } = await client
    .from("gallery_photos")
    .update({ alt_text: item.after })
    .eq("id", item.id);

  if (updateError) {
    failed += 1;
    console.error(`Failed ${item.id}: ${updateError.message}`);
  } else {
    updated += 1;
  }
}

console.log("");
console.log(`Updated: ${updated}`);
console.log(`Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
