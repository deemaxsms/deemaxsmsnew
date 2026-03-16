import { useEffect, useState } from 'react';
import { adminService } from '../lib/admin-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Loader2, Settings, Save, Database, Mail, Shield } from 'lucide-react';
import { toast } from 'sonner';

export function SettingsManagement() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settingsData = await adminService.getSystemSettings();
      setSettings(settingsData);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await adminService.updateSystemSettings(settings);
      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings({ ...settings, [key]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Settings Management</h1>
          <p className="text-muted-foreground">Configure system settings and preferences</p>
        </div>
        <Button onClick={handleSaveSettings} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            General Settings
          </CardTitle>
          <CardDescription>Basic system configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={settings.siteName || ''}
                onChange={(e) => updateSetting('siteName', e.target.value)}
                placeholder="Your Site Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input
                id="supportEmail"
                type="email"
                value={settings.supportEmail || ''}
                onChange={(e) => updateSetting('supportEmail', e.target.value)}
                placeholder="support@example.com"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="siteDescription">Site Description</Label>
            <Textarea
              id="siteDescription"
              value={settings.siteDescription || ''}
              onChange={(e) => updateSetting('siteDescription', e.target.value)}
              placeholder="Describe your platform..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="maintenanceMode"
              checked={settings.maintenanceMode || false}
              onCheckedChange={(checked) => updateSetting('maintenanceMode', checked)}
            />
            <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
          </div>
        </CardContent>
      </Card>

      {/* Payment Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="mr-2 h-5 w-5" />
            Payment Settings
          </CardTitle>
          <CardDescription>Configure payment processing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="minTopUp">Minimum Top-up Amount (USD)</Label>
              <Input
                id="minTopUp"
                type="number"
                value={settings.minTopUp || ''}
                onChange={(e) => updateSetting('minTopUp', parseFloat(e.target.value))}
                placeholder="100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxTopUp">Maximum Top-up Amount (USD)</Label>
              <Input
                id="maxTopUp"
                type="number"
                value={settings.maxTopUp || ''}
                onChange={(e) => updateSetting('maxTopUp', parseFloat(e.target.value))}
                placeholder="100000"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="paymentsEnabled"
              checked={settings.paymentsEnabled !== false}
              onCheckedChange={(checked) => updateSetting('paymentsEnabled', checked)}
            />
            <Label htmlFor="paymentsEnabled">Enable Payments</Label>
          </div>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="mr-2 h-5 w-5" />
            Email Settings
          </CardTitle>
          <CardDescription>Configure email notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="emailNotifications"
              checked={settings.emailNotifications !== false}
              onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
            />
            <Label htmlFor="emailNotifications">Enable Email Notifications</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="orderConfirmationEmails"
              checked={settings.orderConfirmationEmails !== false}
              onCheckedChange={(checked) => updateSetting('orderConfirmationEmails', checked)}
            />
            <Label htmlFor="orderConfirmationEmails">Send Order Confirmation Emails</Label>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>Configure security and access controls</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
            <Input
              id="sessionTimeout"
              type="number"
              value={settings.sessionTimeout || ''}
              onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
              placeholder="60"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="requireEmailVerification"
              checked={settings.requireEmailVerification !== false}
              onCheckedChange={(checked) => updateSetting('requireEmailVerification', checked)}
            />
            <Label htmlFor="requireEmailVerification">Require Email Verification</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="enableTwoFactor"
              checked={settings.enableTwoFactor || false}
              onCheckedChange={(checked) => updateSetting('enableTwoFactor', checked)}
            />
            <Label htmlFor="enableTwoFactor">Enable Two-Factor Authentication</Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save All Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}