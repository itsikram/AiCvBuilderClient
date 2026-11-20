const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

/** Replaces Bangla digits (০-৯) with ASCII ones. */
export const toAsciiDigits = (value: string) => value.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));

/**
 * Formats a Bangladeshi mobile number as "+880 1XXX-XXXXXX", accepting the
 * common ways people type it (01712345678, 8801712345678, +88 017..., Bangla
 * digits, spaces or dashes). Anything else (landlines, foreign numbers) is
 * returned unchanged apart from trimming.
 */
export const formatBdMobile = (value: string): string => {
  const compact = toAsciiDigits(value).replace(/[\s\-().]/g, "");
  const match = compact.match(/^(?:\+?880|00880)?0?(1[3-9]\d{8})$/);
  if (!match) return value.trim();
  const n = match[1];
  return `+880 ${n.slice(0, 4)}-${n.slice(4)}`;
};
