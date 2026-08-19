import { NextResponse } from "next/server";

import { authorizeCronRequest } from "@/infrastructure/cron/authorize-cron-request";
import { sweepStuckCardPayments } from "@/infrastructure/payments/sweep-stuck-card-payments";
import { createServiceRoleClient } from "@/infrastructure/supabase/create-service-role-client";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function runSweep(request: Request) {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  try {
    const result = await sweepStuckCardPayments(createServiceRoleClient());
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("[cron/stuck-card-payments]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Tarama başarısız." },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return runSweep(request);
}

export async function POST(request: Request) {
  return runSweep(request);
}
