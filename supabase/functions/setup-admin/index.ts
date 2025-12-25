import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SetupAdminRequest {
  email: string;
  password: string;
  full_name: string;
  role: 'super_admin' | 'school_admin';
  school_name?: string;
  school_code?: string;
  school_id?: string; // If school already exists
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
    const { email, password, full_name, role, school_name, school_code, school_id } = body;

    console.log("Setting up admin:", { email, role, school_name, school_id });

    // Create user in auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    });

    if (authError) {
      console.error("Error creating user:", authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user_id = authData.user.id;
    console.log("User created:", user_id);

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        user_id,
        full_name,
        email,
      });

    if (profileError) {
      console.error("Error creating profile:", profileError);
    }

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

    let result_school_id = school_id || null;

    // If school_admin, create school (if needed) and link
    if (role === 'school_admin') {
      // If school_id provided, use it. Otherwise create new school
      if (!result_school_id && school_name && school_code) {
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
          // If school already exists with this code, try to find it
          if (schoolError.code === '23505') { // Unique violation
            const { data: existingSchool } = await supabaseAdmin
              .from("schools")
              .select("id")
              .eq("code", school_code)
              .single();
            
            if (existingSchool) {
              result_school_id = existingSchool.id;
            }
          } else {
            return new Response(
              JSON.stringify({ error: schoolError.message }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        } else {
          result_school_id = schoolData.id;
        }
      }

      // Link user to school as admin
      if (result_school_id) {
        const { error: linkError } = await supabaseAdmin
          .from("school_users")
          .insert({
            school_id: result_school_id,
            user_id,
            is_admin: true,
          });

        if (linkError) {
          console.error("Error linking user to school:", linkError);
        }
      }
    }

    console.log("Admin setup complete:", { user_id, role, school_id: result_school_id });

    return new Response(
      JSON.stringify({
        success: true,
        user_id,
        email,
        role,
        school_id: result_school_id,
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
