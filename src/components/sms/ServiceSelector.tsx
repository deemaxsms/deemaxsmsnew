import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Star, Zap, Clock } from 'lucide-react';
import { Service } from '@/types/sms-types';

interface ServiceSelectorProps {
  services: Array<Service & { finalPrice: number; rentalPrices: Record<string, number> }>;
  selectedService?: string;
  onSelect: (serviceName: string) => void;
  loading?: boolean;
}

export const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  services,
  selectedService,
  onSelect,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'popularity'>('popularity');

  // Filter and sort services
  const filteredServices = services
    .filter(service => 
      service.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          return a.finalPrice - b.finalPrice;
        case 'popularity':
          return parseInt(b.available.toString()) - parseInt(a.available.toString());
        default:
          return 0;
      }
    });

  // Popular services (top 10 by availability)
  const popularServices = services
    .sort((a, b) => parseInt(b.available.toString()) - parseInt(a.available.toString()))
    .slice(0, 10);

  const getServiceIcon = (serviceName: string) => {
    // You can add custom icons for popular services
    const iconMap: Record<string, string> = {
      'WhatsApp': '💬',
      'Telegram': '✈️',
      'Discord': '🎮',
      'Instagram': '📷',
      'Facebook': '👥',
      'Twitter': '🐦',
      'Google': '🔍',
      'Amazon': '📦',
      'Apple': '🍎',
      'Microsoft': '🪟'
    };
    
    return iconMap[serviceName] || '🔗';
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={sortBy === 'popularity' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('popularity')}
              >
                <Star className="h-4 w-4 mr-1" />
                Popular
              </Button>
              <Button
                variant={sortBy === 'price' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('price')}
              >
                Price
              </Button>
              <Button
                variant={sortBy === 'name' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('name')}
              >
                A-Z
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Popular Services */}
      {!searchTerm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Popular Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {popularServices.map((service) => (
                <Button
                  key={service.name}
                  variant={selectedService === service.name ? 'default' : 'outline'}
                  className="h-auto p-3 flex flex-col items-center gap-2"
                  onClick={() => onSelect(service.name)}
                  disabled={loading}
                >
                  <span className="text-2xl">{getServiceIcon(service.name)}</span>
                  <span className="text-xs font-medium">{service.name}</span>
                  <span className="text-xs text-gray-500">${service.finalPrice}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Services */}
      <Card>
        <CardHeader>
          <CardTitle>
            All Services ({filteredServices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {filteredServices.map((service) => (
              <div
                key={service.name}
                className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  selectedService === service.name
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onSelect(service.name)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getServiceIcon(service.name)}</span>
                    <div>
                      <h3 className="font-semibold">{service.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Zap className="h-3 w-3" />
                        <span>{service.available} available</span>
                        {service.ltr_available && (
                          <>
                            <Clock className="h-3 w-3 ml-2" />
                            <span>{service.ltr_available} long-term</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-bold text-lg">${service.finalPrice}</div>
                    <div className="text-xs text-gray-500">
                      Base: ${service.price}
                    </div>
                    {service.rentalPrices && (
                      <div className="text-xs text-blue-600 mt-1">
                        Rental from ${Math.min(...Object.values(service.rentalPrices))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Service badges */}
                <div className="flex gap-2 mt-3">
                  {parseInt(service.available.toString()) > 100 && (
                    <Badge variant="secondary" className="text-xs">
                      High Availability
                    </Badge>
                  )}
                  {service.ltr_available && parseInt(service.ltr_available.toString()) > 50 && (
                    <Badge variant="outline" className="text-xs">
                      Long-term Available
                    </Badge>
                  )}
                  {service.recommended_markup && (
                    <Badge variant="default" className="text-xs">
                      Recommended
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredServices.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No services found matching "{searchTerm}"</p>
              <p className="text-sm">Try adjusting your search terms</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};