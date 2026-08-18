import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAdminApiServiceClient } from "@/infrastructure/auth/get-admin-api-service-client";
import {
  releaseStuckCardPayment,
  StuckPaymentNotActionableError,
} from "@/infrastructure/payments/resolve-stuck-card-payment";
import { apiCatchResponse } from "@/shared/utils/api-error";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await getAdminApiServiceClient();
  if (access.response) return access.response;

  try {
    const parsed = paramsSchema.safeParse(await params);
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz ödeme." }, { status: 400 });
    }

    const result = await releaseStuckCardPayment(access.client, parsed.data.id);
    revalidatePath("/admin/payments");
    revalidatePath("/admin/enrollments");
    revalidatePath("/admin");

    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof StuckPaymentNotActionableError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return apiCatchResponse(error, "Koltuk bırakılamadı.", {
      logLabel: "[admin/payments release]",
      status: 400,
    });
  }
}
