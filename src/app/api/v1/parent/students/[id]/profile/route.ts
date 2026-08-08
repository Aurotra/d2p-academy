import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { logMemberActivity } from "@/infrastructure/audit/log-member-activity";
import { createSupabaseServerClient } from "@/infrastructure/supabase/create-server-client";
import {
  calculateProgress,
  isProfileComplete,
  PROFILE_INCOMPLETE_SAVE_BLOCKED_MESSAGE,
} from "@/lib/utils/progress";
import {
  isValidTurkishMobilePhone,
  normalizeTurkishPhone,
  TURKISH_MOBILE_PHONE_ERROR,
} from "@/shared/utils/turkish-phone";
import { logSupabaseError } from "@/shared/utils/api-error";

const PROFILE_SELECT =
  "id, full_name, email, username, gender, grade_level, school_name, city_district, experience_data, interests, motivation_data, profile_avatar_url, parent_phone, kvkk_accepted";

const PARENT_PHONE_PROGRESS_OPTIONS = { requireParentPhone: true } as const;

async function requireOwnedChild(studentId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      error: NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 }),
    };
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) {
    return { error: NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 }) };
  }

  return { supabase, parentId: auth.user.id, studentId };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: studentId } = await params;
  const access = await requireOwnedChild(studentId);
  if ("error" in access && access.error) {
    return access.error;
  }
  if (!("supabase" in access)) {
    return NextResponse.json({ error: "Yetki hatası." }, { status: 500 });
  }

  const [{ data, error }, { data: parentProfile }] = await Promise.all([
    access.supabase
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("id", studentId)
      .eq("parent_id", access.parentId)
      .eq("role", "student")
      .not("username", "is", null)
      .maybeSingle(),
    access.supabase
      .from("profiles")
      .select("phone")
      .eq("id", access.parentId)
      .maybeSingle(),
  ]);

  if (error) {
    console.error("[parent profile GET]", error.message);
    return NextResponse.json({ error: "Profil yüklenemedi." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Öğrenci bulunamadı." }, { status: 404 });
  }

  const defaultParentPhone =
    parentProfile?.phone && isValidTurkishMobilePhone(parentProfile.phone)
      ? normalizeTurkishPhone(parentProfile.phone)
      : null;

  const progress = calculateProgress(
    {
      full_name: data.full_name,
      gender: data.gender,
      grade_level: data.grade_level,
      school_name: data.school_name,
      city_district: data.city_district,
      experience_data: data.experience_data,
      interests: data.interests,
      motivation_data: data.motivation_data,
      profile_avatar_url: data.profile_avatar_url,
      parent_phone: data.parent_phone ?? defaultParentPhone,
    },
    PARENT_PHONE_PROGRESS_OPTIONS,
  );

  return NextResponse.json({
    data: {
      profile: data,
      default_parent_phone: defaultParentPhone,
      progress,
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: studentId } = await params;
  const access = await requireOwnedChild(studentId);
  if ("error" in access && access.error) {
    return access.error;
  }
  if (!("supabase" in access)) {
    return NextResponse.json({ error: "Yetki hatası." }, { status: 500 });
  }

  const { data: child } = await access.supabase
    .from("profiles")
    .select("id")
    .eq("id", studentId)
    .eq("parent_id", access.parentId)
    .eq("role", "student")
    .not("username", "is", null)
    .maybeSingle();

  if (!child) {
    return NextResponse.json({ error: "Öğrenci bulunamadı." }, { status: 404 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const payload: Record<string, unknown> = {};
    if (typeof body.full_name === "string") payload.full_name = body.full_name.trim();
    if (typeof body.gender === "string") payload.gender = body.gender || null;
    if (typeof body.grade_level === "string") payload.grade_level = body.grade_level || null;
    if (typeof body.school_name === "string") payload.school_name = body.school_name.trim() || null;
    if (typeof body.city_district === "string") {
      payload.city_district = body.city_district.trim() || null;
    }
    if (body.experience_data && typeof body.experience_data === "object") {
      payload.experience_data = body.experience_data;
    }
    if (Array.isArray(body.interests)) payload.interests = body.interests;
    if (body.motivation_data && typeof body.motivation_data === "object") {
      payload.motivation_data = body.motivation_data;
    }
    if (typeof body.profile_avatar_url === "string") {
      payload.profile_avatar_url = body.profile_avatar_url || null;
    }
    if (typeof body.kvkk_accepted === "boolean") payload.kvkk_accepted = body.kvkk_accepted;
    if (typeof body.parent_phone === "string") {
      const normalizedPhone = normalizeTurkishPhone(body.parent_phone);
      if (!isValidTurkishMobilePhone(normalizedPhone)) {
        return NextResponse.json({ error: TURKISH_MOBILE_PHONE_ERROR }, { status: 400 });
      }
      payload.parent_phone = normalizedPhone;
    }

    const progressInput = {
      full_name: (payload.full_name as string | undefined) ?? "",
      gender: (payload.gender as string | null | undefined) ?? null,
      grade_level: (payload.grade_level as string | null | undefined) ?? null,
      school_name: (payload.school_name as string | null | undefined) ?? null,
      city_district: (payload.city_district as string | null | undefined) ?? null,
      experience_data: payload.experience_data as {
        coding_experience?: string | null;
        proje_sayisi?: number | null;
      } | null,
      interests: (payload.interests as string[] | undefined) ?? [],
      motivation_data: payload.motivation_data as {
        hedef?: string | null;
        beklenti?: number | null;
      } | null,
      profile_avatar_url: (payload.profile_avatar_url as string | null | undefined) ?? null,
      parent_phone: (payload.parent_phone as string | undefined) ?? "",
    };

    if (!isProfileComplete(progressInput, PARENT_PHONE_PROGRESS_OPTIONS)) {
      const progress = calculateProgress(progressInput, PARENT_PHONE_PROGRESS_OPTIONS);
      return NextResponse.json(
        {
          error: `${PROFILE_INCOMPLETE_SAVE_BLOCKED_MESSAGE} (Şu an %${progress})`,
        },
        { status: 400 },
      );
    }

    const { data, error } = await access.supabase
      .from("profiles")
      .update(payload)
      .eq("id", studentId)
      .eq("parent_id", access.parentId)
      .eq("role", "student")
      .select(PROFILE_SELECT)
      .single();

    if (error) {
      logSupabaseError("[parent profile PATCH]", error);
      return NextResponse.json({ error: "Profil güncellenemedi." }, { status: 400 });
    }

    const progress = calculateProgress(
      {
        full_name: data.full_name,
        gender: data.gender,
        grade_level: data.grade_level,
        school_name: data.school_name,
        city_district: data.city_district,
        experience_data: data.experience_data,
        interests: data.interests,
        motivation_data: data.motivation_data,
        profile_avatar_url: data.profile_avatar_url,
        parent_phone: data.parent_phone,
      },
      PARENT_PHONE_PROGRESS_OPTIONS,
    );

    const { data: parentProfile } = await access.supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", access.parentId)
      .maybeSingle();

    void logMemberActivity({
      action: "child_profile_updated",
      actorId: access.parentId,
      actorEmail: parentProfile?.email ?? null,
      actorName: parentProfile?.full_name ?? null,
      studentId: data.id,
      studentName: data.full_name,
      metadata: {
        progress_percent: progress,
        updated_fields: Object.keys(payload),
      },
    });

    return NextResponse.json({ data: { profile: data, progress } });
  } catch {
    return NextResponse.json({ error: "Profil güncellenemedi." }, { status: 500 });
  }
}
