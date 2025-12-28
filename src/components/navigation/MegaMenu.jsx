import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { useProductCategories, useProducts } from '@/hooks/useSupabaseData';

export default function MegaMenu() {
  const [activeMenu, setActiveMenu] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  
  const { data: categories = [], isLoading } = useProductCategories('order');
  const { data: products = [] } = useProducts();

  // Build hierarchical menu structure from database (3 levels)
  const menuData = useMemo(() => {
    if (!categories.length) return [];
    
    // Get parent categories (no parent_id), sorted by order
    const parentCategories = categories
      .filter(c => !c.parent_id)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    
    return parentCategories.map(parent => {
      // Get Level 2: direct children of parent (e.g., "Vinyl Banners", "Stands & Displays")
      const children = categories
        .filter(c => c.parent_id === parent.id)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      
      // For each Level 2 child, get Level 3 grandchildren
      const subCategories = children.map(child => {
        const grandchildren = categories
          .filter(gc => gc.parent_id === child.id)
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        
        return {
          ...child,
          grandchildren
        };
      });
      
      return {
        key: parent.slug,
        title: parent.name,
        image: parent.image_url,
        subCategories
      };
    });
  }, [categories]);

  // Get current active menu data
  const activeMenuData = menuData.find(m => m.key === activeMenu);

  // Auto-select first sub-category when menu opens
  useEffect(() => {
    if (activeMenu && activeMenuData?.subCategories?.length > 0) {
      setSelectedSubCategory(activeMenuData.subCategories[0]);
    } else {
      setSelectedSubCategory(null);
    }
  }, [activeMenu, activeMenuData]);

  // Get products for the selected sub-category's grandchildren
  const getProductsForCategory = (categoryId) => {
    return products.filter(p => p.category_id === categoryId).slice(0, 8);
  };

  if (isLoading) {
    return (
      <div className="relative hidden lg:flex items-center h-full px-4">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div 
      className="relative hidden lg:block h-full"
      onMouseLeave={() => {
        setActiveMenu(null);
        setSelectedSubCategory(null);
      }}
    >
      <nav className="flex items-center justify-start h-full w-full">
        {menuData.map((menu) => (
          <div
            key={menu.key}
            className="h-full flex items-center"
            onMouseEnter={() => {
              setActiveMenu(menu.key);
            }}
          >
            <Link
              to={createPageUrl('Products') + `?category=${menu.key}`}
              className={`relative flex items-center gap-1 px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap h-10 ${
                activeMenu === menu.key
                  ? 'text-primary'
                  : 'text-foreground hover:text-primary'
              }`}
            >
              {menu.title}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeMenu === menu.key ? 'rotate-180' : ''}`} />
              {activeMenu === menu.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </Link>
          </div>
        ))}

        {/* Support Menu Item */}
        <div
          className="h-full flex items-center"
          onMouseEnter={() => {
            setActiveMenu('support');
            setSelectedSubCategory(null);
          }}
        >
          <button className={`relative flex items-center gap-1 px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap h-10 ${
              activeMenu === 'support' ? 'text-primary' : 'text-foreground hover:text-primary'
            }`}>
            Support
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeMenu === 'support' ? 'rotate-180' : ''}`} />
            {activeMenu === 'support' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>
      </nav>

      {/* Two-Panel Mega Menu Dropdown */}
      {activeMenu && activeMenuData && (
        <div 
          className="absolute top-full left-1/2 -translate-x-1/2 w-screen z-50 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <div className="bg-background border-t border-b border-border shadow-lg">
            <div className="max-w-screen-2xl mx-auto">
              <div className="flex min-h-[380px]">
                {/* LEFT PANEL - Sub-categories (Level 2) */}
                <div className="w-[240px] bg-muted/30 border-r border-border py-4">
                  {activeMenuData.subCategories.map((subCat) => (
                    <button
                      key={subCat.id}
                      onMouseEnter={() => setSelectedSubCategory(subCat)}
                      className={`w-full flex items-center justify-between px-5 py-3 text-left transition-colors ${
                        selectedSubCategory?.id === subCat.id 
                          ? 'text-primary bg-background border-r-2 border-primary font-semibold' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <span className="text-sm">{subCat.name}</span>
                      <ChevronRight className={`w-4 h-4 transition-colors ${
                        selectedSubCategory?.id === subCat.id ? 'text-primary' : 'text-muted-foreground/50'
                      }`} />
                    </button>
                  ))}
                  
                  {/* View All Link */}
                  <div className="mt-4 px-5 pt-4 border-t border-border">
                    <Link
                      to={createPageUrl('Products') + `?category=${activeMenu}`}
                      className="flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors"
                    >
                      View All {activeMenuData.title}
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* RIGHT PANEL - Grandchildren grouped by category headers */}
                <div className="flex-1 py-6 px-8">
                  {selectedSubCategory && (
                    <div className="animate-in fade-in duration-200">
                      {selectedSubCategory.grandchildren.length > 0 ? (
                        <div className="grid grid-cols-4 gap-x-8 gap-y-6">
                          {selectedSubCategory.grandchildren.map((group) => {
                            const groupProducts = getProductsForCategory(group.id);
                            
                            return (
                              <div key={group.id} className="space-y-2">
                                {/* Category Header */}
                                <Link
                                  to={createPageUrl('Products') + `?category=${group.slug}`}
                                  className="block"
                                >
                                  <h4 className="text-primary font-bold text-sm border-b border-border pb-2 hover:text-primary/80 transition-colors">
                                    {group.name}
                                  </h4>
                                </Link>
                                
                                {/* Products under this category */}
                                {groupProducts.length > 0 ? (
                                  <ul className="space-y-1">
                                    {groupProducts.map(product => (
                                      <li key={product.id}>
                                        <Link 
                                          to={createPageUrl('ProductDetail').replace(':slug', product.slug)}
                                          className="block text-sm text-muted-foreground hover:text-primary py-1 transition-colors"
                                        >
                                          {product.name}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <Link 
                                    to={createPageUrl('Products') + `?category=${group.slug}`}
                                    className="block text-sm text-muted-foreground hover:text-primary py-1 transition-colors"
                                  >
                                    Browse {group.name}
                                  </Link>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* No grandchildren - show products directly under sub-category */
                        <div>
                          <Link
                            to={createPageUrl('Products') + `?category=${selectedSubCategory.slug}`}
                            className="block mb-4"
                          >
                            <h4 className="text-primary font-bold text-sm border-b border-border pb-2 hover:text-primary/80 transition-colors">
                              {selectedSubCategory.name}
                            </h4>
                          </Link>
                          
                          {getProductsForCategory(selectedSubCategory.id).length > 0 ? (
                            <div className="grid grid-cols-4 gap-4">
                              {getProductsForCategory(selectedSubCategory.id).map(product => (
                                <Link 
                                  key={product.id}
                                  to={createPageUrl('ProductDetail').replace(':slug', product.slug)}
                                  className="block text-sm text-muted-foreground hover:text-primary py-1 transition-colors"
                                >
                                  {product.name}
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <Link 
                              to={createPageUrl('Products') + `?category=${selectedSubCategory.slug}`}
                              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                            >
                              Browse {selectedSubCategory.name}
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Support Dropdown (Simple) */}
      {activeMenu === 'support' && (
        <div 
          className="absolute top-full left-1/2 -translate-x-1/2 w-screen z-50 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <div className="bg-background border-t border-b border-border shadow-lg">
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex gap-8">
                {[
                  { name: 'About Us', link: 'About', desc: 'Learn more about our company' },
                  { name: 'Contact & Support', link: 'Contact', desc: 'Get help from our team' },
                  { name: 'Request a Quote', link: 'RequestQuote', desc: 'Get custom pricing for bulk orders' },
                  { name: 'Request Samples', link: 'RequestSamples', desc: 'Try before you buy' },
                  { name: 'Blog', link: 'Blog', desc: 'Tips, news, and inspiration' },
                ].map((item, idx) => (
                  <Link
                    key={idx}
                    to={createPageUrl(item.link)}
                    className="group flex-1 p-4 rounded-lg hover:bg-muted transition-colors"
                    onClick={() => setActiveMenu(null)}
                  >
                    <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                      {item.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
