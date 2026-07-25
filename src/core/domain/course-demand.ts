export type CourseDemandStatus = "pending" | "grouped" | "converted" | "cancelled";

export interface CourseDemandRequest {
  id: string;
  submittedByProfileId: string | null;
  studentProfileId: string | null;
  studentName: string | null;
  programCode: string;
  preferredStartDate: string;
  preferredEndDate: string | null;
  status: CourseDemandStatus;
  groupedEventId: string | null;
  groupedEventTitle: string | null;
  notes: string | null;
  createdAt: Date;
  parentName: string | null;
  parentEmail: string | null;
  parentPhone: string | null;
  needsStudentProfile: boolean;
}

export const COURSE_DEMAND_STATUS_LABELS: Record<CourseDemandStatus, string> = {
  pending: "Beklemede",
  grouped: "Sınıfa atandı (profil gerekli)",
  converted: "Kayda dönüştürüldü",
  cancelled: "İptal",
};

export const COURSE_DEMAND_PARENT_STATUS_MESSAGES: Record<CourseDemandStatus, string> = {
  pending: "Talebiniz alındı. Yeterli talep birikince sınıf açılacak.",
  grouped: "Bir sınıfa dahil edildiniz. Öğrenci profili oluşturulduktan sonra kayıt tamamlanacak.",
  converted: "Talebiniz bir sınıfa dönüştürüldü. Etkinlik kaydınız panelde görünecek.",
  cancelled: "Talep iptal edildi.",
};
