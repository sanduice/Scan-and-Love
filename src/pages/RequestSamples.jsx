import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, Package, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function RequestSamples() {
  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Sample request received! We will ship your kit shortly.');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Request a Sample Kit</h1>
          <p className="text-lg text-gray-600">
            Experience our quality firsthand. Order a free sample kit to see and feel our materials before you buy.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>What's Inside?</CardTitle>
              <CardDescription>Our sample kit includes:</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <Package className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">Material Swatches</h3>
                  <p className="text-sm text-gray-500">Vinyl, Mesh, Fabric, and Rigid Signs</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">Print Quality Examples</h3>
                  <p className="text-sm text-gray-500">High-resolution print samples</p>
                </div>
              </div>
              <div className="mt-4 bg-gray-100 p-4 rounded-lg">
                <img 
                  src="https://images.unsplash.com/photo-1626162976690-2e2769c28b50?auto=format&fit=crop&q=80&w=400" 
                  alt="Sample Kit" 
                  className="w-full h-48 object-cover rounded-md mb-2"
                />
                <p className="text-xs text-center text-gray-500">Actual kit contents may vary</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
              <CardDescription>Where should we send your samples?</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" required />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company">Company (Optional)</Label>
                  <Input id="company" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input id="address" required />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2 col-span-1">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" required />
                  </div>
                  <div className="space-y-2 col-span-1">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" required />
                  </div>
                  <div className="space-y-2 col-span-1">
                    <Label htmlFor="zip">Zip</Label>
                    <Input id="zip" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interest">Primary Interest</Label>
                  <Textarea id="interest" placeholder="What products are you interested in?" />
                </div>

                <Button type="submit" className="w-full bg-[#2196F3] hover:bg-[#1976D2]">
                  <Send className="w-4 h-4 mr-2" />
                  Request Free Samples
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}