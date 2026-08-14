import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { filterPaymentsOwnedByParent } from "@/core/domain/parent-payments";
import { fetchParentPayments } from "@/infrastructure/repositories/fetch-parent-payments";

describe("parent payments privacy", () => {
  it("filterPaymentsOwnedByParent keeps only the authenticated parent's rows (positive + negative)", () => {
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

    // Positive: own payments remain
    expect(filtered.map((row) => row.id)).toEqual(["1", "3"]);
    // Negative: other parent's payment is absent
    expect(filtered.some((row) => row.payerUserId === parentB)).toBe(false);
    expect(filtered.find((row) => row.id === "2")).toBeUndefined();
  });

  it("fetchParentPayments scopes the query with payer_user_id = authenticated parent", async () => {
    const parentId = "11111111-1111-1111-1111-111111111111";

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
          ],
          error: null,
        })),
      })),
    }));

    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));

    const rows = await fetchParentPayments({ from } as never, parentId);

    expect(from).toHaveBeenCalledWith("payments");
    expect(eq).toHaveBeenCalledWith("payer_user_id", parentId);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe("pay-own");
  });

  it("negative: another parent's payment never appears in the result set", async () => {
    const parentA = "11111111-1111-1111-1111-111111111111";
    const parentB = "22222222-2222-2222-2222-222222222222";

    // Simulate a polluted/misconfigured client returning both parents' rows.
    // App-layer filter must still drop parent B.
    const eq = vi.fn(() => ({
      order: vi.fn(() => ({
        limit: vi.fn(async () => ({
          data: [
            {
              id: "pay-a",
              payer_user_id: parentA,
              amount_try_cents: 15000,
              status: "paid",
              paid_at: "2026-08-14T10:00:00.000Z",
              created_at: "2026-08-14T09:00:00.000Z",
              events: { title: "Veli A etkinlik" },
              student: { full_name: "Çocuk A" },
            },
            {
              id: "pay-b",
              payer_user_id: parentB,
              amount_try_cents: 9900,
              status: "paid",
              paid_at: "2026-08-14T11:00:00.000Z",
              created_at: "2026-08-14T10:30:00.000Z",
              events: { title: "Veli B etkinlik" },
              student: { full_name: "Çocuk B" },
            },
          ],
          error: null,
        })),
      })),
    }));

    const rows = await fetchParentPayments(
      { from: vi.fn(() => ({ select: vi.fn(() => ({ eq })) })) } as never,
      parentA,
    );

    expect(rows.map((row) => row.id)).toEqual(["pay-a"]);
    expect(rows.find((row) => row.id === "pay-b")).toBeUndefined();
    expect(rows.some((row) => row.eventTitle === "Veli B etkinlik")).toBe(false);
    expect(rows.some((row) => row.studentName === "Çocuk B")).toBe(false);
  });
});
