import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Star, Phone } from 'lucide-react';
import { USState } from '@/types/sms-types';
import { usStatesData } from '@/data/countries';

interface USLocationSelectorProps {
  selectedState?: string;
  selectedAreaCode?: string;
  onSelectState: (stateCode: string) => void;
  onSelectAreaCode: (areaCode: string) => void;
  loading?: boolean;
}

export const USLocationSelector: React.FC<USLocationSelectorProps> = ({
  selectedState,
  selectedAreaCode,
  onSelectState,
  onSelectAreaCode,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'states' | 'areacodes'>('states');

  // Popular states (commonly used for SMS verification)
  const popularStates = ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'];

  // Filter states
  const filteredStates = usStatesData.filter(state =>
    state.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    state.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get popular states data
  const popularStatesData = usStatesData.filter(state =>
    popularStates.includes(state.code)
  );

  // Get area codes for selected state
  const selectedStateData = usStatesData.find(s => s.code === selectedState);
  const availableAreaCodes = selectedStateData?.areaCodes || [];

  // Filter area codes
  const filteredAreaCodes = availableAreaCodes.filter(areaCode =>
    areaCode.includes(searchTerm)
  );

  const handleStateSelect = (stateCode: string) => {
    onSelectState(stateCode);
    // Clear area code selection when state changes
    if (selectedAreaCode) {
      onSelectAreaCode('');
    }
  };

  const handleAreaCodeSelect = (areaCode: string) => {
    onSelectAreaCode(areaCode);
  };

  const clearSelection = () => {
    onSelectState('');
    onSelectAreaCode('');
    setSearchTerm('');
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5 text-primary" />
          US Location Targeting
          <Badge variant="secondary" className="ml-auto">
            US Only
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Choose a US state or area code for geo-targeted numbers (optional)
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={viewMode === 'states' ? "Search states..." : "Search area codes..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            disabled={loading}
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'states' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('states')}
            disabled={loading}
          >
            <MapPin className="h-4 w-4 mr-1" />
            States
          </Button>
          <Button
            variant={viewMode === 'areacodes' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('areacodes')}
            disabled={loading || !selectedState}
          >
            <Phone className="h-4 w-4 mr-1" />
            Area Codes
          </Button>
          {(selectedState || selectedAreaCode) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              disabled={loading}
              className="ml-auto"
            >
              Clear Selection
            </Button>
          )}
        </div>

        {/* Current Selection */}
        {(selectedState || selectedAreaCode) && (
          <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
            {selectedState && (
              <Badge variant="default" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {selectedStateData?.name} ({selectedState})
              </Badge>
            )}
            {selectedAreaCode && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {selectedAreaCode}
              </Badge>
            )}
          </div>
        )}

        {/* States View */}
        {viewMode === 'states' && (
          <div className="space-y-4">
            {/* Popular States */}
            {!searchTerm && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">Popular States</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {popularStatesData.map((state) => (
                    <Button
                      key={state.code}
                      variant={selectedState === state.code ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStateSelect(state.code)}
                      disabled={loading}
                      className="justify-start text-left h-auto p-2"
                    >
                      <div className="flex flex-col items-start min-w-0">
                        <span className="font-medium text-xs truncate w-full">
                          {state.code}
                        </span>
                        <span className="text-xs text-muted-foreground truncate w-full">
                          {state.name}
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* All States */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">
                  {searchTerm ? 'Search Results' : 'All States'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {filteredStates.length} states
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredStates.map((state) => (
                    <Button
                      key={state.code}
                      variant={selectedState === state.code ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStateSelect(state.code)}
                      disabled={loading}
                      className="justify-between h-auto p-3"
                    >
                      <div className="flex flex-col items-start min-w-0">
                        <span className="font-medium text-sm">
                          {state.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {state.areaCodes.length} area codes
                        </span>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {state.code}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Area Codes View */}
        {viewMode === 'areacodes' && selectedState && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Area Codes for {selectedStateData?.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {filteredAreaCodes.length} area codes
              </span>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                {filteredAreaCodes.map((areaCode) => (
                  <Button
                    key={areaCode}
                    variant={selectedAreaCode === areaCode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleAreaCodeSelect(areaCode)}
                    disabled={loading}
                    className="h-10 text-sm font-mono"
                  >
                    {areaCode}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* No Area Codes Message */}
        {viewMode === 'areacodes' && !selectedState && (
          <div className="text-center py-8 text-muted-foreground">
            <Phone className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Select a state first to view area codes</p>
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
          <p className="font-medium mb-1">Geo-targeting Information:</p>
          <ul className="space-y-1">
            <li>• Area code takes precedence over state selection</li>
            <li>• Geo-targeting is optional - leave blank for any US location</li>
            <li>• May limit available numbers for specific services</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};