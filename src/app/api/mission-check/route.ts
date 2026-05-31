import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase-server";

function getKSTDateStr() {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone") ?? "";
  const date = searchParams.get("date") ?? getKSTDateStr();

  if (!phone) return NextResponse.json({ checked: false });

  const supabase = getSupabase();
  const { data } = await supabase
    .from("daily_checkins")
    .select("id")
    .eq("phone", phone)
    .eq("check_date", date)
    .eq("type", "mission")
    .maybeSingle();

  return NextResponse.json({ checked: !!data });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { phone, date } = body as { phone?: string; date?: string };

  if (!phone) return NextResponse.json({ error: "전화번호가 없어요" }, { status: 400 });

  const today = date ?? getKSTDateStr();
  const supabase = getSupabase();

  const { data: participant } = await supabase
    .from("participants")
    .select("name")
    .eq("phone", phone)
    .maybeSingle();

  if (!participant) return NextResponse.json({ error: "참여자를 찾을 수 없어요" }, { status: 404 });

  const { error } = await supabase.from("daily_checkins").insert({
    phone,
    name: participant.name,
    check_date: today,
    type: "mission",
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ already: true, success: false, name: participant.name });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, name: participant.name });
}
