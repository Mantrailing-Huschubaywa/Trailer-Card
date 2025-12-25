
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

  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('role')
    .eq('user_id', userData.user.id)
    .single();

  if (profileError || profile?.role !== 'admin') {
    return new Response(JSON.stringify({ message: 'Forbidden: Only administrators can invite users.' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 403,
    });
  }

  try {
    const { email, role } = await req.json();

    if (!email || !['admin', 'staff'].includes(role)) {
      return new Response(JSON.stringify({ message: 'Invalid input: email and role (admin or staff) are required.' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Invite user via email
    const { data: inviteData, error: inviteError } = await supabaseClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${supabaseUrl}/auth/v1/callback`, // Supabase default callback, adjust if you have a specific reset page
    });

    if (inviteError) throw inviteError;

    const newUserId = inviteData.user?.id;
    if (!newUserId) throw new Error('User ID not returned after invitation.');

    // Update role in public.profiles table
    const { error: profileInsertError } = await supabaseClient
      .from('profiles')
      .insert({ user_id: newUserId, role: role })
      .select()
      .single();

    if (profileInsertError) throw profileInsertError;

    return new Response(JSON.stringify({
      message: `Benutzer ${email} als ${role} eingeladen.`,
      userEmail: email,
      resetPasswordUrl: inviteData.user?.action_link, // The magic link/reset link
    }), {
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