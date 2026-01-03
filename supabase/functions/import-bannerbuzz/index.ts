import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductOption {
  name: string;
  type: string;
  required?: boolean;
  choices: Array<{
    title: string;
    hint?: string;
    price?: number;
    image_url?: string;
  }>;
}

interface PresetSize {
  width: number;
  height: number;
  label: string;
}

interface ProductData {
  name: string;
  slug: string;
  description: string;
  image_url: string;
  gallery_images: string[];
  preset_sizes: PresetSize[];
  product_options: ProductOption[];
  source_url: string;
  scrape_errors?: string[];
}

// Extract product name from HTML/markdown
function extractProductName(html: string, markdown: string, url: string): string {
  // Try og:title first (most reliable for product pages)
  const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i) ||
                       html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:title"/i);
  if (ogTitleMatch) {
    const title = ogTitleMatch[1].trim()
      .replace(/\s*\|.*$/, '')
      .replace(/\s*-\s*BannerBuzz.*$/i, '')
      .replace(/\s*–\s*BannerBuzz.*$/i, '');
    if (title.length > 3) return title;
  }

  // Try markdown H1 header
  const h1Match = markdown.match(/^#\s+(.+?)$/m);
  if (h1Match) {
    const title = h1Match[1].trim()
      .replace(/\s*\|.*$/, '')
      .replace(/\s*-\s*BannerBuzz.*$/i, '');
    if (title.length > 3) return title;
  }

  // Try HTML title tag
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) {
    const title = titleMatch[1].trim()
      .replace(/\s*\|.*$/, '')
      .replace(/\s*-\s*BannerBuzz.*$/i, '')
      .replace(/\s*–\s*BannerBuzz.*$/i, '');
    if (title.length > 3) return title;
  }

  // Try HTML h1 tag
  const htmlH1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (htmlH1Match) {
    const title = htmlH1Match[1].trim();
    if (title.length > 3) return title;
  }

  // Fallback: Generate from URL
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1] || '';
    // Remove /p suffix and clean up
    const slug = lastPart.replace(/^p$/, '').replace(/-p$/, '') || pathParts[pathParts.length - 2] || '';
    if (slug) {
      return slug
        .replace(/-/g, ' ')
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
  } catch (e) {
    console.log('[extractProductName] URL parse error:', e);
  }

  return 'Unknown Product';
}

// Extract images from HTML/markdown
function extractImages(html: string, markdown: string): { mainImage: string; gallery: string[] } {
  const images: string[] = [];
  const seen = new Set<string>();

  // Extract og:image for main product image (highest priority)
  const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i) ||
                       html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:image"/i);
  
  let mainImage = '';
  if (ogImageMatch) {
    mainImage = ogImageMatch[1];
    seen.add(mainImage);
    images.push(mainImage);
  }

  // Find all cdn.bannerbuzz.com catalog product images
  const cdnPatterns = [
    /https:\/\/cdn\.bannerbuzz\.com\/media\/catalog\/product[^"'\s)>]+\.(jpg|jpeg|png|webp)/gi,
    /https:\/\/cdn\.bannerbuzz\.com\/media\/wysiwyg[^"'\s)>]+\.(jpg|jpeg|png|webp)/gi,
  ];

  for (const pattern of cdnPatterns) {
    const matches = [...html.matchAll(pattern), ...markdown.matchAll(pattern)];
    for (const match of matches) {
      let imgUrl = match[0];
      
      // Skip thumbnails, small images, and option images
      if (imgUrl.includes('/resize/78/') || 
          imgUrl.includes('/resize/50/') ||
          imgUrl.includes('/optionvalue/') ||
          imgUrl.includes('/thumbnail/') ||
          imgUrl.includes('_thumb') ||
          imgUrl.includes('-thumb')) {
        continue;
      }

      // Normalize URL
      imgUrl = imgUrl.split('?')[0];
      
      if (!seen.has(imgUrl)) {
        seen.add(imgUrl);
        images.push(imgUrl);
      }
    }
  }

  // Also try to extract from img tags with src attributes
  const imgTagPattern = /<img[^>]+src="(https:\/\/cdn\.bannerbuzz\.com[^"]+)"/gi;
  const imgMatches = html.matchAll(imgTagPattern);
  for (const match of imgMatches) {
    let imgUrl = match[1].split('?')[0];
    if (!imgUrl.includes('/resize/78/') && 
        !imgUrl.includes('/optionvalue/') &&
        !seen.has(imgUrl)) {
      seen.add(imgUrl);
      images.push(imgUrl);
    }
  }

  // If no main image from og:image, use first gallery image
  if (!mainImage && images.length > 0) {
    mainImage = images[0];
  }

  return {
    mainImage,
    gallery: images.slice(0, 12), // Limit to 12 images
  };
}

