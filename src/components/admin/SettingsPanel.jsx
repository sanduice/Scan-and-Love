import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Store, Truck, CreditCard, Mail, Bell, Shield, Palette, Globe,
  Save, Loader2, ExternalLink, Database, UserPlus, Trash2, Users
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

  // Role management state
  const [admins, setAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [removingAdminId, setRemovingAdminId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Fetch current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    getCurrentUser();
  }, []);

  // Fetch admins when roles tab is active
  useEffect(() => {
    if (activeTab === 'roles') {
      fetchAdmins();
    }
  }, [activeTab]);

  const fetchAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-roles`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch admins');
      }
      
      setAdmins(data.admins || []);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error('Failed to load administrators');
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;
    
    setAddingAdmin(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-roles`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: newAdminEmail.trim() }),
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add admin');
      }
      
      toast.success(`Admin role added for ${newAdminEmail}`);
      setNewAdminEmail('');
      fetchAdmins();
    } catch (error) {
      console.error('Error adding admin:', error);
      toast.error(error.message || 'Failed to add administrator');
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (userId) => {
    setRemovingAdminId(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-roles`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_id: userId }),
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove admin');
      }
      
      toast.success('Admin role removed');
      fetchAdmins();
    } catch (error) {
      console.error('Error removing admin:', error);
      toast.error(error.message || 'Failed to remove administrator');
    } finally {
      setRemovingAdminId(null);
    }
  };

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
        <TabsList className="bg-white border flex-wrap h-auto">
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
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="w-4 h-4" />
            User Roles
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
                <p className="text-sm text-muted-foreground">Temporarily disable the storefront</p>
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
              <p className="text-xs text-muted-foreground mt-1">Orders above this get free shipping</p>
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
                <p className="text-sm text-muted-foreground">Charge tax on orders</p>
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
                <p className="text-sm text-muted-foreground">Get notified when a new order is placed</p>
              </div>
              <Switch
                checked={settings.orderNotifications}
                onCheckedChange={(v) => setSettings({ ...settings, orderNotifications: v })}
              />
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">Low Stock Alerts</p>
                <p className="text-sm text-muted-foreground">Get notified when inventory is low</p>
              </div>
              <Switch
                checked={settings.lowStockNotifications}
                onCheckedChange={(v) => setSettings({ ...settings, lowStockNotifications: v })}
              />
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">New Review Notifications</p>
                <p className="text-sm text-muted-foreground">Get notified when a review is submitted</p>
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
            <div className="border rounded-lg p-4 flex items-center justify-between bg-muted/30">
              <div>
                <p className="font-medium">Cleanup & Seeding</p>
                <p className="text-sm text-muted-foreground">Remove duplicates, rescan Signs.com, manage catalog data.</p>
              </div>
              <Button asChild>
                <a href="/cleanupduplicates">
                  Go to Cleanup Tool
                </a>
              </Button>
            </div>
            
            <div className="border rounded-lg p-4 flex items-center justify-between bg-muted/30">
              <div>
                <p className="font-medium">Scraper Dashboard</p>
                <p className="text-sm text-muted-foreground">View and manage scraped data manually.</p>
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
          <p className="text-sm text-muted-foreground mb-4">
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
                    <p className="text-xs text-muted-foreground">Mailchimp, Klaviyo</p>
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
                    <p className="text-xs text-muted-foreground">Google Analytics</p>
                  </div>
                </div>
                <Badge variant="outline">Coming Soon</Badge>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* User Roles */}
        <TabsContent value="roles" className="bg-white rounded-xl border p-6 mt-4">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="font-medium">Manage Administrators</h3>
          </div>
          
          {/* Add Admin Form */}
          <form onSubmit={handleAddAdmin} className="mb-6">
            <Label className="mb-2 block">Add New Administrator</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter user email address"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={addingAdmin || !newAdminEmail.trim()}>
                {addingAdmin ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Admin
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              User must have an existing account to be added as admin
            </p>
          </form>

          {/* Current Admins Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingAdmins ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : admins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No administrators found
                    </TableCell>
                  </TableRow>
                ) : (
                  admins.map((admin) => (
                    <TableRow key={admin.user_id}>
                      <TableCell className="font-medium">{admin.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {admin.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(admin.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {admin.user_id === currentUserId ? (
                          <span className="text-xs text-muted-foreground">You</span>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                {removingAdminId === admin.user_id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Admin Access?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will remove administrator privileges from {admin.email}. 
                                  They will no longer be able to access the admin panel.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemoveAdmin(admin.user_id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remove Admin
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          <p className="text-xs text-muted-foreground mt-4">
            Administrators have full access to the admin panel including orders, products, and settings.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
