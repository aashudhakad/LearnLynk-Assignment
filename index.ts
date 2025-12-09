import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { application_id, task_type, due_at } = await req.json()

    const validTypes = ['call', 'email', 'review']
    
    if (!validTypes.includes(task_type)) {
      return new Response(
        JSON.stringify({ error: "task_type must be one of: call, email, review" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (new Date(due_at) <= new Date()) {
      return new Response(
        JSON.stringify({ error: "due_at must be in the future" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { data: appData, error: appError } = await supabase
      .from('applications')
      .select('tenant_id')
      .eq('id', application_id)
      .single()

    if (appError || !appData) {
      return new Response(
        JSON.stringify({ error: "Application not found" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { data: taskData, error: insertError } = await supabase
      .from('tasks')
      .insert({
        tenant_id: appData.tenant_id,
        related_id: application_id,
        type: task_type,
        due_at: due_at
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    await supabase.channel('system-updates').send({
      type: 'broadcast',
      event: 'task.created',
      payload: { 
        task: taskData 
      }
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        task_id: taskData.id 
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal Server Error' }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }
})