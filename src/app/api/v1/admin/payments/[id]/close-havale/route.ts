import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAdminApiServiceClient } from "@/infrastructure/auth/get-admin-api-service-client";
import {
  closeStuckCardPaymentWithHavale,
  StuckPaymentNotActionableError,
} from "@/infrastructure/payments/resolve-stuck-card-payment";
import { apiCatchResponse } from "@/shared/utils/api-error";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const bodySchema = z.object({
  amountTry: z.string().max(20).optional().nullable(),
  receiptNo: z.string().max(80).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await getAdminApiServiceClient();
  if (access.response) return access.response;

  try {
    const parsedParams = paramsSchema.safeParse(await params);
    if (!parsedParams.success) {
      return NextResponse.json({ error: "Geçersiz ödeme." }, { status: 400 });
    }

    const json = await request.json().catch(() => null);
    const parsedBody = bodySchema.safeParse(json ?? {});
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Geçersiz havale bilgisi." }, { status: 400 });
    }

    const result = await closeStuckCardPaymentWithHavale(access.client, {
      paymentId: parsedParams.data.id,
      amountTry: parsedBody.data.amountTry ?? null,
      receiptNo: parsedBody.data.receiptNo ?? null,
      note: parsedBody.data.note ?? null,
      recordedBy: access.user.id,
    });

    revalidatePath("/admin/payments");
    revalidatePath("/admin/enrollments");
    revalidatePath("/admin/reports");
    revalidatePath("/admin");

    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof StuckPaymentNotActionableError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return apiCatchResponse(error, "Havale ile kapatılamadı.", {
      logLabel: "[admin/payments close-havale]",
      status: 400,
    });
  }
}
