

## Comprehensive Shopify Integration Plan

### Current Architecture Analysis

Your project is a custom print e-commerce platform with:

| Component | Current Implementation |
|-----------|----------------------|
| **Frontend** | React + Vite + TailwindCSS |
| **Database** | Lovable Cloud (Supabase) |
| **Products** | `products` table with categories, pricing tiers, preset sizes |
| **Cart** | `cart_items`, `saved_designs`, `name_badge_orders` tables |
| **Orders** | `orders` table with JSONB items |
| **Payments** | Stripe integration (existing) |
| **Auth** | Supabase Auth with session-based anonymous tracking |
| **Admin** | Full admin panel at `/Admin` |

### Shopify Integration Approach

Since your Lovable account email doesn't match your existing Shopify store owner email, there are two paths:

**Option A: Create New Shopify Development Store**
- Create a fresh Shopify store through Lovable
- Sync your existing products to Shopify
- Use Shopify for checkout and fulfillment
- Free during development, 30-day trial when you claim it

**Option B: Connect Existing Shopify Store**
- Requires matching email or contacting Shopify store admin
- Would sync with your existing Shopify inventory and orders

---

### Integration Architecture

```text
+------------------+       +-------------------+       +------------------+
|   Your React     |       |   Edge Functions  |       |    Shopify       |
|   Frontend       |<----->|   (API Layer)     |<----->|    Storefront    |
|                  |       |                   |       |    API           |
+------------------+       +-------------------+       +------------------+
        |                          |
        v                          v
+------------------+       +-------------------+
|   Lovable Cloud  |       |   Shopify Admin   |
|   Database       |       |   API             |
|   (Supabase)     |       |   (Products,      |
|                  |       |    Orders,        |
|                  |       |    Inventory)     |
+------------------+       +-------------------+
```

---

### Phase 1: Enable Shopify Connection

| Task | Description |
|------|-------------|
| Resolve email mismatch | Either use matching Lovable account or create new dev store |
| Enable Shopify connector | This unlocks Shopify tools and SDK access |
| Configure store settings | Set store name, currency, shipping zones |

---

### Phase 2: Product Sync Strategy

Your current `products` table has 15+ columns including:
- `name`, `slug`, `description`, `image_url`
- `base_price`, `sale_price`, `pricing_tiers` (JSONB)
- `preset_sizes` (JSONB), `product_options` (JSONB)
- `material_options`, `finish_options`

**Sync Approach:**

| Direction | What Gets Synced |
|-----------|-----------------|
| Supabase to Shopify | Products, categories, images, pricing |
| Shopify to Supabase | Orders, inventory levels, fulfillment status |
| Bidirectional | Customer data, order status updates |

**Edge Function: Product Sync**

Create edge functions to:
1. `shopify-sync-products` - Push products from Supabase to Shopify
2. `shopify-webhook-orders` - Receive order webhooks from Shopify
3. `shopify-sync-inventory` - Sync inventory levels

---

### Phase 3: Checkout Flow Integration

**Current Flow:**
```text
Cart.jsx -> Checkout.jsx -> Stripe Payment -> Order Created
```

**Shopify-Integrated Flow:**
```text
Cart.jsx -> Shopify Checkout -> Shopify Payment -> Webhook -> Order Synced
```

**Option: Hybrid Approach (Recommended)**

Keep your custom product configurator (design tools, name badges) but use Shopify for:
- Standard product checkout
- Payment processing
- Fulfillment and shipping
- Customer accounts

| Cart Item Type | Checkout Path |
|---------------|---------------|
| Standard Products | Shopify Checkout |
| Custom Designs (banners, signs) | Your existing Stripe checkout |
| Name Badges (with names CSV) | Your existing Stripe checkout |

---

### Phase 4: Edge Functions to Create

| Function Name | Purpose |
|--------------|---------|
| `shopify-create-checkout` | Create Shopify checkout session from cart |
| `shopify-sync-products` | Sync products to Shopify catalog |
| `shopify-webhook-orders` | Handle order creation webhooks |
| `shopify-get-products` | Fetch Shopify products for display |
| `shopify-sync-inventory` | Real-time inventory sync |

