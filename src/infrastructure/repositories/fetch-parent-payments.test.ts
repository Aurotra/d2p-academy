import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { filterPaymentsOwnedByParent } from "@/core/domain/parent-payments";
import { fetchParentPayments } from "@/infrastructure/repositories/fetch-parent-payments";

describe("parent payments privacy", () => {
  it("filterPaymentsOwnedByParent drops other parents' rows", () => {
    const parentA = "parent-a";
    const parentB = "parent-b";

    const filtered = filterPaymentsOwnedByParent(
      [
        { id: "1", payerUserId: parentA, amount: 100 },
        { id: "2", payerUserId: parentB, amount: 200 },
        { id: "3", payerUserId: parentA, amount: 300 },
      ],
      parentA,
    );

    expect(filtered.map((row) => row.id)).toEqual(["1", "3"]);
    expect(filtered.every((row) => row.payerUserId === parentA)).toBe(true);
  });

  it("fetchParentPayments queries only payer_user_id of the authenticated parent", async () => {
    const parentId = "11111111-1111-1111-1111-111111111111";
    const otherParentId = "22222222-2222-2222-2222-222222222222";

    const eq = vi.fn(() => ({
      order: vi.fn(() => ({
        limit: vi.fn(async () => ({
          data: [
            {
              id: "pay-own",
              payer_user_id: parentId,
              amount_try_cents: 15000,
              status: "paid",
              paid_at: "2026-08-14T10:00:00.000Z",
              created_at: "2026-08-14T09:00:00.000Z",
              events: { title: "Robotik" },
              student: { full_name: "Çocuk A" },
            },
            {
              id: "pay-other",
              payer_user_id: otherParentId,
              amount_try_cents: 9900,
              status: "paid",
              paid_at: "2026-08-14T11:00:00.000Z",
              created_at: "2026-08-14T10:30:00.000Z",
              events: { title: "Başkasının" },
              student: { full_name: "Çocuk B" },
            },
          ],
          error: null,
        })),
      })),
    }));

    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));
    const client = { from };

    const rows = await fetchParentPayments(client as never, parentId);

    expect(from).toHaveBeenCalledWith("payments");
    expect(eq).toHaveBeenCalledWith("payer_user_id", parentId);
    expect(rows.map((row) => row.id)).toEqual(["pay-own"]);
    expect(rows.some((row) => row.eventTitle === "Başkasının")).toBe(false);
  });
});
