import type { SupabaseClient } from "@supabase/supabase-js";

import type { Profile, UserRole } from "@/core/domain/auth";
import type { CertificateStatus } from "@/core/domain/certificate-verification";
import type { AcademyEvent, EventCategory, EventType } from "@/core/domain/event";
import type {
  EnrollmentStatus,
  StudentCertificate,
  StudentDashboardData,
  StudentEnrollment,
} from "@/core/domain/student-dashboard";
import type { StudentDashboardRepository } from "@/core/use-cases/get-student-dashboard";

interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
}

interface EventCategoryRow {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface EventRow {
  id: string;
  title: string;
  slug: string;
  description: string;
  event_type: EventType;
  start_at: string;
  end_at: string;
  location_name: string | null;
  is_online: boolean;
  cover_image_url: string | null;
  event_categories: EventCategoryRow | EventCategoryRow[] | null;
}

interface EnrollmentRow {
  id: string;
  status: EnrollmentStatus;
  registered_at: string;
  events: EventRow | EventRow[] | null;
}

interface CertificateRow {
  id: string;
  certificate_code: string;
  issued_at: string;
  status: CertificateStatus;
  events: { title: string } | { title: string }[] | null;
}

function mapCategory(row: EventCategoryRow | null): EventCategory | null {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    color: row.color,
  };
}

function mapEvent(row: EventRow): AcademyEvent {
  const categoryRow = Array.isArray(row.event_categories)
    ? (row.event_categories[0] ?? null)
    : row.event_categories;

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    eventType: row.event_type,
    category: mapCategory(categoryRow),
    startAt: new Date(row.start_at),
    endAt: new Date(row.end_at),
    locationName: row.location_name,
    isOnline: row.is_online,
    coverImageUrl: row.cover_image_url,
  };
}

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
  };
}

export class SupabaseStudentDashboardRepository implements StudentDashboardRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getDashboardData(userId: string): Promise<StudentDashboardData> {
    const { error: ensureProfileError } = await this.client.rpc("ensure_user_profile");

    if (ensureProfileError) {
      throw new Error(`Profil oluşturulamadı: ${ensureProfileError.message}`);
    }

    const [profileResult, enrollmentsResult, certificatesResult] = await Promise.all([
      this.client
        .from("profiles")
        .select("id, full_name, email, role")
        .eq("id", userId)
        .single(),
      this.client
        .from("enrollments")
        .select(
          `
          id,
          status,
          registered_at,
          events (
            id,
            title,
            slug,
            description,
            event_type,
            start_at,
            end_at,
            location_name,
            is_online,
            cover_image_url,
            event_categories (
              id,
              name,
              slug,
              color
            )
          )
        `,
        )
        .eq("user_id", userId)
        .in("status", ["registered", "attended"])
        .order("registered_at", { ascending: false }),
      this.client
        .from("certificates")
        .select(
          `
          id,
          certificate_code,
          issued_at,
          status,
          events ( title )
        `,
        )
        .eq("user_id", userId)
        .order("issued_at", { ascending: false }),
    ]);

    if (profileResult.error || !profileResult.data) {
      throw new Error(
        profileResult.error
          ? `Profil bilgileri alınamadı: ${profileResult.error.message}`
          : "Profil bilgileri alınamadı.",
      );
    }

    if (enrollmentsResult.error) {
      throw new Error(`Etkinlik kayıtları alınamadı: ${enrollmentsResult.error.message}`);
    }

    if (certificatesResult.error) {
      throw new Error(`Sertifikalar alınamadı: ${certificatesResult.error.message}`);
    }

    const upcomingEnrollments = (enrollmentsResult.data as EnrollmentRow[])
      .map((row) => {
        const eventRow = Array.isArray(row.events) ? (row.events[0] ?? null) : row.events;

        if (!eventRow) {
          return null;
        }

        const event = mapEvent(eventRow);

        if (event.startAt.getTime() < Date.now()) {
          return null;
        }

        return {
          id: row.id,
          status: row.status,
          registeredAt: new Date(row.registered_at),
          event,
        } satisfies StudentEnrollment;
      })
      .filter((enrollment): enrollment is StudentEnrollment => enrollment !== null)
      .sort((left, right) => left.event.startAt.getTime() - right.event.startAt.getTime());

    const certificates = (certificatesResult.data as CertificateRow[]).map((row) => {
      const eventRow = Array.isArray(row.events) ? (row.events[0] ?? null) : row.events;

      return {
        id: row.id,
        certificateCode: row.certificate_code,
        eventTitle: eventRow?.title ?? "Eğitim",
        issuedAt: new Date(row.issued_at),
        status: row.status,
      } satisfies StudentCertificate;
    });

    return {
      profile: mapProfile(profileResult.data as ProfileRow),
      upcomingEnrollments,
      certificates,
    };
  }
}
