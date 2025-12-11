import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';

const MENU_DATA = [
  {
    key: 'name-badges',
    title: 'Name Badges',
    width: 'w-[900px]',
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
    width: 'w-[800px]',
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
    width: 'w-[700px]',
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
    width: 'w-[600px]',
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

  // Helper to get image for active menu
  const getActiveImage = (menuKey) => {
    if (!menuKey) return null;
    const menu = MENU_DATA.find(m => m.key === menuKey);
    if (!menu) return null;

    if (hoveredItem && hoveredItem.image) {
      return hoveredItem.image;
    }
    
    // If no item hovered (or hovered item has no image), try to find the default image
    return menu.defaultImage;
  };

  const activeMenuData = MENU_DATA.find(m => m.key === activeMenu);

  return (
    <nav className="hidden lg:flex items-center justify-center h-full relative w-full" onMouseLeave={() => {
      setActiveMenu(null);
      setHoveredItem(null);
    }}>
      {MENU_DATA.map((menu) => (
        <div
          key={menu.key}
          className="h-full flex items-center"
          onMouseEnter={() => {
            setActiveMenu(menu.key);
            setHoveredItem(null); // Reset item hover when switching menus
          }}
        >
          <Link
            to={createPageUrl('Products') + `?category=${menu.key}`}
            className={`flex items-center gap-1 px-4 py-2 text-sm font-semibold rounded-md transition-colors whitespace-nowrap h-10 ${
              activeMenu === menu.key
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
            }`}
          >
            {menu.title}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeMenu === menu.key ? 'rotate-180' : ''}`} />
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
          <button className={`flex items-center gap-1 px-4 py-2 text-sm font-semibold rounded-md transition-colors whitespace-nowrap h-10 ${
              activeMenu === 'support' ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
            }`}>
            Support
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeMenu === 'support' ? 'rotate-180' : ''}`} />
          </button>
        </div>


      {/* Mega Menu Dropdown */}
      {activeMenu && activeMenuData && (
        <div 
          className="absolute top-full left-0 bg-white shadow-xl border-t border-gray-100 z-50 rounded-b-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
          style={{ width: 'max-content', maxWidth: '1200px' }} // Let content dictate width up to max
        >
          <div className="flex bg-white">
            {/* Left Side: Navigation Links */}
            <div className={`flex p-6 gap-8 ${activeMenuData.width ? activeMenuData.width : 'w-[800px]'}`}>
              {activeMenuData.columns.map((col, idx) => (
                <div key={idx} className="flex-1 min-w-[160px]">
                  <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide border-b border-gray-100 pb-2">
                    {col.title}
                  </h3>
                  <ul className="space-y-1">
                    {col.items.map((item, itemIdx) => (
                      <li key={itemIdx}>
                        <Link
                          to={createPageUrl(item.link)}
                          className="group flex items-center justify-between py-2 px-2 -mx-2 rounded-md hover:bg-blue-50 transition-colors"
                          onMouseEnter={() => setHoveredItem(item)}
                        >
                          <span className={`text-sm group-hover:text-blue-600 transition-colors ${item.label === 'View All' ? 'font-bold text-blue-600' : 'text-gray-600'}`}>
                            {item.name || item.label}
                          </span>
                          {item.price && (
                             <span className="text-[10px] font-medium text-gray-400 group-hover:text-blue-500 bg-gray-50 group-hover:bg-white px-1.5 py-0.5 rounded border border-gray-100 group-hover:border-blue-100 transition-colors">
                               {item.price.replace('From ', '')}
                             </span>
                          )}
                           {item.label === 'View All' && (
                             <ChevronRight className="w-3 h-3 text-blue-600" />
                           )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Right Side: Visual Preview */}
            <div className="w-[300px] bg-slate-50 border-l border-gray-100 p-6 flex flex-col justify-center items-center text-center">
               <div className="relative w-full aspect-square bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 flex items-center justify-center overflow-hidden">
                  {getActiveImage(activeMenu) ? (
                    <img 
                      src={getActiveImage(activeMenu)} 
                      alt="Product Preview" 
                      className="max-w-full max-h-full object-contain transition-all duration-300 transform hover:scale-105"
                    />
                  ) : (
                    <div className="text-gray-300 flex flex-col items-center">
                       <div className="w-16 h-16 rounded-full bg-gray-100 mb-2" />
                       <span className="text-xs">Preview</span>
                    </div>
                  )}
               </div>
               
               {hoveredItem ? (
                 <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <h4 className="font-bold text-gray-900 text-lg mb-1">{hoveredItem.name}</h4>
                    {hoveredItem.price && (
                      <p className="text-blue-600 font-medium bg-blue-50 inline-block px-3 py-1 rounded-full text-sm">
                        Starts at {hoveredItem.price.replace('From ', '')}
                      </p>
                    )}
                    <div className="mt-4">
                      <Link to={createPageUrl(hoveredItem.link)}>
                        <button className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2 px-6 rounded-full uppercase tracking-wide transition-colors shadow-sm">
                           Shop Now
                        </button>
                      </Link>
                    </div>
                 </div>
               ) : (
                  <div className="text-gray-500 text-sm">
                    <p className="mb-2">Select a category to view details</p>
                    <Link to={createPageUrl('Products') + `?category=${activeMenu}`}>
                       <span className="text-blue-600 hover:underline text-xs font-medium">View All {activeMenuData?.title}</span>
                    </Link>
                  </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Support Dropdown (Simple) */}
      {activeMenu === 'support' && (
         <div className="absolute top-full right-0 w-64 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50">
            {[
              { name: 'About Us', link: 'About' },
              { name: 'Contact & Support', link: 'Contact' },
              { name: 'Request a Quote', link: 'RequestQuote' },
              { name: 'Request Samples', link: 'RequestSamples' },
              { name: 'Blog', link: 'Blog' },
            ].map((item, idx) => (
               <Link
                key={idx}
                to={createPageUrl(item.link)}
                className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                onClick={() => setActiveMenu(null)}
              >
                {item.name}
              </Link>
            ))}
         </div>
      )}
    </nav>
  );
}