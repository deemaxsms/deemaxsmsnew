// Shipping Fee Calculation Service for Gift Delivery System
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { addressService } from './address-service';

// Types
export interface ShippingRate {
  id: string;
  fromCountry: string;
  toCountry: string;
  baseFee: number;
  ratePerKg: number;
  ratePerKm: number;
  internationalMultiplier: number;
  fragileMultiplier: number;
  isActive: boolean;
}

export interface SizeFee {
  id: string;
  sizeClass: 'small' | 'medium' | 'large';
  baseFee: number;
  description: string;
}

export interface Gift {
  id: string;
  title: string;
  weight: number; // kg
  sizeClass: 'small' | 'medium' | 'large';
  isFragile: boolean;
  dimensions?: {
    length: number; // cm
    width: number;
    height: number;
  };
}

export interface ShippingCalculation {
  baseFee: number;
  weightFee: number;
  distanceFee: number;
  sizeFee: number;
  fragileFee: number;
  subtotal: number;
  internationalMultiplier: number;
  fragileMultiplier: number;
  totalFee: number;
  currency: string;
  breakdown: {
    component: string;
    amount: number;
    description: string;
  }[];
}

export interface DeliveryAddress {
  countryCode: string;
  countryName: string;
  state: string;
  city: string;
  latitude: number;
  longitude: number;
}

class ShippingService {
  private readonly HOME_COUNTRY = 'NG'; // Your base country
  private readonly HOME_COORDINATES = { lat: 6.5244, lng: 3.3792 }; // Lagos, Nigeria
  
  // Cache for shipping rates
  private shippingRatesCache: ShippingRate[] = [];
  private sizeFeesCache: SizeFee[] = [];
  private cacheTimestamp = 0;
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  // ===== CACHE MANAGEMENT =====

  private async loadShippingRates(): Promise<void> {
    const now = Date.now();
    if (this.shippingRatesCache.length > 0 && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
      return; // Use cached data
    }

    try {
      // Load shipping rates
      const ratesQuery = query(
        collection(db, 'shipping_rates'),
        where('isActive', '==', true)
      );
      const ratesSnapshot = await getDocs(ratesQuery);
      this.shippingRatesCache = ratesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ShippingRate));

