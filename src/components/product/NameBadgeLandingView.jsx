import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Check, Star, Shield, Award, Users, ChevronRight, ChevronDown, PlayCircle, Loader2, Upload, Truck } from 'lucide-react';
import ImageWithFallback from '@/components/ImageWithFallback';
import ProductReviews from '@/components/product/ProductReviews';
import RelatedProducts from '@/components/product/RelatedProducts';

// Define content mapping outside component to avoid recreation
const contentMap = {
  'premium-name-badges': {
    title: 'Premium Name Tags and Name Badges',
    heroImage: 'https://media.namebadge.com/live/images/category_header/18/18.png?v=109',
    description: 'Discover our collection of elegant metal name tags and premium name badges at namebadge.com, designed to bring a sophisticated touch to any professional setting. Our high-quality name tags are crafted from a unique two-ply material with a brushed aluminum top layer in stunning gold and silver finishes, paired with a durable plastic backing for lightweight strength. Created using full-color printing, these name tags can feature any design or logo, ensuring a customized and professional appearance. Ideal for corporate events, conferences, retail, and any environment where a polished look is essential, these premium name badges combine the durability of plastic with the elegance of a metal finish.',
    features: [
      'Unique two-ply material with brushed aluminum top',
      'Stunning gold and silver finishes',
      'Durable plastic backing for lightweight strength',
      'Full-color printing for any design or logo'
    ]
  },
  'executive-name-badges': {
    title: 'Executive Metal Name Tags',
    heroImage: 'https://media.namebadge.com/live/images/category_header/15/15.png?v=109', 
    description: 'Elevate your professional image with our Executive Metal Name Badges. These top-tier badges feature a high-quality metal frame that encases the name tag, adding a layer of prestige and durability. Available in polished gold and silver frames, they provide a distinguished look perfect for executives, management, and high-end hospitality staff. The metal frame not only enhances the aesthetic appeal but also protects the badge edges from wear and tear. Combined with our crisp, full-color printing and secure magnetic fasteners, these badges are the ultimate choice for making a lasting impression.',
    features: [
      'High-quality metal frame (Gold or Silver)',
      'Distinguished and prestigious appearance',
      'Protects badge edges from wear',
      'Secure magnetic fastener included'
    ]
  },
  'standard-name-badges': {
    title: 'Custom Plastic Name Tags and Name Badges!',
    heroImage: 'https://media.namebadge.com/live/images/category_header/15/15.png?v=109',
    description: 'Discover our premium selection of plastic name tags and name badges at namebadge.com, designed for various professional and casual settings. Our durable plastic tags come in multiple shapes and sizes, perfect for custom name tags tailored to your needs. Enhance your employee name tags with names, titles, logos, and vibrant colors, ensuring a cohesive and professional look for your team. Ideal for conferences, events, retail, and corporate environments, our plastic name badges provide easy identification and a polished appearance. Experience the perfect combination of style and functionality with our custom plastic name tags.',
    features: [
      'Durable plastic construction',
      'Multiple shapes and sizes available',
      'Vibrant full-color printing',
      'Ideal for retail, events, and corporate use'
    ]
  },
  'name-badges': {
    title: 'Professional Custom Name Badges',
    heroImage: 'https://media.namebadge.com/live/images/category_header/15/15.png?v=109',
    description: 'Welcome to the ultimate destination for custom name badges. Whether you need standard durable plastic tags for your retail staff, elegant metal-finish badges for your sales team, or prestigious executive badges for management, we have it all. Our easy-to-use design tool allows you to upload logos, add names, and choose from a variety of fasteners including our popular magnetic backing. With fast production times and no setup fees, getting professional identification for your team has never been easier.',
    features: [
      'Wide range of styles: Standard, Premium, Executive',
      'Easy online design tool',
      'Fast production and shipping',
      'No setup fees'
    ]
  },
  // Individual Product Content Maps
  'standard-white-name-badge-1x3': {
      title: '1" x 3" Standard White Name Badge',
      heroImage: 'https://www.namebadge.com/images/products/34/34-400.png?v=109',
      description: 'Our bestseller for a reason. The 1" x 3" Standard White Name Badge provides a pristine, bright white background that makes your full-color logo and text pop. Perfect for retail, healthcare, and service staff, this badge combines durability with a clean, professional aesthetic.',
      features: ['Classic 1" x 3" size', 'Bright white background for high contrast', 'Scratch-resistant durability', 'Strong magnetic fastener included']
  },
  'standard-white-name-badge-1-5x3': {
      title: '1.5" x 3" Standard White Name Badge',
      heroImage: 'https://www.namebadge.com/images/products/35/35-400.png?v=109',
      description: 'Need more room for a larger logo or extra lines of text? The 1.5" x 3" Standard White Name Badge offers 50% more vertical space than our standard size. Ideal for including job titles, pronouns, or years of service without cluttering the design.',
      features: ['Larger 1.5" x 3" canvas', 'Perfect for detailed logos', 'Room for 3-4 lines of text', 'Durable white plastic construction']
  },
  'standard-white-name-badge-oval': {
      title: 'Oval Standard White Name Badge',
      heroImage: 'https://www.namebadge.com/images/products/36/36-400.png?v=109',
      description: 'Stand out from the crowd with our Oval Standard White Name Badge. The unique 1.5" x 3" oval shape offers a softer, friendlier appearance while maintaining professional standards. Great for customer-facing roles in hospitality and events.',
      features: ['Distinctive 1.5" x 3" oval shape', 'Modern and friendly aesthetic', 'Full-color edge-to-edge printing', 'Premium magnetic backing']
  },
  'standard-silver-name-badge-1x3': {
      title: '1" x 3" Standard Silver Name Badge',
      heroImage: 'https://www.namebadge.com/images/products/112/112-400.png?v=109',
      description: 'Get the metallic look for less. Our 1" x 3" Standard Silver Name Badges feature a metallic silver plastic finish that looks professional and sleek. A cost-effective alternative to real metal that doesn\'t compromise on style.',
      features: ['Metallic silver plastic finish', 'Lightweight and durable', 'Black text contrasts beautifully', 'Budget-friendly professional look']
  },
  'standard-silver-name-badge-1-5x3': {
      title: '1.5" x 3" Standard Silver Name Badge',
      heroImage: 'https://www.namebadge.com/images/products/113/113-400.png?v=109',
      description: 'Maximize your impact with the 1.5" x 3" Standard Silver Name Badge. The extra height allows for larger logos and titles against a shimmering silver background. Perfect for supervisors and team leads who need to be easily identified.',
      features: ['Expanded 1.5" height', 'Shimmering silver background', 'Ideal for multi-line text', 'Secure magnetic attachment']
  },
  'standard-gold-name-badge-1x3': {
      title: '1" x 3" Standard Gold Name Badge',
      heroImage: 'https://www.namebadge.com/images/products/40/40-400.png?v=109',
      description: 'Add warmth and prestige with the 1" x 3" Standard Gold Name Badge. The gold plastic finish exudes quality and is perfect for hospitality, luxury retail, and concierge services. Combining the elegance of gold with the durability of plastic.',
      features: ['Rich gold plastic finish', 'Classic 1" x 3" size', 'Elegant and durable', 'Magnetic fastener standard']
  },
  'silver-premium-name-badge-1x3': {
      title: '1" x 3" Premium Silver Name Badge',
      heroImage: 'https://www.namebadge.com/images/products/43/43-400.png?v=109',
      description: 'Upgrade to excellence with our Premium Silver Name Badges. Featuring a genuine brushed aluminum top layer fused to a durable plastic core, these badges offer the authentic look and feel of metal. The brushed texture diffuses light beautifully for a sophisticated matte finish.',
      features: ['Authentic brushed aluminum face', 'Two-ply construction', 'Sophisticated metal texture', 'Superior scratch resistance']
  },
};

