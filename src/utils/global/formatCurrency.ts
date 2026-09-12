export interface CurrencyFormatOptions {
  currency?: string;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  notation?: 'standard' | 'compact';
  compactDisplay?: 'short' | 'long';
  style?: 'currency';
  showSymbol?: boolean;
  symbolOnly?: boolean;
  customSymbol?: string | null;
  fallback?: string;
}

export interface CurrencyRangeOptions extends CurrencyFormatOptions {
  separator?: string;
  showBothSymbols?: boolean;
}

export interface DisplayFormatOptions extends CurrencyFormatOptions {
  compact?: boolean;
  abbreviate?: boolean;
}

export type CurrencyCode = 
  | 'NGN' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' 
  | 'AUD' | 'CHF' | 'CNY' | 'INR' | 'BRL' | 'ZAR' 
  | 'KES' | 'GHS' | string;

/**
 * Format currency with Nigerian Naira as default
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number | string | null | undefined, 
  options: CurrencyFormatOptions = {}
): string => {
  const {
    currency = 'NGN',
    locale = 'en-NG',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    notation = 'standard',
    compactDisplay = 'short',
    style = 'currency',
    showSymbol = true,
    symbolOnly = false,
    customSymbol = null,
    fallback = '₦0.00'
  } = options;

  // Handle null/undefined/NaN
  if (amount == null || isNaN(Number(amount))) {
    return fallback;
  }

  const numAmount = Number(amount);

  try {
    // For compact notation (e.g., ₦20M, ₦1.5K)
    if (notation === 'compact') {
      return new Intl.NumberFormat(locale, {
        style,
        currency,
        notation,
        compactDisplay,
        minimumFractionDigits,
        maximumFractionDigits,
      }).format(numAmount);
    }

    // Standard notation
    const formatter = new Intl.NumberFormat(locale, {
      style,
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
    });

    if (symbolOnly) {
      const parts = formatter.formatToParts(numAmount);
      const symbol = parts.find(part => part.type === 'currency');
      return symbol ? symbol.value : customSymbol || getCurrencySymbol(currency);
    }

    if (!showSymbol) {
      const parts = formatter.formatToParts(numAmount);
      return parts
        .filter(part => part.type !== 'currency')
        .map(part => part.value)
        .join('')
        .trim();
    }

    return formatter.format(numAmount);
  } catch (error) {
    console.error('Currency formatting error:', error);
    return fallback;
  }
};

/**
 * Get currency symbol for a given currency code
 */
export const getCurrencySymbol = (currencyCode: CurrencyCode = 'NGN'): string => {
  const symbols: Record<string, string> = {
    NGN: '₦',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'CA$',
    AUD: 'A$',
    CHF: 'CHF',
    CNY: 'CN¥',
    INR: '₹',
    BRL: 'R$',
    ZAR: 'R',
    KES: 'KSh',
    GHS: 'GH₵',
  };

  return symbols[currencyCode.toUpperCase()] || currencyCode;
};

/**
 * Parse formatted currency back to number
 */
export const parseCurrency = (formattedString: string): number => {
  if (!formattedString) return 0;

  try {
    // Remove all non-numeric characters except decimal point and minus
    const numericString = formattedString
      .replace(/[^\d.,-]/g, '')
      .replace(/,/g, '');

    const number = parseFloat(numericString);
    return isNaN(number) ? 0 : number;
  } catch (error) {
    console.error('Currency parsing error:', error);
    return 0;
  }
};

/**
 * Format amount with custom symbol placement
 */
export const formatWithCustomSymbol = (
  amount: number | string, 
  symbol: string = '₦', 
  position: 'before' | 'after' = 'before'
): string => {
  const formattedNumber = formatCurrency(amount, { showSymbol: false });
  
  return position === 'before' 
    ? `${symbol}${formattedNumber}`
    : `${formattedNumber} ${symbol}`;
};

/**
 * Format range of amounts
 */
export const formatCurrencyRange = (
  min: number | string, 
  max: number | string, 
  options: CurrencyRangeOptions = {}
): string => {
  const {
    separator = ' - ',
    showBothSymbols = false,
    ...formatOptions
  } = options;

  const minFormatted = formatCurrency(min, { ...formatOptions, showSymbol: showBothSymbols });
  const maxFormatted = formatCurrency(max, { ...formatOptions, showSymbol: true });

  return `${minFormatted}${separator}${maxFormatted}`;
};

/**
 * Format for display in cards/hero sections
 */
export const formatForDisplay = (
  amount: number | string, 
  options: DisplayFormatOptions = {}
): string => {
  const {
    compact = false,
    abbreviate = true,
    ...rest
  } = options;

  if (compact && Number(amount) >= 1000000 && abbreviate) {
    return formatCurrency(amount, {
      notation: 'compact',
      maximumFractionDigits: 1,
      ...rest
    });
  }

  return formatCurrency(amount, rest);
};

// You might also want to export a default object with all functions
export const currencyFormatter = {
  formatCurrency,
  getCurrencySymbol,
  parseCurrency,
  formatWithCustomSymbol,
  formatCurrencyRange,
  formatForDisplay,
};

export default currencyFormatter;