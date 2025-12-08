import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Download, DollarSign, TrendingUp, Map } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import moment from 'moment';

export default function ReportsDashboard() {
  const [timeRange, setTimeRange] = React.useState('30d');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders-report'],
    queryFn: () => base44.entities.Order.filter({ payment_status: 'paid' }),
  });

  const reportData = useMemo(() => {
    if (!orders.length) return { salesByState: [], salesOverTime: [], totals: {} };

    // Filter by time range
    const now = moment();
    const filteredOrders = orders.filter(order => {
      const orderDate = moment(order.created_date);
      if (timeRange === '7d') return orderDate.isAfter(now.clone().subtract(7, 'days'));
      if (timeRange === '30d') return orderDate.isAfter(now.clone().subtract(30, 'days'));
      if (timeRange === '90d') return orderDate.isAfter(now.clone().subtract(90, 'days'));
      if (timeRange === 'ytd') return orderDate.isSame(now, 'year');
      return true;
    });

    // Aggregate by State
    const byState = {};
    filteredOrders.forEach(order => {
      try {
        const shipping = JSON.parse(order.shipping_address_json || '{}');
        const state = shipping.state || 'Unknown';
        if (!byState[state]) byState[state] = { state, sales: 0, tax: 0, orders: 0 };
        byState[state].sales += (order.subtotal || 0);
        byState[state].tax += (order.tax || 0);
        byState[state].orders += 1;
      } catch (e) {}
    });

    // Aggregate Sales Over Time
    const byTime = {};
    filteredOrders.forEach(order => {
      const date = moment(order.created_date).format('MMM DD');
      if (!byTime[date]) byTime[date] = { date, sales: 0, tax: 0 };
      byTime[date].sales += (order.subtotal || 0);
      byTime[date].tax += (order.tax || 0);
    });

    // Totals
    const totalSales = filteredOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
    const totalTax = filteredOrders.reduce((sum, o) => sum + (o.tax || 0), 0);
    const totalShipping = filteredOrders.reduce((sum, o) => sum + (o.shipping_cost || 0), 0);

    return {
      salesByState: Object.values(byState).sort((a, b) => b.sales - a.sales),
      salesOverTime: Object.values(byTime).sort((a, b) => moment(a.date, 'MMM DD').diff(moment(b.date, 'MMM DD'))),
      totals: { totalSales, totalTax, totalShipping, count: filteredOrders.length }
    };
  }, [orders, timeRange]);

  const handleExport = () => {
    const headers = ['State', 'Gross Sales', 'Tax Collected', 'Order Count'];
    const csvContent = [
      headers.join(','),
      ...reportData.salesByState.map(row => 
        `${row.state},${row.sales.toFixed(2)},${row.tax.toFixed(2)},${row.orders}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tax_report_${timeRange}_${moment().format('YYYY-MM-DD')}.csv`;
    link.click();
  };

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-gray-400" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Financial Reports</h2>
          <p className="text-gray-500">Sales tax and revenue analytics</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExport} variant="outline">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Totals Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-gray-500">Gross Sales</p>
              <DollarSign className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold">${reportData.totals.totalSales?.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-gray-500">Tax Collected</p>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-600">${reportData.totals.totalTax?.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-gray-500">Shipping Collected</p>
              <Map className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-600">${reportData.totals.totalShipping?.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold">{reportData.totals.count}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Sales Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.salesOverTime}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`$${value.toFixed(2)}`, 'Amount']}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="sales" fill="#2563eb" radius={[4, 4, 0, 0]} name="Sales" />
                  <Bar dataKey="tax" fill="#16a34a" radius={[4, 4, 0, 0]} name="Tax" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* State Breakdown */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Tax Liability by State</CardTitle>
            <CardDescription>Where you have collected sales tax</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {reportData.salesByState.map((stateData, i) => (
                <div key={stateData.state} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600">
                      {stateData.state}
                    </div>
                    <div>
                      <div className="font-medium">{stateData.orders} Orders</div>
                      <div className="text-xs text-gray-500">Sales: ${stateData.sales.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">${stateData.tax.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">Tax Collected</div>
                  </div>
                </div>
              ))}
              {reportData.salesByState.length === 0 && (
                <div className="text-center py-8 text-gray-500">No sales data for this period</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}