// Fallback content generator
const getContent = (product, isCategoryPage) => {
    return contentMap[product.slug] || (isCategoryPage ? contentMap['name-badges'] : {
        title: product.name,
        heroImage: product.image_url,
        description: product.long_description || product.short_description || product.description || "High-quality custom name badge with magnetic backing.",
        features: product.features || ['Full Color Printing', 'Magnetic Fastener', 'Durable Material', 'Fast Shipping']
    });
};

const CategorySidebarItem = ({ item, currentSlug, level = 0 }) => {
  const hasChildren = item.subcategories && item.subcategories.length > 0;

  const checkActive = (cat) => {
      if (cat.slug === currentSlug) return true;
      if (cat.subcategories) {
          return cat.subcategories.some(sub => checkActive(sub));
      }
      return false;
  };

  const isSelfActive = item.slug === currentSlug;
  const isChildActive = hasChildren && checkActive(item) && !isSelfActive;

  // Auto-expand if active or if it's the main "Name Badges" group by default
  const [isExpanded, setIsExpanded] = React.useState(
      item.expanded || isChildActive || (level === 0 && isSelfActive)
  );

  const paddingLeft = level === 0 ? 16 : 16 + (level * 12); 

  if (!hasChildren) {
      return (
           <Link 
              to={createPageUrl('Products') + `?category=${item.slug}`}
              className={`block py-2 pr-4 text-sm transition-colors border-l-2 ${
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
              className={`w-full flex items-center justify-between py-3 pr-4 text-sm font-medium transition-colors ${
                  (isSelfActive || isChildActive) ? 'text-blue-800' : 'text-slate-700 hover:bg-slate-50'
              }`}
              style={{ paddingLeft: `${paddingLeft}px` }}
          >
              <span className={level === 0 ? "font-bold" : ""}>{item.name}</span>
              {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          </button>

          {isExpanded && (
              <div className="bg-slate-50/50 pb-1">
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

export default function NameBadgeLandingView({ product }) {
  const navigate = useNavigate();
  const isCategoryPage = [
      'name-badges',
      'standard-name-badges',
      'premium-name-badges',
      'executive-name-badges',
      'bling-name-badges',
      'chalkboard-name-tags',
      'real-wood-badges',
      'metal-name-tags',
      'engraved-metal-name-tags',
      'metal-service-name-bars',
      'glossy-name-plates',
      'custom-color-badges',
      'desk-and-wall-plates',
      'id-cards',
      'office-signs',
      'self-inking-stamps',
      'badge-accessories',
      'event-passes'
  ].includes(product.slug);
  const content = getContent(product, isCategoryPage);

  // Breadcrumb component
  const Breadcrumbs = () => (
    <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
      <Link to={createPageUrl('Home')} className="hover:text-blue-600">Store</Link>
      <ChevronRight className="w-4 h-4" />
      {isCategoryPage ? (
        <span className="font-medium text-slate-900">{content.title.replace('!', '')}</span>
      ) : (
        <>
             <Link to={createPageUrl('Products') + `?category=${product.slug.includes('executive') ? 'executive-name-badges' : product.slug.includes('premium') ? 'premium-name-badges' : 'standard-name-badges'}`} className="hover:text-blue-600">
                {product.slug.includes('executive') ? 'Executive Badges' : product.slug.includes('premium') ? 'Premium Badges' : 'Standard Name Badges'}
             </Link>
             <ChevronRight className="w-4 h-4" />
             <span className="font-medium text-slate-900">{product.name}</span>
        </>
      )}
    </nav>
  );

  // Fetch products from backend - now relying on DB products created by seed script
  const { data: categoryProducts = [], isLoading } = useQuery({
    queryKey: ['badge-category-products', product.slug],
    queryFn: async () => {
      if (!isCategoryPage) return [];
      
      // Fetch categories to get ID
      const categories = await base44.entities.ProductCategory.filter({ slug: product.slug });
      let categoryId = null;
      
      if (categories.length > 0) {
          categoryId = categories[0].id;
      } else {
          // Fallback if slug doesn't match a category exactly
          return [];
      }

      // Fetch products by category ID, sorted by order
      const products = await base44.entities.Product.filter({ 
          is_active: true,
          // Querying additional_category_ids isn't directly supported in simple filter depending on backend, 
          // but usually we can filter client side or use special operators.
          // For Base44 simpler to fetch and filter if needed, or query strictly on category_id if primary.
          // However, the seed script sets 'category_id' to the specific category, so this should work.
          category_id: categoryId
      }, 'order', 50);

      // Also fetch products where this is an additional category (e.g. 'name-badges' parent)
      const allProducts = await base44.entities.Product.list('order', 100);
      const filtered = allProducts.filter(p => 
          p.category_id === categoryId || 
          (p.additional_category_ids && p.additional_category_ids.includes(categoryId))
      );
      
      // Sort by order
      filtered.sort((a, b) => (a.order || 99) - (b.order || 99));
      
      return filtered;
    },
    enabled: isCategoryPage
  });

  // Improved parameter extraction for dynamic products
  const getDesignParamsFromProduct = (p) => {
    let params = '?';
    
    // Determine type based on slug or name
    const slug = p.slug || '';
    const name = p.name || '';
    
    if (slug.includes('executive')) params += 'type=executive&';
    else if (slug.includes('premium')) params += 'type=premium&';
    else params += 'type=standard&';

    // Determine style/color
    if (slug.includes('wood')) params += 'style=wood&';
    else if (slug.includes('executive')) {
        if (slug.includes('silver')) params += 'style=silver-metallic&border=silver&';
        else if (slug.includes('gold')) params += 'style=gold-metallic&border=gold&';
    }
    else if (slug.includes('premium')) {
        // Premium is metallic
        if (slug.includes('silver')) params += 'style=silver-metallic&';
        else if (slug.includes('gold')) params += 'style=gold-metallic&';
    }
    else if (slug.includes('bling')) {
        params += 'style=bling&'; // Designer needs to support this or it will fallback
    }
    else if (slug.includes('chalkboard')) {
        params += 'style=chalkboard&';
    }
    else {
        // Standard is plastic (except wood which is handled above)
        if (slug.includes('silver')) params += 'style=silver&'; // 'silver' maps to 'silver-plastic' in designer
        else if (slug.includes('gold')) params += 'style=gold&'; // 'gold' maps to 'gold-plastic' in designer
        else if (slug.includes('white')) params += 'style=white&';
        else if (slug.includes('glossy')) params += 'style=glossy&';
        else if (slug.includes('custom-color')) params += 'style=color&';
    }
    
    // Determine size
    if (slug.includes('1x3')) params += 'size=1x3';
    else if (slug.includes('1-5x3')) params += 'size=1.5x3';
    else if (slug.includes('2x3')) params += 'size=2x3';
    else if (slug.includes('oval')) params += 'size=oval';
    else if (slug.includes('2x8')) params += 'size=2x8';
    else if (slug.includes('2x10')) params += 'size=2x10';
    else params += 'size=1x3'; // Default

    return params;
  };

  const handleStartDesign = () => {
    navigate(`${createPageUrl('NameBadgeDesigner')}${getDesignParamsFromProduct(product)}`);
  };

  if (!isCategoryPage) {
    // PRODUCT DETAIL VIEW (Specific Badge)
    return (
      <div className="min-h-screen bg-white">
        {/* Breadcrumbs Header */}
        <div className="bg-white border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <Breadcrumbs />
            </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            {/* Left: Product Image Gallery */}
            <div className="space-y-4">
              <div className="bg-white border rounded-xl p-8 flex items-center justify-center shadow-sm">
                 <ImageWithFallback 
                  src={product.image_url} 
                  alt={product.name}
                  className="max-w-full max-h-[400px] object-contain"
                />
              </div>
              <div className="grid grid-cols-4 gap-4">
                {/* Main Product Thumb */}
                <div className="bg-white rounded-lg p-1 border cursor-pointer border-blue-500 ring-1 ring-blue-200">
                  <ImageWithFallback 
                    src={product.image_url} 
                    alt="Product View"
                    className="w-full h-full object-contain"
                  />
                </div>
                {/* Context Shots */}
                {[
                  'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=200&q=80',
                  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80',
                  'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=200&q=80'
                ].map((url, i) => (
                  <div key={i} className="bg-gray-100 rounded-lg overflow-hidden border cursor-pointer hover:border-blue-500">
                    <ImageWithFallback 
                      src={url} 
                      alt="Context View"
                      className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Details & Config */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-orange-500 flex items-center text-sm font-medium">
                  <Star className="w-4 h-4 fill-current mr-1" /> 4.9/5 (472 reviews)
                </span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-4">{product.name}</h1>
              <div className="text-2xl font-bold text-slate-900 mb-6">
                ${product.base_price} <span className="text-sm font-normal text-slate-500">/ each</span>
              </div>
              
              <div className="prose text-slate-600 mb-8">
                <p>{product.description || product.short_description}</p>
                <ul className="mt-4 space-y-2 list-none pl-0">
                  {product.features?.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" /> {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-50 p-6 rounded-xl border mb-8">
                <h3 className="font-semibold mb-4">Quantity Pricing Starting at:</h3>
                <p className="text-xs text-blue-600 mb-2">*Prices based on standard options</p>
                <div className="grid grid-cols-4 gap-px bg-slate-200 border rounded overflow-hidden">
                  <div className="bg-white p-2 text-center"><div className="text-blue-600 font-bold">${product.base_price}</div><div className="text-xs text-slate-500">1-10 Pcs</div></div>
                  <div className="bg-white p-2 text-center"><div className="text-blue-600 font-bold">${(product.base_price * 0.96).toFixed(2)}</div><div className="text-xs text-slate-500">11-20 Pcs</div></div>
                  <div className="bg-white p-2 text-center"><div className="text-blue-600 font-bold">${(product.base_price * 0.94).toFixed(2)}</div><div className="text-xs text-slate-500">21-30 Pcs</div></div>
                  <div className="bg-white p-2 text-center"><div className="text-blue-600 font-bold">${(product.base_price * 0.92).toFixed(2)}</div><div className="text-xs text-slate-500">31-50 Pcs</div></div>
                  <div className="bg-white p-2 text-center"><div className="text-blue-600 font-bold">${(product.base_price * 0.89).toFixed(2)}</div><div className="text-xs text-slate-500">51-100 Pcs</div></div>
                  <div className="bg-white p-2 text-center"><div className="text-blue-600 font-bold">${(product.base_price * 0.85).toFixed(2)}</div><div className="text-xs text-slate-500">101-250 Pcs</div></div>
                  <div className="bg-white p-2 text-center"><div className="text-blue-600 font-bold">${(product.base_price * 0.82).toFixed(2)}</div><div className="text-xs text-slate-500">251-1000 Pcs</div></div>
                  <div className="bg-white p-2 text-center"><div className="text-blue-600 font-bold">${(product.base_price * 0.75).toFixed(2)}</div><div className="text-xs text-slate-500">1000+ Pcs</div></div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                  <Button 
                    size="lg" 
                    onClick={handleStartDesign}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white text-lg h-14 shadow-lg shadow-orange-100 font-bold uppercase tracking-wide"
                  >
                    <span className="mr-2">✎</span> Design Now
                  </Button>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-12 bg-slate-50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-12">
             <div className="max-w-4xl mx-auto">
                 <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png" alt="Google" className="h-8" />
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Excellent on Google</h3>
                            <div className="flex text-yellow-400 text-sm">★★★★★ 4.9 out of 5 based on 472 reviews</div>
                        </div>
                    </div>
                    <Button variant="outline" className="bg-[#1a73e8] text-white hover:bg-[#1557b0] border-none">Review us on Google</Button>
                 </div>
                 
                 <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <div className="flex items-center gap-2 mb-3 text-purple-600 font-bold text-sm bg-purple-50 inline-block px-3 py-1 rounded-full">
                            ✨ AI-Generated Summary
                        </div>
                        <p className="text-sm text-slate-600 mb-2">Based on 472 Google reviews</p>
                        <div className="space-y-2 text-sm text-slate-700">
                            <div className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5"/> High-quality products with sturdy materials</div>
                            <div className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5"/> Exceptional customer service</div>
                            <div className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5"/> Quick turnaround time and affordability</div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="bg-white p-4 rounded-xl shadow-sm border">
                            <div className="flex items-center justify-between mb-2">
                                <div className="font-bold text-slate-900 flex items-center gap-2">
                                    <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">TD</div>
                                    Tony DeCarlo
                                </div>
                                <span className="text-xs text-slate-400">3 days ago</span>
                            </div>
                            <div className="text-yellow-400 text-xs mb-2">★★★★★</div>
                            <p className="text-sm text-slate-600">"Great service and prompt response time."</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border">
                            <div className="flex items-center justify-between mb-2">
                                <div className="font-bold text-slate-900 flex items-center gap-2">
                                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">PS</div>
                                    Phillip Scheldt
                                </div>
                                <span className="text-xs text-slate-400">17 days ago</span>
                            </div>
                            <div className="text-yellow-400 text-xs mb-2">★★★★★</div>
                            <p className="text-sm text-slate-600">"I have purchased SEVERAL different items from NameBadge and ALWAYS been happy."</p>
                        </div>
                    </div>
                 </div>
             </div>
          </div>
          
          <div className="mt-12">
             <RelatedProducts currentProduct={product} />
          </div>
        </div>
        {/* Live Chat Widget Mock */}
        <div className="fixed bottom-4 right-4 z-50">
            <Button className="rounded-full h-12 px-6 bg-[#2196F3] hover:bg-[#1976D2] shadow-lg flex items-center gap-2 text-white font-bold">
                Live Chat
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
            </Button>
        </div>
      </div>
    );
  }

  // CATEGORY VIEW
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
                  slug: 'specialty-badges-group',
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
                  slug: 'metal-badges-group',
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
          slug: 'signs-banners-group',
          subcategories: [
              { name: 'Banners', slug: 'vinyl-banner' },
              { name: 'Signs', slug: 'signs' },
              { name: 'Yard Signs', slug: 'yard-sign' },
              { name: 'A-Frame Signs', slug: 'a-frame-signs' },
              { name: 'Office Signs', slug: 'office-signs' },
              { name: 'Real Estate', slug: 'real-estate' }
          ]
      },
      {
          name: 'Stickers & Decals',
          slug: 'stickers-decals-group',
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
          slug: 'office-id-group',
          subcategories: [
              { name: 'Desk and Wall Plates', slug: 'desk-and-wall-plates' },
              { name: 'ID Cards', slug: 'id-cards' },
              { name: 'Self Inking Stamps', slug: 'self-inking-stamps' }
          ]
      },
      {
          name: 'Events & Trade Show',
          slug: 'events-group',
          subcategories: [
              { name: 'Trade Show & Events', slug: 'trade-show-events' },
              { name: 'Displays & Stands', slug: 'displays-stands' },
              { name: 'Flags & Fabric', slug: 'flags-fabric' },
              { name: 'Event Passes', slug: 'event-passes' }
          ]
      },
      { name: 'Prints', slug: 'prints' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs for Category View */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <nav className="flex items-center gap-2 text-sm text-slate-500">
                <Link to={createPageUrl('Home')} className="hover:text-blue-600">Store</Link>
                <ChevronRight className="w-4 h-4" />
                <span className="font-medium text-slate-900">{content.title.replace('!', '')}</span>
            </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <aside className="w-full lg:w-64 flex-shrink-0 hidden lg:block">
                <div className="bg-white border rounded-lg overflow-hidden sticky top-24 max-h-[calc(100vh-8rem)] flex flex-col">
                    <div className="bg-slate-100 px-4 py-3 border-b font-bold text-slate-800 flex-shrink-0">
                        Categories
                    </div>
                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        {CATEGORIES_SIDEBAR.map((cat, idx) => (
                            <CategorySidebarItem 
                                key={cat.slug || idx} 
                                item={cat} 
                                currentSlug={product.slug} 
                            />
                        ))}
                    </div>
                </div>
            </aside>

            {/* Main Category Content */}
            <div className="flex-1">
                {/* Hero Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-4 uppercase">{content.title}</h1>
                    <div className="prose max-w-none text-slate-600 mb-6">
                        <p>{content.description}</p>
                    </div>
                    {content.heroImage && (
                        <div className="rounded-xl overflow-hidden mb-8 border shadow-sm bg-white p-4 flex justify-center">
                            <img src={content.heroImage} alt={content.title} className="max-w-full h-auto object-contain" />
                        </div>
                    )}
                </div>

                {/* Product Grid */}
                {isLoading ? (
                    <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryProducts.map((p) => (
                        <div 
                        key={p.id} 
                        className="group border rounded-lg overflow-hidden hover:shadow-lg transition-all bg-white flex flex-col"
                        >
                        {/* Image Link */}
                        <Link to={`${createPageUrl('NameBadgeDesigner')}${getDesignParamsFromProduct(p)}`} className="aspect-[4/3] bg-white p-4 flex items-center justify-center border-b">
                            <ImageWithFallback
                            src={p.image_url}
                            alt={p.name}
                            className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500"
                            />
                        </Link>
                        
                        <div className="p-4 flex-1 flex flex-col text-center">
                            {/* Direct Link to Designer for Badge Variants */}
                            <Link to={`${createPageUrl('NameBadgeDesigner')}${getDesignParamsFromProduct(p)}`}>
                                <h3 className="font-medium text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[2.5rem]">
                                {p.name}
                                </h3>
                            </Link>
                            
                            <div className="flex justify-center mb-3">
                                <img src="https://www.namebadge.com/images/star_img.jpg" alt="5 Stars" className="h-4" />
                            </div>
                            <div className="mt-auto">
                                <Link to={`${createPageUrl('NameBadgeDesigner')}${getDesignParamsFromProduct(p)}`}>
                                    <Button className="w-full bg-orange-500 hover:bg-orange-600">
                                        Design Now
                                    </Button>
                                </Link>
                            </div>
                        </div>
                        </div>
                    ))}
                    {categoryProducts.length === 0 && (
                        <div className="col-span-full text-center py-12 text-slate-500 bg-slate-50 rounded-lg border border-dashed">
                        No products found in this category.
                        </div>
                    )}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}