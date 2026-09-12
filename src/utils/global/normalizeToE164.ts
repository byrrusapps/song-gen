import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';

export function normalizeToE164(raw: string, defaultCountry?: CountryCode): string | null {
  if (!raw || typeof raw !== 'string') return null;

  const cleaned = raw.trim().replace(/[().\- ]+/g, '');

  // 1) Try parsing as-is (handles +country numbers)
  let phone = parsePhoneNumberFromString(cleaned);
  if (phone && phone.isValid()) return phone.number;

  // 2) If it wasn't parseable, try using defaultCountry (for national numbers)
  if (defaultCountry) {
    phone = parsePhoneNumberFromString(cleaned, defaultCountry);
    if (phone && phone.isValid()) return phone.number;
  }

  // not valid or parseable
  return null;
}