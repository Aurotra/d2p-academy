export type Gender = "male" | "female" | "prefer_not_to_say";

export type CodingExperience = "none" | "beginner" | "intermediate" | "advanced";

export interface ExperienceData {
  coding_experience: CodingExperience | "";
  proje_sayisi: number | "";
}

export interface MotivationData {
  hedef: string;
  beklenti: number | "";
}

export interface StudentProfileData {
  full_name: string;
  gender: Gender | "";
  grade_level: string;
  school_name: string;
  city_district: string;
  experience_data: ExperienceData;
  interests: string[];
  motivation_data: MotivationData;
  profile_avatar_url: string;
  kvkk_accepted: boolean;
}

export interface StudentProfileRecord extends StudentProfileData {
  id: string;
  email: string;
  role: string;
}

export type ProfileProgressInput = Partial<{
  full_name: string | null;
  gender: string | null;
  grade_level: string | null;
  school_name: string | null;
  city_district: string | null;
  experience_data: {
    coding_experience?: string | null;
    proje_sayisi?: number | null;
  } | null;
  interests: string[] | null;
  motivation_data: {
    hedef?: string | null;
    beklenti?: number | null;
  } | null;
  profile_avatar_url: string | null;
}>;
