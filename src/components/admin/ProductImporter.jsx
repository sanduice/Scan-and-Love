import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { bannerbuzzApi } from '@/lib/api/firecrawl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Globe, Search, Download, Loader2, CheckCircle, XCircle, 
  ImageIcon, Package, AlertTriangle, RefreshCw, Terminal,
  ArrowRight, ChevronRight, Settings, List, Grid, RotateCcw
} from 'lucide-react';
import ProductImportCard from './ProductImportCard';
import ImportLogPanel from './ImportLogPanel';

const PRESET_SOURCES = [
  { name: 'Vinyl Banners', url: 'https://www.bannerbuzz.com/banners/vinyl-banners' },
  { name: 'Mesh Banners', url: 'https://www.bannerbuzz.com/banners/mesh-banners' },
  { name: 'Fabric Banners', url: 'https://www.bannerbuzz.com/banners/fabric-banners' },
  { name: 'Retractable Banners', url: 'https://www.bannerbuzz.com/banners/retractable-banners' },
  { name: 'Step & Repeat', url: 'https://www.bannerbuzz.com/banners/step-and-repeat-banners' },
  { name: 'Pole Banners', url: 'https://www.bannerbuzz.com/banners/pole-banners' },
  { name: 'Feather Flags', url: 'https://www.bannerbuzz.com/flags/feather-flags' },
  { name: 'Teardrop Flags', url: 'https://www.bannerbuzz.com/flags/teardrop-flags' },
];

const STEPS = [
  { id: 'source', label: 'Source', icon: Globe },
  { id: 'discover', label: 'Discover', icon: Search },
  { id: 'scrape', label: 'Scrape', icon: Download },
  { id: 'review', label: 'Review', icon: List },
  { id: 'import', label: 'Import', icon: Package },
];

