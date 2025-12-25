import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SetupAdminRequest {
  user_id: string;
  role: 'super_admin' | 'school_admin';
  school_name?: string;
  school_code?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const body: SetupAdminRequest = await req.json();
    const { user_id, role, school_name, school_code } = body;

    console.log("Setting up admin:", { user_id, role, school_name });

    // Check if user exists
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(user_id);
    
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if role already assigned
    const { data: existingRole } = await supabaseAdmin
      .from("user_roles")
      .select("*")
      .eq("user_id", user_id)
      .eq("role", role)
      .single();

    if (!existingRole) {
      // Assign the role
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({
          user_id,
          role,
        });

      if (roleError) {
        console.error("Error assigning role:", roleError);
        return new Response(
          JSON.stringify({ error: roleError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    let school_id = null;

    // If school_admin, create school and link
    if (role === 'school_admin' && school_name && school_code) {
      // Create school
      const { data: schoolData, error: schoolError } = await supabaseAdmin
        .from("schools")
        .insert({
          name: school_name,
          code: school_code,
          created_by: user_id,
        })
        .select()
        .single();

      if (schoolError) {
        console.error("Error creating school:", schoolError);
        return new Response(
          JSON.stringify({ error: schoolError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      school_id = schoolData.id;

      // Link user to school as admin
      const { error: linkError } = await supabaseAdmin
        .from("school_users")
        .insert({
          school_id,
          user_id,
          is_admin: true,
        });

      if (linkError) {
        console.error("Error linking user to school:", linkError);
      }
    }

    console.log("Admin setup complete:", { user_id, role, school_id });

    return new Response(
      JSON.stringify({
        success: true,
        user_id,
        role,
        school_id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in setup-admin:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
