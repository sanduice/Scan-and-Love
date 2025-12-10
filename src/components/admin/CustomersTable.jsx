import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, Mail, ShoppingBag, DollarSign, Calendar, 
  ChevronDown, ChevronUp, User
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export default function CustomersTable({ users, orders }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('created_date');
  const [sortDir, setSortDir] = useState('desc');

  // Calculate customer stats
  const customerStats = users.map(user => {
    const userOrders = orders.filter(o => o.created_by === user.email);
    const totalSpent = userOrders
      .filter(o => o.payment_status === 'paid')
      .reduce((sum, o) => sum + (o.total || 0), 0);
    const lastOrder = userOrders.sort((a, b) => 
      new Date(b.created_date) - new Date(a.created_date)
    )[0];

    return {
      ...user,
      orderCount: userOrders.length,
      totalSpent,
      lastOrderDate: lastOrder?.created_date,
      avgOrderValue: userOrders.length > 0 ? totalSpent / userOrders.length : 0,
    };
  });

  // Filter and sort
  const filteredCustomers = customerStats
    .filter(c => 
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (sortField === 'created_date' || sortField === 'lastOrderDate') {
        aVal = new Date(aVal || 0);
        bVal = new Date(bVal || 0);
      }
      if (sortDir === 'desc') return bVal > aVal ? 1 : -1;
      return aVal > bVal ? 1 : -1;
    });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortHeader = ({ field, children }) => (
    <th 
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          sortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
        )}
      </div>
    </th>
  );

  // Calculate totals
  const totalCustomers = filteredCustomers.length;
  const totalRevenue = filteredCustomers.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgLTV = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Customers</p>
          <p className="text-2xl font-bold">{totalCustomers}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Avg Customer LTV</p>
          <p className="text-2xl font-bold">${avgLTV.toFixed(2)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input 
          placeholder="Search customers..." 
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <SortHeader field="full_name">Customer</SortHeader>
              <SortHeader field="orderCount">Orders</SortHeader>
              <SortHeader field="totalSpent">Total Spent</SortHeader>
              <SortHeader field="avgOrderValue">AOV</SortHeader>
              <SortHeader field="lastOrderDate">Last Order</SortHeader>
              <SortHeader field="created_date">Joined</SortHeader>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredCustomers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium">
                      {customer.full_name?.charAt(0) || customer.email?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-medium">{customer.full_name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">{customer.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{customer.orderCount}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="font-medium text-green-600">${customer.totalSpent.toFixed(2)}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-gray-600">${customer.avgOrderValue.toFixed(2)}</span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-500">
                  {customer.lastOrderDate ? formatDistanceToNow(new Date(customer.lastOrderDate), { addSuffix: true }) : 'Never'}
                </td>
                <td className="px-4 py-4 text-sm text-gray-500">
                  {format(new Date(customer.created_date), 'MMM d, yyyy')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}