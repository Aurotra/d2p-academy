import { NextResponse } from "next/server";

import { buildConsentAudit, mapConsentToColumns } from "@/lib/utils/consent-audit";
import { getClientIp } from "@/lib/utils/request-ip";
import { isKaklikCampaignEnabled } from "@/infrastructure/settings/site-settings";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import {
  KAKLIK_CAMPAIGN_ID,
  KAKLIK_CAMPAIGN_TITLE,
  KAKLIK_TIME_GROUPS,
  type KaklikTimeGroupValue,
} from "@/shared/constants/kaklik-campaign";

const PHONE_PATTERN = /^05\d{9}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface CampaignRegistrationBody {
  fullName?: string;
  email?: string;
  phone?: string;
  timeGroup?: string;
  kvkkDisclosureAccepted?: boolean;
  dataProcessingConsent?: boolean;
  marketingEmailConsent?: boolean;
}

function isDuplicatePhoneError(error: { message?: string; code?: string }): boolean {
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === "23505" ||
    message.includes("duplicate key") ||
    message.includes("registrations_phone")
  );
}

function isValidTimeGroup(value: string): value is KaklikTimeGroupValue {
  return KAKLIK_TIME_GROUPS.some((group) => group.value === value);
}

export async function POST(request: Request) {
  try {
    const client = await createSupabaseServerClient();
    if (!client) {
      return NextResponse.json({ error: "Bağlantı kurulamadı." }, { status: 500 });
    }

    if (!(await isKaklikCampaignEnabled(client))) {
      return NextResponse.json({ error: "Bu kampanya şu an kapalı." }, { status: 403 });
    }

    const body = (await request.json()) as CampaignRegistrationBody;
    const fullName = body.fullName?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const phone = body.phone?.replace(/\s/g, "") ?? "";
    const timeGroup = body.timeGroup?.trim() ?? "";

    if (!fullName) {
      return NextResponse.json({ error: "Ad soyad alanı zorunludur." }, { status: 400 });
    }

    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: "Geçerli bir e-posta adresi girin." }, { status: 400 });
    }

    if (!PHONE_PATTERN.test(phone)) {
      return NextResponse.json(
        { error: "Geçerli bir telefon numarası girin (örnek: 05XXXXXXXXX)." },
        { status: 400 },
      );
    }

    if (!isValidTimeGroup(timeGroup)) {
      return NextResponse.json({ error: "Eğitim saati / grup seçimi zorunludur." }, { status: 400 });
    }

    if (!body.kvkkDisclosureAccepted || !body.dataProcessingConsent) {
      return NextResponse.json({ error: "Zorunlu onay kutularını işaretleyin." }, { status: 400 });
    }

    const ip = getClientIp(request);
    const kvkkAudit = buildConsentAudit(ip);
    const dataAudit = buildConsentAudit(ip);
    const marketingAudit = body.marketingEmailConsent ? buildConsentAudit(ip) : null;

    const { error } = await client.from("registrations").insert({
      full_name: fullName,
      email,
      phone,
      grade: "other",
      course: KAKLIK_CAMPAIGN_TITLE,
      status: "yeni",
      campaign: KAKLIK_CAMPAIGN_ID,
      time_group: timeGroup,
      is_minor: false,
      guardian_name: null,
      guardian_phone: null,
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
              "Bu telefon numarasıyla bu etkinliğe zaten kayıt oluşturulmuş. En kısa sürede size dönüş yapacağız.",
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
