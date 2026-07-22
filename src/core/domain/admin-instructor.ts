export interface AdminInstructorRecord {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateInstructorInput {
  fullName: string;
  email: string;
  password: string;
}
