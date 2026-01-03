import { supabase } from '@/integrations/supabase/client';

type FirecrawlResponse<T = any> = {
  success: boolean;
  error?: string;
  data?: T;
};

type ScrapeOptions = {
  formats?: ('markdown' | 'html' | 'rawHtml' | 'links' | 'screenshot')[];
  onlyMainContent?: boolean;
  waitFor?: number;
};

type MapOptions = {
  search?: string;
  limit?: number;
  includeSubdomains?: boolean;
};

export const firecrawlApi = {
  // Scrape a single URL
  async scrape(url: string, options?: ScrapeOptions): Promise<FirecrawlResponse> {
    const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
      body: { url, options },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },

  // Map a website to discover all URLs
  async map(url: string, options?: MapOptions): Promise<FirecrawlResponse> {
    const { data, error } = await supabase.functions.invoke('firecrawl-map', {
      body: { url, options },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },
};

// BannerBuzz specific import API
export const bannerbuzzApi = {
  // Discover product URLs from a category page
  async discoverProducts(categoryUrl: string): Promise<{ success: boolean; urls?: string[]; error?: string }> {
    const { data, error } = await supabase.functions.invoke('import-bannerbuzz', {
      body: { action: 'discover', categoryUrl },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },

  // Scrape product details from URLs
  async scrapeProducts(productUrls: string[]): Promise<{ 
    success: boolean; 
    products?: any[]; 
    errors?: Array<{ url: string; error: string }>;
    error?: string;
  }> {
    const { data, error } = await supabase.functions.invoke('import-bannerbuzz', {
      body: { action: 'scrape', productUrls },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },

  // Import products to database
  async importProducts(
    products: any[], 
    categoryId: string, 
    pricePerSqft: number = 4.5
  ): Promise<{ 
    success: boolean; 
    imported?: number; 
    skipped?: number;
    error?: string;
  }> {
    const { data, error } = await supabase.functions.invoke('import-bannerbuzz', {
      body: { 
        action: 'import', 
        productUrls: products, // Actually product data
        categoryId,
        pricePerSqft,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },
};
