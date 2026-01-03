import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductData {
  name: string;
  slug: string;
  description: string;
  image_url: string;
  gallery_images: string[];
  preset_sizes: Array<{ width: number; height: number; label: string }>;
  product_options: Array<{
    name: string;
    type: string;
    required?: boolean;
    choices: Array<{
      title: string;
      hint?: string;
      price?: number;
      image_url?: string;
    }>;
  }>;
  source_url: string;
}

// Extract product data from scraped HTML/markdown
function extractProductData(html: string, markdown: string, sourceUrl: string): ProductData {
  const data: ProductData = {
    name: '',
    slug: '',
    description: '',
    image_url: '',
    gallery_images: [],
    preset_sizes: [],
    product_options: [],
    source_url: sourceUrl,
  };

  // Extract product name from title or h1
  const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i) || 
                     html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) {
    data.name = titleMatch[1].trim().replace(/\s*\|.*$/, '').replace(/\s*-\s*BannerBuzz.*$/i, '');
  }

  // Generate slug from URL or name
  const urlSlug = sourceUrl.split('/').pop()?.replace(/[?#].*$/, '');
  data.slug = urlSlug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  // Extract main product image
  const mainImageMatch = html.match(/class="[^"]*product-image[^"]*"[^>]*src="([^"]+)"/i) ||
                         html.match(/class="[^"]*main-image[^"]*"[^>]*src="([^"]+)"/i) ||
                         html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);
  if (mainImageMatch) {
    data.image_url = mainImageMatch[1];
  }

  // Extract gallery images
  const imageMatches = html.matchAll(/src="(https?:\/\/[^"]*(?:cdn\.bannerbuzz|images\.bannerbuzz)[^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"/gi);
  const uniqueImages = new Set<string>();
  for (const match of imageMatches) {
    if (!match[1].includes('thumbnail') && !match[1].includes('icon')) {
      uniqueImages.add(match[1]);
    }
  }
  data.gallery_images = Array.from(uniqueImages).slice(0, 10);

  // Use first gallery image as main if not found
  if (!data.image_url && data.gallery_images.length > 0) {
    data.image_url = data.gallery_images[0];
  }

  // Extract description from markdown
  const descriptionLines = markdown.split('\n')
    .filter(line => line.trim() && !line.startsWith('#') && !line.startsWith('!['))
    .slice(0, 5)
    .join('\n\n');
  data.description = descriptionLines || `High-quality ${data.name} for your business needs.`;

  // Extract preset sizes - look for common size patterns
  const sizePatterns = [
    /(\d+(?:\.\d+)?)\s*["']?\s*[xX×]\s*(\d+(?:\.\d+)?)\s*["']?/g,
    /(\d+)\s*x\s*(\d+)\s*(?:inches?|in|")?/gi,
  ];
  
  const foundSizes = new Set<string>();
  for (const pattern of sizePatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const w = parseFloat(match[1]);
      const h = parseFloat(match[2]);
      if (w >= 6 && w <= 120 && h >= 6 && h <= 120) {
        const key = `${w}x${h}`;
        if (!foundSizes.has(key)) {
          foundSizes.add(key);
          data.preset_sizes.push({
            width: w,
            height: h,
            label: `${w}" x ${h}"`,
          });
        }
      }
    }
  }

  // Default sizes if none found
  if (data.preset_sizes.length === 0) {
    data.preset_sizes = [
      { width: 24, height: 18, label: '24" x 18"' },
      { width: 36, height: 24, label: '36" x 24"' },
      { width: 48, height: 36, label: '48" x 36"' },
      { width: 72, height: 48, label: '72" x 48"' },
    ];
  }

  // Extract product options from the page
  // Look for option sections like "Print Sides", "Material", etc.
  const optionSections = [
    { name: 'Print Sides', keywords: ['single sided', 'double sided', 'front only', 'both sides'] },
    { name: 'Material', keywords: ['13 oz', '16 oz', 'vinyl', 'mesh', 'fabric'] },
    { name: 'Finishing', keywords: ['grommets', 'pole pocket', 'hem', 'rope'] },
  ];

  for (const section of optionSections) {
    const choices: Array<{ title: string; hint?: string; price?: number }> = [];
    for (const keyword of section.keywords) {
      const regex = new RegExp(keyword, 'gi');
      if (html.match(regex) || markdown.match(regex)) {
        choices.push({ 
          title: keyword.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          price: 0,
        });
      }
    }
    if (choices.length > 0) {
      data.product_options.push({
        name: section.name,
        type: 'radio',
        required: true,
        choices,
      });
    }
  }

  return data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, categoryUrl, categoryId, pricePerSqft = 4.5, productUrls } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');

    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === 'discover') {
      // Step 1: Discover all product URLs from category page
      console.log('Discovering products from:', categoryUrl);
      
      const mapResponse = await fetch('https://api.firecrawl.dev/v1/map', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: categoryUrl,
          limit: 100,
          includeSubdomains: false,
        }),
      });

      const mapData = await mapResponse.json();

      if (!mapResponse.ok) {
        return new Response(
          JSON.stringify({ success: false, error: mapData.error || 'Failed to map URLs' }),
          { status: mapResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Filter to only product URLs (exclude category pages, etc.)
      const productUrls = (mapData.links || []).filter((url: string) => {
        // BannerBuzz product URLs typically have specific patterns
        const isProductUrl = url.includes('/custom-') || 
                            url.includes('-banner') || 
                            url.includes('-sign') ||
                            (url.split('/').length > 4 && !url.includes('/category'));
        const isNotCategory = !url.endsWith('/banners') && 
                              !url.endsWith('/signs') &&
                              !url.includes('/page/');
        return isProductUrl && isNotCategory;
      });

      console.log('Found', productUrls.length, 'potential product URLs');

      return new Response(
        JSON.stringify({ 
          success: true, 
          urls: productUrls,
          total: productUrls.length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'scrape') {
      // Step 2: Scrape individual product pages
      const scrapedProducts: ProductData[] = [];
      const errors: Array<{ url: string; error: string }> = [];

      for (const url of productUrls.slice(0, 20)) { // Limit to 20 at a time
        try {
          console.log('Scraping:', url);
          
          const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url,
              formats: ['markdown', 'html'],
              onlyMainContent: false,
              waitFor: 2000,
            }),
          });

          const scrapeData = await scrapeResponse.json();

          if (scrapeResponse.ok && scrapeData.success) {
            const html = scrapeData.data?.html || '';
            const markdown = scrapeData.data?.markdown || '';
            const productData = extractProductData(html, markdown, url);
            
            if (productData.name) {
              scrapedProducts.push(productData);
            }
          } else {
            errors.push({ url, error: scrapeData.error || 'Failed to scrape' });
          }

          // Rate limiting - wait between requests
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err) {
          errors.push({ url, error: String(err) });
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          products: scrapedProducts,
          errors,
          scraped: scrapedProducts.length,
          failed: errors.length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'import') {
      // Step 3: Import scraped products to database
      const products = productUrls; // Actually product data array
      const imported: string[] = [];
      const skipped: string[] = [];

      for (const product of products) {
        // Check if product already exists by slug
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('slug', product.slug)
          .maybeSingle();

        if (existing) {
          skipped.push(product.name);
          continue;
        }

        // Insert the product
        const { data: newProduct, error: insertError } = await supabase
          .from('products')
          .insert({
            name: product.name,
            slug: product.slug,
            description: product.description,
            long_description: product.description,
            category_id: categoryId,
            image_url: product.image_url,
            gallery_images: product.gallery_images,
            preset_sizes: product.preset_sizes,
            product_options: product.product_options,
            price_per_sqft: pricePerSqft,
            pricing_type: 'sqft',
            size_unit: 'inches',
            allow_custom_size: true,
            has_design_tool: true,
            is_active: true,
            min_width: 6,
            max_width: 120,
            min_height: 6,
            max_height: 120,
            default_width: 36,
            default_height: 24,
          })
          .select('id')
          .single();

        if (insertError) {
          console.error('Error inserting product:', insertError);
          continue;
        }

        // Record the import
        await supabase.from('product_imports').insert({
          source_url: product.source_url,
          source_name: product.name,
          product_id: newProduct.id,
          scraped_data: product,
          import_status: 'imported',
        });

        imported.push(product.name);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          imported: imported.length,
          skipped: skipped.length,
          importedProducts: imported,
          skippedProducts: skipped,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in import-bannerbuzz:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
