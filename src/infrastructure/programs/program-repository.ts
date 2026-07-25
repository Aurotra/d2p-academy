import type { SupabaseClient } from "@supabase/supabase-js";

import type { ProgramDefinition, UpsertProgramInput } from "@/core/domain/program";

interface ProgramRow {
  id: string;
  program_code: string;
  name: string;
  duration_weeks: number | string | null;
  duration_hours: number | string | null;
  is_active: boolean;
  created_at: string;
}

function toNumber(value: number | string | null | undefined): number | null {
  if (value == null || value === "") {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function mapProgramRow(row: ProgramRow): ProgramDefinition {
  return {
    id: row.id,
    programCode: row.program_code,
    name: row.name,
    durationWeeks: toNumber(row.duration_weeks),
    durationHours: toNumber(row.duration_hours),
    isActive: row.is_active,
    createdAt: new Date(row.created_at),
  };
}

export async function listPrograms(
  client: SupabaseClient,
  options?: { activeOnly?: boolean },
): Promise<ProgramDefinition[]> {
  let query = client
    .from("programs")
    .select("id, program_code, name, duration_weeks, duration_hours, is_active, created_at")
    .order("program_code", { ascending: true });

  if (options?.activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return (data as ProgramRow[]).map(mapProgramRow);
}

export async function getProgramsByCode(
  client: SupabaseClient,
): Promise<Map<string, ProgramDefinition>> {
  const programs = await listPrograms(client);
  return new Map(programs.map((program) => [program.programCode, program]));
}

export async function createProgram(
  client: SupabaseClient,
  input: UpsertProgramInput,
): Promise<ProgramDefinition> {
  const { data, error } = await client
    .from("programs")
    .insert({
      program_code: input.programCode,
      name: input.name.trim(),
      duration_weeks: input.durationWeeks ?? null,
      duration_hours: input.durationHours ?? null,
      is_active: input.isActive ?? true,
    })
    .select("id, program_code, name, duration_weeks, duration_hours, is_active, created_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Program oluşturulamadı.");
  }

  return mapProgramRow(data as ProgramRow);
}

export async function updateProgram(
  client: SupabaseClient,
  id: string,
  input: Partial<UpsertProgramInput>,
): Promise<ProgramDefinition> {
  const payload: Record<string, string | number | boolean | null> = {};

  if (input.programCode !== undefined) payload.program_code = input.programCode;
  if (input.name !== undefined) payload.name = input.name.trim();
  if (input.durationWeeks !== undefined) payload.duration_weeks = input.durationWeeks;
  if (input.durationHours !== undefined) payload.duration_hours = input.durationHours;
  if (input.isActive !== undefined) payload.is_active = input.isActive;

  const { data, error } = await client
    .from("programs")
    .update(payload)
    .eq("id", id)
    .select("id, program_code, name, duration_weeks, duration_hours, is_active, created_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Program güncellenemedi.");
  }

  return mapProgramRow(data as ProgramRow);
}

export async function deleteProgram(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from("programs").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
}
