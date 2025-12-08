import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { 
  Star, Truck, Clock, Shield, Award, ArrowRight, 
  CheckCircle, ChevronRight, Palette
} from 'lucide-react';
import Seeder from '@/components/Seeder';

const FALLBACK_CATEGORIES = [
  { name: 'Vinyl Banners', slug: 'vinyl-banner', image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400', price: 'From $58', link: 'ProductDetail?slug=vinyl-banner' },
  { name: 'Yard Signs', slug: 'yard-sign', image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400', price: 'From $20', link: 'ProductDetail?slug=yard-sign' },
  { name: 'Name Badges', slug: 'standard-name-badge', image: 'https://media.namebadge.com/live/images/category_header/15/15.png?v=109', price: 'From $8', link: 'Products?category=standard-name-badges' },
  { name: 'Retractable Banners', slug: 'retractable-banner', image: 'https://images.unsplash.com/photo-1565514020176-892eb6036d81?w=400', price: 'From $114', link: 'ProductDetail?slug=retractable-banner' },
  { name: 'A-Frame Signs', slug: 'a-frame-sign', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', price: 'From $89', link: 'ProductDetail?slug=a-frame-sign' },
  { name: 'Car Magnets', slug: 'car-magnet', image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400', price: 'From $35', link: 'ProductDetail?slug=car-magnet' },
  { name: 'Acrylic Signs', slug: 'acrylic-sign', image: 'https://images.unsplash.com/photo-1622396090075-15a9356a64f3?w=400', price: 'From $95', link: 'ProductDetail?slug=acrylic-sign' },
  { name: 'Stickers', slug: 'die-cut-sticker', image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400', price: 'From $45', link: 'ProductDetail?slug=die-cut-sticker' },
];

const FEATURES = [
  { icon: Clock, title: 'Fast Production', desc: 'Same-day & next-day options' },
  { icon: Truck, title: 'Free Shipping', desc: 'On orders over $99' },
  { icon: Shield, title: 'Quality Guarantee', desc: '100% satisfaction or money back' },
  { icon: Award, title: 'Best Prices', desc: 'Wholesale pricing for all' },
];

export default function Home() {
  // Fetch categories directly
  const { data: categories = [] } = useQuery({
    queryKey: ['home-categories'],
    queryFn: () => base44.entities.ProductCategory.list('order'),
  });

  // Map categories to display format
  const displayCategories = React.useMemo(() => {
    if (categories.length === 0) return FALLBACK_CATEGORIES;
    
    return categories
      .filter(c => c.image_url) // Only show categories with images
      .map(c => ({
        name: c.name,
        slug: c.slug,
        image: c.image_url,
        price: 'View Products', 
        link: `Products?category=${c.slug}`
      }))
      .slice(0, 8);
  }, [categories]);

  return (
    <div className="min-h-screen">
      <Seeder />
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920')] opacity-10 bg-cover bg-center" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Custom Signs & Banners
              <span className="text-[#8BC34A]"> Made Easy</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              Professional quality printing with fast turnaround. Design online or upload your artwork.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to={createPageUrl('ProductDetail') + '?slug=vinyl-banner'}>
                <Button size="lg" className="bg-[#8BC34A] hover:bg-[#7CB342] text-white text-lg px-8 h-14">
                  <Palette className="w-5 h-5 mr-2" />
                  Start Designing
                </Button>
              </Link>
              <Link to={createPageUrl('Products')}>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8 h-14">
                  Browse Products
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 mt-10 text-sm">
              {['Free Shipping $99+', 'Same Day Production', '100% Satisfaction'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#8BC34A]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#8BC34A]/10 rounded-lg flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-[#8BC34A]" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{feature.title}</p>
                  <p className="text-sm text-gray-500">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Categories */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Shop By Product</h2>
            <p className="text-gray-600 text-lg">Choose from our wide selection of custom signage</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {displayCategories.map((cat) => (
              <Link 
                key={cat.slug}
                to={cat.link.startsWith('http') ? cat.link : createPageUrl(cat.link.split('?')[0]) + (cat.link.includes('?') ? '?' + cat.link.split('?')[1] : '')}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
                   <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors z-10" />
                  <img 
                    src={cat.image} 
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-[#2196F3] transition-colors mb-1">{cat.name}</h3>
                    <div className="h-1 w-10 bg-[#8BC34A] rounded-full group-hover:w-16 transition-all duration-300" />
                  </div>
                  <div className="mt-4 flex items-center text-sm font-medium text-gray-500 group-hover:text-[#2196F3] transition-colors">
                    Shop Now <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-600 text-lg">Get your custom signs in 3 easy steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Choose Your Product', desc: 'Select from banners, signs, displays, and more' },
              { step: '2', title: 'Design Online', desc: 'Use our free design tool or upload your artwork' },
              { step: '3', title: 'We Print & Ship', desc: 'Fast production and delivery right to your door' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-[#2196F3] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-1 mb-4">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />)}
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Trusted by 50,000+ Customers</h2>
            <p className="text-gray-600">See what our customers have to say</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Sarah M.', text: 'Amazing quality and fast shipping! My banner looked exactly like the design tool preview.' },
              { name: 'John D.', text: 'Best prices I\'ve found online. The design tool is so easy to use, even for beginners.' },
              { name: 'Mike R.', text: 'Ordered 50 yard signs for my campaign. They arrived in 3 days and looked perfect!' },
            ].map((review, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-1 mb-3">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-gray-700 mb-4">"{review.text}"</p>
                <p className="font-medium text-gray-900">{review.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#2196F3]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 mb-8">Create your custom sign in minutes with our free design tool</p>
          <Link to={createPageUrl('ProductDetail') + '?slug=vinyl-banner'}>
            <Button size="lg" className="bg-white text-[#2196F3] hover:bg-gray-100 text-lg px-10 h-14">
              Get Started Now
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}