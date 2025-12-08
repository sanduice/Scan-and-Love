import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "6925dee8096812ba2e0c0beb", 
  requiresAuth: true // Ensure authentication is required for all operations
});
