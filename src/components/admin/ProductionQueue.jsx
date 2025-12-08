import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, Printer, CheckCircle, Package, AlertTriangle, Eye
} from 'lucide-react';
import moment from 'moment';

const STATUS_PRIORITY = {
  'paid': 1,
  'artwork_review': 2,
  'in_production': 3,
  'quality_check': 4,
};

export default function ProductionQueue({ orders, onSelectOrder, onUpdateStatus }) {
  // Filter and sort orders in production pipeline
  const productionOrders = orders
    .filter(o => ['paid', 'artwork_review', 'in_production', 'quality_check'].includes(o.status))
    .sort((a, b) => {
      // Rush orders first
      if (a.is_rush && !b.is_rush) return -1;
      if (!a.is_rush && b.is_rush) return 1;
      // Then by status priority
      const priorityDiff = (STATUS_PRIORITY[a.status] || 99) - (STATUS_PRIORITY[b.status] || 99);
      if (priorityDiff !== 0) return priorityDiff;
      // Then by date
      return new Date(a.created_date) - new Date(b.created_date);
    });

  const getItemCount = (order) => {
    try {
      const items = order.items_json ? JSON.parse(order.items_json) : (order.items || []);
      return items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    } catch { return 0; }
  };

  const getNextStatus = (currentStatus) => {
    const flow = ['paid', 'artwork_review', 'in_production', 'quality_check', 'shipped'];
    const currentIndex = flow.indexOf(currentStatus);
    return currentIndex < flow.length - 1 ? flow[currentIndex + 1] : null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Production Queue</h3>
        <Badge variant="outline">{productionOrders.length} orders</Badge>
      </div>

      {productionOrders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No orders in production</p>
        </div>
      ) : (
        <div className="space-y-2">
          {productionOrders.map((order) => {
            const nextStatus = getNextStatus(order.status);
            const itemCount = getItemCount(order);
            const daysOld = moment().diff(moment(order.created_date), 'days');
            
            return (
              <div 
                key={order.id} 
                className={`p-4 rounded-lg border ${order.is_rush ? 'border-red-300 bg-red-50' : 'bg-white'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      order.status === 'paid' ? 'bg-blue-100' :
                      order.status === 'artwork_review' ? 'bg-orange-100' :
                      order.status === 'in_production' ? 'bg-purple-100' :
                      'bg-indigo-100'
                    }`}>
                      {order.status === 'paid' && <Clock className="w-5 h-5 text-blue-600" />}
                      {order.status === 'artwork_review' && <Eye className="w-5 h-5 text-orange-600" />}
                      {order.status === 'in_production' && <Printer className="w-5 h-5 text-purple-600" />}
                      {order.status === 'quality_check' && <CheckCircle className="w-5 h-5 text-indigo-600" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">#{order.order_number}</span>
                        {order.is_rush && (
                          <Badge className="bg-red-100 text-red-800 text-xs">RUSH</Badge>
                        )}
                        {daysOld > 2 && (
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {daysOld}d old
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {itemCount} item{itemCount !== 1 ? 's' : ''} • ${(order.total || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onSelectOrder(order)}
                    >
                      View
                    </Button>
                    {nextStatus && (
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => onUpdateStatus(order.id, nextStatus)}
                      >
                        → {nextStatus.replace('_', ' ')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}