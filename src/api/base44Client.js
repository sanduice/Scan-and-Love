// Base44 SDK replacement - uses Supabase for auth
import { supabase } from '@/integrations/supabase/client';

// Helper to create a mock entity with standard CRUD operations
const createMockEntity = (tableName) => ({
  list: async (orderBy) => {
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) console.warn(`Error listing ${tableName}:`, error);
    return data || [];
  },
  filter: async (filters) => {
    let query = supabase.from(tableName).select('*');
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    const { data, error } = await query;
    if (error) console.warn(`Error filtering ${tableName}:`, error);
    return data || [];
  },
  get: async (id) => {
    const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
    if (error) console.warn(`Error getting ${tableName}:`, error);
    return data;
  },
  create: async (record) => {
    // Get current user and add user_id if authenticated
    const { data: { user } } = await supabase.auth.getUser();
    const recordWithUser = user ? { ...record, user_id: user.id } : record;
    
    const { data, error } = await supabase.from(tableName).insert(recordWithUser).select().single();
    if (error) throw error;
    return data;
  },
  update: async (id, record) => {
    const { data, error } = await supabase.from(tableName).update(record).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  delete: async (id) => {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) throw error;
    return true;
  },
});

export const base44 = {
  auth: {
    isAuthenticated: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return !!user;
    },
    me: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      return {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || '',
        company_name: user.user_metadata?.company_name || '',
      };
    },
    redirectToLogin: (returnUrl) => {
      // Redirect to internal auth page instead of Base44
      window.location.href = '/Auth';
    },
    logout: async (redirectUrl) => {
      await supabase.auth.signOut();
      window.location.href = redirectUrl || '/';
    },
    updateMe: async (data) => {
      const { error } = await supabase.auth.updateUser({
        data: data
      });
      if (error) throw error;
      return data;
    },
  },
  entities: {
    ProductCategory: createMockEntity('product_categories'),
    Product: createMockEntity('products'),
    CartItem: createMockEntity('cart_items'),
    Order: createMockEntity('orders'),
    SavedDesign: createMockEntity('saved_designs'),
    DesignTemplate: createMockEntity('design_templates'),
    Coupon: createMockEntity('coupons'),
    Review: createMockEntity('reviews'),
    StickerOrder: createMockEntity('sticker_orders'),
    NameBadgeDesign: createMockEntity('name_badge_designs'),
    NameBadgeOrder: createMockEntity('name_badge_orders'),
    Quote: createMockEntity('quotes'),
    Invoice: createMockEntity('invoices'),
    PricingTier: createMockEntity('pricing_tiers'),
    BlogPost: createMockEntity('blog_posts'),
    ScrapedProduct: createMockEntity('scraped_products'),
    TaxNexus: createMockEntity('tax_nexus'),
    CustomerTaxExemption: createMockEntity('customer_tax_exemptions'),
    AnalyticsEvent: createMockEntity('analytics_events'),
  },
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        if (!file) throw new Error('No file provided');
        
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `products/${fileName}`;
        
        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('products')
          .upload(filePath, file);
        
        if (error) throw error;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);
        
        return { file_url: publicUrl };
      },
      SendEmail: async () => ({}),
      InvokeLLM: async () => ({}),
      GenerateImage: async () => ({}),
      ExtractDataFromUploadedFile: async () => ({}),
      CreateFileSignedUrl: async () => ({}),
      UploadPrivateFile: async () => ({ file_url: '' }),
    }
  },
  functions: {
    scrapeSignsData: async () => ({}),
    importScrapedProduct: async () => ({}),
    generateProductImage: async () => ({}),
    seedVistaProducts: async () => ({}),
    llms: async () => ({}),
    cleanup_categories: async () => ({}),
    cleanup_duplicates: async () => ({}),
    seed_signs_catalog: async () => ({}),
    force_cleanup: async () => ({}),
    seed_name_badges: async () => ({}),
    fix_catalog_organization: async () => ({}),
    
    // Generic invoke method for edge functions
    invoke: async (functionName, payload) => {
      // Map underscore names to hyphen names for edge functions
      const edgeFunctionName = functionName.replace(/_/g, '-');
      const { data, error } = await supabase.functions.invoke(edgeFunctionName, {
        body: payload
      });
      if (error) throw error;
      return { data };
    },
    
    // Stripe config - returns test publishable key as fallback
    get_stripe_config: async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-stripe-config');
        if (error) throw error;
        return { data };
      } catch (e) {
        // Fallback to Stripe test key for development
        return { 
          data: { 
            configured: true,
            publishableKey: 'pk_test_TYooMQauvdEDq54NiTphI7jx' 
          } 
        };
      }
    },
    
    // Create payment intent
    create_payment_intent: async (payload) => {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: payload
      });
      if (error) throw error;
      return { data };
    },
    
    // Calculate tax
    calculateTax: async (payload) => {
      try {
        const { data, error } = await supabase.functions.invoke('calculate-tax', {
          body: payload
        });
        if (error) throw error;
        return { data };
      } catch (e) {
        return { data: { tax: 0, rate: 0, state: payload?.state } };
      }
    },
  }
};
