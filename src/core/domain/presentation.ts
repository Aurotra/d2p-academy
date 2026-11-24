export interface Presentation {
  id: string;
  title: string;
  description: string;
  category: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
  byteSize: number;
  pageCount: number;
  isPublished: boolean;
  createdBy: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PresentationAssignment {
  id: string;
  presentationId: string;
  instructorId: string;
  assignedBy: string | null;
  createdAt: string;
  instructorName?: string | null;
  instructorEmail?: string | null;
}

export interface PresentationWithAssignments extends Presentation {
  assignments: PresentationAssignment[];
  instructorIds: string[];
}

export interface InstructorPresentationCard {
  id: string;
  title: string;
  description: string;
  category: string;
  pageCount: number;
  updatedAt: string;
  fileName: string;
}

export interface CreatePresentationInput {
  title: string;
  description?: string;
  category?: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
  byteSize: number;
  pageCount?: number;
  isPublished?: boolean;
  createdBy?: string | null;
  instructorIds?: string[];
}

export interface UpdatePresentationInput {
  title?: string;
  description?: string;
  category?: string;
  pageCount?: number;
  isPublished?: boolean;
  storagePath?: string;
  fileName?: string;
  mimeType?: string;
  byteSize?: number;
  instructorIds?: string[];
}
