

## Fix: Checkout Navigation Not Working

### Problem
The "Proceed to Checkout" button navigates to `/checkout` (lowercase) but the route is defined as `/Checkout` (PascalCase). React Router v6 is case-sensitive by default.

### Root Cause
The `createPageUrl` utility function in `src/utils/index.ts` converts page names to lowercase:
```javascript
return '/' + pageName.toLowerCase().replace(/ /g, '-');
```

But all routes in `src/pages/index.jsx` use PascalCase (e.g., `/Products`, `/Cart`, `/Checkout`).

### Solution
Update `createPageUrl` to preserve the original casing instead of converting to lowercase.

### Files to Modify

| File | Change |
|------|--------|
| `src/utils/index.ts` | Remove `.toLowerCase()` from the return statement |

### Implementation

**File: `src/utils/index.ts`**

Change from:
```typescript
export function createPageUrl(pageName: string) {
    return '/' + pageName.toLowerCase().replace(/ /g, '-');
}
```

To:
```typescript
export function createPageUrl(pageName: string) {
    return '/' + pageName.replace(/ /g, '-');
}
```

### Why This Fix
- Routes are defined with PascalCase (`/Checkout`, `/Products`, `/Cart`)
- The `_getCurrentPage` function already handles case-insensitive matching for determining the current page
- By preserving casing in URLs, navigation will correctly match the route definitions
- This fix applies globally, ensuring all navigation using `createPageUrl` works correctly

### Result
Clicking "Proceed to Checkout" will navigate to `/Checkout` which will correctly match the route and render the checkout page.

