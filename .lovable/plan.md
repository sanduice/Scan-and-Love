

## Add Product Thumbnails to Order History

### Goal
Display product thumbnails for each item in the Order History list on the Account page, so users can visually identify their past orders.

---

### Current State
- The Order History displays each order as a card showing:
  - Order number
  - Date
  - Status badge
  - Total price
  - View Details / Reorder buttons
- **No product thumbnails are shown**

### Data Available
Each order has an `items` JSONB array containing order line items with the following thumbnail-related fields:
- `thumbnail_url` - URL to the design/product thumbnail image
- `product_name` - Name of the product
- `item_type` - Either `'badge'` or `'design'`

---

### Implementation

#### Changes to `src/pages/Account.jsx`

**1. Import ImageWithFallback component**
Add import at the top of the file to use the existing fallback-capable image component.

**2. Create helper function to extract thumbnails from order items**
```javascript
const getOrderThumbnails = (order) => {
  const items = order.items || [];
  return items.slice(0, 4).map(item => ({
    thumbnail_url: item.thumbnail_url,
    product_name: item.product_name,
    item_type: item.item_type
  }));
};
```

**3. Update the order card layout to include thumbnails**

Before the order number/date header, add a horizontal strip of product thumbnails:

```text
+-------------------------------------------------------+
| [img] [img] [img] (+2 more)                           |
|                                                       |
| Order #ABC123                   Jan 28, 2026   [Paid] |
|-------------------------------------------------------|
| $125.00          [View Details]  [Reorder]            |
+-------------------------------------------------------+
```

**Layout details:**
- Show up to 4 thumbnails in a horizontal row
- Each thumbnail is a small square (48x48px or similar)
- If more than 4 items exist, show a "+N more" indicator
- Use `ImageWithFallback` component for graceful fallback when image is missing
- Badge items get a small "badge" label overlay
- Design items show the design thumbnail

---

### Code Changes Summary

| File | Change |
|------|--------|
| `src/pages/Account.jsx` | Add ImageWithFallback import |
| `src/pages/Account.jsx` | Add `getOrderThumbnails` helper function |
| `src/pages/Account.jsx` | Update order card JSX to include thumbnail row |

---

### Visual Design

Each order card will be updated:

**Current structure (lines 250-271):**
```jsx
<div key={order.id} className="border rounded-xl p-4 ...">
  <div className="flex items-center justify-between mb-3">
    {/* Order number, date, status */}
  </div>
  <div className="flex items-center justify-between mt-4 pt-4 border-t">
    {/* Total and buttons */}
  </div>
</div>
```

**New structure:**
```jsx
<div key={order.id} className="border rounded-xl p-4 ...">
  {/* NEW: Thumbnail row */}
  <div className="flex items-center gap-2 mb-3">
    {thumbnails.map((item, idx) => (
      <div key={idx} className="w-12 h-12 rounded border ...">
        <ImageWithFallback ... />
      </div>
    ))}
    {order.items?.length > 4 && (
      <span className="text-sm text-muted-foreground">
        +{order.items.length - 4} more
      </span>
    )}
  </div>
  
  {/* Existing: Order header */}
  <div className="flex items-center justify-between mb-3">
    {/* Order number, date, status */}
  </div>
  
  {/* Existing: Footer with total and buttons */}
  <div className="flex items-center justify-between mt-4 pt-4 border-t">
    {/* Total and buttons */}
  </div>
</div>
```

---

### Edge Cases Handled

1. **No items in order**: Thumbnail row is hidden or shows placeholder
2. **Missing thumbnail_url**: `ImageWithFallback` displays a graceful fallback icon
3. **Many items**: Only show first 4 thumbnails + "+N more" count
4. **Empty items array**: Safely handle with `items || []`

---

### Testing Checklist
- Go to Account > Orders with at least one order
- Verify thumbnails appear for orders with items containing `thumbnail_url`
- Verify fallback icon appears for items without thumbnails
- Verify "+N more" indicator shows for orders with more than 4 items
- Verify styling is consistent with the rest of the page

