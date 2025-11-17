import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    // ✅ CORREÇÃO: Obter o token JWT do header Authorization
    const authHeader = req.headers.get('Authorization');
    
    console.log('=== DEBUG INVITE USER ===');
    console.log('Authorization header:', authHeader ? 'Present' : 'Missing');
    console.log('All headers:', Object.fromEntries(req.headers.entries()));
    
    if (!authHeader) {
      console.error('Missing Authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'Não autenticado - Token ausente' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Create client with user's JWT to verify authentication
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { 
        headers: { 
          Authorization: authHeader 
        } 
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get the requesting user using their JWT
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('Authentication error:', userError?.message || 'No user found');
      return new Response(
        JSON.stringify({ success: false, error: 'Não autenticado - Token inválido' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.email);

    // Check if the user has admin role using service role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      console.error('Admin check failed:', roleError?.message || 'User is not admin');
      return new Response(
        JSON.stringify({ success: false, error: 'Acesso negado: apenas administradores podem convidar usuários' }), 
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the email from the request body
    const { email } = await req.json();

    if (!email) {
      throw new Error('Email é obrigatório');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email inválido' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the origin from the request headers
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || '';
    const redirectUrl = `${origin}/update-password`;

    console.log('Inviting user:', email, 'with redirect to:', redirectUrl);

    // Invite the user using admin client
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectUrl
    });

    if (error) {
      console.error('Invite error:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the activity
    await supabaseClient.from('activity_logs').insert({
      user_id: user.id,
      action: 'user_invited',
      details: { invited_email: email },
    });

    console.log('User invited successfully:', email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Convite enviado para ${email}`,
        data 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error('Error in invite-user function:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Falha ao enviar convite';
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
