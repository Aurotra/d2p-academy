import type { StudentProfileRecord } from "@/core/domain/student-profile";
import type { SupabaseClient } from "@supabase/supabase-js";

interface ProfileRow {
  id: string;
  email: string;
  role: string;
  full_name: string;
  gender: string | null;
  grade_level: string | null;
  school_name: string | null;
  city_district: string | null;
  experience_data: {
    coding_experience?: string;
    proje_sayisi?: number;
  } | null;
  interests: string[] | null;
  motivation_data: {
    hedef?: string;
    beklenti?: number;
  } | null;
  profile_avatar_url: string | null;
  kvkk_accepted: boolean | null;
}

function mapProfile(row: ProfileRow): StudentProfileRecord {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    full_name: row.full_name,
    gender: (row.gender ?? "") as StudentProfileRecord["gender"],
    grade_level: row.grade_level ?? "",
    school_name: row.school_name ?? "",
    city_district: row.city_district ?? "",
    experience_data: {
      coding_experience: (row.experience_data?.coding_experience ??
        "") as StudentProfileRecord["experience_data"]["coding_experience"],
      proje_sayisi: row.experience_data?.proje_sayisi ?? "",
    },
    interests: row.interests ?? [],
    motivation_data: {
      hedef: row.motivation_data?.hedef ?? "",
      beklenti: row.motivation_data?.beklenti ?? "",
    },
    profile_avatar_url: row.profile_avatar_url ?? "",
    kvkk_accepted: row.kvkk_accepted ?? false,
  };
}

const PROFILE_SELECT =
  "id, email, role, full_name, gender, grade_level, school_name, city_district, experience_data, interests, motivation_data, profile_avatar_url, kvkk_accepted";

export class SupabaseStudentProfileRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getByUserId(userId: string): Promise<StudentProfileRecord | null> {
    const { data, error } = await this.client
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("id", userId)
      .single();

    if (error || !data) {
      return null;
    }

    return mapProfile(data as ProfileRow);
  }

  async listStudents(): Promise<StudentProfileRecord[]> {
    const { data, error } = await this.client
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("role", "student")
      .eq("is_active", true)
      .order("full_name", { ascending: true });

    if (error) {
      throw new Error(`Öğrenciler alınamadı: ${error.message}`);
    }

    return (data as ProfileRow[]).map(mapProfile);
  }

  async updateProfile(
    userId: string,
    payload: Omit<StudentProfileRecord, "id" | "email" | "role">,
  ): Promise<StudentProfileRecord> {
    const { data, error } = await this.client
      .from("profiles")
      .update({
        full_name: payload.full_name.trim(),
        gender: payload.gender || null,
        grade_level: payload.grade_level || null,
        school_name: payload.school_name || null,
        city_district: payload.city_district || null,
        experience_data: {
          coding_experience: payload.experience_data.coding_experience || null,
          proje_sayisi:
            payload.experience_data.proje_sayisi === ""
              ? null
              : Number(payload.experience_data.proje_sayisi),
        },
        interests: payload.interests,
        motivation_data: {
          hedef: payload.motivation_data.hedef.trim() || null,
          beklenti:
            payload.motivation_data.beklenti === ""
              ? null
              : Number(payload.motivation_data.beklenti),
        },
        profile_avatar_url: payload.profile_avatar_url || null,
        kvkk_accepted: payload.kvkk_accepted,
      })
      .eq("id", userId)
      .select(PROFILE_SELECT)
      .single();

    if (error || !data) {
      throw new Error(`Profil kaydedilemedi: ${error?.message ?? "Bilinmeyen hata"}`);
    }

    return mapProfile(data as ProfileRow);
  }
}
