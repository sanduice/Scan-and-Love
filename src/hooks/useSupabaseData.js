import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Session management for anonymous users
export function getSessionId() {
  let sessionId = localStorage.getItem('netrave_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('netrave_session_id', sessionId);
  }
  return sessionId;
}

// Product Categories
export function useProductCategories(orderBy = 'order') {
  return useQuery({
    queryKey: ['product-categories', orderBy],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('is_active', true)
        .order(orderBy);
      if (error) throw error;
      return data;
    },
  });
}

export function useProductCategory(slug) {
  return useQuery({
    queryKey: ['product-category', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });
}

// Products
export function useProducts(filters = {}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*, product_categories(name, slug)')
        .eq('is_active', true);
      
      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters.isFeatured) {
        query = query.eq('is_featured', true);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useProduct(slug) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_categories(name, slug)')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });
}

// Cart
export function useCart() {
  return useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from('cart_items')
        .select('*, products(name, slug, images, base_price)');
      
      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        query = query.eq('session_id', getSessionId());
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ productId, quantity, options, unitPrice }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const cartItem = {
        product_id: productId,
        quantity,
        options,
        unit_price: unitPrice,
        ...(user ? { user_id: user.id } : { session_id: getSessionId() }),
      };
      
      const { data, error } = await supabase
        .from('cart_items')
        .insert(cartItem)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, quantity }) => {
      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

// Orders
export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        query = query.eq('session_id', getSessionId());
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (orderData) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const order = {
        ...orderData,
        order_number: 'ORD-' + Date.now(),
        ...(user ? { user_id: user.id } : { session_id: getSessionId() }),
      };
      
      const { data, error } = await supabase
        .from('orders')
        .insert(order)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

// Saved Designs
export function useSavedDesigns() {
  return useQuery({
    queryKey: ['saved-designs'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase.from('saved_designs').select('*');
      
      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        query = query.eq('session_id', getSessionId());
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveDesign() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (designData) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const design = {
        ...designData,
        ...(user ? { user_id: user.id } : { session_id: getSessionId() }),
      };
      
      const { data, error } = await supabase
        .from('saved_designs')
        .insert(design)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-designs'] });
    },
  });
}

// Name Badge Designs
export function useNameBadgeDesigns() {
  return useQuery({
    queryKey: ['name-badge-designs'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase.from('name_badge_designs').select('*');
      
      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        query = query.eq('session_id', getSessionId());
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveNameBadgeDesign() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (designData) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const design = {
        ...designData,
        ...(user ? { user_id: user.id } : { session_id: getSessionId() }),
      };
      
      const { data, error } = await supabase
        .from('name_badge_designs')
        .insert(design)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['name-badge-designs'] });
    },
  });
}

// Design Templates
export function useDesignTemplates(category) {
  return useQuery({
    queryKey: ['design-templates', category],
    queryFn: async () => {
      let query = supabase
        .from('design_templates')
        .select('*')
        .eq('is_active', true);
      
      if (category) {
        query = query.eq('category', category);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// Coupons
export function useValidateCoupon() {
  return useMutation({
    mutationFn: async (code) => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('Invalid coupon code');
      
      const now = new Date();
      if (data.valid_from && new Date(data.valid_from) > now) {
        throw new Error('Coupon is not yet valid');
      }
      if (data.valid_until && new Date(data.valid_until) < now) {
        throw new Error('Coupon has expired');
      }
      if (data.usage_limit && data.usage_count >= data.usage_limit) {
        throw new Error('Coupon usage limit reached');
      }
      
      return data;
    },
  });
}

// Reviews
export function useProductReviews(productId) {
  return useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });
}

// Blog Posts
export function useBlogPosts() {
  return useQuery({
    queryKey: ['blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useBlogPost(slug) {
  return useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });
}

// Note: For auth, use the AuthContext from '@/contexts/AuthContext' instead
// This avoids duplicate useAuth exports and provides a more complete auth solution
