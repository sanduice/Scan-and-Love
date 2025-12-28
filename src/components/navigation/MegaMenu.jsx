import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { useProductCategories } from '@/hooks/useSupabaseData';

export default function MegaMenu() {
  const [activeMenu, setActiveMenu] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  
  const { data: categories = [], isLoading } = useProductCategories('order');

  // Build hierarchical menu structure from database
  const menuData = useMemo(() => {
    if (!categories.length) return [];
    
    // Get parent categories (no parent_id), sorted by order
    const parentCategories = categories
      .filter(c => !c.parent_id)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    
    return parentCategories.map(parent => {
      // Get children of this parent
      const children = categories
        .filter(c => c.parent_id === parent.id)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      
      // Group children into columns (max 4 columns, distribute evenly)
      const columns = [];
      if (children.length > 0) {
        // For now, create a single column with all children
        // You can enhance this to group by sub-subcategories if needed
        const itemsPerColumn = Math.ceil(children.length / Math.min(4, Math.ceil(children.length / 4)));
        
        for (let i = 0; i < children.length; i += itemsPerColumn) {
          const columnChildren = children.slice(i, i + itemsPerColumn);
          columns.push({
            title: columnChildren[0]?.name || 'Products',
            items: columnChildren.map(child => ({
              name: child.name,
              link: `Products?category=${child.slug}`,
              image: child.image_url,
              price: null // Price can be added if stored in category
            }))
          });
        }
        
        // Add "View All" to first column
        if (columns.length > 0) {
          columns[0].items.push({
            name: `View All ${parent.name}`,
            link: `Products?category=${parent.slug}`,
            label: 'View All'
          });
        }
      } else {
        // No children, just show a link to the category
        columns.push({
          title: parent.name,
          items: [{
            name: `Browse ${parent.name}`,
            link: `Products?category=${parent.slug}`,
            label: 'View All'
          }]
        });
      }
      
      return {
        key: parent.slug,
        title: parent.name,
        defaultImage: parent.image_url,
        columns
      };
    });
  }, [categories]);

  const getActiveImage = (menuKey) => {
    if (!menuKey) return null;
    const menu = menuData.find(m => m.key === menuKey);
    if (!menu) return null;

    if (hoveredItem && hoveredItem.image) {
      return hoveredItem.image;
    }
    
    return menu.defaultImage;
  };

  const activeMenuData = menuData.find(m => m.key === activeMenu);

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
        setHoveredItem(null);
      }}
    >
      <nav className="flex items-center justify-start h-full w-full">
        {menuData.map((menu) => (
          <div
            key={menu.key}
            className="h-full flex items-center"
            onMouseEnter={() => {
              setActiveMenu(menu.key);
              setHoveredItem(null);
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
              {/* Active indicator line */}
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
            setHoveredItem(null);
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

      {/* Full-Width Mega Menu Dropdown - Positioned with top-full for no gap */}
      {activeMenu && activeMenuData && (
        <div 
          className="absolute top-full left-1/2 -translate-x-1/2 w-screen z-50 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {/* Full-width white background */}
          <div className="bg-background border-t border-b border-border shadow-lg">
            {/* Centered content container */}
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex py-8">
                {/* Left Side: Navigation Columns */}
                <div className={`flex-1 grid gap-8 ${
                  activeMenuData.columns.length === 1 ? 'grid-cols-1' :
                  activeMenuData.columns.length === 2 ? 'grid-cols-2' :
                  activeMenuData.columns.length === 3 ? 'grid-cols-3' :
                  'grid-cols-4'
                }`}>
                  {activeMenuData.columns.map((col, idx) => (
                    <div key={idx}>
                      <h3 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wide pb-2 border-b border-border">
                        {col.title}
                      </h3>
                      <ul className="space-y-1">
                        {col.items.map((item, itemIdx) => (
                          <li key={itemIdx}>
                            <Link
                              to={createPageUrl(item.link)}
                              className="group flex items-center justify-between py-2 px-2 -mx-2 rounded-md hover:bg-muted transition-colors"
                              onMouseEnter={() => setHoveredItem(item)}
                            >
                              <span className={`text-sm group-hover:text-primary transition-colors ${item.label === 'View All' ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                                {item.name || item.label}
                              </span>
                              {item.price && (
                                <span className="text-[10px] font-medium text-muted-foreground group-hover:text-primary bg-muted group-hover:bg-primary/10 px-1.5 py-0.5 rounded transition-colors">
                                  {item.price.replace('From ', '')}
                                </span>
                              )}
                              {item.label === 'View All' && (
                                <ChevronRight className="w-3 h-3 text-primary" />
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* Right Side: Visual Preview */}
                <div className="w-[280px] ml-8 pl-8 border-l border-border flex flex-col justify-center items-center text-center">
                  <div className="relative w-full aspect-square bg-muted rounded-lg p-4 mb-4 flex items-center justify-center overflow-hidden">
                    {getActiveImage(activeMenu) ? (
                      <img 
                        src={getActiveImage(activeMenu)} 
                        alt="Product Preview" 
                        className="max-w-full max-h-full object-contain transition-all duration-300 transform hover:scale-105"
                      />
                    ) : (
                      <div className="text-muted-foreground flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-muted-foreground/20 mb-2" />
                        <span className="text-xs">Preview</span>
                      </div>
                    )}
                  </div>
                  
                  {hoveredItem ? (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
                      <h4 className="font-bold text-foreground text-lg mb-1">{hoveredItem.name}</h4>
                      {hoveredItem.price && (
                        <p className="text-primary font-medium bg-primary/10 inline-block px-3 py-1 rounded-full text-sm">
                          Starts at {hoveredItem.price.replace('From ', '')}
                        </p>
                      )}
                      <div className="mt-4">
                        <Link to={createPageUrl(hoveredItem.link)}>
                          <button className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold py-2 px-6 rounded-full uppercase tracking-wide transition-colors shadow-sm">
                            Shop Now
                          </button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm">
                      <p className="mb-2">Select a category to view details</p>
                      <Link to={createPageUrl('Products') + `?category=${activeMenu}`}>
                        <span className="text-primary hover:underline text-xs font-medium">View All {activeMenuData?.title}</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Support Dropdown (Simple) - Also Full Width */}
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
