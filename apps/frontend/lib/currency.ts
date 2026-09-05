export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'AED';

export const CURRENCIES: Array<{ code: CurrencyCode; label: string; symbol: string; locale: string }> = [
  { code: 'INR', label: 'Indian Rupee (₹)', symbol: '₹', locale: 'en-IN' },
  { code: 'USD', label: 'US Dollar ($)', symbol: '$', locale: 'en-US' },
  { code: 'EUR', label: 'Euro (€)', symbol: '€', locale: 'de-DE' },
  { code: 'GBP', label: 'British Pound (£)', symbol: '£', locale: 'en-GB' },
  { code: 'JPY', label: 'Japanese Yen (¥)', symbol: '¥', locale: 'ja-JP' },
  { code: 'CAD', label: 'Canadian Dollar (C$)', symbol: 'C$', locale: 'en-CA' },
  { code: 'AUD', label: 'Australian Dollar (A$)', symbol: 'A$', locale: 'en-AU' },
  { code: 'AED', label: 'UAE Dirham (AED)', symbol: 'AED', locale: 'en-AE' },
];

export function formatCurrency(amount: number, currencyCode: string = 'INR'): string {
  const currency = CURRENCIES.find((c) => c.code.toUpperCase() === currencyCode.toUpperCase()) || CURRENCIES[0];

  try {
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency.symbol}${amount.toLocaleString()}`;
  }
}
