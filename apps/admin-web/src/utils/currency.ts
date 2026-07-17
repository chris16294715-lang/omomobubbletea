export const CURRENCY_SYMBOL = '\u20AC'; // Euro €

/** 欧分 → 金额字符串（不含符号） */
export function formatPrice(cents: number) {
  return (cents / 100).toFixed(2);
}

/** 欧分 → 带欧元符号的金额，如 €5.50 */
export function formatMoney(cents: number) {
  return `${CURRENCY_SYMBOL}${formatPrice(cents)}`;
}

/** 欧元金额字符串 → 欧分 */
export function parsePrice(euro: string) {
  return Math.round(Number(euro) * 100);
}
