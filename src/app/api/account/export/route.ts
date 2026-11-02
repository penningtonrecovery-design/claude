import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/server";

// Downloads everything the app stores about the signed-in user.
export async function GET() {
  const { supabase, user } = await getCurrentUser();
  if (!supabase || !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [{ data: profile }, { data: memories }, { data: plans }, { data: reflections }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("memories").select("*").order("created_at", { ascending: true }),
    supabase.from("growth_plans").select("*, plan_steps (*)").order("created_at", { ascending: true }),
    supabase.from("reflections").select("*").order("created_at", { ascending: true }),
  ]);

  const body = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email, created_at: user.created_at },
    profile,
    memories: memories ?? [],
    growth_plans: plans ?? [],
    reflections: reflections ?? [],
    note: "Text conversations are not stored by Fatherly Friend. Voice calls are handled by Retell AI; see the privacy page.",
  };

  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="fatherly-friend-data.json"',
      "Cache-Control": "no-store",
    },
  });
}
