/** Accept Brazilian currency with optional thousands separators. */
export function parseBRL(input: string): number {
  const value = input.trim().replace(/^R\$\s*/, '').trim();
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(value)) return NaN;
  return Number(value.replace(/\./g, '').replace(',', '.'));
}
