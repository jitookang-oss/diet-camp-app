import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase-server";

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { phone, my_supplements } = body as { phone?: string; my_supplements?: string };
  if (!phone) return NextResponse.json({ error: "전화번호 필요" }, { status: 400 });

  const supabase = getSupabase();
  const { error } = await supabase
    .from("participants")
    .update({ my_supplements: my_supplements ?? "" })
    .eq("phone", phone);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
