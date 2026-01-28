
## Full-Screen Checkout Page with Billing Address

### Overview
Transform the current checkout dialog into a dedicated full-screen checkout page with side-by-side shipping and billing address forms, including a "same as shipping" checkbox.

### Current State
- Checkout is a modal dialog (`Dialog`) in `Cart.jsx` (lines 893-1036)
- Only shipping address is collected
- Limited width (`max-w-lg`) constrains the layout

### Implementation Plan

#### 1. Create New Checkout Page
**File: `src/pages/Checkout.jsx`**

Create a new full-screen checkout page with:
- **Left Column**: Order summary (cart items, subtotal, shipping, tax, total)
- **Right Column**: Address forms and payment
  - Shipping Address form
  - Checkbox: "Billing address is the same as shipping"
  - Billing Address form (conditionally disabled/enabled)
  - Payment section (Stripe or bypass mode)

#### 2. Register the Checkout Route
**File: `src/pages/index.jsx`**

- Import the new `Checkout` component
- Add to `PAGES` object
- Add route: `<Route path="/Checkout" element={<Checkout />} />`

#### 3. Update Cart Page
**File: `src/pages/Cart.jsx`**

- Remove the checkout `Dialog` component (lines 893-1036)
- Change "Proceed to Checkout" button to navigate to `/Checkout` instead of opening dialog
- Pass cart data via URL params or rely on existing query hooks in Checkout

### Technical Details

#### Address State Structure
```javascript
const [shippingAddress, setShippingAddress] = useState({
  name: '', street: '', city: '', state: '', zip: '', phone: ''
});

const [billingAddress, setBillingAddress] = useState({
  name: '', street: '', city: '', state: '', zip: '', phone: ''
});

const [sameAsShipping, setSameAsShipping] = useState(true);
```

#### Checkbox Behavior
- When checked: Billing fields disabled, values synced from shipping
- When unchecked: Billing fields enabled for independent entry
- On form submit: If `sameAsShipping`, use shipping address for both

#### Page Layout (Desktop)
```text
+--------------------------------------------------+
|              CHECKOUT                            |
+--------------------------------------------------+
|  ORDER SUMMARY    |  SHIPPING      | BILLING     |
|  - Item 1         |  Name          | [x] Same    |
|  - Item 2         |  Street        | Name        |
|  -----------      |  City | State  | Street      |
|  Subtotal: $X     |  ZIP  | Phone  | City | State|
|  Shipping: $X     |                | ZIP  | Phone|
|  Tax: $X          +----------------+-------------+
|  TOTAL: $X        |  PAYMENT SECTION             |
+-------------------+------------------------------+
```

#### Mobile Layout
Stack vertically: Order Summary → Shipping → Billing Checkbox → Billing → Payment

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/pages/Checkout.jsx` | Create | New full-screen checkout page |
| `src/pages/index.jsx` | Modify | Add Checkout route and import |
| `src/pages/Cart.jsx` | Modify | Remove dialog, navigate to /Checkout |

### Data Flow
1. Cart items fetched via same `useQuery` hooks (session/user-based)
2. Shipping/billing addresses stored in component state
3. On successful payment: create Order with both addresses in `shipping_address` and `billing_address` JSONB columns (already exist in DB schema)
