import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useProductCategories, useProducts } from '@/hooks/useSupabaseData';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Star, Truck, Clock, Shield, Award, ArrowRight, 
  CheckCircle, ChevronRight, Palette, Grid3X3, Trophy, BadgeCheck
} from 'lucide-react';
import Seeder from '@/components/Seeder';
import ProductCard from '@/components/home/ProductCard';

const FEATURES = [
  { icon: Clock, title: 'Fast Production', desc: 'Same-day & next-day options' },
  { icon: Truck, title: 'Free Shipping', desc: 'On orders over $99' },
  { icon: Shield, title: 'Quality Guarantee', desc: '100% satisfaction or money back' },
  { icon: Award, title: 'Best Prices', desc: 'Wholesale pricing for all' },
];

const WHY_CHOOSE_US = [
  {
    icon: Grid3X3,
    title: 'Wide Variety',
    description: 'We pride ourselves on the ability to make any print item needed for your business - from name tags and signs to mugs and t-shirts.'
  },
  {
    icon: Trophy,
    title: 'Best in the Nation',
    description: 'Founded in 2008 and based out of Downtown Fargo, ND. With a second facility for production in the industrial park of North Fargo.'
  },
  {
    icon: BadgeCheck,
    title: 'Highest Quality',
    description: 'We create affordable, professional office signs and conference room signs with a clean and contemporary look that will easily elevate your business\'s professionalism, efficiency, and communications.'
  },
  {
    icon: Clock,
    title: 'Two-Day Turnaround',
    description: 'We offer a quick two-day turnaround on all standard products. Some exceptions will apply and it does not include art approval time.'
  }
];

const CUSTOMER_LOGOS = [
  'Microsoft', 'Amazon', 'Google', 'Apple', 'Meta', 'Netflix'
];

export default function Home() {
  const { data: categories = [], isLoading: categoriesLoading } = useProductCategories('order');
  const { data: products = [], isLoading: productsLoading } = useProducts();

  const isLoading = categoriesLoading || productsLoading;

  // Group products by category
  const productsByCategory = useMemo(() => {
    const grouped = {};
    products.forEach(product => {
      const catId = product.category_id;
      if (catId) {
        if (!grouped[catId]) grouped[catId] = [];
        grouped[catId].push(product);
      }
    });
    return grouped;
  }, [products]);

  // Categories that have products
  const categoriesWithProducts = useMemo(() => {
    return categories.filter(cat => productsByCategory[cat.id]?.length > 0);
  }, [categories, productsByCategory]);

  // One product from each category for "Shop by Categories" with category info
  const shopByCategoryProducts = useMemo(() => {
    return categoriesWithProducts
      .slice(0, 10)
      .map(cat => ({
        product: productsByCategory[cat.id]?.[0],
        category: cat
      }))
      .filter(item => item.product);
  }, [categoriesWithProducts, productsByCategory]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen">
        {/* Hero Skeleton */}
        <Skeleton className="h-[400px] w-full" />
        
        {/* Features Skeleton */}
        <div className="bg-white border-b py-6">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Products Skeleton */}
        <div className="py-16 bg-muted/30">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <Skeleton className="h-8 w-64 mx-auto mb-8" />
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden">
                  <Skeleton className="aspect-[4/3]" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Seeder />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920')] opacity-10 bg-cover bg-center" />
        <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
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
                <Button size="lg" variant="outline" className="border-white/70 text-white text-lg px-8 h-14">
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
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#8BC34A]/10 rounded-lg flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-[#8BC34A]" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{feature.title}</p>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shop by Categories - One product from each category */}
      {shopByCategoryProducts.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Shop by Categories</h2>
              <Link 
                to={createPageUrl('Products')} 
                className="flex items-center gap-1 text-primary hover:text-primary/80 font-medium transition-colors"
              >
                See All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {shopByCategoryProducts.map(({ product, category }) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  displayName={category.name}
                  linkTo={createPageUrl('Products') + `?category=${category.slug}`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Dynamic Category Sections */}
      {categoriesWithProducts.slice(0, 6).map((category, index) => (
        <section 
          key={category.id} 
          className={`py-12 ${index % 2 === 0 ? 'bg-white' : 'bg-muted/30'}`}
        >
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-foreground">{category.name}</h2>
              <Link 
                to={createPageUrl('Products') + `?category=${category.slug}`}
                className="flex items-center gap-1 text-primary hover:text-primary/80 font-medium text-sm transition-colors"
              >
                See All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {productsByCategory[category.id]?.slice(0, 5).map((product) => (
                <ProductCard key={product.id} product={product} showRating={true} />
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Why Choose Us */}
      <section className="py-16 bg-white">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Why Choose Us?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We're committed to delivering the best custom printing experience
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {WHY_CHOOSE_US.map((item) => (
              <div key={item.title} className="text-center p-6 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proud To Serve Our Customers */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">Proud To Serve Our Customers</h2>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {CUSTOMER_LOGOS.map((name) => (
              <div 
                key={name} 
                className="w-28 h-14 bg-white rounded-lg shadow-sm flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
              >
                <span className="text-muted-foreground font-medium text-sm">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg">Get your custom signs in 3 easy steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Choose Your Product', desc: 'Select from banners, signs, displays, and more' },
              { step: '2', title: 'Design Online', desc: 'Use our free design tool or upload your artwork' },
              { step: '3', title: 'We Print & Ship', desc: 'Fast production and delivery right to your door' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-1 mb-4">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />)}
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Trusted by 50,000+ Customers</h2>
            <p className="text-muted-foreground">See what our customers have to say</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Sarah M.', text: 'Amazing quality and fast shipping! My banner looked exactly like the design tool preview.' },
              { name: 'John D.', text: 'Best prices I\'ve found online. The design tool is so easy to use, even for beginners.' },
              { name: 'Mike R.', text: 'Ordered 50 yard signs for my campaign. They arrived in 3 days and looked perfect!' },
            ].map((review, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-1 mb-3">
                  {[1,2,3,4,5].map(j => <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-foreground mb-4">"{review.text}"</p>
                <p className="font-medium text-foreground">{review.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-primary-foreground/80 mb-8">Create your custom sign in minutes with our free design tool</p>
          <Link to={createPageUrl('ProductDetail') + '?slug=vinyl-banner'}>
            <Button size="lg" className="bg-white text-primary hover:bg-gray-100 text-lg px-10 h-14">
              Get Started Now
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