export default function ProductImporter() {
  const queryClient = useQueryClient();
  
  // State
  const [currentStep, setCurrentStep] = useState('source');
  const [sourceUrl, setSourceUrl] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [pricePerSqft, setPricePerSqft] = useState('4.5');
  const [discoveredUrls, setDiscoveredUrls] = useState([]);
  const [scrapedProducts, setScrapedProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [scrapeErrors, setScrapeErrors] = useState([]);

  // Add log entry
  const addLog = useCallback((message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
    setLogs(prev => [...prev, { message, type, timestamp }]);
  }, []);

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
      setCurrentStep('discover');
      setProgress(0);
      setProgressText('Mapping website URLs...');
      setLogs([]);
      setShowLogs(true);
      
      addLog(`Starting discovery for: ${url}`, 'loading');
      
      const result = await bannerbuzzApi.discoverProducts(url);
      
      if (!result.success) {
        addLog(`Discovery failed: ${result.error}`, 'error');
        throw new Error(result.error);
      }
      
      return result;
    },
    onSuccess: (data) => {
      const urlCount = data.urls?.length || 0;
      setDiscoveredUrls(data.urls || []);
      setProgress(100);
      
      if (urlCount > 0) {
        addLog(`Found ${urlCount} product URLs`, 'success');
        toast.success(`Found ${urlCount} product URLs`);
      } else {
        addLog(data.message || 'No products found', 'warning');
        toast.warning(data.message || 'No product URLs found');
      }
    },
    onError: (error) => {
      setCurrentStep('source');
      addLog(`Error: ${error.message}`, 'error');
      toast.error(`Discovery failed: ${error.message}`);
    },
  });

  // Scrape products mutation
  const scrapeMutation = useMutation({
    mutationFn: async (urls) => {
      setCurrentStep('scrape');
      setProgress(0);
      setProgressText('Preparing to scrape...');
      setScrapeErrors([]);
      
      addLog(`Starting scrape of ${urls.length} URLs`, 'loading');
      
      // Process in batches
      const batchSize = 5;
      const allProducts = [];
      const allErrors = [];
      
      for (let i = 0; i < urls.length; i += batchSize) {
        const batch = urls.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(urls.length / batchSize);
        
        setProgressText(`Scraping batch ${batchNum}/${totalBatches}...`);
        addLog(`Processing batch ${batchNum}/${totalBatches} (${batch.length} URLs)`, 'loading');
        
        const result = await bannerbuzzApi.scrapeProducts(batch);
        
        if (result.products) {
          allProducts.push(...result.products);
          for (const p of result.products) {
            addLog(`✓ ${p.name}`, 'success');
          }
        }
        if (result.errors) {
          allErrors.push(...result.errors);
          for (const e of result.errors) {
            addLog(`✗ ${e.url}: ${e.error}`, 'error');
          }
        }
        
        setProgress(Math.min(100, ((i + batchSize) / urls.length) * 100));
      }
      
      return { products: allProducts, errors: allErrors };
    },
    onSuccess: (data) => {
      setScrapedProducts(data.products || []);
      setSelectedProducts(new Set(data.products?.map((_, i) => i) || []));
      setScrapeErrors(data.errors || []);
      setCurrentStep('review');
      setProgress(100);
      
      addLog(`Scraping complete: ${data.products?.length || 0} success, ${data.errors?.length || 0} failed`, 
        data.products?.length > 0 ? 'success' : 'warning');
      
      toast.success(`Scraped ${data.products?.length || 0} products`);
      if (data.errors?.length > 0) {
        toast.warning(`${data.errors.length} URLs failed to scrape`);
      }
    },
    onError: (error) => {
      setCurrentStep('discover');
      addLog(`Scrape error: ${error.message}`, 'error');
      toast.error(`Scraping failed: ${error.message}`);
    },
  });

  // Import products mutation
  const importMutation = useMutation({
    mutationFn: async () => {
      setCurrentStep('import');
      setProgress(0);
      setProgressText('Importing products...');
      
      const productsToImport = scrapedProducts.filter((_, i) => selectedProducts.has(i));
      addLog(`Importing ${productsToImport.length} products to database`, 'loading');
      
      const result = await bannerbuzzApi.importProducts(
        productsToImport,
        selectedCategory,
        parseFloat(pricePerSqft)
      );
      
      if (!result.success) {
        addLog(`Import failed: ${result.error}`, 'error');
        throw new Error(result.error);
      }
      
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setProgress(100);
      
      addLog(`Import complete: ${data.imported} imported, ${data.skipped} skipped`, 'success');
      
      if (data.importedProducts?.length > 0) {
        for (const name of data.importedProducts.slice(0, 5)) {
          addLog(`✓ Imported: ${name}`, 'success');
        }
        if (data.importedProducts.length > 5) {
          addLog(`... and ${data.importedProducts.length - 5} more`, 'info');
        }
      }
      
      toast.success(`Imported ${data.imported} products (${data.skipped} skipped)`);
    },
    onError: (error) => {
      setCurrentStep('review');
      addLog(`Import error: ${error.message}`, 'error');
      toast.error(`Import failed: ${error.message}`);
    },
  });

  const resetImporter = () => {
    setCurrentStep('source');
    setSourceUrl('');
    setDiscoveredUrls([]);
    setScrapedProducts([]);
    setSelectedProducts(new Set());
    setScrapeErrors([]);
    setProgress(0);
    setProgressText('');
    setLogs([]);
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

  const updateProduct = (index, updatedProduct) => {
    const newProducts = [...scrapedProducts];
    newProducts[index] = updatedProduct;
    setScrapedProducts(newProducts);
  };

  const retryFailedScrapes = () => {
    if (scrapeErrors.length > 0) {
      const failedUrls = scrapeErrors.map(e => e.url);
      scrapeMutation.mutate(failedUrls);
    }
  };

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);
  const isLoading = discoverMutation.isPending || scrapeMutation.isPending || importMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Product Importer</h2>
          <p className="text-muted-foreground">Import products from BannerBuzz.com</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowLogs(!showLogs)}
          >
            <Terminal className="w-4 h-4 mr-2" />
            {showLogs ? 'Hide' : 'Show'} Logs
          </Button>
          {currentStep !== 'source' && (
            <Button variant="outline" onClick={resetImporter}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Start Over
            </Button>
          )}
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between px-4">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isActive = step.id === currentStep;
          const isComplete = i < currentStepIndex;
          const isDisabled = i > currentStepIndex;
          
          return (
            <React.Fragment key={step.id}>
              <div className={`flex items-center gap-2 ${isDisabled ? 'opacity-40' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  isComplete ? 'bg-green-500 text-white' :
                  isActive ? 'bg-primary text-primary-foreground' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {isComplete ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <span className={`text-sm font-medium hidden sm:block ${
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <ChevronRight className={`w-5 h-5 flex-shrink-0 ${
                  i < currentStepIndex ? 'text-green-500' : 'text-muted-foreground/30'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {/* Step 1: Source Selection */}
        {currentStep === 'source' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Source URL
                </CardTitle>
                <CardDescription>
                  Select a BannerBuzz category page to import products from
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Quick Select Category</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESET_SOURCES.map((source) => (
                      <Button
                        key={source.url}
                        variant={sourceUrl === source.url ? 'default' : 'outline'}
                        size="sm"
                        className="justify-start text-left h-auto py-2"
                        onClick={() => setSourceUrl(source.url)}
                      >
                        {source.name}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or enter custom URL
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Input
                    placeholder="https://www.bannerbuzz.com/banners/vinyl-banners"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tip: Use specific category URLs (e.g., /banners/vinyl-banners) for better results
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Import Settings
                </CardTitle>
                <CardDescription>
                  Configure how products will be imported
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Target Category *</Label>
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
                    min="0"
                    value={pricePerSqft}
                    onChange={(e) => setPricePerSqft(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    This price will be applied to all imported products
                  </p>
                </div>

                <div className="pt-4">
                  <Button 
                    className="w-full" 
                    size="lg"
                    disabled={!sourceUrl || !selectedCategory || isLoading}
                    onClick={() => discoverMutation.mutate(sourceUrl)}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Discover Products
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Discovery Progress / Results */}
        {currentStep === 'discover' && (
          <Card>
            <CardContent className="py-8">
              {discoverMutation.isPending ? (
                <div className="text-center space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
                  <div>
                    <p className="font-medium">Discovering products...</p>
                    <p className="text-sm text-muted-foreground">{progressText}</p>
                  </div>
                  <Progress value={progress} className="max-w-md mx-auto" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 ${
                      discoveredUrls.length > 0 ? 'bg-green-100 dark:bg-green-900' : 'bg-yellow-100 dark:bg-yellow-900'
                    }`}>
                      {discoveredUrls.length > 0 ? (
                        <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                      ) : (
                        <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                      )}
                    </div>
                    <h3 className="text-xl font-semibold">
                      {discoveredUrls.length > 0 
                        ? `Found ${discoveredUrls.length} Product URLs`
                        : 'No Products Found'
                      }
                    </h3>
                    {discoveredUrls.length === 0 && (
                      <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                        Try using a more specific category URL like /banners/vinyl-banners instead of /banners
                      </p>
                    )}
                  </div>

                  {discoveredUrls.length > 0 && (
                    <>
                      <ScrollArea className="h-[200px] border rounded-lg p-3">
                        <div className="space-y-1">
                          {discoveredUrls.map((url, i) => (
                            <div key={i} className="flex items-center gap-2 py-1 text-sm">
                              <Globe className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                              <span className="truncate text-muted-foreground">{url}</span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>

                      <div className="flex justify-center gap-3">
                        <Button variant="outline" onClick={() => setCurrentStep('source')}>
                          Back
                        </Button>
                        <Button onClick={() => scrapeMutation.mutate(discoveredUrls)}>
                          <Download className="w-4 h-4 mr-2" />
                          Scrape {discoveredUrls.length} Products
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </>
                  )}

                  {discoveredUrls.length === 0 && (
                    <div className="flex justify-center">
                      <Button onClick={() => setCurrentStep('source')}>
                        Try Different URL
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Scraping Progress */}
        {currentStep === 'scrape' && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
                <div>
                  <p className="font-medium">Scraping product details...</p>
                  <p className="text-sm text-muted-foreground">{progressText}</p>
                </div>
                <Progress value={progress} className="max-w-md mx-auto" />
                <p className="text-sm text-muted-foreground">
                  {Math.round(progress)}% complete • This may take a few minutes
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Review Products */}
        {currentStep === 'review' && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      {scrapedProducts.length} Products Ready
                    </CardTitle>
                    <CardDescription>
                      Review and select products to import • {selectedProducts.size} selected
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={selectAllProducts}>
                      Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={deselectAllProducts}>
                      Deselect All
                    </Button>
                    <div className="border-l h-6 mx-1" />
                    <Button 
                      variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {scrapeErrors.length > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        <span className="font-medium text-yellow-700 dark:text-yellow-400">
                          {scrapeErrors.length} URL{scrapeErrors.length > 1 ? 's' : ''} failed to scrape
                        </span>
                      </div>
                      <Button variant="outline" size="sm" onClick={retryFailedScrapes}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry Failed
                      </Button>
                    </div>
                  </div>
                )}

                <ScrollArea className="h-[400px] pr-4">
                  <div className={viewMode === 'grid' 
                    ? 'grid gap-4 md:grid-cols-2' 
                    : 'space-y-3'
                  }>
                    {scrapedProducts.map((product, i) => (
                      <ProductImportCard
                        key={i}
                        product={product}
                        index={i}
                        isSelected={selectedProducts.has(i)}
                        onToggleSelect={toggleProductSelection}
                        onUpdateProduct={updateProduct}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={() => setCurrentStep('discover')}>
                Back
              </Button>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  Importing to: <strong>{categories.find(c => c.id === selectedCategory)?.name}</strong>
                  {' • '}
                  Price: <strong>${pricePerSqft}/sqft</strong>
                </span>
                <Button 
                  size="lg"
                  disabled={selectedProducts.size === 0 || isLoading}
                  onClick={() => importMutation.mutate()}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Import {selectedProducts.size} Products
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Import Progress / Complete */}
        {currentStep === 'import' && (
          <Card>
            <CardContent className="py-12">
              {importMutation.isPending ? (
                <div className="text-center space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
                  <div>
                    <p className="font-medium">Importing products...</p>
                    <p className="text-sm text-muted-foreground">Adding products to your catalog</p>
                  </div>
                  <Progress value={progress} className="max-w-md mx-auto" />
                </div>
              ) : (
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900 mx-auto flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold">Import Complete!</h3>
                    <p className="text-muted-foreground mt-2">
                      Your products have been added to the catalog
                    </p>
                  </div>
                  <div className="flex justify-center gap-3">
                    <Button variant="outline" onClick={resetImporter}>
                      Import More Products
                    </Button>
                    <Button onClick={() => window.location.reload()}>
                      View Products
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Log Panel */}
      <ImportLogPanel 
        logs={logs} 
        isOpen={showLogs} 
        onClose={() => setShowLogs(false)} 
      />
    </div>
  );
}
