import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { 
  Package, Users, DollarSign, Search, Eye, LayoutDashboard,
  Truck, CheckCircle, XCircle, Clock, Loader2, RefreshCw,
  Printer, AlertTriangle, TrendingUp, Settings, Tag, ShoppingBag,
  BarChart3, Menu, X, ChevronRight, FileText, Database
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { format, formatDistanceToNow, isToday } from 'date-fns';
import OrderDetailPanel from '@/components/admin/OrderDetailPanel';
import ProductionQueue from '@/components/admin/ProductionQueue';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import ProductsManager from '@/components/admin/ProductsManager';
import CatalogOrganizer from '@/components/admin/CatalogOrganizer';
import CouponsManager from '@/components/admin/CouponsManager';
import CustomersTable from '@/components/admin/CustomersTable';
import SettingsPanel from '@/components/admin/SettingsPanel';
import QuotesManager from '@/components/admin/QuotesManager';
import InvoicesManager from '@/components/admin/InvoicesManager';
import PricingManager from '@/components/admin/PricingManager';
import ReportsDashboard from '@/components/admin/ReportsDashboard';
import TaxSettings from '@/components/admin/TaxSettings';
import ExemptionRequests from '@/components/admin/ExemptionRequests';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  artwork_review: 'bg-orange-100 text-orange-800',
  proof_sent: 'bg-pink-100 text-pink-800',
  proof_approved: 'bg-emerald-100 text-emerald-800',
  in_production: 'bg-purple-100 text-purple-800',
  quality_check: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-cyan-100 text-cyan-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
  on_hold: 'bg-amber-100 text-amber-800',
};

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'quotes', label: 'Quotes', icon: FileText },
  { id: 'invoices', label: 'Invoices', icon: DollarSign },
  { id: 'production', label: 'Production', icon: Printer },
  { id: 'products', label: 'Products', icon: ShoppingBag },
  { id: 'categories', label: 'Categories', icon: Tag },
  { id: 'pricing', label: 'Pricing', icon: DollarSign },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'scraper', label: 'Data Scraper', icon: Database, path: 'Scraper' },
  { id: 'marketing', label: 'Marketing', icon: Tag },
  { id: 'reports', label: 'Reports & Tax', icon: BarChart3 },
  { id: 'maintenance', label: 'Maintenance', icon: RefreshCw, path: 'CleanupDuplicates' },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Admin() {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: orders = [], isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => base44.entities.User.list('-created_date'),
    enabled: currentUser?.role === 'admin',
  });

  const { data: designs = [] } = useQuery({
    queryKey: ['admin-designs'],
    queryFn: () => base44.entities.SavedDesign.list('-created_date'),
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Order.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order updated');
      setShowOrderDialog(false);
    },
  });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You must be an admin to view this page.</p>
        </div>
      </div>
    );
  }

  // Calculate quick stats
  const rushOrders = orders.filter(o => o.is_rush && !['shipped', 'delivered', 'cancelled'].includes(o.status));
  const pendingOrders = orders.filter(o => ['paid', 'artwork_review', 'in_production'].includes(o.status));

  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchQuery || 
      order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.created_by?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleUpdateOrderStatus = (orderId, newStatus) => {
    const updates = { status: newStatus };
    if (newStatus === 'in_production') {
      updates.production_started_at = new Date().toISOString();
    } else if (newStatus === 'shipped') {
      updates.shipped_at = new Date().toISOString();
    } else if (newStatus === 'delivered') {
      updates.delivered_at = new Date().toISOString();
    }
    updateOrderMutation.mutate({ id: orderId, data: updates });
  };

  const handleOrderUpdate = (updatedOrder) => {
    updateOrderMutation.mutate({ id: updatedOrder.id, data: updatedOrder });
  };

  const getItemCount = (order) => {
    try {
      const items = order.items_json ? JSON.parse(order.items_json) : (order.items || []);
      return items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    } catch { return 0; }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <QuickStatCard
                label="Pending Orders"
                value={pendingOrders.length}
                icon={Clock}
                color="yellow"
                onClick={() => { setActiveSection('orders'); setStatusFilter('paid'); }}
              />
              <QuickStatCard
                label="Rush Orders"
                value={rushOrders.length}
                icon={AlertTriangle}
                color="red"
                urgent={rushOrders.length > 0}
                onClick={() => setActiveSection('production')}
              />
              <QuickStatCard
                label="Ready to Ship"
                value={orders.filter(o => o.status === 'quality_check').length}
                icon={Truck}
                color="cyan"
                onClick={() => { setActiveSection('orders'); setStatusFilter('quality_check'); }}
              />
              <QuickStatCard
                label="Today's Revenue"
                value={`$${orders.filter(o => isToday(new Date(o.created_date)) && o.payment_status === 'paid').reduce((s, o) => s + (o.total || 0), 0).toFixed(0)}`}
                icon={DollarSign}
                color="green"
              />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Production Queue */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <ProductionQueue 
                  orders={orders}
                  onSelectOrder={(order) => { setSelectedOrder(order); setShowOrderDialog(true); }}
                  onUpdateStatus={handleUpdateOrderStatus}
                />
              </div>

              {/* Recent Orders */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Recent Orders</h3>
                  <Button variant="ghost" size="sm" onClick={() => setActiveSection('orders')}>
                    View All <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                <div className="space-y-3">
                  {orders.slice(0, 5).map((order) => (
                    <div 
                      key={order.id} 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => { setSelectedOrder(order); setShowOrderDialog(true); }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">#{order.order_number}</p>
                            {order.is_rush && <Badge className="bg-red-100 text-red-800 text-xs">RUSH</Badge>}
                          </div>
                          <p className="text-sm text-gray-500">{getItemCount(order)} items • {formatDistanceToNow(new Date(order.created_date), { addSuffix: true })}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${(order.total || 0).toFixed(2)}</p>
                        <Badge className={`${STATUS_COLORS[order.status]} text-xs`}>
                          {order.status?.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'orders':
        return (
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-4 border-b flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="Search orders..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="artwork_review">Artwork Review</SelectItem>
                  <SelectItem value="proof_sent">Proof Sent</SelectItem>
                  <SelectItem value="proof_approved">Proof Approved</SelectItem>
                  <SelectItem value="in_production">In Production</SelectItem>
                  <SelectItem value="quality_check">Quality Check</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ordersLoading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        No orders found
                      </td>
                    </tr>
                  ) : filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">#{order.order_number || order.id.slice(0, 8)}</span>
                          {order.is_rush && <Badge className="bg-red-100 text-red-800 text-xs">RUSH</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {order.created_by || 'Guest'}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {getItemCount(order)} items
                      </td>
                      <td className="px-4 py-4 font-medium">
                        ${(order.total || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-4">
                        <Select 
                          value={order.status || 'pending'} 
                          onValueChange={(value) => handleUpdateOrderStatus(order.id, value)}
                        >
                          <SelectTrigger className="w-36 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="artwork_review">Artwork Review</SelectItem>
                            <SelectItem value="proof_sent">Proof Sent</SelectItem>
                            <SelectItem value="proof_approved">Proof Approved</SelectItem>
                            <SelectItem value="in_production">In Production</SelectItem>
                            <SelectItem value="quality_check">Quality Check</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                            <SelectItem value="on_hold">On Hold</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {format(new Date(order.created_date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-4">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => { setSelectedOrder(order); setShowOrderDialog(true); }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'quotes':
        return (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <QuotesManager />
          </div>
        );

      case 'invoices':
        return (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <InvoicesManager />
          </div>
        );

      case 'production':
        return (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <ProductionQueue 
              orders={orders}
              onSelectOrder={(order) => { setSelectedOrder(order); setShowOrderDialog(true); }}
              onUpdateStatus={handleUpdateOrderStatus}
            />
          </div>
        );

      case 'products':
        return (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <ProductsManager />
          </div>
        );

      case 'categories':
        return (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <CatalogOrganizer />
          </div>
        );

      case 'customers':
        return (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <CustomersTable users={users} orders={orders} />
          </div>
        );

      case 'marketing':
        return (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <CouponsManager />
          </div>
        );

      case 'pricing':
        return (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <PricingManager />
          </div>
        );

      case 'reports':
        return (
          <div className="space-y-8">
            <ReportsDashboard />
            <div className="grid md:grid-cols-2 gap-6">
               <Card>
                 <CardHeader>
                   <CardTitle>Tax Exemptions</CardTitle>
                   <CardDescription>Manage customer certificates</CardDescription>
                 </CardHeader>
                 <CardContent>
                   <ExemptionRequests />
                 </CardContent>
               </Card>
            </div>
          </div>
        );

      case 'settings':
        return (
           <div className="space-y-8">
             <SettingsPanel />
             <TaxSettings />
           </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 bg-slate-900 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
            {sidebarOpen && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#8BC34A] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">N</span>
                </div>
                <span className="text-white font-semibold">Admin</span>
              </div>
            )}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:block p-1.5 text-slate-400 hover:text-white rounded"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              if (item.path) {
                return (
                  <Link
                    key={item.id}
                    to={createPageUrl(item.path)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-slate-400 hover:bg-slate-800 hover:text-white"
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                  </Link>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveSection(item.id); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-[#8BC34A] text-white' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* User */}
          {sidebarOpen && (
            <div className="p-4 border-t border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-white text-sm font-medium">
                  {currentUser?.full_name?.charAt(0) || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{currentUser?.full_name}</p>
                  <p className="text-xs text-slate-400 truncate">{currentUser?.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900 capitalize">
              {activeSection === 'marketing' ? 'Marketing & Discounts' : activeSection}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {rushOrders.length > 0 && (
              <Badge className="bg-red-100 text-red-800 animate-pulse cursor-pointer" onClick={() => setActiveSection('production')}>
                <AlertTriangle className="w-3 h-3 mr-1" />
                {rushOrders.length} Rush
              </Badge>
            )}
            <Button onClick={() => refetchOrders()} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {renderContent()}
        </main>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <OrderDetailPanel 
              order={selectedOrder}
              onUpdate={handleOrderUpdate}
              onClose={() => setShowOrderDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function QuickStatCard({ label, value, icon: Icon, color, onClick, urgent }) {
  const colorClasses = {
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
    red: 'bg-red-50 border-red-200 text-red-600',
    cyan: 'bg-cyan-50 border-cyan-200 text-cyan-600',
    green: 'bg-green-50 border-green-200 text-green-600',
  };

  return (
    <div 
      className={`rounded-xl border p-5 cursor-pointer transition-all hover:shadow-md ${colorClasses[color]} ${urgent ? 'animate-pulse' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-80">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <Icon className="w-8 h-8 opacity-60" />
      </div>
    </div>
  );
}