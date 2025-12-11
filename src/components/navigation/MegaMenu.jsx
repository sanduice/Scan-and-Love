import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';

const MENU_DATA = [
  {
    key: 'name-badges',
    title: 'Name Badges',
    defaultImage: 'https://www.namebadge.com/images/products/34/34-400.png?v=109',
    columns: [
      {
        title: 'Most Popular',
        items: [
          { name: 'Standard Name Badges', link: 'Products?category=standard-name-badges', price: 'From $7.99', image: 'https://www.namebadge.com/images/products/34/34-400.png?v=109' },
          { name: 'Premium Name Badges', link: 'Products?category=premium-name-badges', price: 'From $11.99', image: 'https://www.namebadge.com/images/products/43/43-400.png?v=109' },
          { name: 'Executive Name Badges', link: 'Products?category=executive-name-badges', price: 'From $14.99', image: 'https://www.namebadge.com/images/products/405/405-400.png?v=109' },
          { name: 'View All Styles', link: 'Products?category=name-badges', label: 'View All' },
        ]
      },
      {
        title: 'Specialty Badges',
        items: [
          { name: 'Bling Name Badges', link: 'Products?category=bling-name-badges', price: 'From $12.99', image: 'https://www.namebadge.com/images/products/49/49-400.png?v=109' },
          { name: 'Real Wood Badges', link: 'Products?category=real-wood-badges', price: 'From $12.99', image: 'https://www.namebadge.com/images/products/121/121-400.png?v=109' },
          { name: 'Chalkboard Badges', link: 'Products?category=chalkboard-name-tags', price: 'From $9.99', image: 'https://www.namebadge.com/images/products/118/118-400.png?v=109' },
          { name: 'Custom Color Badges', link: 'Products?category=custom-color-badges', price: 'From $8.99', image: 'https://www.namebadge.com/images/products/52/52-400.png?v=109' },
          { name: 'Glossy Name Plates', link: 'Products?category=glossy-name-plates', price: 'From $10.99', image: 'https://www.namebadge.com/images/products/51/51-400.png?v=109' },
        ]
      },
      {
        title: 'Metal & Service',
        items: [
          { name: 'Executive Metal Tags', link: 'Products?category=executive-metal-name-tags', price: 'From $15.99', image: 'https://www.namebadge.com/images/products/403/403-400.png?v=109' },
          { name: 'Engraved Metal Tags', link: 'Products?category=engraved-metal-name-tags', price: 'From $10.99', image: 'https://www.namebadge.com/images/products/112/112-400.png?v=109' },
          { name: 'Service Name Bars', link: 'Products?category=metal-service-name-bars', price: 'From $5.99', image: 'https://www.namebadge.com/images/products/55/55-400.png?v=109' },
          { name: 'Metal Name Tags', link: 'Products?category=metal-name-tags', price: 'From $9.99', image: 'https://www.namebadge.com/images/products/112/112-400.png?v=109' },
        ]
      },
      {
        title: 'Accessories',
        items: [
          { name: 'Badge Fasteners', link: 'Products?category=badge-accessories', price: 'From $0.50', image: 'https://www.namebadge.com/images/products/20/20-400.png?v=109' },
          { name: 'Lanyards', link: 'Products?category=lanyards', price: 'From $1.99', image: 'https://www.namebadge.com/images/products/21/21-400.png?v=109' },
          { name: 'ID Cards', link: 'Products?category=id-cards', price: 'From $5.00', image: 'https://www.namebadge.com/images/products/22/22-400.png?v=109' },
        ]
      }
    ]
  },
  {
    key: 'signs',
    title: 'Signs',
    defaultImage: 'https://content.signs.com/Ecom/Product_Images/YardSigns_Main.png',
    columns: [
      {
        title: 'Outdoor Signs',
        items: [
          { name: 'Yard Signs', link: 'ProductDetail?slug=yard-sign', price: 'From $14', image: 'https://content.signs.com/Ecom/Product_Images/YardSigns_Main.png' },
          { name: 'Aluminum Signs', link: 'ProductDetail?slug=aluminum-sign', price: 'From $15', image: 'https://content.signs.com/Ecom/Product_Images/Aluminum_Main.png' },
          { name: 'A-Frame Signs', link: 'ProductDetail?slug=a-frame-sign', price: 'From $89', image: 'https://content.signs.com/Ecom/Product_Images/SidewalkSigns_Main.png' },
          { name: 'Real Estate Signs', link: 'Products?category=real-estate', price: 'From $45', image: 'https://content.signs.com/Ecom/Product_Images/RealEstateSigns_Main.png' },
        ]
      },
      {
        title: 'Indoor & Office',
        items: [
          { name: 'Office Signs', link: 'Products?category=office-signs', price: 'From $25', image: 'https://content.signs.com/Ecom/Product_Images/AcrylicPhotoPrints_Main.png' },
          { name: 'Desk Plates', link: 'Products?category=desk-and-wall-plates', price: 'From $15.99', image: 'https://www.namebadge.com/images/products/51/51-400.png?v=109' },
          { name: 'Foam Board', link: 'ProductDetail?slug=foam-board', price: 'From $18', image: 'https://content.signs.com/Ecom/Product_Images/FoamBoard_Main.png' },
          { name: 'Acrylic Signs', link: 'ProductDetail?slug=acrylic-sign', price: 'From $95', image: 'https://content.signs.com/Ecom/Product_Images/Acrylic_Main.png' },
        ]
      },
      {
        title: 'Vehicle & Magnetic',
        items: [
          { name: 'Car Magnets', link: 'ProductDetail?slug=car-magnet', price: 'From $35', image: 'https://content.signs.com/Ecom/Product_Images/CarMagnet_Main.png' },
          { name: 'Vehicle Lettering', link: 'ProductDetail?slug=vehicle-lettering', price: 'From $25', image: 'https://content.signs.com/Ecom/Product_Images/VinylLettering_Main.png' },
          { name: 'Window Graphics', link: 'Products?category=window-graphics', price: 'From $45', image: 'https://content.signs.com/Ecom/Product_Images/WindowDecal_Main.png' },
        ]
      }
    ]
  },
  {
    key: 'banners',
    title: 'Banners',
    defaultImage: 'https://content.signs.com/Ecom/Product_Images/VinylBanner_Main.png',
    columns: [
      {
        title: 'Banners',
        items: [
          { name: 'Vinyl Banners', link: 'ProductDetail?slug=vinyl-banner', price: 'From $29', image: 'https://content.signs.com/Ecom/Product_Images/VinylBanner_Main.png' },
          { name: 'Mesh Banners', link: 'ProductDetail?slug=mesh-banner', price: 'From $35', image: 'https://content.signs.com/Ecom/Product_Images/MeshBanner_Main.png' },
          { name: 'Fabric Banners', link: 'ProductDetail?slug=fabric-banner', price: 'From $45', image: 'https://content.signs.com/Ecom/Product_Images/FabricBanner_Main.png' },
          { name: 'Step & Repeat', link: 'ProductDetail?slug=step-and-repeat', price: 'From $180', image: 'https://content.signs.com/Ecom/Product_Images/StepandRepeat_Main.png' },
        ]
      },
      {
        title: 'Stands & Displays',
        items: [
          { name: 'Retractable Banners', link: 'ProductDetail?slug=retractable-banner', price: 'From $89', image: 'https://content.signs.com/Ecom/Product_Images/RetractableBanner_Main.png' },
          { name: 'X-Banner Stands', link: 'ProductDetail?slug=x-banner', price: 'From $45', image: 'https://content.signs.com/Ecom/Product_Images/XBanner_Main.png' },
          { name: 'Feather Flags', link: 'ProductDetail?slug=feather-flag', price: 'From $129', image: 'https://content.signs.com/Ecom/Product_Images/FeatherFlag_Main.png' },
          { name: 'Table Throws', link: 'ProductDetail?slug=table-throw', price: 'From $159', image: 'https://content.signs.com/Ecom/Product_Images/TableThrow_Main.png' },
        ]
      }
    ]
  },
  {
    key: 'stickers',
    title: 'Stickers',
    defaultImage: 'https://content.signs.com/Ecom/Product_Images/DieCutStickers_Main.png',
    columns: [
      {
        title: 'Stickers & Labels',
        items: [
          { name: 'Die-Cut Stickers', link: 'ProductDetail?slug=die-cut-stickers', price: 'From $55', image: 'https://content.signs.com/Ecom/Product_Images/DieCutStickers_Main.png' },
          { name: 'Kiss-Cut Stickers', link: 'ProductDetail?slug=kiss-cut-stickers', price: 'From $45', image: 'https://content.signs.com/Ecom/Product_Images/KissCutStickers_Main.png' },
          { name: 'Roll Labels', link: 'ProductDetail?slug=roll-labels', price: 'From $95', image: 'https://content.signs.com/Ecom/Product_Images/RollLabels_Main.png' },
          { name: 'Transfer Stickers', link: 'ProductDetail?slug=transfer-stickers', price: 'From $65', image: 'https://content.signs.com/Ecom/Product_Images/VinylLettering_Main.png' },
        ]
      },
      {
        title: 'Specialty',
        items: [
          { name: 'Clear Stickers', link: 'ProductDetail?slug=clear-stickers', price: 'From $65', image: 'https://content.signs.com/Ecom/Product_Images/ClearStickers_Main.png' },
          { name: 'Holographic', link: 'ProductDetail?slug=holographic-stickers', price: 'From $85', image: 'https://content.signs.com/Ecom/Product_Images/DieCutStickers_Main.png' },
          { name: 'Static Clings', link: 'ProductDetail?slug=static-cling', price: 'From $8', image: 'https://content.signs.com/Ecom/Product_Images/StaticCling_Main.png' },
        ]
      }
    ]
  }
];

