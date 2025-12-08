import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Store, Truck, CreditCard, Mail, Bell, Shield, Palette, Globe,
  Save, Loader2, ExternalLink, Database
} from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPanel() {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState({
    storeName: 'NetravePrint',
    storeEmail: 'support@netraveprint.com',
    storePhone: '1-888-222-4929',
    storeAddress: '123 Print Street, New York, NY 10001',
    
    freeShippingThreshold: 99,
    standardShippingRate: 12.95,
    expressShippingRate: 24.95,
    
    taxEnabled: false,
    taxRate: 0,
    
    orderNotifications: true,
    lowStockNotifications: true,
    reviewNotifications: true,
    
    maintenanceMode: false,
    
    shipstationApiKey: '',
    shipstationApiSecret: '',
  });

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise(r => setTimeout(r, 1000));
    toast.success('Settings saved');
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Settings</h2>
        <Button onClick={handleSave} disabled={isSaving} className="bg-[#8BC34A] hover:bg-[#7CB342]">
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border">
          <TabsTrigger value="general" className="gap-2">
            <Store className="w-4 h-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="shipping" className="gap-2">
            <Truck className="w-4 h-4" />
            Shipping
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <CreditCard className="w-4 h-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Globe className="w-4 h-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-2">
            <Database className="w-4 h-4" />
            Data Management
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="bg-white rounded-xl border p-6 mt-4">
          <h3 className="font-medium mb-4">Store Information</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Store Name</Label>
              <Input
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
              />
            </div>
            <div>
              <Label>Support Email</Label>
              <Input
                type="email"
                value={settings.storeEmail}
                onChange={(e) => setSettings({ ...settings, storeEmail: e.target.value })}
              />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input
                value={settings.storePhone}
                onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })}
              />
            </div>
            <div>
              <Label>Business Address</Label>
              <Input
                value={settings.storeAddress}
                onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Maintenance Mode</p>
                <p className="text-sm text-gray-500">Temporarily disable the storefront</p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(v) => setSettings({ ...settings, maintenanceMode: v })}
              />
            </div>
          </div>
        </TabsContent>

        {/* Shipping Settings */}
        <TabsContent value="shipping" className="bg-white rounded-xl border p-6 mt-4">
          <h3 className="font-medium mb-4">Shipping Rates</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Free Shipping Threshold ($)</Label>
              <Input
                type="number"
                value={settings.freeShippingThreshold}
                onChange={(e) => setSettings({ ...settings, freeShippingThreshold: Number(e.target.value) })}
              />
              <p className="text-xs text-gray-500 mt-1">Orders above this get free shipping</p>
            </div>
            <div>
              <Label>Standard Shipping ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={settings.standardShippingRate}
                onChange={(e) => setSettings({ ...settings, standardShippingRate: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Express Shipping ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={settings.expressShippingRate}
                onChange={(e) => setSettings({ ...settings, expressShippingRate: Number(e.target.value) })}
              />
            </div>
          </div>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payments" className="bg-white rounded-xl border p-6 mt-4">
          <h3 className="font-medium mb-4">Tax Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable Tax Collection</p>
                <p className="text-sm text-gray-500">Charge tax on orders</p>
              </div>
              <Switch
                checked={settings.taxEnabled}
                onCheckedChange={(v) => setSettings({ ...settings, taxEnabled: v })}
              />
            </div>
            {settings.taxEnabled && (
              <div className="max-w-xs">
                <Label>Tax Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={settings.taxRate}
                  onChange={(e) => setSettings({ ...settings, taxRate: Number(e.target.value) })}
                />
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t">
            <h3 className="font-medium mb-4">Payment Providers</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                Payment integrations require backend functions to be enabled. 
                Go to Dashboard → Settings → Backend Functions to enable.
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="bg-white rounded-xl border p-6 mt-4">
          <h3 className="font-medium mb-4">Email Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">New Order Notifications</p>
                <p className="text-sm text-gray-500">Get notified when a new order is placed</p>
              </div>
              <Switch
                checked={settings.orderNotifications}
                onCheckedChange={(v) => setSettings({ ...settings, orderNotifications: v })}
              />
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">Low Stock Alerts</p>
                <p className="text-sm text-gray-500">Get notified when inventory is low</p>
              </div>
              <Switch
                checked={settings.lowStockNotifications}
                onCheckedChange={(v) => setSettings({ ...settings, lowStockNotifications: v })}
              />
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">New Review Notifications</p>
                <p className="text-sm text-gray-500">Get notified when a review is submitted</p>
              </div>
              <Switch
                checked={settings.reviewNotifications}
                onCheckedChange={(v) => setSettings({ ...settings, reviewNotifications: v })}
              />
            </div>
          </div>
        </TabsContent>

        {/* Data Management */}
        <TabsContent value="data" className="bg-white rounded-xl border p-6 mt-4">
          <h3 className="font-medium mb-4">System Maintenance</h3>
          <div className="space-y-4">
            <div className="border rounded-lg p-4 flex items-center justify-between bg-gray-50">
              <div>
                <p className="font-medium">Cleanup & Seeding</p>
                <p className="text-sm text-gray-500">Remove duplicates, rescan Signs.com, manage catalog data.</p>
              </div>
              <Button asChild>
                <a href="/cleanupduplicates">
                  Go to Cleanup Tool
                </a>
              </Button>
            </div>
            
            <div className="border rounded-lg p-4 flex items-center justify-between bg-gray-50">
              <div>
                <p className="font-medium">Scraper Dashboard</p>
                <p className="text-sm text-gray-500">View and manage scraped data manually.</p>
              </div>
              <Button variant="outline" asChild>
                <a href="/scraper">
                  Open Scraper
                </a>
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="bg-white rounded-xl border p-6 mt-4">
          <h3 className="font-medium mb-4">ShipStation</h3>
          <p className="text-sm text-gray-500 mb-4">
            Connect ShipStation to automatically sync orders and shipping labels.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>API Key</Label>
              <Input
                type="password"
                value={settings.shipstationApiKey}
                onChange={(e) => setSettings({ ...settings, shipstationApiKey: e.target.value })}
                placeholder="••••••••••••"
              />
            </div>
            <div>
              <Label>API Secret</Label>
              <Input
                type="password"
                value={settings.shipstationApiSecret}
                onChange={(e) => setSettings({ ...settings, shipstationApiSecret: e.target.value })}
                placeholder="••••••••••••"
              />
            </div>
          </div>
          <Button variant="outline" className="mt-4" asChild>
            <a href="https://www.shipstation.com/integrations/" target="_blank" rel="noopener noreferrer">
              Get API Keys <ExternalLink className="w-4 h-4 ml-2" />
            </a>
          </Button>

          <div className="mt-6 pt-6 border-t">
            <h3 className="font-medium mb-4">Other Integrations</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">📧</span>
                  </div>
                  <div>
                    <p className="font-medium">Email Marketing</p>
                    <p className="text-xs text-gray-500">Mailchimp, Klaviyo</p>
                  </div>
                </div>
                <Badge variant="outline">Coming Soon</Badge>
              </div>
              <div className="border rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">📊</span>
                  </div>
                  <div>
                    <p className="font-medium">Analytics</p>
                    <p className="text-xs text-gray-500">Google Analytics</p>
                  </div>
                </div>
                <Badge variant="outline">Coming Soon</Badge>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}