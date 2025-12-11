import React, { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useProductCategories, useProducts } from '@/hooks/useSupabaseData';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Filter, Grid, List, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ProductGrid from '@/components/home/ProductGrid';
import NameBadgeLandingView from '@/components/product/NameBadgeLandingView';

export default function Products() {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const categorySlug = urlParams.get('category');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [viewMode, setViewMode] = useState('grid');

  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: categories = [] } = useProductCategories('order');

  const filteredProducts = useMemo(() => {
    let result = [...products];
    
    // Filter by category
    if (categorySlug) {
      const category = categories.find(c => c.slug === categorySlug);
      if (category) {
        result = result.filter(p => p.category_id === category.id);
      }
    }
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.short_description?.toLowerCase().includes(query)
      );
    }
    
    // Sort
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => (a.base_price || 0) - (b.base_price || 0));
        break;
      case 'price-high':
        result.sort((a, b) => (b.base_price || 0) - (a.base_price || 0));
        break;
      case 'rating':
        result.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
        break;
      case 'reviews':
        result.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
        break;
      default:
        result.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return result;
  }, [products, categories, categorySlug, searchQuery, sortBy]);

  const currentCategory = categories.find(c => c.slug === categorySlug);

  // Recursive Category Sidebar Item
  const CategorySidebarItem = ({ item, currentSlug, level = 0 }) => {
    const hasChildren = item.subcategories && item.subcategories.length > 0;
    
    const checkActive = (cat) => {
        if (!currentSlug && cat.slug === 'all-products') return true;
        if (cat.slug === currentSlug) return true;
        if (cat.subcategories) {
            return cat.subcategories.some(sub => checkActive(sub));
        }
        return false;
    };
    
    const isSelfActive = (!currentSlug && item.slug === 'all-products') || item.slug === currentSlug;
    const isChildActive = hasChildren && checkActive(item) && !isSelfActive;
    
    const [isExpanded, setIsExpanded] = useState(
        item.expanded || isChildActive || (level === 0 && isSelfActive)
    );

    const paddingLeft = level === 0 ? 12 : 12 + (level * 12); 

    if (!hasChildren) {
        return (
             <Link 
                to={createPageUrl('Products') + (item.slug === 'all-products' ? '' : `?category=${item.slug}`)}
                className={`block py-2 pr-4 text-sm transition-colors rounded-r-lg border-l-2 my-1 ${
                    isSelfActive
                        ? 'border-blue-500 text-blue-600 font-medium bg-blue-50' 
                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-200'
                }`}
                style={{ paddingLeft: `${paddingLeft}px` }}
            >
                {item.name}
            </Link>
        );
    }

    return (
        <div className="border-b last:border-0 border-slate-50">
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className={`w-full flex items-center justify-between py-3 pr-4 text-sm font-medium transition-colors hover:bg-slate-50 rounded-r-lg my-1 ${
                    (isSelfActive || isChildActive) ? 'text-blue-800' : 'text-slate-700'
                }`}
                style={{ paddingLeft: `${paddingLeft}px` }}
            >
                <span className={level === 0 ? "font-bold" : ""}>{item.name}</span>
                {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
            </button>
            
            {isExpanded && (
                <div className="pb-1">
                    {item.subcategories.map((sub, idx) => (
                        <CategorySidebarItem 
                            key={sub.slug || idx} 
                            item={sub} 
                            currentSlug={currentSlug} 
                            level={level + 1} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
  };

  const CATEGORIES_SIDEBAR = [
      { name: 'All Products', slug: 'all-products' },
      { 
          name: 'Name Badges', 
          slug: 'name-badges',
          subcategories: [
              { name: 'View All Name Badges', slug: 'name-badges' },
              { name: 'Standard Name Badges', slug: 'standard-name-badges' },
              { name: 'Premium Name Badges', slug: 'premium-name-badges' },
              { name: 'Executive Name Badges', slug: 'executive-name-badges' },
              { name: 'Executive Metal Name Tags', slug: 'executive-metal-name-tags' },
              { 
                  name: 'Specialty Badges', 
                  slug: 'specialty-badges',
                  subcategories: [
                      { name: 'Bling Name Badges', slug: 'bling-name-badges' },
                      { name: 'Chalkboard Name Tags', slug: 'chalkboard-name-tags' },
                      { name: 'Real Wood Badges', slug: 'real-wood-badges' },
                      { name: 'Custom Color Badges', slug: 'custom-color-badges' },
                      { name: 'Glossy Name Plates', slug: 'glossy-name-plates' }
                  ]
              },
              { 
                  name: 'Metal & Engraved', 
                  slug: 'metal--engraved',
                  subcategories: [
                      { name: 'Metal Name Tags', slug: 'metal-name-tags' },
                      { name: 'Engraved Metal Name Tags', slug: 'engraved-metal-name-tags' },
                      { name: 'Metal Service Name Bars', slug: 'metal-service-name-bars' }
                  ]
              },
              { name: 'Badge Accessories', slug: 'badge-accessories' }
          ]
      },
      {
          name: 'Signs & Banners',
          slug: 'signs-banners',
          subcategories: [
              { name: 'Banners', slug: 'banners' },
              { name: 'Signs', slug: 'signs' },
              { name: 'Yard Signs', slug: 'yard-signs' },
              { name: 'A-Frame Signs', slug: 'a-frame-signs' },
              { name: 'Office Signs', slug: 'office-signs' },
              { name: 'Real Estate', slug: 'real-estate' }
          ]
      },
      {
          name: 'Stickers & Decals',
          slug: 'stickers-decals',
          subcategories: [
              { name: 'Stickers', slug: 'stickers' },
              { name: 'Decals', slug: 'decals' },
              { name: 'Magnets', slug: 'magnets' },
              { name: 'Vehicle Graphics', slug: 'vehicle-graphics' },
              { name: 'Window Graphics', slug: 'window-graphics' },
              { name: 'Floor Graphics', slug: 'floor-graphics' }
          ]
      },
      {
          name: 'Office & ID',
          slug: 'office-id',
          subcategories: [
              { name: 'Desk and Wall Plates', slug: 'desk-and-wall-plates' },
              { name: 'ID Cards', slug: 'id-cards' },
              { name: 'Self Inking Stamps', slug: 'self-inking-stamps' }
          ]
      },
      {
          name: 'Events & Trade Show',
          slug: 'events-trade-show',
          subcategories: [
              { name: 'Trade Show & Events', slug: 'trade-show--events' },
              { name: 'Displays & Stands', slug: 'displays--stands' },
              { name: 'Flags & Fabric', slug: 'flags-fabric' },
              { name: 'Event Passes', slug: 'event-passes' }
          ]
      },
      { name: 'Prints', slug: 'prints' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {currentCategory ? currentCategory.name : 'All Products'}
          </h1>
          <p className="text-gray-600 mt-2">
            {currentCategory ? currentCategory.description : 'Browse our complete selection of custom signs and banners'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4 px-2">Categories</h3>
              <div className="space-y-1">
                {CATEGORIES_SIDEBAR.map((cat, idx) => (
                    <CategorySidebarItem 
                        key={cat.slug || idx} 
                        item={cat} 
                        currentSlug={categorySlug} 
                    />
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 max-w-md w-full">
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                
                <div className="flex items-center gap-4">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popular">Most Popular</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="reviews">Most Reviews</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="hidden sm:flex items-center border rounded-lg">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
                    >
                      <Grid className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
                    >
                      <List className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Count */}
            <p className="text-sm text-gray-500 mb-4">
              Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
            </p>

            {/* Products */}
            <ProductGrid products={filteredProducts} isLoading={productsLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