export default function MegaMenu() {
  const [activeMenu, setActiveMenu] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);

  const getActiveImage = (menuKey) => {
    if (!menuKey) return null;
    const menu = MENU_DATA.find(m => m.key === menuKey);
    if (!menu) return null;

    if (hoveredItem && hoveredItem.image) {
      return hoveredItem.image;
    }
    
    return menu.defaultImage;
  };

  const activeMenuData = MENU_DATA.find(m => m.key === activeMenu);

  return (
    <div 
      className="hidden lg:block h-full"
      onMouseLeave={() => {
        setActiveMenu(null);
        setHoveredItem(null);
      }}
    >
      <nav className="flex items-center justify-start h-full w-full">
        {MENU_DATA.map((menu) => (
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

      {/* Full-Width Mega Menu Dropdown - Positioned absolutely relative to viewport */}
      {activeMenu && activeMenuData && (
        <div 
          className="fixed left-0 right-0 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
          style={{ top: 'var(--header-bottom, 132px)' }}
        >
          {/* Full-width white background */}
          <div className="bg-background border-t border-b border-border shadow-lg">
            {/* Centered content container */}
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex py-8">
                {/* Left Side: Navigation Columns */}
                <div className="flex-1 grid grid-cols-4 gap-8">
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
          className="fixed left-0 right-0 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
          style={{ top: 'var(--header-bottom, 132px)' }}
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
