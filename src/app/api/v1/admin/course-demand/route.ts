import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import type { CourseDemandStatus } from "@/core/domain/course-demand";
import { requireAdminApiAccess } from "@/infrastructure/auth/require-admin-api-access";
import { listCourseDemandsForClient } from "@/infrastructure/course-demand/course-demand-repository";
import { getProgramsByCode } from "@/infrastructure/programs/program-repository";
import { formatProgramDuration } from "@/shared/utils/program-duration";
import { getProgramCodeLabel, PROGRAM_CODE_OPTIONS } from "@/shared/constants/program-codes";

export async function GET(request: NextRequest) {
  const access = await requireAdminApiAccess();
  if (access.response) return access.response;

  const { searchParams } = new URL(request.url);
  const programCode = searchParams.get("program_code")?.trim().toUpperCase() || undefined;
  const startDate = searchParams.get("start_date")?.trim() || undefined;
  const endDate = searchParams.get("end_date")?.trim() || undefined;
  const status = searchParams.get("status")?.trim() as CourseDemandStatus | undefined;

  try {
    const [entries, programsByCode] = await Promise.all([
      listCourseDemandsForClient(access.client, {
        programCode,
        startDate,
        endDate,
        status,
        admin: true,
      }),
      getProgramsByCode(access.client),
    ]);

    const grouped = PROGRAM_CODE_OPTIONS.map((option) => {
      const program = programsByCode.get(option.code);
      return {
        programCode: option.code,
        label: option.label,
        durationLabel: program ? formatProgramDuration(program) : null,
        entries: entries.filter((entry) => entry.programCode === option.code),
      };
    }).filter((group) => group.entries.length > 0);

    const otherCodes = entries
      .map((entry) => entry.programCode)
      .filter((code) => !PROGRAM_CODE_OPTIONS.some((option) => option.code === code));

    for (const code of [...new Set(otherCodes)]) {
      const program = programsByCode.get(code);
      grouped.push({
        programCode: code,
        label: getProgramCodeLabel(code),
        durationLabel: program ? formatProgramDuration(program) : null,
        entries: entries.filter((entry) => entry.programCode === code),
      });
    }

    const entriesWithDuration = entries.map((entry) => {
      const program = programsByCode.get(entry.programCode);
      return {
        ...entry,
        programDurationLabel: program ? formatProgramDuration(program) : null,
      };
    });

    return NextResponse.json({
      data: {
        entries: entriesWithDuration,
        grouped,
      },
    });
  } catch (error) {
    console.error("[admin course-demand GET]", error);
    return NextResponse.json({ error: "Talepler alınamadı." }, { status: 500 });
  }
}
