export interface AdminInstructorRecord {
  id: string;
  fullName: string;
  email: string;
  memberRole: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateInstructorInput {
  fullName: string;
  email: string;
  password: string;
}
