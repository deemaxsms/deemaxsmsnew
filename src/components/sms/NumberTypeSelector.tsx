import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Zap, Calendar, DollarSign, CheckCircle } from 'lucide-react';
import { Service } from '@/types/sms-types';

interface NumberTypeSelectorProps {
  selectedType?: 'one-time' | 'rental';
  selectedDuration?: number;
  onSelect: (type: 'one-time' | 'rental', duration?: number) => void;
  service?: string;
  country?: string;
  services: Array<Service & { finalPrice: number; rentalPrices: Record<string, number> }>;
}

export const NumberTypeSelector: React.FC<NumberTypeSelectorProps> = ({
  selectedType,
  selectedDuration,
  onSelect,
  service,
  country,
  services
}) => {
  // Get current service data
  const currentService = services.find(s => s.name === service);
  const basePrice = currentService?.finalPrice || 0;
  const rentalPrices = currentService?.rentalPrices || {};

  // Rental options
  const rentalOptions = [
    {
      duration: 3,
      label: '3 Days',
      description: 'Perfect for quick verifications',
      price: rentalPrices['3'] || basePrice * 25,
      popular: false
    },
    {
      duration: 7,
      label: '1 Week',
      description: 'Good for ongoing projects',
      price: rentalPrices['7'] || basePrice * 35,
      popular: true
    },
    {
      duration: 30,
      label: '1 Month',
      description: 'Best value for long-term use',
      price: rentalPrices['30'] || basePrice * 75,
      popular: false
    }
  ];

  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)}`;
  };

  const calculateSavings = (rentalPrice: number, duration: number) => {
    const oneTimeTotal = basePrice * duration;
    const savings = ((oneTimeTotal - rentalPrice) / oneTimeTotal) * 100;
    return Math.max(0, Math.round(savings));
  };

  return (
    <div className="space-y-6">
      {/* Service Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Selected Service</h3>
              <p className="text-gray-600">{service} • {country}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{formatPrice(basePrice)}</div>
              <div className="text-sm text-gray-600">per use</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Number Type Options */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* One-Time Use */}
        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${
            selectedType === 'one-time' 
              ? 'border-blue-500 bg-blue-50 shadow-md' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => onSelect('one-time')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" />
              One-Time Use
              {selectedType === 'one-time' && (
                <CheckCircle className="h-5 w-5 text-blue-500 ml-auto" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold text-orange-600">
              {formatPrice(basePrice)}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>15 minutes duration</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-gray-500" />
                <span>Instant activation</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span>Pay per use</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Best for:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Quick account verifications</li>
                <li>• One-time app registrations</li>
                <li>• Testing purposes</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Rental */}
        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${
            selectedType === 'rental' 
              ? 'border-green-500 bg-green-50 shadow-md' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => onSelect('rental', selectedDuration || 7)}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-500" />
              Long-Term Rental
              {selectedType === 'rental' && (
                <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold text-green-600">
              {formatPrice(rentalPrices['7'] || basePrice * 35)}
              <span className="text-lg font-normal text-gray-600">/week</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>Extended duration</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span>Better value for multiple uses</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-gray-500" />
                <span>Renewable</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Best for:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Multiple verifications</li>
                <li>• Ongoing projects</li>
                <li>• Business use cases</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rental Duration Options */}
      {selectedType === 'rental' && (
        <Card>
          <CardHeader>
            <CardTitle>Choose Rental Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4">
              {rentalOptions.map((option) => {
                const savings = calculateSavings(option.price, option.duration);
                
                return (
                  <div
                    key={option.duration}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedDuration === option.duration
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => onSelect('rental', option.duration)}
                  >
                    <div className="text-center space-y-2">
                      {option.popular && (
                        <Badge className="mb-2">Most Popular</Badge>
                      )}
                      
                      <h3 className="font-semibold text-lg">{option.label}</h3>
                      <p className="text-sm text-gray-600">{option.description}</p>
                      
                      <div className="text-2xl font-bold text-green-600">
                        {formatPrice(option.price)}
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        {formatPrice(Math.round(option.price / option.duration))} per day
                      </div>

                      {savings > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          Save {savings}%
                        </Badge>
                      )}

                      {selectedDuration === option.duration && (
                        <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Rental Benefits</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Keep the same number for the entire duration</li>
                <li>• Receive unlimited SMS messages</li>
                <li>• Extend rental period anytime</li>
                <li>• Better value for multiple verifications</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};