import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getSessionId } from '@/hooks/useSupabaseData';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, Package, Heart, MapPin, Settings, LogOut,
  ShoppingBag, Repeat, FileText,
  Plus, Edit, Loader2, Eye, Trash2
} from 'lucide-react';
import { toast } from 'sonner';

export default function Account() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/Auth');
    }
  }, [user, authLoading, navigate]);

  const sessionId = getSessionId();

  const { data: orders = [] } = useQuery({
    queryKey: ['user-orders', user?.id],
    queryFn: async () => {
      const query = user 
        ? supabase.from('orders').select('*').eq('user_id', user.id)
        : supabase.from('orders').select('*').eq('session_id', sessionId);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user || !!sessionId,
  });

  const { data: savedDesigns = [] } = useQuery({
    queryKey: ['user-designs', user?.id],
    queryFn: async () => {
      const query = user
        ? supabase.from('saved_designs').select('*').eq('user_id', user.id)
        : supabase.from('saved_designs').select('*').eq('session_id', sessionId);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user || !!sessionId,
  });

  const { data: savedBadgeDesigns = [] } = useQuery({
    queryKey: ['user-badge-designs', user?.id],
    queryFn: async () => {
      const query = user
        ? supabase.from('name_badge_designs').select('*').eq('user_id', user.id)
        : supabase.from('name_badge_designs').select('*').eq('session_id', sessionId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user || !!sessionId,
  });

  const { data: exemptions = [] } = useQuery({
    queryKey: ['user-exemptions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('customer_tax_exemptions')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Error signing out');
    } else {
      toast.success('Signed out successfully');
      navigate('/');
    }
  };

  const handleReorder = async (order) => {
    try {
      const items = order.items || [];
      toast.info(`Reorder functionality coming soon for ${items.length} items`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to reorder items');
    }
  };

  const deleteDesignMutation = useMutation({
    mutationFn: async (designId) => {
      const { error } = await supabase
        .from('saved_designs')
        .delete()
        .eq('id', designId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-designs', user?.id] });
      toast.success('Design deleted');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Failed to delete design');
    }
  });

  const deleteBadgeDesignMutation = useMutation({
    mutationFn: async (designId) => {
      const { error } = await supabase
        .from('name_badge_designs')
        .delete()
        .eq('id', designId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-badge-designs', user?.id] });
      toast.success('Badge design deleted');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Failed to delete badge design');
    }
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
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
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-card rounded-2xl shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Welcome</h1>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout} className="text-destructive border-destructive/20 hover:bg-destructive/10">
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
                          ? 'bg-primary/10 text-primary' 
                          : 'text-muted-foreground hover:bg-muted'
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
                      <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No orders yet</h3>
                      <p className="text-muted-foreground mb-4">Start shopping to see your orders here</p>
                      <Link to={createPageUrl('Products')}>
                        <Button className="bg-primary hover:bg-primary/90">Browse Products</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="border rounded-xl p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <span className="font-semibold text-foreground">Order #{order.order_number}</span>
                              <span className="text-muted-foreground text-sm ml-3">
                                {new Date(order.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            {getStatusBadge(order.status)}
                          </div>
                          <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <div className="text-lg font-bold text-foreground">${order.total?.toFixed(2)}</div>
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
                        <Button className="bg-primary hover:bg-primary/90">
                          <Plus className="w-4 h-4 mr-2" /> Banner/Sign
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {savedDesigns.length === 0 && savedBadgeDesigns.length === 0 ? (
                    <div className="text-center py-12">
                      <Heart className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No saved designs</h3>
                      <p className="text-muted-foreground mb-4">Create and save designs to reuse later</p>
                      <div className="flex gap-3 justify-center">
                        <Link to={createPageUrl('DesignTool')}>
                          <Button className="bg-primary hover:bg-primary/90">Design Banner/Sign</Button>
                        </Link>
                        <Link to={createPageUrl('NameBadgeDesigner')}>
                          <Button variant="outline">Design Name Badge</Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {savedDesigns.map((design) => (
                        <div key={`design-${design.id}`} className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                          <div className="aspect-video bg-muted flex items-center justify-center relative">
                            {design.thumbnail_url ? (
                              <img src={design.thumbnail_url} alt="" className="w-full h-full object-contain" />
                            ) : (
                              <div className="text-muted-foreground text-sm">No preview</div>
                            )}
                          </div>
                          <div className="p-3">
                            <h4 className="font-medium text-foreground truncate">{design.name || 'Untitled'}</h4>
                            <div className="flex gap-2 mt-3">
                              <Link to={`${createPageUrl('DesignTool')}?product=${design.product_type || 'vinyl-banner'}&designId=${design.id}`} className="flex-1">
                                <Button variant="outline" size="sm" className="w-full">
                                  <Edit className="w-3 h-3 mr-1" /> Edit
                                </Button>
                              </Link>
                              <Button variant="outline" size="sm" className="flex-1">
                                <ShoppingBag className="w-3 h-3 mr-1" /> Order
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => deleteDesignMutation.mutate(design.id)}
                                disabled={deleteDesignMutation.isPending}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {savedBadgeDesigns.map((design) => (
                        <div key={`badge-${design.id}`} className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                          <div className="aspect-video bg-muted flex items-center justify-center relative p-4">
                            {design.thumbnail_url ? (
                              <img src={design.thumbnail_url} alt="" className="max-w-full max-h-full object-contain" />
                            ) : (
                              <div className="text-muted-foreground text-sm">Name Badge</div>
                            )}
                            <Badge className="absolute top-2 left-2 bg-green-100 text-green-800">Name Badge</Badge>
                          </div>
                          <div className="p-3">
                            <h4 className="font-medium text-foreground truncate">{design.name || 'Untitled Badge'}</h4>
                            <div className="flex gap-2 mt-3">
                              <Link to={`${createPageUrl('NameBadgeDesigner')}?designId=${design.id}`} className="flex-1">
                                <Button variant="outline" size="sm" className="w-full">
                                  <Edit className="w-3 h-3 mr-1" /> Edit
                                </Button>
                              </Link>
                              <Button variant="outline" size="sm" className="flex-1">
                                <ShoppingBag className="w-3 h-3 mr-1" /> Order
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => deleteBadgeDesignMutation.mutate(design.id)}
                                disabled={deleteBadgeDesignMutation.isPending}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-3 h-3" />
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

            {activeTab === 'reorder' && (
              <Card>
                <CardHeader>
                  <CardTitle>Quick Reorder</CardTitle>
                  <CardDescription>Easily reorder from your previous orders</CardDescription>
                </CardHeader>
                <CardContent>
                  {orders.filter(o => o.status === 'delivered').length === 0 ? (
                    <div className="text-center py-12">
                      <Repeat className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No delivered orders yet</h3>
                      <p className="text-muted-foreground">Your delivered orders will appear here for easy reordering</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.filter(o => o.status === 'delivered').map((order) => (
                        <div key={order.id} className="border rounded-lg p-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium">Order #{order.order_number}</p>
                            <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                          </div>
                          <Button onClick={() => handleReorder(order)}>
                            <Repeat className="w-4 h-4 mr-2" /> Reorder
                          </Button>
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
                  <CardTitle>Shipping Addresses</CardTitle>
                  <CardDescription>Manage your saved addresses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <MapPin className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No saved addresses</h3>
                    <p className="text-muted-foreground mb-4">Add an address for faster checkout</p>
                    <Button variant="outline">
                      <Plus className="w-4 h-4 mr-2" /> Add Address
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'tax-exempt' && (
              <Card>
                <CardHeader>
                  <CardTitle>Tax Exemptions</CardTitle>
                  <CardDescription>Manage tax exemption certificates</CardDescription>
                </CardHeader>
                <CardContent>
                  {exemptions.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No tax exemptions</h3>
                      <p className="text-muted-foreground mb-4">Submit your tax exemption certificate to qualify</p>
                      <Button variant="outline">
                        <Plus className="w-4 h-4 mr-2" /> Submit Certificate
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {exemptions.map((exemption) => (
                        <div key={exemption.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{exemption.state} - {exemption.exemption_type}</p>
                              <p className="text-sm text-muted-foreground">Certificate: {exemption.certificate_number}</p>
                            </div>
                            <Badge variant={exemption.is_verified ? "default" : "secondary"}>
                              {exemption.is_verified ? 'Verified' : 'Pending'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'settings' && (
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>Update your account information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" value={user.email || ''} disabled className="mt-1.5" />
                      <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <h4 className="font-medium text-foreground mb-4">Danger Zone</h4>
                    <Button variant="destructive" size="sm">
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
