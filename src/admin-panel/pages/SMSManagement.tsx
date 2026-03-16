import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  MessageSquare, 
  Settings, 
  DollarSign, 
  Globe, 
  Ban, 
  RefreshCw,
  Save,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Users,
  Phone
} from 'lucide-react';
import { smsPricingService } from '@/services/sms-pricing-service';
import { firestoreService } from '@/lib/firestore-service';
import { PricingConfig } from '@/types/sms-types';
import { toast } from 'sonner';

export const SMSManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0
  });

  // Form states
  const [defaultMarkup, setDefaultMarkup] = useState(0.5);
  const [rentalMarkup, setRentalMarkup] = useState(0.5);
  const [newServiceMarkup, setNewServiceMarkup] = useState({ service: '', markup: 0 });
  const [newCountryMarkup, setNewCountryMarkup] = useState({ country: '', markup: 0 });
  const [newBlacklistService, setNewBlacklistService] = useState('');
  const [newBlacklistCountry, setNewBlacklistCountry] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load pricing config
      const config = await smsPricingService.getPricingConfig();
      setPricingConfig(config);
      setDefaultMarkup(config.defaultMarkup);
      setRentalMarkup(config.rentalMarkup);

      // Load SMS statistics
      await loadStats();
      
    } catch (error) {
      console.error('Error loading SMS management data:', error);
      toast.error('Failed to load SMS management data');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // This would need to be implemented in the firestore service
      // For now, using placeholder data
      setStats({
        totalOrders: 0,
        activeOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSaveGeneralSettings = async () => {
    if (!pricingConfig) return;
    
    try {
      setSaving(true);
      
      const updatedConfig = {
        ...pricingConfig,
        defaultMarkup,
        rentalMarkup
      };
      
      await smsPricingService.savePricingConfig(updatedConfig);
      setPricingConfig(updatedConfig);
      
      toast.success('General settings saved successfully');
    } catch (error) {
      console.error('Error saving general settings:', error);
      toast.error('Failed to save general settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddServiceMarkup = async () => {
    if (!pricingConfig || !newServiceMarkup.service) return;
    
    try {
      await smsPricingService.setServiceMarkup(newServiceMarkup.service, newServiceMarkup.markup);
      
      const updatedConfig = {
        ...pricingConfig,
        serviceMarkups: {
          ...pricingConfig.serviceMarkups,
          [newServiceMarkup.service]: newServiceMarkup.markup
        }
      };
      
      setPricingConfig(updatedConfig);
      setNewServiceMarkup({ service: '', markup: 0 });
      
      toast.success('Service markup added successfully');
    } catch (error) {
      console.error('Error adding service markup:', error);
      toast.error('Failed to add service markup');
    }
  };

  const handleRemoveServiceMarkup = async (service: string) => {
    if (!pricingConfig) return;
    
    try {
      const updatedMarkups = { ...pricingConfig.serviceMarkups };
      delete updatedMarkups[service];
      
      const updatedConfig = {
        ...pricingConfig,
        serviceMarkups: updatedMarkups
      };
      
      await smsPricingService.savePricingConfig(updatedConfig);
      setPricingConfig(updatedConfig);
      
      toast.success('Service markup removed successfully');
    } catch (error) {
      console.error('Error removing service markup:', error);
      toast.error('Failed to remove service markup');
    }
  };

  const handleAddCountryMarkup = async () => {
    if (!pricingConfig || !newCountryMarkup.country) return;
    
    try {
      await smsPricingService.setCountryMarkup(newCountryMarkup.country, newCountryMarkup.markup);
      
      const updatedConfig = {
        ...pricingConfig,
        countryMarkups: {
          ...pricingConfig.countryMarkups,
          [newCountryMarkup.country]: newCountryMarkup.markup
        }
      };
      
      setPricingConfig(updatedConfig);
      setNewCountryMarkup({ country: '', markup: 0 });
      
      toast.success('Country markup added successfully');
    } catch (error) {
      console.error('Error adding country markup:', error);
      toast.error('Failed to add country markup');
    }
  };

  const handleRemoveCountryMarkup = async (country: string) => {
    if (!pricingConfig) return;
    
    try {
      const updatedMarkups = { ...pricingConfig.countryMarkups };
      delete updatedMarkups[country];
      
      const updatedConfig = {
        ...pricingConfig,
        countryMarkups: updatedMarkups
      };
      
      await smsPricingService.savePricingConfig(updatedConfig);
      setPricingConfig(updatedConfig);
      
      toast.success('Country markup removed successfully');
    } catch (error) {
      console.error('Error removing country markup:', error);
      toast.error('Failed to remove country markup');
    }
  };

  const handleBlacklistService = async () => {
    if (!newBlacklistService) return;
    
    try {
      await smsPricingService.blacklistService(newBlacklistService);
      await loadData(); // Reload to get updated config
      setNewBlacklistService('');
      
      toast.success('Service blacklisted successfully');
    } catch (error) {
      console.error('Error blacklisting service:', error);
      toast.error('Failed to blacklist service');
    }
  };

  const handleUnblacklistService = async (service: string) => {
    try {
      await smsPricingService.unblacklistService(service);
      await loadData(); // Reload to get updated config
      
      toast.success('Service removed from blacklist');
    } catch (error) {
      console.error('Error removing service from blacklist:', error);
      toast.error('Failed to remove service from blacklist');
    }
  };

  const handleBlacklistCountry = async () => {
    if (!newBlacklistCountry) return;
    
    try {
      await smsPricingService.blacklistCountry(newBlacklistCountry);
      await loadData(); // Reload to get updated config
      setNewBlacklistCountry('');
      
      toast.success('Country blacklisted successfully');
    } catch (error) {
      console.error('Error blacklisting country:', error);
      toast.error('Failed to blacklist country');
    }
  };

  const handleUnblacklistCountry = async (country: string) => {
    try {
      await smsPricingService.unblacklistCountry(country);
      await loadData(); // Reload to get updated config
      
      toast.success('Country removed from blacklist');
    } catch (error) {
      console.error('Error removing country from blacklist:', error);
      toast.error('Failed to remove country from blacklist');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading SMS management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">SMS Management</h1>
          <p className="text-gray-600">Manage SMS services, pricing, and configurations</p>
        </div>
        <Button onClick={loadData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Orders</p>
                <p className="text-2xl font-bold">{stats.activeOrders}</p>
              </div>
              <Phone className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold">${stats.averageOrderValue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="pricing" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pricing">Pricing Settings</TabsTrigger>
          <TabsTrigger value="blacklist">Blacklist Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="pricing" className="space-y-6">
          {/* General Pricing Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                General Pricing Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultMarkup">Default Markup (%)</Label>
                  <Input
                    id="defaultMarkup"
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={defaultMarkup * 100}
                    onChange={(e) => setDefaultMarkup(parseFloat(e.target.value) / 100)}
                  />
                  <p className="text-sm text-gray-600">
                    Default markup percentage applied to all services (currently {(defaultMarkup * 100).toFixed(1)}%)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rentalMarkup">Rental Markup (%)</Label>
                  <Input
                    id="rentalMarkup"
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={rentalMarkup * 100}
                    onChange={(e) => setRentalMarkup(parseFloat(e.target.value) / 100)}
                  />
                  <p className="text-sm text-gray-600">
                    Additional markup for rental services (currently {(rentalMarkup * 100).toFixed(1)}%)
                  </p>
                </div>
              </div>

              <Button onClick={handleSaveGeneralSettings} disabled={saving}>
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save General Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Service-Specific Markups */}
          <Card>
            <CardHeader>
              <CardTitle>Service-Specific Markups</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Service Markup */}
              <div className="flex gap-2">
                <Input
                  placeholder="Service name"
                  value={newServiceMarkup.service}
                  onChange={(e) => setNewServiceMarkup({ ...newServiceMarkup, service: e.target.value })}
                />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  placeholder="Markup %"
                  value={newServiceMarkup.markup * 100}
                  onChange={(e) => setNewServiceMarkup({ ...newServiceMarkup, markup: parseFloat(e.target.value) / 100 })}
                />
                <Button onClick={handleAddServiceMarkup}>Add</Button>
              </div>

              {/* Existing Service Markups */}
              <div className="space-y-2">
                {pricingConfig && Object.entries(pricingConfig.serviceMarkups).map(([service, markup]) => (
                  <div key={service} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="font-medium">{service}</span>
                      <Badge variant="secondary" className="ml-2">
                        {(markup * 100).toFixed(1)}% markup
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveServiceMarkup(service)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Country-Specific Markups */}
          <Card>
            <CardHeader>
              <CardTitle>Country-Specific Markups</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Country Markup */}
              <div className="flex gap-2">
                <Input
                  placeholder="Country code (e.g., US, GB)"
                  value={newCountryMarkup.country}
                  onChange={(e) => setNewCountryMarkup({ ...newCountryMarkup, country: e.target.value.toUpperCase() })}
                />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  placeholder="Markup %"
                  value={newCountryMarkup.markup * 100}
                  onChange={(e) => setNewCountryMarkup({ ...newCountryMarkup, markup: parseFloat(e.target.value) / 100 })}
                />
                <Button onClick={handleAddCountryMarkup}>Add</Button>
              </div>

              {/* Existing Country Markups */}
              <div className="space-y-2">
                {pricingConfig && Object.entries(pricingConfig.countryMarkups).map(([country, markup]) => (
                  <div key={country} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="font-medium">{country}</span>
                      <Badge variant="secondary" className="ml-2">
                        {(markup * 100).toFixed(1)}% markup
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveCountryMarkup(country)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blacklist" className="space-y-6">
          {/* Blacklisted Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5" />
                Blacklisted Services
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Blacklisted Service */}
              <div className="flex gap-2">
                <Input
                  placeholder="Service name to blacklist"
                  value={newBlacklistService}
                  onChange={(e) => setNewBlacklistService(e.target.value)}
                />
                <Button onClick={handleBlacklistService}>Blacklist</Button>
              </div>

              {/* Existing Blacklisted Services */}
              <div className="space-y-2">
                {pricingConfig?.blacklistedServices.map((service) => (
                  <div key={service} className="flex items-center justify-between p-3 border rounded-lg bg-red-50">
                    <div className="flex items-center gap-2">
                      <Ban className="h-4 w-4 text-red-600" />
                      <span className="font-medium">{service}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnblacklistService(service)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Blacklisted Countries */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Blacklisted Countries
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Blacklisted Country */}
              <div className="flex gap-2">
                <Input
                  placeholder="Country code to blacklist (e.g., US, GB)"
                  value={newBlacklistCountry}
                  onChange={(e) => setNewBlacklistCountry(e.target.value.toUpperCase())}
                />
                <Button onClick={handleBlacklistCountry}>Blacklist</Button>
              </div>

              {/* Existing Blacklisted Countries */}
              <div className="space-y-2">
                {pricingConfig?.blacklistedCountries.map((country) => (
                  <div key={country} className="flex items-center justify-between p-3 border rounded-lg bg-red-50">
                    <div className="flex items-center gap-2">
                      <Ban className="h-4 w-4 text-red-600" />
                      <span className="font-medium">{country}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnblacklistCountry(country)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>SMS Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Analytics dashboard coming soon...</p>
                <p className="text-sm">This will show detailed SMS usage statistics, revenue trends, and performance metrics.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};