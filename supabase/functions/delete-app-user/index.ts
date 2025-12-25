
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

serve(async (req) => {
  if (req.method !== 'POST') {
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

  const { data: adminProfile, error: adminProfileError } = await supabaseClient
    .from('profiles')
    .select('role')
    .eq('user_id', userData.user.id)
    .single();

  if (adminProfileError || adminProfile?.role !== 'admin') {
    return new Response(JSON.stringify({ message: 'Forbidden: Only administrators can delete users.' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 403,
    });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ message: 'Invalid input: userId is required.' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Verhindere, dass ein Admin sich selbst löscht
    if (userId === userData.user.id) {
        return new Response(JSON.stringify({ message: 'You cannot delete yourself.' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 403,
        });
    }

    // 1. Aus public.profiles löschen
    const { error: profileDeleteError } = await supabaseClient
      .from('profiles')
      .delete()
      .eq('user_id', userId);
    if (profileDeleteError) console.error('Error deleting profile:', profileDeleteError.message); // Loggen, aber nicht stoppen

    // 2. Prüfen, ob der Benutzer ein customer_profile hat und dieses löschen
    const { data: customerProfile, error: customerProfileFetchError } = await supabaseClient
      .from('customer_profiles')
      .select('id')
      .eq('auth_user_id', userId)
      .single();

    if (customerProfileFetchError && customerProfileFetchError.code !== 'PGRST116') { // PGRST116 bedeutet "no rows found"
      console.error('Error fetching customer profile:', customerProfileFetchError.message);
    } else if (customerProfile) {
      const { error: customerDeleteError } = await supabaseClient
        .from('customer_profiles')
        .delete()
        .eq('id', customerProfile.id);
      if (customerDeleteError) console.error('Error deleting customer profile:', customerDeleteError.message); // Loggen, aber nicht stoppen
    }

    // 3. Auth.user löschen
    const { error: authDeleteError } = await supabaseClient.auth.admin.deleteUser(userId);
    if (authDeleteError) throw authDeleteError;

    return new Response(JSON.stringify({ message: `Benutzer ${userId} und zugehörige Daten gelöscht.` }), {
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