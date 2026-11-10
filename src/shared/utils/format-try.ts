/** Formats whole TRY amounts as `1.450 ₺` for the storefront. */
export function formatTryPrice(price: number): string {
  return `${new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(price)} ₺`;
}
