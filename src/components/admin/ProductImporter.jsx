import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { bannerbuzzApi } from '@/lib/api/firecrawl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Globe, Search, Download, Loader2, CheckCircle, XCircle, 
  ImageIcon, Package, AlertTriangle, RefreshCw, Trash2 
} from 'lucide-react';

const PRESET_SOURCES = [
  { name: 'Banners', url: 'https://www.bannerbuzz.com/banners' },
  { name: 'Vinyl Banners', url: 'https://www.bannerbuzz.com/banners/vinyl-banners' },
  { name: 'Mesh Banners', url: 'https://www.bannerbuzz.com/banners/mesh-banners' },
  { name: 'Fabric Banners', url: 'https://www.bannerbuzz.com/banners/fabric-banners' },
  { name: 'Retractable Banners', url: 'https://www.bannerbuzz.com/banners/retractable-banners' },
];

export default function ProductImporter() {
  const queryClient = useQueryClient();
  
  // State
  const [sourceUrl, setSourceUrl] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [pricePerSqft, setPricePerSqft] = useState('4.5');
  const [discoveredUrls, setDiscoveredUrls] = useState([]);
  const [scrapedProducts, setScrapedProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [step, setStep] = useState('input'); // input, discovering, discovered, scraping, scraped, importing
  const [progress, setProgress] = useState(0);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase
        .from('product_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');
      return data || [];
    },
  });

  // Discover products mutation
  const discoverMutation = useMutation({
    mutationFn: async (url) => {
      setStep('discovering');
      setProgress(0);
      const result = await bannerbuzzApi.discoverProducts(url);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: (data) => {
      setDiscoveredUrls(data.urls || []);
      setStep('discovered');
      toast.success(`Found ${data.urls?.length || 0} product URLs`);
    },
    onError: (error) => {
      setStep('input');
      toast.error(`Discovery failed: ${error.message}`);
    },
  });

  // Scrape products mutation
  const scrapeMutation = useMutation({
    mutationFn: async (urls) => {
      setStep('scraping');
      setProgress(0);
      
      // Process in batches
      const batchSize = 5;
      const allProducts = [];
      const allErrors = [];
      
      for (let i = 0; i < urls.length; i += batchSize) {
        const batch = urls.slice(i, i + batchSize);
        const result = await bannerbuzzApi.scrapeProducts(batch);
        
        if (result.products) {
          allProducts.push(...result.products);
        }
        if (result.errors) {
          allErrors.push(...result.errors);
        }
        
        setProgress(Math.min(100, ((i + batchSize) / urls.length) * 100));
      }
      
      return { products: allProducts, errors: allErrors };
    },
    onSuccess: (data) => {
      setScrapedProducts(data.products || []);
      setSelectedProducts(new Set(data.products?.map((_, i) => i) || []));
      setStep('scraped');
      toast.success(`Scraped ${data.products?.length || 0} products`);
      if (data.errors?.length > 0) {
        toast.warning(`${data.errors.length} URLs failed to scrape`);
      }
    },
    onError: (error) => {
      setStep('discovered');
      toast.error(`Scraping failed: ${error.message}`);
    },
  });

  // Import products mutation
  const importMutation = useMutation({
    mutationFn: async () => {
      setStep('importing');
      setProgress(0);
      
      const productsToImport = scrapedProducts.filter((_, i) => selectedProducts.has(i));
      const result = await bannerbuzzApi.importProducts(
        productsToImport,
        selectedCategory,
        parseFloat(pricePerSqft)
      );
      
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`Imported ${data.imported} products (${data.skipped} skipped)`);
      resetImporter();
    },
    onError: (error) => {
      setStep('scraped');
      toast.error(`Import failed: ${error.message}`);
    },
  });

  const resetImporter = () => {
    setStep('input');
    setDiscoveredUrls([]);
    setScrapedProducts([]);
    setSelectedProducts(new Set());
    setProgress(0);
  };

  const toggleProductSelection = (index) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedProducts(newSelected);
  };

  const selectAllProducts = () => {
    setSelectedProducts(new Set(scrapedProducts.map((_, i) => i)));
  };

  const deselectAllProducts = () => {
    setSelectedProducts(new Set());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Product Importer</h2>
          <p className="text-muted-foreground">Import products from BannerBuzz.com</p>
        </div>
        {step !== 'input' && (
          <Button variant="outline" onClick={resetImporter}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Start Over
          </Button>
        )}
      </div>

      {/* Step 1: Input */}
      {step === 'input' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Source URL
              </CardTitle>
              <CardDescription>Enter a category page URL from BannerBuzz</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Quick Select</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_SOURCES.map((source) => (
                    <Button
                      key={source.url}
                      variant={sourceUrl === source.url ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSourceUrl(source.url)}
                    >
                      {source.name}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Or enter custom URL</Label>
                <Input
                  placeholder="https://www.bannerbuzz.com/banners"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Import Settings
              </CardTitle>
              <CardDescription>Configure how products will be imported</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Target Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Price per Square Foot ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={pricePerSqft}
                  onChange={(e) => setPricePerSqft(e.target.value)}
                />
              </div>

              <div className="pt-4">
                <Button 
                  className="w-full" 
                  disabled={!sourceUrl || !selectedCategory}
                  onClick={() => discoverMutation.mutate(sourceUrl)}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Discover Products
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Discovering */}
      {step === 'discovering' && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
              <div>
                <p className="font-medium">Discovering products...</p>
                <p className="text-sm text-muted-foreground">Scanning {sourceUrl}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Discovered URLs */}
      {step === 'discovered' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Found {discoveredUrls.length} Products
              </span>
              <Button onClick={() => scrapeMutation.mutate(discoveredUrls)}>
                <Download className="w-4 h-4 mr-2" />
                Scrape All Products
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {discoveredUrls.map((url, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm">
                    <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{url}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Scraping */}
      {step === 'scraping' && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
              <div>
                <p className="font-medium">Scraping product details...</p>
                <p className="text-sm text-muted-foreground">This may take a few minutes</p>
              </div>
              <Progress value={progress} className="max-w-md mx-auto" />
              <p className="text-sm text-muted-foreground">{Math.round(progress)}% complete</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Scraped Products */}
      {step === 'scraped' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Scraped {scrapedProducts.length} Products
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={selectAllProducts}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAllProducts}>
                  Deselect All
                </Button>
                <Button 
                  disabled={selectedProducts.size === 0}
                  onClick={() => importMutation.mutate()}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Import {selectedProducts.size} Products
                </Button>
              </div>
            </div>
            <CardDescription>
              Select products to import into category: {categories.find(c => c.id === selectedCategory)?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {scrapedProducts.map((product, i) => (
                  <div 
                    key={i} 
                    className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedProducts.has(i) ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => toggleProductSelection(i)}
                  >
                    <Checkbox 
                      checked={selectedProducts.has(i)}
                      onCheckedChange={() => toggleProductSelection(i)}
                    />
                    
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{product.name || 'Unnamed Product'}</h4>
                      <p className="text-sm text-muted-foreground truncate">{product.source_url}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">
                          {product.preset_sizes?.length || 0} sizes
                        </Badge>
                        <Badge variant="outline">
                          {product.product_options?.length || 0} options
                        </Badge>
                        <Badge variant="outline">
                          {product.gallery_images?.length || 0} images
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Step 6: Importing */}
      {step === 'importing' && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
              <div>
                <p className="font-medium">Importing products...</p>
                <p className="text-sm text-muted-foreground">Adding products to your catalog</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
