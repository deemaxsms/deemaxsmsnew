import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { addressService, SavedAddress } from "@/lib/address-service";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { MapPin, Plus, Loader2, Check } from "lucide-react";

interface AddressSelectorProps {
  selectedAddressId: string;
  onAddressSelect: (addressId: string) => void;
  onAddressChange?: (address: SavedAddress | null) => void;
}

export const AddressSelector = ({ selectedAddressId, onAddressSelect, onAddressChange }: AddressSelectorProps) => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);

  // New address form state
  const [newAddress, setNewAddress] = useState({
    label: '',
    recipientName: '',
    recipientPhone: '',
    recipientEmail: '',
    countryCode: '',
    countryName: '',
    state: '',
    city: '',
    streetName: '',
    houseNumber: '',
    apartment: '',
    landmark: '',
    postalCode: ''
  });

  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    if (user) {
      loadAddresses();
      loadCountries();
    }
  }, [user]);

  useEffect(() => {
    const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
    onAddressChange?.(selectedAddress || null);
  }, [selectedAddressId, addresses, onAddressChange]);

  const loadAddresses = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log(`📍 Loading addresses for user: ${user.uid}`);
      const userAddresses = await addressService.getUserAddresses(user.uid);
      console.log(`📍 Loaded ${userAddresses.length} addresses:`, userAddresses);
      setAddresses(userAddresses);
    } catch (error) {
      console.error('❌ Error loading addresses:', error);
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const loadCountries = async () => {
    setLoadingCountries(true);
    try {
      const countriesData = await addressService.getCountries();
      setCountries(countriesData);
    } catch (error) {
      console.error('Error loading countries:', error);
      toast.error('Failed to load countries');
    } finally {
      setLoadingCountries(false);
    }
  };

  const handleCountryChange = async (countryName: string) => {
    const country = countries.find(c => c.country === countryName);
    if (country) {
      setNewAddress(prev => ({
        ...prev,
        countryName,
        countryCode: country.iso2,
        state: '',
        city: ''
      }));

      // Load states for this country
      setLoadingStates(true);
      try {
        const statesData = await addressService.getStates(countryName);
        setStates(statesData);
        setCities([]);
      } catch (error) {
        console.error('Error loading states:', error);
        toast.error('Failed to load states');
      } finally {
        setLoadingStates(false);
      }
    }
  };

  const handleStateChange = async (stateName: string) => {
    setNewAddress(prev => ({ ...prev, state: stateName, city: '' }));

    // Load cities for this state
    setLoadingCities(true);
    try {
      const citiesData = await addressService.getCities(newAddress.countryName, stateName);
      setCities(citiesData);
    } catch (error) {
      console.error('Error loading cities:', error);
      toast.error('Failed to load cities');
    } finally {
      setLoadingCities(false);
    }
  };

  const validateAndSaveAddress = async () => {
    if (!user) return;

    // Basic validation
    if (!newAddress.label || !newAddress.recipientName || !newAddress.recipientPhone ||
        !newAddress.countryName || !newAddress.state || !newAddress.city ||
        !newAddress.streetName || !newAddress.houseNumber) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    setValidating(true);

    try {
      // Validate address with geocoding
      const validation = await addressService.validateAddress({
        streetName: newAddress.streetName,
        houseNumber: newAddress.houseNumber,
        city: newAddress.city,
        state: newAddress.state,
        country: newAddress.countryName,
        apartment: newAddress.apartment,
        postalCode: newAddress.postalCode
      });

      if (!validation.isValid) {
        toast.error(validation.error || 'Address could not be validated');
        return;
      }

      setValidating(false);

      // Save the address
      const addressData = {
        ...newAddress,
        latitude: validation.coordinates!.latitude,
        longitude: validation.coordinates!.longitude,
        mapPlaceId: validation.coordinates!.placeId,
        addressLine: validation.coordinates!.displayName,
        isDefault: addresses.length === 0, // First address is default
        isVerified: true
      };

      const addressId = await addressService.saveAddress(user.uid, addressData);
      
      console.log(`✅ Address saved with ID: ${addressId}`);
      toast.success('Address saved successfully!');
      
      // Small delay to ensure Firestore propagation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reload addresses and select the new one
      console.log('🔄 Reloading addresses after save...');
      await loadAddresses();
      onAddressSelect(addressId);
      
      console.log(`🎯 Selected new address: ${addressId}`);
      
      // Reset form and close dialog
      setNewAddress({
        label: '',
        recipientName: '',
        recipientPhone: '',
        recipientEmail: '',
        countryCode: '',
        countryName: '',
        state: '',
        city: '',
        streetName: '',
        houseNumber: '',
        apartment: '',
        landmark: '',
        postalCode: ''
      });
      setShowAddForm(false);

    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address');
    } finally {
      setSaving(false);
      setValidating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Label>Delivery Address</Label>
        <div className="flex items-center justify-center p-8 border rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Label>Delivery Address</Label>
      
      {addresses.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No saved addresses</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first delivery address to continue
            </p>
            <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Address
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Address</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Address Label */}
                  <div>
                    <Label htmlFor="label">Address Label *</Label>
                    <Input
                      id="label"
                      placeholder="e.g., Home, Office, Mom's House"
                      value={newAddress.label}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, label: e.target.value }))}
                    />
                  </div>

                  {/* Recipient Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="recipientName">Recipient Name *</Label>
                      <Input
                        id="recipientName"
                        value={newAddress.recipientName}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, recipientName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="recipientPhone">Phone Number *</Label>
                      <Input
                        id="recipientPhone"
                        value={newAddress.recipientPhone}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, recipientPhone: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="recipientEmail">Email (Optional)</Label>
                    <Input
                      id="recipientEmail"
                      type="email"
                      value={newAddress.recipientEmail}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, recipientEmail: e.target.value }))}
                    />
                  </div>

                  {/* Location */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="country">Country *</Label>
                      <Select value={newAddress.countryName} onValueChange={handleCountryChange} disabled={loadingCountries}>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingCountries ? "Loading countries..." : "Select country"} />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingCountries ? (
                            <div className="p-2 text-center text-sm text-muted-foreground">
                              <div className="flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading countries...
                              </div>
                            </div>
                          ) : (
                            countries.map((country) => (
                              <SelectItem key={country.iso2} value={country.country}>
                                {country.country}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Select value={newAddress.state} onValueChange={handleStateChange} disabled={!states.length || loadingStates}>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingStates ? "Loading states..." : "Select state"} />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingStates ? (
                            <div className="p-2 text-center text-sm text-muted-foreground">
                              <div className="flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading states...
                              </div>
                            </div>
                          ) : (
                            states.map((state) => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Select value={newAddress.city} onValueChange={(value) => setNewAddress(prev => ({ ...prev, city: value }))} disabled={!cities.length || loadingCities}>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingCities ? "Loading cities..." : "Select city"} />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingCities ? (
                            <div className="p-2 text-center text-sm text-muted-foreground">
                              <div className="flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading cities...
                              </div>
                            </div>
                          ) : (
                            cities.map((city) => (
                              <SelectItem key={city} value={city}>
                                {city}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Street Address */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="streetName">Street Name *</Label>
                      <Input
                        id="streetName"
                        value={newAddress.streetName}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, streetName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="houseNumber">House Number *</Label>
                      <Input
                        id="houseNumber"
                        value={newAddress.houseNumber}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, houseNumber: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="apartment">Apartment (Optional)</Label>
                      <Input
                        id="apartment"
                        value={newAddress.apartment}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, apartment: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="landmark">Landmark (Optional)</Label>
                      <Input
                        id="landmark"
                        placeholder="e.g., Near City Mall"
                        value={newAddress.landmark}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, landmark: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="postalCode">Postal Code (Optional)</Label>
                      <Input
                        id="postalCode"
                        value={newAddress.postalCode}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={validateAndSaveAddress} disabled={saving} className="flex-1">
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {validating ? 'Validating...' : 'Saving...'}
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Save Address
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddForm(false)} disabled={saving}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {addresses.map((address) => (
            <Card 
              key={address.id} 
              className={`cursor-pointer transition-colors ${
                selectedAddressId === address.id 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => onAddressSelect(address.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{address.label}</h4>
                      {address.isDefault && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium">{address.recipientName}</p>
                    <p className="text-sm text-muted-foreground">
                      {address.houseNumber} {address.streetName}
                      {address.apartment && `, ${address.apartment}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {address.city}, {address.state}, {address.countryName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {address.recipientPhone}
                    </p>
                  </div>
                  {selectedAddressId === address.id && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add New Address
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Address</DialogTitle>
              </DialogHeader>
              {/* Same form content as above */}
              <div className="space-y-4">
                {/* Address Label */}
                <div>
                  <Label htmlFor="label">Address Label *</Label>
                  <Input
                    id="label"
                    placeholder="e.g., Home, Office, Mom's House"
                    value={newAddress.label}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, label: e.target.value }))}
                  />
                </div>

                {/* Recipient Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="recipientName">Recipient Name *</Label>
                    <Input
                      id="recipientName"
                      value={newAddress.recipientName}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, recipientName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="recipientPhone">Phone Number *</Label>
                    <Input
                      id="recipientPhone"
                      value={newAddress.recipientPhone}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, recipientPhone: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="recipientEmail">Email (Optional)</Label>
                  <Input
                    id="recipientEmail"
                    type="email"
                    value={newAddress.recipientEmail}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, recipientEmail: e.target.value }))}
                  />
                </div>

                {/* Location */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="country">Country *</Label>
                    <Select value={newAddress.countryName} onValueChange={handleCountryChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.iso2} value={country.country}>
                            {country.country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Select value={newAddress.state} onValueChange={handleStateChange} disabled={!states.length}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Select value={newAddress.city} onValueChange={(value) => setNewAddress(prev => ({ ...prev, city: value }))} disabled={!cities.length}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Street Address */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="streetName">Street Name *</Label>
                    <Input
                      id="streetName"
                      value={newAddress.streetName}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, streetName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="houseNumber">House Number *</Label>
                    <Input
                      id="houseNumber"
                      value={newAddress.houseNumber}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, houseNumber: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="apartment">Apartment (Optional)</Label>
                    <Input
                      id="apartment"
                      value={newAddress.apartment}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, apartment: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="landmark">Landmark (Optional)</Label>
                    <Input
                      id="landmark"
                      placeholder="e.g., Near City Mall"
                      value={newAddress.landmark}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, landmark: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Postal Code (Optional)</Label>
                    <Input
                      id="postalCode"
                      value={newAddress.postalCode}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={validateAndSaveAddress} disabled={saving} className="flex-1">
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {validating ? 'Validating...' : 'Saving...'}
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Save Address
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)} disabled={saving}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};