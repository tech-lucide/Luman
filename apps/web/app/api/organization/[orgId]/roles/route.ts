import { createSupabaseServerClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("roles")
      .select("*")
      .eq("organization_id", orgId)
      .order("hierarchy_level", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const supabase = await createSupabaseServerClient();
    const { role_name, hierarchy_level } = await req.json();

    if (!role_name || hierarchy_level === undefined) {
      return NextResponse.json({ error: "Missing role_name or hierarchy_level" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("roles")
      .insert({
        organization_id: orgId,
        role_name,
        hierarchy_level,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const supabase = await createSupabaseServerClient();
    const body = await req.json();

    if (body.roles && Array.isArray(body.roles)) {
      // Reorder roles
      const promises = body.roles.map(async (r: { id: string; hierarchy_level: number }) => {
        return supabase
          .from("roles")
          .update({ hierarchy_level: r.hierarchy_level })
          .eq("id", r.id)
          .eq("organization_id", orgId);
      });

      const results = await Promise.all(promises);
      const firstError = results.find(res => res.error);
      if (firstError) {
        return NextResponse.json({ error: firstError.error?.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    } else {
      // Single role update
      const { roleId, role_name, hierarchy_level } = body;
      
      if (!roleId || !role_name || hierarchy_level === undefined) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const { data, error } = await supabase
        .from("roles")
        .update({ role_name, hierarchy_level })
        .eq("id", roleId)
        .eq("organization_id", orgId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data);
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
