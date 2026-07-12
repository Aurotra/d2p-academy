import { NextResponse } from "next/server";

import { buildConsentAudit, mapConsentToColumns } from "@/lib/utils/consent-audit";
import { getClientIp } from "@/lib/utils/request-ip";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";

const PHONE_PATTERN = /^05\d{9}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INSTITUTION_TYPES = [
  "Özel okul",
  "Devlet okulu",
  "Belediye",
  "Dershane / kurs",
  "Diğer",
] as const;

const PACKAGE_OPTIONS = [
  "Sınıf / şube bazlı atölye paketi",
  "Okul içi dönemlik eğitim paketi",
  "Belediye / kurum etkinlik organizasyonu",
  "Öğretmen eğitimi",
  "Diğer / görüşmek istiyorum",
] as const;

const STUDENT_COUNT_OPTIONS = ["10–20", "21–40", "41–80", "81–150", "150+"] as const;

interface InstitutionRequestBody {
  institutionName?: string;
  institutionType?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  city?: string;
  studentCount?: string;
  packageInterest?: string;
  message?: string;
  kvkkDisclosureAccepted?: boolean;
  dataProcessingConsent?: boolean;
  marketingEmailConsent?: boolean;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as InstitutionRequestBody;
    const institutionName = body.institutionName?.trim() ?? "";
    const institutionType = body.institutionType?.trim() ?? "";
    const contactName = body.contactName?.trim() ?? "";
    const phone = body.phone?.replace(/\s/g, "") ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const city = body.city?.trim() ?? "";
    const studentCount = body.studentCount?.trim() ?? "";
    const packageInterest = body.packageInterest?.trim() ?? "";
    const message = body.message?.trim() ?? "";

    if (!institutionName) {
      return NextResponse.json({ error: "Kurum adı zorunludur." }, { status: 400 });
    }

    if (!INSTITUTION_TYPES.includes(institutionType as (typeof INSTITUTION_TYPES)[number])) {
      return NextResponse.json({ error: "Geçerli bir kurum türü seçin." }, { status: 400 });
    }

    if (!contactName) {
      return NextResponse.json({ error: "Yetkili ad soyad zorunludur." }, { status: 400 });
    }

    if (!PHONE_PATTERN.test(phone)) {
      return NextResponse.json(
        { error: "Geçerli bir telefon numarası girin (örnek: 05XXXXXXXXX)." },
        { status: 400 },
      );
    }

    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: "Geçerli bir e-posta adresi girin." }, { status: 400 });
    }

    if (!city) {
      return NextResponse.json({ error: "İl / ilçe bilgisi zorunludur." }, { status: 400 });
    }

    if (!STUDENT_COUNT_OPTIONS.includes(studentCount as (typeof STUDENT_COUNT_OPTIONS)[number])) {
      return NextResponse.json({ error: "Geçerli bir katılımcı sayısı seçin." }, { status: 400 });
    }

    if (!PACKAGE_OPTIONS.includes(packageInterest as (typeof PACKAGE_OPTIONS)[number])) {
      return NextResponse.json({ error: "Geçerli bir eğitim paketi seçin." }, { status: 400 });
    }

    if (!body.kvkkDisclosureAccepted || !body.dataProcessingConsent) {
      return NextResponse.json({ error: "Zorunlu onay kutularını işaretleyin." }, { status: 400 });
    }

    const client = await createSupabaseServerClient();
    if (!client) {
      return NextResponse.json({ error: "Bağlantı kurulamadı." }, { status: 500 });
    }

    const ip = getClientIp(request);
    const kvkkAudit = buildConsentAudit(ip);
    const dataAudit = buildConsentAudit(ip);
    const legalAuthorityAudit = buildConsentAudit(ip);
    const marketingAudit = body.marketingEmailConsent ? buildConsentAudit(ip) : null;

    const { error } = await client.from("institution_requests").insert({
      institution_name: institutionName,
      institution_type: institutionType,
      contact_name: contactName,
      phone,
      email,
      city,
      student_count: studentCount,
      package_interest: packageInterest,
      message: message || null,
      status: "yeni",
      ...mapConsentToColumns("kvkk_disclosure", kvkkAudit),
      ...mapConsentToColumns("data_processing_consent", dataAudit),
      ...mapConsentToColumns("legal_authority_confirmed", legalAuthorityAudit),
      ...(marketingAudit
        ? mapConsentToColumns("marketing_email_consent", marketingAudit)
        : {
            marketing_email_consent_at: null,
            marketing_email_consent_ip: null,
            marketing_email_consent_version: null,
          }),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Talep oluşturulamadı.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