// Extract product options from markdown
function extractProductOptions(markdown: string, html: string): ProductOption[] {
  const options: ProductOption[] = [];
  const processedOptions = new Set<string>();

  // Define option sections to look for
  const optionPatterns = [
    { header: /Print Sides?/i, name: 'Print Sides' },
    { header: /Material\s*(?:Weight|Type)?/i, name: 'Material' },
    { header: /Upgrade to Premium/i, name: 'Material Upgrade' },
    { header: /Hanging Options?/i, name: 'Hanging Options' },
    { header: /Protective Coating/i, name: 'Protective Coating' },
    { header: /Wind Flaps?/i, name: 'Wind Flaps' },
    { header: /Pole Pockets?/i, name: 'Pole Pockets' },
    { header: /Grommets?/i, name: 'Grommets' },
    { header: /Finishing/i, name: 'Finishing' },
    { header: /Hemming/i, name: 'Hemming' },
  ];

  // Parse the markdown for option sections
  const lines = markdown.split('\n');
  
  for (const { header, name } of optionPatterns) {
    if (processedOptions.has(name)) continue;

    // Find section in markdown
    let inSection = false;
    let sectionContent = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (header.test(line)) {
        inSection = true;
        sectionContent = '';
        continue;
      }
      
      if (inSection) {
        // End section on next header or divider
        if (line.startsWith('#') || line.match(/^\*{3,}$/) || line.match(/^-{3,}$/)) {
          break;
        }
        sectionContent += line + '\n';
      }
    }

    if (sectionContent) {
      const choices: Array<{ title: string; image_url?: string; price?: number }> = [];
      
      // Parse image + title patterns: ![Alt Text](url) followed by text
      const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)\s*\n?([^\n$!]*)/g;
      let match;
      
      while ((match = imagePattern.exec(sectionContent)) !== null) {
        const altText = match[1]?.trim();
        const imageUrl = match[2]?.trim();
        const description = match[3]?.trim();
        
        // Extract price if present (e.g., "$5.00" or "+ $5.00")
        const priceMatch = description?.match(/\+?\s*\$(\d+\.?\d*)/);
        const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
        
        const title = altText || description?.replace(/\+?\s*\$\d+\.?\d*/, '').trim() || '';
        
        if (title && !choices.some(c => c.title.toLowerCase() === title.toLowerCase())) {
          choices.push({
            title,
            image_url: imageUrl,
            price,
          });
        }
      }

      // Also look for plain text options (bullet points)
      const bulletPattern = /^[\-\*]\s+(.+?)(?:\s+\+?\$(\d+\.?\d*))?$/gm;
      while ((match = bulletPattern.exec(sectionContent)) !== null) {
        const title = match[1]?.trim();
        const price = match[2] ? parseFloat(match[2]) : 0;
        
        if (title && !choices.some(c => c.title.toLowerCase() === title.toLowerCase())) {
          choices.push({ title, price });
        }
      }

      if (choices.length > 0) {
        processedOptions.add(name);
        options.push({
          name,
          type: 'radio',
          required: name === 'Print Sides' || name === 'Material',
          choices,
        });
      }
    }
  }

  // Fallback: Look for common options in HTML if markdown parsing failed
  if (options.length === 0) {
    const fallbackOptions = [
      { name: 'Print Sides', keywords: ['single sided', 'double sided', 'front only', 'both sides'] },
      { name: 'Material', keywords: ['13 oz vinyl', '16 oz vinyl', 'mesh banner', 'fabric banner'] },
      { name: 'Finishing', keywords: ['grommets', 'pole pocket', 'hemmed edges', 'rope & grommets'] },
    ];

    for (const section of fallbackOptions) {
      const choices: Array<{ title: string; price: number }> = [];
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
        options.push({
          name: section.name,
          type: 'radio',
          required: section.name === 'Print Sides',
          choices,
        });
      }
    }
  }

  return options;
}

