import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';

export default function ExemptionRequests() {
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['exemption-requests'],
    queryFn: () => base44.entities.CustomerTaxExemption.list('-created_date'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.CustomerTaxExemption.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exemption-requests'] });
      toast.success('Status updated');
    },
  });

  if (isLoading) return <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Exemption #</TableHead>
              <TableHead>Document</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">No exemption requests found</TableCell>
              </TableRow>
            ) : (
              requests.map(req => (
                <TableRow key={req.id}>
                  <TableCell>
                    <div className="font-medium">{req.company_name}</div>
                    <div className="text-xs text-gray-500">{req.user_email}</div>
                  </TableCell>
                  <TableCell>{req.state}</TableCell>
                  <TableCell>{req.exemption_number}</TableCell>
                  <TableCell>
                    <a 
                      href={req.document_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:underline"
                    >
                      <FileText className="w-4 h-4 mr-1" /> View
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge className={
                      req.status === 'approved' ? 'bg-green-100 text-green-800' :
                      req.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {req.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {req.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'approved' })}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'rejected' })}
                        >
                          <XCircle className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}