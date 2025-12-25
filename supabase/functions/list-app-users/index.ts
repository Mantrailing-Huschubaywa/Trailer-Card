
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

serve(async (req) => {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ message: 'Method Not Allowed' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 405,
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  const supabaseClient = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  // Authentifizierung des Aufrufers (muss ein Admin sein)
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ message: 'Authorization header missing' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 401,
    });
  }

  const token = authHeader.split(' ')[1];
  const { data: userData, error: authError } = await supabaseClient.auth.getUser(token);
  if (authError || !userData.user) {
    return new Response(JSON.stringify({ message: 'Invalid or expired token', error: authError?.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 401,
    });
  }

  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('role')
    .eq('user_id', userData.user.id)
    .single();

  if (profileError || profile?.role !== 'admin') {
    return new Response(JSON.stringify({ message: 'Forbidden: Only administrators can list users.' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 403,
    });
  }

  try {
    // Fetch all auth.users
    const { data: { users }, error: authUsersError } = await supabaseClient.auth.admin.listUsers();
    if (authUsersError) throw authUsersError;

    // Fetch all public.profiles
    const { data: dbProfiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('user_id, role');
    if (profilesError) throw profilesError;

    // Fetch relevant customer_profiles (for first/last name, if available)
    const { data: dbCustomerProfiles, error: customerProfilesError } = await supabaseClient
      .from('customer_profiles')
      .select('id, auth_user_id, first_name, last_name');
    if (customerProfilesError) throw customerProfilesError;

    const allAppUsers = users.map(user => {
      const profileEntry = dbProfiles?.find(p => p.user_id === user.id);
      const customerProfile = dbCustomerProfiles?.find(cp => cp.auth_user_id === user.id);

      return {
        id: user.id,
        email: user.email,
        role: profileEntry?.role || 'customer', // Default to customer if no profile entry
        created_at: user.created_at,
        customer_profile: customerProfile ? {
          id: customerProfile.id,
          first_name: customerProfile.first_name,
          last_name: customerProfile.last_name,
        } : null,
      };
    });

    return new Response(JSON.stringify(allAppUsers), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ message: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});