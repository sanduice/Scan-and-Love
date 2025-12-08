import { base44 } from '@/api/base44Client';

// Get or create a session ID for anonymous users
export function getSessionId() {
  let sessionId = localStorage.getItem('netrave_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('netrave_session_id', sessionId);
  }
  return sessionId;
}

// Get current user or session ID for filtering
export async function getUserOrSession() {
  try {
    const isAuth = await base44.auth.isAuthenticated();
    if (isAuth) {
      const user = await base44.auth.me();
      return { type: 'user', email: user.email, user };
    }
  } catch (e) {
    // Not logged in
  }
  return { type: 'session', sessionId: getSessionId() };
}

// Build filter for current user/session
export async function buildOwnerFilter(additionalFilters = {}) {
  const owner = await getUserOrSession();
  if (owner.type === 'user') {
    return { ...additionalFilters, created_by: owner.email };
  }
  return { ...additionalFilters, session_id: owner.sessionId };
}

// Migrate session data to user account after login
export async function migrateSessionToUser(userEmail) {
  const sessionId = getSessionId();
  
  // Migrate NameBadgeDesigns
  const sessionDesigns = await base44.entities.NameBadgeDesign.filter({ session_id: sessionId });
  for (const design of sessionDesigns) {
    await base44.entities.NameBadgeDesign.update(design.id, { session_id: null });
  }
  
  // Migrate NameBadgeOrders
  const sessionOrders = await base44.entities.NameBadgeOrder.filter({ session_id: sessionId });
  for (const order of sessionOrders) {
    await base44.entities.NameBadgeOrder.update(order.id, { session_id: null });
  }
  
  // Migrate SavedDesigns
  const savedDesigns = await base44.entities.SavedDesign.filter({ session_id: sessionId });
  for (const design of savedDesigns) {
    await base44.entities.SavedDesign.update(design.id, { session_id: null });
  }
  
  return {
    designs: sessionDesigns.length,
    orders: sessionOrders.length,
    saved: savedDesigns.length,
  };
}