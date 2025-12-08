import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Download, Trash2, ExternalLink, Play, Database, ArrowRightCircle, Info, X } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

const TARGET_URLS = [
  { name: 'Vinyl Banners', url: 'https://www.signs.com/vinyl-banners/', category: 'vinyl-banner' },
  { name: 'Yard Signs', url: 'https://www.signs.com/yard-signs/', category: 'yard-sign' },
  { name: 'Retractable Banners', url: 'https://www.signs.com/retractable-banners/', category: 'retractable-banner' },
  { name: 'Mesh Banners', url: 'https://www.signs.com/mesh-banners/', category: 'vinyl-banner' },
  { name: 'Aluminum Signs', url: 'https://www.signs.com/aluminum-signs/', category: 'metal-sign' },
  { name: 'Decals & Stickers', url: 'https://www.signs.com/decals/', category: 'sticker' },
  { name: 'Car Magnets', url: 'https://www.signs.com/car-magnets/', category: 'magnet' },
  { name: 'Window Clings', url: 'https://www.signs.com/window-clings/', category: 'window-cling' },
  { name: 'Foam Board', url: 'https://www.signs.com/foam-board-printing/', category: 'foam-board' },
  { name: 'A-Frames', url: 'https://www.signs.com/sandwich-boards/', category: 'a-frame' },
  { name: 'Signazon: Car Magnets', url: 'https://www.signazon.com/car-magnets/', category: 'magnet' },
  { name: 'Signazon: Vinyl Banners', url: 'https://www.signazon.com/vinyl-banners/', category: 'vinyl-banner' },
  { name: 'Signazon: Window Decals', url: 'https://www.signazon.com/window-decals/', category: 'window-decal' },
  { name: 'Signazon: Yard Signs', url: 'https://www.signazon.com/yard-signs/', category: 'yard-sign' },
  { name: 'Custom Flags', url: 'https://www.signs.com/feather-flags/', category: 'flag' },
  { name: 'Canvas Prints', url: 'https://www.signs.com/canvas-prints/', category: 'canvas' },
  { name: 'Acrylic Signs', url: 'https://www.signs.com/acrylic-signs/', category: 'acrylic-sign' },
  { name: 'Signarama: Banners', url: 'https://signarama.com/products/banners', category: 'vinyl-banner' },
  { name: 'Signarama: Signs', url: 'https://signarama.com/products/signs', category: 'yard-sign' },
  { name: 'Signarama: Vehicle Graphics', url: 'https://signarama.com/products/vehicle-graphics', category: 'window-decal' },
  ];

