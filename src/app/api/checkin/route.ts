import { NextRequest, NextResponse } from "next/server";
import { verifyCheckinToken } from "@/lib/alimtalk";
import { getSupabase } from "@/lib/supabase-server";

const TYPE_LABELS: Record<string, string> = {
  supplement: "영양제",
  lunch_walk: "점심 걷기",
  evening_exercise: "저녁 운동",
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "";
  const date = searchParams.get("date") ?? "";
  const phone = searchParams.get("phone") ?? "";
  const token = searchParams.get("token") ?? "";

  if (!type || !date || !phone || !token || !TYPE_LABELS[type]) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (!verifyCheckinToken(phone, date, type, token)) {
    return NextResponse.json({ error: "유효하지 않은 링크입니다." }, { status: 403 });
  }

  const supabase = getSupabase();

  const { data: participant } = await supabase
    .from("participants")
    .select("name")
    .eq("phone", phone)
    .single();

  const { error } = await supabase.from("daily_checkins").insert({
    phone,
    name: participant?.name ?? "",
    check_date: date,
    type,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ already: true, success: false, name: participant?.name, label: TYPE_LABELS[type] });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, name: participant?.name, label: TYPE_LABELS[type] });
}
