import { NextResponse } from "next/server";

import { buildConsentAudit, mapConsentToColumns } from "@/lib/utils/consent-audit";
import { getClientIp } from "@/lib/utils/request-ip";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import { GRADE_LEVEL_OPTIONS, REGISTRATION_COURSE_OPTIONS } from "@/shared/constants/profile-options";

const PHONE_PATTERN = /^05\d{9}$/;

interface RegistrationRequestBody {
  fullName?: string;
  phone?: string;
  grade?: string;
  course?: string;
  isMinor?: boolean;
  guardianName?: string;
  guardianPhone?: string;
  kvkkDisclosureAccepted?: boolean;
  dataProcessingConsent?: boolean;
  marketingEmailConsent?: boolean;
}

function isDuplicatePhoneError(error: { message?: string; code?: string }): boolean {
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === "23505" ||
    message.includes("duplicate key") ||
    message.includes("registrations_phone_unique")
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegistrationRequestBody;
    const fullName = body.fullName?.trim() ?? "";
    const phone = body.phone?.replace(/\s/g, "") ?? "";
    const grade = body.grade?.trim() ?? "";
    const course = body.course?.trim() ?? "";
    const isMinor = body.isMinor === true;
    const guardianName = body.guardianName?.trim() ?? "";
    const guardianPhone = body.guardianPhone?.replace(/\s/g, "") ?? "";

    if (!fullName) {
      return NextResponse.json({ error: "Ad soyad alanı zorunludur." }, { status: 400 });
    }

    if (!PHONE_PATTERN.test(phone)) {
      return NextResponse.json(
        { error: "Geçerli bir telefon numarası girin (örnek: 05XXXXXXXXX)." },
        { status: 400 },
      );
    }

    if (!grade || !GRADE_LEVEL_OPTIONS.some((option) => option.value === grade)) {
      return NextResponse.json({ error: "Geçerli bir eğitim düzeyi seçin." }, { status: 400 });
    }

    if (!course || !REGISTRATION_COURSE_OPTIONS.includes(course as (typeof REGISTRATION_COURSE_OPTIONS)[number])) {
      return NextResponse.json({ error: "Geçerli bir atölye seçin." }, { status: 400 });
    }

    if (!body.kvkkDisclosureAccepted || !body.dataProcessingConsent) {
      return NextResponse.json({ error: "Zorunlu onay kutularını işaretleyin." }, { status: 400 });
    }

    if (isMinor) {
      if (!guardianName) {
        return NextResponse.json({ error: "Veli/vasi ad soyad zorunludur." }, { status: 400 });
      }
      if (!PHONE_PATTERN.test(guardianPhone)) {
        return NextResponse.json(
          { error: "Veli/vasi telefonu geçerli formatta olmalıdır (05XXXXXXXXX)." },
          { status: 400 },
        );
      }
    }

    const client = await createSupabaseServerClient();
    if (!client) {
      return NextResponse.json({ error: "Bağlantı kurulamadı." }, { status: 500 });
    }

    const ip = getClientIp(request);
    const kvkkAudit = buildConsentAudit(ip);
    const dataAudit = buildConsentAudit(ip);
    const marketingAudit = body.marketingEmailConsent ? buildConsentAudit(ip) : null;

    const { error } = await client.from("registrations").insert({
      full_name: fullName,
      phone,
      grade,
      course,
      status: "yeni",
      is_minor: isMinor,
      guardian_name: isMinor ? guardianName : null,
      guardian_phone: isMinor ? guardianPhone : null,
      ...mapConsentToColumns("kvkk_disclosure", kvkkAudit),
      ...mapConsentToColumns("data_processing_consent", dataAudit),
      ...(marketingAudit
        ? mapConsentToColumns("marketing_email_consent", marketingAudit)
        : {
            marketing_email_consent_at: null,
            marketing_email_consent_ip: null,
            marketing_email_consent_version: null,
          }),
    });

    if (error) {
      if (isDuplicatePhoneError(error)) {
        return NextResponse.json(
          {
            error:
              "Bu telefon numarasıyla zaten kayıt oluşturulmuş, en kısa sürede size dönüş yapacağız",
          },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kayıt oluşturulamadı.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
