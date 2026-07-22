export type AdminMemberRole = "parent" | "student";

export interface AdminMember {
  id: string;
  fullName: string;
  email: string | null;
  role: AdminMemberRole;
  phone: string | null;
  createdAt: string;
  isActive: boolean;
  childCount: number;
  isInstructor: boolean;
}
