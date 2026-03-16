// Price markup configuration
// We add a markup percentage to all prices from the API to ensure profit margin
export const PRICE_MARKUP_PERCENTAGE = 15; // 15% markup

export const applyPriceMarkup = (apiPrice: number): number => {
  return Number((apiPrice * (1 + PRICE_MARKUP_PERCENTAGE / 100)).toFixed(2));
};

export const formatPrice = (price: number): string => {
  return `$${price.toFixed(2)}`;
};
