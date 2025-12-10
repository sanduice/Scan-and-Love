import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the requesting user's JWT to verify they're an admin
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create client with user's JWT to check their role
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get current user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      console.error('User auth error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if requesting user is admin using the database function
    const { data: isAdmin, error: adminCheckError } = await supabaseAdmin.rpc('is_admin');
    
    // Alternative: directly check user_roles table
    const { data: adminRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!adminRole) {
      console.error('User is not admin:', user.id);
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const method = req.method;

    // GET - List all admins
    if (method === 'GET') {
      console.log('Fetching admin list...');
      
      // Get all admin roles
      const { data: adminRoles, error: rolesError } = await supabaseAdmin
        .from('user_roles')
        .select('user_id, role, created_at')
        .eq('role', 'admin');

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        throw rolesError;
      }

      // Get user emails from auth.users
      const userIds = adminRoles?.map(r => r.user_id) || [];
      const adminsWithEmails = [];

      for (const role of adminRoles || []) {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(role.user_id);
        adminsWithEmails.push({
          user_id: role.user_id,
          role: role.role,
          created_at: role.created_at,
          email: userData?.user?.email || 'Unknown',
        });
      }

      console.log('Found admins:', adminsWithEmails.length);
      return new Response(JSON.stringify({ admins: adminsWithEmails }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST - Add admin role
    if (method === 'POST') {
      const { email } = await req.json();
      
      if (!email) {
        return new Response(JSON.stringify({ error: 'Email is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Adding admin role for:', email);

      // Find user by email using admin API
      const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) {
        console.error('Error listing users:', listError);
        throw listError;
      }

      const targetUser = usersData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (!targetUser) {
        return new Response(JSON.stringify({ error: 'User not found. They must sign up first.' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if already admin
      const { data: existingRole } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('user_id', targetUser.id)
        .eq('role', 'admin')
        .single();

      if (existingRole) {
        return new Response(JSON.stringify({ error: 'User is already an admin' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Add admin role
      const { error: insertError } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: targetUser.id, role: 'admin' });

      if (insertError) {
        console.error('Error inserting role:', insertError);
        throw insertError;
      }

      console.log('Admin role added for:', email);
      return new Response(JSON.stringify({ success: true, email }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE - Remove admin role
    if (method === 'DELETE') {
      const { user_id: targetUserId } = await req.json();
      
      if (!targetUserId) {
        return new Response(JSON.stringify({ error: 'user_id is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Prevent self-removal
      if (targetUserId === user.id) {
        return new Response(JSON.stringify({ error: 'Cannot remove your own admin role' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Removing admin role for user:', targetUserId);

      const { error: deleteError } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', targetUserId)
        .eq('role', 'admin');

      if (deleteError) {
        console.error('Error deleting role:', deleteError);
        throw deleteError;
      }

      console.log('Admin role removed');
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Edge function error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