// Extract preset sizes from markdown/html
function extractPresetSizes(markdown: string, html: string): PresetSize[] {
  const sizes: PresetSize[] = [];
  const seen = new Set<string>();

  // Pattern for feet x feet (e.g., "3 x 2", "4' x 8'")
  const feetPattern = /(\d+)(?:'|'|ft)?\s*[xX×]\s*(\d+)(?:'|'|ft)?/g;
  
  // Pattern for inches (e.g., "24" x 18"", "36 x 24 inches")
  const inchPattern = /(\d+)(?:"|''|in)?\s*[xX×]\s*(\d+)(?:"|''|in(?:ches)?)?/g;

  // Check markdown for size tables or lists
  const content = markdown + ' ' + html;
  
  // First try feet patterns (more common for banners)
  let match;
  const feetMatches = content.matchAll(feetPattern);
  for (match of feetMatches) {
    const w = parseInt(match[1]);
    const h = parseInt(match[2]);
    
    // Reasonable banner sizes in feet (1-20 feet range)
    if (w >= 1 && w <= 20 && h >= 1 && h <= 20) {
      const widthInches = w * 12;
      const heightInches = h * 12;
      const key = `${widthInches}x${heightInches}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        sizes.push({
          width: widthInches,
          height: heightInches,
          label: `${w}' x ${h}'`,
        });
      }
    }
  }

  // Then try inch patterns
  const inchMatches = content.matchAll(inchPattern);
  for (match of inchMatches) {
    const w = parseInt(match[1]);
    const h = parseInt(match[2]);
    
    // Reasonable banner sizes in inches (6-240 inch range)
    if (w >= 6 && w <= 240 && h >= 6 && h <= 240) {
      const key = `${w}x${h}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        sizes.push({
          width: w,
          height: h,
          label: `${w}" x ${h}"`,
        });
      }
    }
  }

  // Sort by area
  sizes.sort((a, b) => (a.width * a.height) - (b.width * b.height));

  // Default sizes if none found
  if (sizes.length === 0) {
    return [
      { width: 36, height: 24, label: "3' x 2'" },
      { width: 48, height: 36, label: "4' x 3'" },
      { width: 72, height: 48, label: "6' x 4'" },
      { width: 96, height: 48, label: "8' x 4'" },
    ];
  }

  return sizes.slice(0, 10); // Limit to 10 sizes
}

// Generate slug from name
function generateSlug(name: string, url: string): string {
  // Try to extract from URL first
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1] || '';
    
    // Clean up the URL slug
    if (lastPart && lastPart !== 'p') {
      const slug = lastPart.replace(/-p$/, '').replace(/^p-/, '');
      if (slug.length > 3) return slug;
    }
    
    // Try second to last part
    if (pathParts.length >= 2) {
      const slug = pathParts[pathParts.length - 2];
      if (slug && slug.length > 3) return slug;
    }
  } catch (e) {
    console.log('[generateSlug] URL parse error:', e);
  }

  // Generate from name
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 100);
}

// Extract description from markdown
function extractDescription(markdown: string, name: string): string {
  const lines = markdown.split('\n');
  const descriptionLines: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip headers, images, empty lines, and navigation elements
    if (!trimmed || 
        trimmed.startsWith('#') || 
        trimmed.startsWith('![') ||
        trimmed.startsWith('[') ||
        trimmed.startsWith('*') ||
        trimmed.startsWith('-') ||
        trimmed.length < 30) {
      continue;
    }
    
    // Skip lines that look like navigation or menu items
    if (trimmed.includes('Sign In') || 
        trimmed.includes('Cart') ||
        trimmed.includes('Free Shipping') ||
        trimmed.includes('Skip to')) {
      continue;
    }
    
    descriptionLines.push(trimmed);
    
    if (descriptionLines.length >= 3) break;
  }
  
  if (descriptionLines.length > 0) {
    return descriptionLines.join('\n\n');
  }
  
  return `High-quality ${name} for your business needs. Customizable sizes and options available.`;
}