export default function Scraper() {
  const queryClient = useQueryClient();
  const [customUrl, setCustomUrl] = useState('');
  const [processingUrl, setProcessingUrl] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);

  // Fetch scraped products
  const { data: scrapedProducts = [], isLoading } = useQuery({
    queryKey: ['scraped-products'],
    queryFn: () => base44.entities.ScrapedProduct.list('-scraped_at'),
  });

  // Scrape mutation
  const scrapeMutation = useMutation({
    mutationFn: async ({ url, category }) => {
      setProcessingUrl(url);
      const response = await base44.functions.invoke('scrapeSignsData', { url, category });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Successfully scraped ${data.count} products`);
      queryClient.invalidateQueries({ queryKey: ['scraped-products'] });
      setProcessingUrl(null);
      setCustomUrl('');
    },
    onError: (error) => {
      toast.error(`Scrape failed: ${error.message}`);
      setProcessingUrl(null);
    },
  });

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async (scrapedProduct) => {
      const response = await base44.functions.invoke('importScrapedProduct', { scraped_product_id: scrapedProduct.id });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Imported ${data.product_slug} to catalog!`);
    },
    onError: (error) => {
      toast.error(`Import failed: ${error.message}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => base44.entities.ScrapedProduct.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scraped-products'] });
      toast.success('Item deleted');
    },
  });

  // Clear all
  const clearAllMutation = useMutation({
    mutationFn: async () => {
      // In a real app we'd have a bulk delete or truncate, here we iterate (not ideal for large sets but ok for tool)
      const items = await base44.entities.ScrapedProduct.list();
      await Promise.all(items.map(item => base44.entities.ScrapedProduct.delete(item.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scraped-products'] });
      toast.success('All scraped data cleared');
    },
  });

  const handleExportCSV = () => {
    if (scrapedProducts.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Detailed headers for the "Bad Ass" export
    const headers = [
      'Category', 
      'Name', 
      'Image 1',
      'Image 2',
      'Pricing Mode',
      'Base Rate (SqFt)',
      'Standard Sizes (JSON)',
      'Qty Discounts (JSON)',
      'Options (JSON)',
      'Specs (JSON)',
      'Features (JSON)',
      'Constraints (JSON)', // Added header
      'Description', 
      'Source URL'
    ];

    const csvContent = [
      headers.join(','),
      ...scrapedProducts.map(p => {
        let details = {};
        let images = [];
        try { details = JSON.parse(p.options_json || '{}'); } catch (e) {}
        try { images = JSON.parse(p.images_json || '[]'); } catch (e) {}

        return [
          p.category,
          `"${p.name?.replace(/"/g, '""')}"`,
          images[0] || '',
          images[1] || '',
          details.pricing_mode || 'N/A',
          details.base_rate_sqft || 'N/A',
          `"${JSON.stringify(details.standard_sizes || []).replace(/"/g, '""')}"`,
          `"${JSON.stringify(details.quantity_discounts || []).replace(/"/g, '""')}"`,
          `"${JSON.stringify(details.options || []).replace(/"/g, '""')}"`,
          `"${JSON.stringify(details.specs || {}).replace(/"/g, '""')}"`,
          `"${JSON.stringify(details.features || []).replace(/"/g, '""')}"`,
          `"${JSON.stringify(details.constraints || {}).replace(/"/g, '""')}"`, // Added constraints to CSV
          `"${p.description?.replace(/"/g, '""')}"`,
          p.source_url
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `scraped_products_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Competitor Data Scraper</h1>
            <p className="text-gray-600">Extract product data from signs.com for analysis</p>
          </div>
          <Link to={createPageUrl('Admin')}>
            <Button variant="outline">Back to Admin</Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Controls */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Target Categories</CardTitle>
                <CardDescription>Select a category to scrape</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {TARGET_URLS.map((target) => (
                  <div key={target.url} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                    <div className="flex-1">
                      <div className="font-medium">{target.name}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[200px]">{target.url}</div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => scrapeMutation.mutate({ url: target.url, category: target.category })}
                      disabled={!!processingUrl}
                    >
                      {processingUrl === target.url ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ))}

                <div className="pt-4 border-t mt-4">
                  <label className="text-sm font-medium mb-2 block">Custom URL</label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="https://www.signs.com/..." 
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                    />
                    <Button
                      onClick={() => scrapeMutation.mutate({ url: customUrl, category: 'custom' })}
                      disabled={!customUrl || !!processingUrl}
                    >
                      {processingUrl === customUrl ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full" 
                  onClick={handleExportCSV}
                  disabled={scrapedProducts.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export to CSV
                </Button>
                
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => {
                    if(confirm('Are you sure you want to delete all scraped data?')) {
                      clearAllMutation.mutate();
                    }
                  }}
                  disabled={scrapedProducts.length === 0 || clearAllMutation.isPending}
                >
                  {clearAllMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Clear All Data
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Scraped Data</CardTitle>
                  <CardDescription>
                    {scrapedProducts.length} items found
                  </CardDescription>
                </div>
                <Database className="w-5 h-5 text-gray-400" />
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  </div>
                ) : scrapedProducts.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No data scraped yet. Select a category to begin.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Image</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scrapedProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            {(() => {
                              try {
                                const imgs = JSON.parse(product.images_json || '[]');
                                if (imgs.length > 0) {
                                  return <img src={imgs[0]} alt="Product" className="h-12 w-12 rounded object-cover border" />;
                                }
                              } catch (e) {}
                              return <div className="h-12 w-12 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-400">No Img</div>;
                            })()}
                          </TableCell>
                          <TableCell className="font-medium">
                            <div>{product.name}</div>
                            <a 
                              href={product.source_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                            >
                              View Source <ExternalLink className="w-3 h-3" />
                            </a>
                          </TableCell>
                          <TableCell>{product.category}</TableCell>
                          <TableCell>{product.base_price}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setViewProduct(product)}
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                title="View Extracted Details"
                              >
                                <Info className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => importMutation.mutate(product)}
                                className="text-green-600 hover:text-green-800 hover:bg-green-50"
                                title="Import to Catalog"
                                disabled={importMutation.isPending}
                              >
                                {importMutation.isPending ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <ArrowRightCircle className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteMutation.mutate(product.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Detail View Dialog */}
      <Dialog open={!!viewProduct} onOpenChange={(open) => !open && setViewProduct(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Scraped Data: {viewProduct?.name}</DialogTitle>
          </DialogHeader>
          
          {viewProduct && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Pricing Model</h3>
                  <div className="p-3 bg-gray-50 rounded border text-sm font-mono">
                    {(() => {
                      try {
                        const opts = JSON.parse(viewProduct.options_json || '{}');
                        if (opts.pricing) {
                          return (
                            <div className="space-y-1">
                              <div>Method: <Badge variant="outline">{opts.pricing.method}</Badge></div>
                              <div>Unit: <span className="font-bold">{opts.pricing.unit}</span></div>
                              <div>Base Rate: <span className="text-green-600">${opts.pricing.base_rate}</span></div>
                              <div>Min Price: ${opts.pricing.min_price}</div>
                              <div>Setup Fee: ${opts.pricing.setup_fee}</div>
                            </div>
                          );
                        }
                        return "Legacy/Simple pricing extracted";
                      } catch(e) { return "Error parsing pricing"; }
                    })()}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Specs & Options</h3>
                  <div className="p-3 bg-gray-50 rounded border text-sm max-h-40 overflow-y-auto">
                    {(() => {
                      try {
                        const opts = JSON.parse(viewProduct.options_json || '{}');
                        return (
                          <div className="space-y-2">
                            <div>
                              <div className="font-medium text-xs uppercase text-gray-400">Specs</div>
                              <pre className="text-xs">{JSON.stringify(opts.specs || {}, null, 2)}</pre>
                            </div>
                            <div>
                              <div className="font-medium text-xs uppercase text-gray-400">Options</div>
                              <div className="flex flex-wrap gap-1">
                                {opts.options?.map((o, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">{o.name} ({o.values.length})</Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      } catch(e) { return "Error parsing options"; }
                    })()}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Quantity Discounts</h3>
                <div className="border rounded overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="h-8">Min Qty</TableHead>
                        <TableHead className="h-8">Max Qty</TableHead>
                        <TableHead className="h-8">Discount</TableHead>
                        <TableHead className="h-8">Fixed Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        try {
                          const opts = JSON.parse(viewProduct.options_json || '{}');
                          const breaks = opts.quantity_discounts || [];
                          if (breaks.length === 0) return <TableRow><TableCell colSpan={4} className="text-center text-gray-400">No quantity breaks found</TableCell></TableRow>;
                          
                          return breaks.map((b, i) => (
                            <TableRow key={i}>
                              <TableCell>{b.qty_min}</TableCell>
                              <TableCell>{b.qty_max || '∞'}</TableCell>
                              <TableCell>{b.discount_percent ? `${b.discount_percent}%` : '-'}</TableCell>
                              <TableCell>{b.fixed_price ? `$${b.fixed_price}` : '-'}</TableCell>
                            </TableRow>
                          ));
                        } catch(e) { return null; }
                      })()}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div>
                 <h3 className="text-sm font-medium text-gray-500 mb-1">Raw JSON Data</h3>
                 <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg text-xs overflow-x-auto font-mono">
                   {JSON.stringify(JSON.parse(viewProduct.options_json || '{}'), null, 2)}
                 </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}