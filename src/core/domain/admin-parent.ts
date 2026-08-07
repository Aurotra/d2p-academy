export interface AdminParentChildContact {
  id: string;
  fullName: string;
  username: string | null;
  parentPhone: string | null;
}

export interface AdminParentRecord {
  id: string;
  fullName: string;
  email: string | null;
  accountPhone: string | null;
  profileContactPhone: string | null;
  contactPhone: string | null;
  childCount: number;
  children: AdminParentChildContact[];
  createdAt: string;
  isActive: boolean;
}
