export interface ProgramDefinition {
  id: string;
  programCode: string;
  name: string;
  durationWeeks: number | null;
  durationHours: number | null;
  isActive: boolean;
  createdAt: Date;
}

export interface UpsertProgramInput {
  programCode: string;
  name: string;
  durationWeeks?: number | null;
  durationHours?: number | null;
  isActive?: boolean;
}
