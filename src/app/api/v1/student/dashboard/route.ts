import { NextResponse } from "next/server";

import { getStudentSession } from "@/infrastructure/auth/get-student-session";
import { fetchUsernameStudentProgress } from "@/infrastructure/repositories/fetch-username-student-progress";

export async function GET() {
  try {
    const session = await getStudentSession();
    if (!session) {
      return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
    }

    const progress = await fetchUsernameStudentProgress(session.sub);
    return NextResponse.json({
      data: {
        student: {
          id: session.sub,
          username: session.username,
        },
        progress,
      },
    });
  } catch (error) {
    console.error("[student/dashboard]", error);
    return NextResponse.json({ error: "Öğrenci paneli yüklenemedi." }, { status: 500 });
  }
}
