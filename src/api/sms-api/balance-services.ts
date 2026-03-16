/* eslint-disable @typescript-eslint/no-explicit-any */
import { callTellabotAPI, SMSService, TellabotResponse, calculateMarkupPrice } from "./utils";

// Balance & Services API
export const balanceApi = {
  // Get user balance from Tellabot
  async getTellabotBalance(): Promise<number> {
    const response = await callTellabotAPI({ cmd: 'balance' });
    
    if (response.status === 'error') {
      throw new Error(`Failed to get balance: ${response.message}`);
    }
    
    const balance = parseFloat(response.message);
    if (isNaN(balance)) {
      throw new Error('Invalid balance response from provider');
    }
    
    return balance;
  },

  // List available services
  async getServices(serviceNames?: string[]): Promise<SMSService[]> {
    try {
      // Load services from local JSON file
      const response = await fetch('/json/services.json');
      const data = await response.json();
      
      if (data.status !== 'ok' || !Array.isArray(data.message)) {
        throw new Error('Invalid services data format');
      }
      
      let services = data.message.map((service: any) => ({
      name: service.name,
      displayName: service.name,
      // Prefer explicit icon set in JSON; otherwise use API endpoint which returns an icon for the service name
      icon: service.icon || `/api/service-icon?name=${encodeURIComponent(service.name)}`,
        basePrice: parseFloat(service.price),
        markupPrice: calculateMarkupPrice(parseFloat(service.price)),
        ltrPrice: service.ltr_price ? parseFloat(service.ltr_price) : undefined,
        ltrMarkupPrice: service.ltr_price ? calculateMarkupPrice(parseFloat(service.ltr_price)) : undefined,
        ltrShortPrice: service.ltr_short_price ? parseFloat(service.ltr_short_price) : undefined,
        ltrShortMarkupPrice: service.ltr_short_price ? calculateMarkupPrice(parseFloat(service.ltr_short_price)) : undefined,
        available: service.available ? parseInt(service.available) : 0,
        ltrAvailable: service.ltr_available ? parseInt(service.ltr_available) : undefined,
        recommendedMarkup: service.recommended_markup ? parseInt(service.recommended_markup) : 0
      }));
      
      // Filter by service names if provided
      if (serviceNames && serviceNames.length > 0) {
        services = services.filter(service => serviceNames.includes(service.name));
      }
      
      return services;
    } catch (error) {
      console.error('Error loading services:', error);
      throw new Error('Failed to load services from local data');
    }
  }
};

// Re-export calculateMarkupPrice for use in other files
export { calculateMarkupPrice };