---

### Phase 5: Frontend Components

**New Components to Create:**

| Component | Location | Purpose |
|-----------|----------|---------|
| `ShopifyProductCard` | `src/components/shopify/` | Display Shopify products |
| `ShopifyCheckoutButton` | `src/components/shopify/` | Redirect to Shopify checkout |
| `ShopifyOrderTracker` | `src/components/shopify/` | Display Shopify order status |

**Existing Components to Modify:**

| Component | Modification |
|-----------|-------------|
| `Cart.jsx` | Add Shopify checkout option |
| `Account.jsx` | Show Shopify orders alongside internal orders |
| `Admin.jsx` | Add Shopify orders/products management tab |

---

### Phase 6: Database Schema Updates

**New Tables (if needed):**

```sql
-- Track Shopify product mappings
CREATE TABLE shopify_product_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_product_id UUID REFERENCES products(id),
  shopify_product_id TEXT NOT NULL,
  shopify_variant_ids JSONB DEFAULT '[]',
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  sync_status TEXT DEFAULT 'pending'
);

-- Track Shopify orders
CREATE TABLE shopify_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_order_id TEXT UNIQUE NOT NULL,
  shopify_order_number TEXT,
  internal_order_id UUID REFERENCES orders(id),
  customer_email TEXT,
  total NUMERIC,
  fulfillment_status TEXT,
  financial_status TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  raw_data JSONB
);
```

---

### Phase 7: Admin Panel Enhancements

Add new sections to `Admin.jsx`:

| Section | Features |
|---------|----------|
| Shopify Products | View/sync products with Shopify |
| Shopify Orders | View orders from Shopify store |
| Inventory Sync | Real-time inventory management |
| Shopify Settings | Store configuration, webhooks |

---

### Implementation Order

| Step | Priority | Description |
|------|----------|-------------|
| 1 | High | Resolve email mismatch and enable Shopify |
| 2 | High | Create product sync edge functions |
| 3 | High | Add Shopify checkout button to Cart |
| 4 | Medium | Create order webhook handler |
| 5 | Medium | Add Shopify orders to Account page |
| 6 | Medium | Add Shopify admin section |
| 7 | Low | Implement inventory sync |
| 8 | Low | Add fulfillment tracking |

---

### Files to Create/Modify

**New Files:**

| File | Purpose |
|------|---------|
| `supabase/functions/shopify-create-checkout/index.ts` | Create Shopify checkout |
| `supabase/functions/shopify-sync-products/index.ts` | Sync products |
| `supabase/functions/shopify-webhook-orders/index.ts` | Handle order webhooks |
| `src/components/shopify/ShopifyCheckoutButton.jsx` | Checkout button component |
| `src/components/shopify/ShopifyProductCard.jsx` | Product display component |
| `src/lib/api/shopify.ts` | Shopify API client wrapper |
| `src/hooks/useShopifyProducts.js` | Hook for Shopify products |

**Existing Files to Modify:**

| File | Changes |
|------|---------|
| `src/pages/Cart.jsx` | Add Shopify checkout option |
| `src/pages/Account.jsx` | Display Shopify orders |
| `src/pages/Admin.jsx` | Add Shopify management tab |
| `src/pages/Home.jsx` | Optionally display Shopify products |

---

### Next Steps

To proceed with this integration, you need to:

1. **Resolve the email mismatch** - Either:
   - Log into Lovable with an account matching `services@namebadge.com`
   - Create a new Shopify development store through Lovable
   - Update your existing Shopify store's owner email

2. **Once connected**, I'll have access to Shopify-specific tools and can implement:
   - Product sync between your database and Shopify
   - Shopify checkout integration
   - Order webhook handling
   - Admin panel Shopify management

Would you like me to proceed with creating a new Shopify development store, or would you prefer to resolve the email mismatch with your existing store?

