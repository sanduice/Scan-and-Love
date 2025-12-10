import { supabase } from '@/lib/supabase';

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
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    return { type: 'user', userId: user.id, user };
  }
  return { type: 'session', sessionId: getSessionId() };
}

// Build filter for current user/session
export async function buildOwnerFilter() {
  const owner = await getUserOrSession();
  if (owner.type === 'user') {
    return { user_id: owner.userId };
  }
  return { session_id: owner.sessionId };
}

// Migrate session data to user account after login
export async function migrateSessionToUser(userId) {
  const sessionId = getSessionId();
  
  try {
    // Migrate cart items
    await supabase
      .from('cart_items')
      .update({ user_id: userId, session_id: null })
      .eq('session_id', sessionId);

    // Migrate saved designs
    await supabase
      .from('saved_designs')
      .update({ user_id: userId, session_id: null })
      .eq('session_id', sessionId);

    // Migrate name badge designs
    await supabase
      .from('name_badge_designs')
      .update({ user_id: userId, session_id: null })
      .eq('session_id', sessionId);

    // Migrate name badge orders
    await supabase
      .from('name_badge_orders')
      .update({ user_id: userId, session_id: null })
      .eq('session_id', sessionId);

    // Migrate sticker orders
    await supabase
      .from('sticker_orders')
      .update({ user_id: userId, session_id: null })
      .eq('session_id', sessionId);

    console.log('Session data migrated to user account');
    return { success: true };
  } catch (err) {
    console.error('Error migrating session data:', err);
    return { success: false, error: err };
  }
}
