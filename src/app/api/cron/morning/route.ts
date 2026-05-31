import { NextResponse } from "next/server";
import { sendAlimtalk, generateCheckinToken } from "@/lib/alimtalk";
import { getCampDayInfo } from "@/lib/missions";
import { getSupabase } from "@/lib/supabase-server";

export async function GET(request: Request) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const templateId = process.env.SOLAPI_TEMPLATE_MORNING;
  if (!templateId || templateId === "PENDING") {
    return NextResponse.json({ error: "알림톡 템플릿 미설정" }, { status: 503 });
  }

  const today = new Date().toISOString().slice(0, 10);
  if (today < "2026-06-08") {
    return NextResponse.json({ skipped: true, reason: "알림톡 발송 시작일 전입니다 (6/8부터)" });
  }

  const supabase = getSupabase();
  const { data: participants, error } = await supabase
    .from("participants")
    .select("name, phone")
    .not("phone", "is", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { campWeek } = getCampDayInfo();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://diet-camp-app.vercel.app";

  const results = [];
  for (const p of participants ?? []) {
    if (!p.phone) continue;
    const token = generateCheckinToken(p.phone, today, "supplement");
    const url = `${baseUrl}/checkin?type=supplement&date=${today}&phone=${encodeURIComponent(p.phone)}&token=${token}`;
    try {
      await sendAlimtalk({
        to: p.phone,
        templateId,
        variables: { "#{이름}": p.name, "#{주차}": String(campWeek || 1) },
        buttonName: "✅ 영양제 챙겼어요",
        buttonUrl: url,
      });
      results.push({ phone: p.phone, success: true });
    } catch (err) {
      results.push({ phone: p.phone, success: false, error: String(err) });
    }
  }

  return NextResponse.json({ sent: results.length, results });
}
