import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateTaskRequest {
  application_id: string;
  task_type: "call" | "email" | "review";
  due_at: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASEURL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASESERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase configuration" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body: CreateTaskRequest = await req.json();

    // Validate task_type
    const validTaskTypes = ["call", "email", "review"];
    if (!body.task_type || !validTaskTypes.includes(body.task_type)) {
      return new Response(
        JSON.stringify({
          error: "Invalid task_type. Must be one of: call, email, review",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate application_id
    if (!body.application_id) {
      return new Response(
        JSON.stringify({ error: "application_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate due_at is a valid future timestamp
    if (!body.due_at) {
      return new Response(
        JSON.stringify({ error: "due_at is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const dueAtDate = new Date(body.due_at);
    const now = new Date();

    if (isNaN(dueAtDate.getTime())) {
      return new Response(
        JSON.stringify({ error: "Invalid due_at timestamp format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (dueAtDate <= now) {
      return new Response(
        JSON.stringify({ error: "due_at must be a future timestamp" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get tenant_id from the application
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("tenant_id")
      .eq("id", body.application_id)
      .single();

    if (appError || !application) {
      return new Response(
        JSON.stringify({ error: "Application not found" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Insert task
    const { data: task, error: insertError } = await supabase
      .from("tasks")
      .insert({
        application_id: body.application_id,
        tenant_id: application.tenant_id,
        type: body.task_type,
        due_at: body.due_at,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Error inserting task:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create task", details: insertError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Emit Realtime broadcast event
    try {
      const channel = supabase.realtime.channel("tasks");
      await channel.subscribe();
      const { error: broadcastError } = await channel.send({
        type: "broadcast",
        event: "task.created",
        payload: {
          task_id: task.id,
          application_id: body.application_id,
          task_type: body.task_type,
          due_at: body.due_at,
        },
      });
      
      if (broadcastError) {
        console.error("Error broadcasting event:", broadcastError);
        // Don't fail the request if broadcast fails, just log it
      }
      
      // Unsubscribe from channel
      await supabase.realtime.removeChannel(channel);
    } catch (broadcastErr) {
      console.error("Error setting up broadcast:", broadcastErr);
      // Don't fail the request if broadcast fails, just log it
    }

    return new Response(
      JSON.stringify({
        success: true,
        task_id: task.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

