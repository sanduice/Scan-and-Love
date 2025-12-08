import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Save, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TaxSettings() {
  const queryClient = useQueryClient();
  const [showAddNexus, setShowAddNexus] = useState(false);
  const [newNexus, setNewNexus] = useState({ state: '', tax_rate: 0, tax_name: 'Sales Tax' });

  // In a real app, these keys would be stored in a secure settings entity or env vars
  // For this UI demo, we simulate fetching/saving them
  const [apiSettings, setApiSettings] = useState({
    taxjar_api_key: '',
    stripe_publishable_key: '',
    stripe_secret_key: '',
    paypal_client_id: '',
    enable_automatic_tax: false
  });

  const { data: nexusList = [], isLoading } = useQuery({
    queryKey: ['tax-nexus'],
    queryFn: () => base44.entities.TaxNexus.list('state'),
  });

  const createNexusMutation = useMutation({
    mutationFn: (data) => base44.entities.TaxNexus.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-nexus'] });
      setShowAddNexus(false);
      setNewNexus({ state: '', tax_rate: 0, tax_name: 'Sales Tax' });
      toast.success('Nexus added');
    },
  });

  const deleteNexusMutation = useMutation({
    mutationFn: (id) => base44.entities.TaxNexus.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-nexus'] });
      toast.success('Nexus removed');
    },
  });

  const handleSaveApiSettings = () => {
    // Here we would save to a 'Settings' entity
    toast.success('API settings saved');
  };

  const US_STATES = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", 
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", 
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", 
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", 
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
  ];

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* API Integrations */}
        <Card>
          <CardHeader>
            <CardTitle>Payment & Tax Integrations</CardTitle>
            <CardDescription>Configure API keys for TaxJar and Payment Processors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>TaxJar API Key</Label>
              <Input 
                type="password" 
                value={apiSettings.taxjar_api_key}
                onChange={(e) => setApiSettings({...apiSettings, taxjar_api_key: e.target.value})}
                placeholder="sk_live_..."
              />
              <p className="text-xs text-gray-500">Required for automatic tax calculation</p>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label>Automatic Tax Calculation</Label>
                <p className="text-xs text-gray-500">Use TaxJar to calculate rates automatically</p>
              </div>
              <Switch 
                checked={apiSettings.enable_automatic_tax}
                onCheckedChange={(checked) => setApiSettings({...apiSettings, enable_automatic_tax: checked})}
              />
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="space-y-2">
                <Label>Stripe Secret Key</Label>
                <Input 
                  type="password" 
                  value={apiSettings.stripe_secret_key}
                  onChange={(e) => setApiSettings({...apiSettings, stripe_secret_key: e.target.value})}
                  placeholder="sk_live_..."
                />
              </div>
              <div className="space-y-2">
                <Label>Stripe Publishable Key</Label>
                <Input 
                  type="text" 
                  value={apiSettings.stripe_publishable_key}
                  onChange={(e) => setApiSettings({...apiSettings, stripe_publishable_key: e.target.value})}
                  placeholder="pk_live_..."
                />
              </div>
            </div>

            <Button onClick={handleSaveApiSettings} className="w-full">
              <Save className="w-4 h-4 mr-2" /> Save Settings
            </Button>
          </CardContent>
        </Card>

        {/* Tax Nexus Configuration */}
        <Card className="h-full flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Economic Nexus</CardTitle>
              <CardDescription>States where you collect sales tax</CardDescription>
            </div>
            <Dialog open={showAddNexus} onOpenChange={setShowAddNexus}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add State</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Tax Nexus</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Select 
                      value={newNexus.state} 
                      onValueChange={(val) => setNewNexus({...newNexus, state: val})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {US_STATES.map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tax Rate (Decimal)</Label>
                    <Input 
                      type="number" 
                      step="0.001" 
                      value={newNexus.tax_rate} 
                      onChange={(e) => setNewNexus({...newNexus, tax_rate: parseFloat(e.target.value)})}
                      placeholder="0.06 for 6%"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tax Name</Label>
                    <Input 
                      value={newNexus.tax_name} 
                      onChange={(e) => setNewNexus({...newNexus, tax_name: e.target.value})}
                      placeholder="State Tax"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => createNexusMutation.mutate(newNexus)}>
                    Add Nexus
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>State</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nexusList.map((nexus) => (
                  <TableRow key={nexus.id}>
                    <TableCell className="font-medium">{nexus.state}</TableCell>
                    <TableCell>{(nexus.tax_rate * 100).toFixed(3)}%</TableCell>
                    <TableCell>{nexus.tax_name}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => deleteNexusMutation.mutate(nexus.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {nexusList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                      No tax nexus configured. Add a state to start collecting tax.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}