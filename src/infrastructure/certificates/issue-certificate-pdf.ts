import type { SupabaseClient } from "@supabase/supabase-js";

import {
  generateCertificatePdfBuffer,
  type CertificateTemplateData,
} from "@/lib/certificates/generate-pdf";
import { SITE_URL } from "@/shared/constants/site";

interface CertificatePdfSourceRow {
  id: string;
  certificate_code: string;
  issued_at: string;
  profiles: { full_name: string } | { full_name: string }[] | null;
  events:
    | {
        title: string;
        location_name: string | null;
        is_online: boolean;
        instructor: { full_name: string } | { full_name: string }[] | null;
      }
    | {
        title: string;
        location_name: string | null;
        is_online: boolean;
        instructor: { full_name: string } | { full_name: string }[] | null;
      }[]
    | null;
}

function pickOne<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}

function formatIssueDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "long" }).format(new Date(value));
}

function resolveLocationLabel(event: {
  location_name: string | null;
  is_online: boolean;
} | null): string {
  if (!event) {
    return "D2P Academy";
  }
  if (event.is_online) {
    return "Çevrimiçi";
  }
  const name = event.location_name?.trim();
  return name && name.length > 0 ? name : "D2P Academy";
}

function buildTemplateData(row: CertificatePdfSourceRow): CertificateTemplateData {
  const profile = pickOne(row.profiles);
  const event = pickOne(row.events);
  const instructor = pickOne(event?.instructor);
  const eventTitle = event?.title ?? "Eğitim Programı";
  const isDiscovery = eventTitle.toLowerCase().includes("discovery");

  return {
    certificateCode: row.certificate_code,
    studentName: profile?.full_name ?? "Öğrenci",
    programName: isDiscovery ? "Discovery Camp" : eventTitle,
    workshopName: isDiscovery ? "Discovery Camp Workshop" : eventTitle,
    durationHours: "6",
    programSubtitle: isDiscovery ? "Explorer" : "Program",
    badgeName: isDiscovery ? "Discovery Explorer" : "Katılım Rozeti",
    issueDate: formatIssueDate(row.issued_at),
    locationName: resolveLocationLabel(event),
    instructorName: instructor?.full_name ?? "D2P Academy",
    instructorTitle: "ATH Mühendislik - D2P Academy",
    badgeImageUrl: `${SITE_URL}/badges/discovery-explorer.png`,
    verificationUrl: `${SITE_URL}/dogrula/${encodeURIComponent(row.certificate_code)}`,
  };
}

export async function issueCertificatePdf(
  client: SupabaseClient,
  certificateId: string,
): Promise<string> {
  const { data, error } = await client
    .from("certificates")
    .select(
      `
      id,
      certificate_code,
      issued_at,
      profiles ( full_name ),
      events (
        title,
        location_name,
        is_online,
        instructor:profiles!events_instructor_id_fkey ( full_name )
      )
    `,
    )
    .eq("id", certificateId)
    .single();

  if (error || !data) {
    throw new Error(`Sertifika verisi alınamadı: ${error?.message ?? "Kayıt bulunamadı"}`);
  }

  const templateData = buildTemplateData(data as CertificatePdfSourceRow);
  const pdfBuffer = await generateCertificatePdfBuffer(templateData);
  const storagePath = `${certificateId}.pdf`;

  const { error: uploadError } = await client.storage
    .from("certificates")
    .upload(storagePath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`PDF yüklenemedi: ${uploadError.message}`);
  }

  const { data: publicUrlData } = client.storage.from("certificates").getPublicUrl(storagePath);
  const pdfUrl = publicUrlData.publicUrl;

  const { error: updateError } = await client
    .from("certificates")
    .update({ pdf_url: pdfUrl })
    .eq("id", certificateId);

  if (updateError) {
    throw new Error(`PDF bağlantısı kaydedilemedi: ${updateError.message}`);
  }

  return pdfUrl;
}
