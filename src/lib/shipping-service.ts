// Shipping Fee Calculation Service for Gift Delivery System
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
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
      console.log('✅ Shipping rates loaded:', this.shippingRatesCache.length, 'rates');
    } catch (error) {
      console.error('Error loading shipping rates:', error);
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

      // If admin has overridden the fee
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
            component: 'Admin Override',
            amount: options.adminOverride,
            description: 'Shipping fee set by admin'
          }]
        };
      }

      // Find shipping rate for destination country
      const shippingRate = this.shippingRatesCache.find(rate => 
        rate.fromCountry === this.HOME_COUNTRY && 
        rate.toCountry === deliveryAddress.countryCode
      );

      if (!shippingRate) {
        throw new Error(`No shipping rate found for ${deliveryAddress.countryName}`);
      }

      // Calculate components
      const baseFee = shippingRate.baseFee;
      const weightFee = gift.weight * shippingRate.ratePerKg;
      
      // Distance calculation
      const distance = addressService.calculateDistance(
        this.HOME_COORDINATES.lat,
        this.HOME_COORDINATES.lng,
        deliveryAddress.latitude,
        deliveryAddress.longitude
      );
      const distanceFee = distance * shippingRate.ratePerKm;

      // Size fee
      const sizeFeeData = this.sizeFeesCache.find(sf => sf.sizeClass === gift.sizeClass);
      const sizeFee = sizeFeeData?.baseFee || 0;

      // Fragile fee (percentage of base fee)
      const fragileFee = gift.isFragile ? (baseFee * 0.2) : 0; // 20% of base fee

      // Calculate subtotal
      const subtotal = baseFee + weightFee + distanceFee + sizeFee + fragileFee;

      // Apply multipliers
      const isInternational = deliveryAddress.countryCode !== this.HOME_COUNTRY;
      const internationalMultiplier = isInternational ? shippingRate.internationalMultiplier : 1;
      const fragileMultiplier = gift.isFragile ? shippingRate.fragileMultiplier : 1;

      // Final calculation
      const totalFee = Math.round(subtotal * internationalMultiplier * fragileMultiplier * 100) / 100;

      // Build breakdown
      const breakdown = [
        {
          component: 'Base Fee',
          amount: baseFee,
          description: `Base shipping to ${deliveryAddress.countryName}`
        },
        {
          component: 'Weight Fee',
          amount: weightFee,
          description: `${gift.weight}kg × $${shippingRate.ratePerKg}/kg`
        },
        {
          component: 'Distance Fee',
          amount: distanceFee,
          description: `${Math.round(distance)}km × $${shippingRate.ratePerKm}/km`
        }
      ];

      if (sizeFee > 0) {
        breakdown.push({
          component: 'Size Fee',
          amount: sizeFee,
          description: `${gift.sizeClass} package`
        });
      }

      if (fragileFee > 0) {
        breakdown.push({
          component: 'Fragile Handling',
          amount: fragileFee,
          description: 'Special handling for fragile items'
        });
      }

      if (internationalMultiplier > 1) {
        breakdown.push({
          component: 'International Multiplier',
          amount: subtotal * (internationalMultiplier - 1),
          description: `${((internationalMultiplier - 1) * 100).toFixed(0)}% international fee`
        });
      }

      if (fragileMultiplier > 1) {
        breakdown.push({
          component: 'Fragile Multiplier',
          amount: subtotal * internationalMultiplier * (fragileMultiplier - 1),
          description: `${((fragileMultiplier - 1) * 100).toFixed(0)}% fragile multiplier`
        });
      }

      return {
        baseFee,
        weightFee,
        distanceFee,
        sizeFee,
        fragileFee,
        subtotal,
        internationalMultiplier,
        fragileMultiplier,
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
      
      const rate = this.shippingRatesCache.find(r => 
        r.fromCountry === this.HOME_COUNTRY && r.toCountry === countryCode
      );
      
      if (!rate) {
        return 7; // Default 7 days if no specific rate found
      }
      
      // Estimate based on distance and country
      if (countryCode === this.HOME_COUNTRY) {
        return 2; // Domestic delivery
      } else if (['GH', 'BJ', 'TG', 'CM'].includes(countryCode)) {
        return 3; // West African neighbors
      } else if (['KE', 'UG', 'TZ', 'ZA'].includes(countryCode)) {
        return 5; // Other African countries
      } else {
        return 7; // International
      }
    } catch (error) {
      console.error('Error getting delivery estimate:', error);
      return 7; // Default fallback
    }
  }

  /**
   * Check if shipping is available to a country
   */
  async isShippingAvailable(countryCode: string): Promise<boolean> {
    try {
      await this.loadShippingRates();
      
      return this.shippingRatesCache.some(rate => 
        rate.fromCountry === this.HOME_COUNTRY && 
        rate.toCountry === countryCode &&
        rate.isActive
      );
    } catch (error) {
      console.error('Error checking shipping availability:', error);
      return false;
    }
  }

  /**
   * Get all countries where shipping is available
   */
  async getAvailableShippingCountries(): Promise<string[]> {
    try {
      await this.loadShippingRates();
      
      return this.shippingRatesCache
        .filter(rate => rate.fromCountry === this.HOME_COUNTRY && rate.isActive)
        .map(rate => rate.toCountry);
    } catch (error) {
      console.error('Error getting available countries:', error);
      return [];
    }
  }

  /**
   * Format shipping fee breakdown for display
   */
  formatShippingBreakdown(calculation: ShippingCalculation): string {
    const lines = calculation.breakdown.map(item => 
      `${item.component}: $${item.amount.toFixed(2)} (${item.description})`
    );
    
    lines.push(`Total: $${calculation.totalFee.toFixed(2)}`);
    
    return lines.join('\n');
  }

  /**
   * Get shipping rate for admin editing
   */
  async getShippingRate(fromCountry: string, toCountry: string): Promise<ShippingRate | null> {
    try {
      await this.loadShippingRates();
      
      return this.shippingRatesCache.find(rate => 
        rate.fromCountry === fromCountry && rate.toCountry === toCountry
      ) || null;
    } catch (error) {
      console.error('Error getting shipping rate:', error);
      return null;
    }
  }

  /**
   * Clear cache (useful for admin updates)
   */
  clearCache(): void {
    this.shippingRatesCache = [];
    this.sizeFeesCache = [];
    this.cacheTimestamp = 0;
    console.log('✅ Shipping cache cleared');
  }
}

export const shippingService = new ShippingService();