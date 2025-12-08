import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, Package, Heart, CreditCard, MapPin, Settings, LogOut,
  ShoppingBag, Repeat, FileText, Clock, Truck, CheckCircle,
  Plus, Edit, Trash2, Loader2, Eye, Upload, Copy
} from 'lucide-react';
import { toast } from 'sonner';

export default function Account() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('orders');
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (err) {
        // Not logged in, redirect to login
        base44.auth.redirectToLogin(window.location.href);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const { data: orders = [] } = useQuery({
    queryKey: ['user-orders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
    enabled: !!user,
  });

  const { data: savedDesigns = [] } = useQuery({
    queryKey: ['user-designs'],
    queryFn: () => base44.entities.SavedDesign.filter({ is_in_cart: false }),
    enabled: !!user,
  });

  const { data: savedBadgeDesigns = [] } = useQuery({
    queryKey: ['user-badge-designs'],
    queryFn: () => base44.entities.NameBadgeDesign.filter({ is_draft: true }),
    enabled: !!user,
  });

  const { data: exemptions = [] } = useQuery({
    queryKey: ['user-exemptions'],
    queryFn: () => base44.entities.CustomerTaxExemption.filter({ user_email: user?.email }),
    enabled: !!user,
  });

  const createExemptionMutation = useMutation({
    mutationFn: (data) => base44.entities.CustomerTaxExemption.create(data),
    onSuccess: () => {
      toast.success('Exemption request submitted');
      queryClient.invalidateQueries({ queryKey: ['user-exemptions'] });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      toast.success('Profile updated!');
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const handleLogout = () => {
    base44.auth.logout(createPageUrl('Home'));
  };

  const handleDuplicateDesign = async (design) => {
    try {
      // Create a copy
      const { id, created_date, updated_date, created_by, ...designData } = design;
      await base44.entities.SavedDesign.create({
        ...designData,
        name: `Copy of ${design.name}`,
        is_in_cart: false,
        is_ordered: false,
        last_order_id: null,
      });
      toast.success('Design duplicated!');
      queryClient.invalidateQueries({ queryKey: ['user-designs'] });
    } catch (err) {
      toast.error('Failed to duplicate design');
    }
  };

  const handleReorder = async (order) => {
    try {
      const items = typeof order.items_json === 'string' ? JSON.parse(order.items_json) : order.items;
      let count = 0;
      
      for (const item of items) {
        if (item.item_type === 'design') {
          // Duplicate the design into cart
          await base44.entities.SavedDesign.create({
            product_type: item.product_type,
            name: item.product_name,
            width: item.width,
            height: item.height,
            quantity: item.quantity,
            unit_price: item.unit_price,
            elements_json: item.elements_json,
            options_json: item.options_json,
            artwork_url: item.artwork_url,
            thumbnail_url: item.thumbnail_url,
            material: item.material,
            finish: item.finish,
            is_in_cart: true,
            is_ordered: false
          });
          count++;
        }
      }
      
      if (count > 0) {
        toast.success(`Added ${count} items to cart`);
        // Navigate to cart? Optional
      } else {
        toast.info('No reorderable items found');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to reorder items');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      paid: { color: 'bg-blue-100 text-blue-800', label: 'Paid' },
      in_production: { color: 'bg-purple-100 text-purple-800', label: 'In Production' },
      quality_check: { color: 'bg-indigo-100 text-indigo-800', label: 'Quality Check' },
      shipped: { color: 'bg-cyan-100 text-cyan-800', label: 'Shipped' },
      delivered: { color: 'bg-green-100 text-green-800', label: 'Delivered' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#2196F3] flex items-center justify-center text-white text-2xl font-bold">
                {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user?.full_name || 'Welcome'}</h1>
                <p className="text-gray-500">{user?.email}</p>
                {user?.company_name && (
                  <p className="text-sm text-gray-600">{user.company_name}</p>
                )}
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout} className="text-red-600 border-red-200 hover:bg-red-50">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-2">
                <nav className="space-y-1">
                  {[
                    { id: 'orders', icon: Package, label: 'Orders', count: orders.length },
                    { id: 'designs', icon: Heart, label: 'Saved Designs', count: savedDesigns.length + savedBadgeDesigns.length },
                    { id: 'reorder', icon: Repeat, label: 'Reorder' },
                    { id: 'addresses', icon: MapPin, label: 'Addresses' },
                    { id: 'tax-exempt', icon: FileText, label: 'Tax Exemptions' },
                    { id: 'settings', icon: Settings, label: 'Account Settings' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === item.id 
                          ? 'bg-[#2196F3]/10 text-[#2196F3]' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <item.icon className="w-5 h-5" />
                        {item.label}
                      </span>
                      {item.count !== undefined && (
                        <Badge variant="secondary">{item.count}</Badge>
                      )}
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'orders' && (
              <Card>
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                  <CardDescription>View and track all your orders</CardDescription>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                      <p className="text-gray-500 mb-4">Start shopping to see your orders here</p>
                      <Link to={createPageUrl('Products')}>
                        <Button className="bg-[#8BC34A] hover:bg-[#7CB342]">Browse Products</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="border rounded-xl p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <span className="font-semibold text-gray-900">Order #{order.order_number}</span>
                              <span className="text-gray-500 text-sm ml-3">
                                {new Date(order.created_date).toLocaleDateString()}
                              </span>
                            </div>
                            {getStatusBadge(order.status)}
                          </div>
                          <div className="flex items-center gap-4">
                            {order.items?.slice(0, 3).map((item, i) => (
                              <div key={i} className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                {item.thumbnail_url ? (
                                  <img src={item.thumbnail_url} alt="" className="w-full h-full object-contain" />
                                ) : (
                                  <Package className="w-6 h-6 text-gray-400" />
                                )}
                              </div>
                            ))}
                            {order.items?.length > 3 && (
                              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                                +{order.items.length - 3}
                              </div>
                            )}
                            <div className="flex-1 text-right">
                              <div className="text-lg font-bold text-gray-900">${order.total?.toFixed(2)}</div>
                              <div className="text-sm text-gray-500">{order.items?.length} item(s)</div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <div className="text-sm text-gray-500">
                              {order.tracking_number && (
                                <span>Tracking: {order.tracking_number}</span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-1" /> View Details
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleReorder(order)}>
                                <Repeat className="w-4 h-4 mr-1" /> Reorder
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'designs' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Saved Designs</CardTitle>
                      <CardDescription>Your saved designs and templates</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Link to={createPageUrl('NameBadgeDesigner')}>
                        <Button variant="outline">
                          <Plus className="w-4 h-4 mr-2" /> Name Badge
                        </Button>
                      </Link>
                      <Link to={createPageUrl('DesignTool')}>
                        <Button className="bg-[#8BC34A] hover:bg-[#7CB342]">
                          <Plus className="w-4 h-4 mr-2" /> Banner/Sign
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {savedDesigns.length === 0 && savedBadgeDesigns.length === 0 ? (
                    <div className="text-center py-12">
                      <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No saved designs</h3>
                      <p className="text-gray-500 mb-4">Create and save designs to reuse later</p>
                      <div className="flex gap-3 justify-center">
                        <Link to={createPageUrl('DesignTool')}>
                          <Button className="bg-[#8BC34A] hover:bg-[#7CB342]">Design Banner/Sign</Button>
                        </Link>
                        <Link to={createPageUrl('NameBadgeDesigner')}>
                          <Button variant="outline">Design Name Badge</Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Banner/Sign Designs */}
                      {savedDesigns.map((design) => (
                        <div key={`design-${design.id}`} className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                          <div className="aspect-video bg-gray-100 flex items-center justify-center relative">
                            {design.thumbnail_url ? (
                              <img src={design.thumbnail_url} alt="" className="w-full h-full object-contain" />
                            ) : (
                              <div className="text-gray-400 text-sm">{design.width}" × {design.height}"</div>
                            )}
                            <Badge className="absolute top-2 left-2 bg-blue-100 text-blue-800">
                              {design.product_type?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Design'}
                            </Badge>
                          </div>
                          <div className="p-3">
                            <h4 className="font-medium text-gray-900 truncate">{design.name || 'Untitled'}</h4>
                            <p className="text-sm text-gray-500">
                              {design.width}" × {design.height}" • {design.material || 'Standard'}
                            </p>
                            <div className="flex gap-2 mt-3">
                              <Link 
                                to={`${createPageUrl('DesignTool')}?product=${design.product_type}&width=${design.width}&height=${design.height}&designId=${design.id}`}
                                className="flex-1"
                              >
                                <Button variant="outline" size="sm" className="w-full">
                                  <Edit className="w-3 h-3 mr-1" /> Edit
                                </Button>
                              </Link>
                              <Button variant="outline" size="sm" className="flex-1">
                                <ShoppingBag className="w-3 h-3 mr-1" /> Order
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Name Badge Designs */}
                      {savedBadgeDesigns.map((design) => (
                        <div key={`badge-${design.id}`} className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                          <div className="aspect-video bg-gray-100 flex items-center justify-center relative p-4">
                            {design.thumbnail_url ? (
                              <img src={design.thumbnail_url} alt="" className="max-w-full max-h-full object-contain" />
                            ) : (
                              <div 
                                className="bg-white rounded shadow-sm flex items-center justify-center text-gray-400 text-xs"
                                style={{
                                  width: 120,
                                  height: design.size_shape?.includes('2x3') ? 80 : design.size_shape?.includes('1.5') ? 60 : 40,
                                  borderRadius: design.size_shape?.includes('oval') ? '50%' : '4px',
                                  border: design.border !== 'none' ? `2px solid ${design.border === 'gold' ? '#D4AF37' : design.border === 'silver' ? '#C0C0C0' : '#000'}` : '1px solid #e5e7eb',
                                }}
                              >
                                Badge
                              </div>
                            )}
                            <Badge className="absolute top-2 left-2 bg-orange-100 text-orange-800">
                              Name Badge
                            </Badge>
                          </div>
                          <div className="p-3">
                            <h4 className="font-medium text-gray-900 truncate">{design.name || 'Custom Badge'}</h4>
                            <p className="text-sm text-gray-500 capitalize">
                              {design.size_shape?.replace(/-/g, ' ')} • {design.fastener?.replace(/-/g, ' ')}
                            </p>
                            <div className="flex gap-2 mt-3">
                              <Link 
                                to={`${createPageUrl('NameBadgeDesigner')}?designId=${design.id}`}
                                className="flex-1"
                              >
                                <Button variant="outline" size="sm" className="w-full">
                                  <Edit className="w-3 h-3 mr-1" /> Edit
                                </Button>
                              </Link>
                              <Link 
                                to={`${createPageUrl('NameBadgeNames')}?designId=${design.id}`}
                                className="flex-1"
                              >
                                <Button variant="outline" size="sm" className="w-full">
                                  <ShoppingBag className="w-3 h-3 mr-1" /> Order
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'reorder' && (
              <Card>
                <CardHeader>
                  <CardTitle>Quick Reorder</CardTitle>
                  <CardDescription>Reorder from your previous orders with one click</CardDescription>
                </CardHeader>
                <CardContent>
                  {orders.filter(o => o.status === 'delivered').length === 0 ? (
                    <div className="text-center py-12">
                      <Repeat className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No orders to reorder</h3>
                      <p className="text-gray-500">Complete an order first to enable quick reordering</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.filter(o => o.status === 'delivered').map((order) => (
                        <div key={order.id} className="border rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-semibold">Order #{order.order_number}</span>
                            <Button className="bg-[#8BC34A] hover:bg-[#7CB342]">
                              <Repeat className="w-4 h-4 mr-2" /> Reorder All
                            </Button>
                          </div>
                          <div className="grid gap-2">
                            {order.items?.map((item, i) => (
                              <div key={i} className="flex items-center justify-between py-2 border-t">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gray-100 rounded">
                                    {item.thumbnail_url && <img src={item.thumbnail_url} alt="" className="w-full h-full object-contain" />}
                                  </div>
                                  <div>
                                    <div className="font-medium">{item.product_name}</div>
                                    <div className="text-sm text-gray-500">{item.width}" × {item.height}" • Qty: {item.quantity}</div>
                                  </div>
                                </div>
                                <Button variant="outline" size="sm">
                                  <Plus className="w-3 h-3 mr-1" /> Add
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'addresses' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Shipping Addresses</CardTitle>
                      <CardDescription>Manage your saved addresses</CardDescription>
                    </div>
                    <Button className="bg-[#2196F3] hover:bg-[#1976D2]">
                      <Plus className="w-4 h-4 mr-2" /> Add Address
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {!user?.shipping_addresses?.length ? (
                    <div className="text-center py-12">
                      <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No saved addresses</h3>
                      <p className="text-gray-500">Add an address to speed up checkout</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {user.shipping_addresses.map((addr, i) => (
                        <div key={i} className="border rounded-xl p-4 relative">
                          {addr.is_default && (
                            <Badge className="absolute top-2 right-2 bg-green-100 text-green-800">Default</Badge>
                          )}
                          <h4 className="font-medium text-gray-900">{addr.name}</h4>
                          <p className="text-gray-600 text-sm mt-1">
                            {addr.street}<br />
                            {addr.city}, {addr.state} {addr.zip}
                          </p>
                          <div className="flex gap-2 mt-3">
                            <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="sm" className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'tax-exempt' && (
              <Card>
                <CardHeader>
                  <CardTitle>Tax Exemptions</CardTitle>
                  <CardDescription>Manage your tax exemption certificates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* List Existing */}
                    {exemptions.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="font-medium text-gray-900">Your Certificates</h3>
                        <div className="border rounded-lg overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">State</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {exemptions.map((ex) => (
                                <tr key={ex.id}>
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{ex.state}</td>
                                  <td className="px-4 py-3 text-sm">
                                    <Badge className={
                                      ex.status === 'approved' ? 'bg-green-100 text-green-800' :
                                      ex.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                      'bg-yellow-100 text-yellow-800'
                                    }>
                                      {ex.status}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-500">{ex.expiry_date || '-'}</td>
                                  <td className="px-4 py-3 text-right text-sm">
                                    <a href={ex.document_url} target="_blank" className="text-blue-600 hover:underline">View</a>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Add New */}
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <h3 className="font-medium text-gray-900 mb-4">Upload New Certificate</h3>
                      <form 
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const formData = new FormData(e.target);
                          const file = formData.get('file');
                          
                          if (!file || file.size === 0) {
                            toast.error('Please select a file');
                            return;
                          }

                          try {
                            // Upload file
                            const { file_url } = await base44.integrations.Core.UploadFile({ file });
                            
                            createExemptionMutation.mutate({
                              user_email: user.email,
                              company_name: user.company_name || user.full_name,
                              state: formData.get('state'),
                              exemption_number: formData.get('number'),
                              document_url: file_url,
                              status: 'pending'
                            });
                            e.target.reset();
                          } catch (err) {
                            toast.error('Upload failed: ' + err.message);
                          }
                        }}
                        className="space-y-4"
                      >
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label>State</Label>
                            <Input name="state" placeholder="e.g. FL" required maxLength={2} className="mt-1" />
                          </div>
                          <div>
                            <Label>Exemption Number</Label>
                            <Input name="number" placeholder="e.g. 12-3456789" required className="mt-1" />
                          </div>
                        </div>
                        <div>
                          <Label>Certificate Document (PDF/Image)</Label>
                          <Input type="file" name="file" accept=".pdf,.jpg,.png" required className="mt-1" />
                        </div>
                        <Button type="submit" disabled={createExemptionMutation.isPending}>
                          {createExemptionMutation.isPending ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                          Submit for Verification
                        </Button>
                      </form>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'settings' && (
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>Update your profile and preferences</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Full Name</Label>
                        <Input defaultValue={user?.full_name} className="mt-1" />
                      </div>
                      <div>
                        <Label>Company Name</Label>
                        <Input defaultValue={user?.company_name} className="mt-1" placeholder="Optional" />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input defaultValue={user?.email} disabled className="mt-1 bg-gray-50" />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input defaultValue={user?.phone} className="mt-1" placeholder="(555) 555-5555" />
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <Button className="bg-[#8BC34A] hover:bg-[#7CB342]">Save Changes</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}