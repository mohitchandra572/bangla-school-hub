import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateAccountRequest {
  entity_type: 'teacher' | 'student' | 'parent';
  entity_id: string;
  school_id: string;
  email: string;
  full_name: string;
  phone?: string;
  parent_email?: string; // For students - create/link parent account
  parent_name?: string;
  parent_phone?: string;
  send_email?: boolean;
}

function generateSecurePassword(length: number = 12): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }
  return password;
}

function generateUsername(email: string, entityType: string): string {
  const localPart = email.split('@')[0];
  const prefix = entityType === 'teacher' ? 'T' : entityType === 'student' ? 'S' : 'P';
  const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${localPart}${randomSuffix}`;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create admin client for user creation
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get auth header for caller verification
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the caller is an admin
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    
    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if caller is admin
    const { data: callerRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);

    const isAdmin = callerRoles?.some(r => 
      r.role === 'super_admin' || r.role === 'school_admin'
    );

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Only admins can create user accounts" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: CreateAccountRequest = await req.json();
    const { entity_type, entity_id, school_id, email, full_name, phone, parent_email, parent_name, parent_phone, send_email } = body;

    console.log("Creating account for:", { entity_type, entity_id, email, full_name });

    // Check subscription limits
    const { data: limitCheck, error: limitError } = await supabaseAdmin
      .rpc('check_school_limit', { _school_id: school_id, _entity_type: entity_type });

    if (limitError) {
      console.error("Limit check error:", limitError);
      return new Response(
        JSON.stringify({ error: "Failed to check subscription limits" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!limitCheck?.allowed) {
      return new Response(
        JSON.stringify({ 
          error: `সাবস্ক্রিপশন লিমিট অতিক্রম করেছে। বর্তমান: ${limitCheck?.current}/${limitCheck?.max}`,
          limit_reached: true,
          current: limitCheck?.current,
          max: limitCheck?.max
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate credentials
    const password = generateSecurePassword();
    const username = generateUsername(email, entity_type);

    // Create auth user
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        entity_type,
        school_id,
      },
    });

    if (createError) {
      console.error("Error creating user:", createError);
      // Check if user already exists
      if (createError.message.includes("already been registered")) {
        return new Response(
          JSON.stringify({ error: "এই ইমেইল ইতিমধ্যে নিবন্ধিত আছে" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newUserId = authData.user!.id;

    // Assign role based on entity type
    const roleMap: Record<string, string> = {
      teacher: 'teacher',
      student: 'student',
      parent: 'parent',
    };

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: newUserId,
        role: roleMap[entity_type],
      });

    if (roleError) {
      console.error("Error assigning role:", roleError);
    }

    // Link user to school
    const { error: schoolLinkError } = await supabaseAdmin
      .from("school_users")
      .insert({
        school_id,
        user_id: newUserId,
        is_admin: false,
      });

    if (schoolLinkError) {
      console.error("Error linking to school:", schoolLinkError);
    }

    // Update the entity record with user_id
    if (entity_type === 'teacher') {
      await supabaseAdmin
        .from("teachers")
        .update({ user_id: newUserId })
        .eq("id", entity_id);
    } else if (entity_type === 'student') {
      await supabaseAdmin
        .from("students")
        .update({ user_id: newUserId })
        .eq("id", entity_id);
    }

    // Store credentials for audit
    const { error: credError } = await supabaseAdmin
      .from("generated_credentials")
      .insert({
        user_id: newUserId,
        entity_type,
        entity_id,
        temporary_password: password, // In production, hash this
        sent_via: send_email ? 'email' : 'manual',
        sent_at: send_email ? new Date().toISOString() : null,
        created_by: caller.id,
      });

    if (credError) {
      console.error("Error storing credentials:", credError);
    }

    // Handle parent account for students
    let parentCredentials = null;
    if (entity_type === 'student' && parent_email) {
      // Check if parent already exists
      const { data: existingParent } = await supabaseAdmin
        .from("profiles")
        .select("user_id")
        .eq("email", parent_email)
        .single();

      if (existingParent) {
        // Link existing parent to student
        await supabaseAdmin
          .from("students")
          .update({ parent_id: existingParent.user_id })
          .eq("id", entity_id);
      } else if (parent_name) {
        // Create new parent account
        const parentPassword = generateSecurePassword();
        
        const { data: parentAuth, error: parentCreateError } = await supabaseAdmin.auth.admin.createUser({
          email: parent_email,
          password: parentPassword,
          email_confirm: true,
          user_metadata: {
            full_name: parent_name,
            entity_type: 'parent',
            school_id,
          },
        });

        if (!parentCreateError && parentAuth.user) {
          const parentUserId = parentAuth.user.id;

          // Assign parent role
          await supabaseAdmin
            .from("user_roles")
            .insert({
              user_id: parentUserId,
              role: 'parent',
            });

          // Link parent to school
          await supabaseAdmin
            .from("school_users")
            .insert({
              school_id,
              user_id: parentUserId,
              is_admin: false,
            });

          // Link parent to student
          await supabaseAdmin
            .from("students")
            .update({ parent_id: parentUserId })
            .eq("id", entity_id);

          // Store parent credentials
          await supabaseAdmin
            .from("generated_credentials")
            .insert({
              user_id: parentUserId,
              entity_type: 'parent',
              entity_id,
              temporary_password: parentPassword,
              sent_via: send_email ? 'email' : 'manual',
              sent_at: send_email ? new Date().toISOString() : null,
              created_by: caller.id,
            });

          parentCredentials = {
            email: parent_email,
            password: parentPassword,
            name: parent_name,
          };
        }
      }
    }

    console.log("Account created successfully for:", email);

    return new Response(
      JSON.stringify({
        success: true,
        credentials: {
          email,
          username,
          password,
          full_name,
        },
        parent_credentials: parentCredentials,
        user_id: newUserId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in create-user-account:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
