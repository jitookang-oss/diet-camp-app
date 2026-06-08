import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase-server";
import { getWeekDates } from "@/lib/missions";

function getKSTDateStr() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function getKSTCampWeek(today: string): number {
  const campStart = new Date("2026-06-01T00:00:00");
  const todayDate = new Date(today + "T00:00:00");
  const days = Math.floor((todayDate.getTime() - campStart.getTime()) / 86400000);
  if (days < 0) return 1;
  return Math.min(Math.max(Math.floor(days / 7) + 1, 1), 12);
}

const CHECKIN_TYPES = ["supplement", "lunch_walk", "evening_exercise", "mission"] as const;
type CheckinType = (typeof CHECKIN_TYPES)[number];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone") ?? "";
  if (!phone) return NextResponse.json({ error: "전화번호 필요" }, { status: 400 });

  const supabase = getSupabase();
  const today = getKSTDateStr();
  const campWeek = getKSTCampWeek(today);
  const weekDates = getWeekDates(campWeek);

  const [participantRes, todayRes, weekRes] = await Promise.all([
    supabase
      .from("participants")
      .select("name, my_supplements, body_type, weekly_records")
      .eq("phone", phone)
      .maybeSingle(),
    supabase
      .from("daily_checkins")
      .select("type")
      .eq("phone", phone)
      .eq("check_date", today),
    supabase
      .from("daily_checkins")
      .select("type")
      .eq("phone", phone)
      .in("check_date", weekDates),
  ]);

  if (!participantRes.data) {
    return NextResponse.json({ error: "참여자를 찾을 수 없어요" }, { status: 404 });
  }

  const todaySet = new Set((todayRes.data ?? []).map((c) => c.type));

  const weekStats: Record<CheckinType, number> = {
    supplement: 0,
    lunch_walk: 0,
    evening_exercise: 0,
    mission: 0,
  };
  for (const c of weekRes.data ?? []) {
    if (c.type in weekStats) weekStats[c.type as CheckinType]++;
  }

  const records = (participantRes.data.weekly_records ?? []) as Array<{ week: number }>;
  const weeklyRecordDone = campWeek <= 1 || records.some((r) => r.week === campWeek);

  return NextResponse.json({
    today: {
      supplement: todaySet.has("supplement"),
      lunch_walk: todaySet.has("lunch_walk"),
      evening_exercise: todaySet.has("evening_exercise"),
      mission: todaySet.has("mission"),
    },
    weekStats,
    participant: {
      name: participantRes.data.name,
      my_supplements: participantRes.data.my_supplements ?? null,
      body_type: participantRes.data.body_type ?? null,
      weeklyRecordDone,
    },
    todayDate: today,
    campWeek,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { phone, type } = body as { phone?: string; type?: string };

  if (!phone || !CHECKIN_TYPES.includes(type as CheckinType)) {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }

  const today = getKSTDateStr();
  const supabase = getSupabase();

  const { data: participant } = await supabase
    .from("participants")
    .select("name")
    .eq("phone", phone)
    .maybeSingle();
  if (!participant) {
    return NextResponse.json({ error: "참여자를 찾을 수 없어요" }, { status: 404 });
  }

  const { error } = await supabase.from("daily_checkins").insert({
    phone,
    name: participant.name,
    check_date: today,
    type,
  });

  if (error) {
    if (error.code === "23505") return NextResponse.json({ already: true, success: false });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { phone, type } = body as { phone?: string; type?: string };
  if (!phone || !type) {
    return NextResponse.json({ error: "필수 파라미터 누락" }, { status: 400 });
  }

  const today = getKSTDateStr();
  const supabase = getSupabase();

  const { error } = await supabase
    .from("daily_checkins")
    .delete()
    .eq("phone", phone)
    .eq("check_date", today)
    .eq("type", type);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