// Main extraction function
function extractProductData(html: string, markdown: string, sourceUrl: string): ProductData {
  const errors: string[] = [];
  
  // Extract each field with error tracking
  const name = extractProductName(html, markdown, sourceUrl);
  if (name === 'Unknown Product') {
    errors.push('Could not extract product name');
  }

  const { mainImage, gallery } = extractImages(html, markdown);
  if (!mainImage) {
    errors.push('No product images found');
  }

  const options = extractProductOptions(markdown, html);
  if (options.length === 0) {
    errors.push('No product options extracted');
  }

  const sizes = extractPresetSizes(markdown, html);
  
  const slug = generateSlug(name, sourceUrl);
  const description = extractDescription(markdown, name);

  console.log(`[extract] ${sourceUrl}`);
  console.log(`  - name: "${name}"`);
  console.log(`  - images: ${gallery.length}`);
  console.log(`  - options: ${options.length}`);
  console.log(`  - sizes: ${sizes.length}`);
  if (errors.length > 0) {
    console.log(`  - errors: ${errors.join(', ')}`);
  }

  return {
    name,
    slug,
    description,
    image_url: mainImage,
    gallery_images: gallery,
    preset_sizes: sizes,
    product_options: options,
    source_url: sourceUrl,
    scrape_errors: errors.length > 0 ? errors : undefined,
  };
}

