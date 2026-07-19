import { NextResponse } from "next/server";

import { getStudentSession } from "@/infrastructure/auth/get-student-session";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";
import { calculateProgress } from "@/lib/utils/progress";

const PROFILE_SELECT =
  "id, full_name, email, username, gender, grade_level, school_name, city_district, experience_data, interests, motivation_data, profile_avatar_url, kvkk_accepted";

export async function GET() {
  const session = await getStudentSession();
  if (!session) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  try {
    const client = createServiceRoleClient();
    const { data, error } = await client
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("id", session.sub)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: "Profil bulunamadı." }, { status: 404 });
    }

    const progress = calculateProgress({
      full_name: data.full_name,
      gender: data.gender,
      grade_level: data.grade_level,
      school_name: data.school_name,
      city_district: data.city_district,
      experience_data: data.experience_data,
      interests: data.interests,
      motivation_data: data.motivation_data,
      profile_avatar_url: data.profile_avatar_url,
    });

    return NextResponse.json({ data: { profile: data, progress } });
  } catch {
    return NextResponse.json({ error: "Profil yüklenemedi." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getStudentSession();
  if (!session) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const client = createServiceRoleClient();

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

    const { data, error } = await client
      .from("profiles")
      .update(payload)
      .eq("id", session.sub)
      .eq("role", "student")
      .select(PROFILE_SELECT)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data: { profile: data } });
  } catch {
    return NextResponse.json({ error: "Profil güncellenemedi." }, { status: 500 });
  }
}
