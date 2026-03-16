import { PricingConfig, Service } from '../types/sms-types';
import { firestoreService } from '../lib/firestore-service';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

class SMSPricingService {
  private defaultConfig: PricingConfig = {
    defaultMarkup: 0.5, // 50% markup as per documentation
    serviceMarkups: {},
    countryMarkups: {},
    blacklistedCountries: [],
    blacklistedServices: [],
    rentalMarkup: 0.5 // 50% markup for rentals
  };

  // Get pricing configuration from Firestore
  async getPricingConfig(): Promise<PricingConfig> {
    try {
      const configDoc = await getDoc(doc(db, 'sms_config', 'pricing'));
      if (configDoc.exists()) {
        return { ...this.defaultConfig, ...configDoc.data() } as PricingConfig;
      }
      
      // Create default config if it doesn't exist
      await this.savePricingConfig(this.defaultConfig);
      return this.defaultConfig;
    } catch (error) {
      console.error('Error fetching pricing config:', error);
      return this.defaultConfig;
    }
  }

  // Save pricing configuration to Firestore
  async savePricingConfig(config: PricingConfig): Promise<void> {
    try {
      await setDoc(doc(db, 'sms_config', 'pricing'), {
        ...config,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error saving pricing config:', error);
      throw error;
    }
  }

  // Update specific pricing settings
  async updatePricingConfig(updates: Partial<PricingConfig>): Promise<void> {
    try {
      await updateDoc(doc(db, 'sms_config', 'pricing'), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating pricing config:', error);
      throw error;
    }
  }

  // Calculate final price with markup
  calculateFinalPrice(basePrice: number, service: string, country?: string): number {
    const config = this.defaultConfig; // Use cached config for performance
    
    // Check if service or country is blacklisted
    if (config.blacklistedServices.includes(service)) {
      throw new Error(`Service ${service} is not available`);
    }
    
    if (country && config.blacklistedCountries.includes(country)) {
      throw new Error(`Service not available in ${country}`);
    }

    // Get markup percentage
    let markupPercent = config.defaultMarkup;
    
    // Service-specific markup takes precedence
    if (config.serviceMarkups[service]) {
      markupPercent = config.serviceMarkups[service];
    }
    
    // Country-specific markup (additive)
    if (country && config.countryMarkups[country]) {
      markupPercent += config.countryMarkups[country];
    }

    // Calculate final price
    const markupAmount = basePrice * markupPercent;
    return Math.round((basePrice + markupAmount) * 100) / 100; // Round to 2 decimal places
  }

  // Calculate rental prices
  calculateRentalPrices(basePrice: number, service: string, country?: string) {
    const config = this.defaultConfig;
    const finalPrice = this.calculateFinalPrice(basePrice, service, country);
    
    return {
      '3': Math.round(finalPrice * 25 * (1 + config.rentalMarkup)), // 3 days
      '7': Math.round(finalPrice * 35 * (1 + config.rentalMarkup)), // 7 days  
      '30': Math.round(finalPrice * 75 * (1 + config.rentalMarkup)) // 30 days
    };
  }

  // Get service availability with pricing
  async getServiceWithPricing(serviceName: string, country?: string): Promise<Service & { finalPrice: number; rentalPrices?: Record<string, number> }> {
    try {
      // Load services from local JSON first
      const response = await fetch('/json/services.json');
      const data = await response.json();
      const services = data.message || [];
      
      const service = services.find((s: Service) => s.name === serviceName);
      if (!service) {
        throw new Error(`Service ${serviceName} not found`);
      }

      const basePrice = parseFloat(service.price);
      const finalPrice = this.calculateFinalPrice(basePrice, serviceName, country);
      const rentalPrices = this.calculateRentalPrices(basePrice, serviceName, country);

      return {
        ...service,
        finalPrice,
        rentalPrices
      };
    } catch (error) {
      console.error('Error getting service with pricing:', error);
      throw error;
    }
  }

  // Get all services with pricing applied
  async getAllServicesWithPricing(country?: string): Promise<Array<Service & { finalPrice: number; rentalPrices: Record<string, number> }>> {
    try {
      const response = await fetch('/json/services.json');
      const data = await response.json();
      const services = data.message || [];
      
      const config = await this.getPricingConfig();
      
      return services
        .filter((service: Service) => !config.blacklistedServices.includes(service.name))
        .map((service: Service) => {
          const basePrice = parseFloat(service.price);
          const finalPrice = this.calculateFinalPrice(basePrice, service.name, country);
          const rentalPrices = this.calculateRentalPrices(basePrice, service.name, country);
          
          return {
            ...service,
            finalPrice,
            rentalPrices
          };
        })
        .sort((a, b) => a.finalPrice - b.finalPrice); // Sort by price
    } catch (error) {
      console.error('Error getting services with pricing:', error);
      return [];
    }
  }

  // Admin functions for managing pricing
  async setServiceMarkup(service: string, markupPercent: number): Promise<void> {
    const config = await this.getPricingConfig();
    config.serviceMarkups[service] = markupPercent;
    await this.savePricingConfig(config);
  }

  async setCountryMarkup(country: string, markupPercent: number): Promise<void> {
    const config = await this.getPricingConfig();
    config.countryMarkups[country] = markupPercent;
    await this.savePricingConfig(config);
  }

  async blacklistService(service: string): Promise<void> {
    const config = await this.getPricingConfig();
    if (!config.blacklistedServices.includes(service)) {
      config.blacklistedServices.push(service);
      await this.savePricingConfig(config);
    }
  }

  async unblacklistService(service: string): Promise<void> {
    const config = await this.getPricingConfig();
    config.blacklistedServices = config.blacklistedServices.filter(s => s !== service);
    await this.savePricingConfig(config);
  }

  async blacklistCountry(country: string): Promise<void> {
    const config = await this.getPricingConfig();
    if (!config.blacklistedCountries.includes(country)) {
      config.blacklistedCountries.push(country);
      await this.savePricingConfig(config);
    }
  }

  async unblacklistCountry(country: string): Promise<void> {
    const config = await this.getPricingConfig();
    config.blacklistedCountries = config.blacklistedCountries.filter(c => c !== country);
    await this.savePricingConfig(config);
  }
}

export const smsPricingService = new SMSPricingService();