// Check if URL is a product page
function isProductUrl(url: string, baseUrl: string): boolean {
  try {
    const urlObj = new URL(url);
    const baseUrlObj = new URL(baseUrl);
    
    // Must be same domain
    if (urlObj.hostname !== baseUrlObj.hostname) return false;
    
    const path = urlObj.pathname;
    const pathParts = path.split('/').filter(Boolean);
    
    // BannerBuzz product URLs end with /p
    if (path.endsWith('/p')) return true;
    
    // Or have product-like patterns
    if (pathParts.length >= 2) {
      const lastPart = pathParts[pathParts.length - 1];
      
      // Skip category index pages
      const skipPatterns = ['banners', 'signs', 'flags', 'displays', 'stickers', 'decals'];
      if (skipPatterns.includes(lastPart)) return false;
      
      // Skip pagination and filters
      if (lastPart.includes('page') || path.includes('/category/') || path.includes('/filter/')) {
        return false;
      }
      
      // Product URLs typically have hyphens and are descriptive
      if (lastPart.includes('-') && lastPart.length > 10) {
        return true;
      }
    }
    
    return false;
  } catch (e) {
    return false;
  }
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
      console.error('[error] FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured. Please set up the Firecrawl connector.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // ===== ACTION: DISCOVER =====
    if (action === 'discover') {
      console.log('[discover] Starting discovery for:', categoryUrl);
      
      // First, try to map all URLs on the site
      const mapResponse = await fetch('https://api.firecrawl.dev/v1/map', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: categoryUrl,
          limit: 200,
          includeSubdomains: false,
        }),
      });

      const mapData = await mapResponse.json();
      console.log('[discover] Map response status:', mapResponse.status);
      console.log('[discover] Total URLs from map:', mapData.links?.length || 0);

      if (!mapResponse.ok) {
        console.error('[discover] Map failed:', mapData.error);
        return new Response(
          JSON.stringify({ success: false, error: mapData.error || 'Failed to map URLs' }),
          { status: mapResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Filter to only product URLs
      const allLinks = mapData.links || [];
      const productUrlList = allLinks.filter((url: string) => isProductUrl(url, categoryUrl));

      console.log('[discover] Filtered to', productUrlList.length, 'product URLs');

      // If no products found via map, try scraping the category page directly
      if (productUrlList.length === 0) {
        console.log('[discover] No products from map, trying direct scrape of category page');
        
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: categoryUrl,
            formats: ['links', 'html'],
            waitFor: 3000,
          }),
        });

        const scrapeData = await scrapeResponse.json();
        
        if (scrapeResponse.ok && scrapeData.success) {
          const pageLinks = scrapeData.data?.links || [];
          console.log('[discover] Links from category page scrape:', pageLinks.length);
          
          for (const link of pageLinks) {
            if (isProductUrl(link, categoryUrl) && !productUrlList.includes(link)) {
              productUrlList.push(link);
            }
          }
          
          console.log('[discover] After adding from scrape:', productUrlList.length, 'products');
        }
      }

      // Remove duplicates
      const uniqueUrls = [...new Set(productUrlList)];

      return new Response(
        JSON.stringify({ 
          success: true, 
          urls: uniqueUrls,
          total: uniqueUrls.length,
          message: uniqueUrls.length === 0 
            ? 'No product URLs found. Try a more specific category URL (e.g., /banners/vinyl-banners instead of /banners).'
            : `Found ${uniqueUrls.length} product URLs`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===== ACTION: SCRAPE =====
    if (action === 'scrape') {
      console.log('[scrape] Starting scrape of', productUrls?.length, 'URLs');
      
      const scrapedProducts: ProductData[] = [];
      const errors: Array<{ url: string; error: string }> = [];
      const maxProducts = 25; // Process up to 25 at a time

      const urlsToProcess = (productUrls || []).slice(0, maxProducts);

      for (let i = 0; i < urlsToProcess.length; i++) {
        const url = urlsToProcess[i];
        
        try {
          console.log(`[scrape] (${i + 1}/${urlsToProcess.length}) Scraping:`, url);
          
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
            
            // Only add if we got a valid name
            if (productData.name && productData.name !== 'Unknown Product') {
              scrapedProducts.push(productData);
              console.log(`[scrape] Success: "${productData.name}"`);
            } else {
              errors.push({ url, error: 'Could not extract product name' });
              console.log(`[scrape] Failed to extract name for:`, url);
            }
          } else {
            const errorMsg = scrapeData.error || `HTTP ${scrapeResponse.status}`;
            errors.push({ url, error: errorMsg });
            console.error(`[scrape] Failed:`, url, errorMsg);
          }

          // Rate limiting - wait between requests
          if (i < urlsToProcess.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 800));
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          errors.push({ url, error: errorMsg });
          console.error(`[scrape] Exception for ${url}:`, errorMsg);
        }
      }

      console.log(`[scrape] Complete: ${scrapedProducts.length} success, ${errors.length} failed`);

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

    // ===== ACTION: IMPORT =====
    if (action === 'import') {
      console.log('[import] Starting import of', productUrls?.length, 'products to category:', categoryId);
      
      const products = productUrls; // Actually product data array
      const imported: string[] = [];
      const skipped: string[] = [];
      const importErrors: Array<{ name: string; error: string }> = [];

      for (const product of products) {
        try {
          // Check if product already exists by slug
          const { data: existing } = await supabase
            .from('products')
            .select('id')
            .eq('slug', product.slug)
            .maybeSingle();

          if (existing) {
            skipped.push(product.name);
            console.log(`[import] Skipped (exists): "${product.name}"`);
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
              max_width: 240,
              min_height: 6,
              max_height: 240,
              default_width: 48,
              default_height: 36,
            })
            .select('id')
            .single();

          if (insertError) {
            console.error(`[import] Insert error for "${product.name}":`, insertError);
            importErrors.push({ name: product.name, error: insertError.message });
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
          console.log(`[import] Success: "${product.name}"`);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          importErrors.push({ name: product.name || 'Unknown', error: errorMsg });
          console.error(`[import] Exception:`, errorMsg);
        }
      }

      console.log(`[import] Complete: ${imported.length} imported, ${skipped.length} skipped, ${importErrors.length} failed`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          imported: imported.length,
          skipped: skipped.length,
          failed: importErrors.length,
          importedProducts: imported,
          skippedProducts: skipped,
          errors: importErrors,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: `Invalid action: ${action}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[error] Unhandled exception:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