      // Load size fees
      const sizeFeesSnapshot = await getDocs(collection(db, 'shipping_size_fees'));
      this.sizeFeesCache = sizeFeesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SizeFee));

      this.cacheTimestamp = now;
      console.log('✅ Shipping rates and size fees cached');
    } catch (error) {
      console.error('Error loading shipping data:', error);
      throw error;
    }
  }

  // ===== SHIPPING FEE CALCULATION =====

  /**
   * Calculate shipping fee for a gift to a specific address
   */
  async calculateShippingFee(
    gift: Gift,
    deliveryAddress: DeliveryAddress,
    options: {
      adminOverride?: number;
      currency?: string;
    } = {}
  ): Promise<ShippingCalculation> {
    try {
      await this.loadShippingRates();

      // Handle Admin Override
      if (options.adminOverride && options.adminOverride > 0) {
        return {
          baseFee: 0,
          weightFee: 0,
          distanceFee: 0,
          sizeFee: 0,
          fragileFee: 0,
          subtotal: options.adminOverride,
          internationalMultiplier: 1,
          fragileMultiplier: 1,
          totalFee: options.adminOverride,
          currency: options.currency || 'USD',
          breakdown: [{
            component: 'Adjustment',
            amount: options.adminOverride,
            description: 'Shipping fee set by admin'
          }]
        };
      }

      // Find shipping rate for destination
      const shippingRate = this.shippingRatesCache.find(rate => 
        rate.fromCountry === this.HOME_COUNTRY && 
        rate.toCountry === deliveryAddress.countryCode
      );

      if (!shippingRate) {
        throw new Error(`Shipping is currently unavailable to ${deliveryAddress.countryName}`);
      }

      // 1. Calculate Base Components
      const baseFee = shippingRate.baseFee;
      const weightFee = gift.weight * shippingRate.ratePerKg;
      
      // Distance calculation with fallback to avoid NaN
      const destLat = deliveryAddress.latitude || this.HOME_COORDINATES.lat;
      const destLng = deliveryAddress.longitude || this.HOME_COORDINATES.lng;
      
      const distance = addressService.calculateDistance(
        this.HOME_COORDINATES.lat,
        this.HOME_COORDINATES.lng,
        destLat,
        destLng
      );
      const distanceFee = distance * shippingRate.ratePerKm;

      // Size and handling
      const sizeFeeData = this.sizeFeesCache.find(sf => sf.sizeClass === gift.sizeClass);
      const sizeFee = sizeFeeData?.baseFee || 0;
      const fragileFee = gift.isFragile ? (baseFee * 0.2) : 0; // 20% surcharge for handling

      // 2. Subtotal and Multipliers
      const subtotal = baseFee + weightFee + distanceFee + sizeFee + fragileFee;
      const isInternational = deliveryAddress.countryCode !== this.HOME_COUNTRY;
      const intlMultiplier = isInternational ? shippingRate.internationalMultiplier : 1;
      const fragMultiplier = gift.isFragile ? shippingRate.fragileMultiplier : 1;

      // 3. Final Total (Compounding Multipliers)
      const totalFee = Number((subtotal * intlMultiplier * fragMultiplier).toFixed(2));

      // 4. Build Detailed Breakdown
      const breakdown = [
        {
          component: 'Base Fee',
          amount: baseFee,
          description: `Standard rate to ${deliveryAddress.countryName}`
        },
        {
          component: 'Logistics',
          amount: Number((weightFee + distanceFee).toFixed(2)),
          description: `${gift.weight}kg over ${Math.round(distance)}km`
        }
      ];

      if (sizeFee > 0) {
        breakdown.push({
          component: 'Size Surcharge',
          amount: sizeFee,
          description: `${gift.sizeClass} package class`
        });
      }

      // Consolidate multipliers into a "Premium Handling" line if they exist
      if (intlMultiplier > 1 || fragMultiplier > 1 || fragileFee > 0) {
        const premiumAmount = Number((totalFee - (baseFee + weightFee + distanceFee + sizeFee)).toFixed(2));
        breakdown.push({
          component: 'Premium Handling',
          amount: premiumAmount,
          description: 'International/Fragile handling surcharges'
        });
      }

      return {
        baseFee,
        weightFee,
        distanceFee,
        sizeFee,
        fragileFee,
        subtotal,
        internationalMultiplier: intlMultiplier,
        fragileMultiplier: fragMultiplier,
        totalFee,
        currency: options.currency || 'USD',
        breakdown
      };

    } catch (error) {
      console.error('Error calculating shipping fee:', error);
      throw error;
    }
  }

  /**
   * Get estimated delivery time for a destination
   */
  async getEstimatedDeliveryDays(countryCode: string): Promise<number> {
    try {
      await this.loadShippingRates();
      
      if (countryCode === this.HOME_COUNTRY) return 2; // Domestic
      
      // Regional Logistics Logic
      const westAfricanNeighbors = ['GH', 'BJ', 'TG', 'CM'];
      if (westAfricanNeighbors.includes(countryCode)) return 3;

      const fastTrackAfrica = ['KE', 'UG', 'ZA', 'RW'];
      if (fastTrackAfrica.includes(countryCode)) return 5;
      
      return 7; // General International
    } catch (error) {
      console.error('Error getting delivery estimate:', error);
      return 7;
    }
  }

  /**
   * Check if shipping is available to a country
   */
  async isShippingAvailable(countryCode: string): Promise<boolean> {
    try {
      await this.loadShippingRates();
      return this.shippingRatesCache.some(rate => 
        rate.toCountry === countryCode && rate.isActive
      );
    } catch {
      return false;
    }
  }

  /**
   * Get all countries where shipping is available
   */
  async getAvailableShippingCountries(): Promise<string[]> {
    try {
      await this.loadShippingRates();
      return [...new Set(this.shippingRatesCache.map(rate => rate.toCountry))];
    } catch {
      return [];
    }
  }

  /**
   * Format shipping fee breakdown for display
   */
  formatShippingBreakdown(calculation: ShippingCalculation): string {
    const lines = calculation.breakdown.map(item => 
      `${item.component}: $${item.amount.toFixed(2)}`
    );
    lines.push(`Total: $${calculation.totalFee.toFixed(2)}`);
    return lines.join('\n');
  }

  /**
   * Get shipping rate for admin editing
   */
  async getShippingRate(fromCountry: string, toCountry: string): Promise<ShippingRate | null> {
    await this.loadShippingRates();
    return this.shippingRatesCache.find(rate => 
      rate.fromCountry === fromCountry && rate.toCountry === toCountry
    ) || null;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.shippingRatesCache = [];
    this.sizeFeesCache = [];
    this.cacheTimestamp = 0;
    console.log('✅ Shipping cache cleared');
  }
}

export const shippingService = new ShippingService();