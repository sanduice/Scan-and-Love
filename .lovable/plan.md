
## Goal
Fix the “blink to Checkout then back to an empty Cart page” behavior when clicking **Proceed to Checkout**. Users should reliably land on the Checkout page, and the Cart should never incorrectly show empty while the app is still figuring out who the “owner” is (logged-in user vs anonymous session).

---

## What’s actually happening (root cause)
Both **Cart** and **Checkout** depend on `ownerInfo`, which is fetched asynchronously:

- `ownerInfo` starts as `null`
- `getUserOrSession()` runs in a `useEffect` and resolves shortly after

But the React Query cart queries are configured with:
- `enabled: !!ownerInfo`

When `ownerInfo` is still `null`, those queries do **not** run, and importantly React Query sets `isLoading` to **false** when a query is disabled.

### Result
- On **Checkout.jsx**:
  - `ownerInfo` is `null`
  - queries are disabled → `isLoading === false`
  - `cartItems` is `[]`
  - the redirect effect runs:
    ```js
    if (!isLoading && cartItems.length === 0) navigate(createPageUrl('Cart'));
    ```
  - so it immediately redirects back to `/Cart` (this is the “blink”)

- On **Cart.jsx** after redirect:
  - same situation: queries disabled → `isLoading === false`
  - `cartItems` is `[]`
  - the component renders the **empty cart** screen (even though the cart may actually have items)

So this is not primarily a database problem anymore—it’s a **frontend loading-state problem** caused by treating “queries disabled” as “finished loading”.

---

## Fix strategy (high level)
1. Introduce an explicit “owner is still loading” state:
   - `const isOwnerLoading = ownerInfo === null`
2. Treat the page as loading while `ownerInfo` is not ready:
   - `const isLoading = isOwnerLoading || loadingSavedDesigns || loadingBadgeOrders`
3. Only show “empty cart” UI and only redirect **after** owner info is resolved and queries have actually run.

This prevents:
- Checkout from redirecting before it even knows who to query for
- Cart from showing “empty” while owner resolution is still pending

---

## Implementation steps (code changes)

### 1) Update `src/pages/Checkout.jsx`
**A. Fix loading computation**
- Add:
  - `const isOwnerLoading = !ownerInfo;`
- Change:
  - `const isLoading = loadingSavedDesigns || loadingBadgeOrders;`
- To:
  - `const isLoading = isOwnerLoading || loadingSavedDesigns || loadingBadgeOrders;`

**B. Guard the “empty cart redirect” effect**
Current:
```js
useEffect(() => {
  if (!isLoading && cartItems.length === 0) {
    navigate(createPageUrl('Cart'));
  }
}, [isLoading, cartItems.length, navigate]);
```

Update to:
- Don’t redirect until `ownerInfo` is known (and thus queries are allowed to run)
- Also include `ownerInfo` in dependencies

Example logic:
```js
useEffect(() => {
  if (!ownerInfo) return;              // wait for user/session resolution
  if (isLoading) return;               // wait for data
  if (cartItems.length === 0) navigate(createPageUrl('Cart'));
}, [ownerInfo, isLoading, cartItems.length, navigate]);
```

**C. Ensure the “cart is empty” page doesn’t show during owner resolution**
This is automatically solved if you use the new `isLoading` definition before the `cartItems.length === 0` conditional renders.

---

### 2) Update `src/pages/Cart.jsx`
Cart has the same issue: when `ownerInfo` is null, queries are disabled and `isLoading` becomes false → shows empty cart prematurely.

**A. Fix loading computation**
- Add:
  - `const isOwnerLoading = !ownerInfo;`
- Change:
  - `const isLoading = loadingSavedDesigns || loadingBadgeOrders;`
- To:
  - `const isLoading = isOwnerLoading || loadingSavedDesigns || loadingBadgeOrders;`

**B. Ensure empty-cart UI only appears when owner is resolved**
This is automatically solved if the `isLoading` check happens before the empty check (it already does), once `isLoading` includes `isOwnerLoading`.

---

### 3) Optional but recommended: add a small debug log while stabilizing
To confirm we fixed the real cause quickly, add temporary `console.log` (and remove once verified):
- In Cart and Checkout, log:
  - `ownerInfo`, `isLoading`, `savedDesigns.length`, `badgeOrders.length`, `cartItems.length`

This will immediately show whether the “empty” state was due to ownerInfo not being ready.

---

## Acceptance criteria (how we’ll confirm it’s fixed)
1. Go to `/Cart` with at least 1 saved_design in cart.
2. Click **Proceed to Checkout**.
3. Expected:
   - It navigates to `/Checkout` and stays there (no blink back).
   - Order summary shows the cart item(s).
4. Refresh directly on `/Checkout` (hard refresh).
   - It should still load cart items correctly (no redirect loop).

---

## Notes / related follow-ups (not required for this fix)
- `Checkout.jsx` uses `ownerInfo?.email` but `getUserOrSession()` returns `{ user }` not `{ email }`. If you want email, use `ownerInfo.user.email` or map it when setting ownerInfo. This does not cause the redirect bug, but may affect tax/payment metadata.
- `Cart.jsx` tries to `delete` name badge orders, but your database currently blocks DELETE for `name_badge_orders`. That’s a separate UX issue (remove will fail for badge items) and can be addressed after checkout navigation is stable.

---

## Files to change
- `src/pages/Checkout.jsx`
- `src/pages/Cart.jsx`

---

## Testing checklist (end-to-end)
- Add item → Cart shows it
- Cart → Proceed to Checkout → Checkout loads items (no blink)
- Refresh Checkout page → still loads items
- If cart truly empty → Checkout redirects back to Cart (still desired behavior)