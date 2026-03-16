import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Globe, Star } from 'lucide-react';
import { Country } from '@/types/sms-types';

interface CountrySelectorProps {
  countries: Country[];
  selectedCountry?: string;
  onSelect: (countryCode: string) => void;
  loading?: boolean;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  countries,
  selectedCountry,
  onSelect,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Popular countries (commonly used for SMS verification)
  const popularCountries = [
    'US', 'GB', 'CA', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE',
    'NO', 'DK', 'FI', 'PL', 'CZ', 'AT', 'CH', 'BE', 'IE', 'PT'
  ];

  // Filter countries
  const filteredCountries = countries.filter(country =>
    country.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.iso2.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.iso3.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get popular countries that exist in our data
  const popularCountryData = countries.filter(country =>
    popularCountries.includes(country.iso2)
  );

  // Get country flag emoji
  const getCountryFlag = (countryCode: string) => {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  // Get country display name with cities count
  const getCountryDisplayInfo = (country: Country) => {
    const citiesCount = country.cities?.length || 0;
    return {
      name: country.country,
      citiesText: citiesCount > 0 ? `${citiesCount} cities` : 'Available'
    };
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search countries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Popular Countries */}
      {!searchTerm && popularCountryData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Popular Countries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {popularCountryData.map((country) => {
                const displayInfo = getCountryDisplayInfo(country);
                return (
                  <Button
                    key={country.iso2}
                    variant={selectedCountry === country.iso2 ? 'default' : 'outline'}
                    className="h-auto p-3 flex flex-col items-center gap-2"
                    onClick={() => onSelect(country.iso2)}
                    disabled={loading}
                  >
                    <span className="text-2xl">{getCountryFlag(country.iso2)}</span>
                    <span className="text-xs font-medium text-center">{displayInfo.name}</span>
                    <span className="text-xs text-gray-500">{country.iso2}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Countries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            All Countries ({filteredCountries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 max-h-96 overflow-y-auto">
            {filteredCountries.map((country) => {
              const displayInfo = getCountryDisplayInfo(country);
              const isPopular = popularCountries.includes(country.iso2);
              
              return (
                <div
                  key={country.iso2}
                  className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                    selectedCountry === country.iso2
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => onSelect(country.iso2)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getCountryFlag(country.iso2)}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{displayInfo.name}</h3>
                          {isPopular && (
                            <Badge variant="secondary" className="text-xs">
                              Popular
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{displayInfo.citiesText}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-mono text-sm font-medium">{country.iso2}</div>
                      <div className="text-xs text-gray-500">{country.iso3}</div>
                    </div>
                  </div>

                  {/* Show some cities if available */}
                  {country.cities && country.cities.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="flex flex-wrap gap-1">
                        {country.cities.slice(0, 5).map((city, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {city}
                          </Badge>
                        ))}
                        {country.cities.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{country.cities.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredCountries.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No countries found matching "{searchTerm}"</p>
              <p className="text-sm">Try adjusting your search terms</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};