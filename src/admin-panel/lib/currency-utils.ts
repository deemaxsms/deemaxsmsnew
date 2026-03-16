// Currency conversion utilities for admin panel

// Exchange rate (you can make this dynamic by fetching from an API)
const USD_TO_NGN_RATE = 1650; // Update this rate as needed

export interface CurrencyDisplay {
  usd: string;
  ngn: string;
  usdValue: number;
  ngnValue: number;
}

export function formatCurrency(usdAmount: number, showBoth: boolean = true): CurrencyDisplay {
  // Handle invalid numbers
  if (typeof usdAmount !== 'number' || isNaN(usdAmount)) {
    return {
      usd: '$0.00',
      ngn: '₦0',
      usdValue: 0,
      ngnValue: 0
    };
  }

  // The amount from DB is already in USD, so we convert TO NGN
  const usdValue = usdAmount;
  const ngnValue = usdAmount * USD_TO_NGN_RATE;

  return {
    usd: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(usdValue),
    ngn: new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(ngnValue),
    usdValue,
    ngnValue
  };
}

export function formatUSDWithNGN(usdAmount: number): string {
  const currency = formatCurrency(usdAmount);
  return `${currency.usd} (${currency.ngn})`;
}

export function formatNGNWithUSD(usdAmount: number): string {
  const currency = formatCurrency(usdAmount);
  return `${currency.ngn} (${currency.usd})`;
}

// For displaying in stats cards - USD primary, NGN secondary
export function formatStatsAmount(usdAmount: number): { primary: string; secondary: string } {
  const currency = formatCurrency(usdAmount);
  return {
    primary: currency.usd,    // Show USD as primary
    secondary: currency.ngn   // Show NGN as secondary (converted)
  };
}

export function getCurrentExchangeRate(): number {
  return USD_TO_NGN_RATE;
}

// You can add a function to update the exchange rate dynamically
export async function updateExchangeRate(): Promise<number> {
  try {
    // In a real app, you'd fetch from an API like:
    // const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    // const data = await response.json();
    // return data.rates.NGN;
    
    // For now, return the static rate
    return USD_TO_NGN_RATE;
  } catch (error) {
    console.error('Failed to update exchange rate:', error);
    return USD_TO_NGN_RATE;
  }
}