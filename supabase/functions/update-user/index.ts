
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
    return new Response(JSON.stringify({ message: 'Forbidden: Only administrators can update users.' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 403,
    });
  }

  try {
    const { userId, updates } = await req.json(); // updates: { email?, role?, firstName?, lastName?, associatedCustomerId? }

    if (!userId || !updates) {
      return new Response(JSON.stringify({ message: 'Invalid input: userId and updates are required.' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Überprüfen der Rolle des zu aktualisierenden Benutzers
    const { data: targetUserProfile, error: targetProfileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (targetProfileError) throw targetProfileError;

    // Verhindere, dass ein Nicht-Admin die Rolle eines Admins ändert oder einen Admin löscht
    if (targetUserProfile?.role === 'admin' && adminProfile?.role !== 'admin') {
        return new Response(JSON.stringify({ message: 'Forbidden: Only other administrators can modify an administrator\'s profile.' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 403,
        });
    }


    // 1. Auth.user E-Mail aktualisieren, falls bereitgestellt
    if (updates.email) {
      const { error: authUpdateError } = await supabaseClient.auth.admin.updateUserById(userId, { email: updates.email });
      if (authUpdateError) throw authUpdateError;
    }

    // 2. public.profiles Rolle aktualisieren, falls bereitgestellt
    if (updates.role) {
      const { error: profileUpdateError } = await supabaseClient
        .from('profiles')
        .update({ role: updates.role })
        .eq('user_id', userId);
      if (profileUpdateError) throw profileUpdateError;
    }

    // 3. customer_profiles first_name, last_name aktualisieren, falls Benutzer ein Kunde ist und customerId bekannt ist
    if (updates.role === 'customer' && updates.associatedCustomerId && (updates.firstName !== undefined || updates.lastName !== undefined)) {
      const customerProfileUpdates: { first_name?: string | null; last_name?: string | null } = {};
      if (updates.firstName !== undefined) customerProfileUpdates.first_name = updates.firstName;
      if (updates.lastName !== undefined) customerProfileUpdates.last_name = updates.lastName;

      if (Object.keys(customerProfileUpdates).length > 0) {
        const { error: customerProfileUpdateError } = await supabaseClient
          .from('customer_profiles')
          .update(customerProfileUpdates)
          .eq('id', updates.associatedCustomerId);
        if (customerProfileUpdateError) throw customerProfileUpdateError;
      }
    }

    return new Response(JSON.stringify({ message: `Benutzer ${userId} aktualisiert.` }), {
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