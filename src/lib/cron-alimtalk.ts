import { NextResponse } from "next/server";
import { sendAlimtalk, generateCheckinToken } from "./alimtalk";
import { supabase } from "./supabase";

interface CronParams {
  request: Request;
  templateEnvKey: string;
  checkinType: string;
  buttonName: string;
}

export async function handleCronAlimtalk({ request, templateEnvKey, checkinType, buttonName }: CronParams) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const templateId = process.env[templateEnvKey];
  if (!templateId || templateId === "PENDING") {
    return NextResponse.json({ error: "알림톡 템플릿 미설정" }, { status: 503 });
  }

  // KST(UTC+9) 기준 날짜 사용 — Vercel은 UTC이므로 오프셋 보정 필요
  const now = new Date();
  const kstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const today = kstDate.toISOString().slice(0, 10);
  if (today < "2026-06-08") {
    return NextResponse.json({ skipped: true, reason: "알림톡 발송 시작일 전입니다 (6/8부터)" });
  }

  const { data: participants, error } = await supabase
    .from("participants")
    .select("name, phone")
    .not("phone", "is", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // KST 날짜 기준으로 주차 계산 (getCampDayInfo는 서버 UTC 기준이라 아침 알림톡 시 1주차 오류 발생)
  const campStart = new Date("2026-06-01");
  const daysFromStart = Math.floor((new Date(today).getTime() - campStart.getTime()) / (1000 * 60 * 60 * 24));
  const campWeek = Math.min(Math.max(Math.floor(daysFromStart / 7) + 1, 1), 12);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://diet-camp-app.vercel.app";

  const results = [];
  for (const p of participants ?? []) {
    if (!p.phone) continue;
    const token = generateCheckinToken(p.phone, today, checkinType);
    const url = `${baseUrl}/c/${encodeURIComponent(p.phone)}/${checkinType}/${today}/${token}`;
    try {
      await sendAlimtalk({
        to: p.phone,
        templateId,
        variables: { "#{이름}": p.name, "#{주차}": String(campWeek || 1) },
        buttonName,
        buttonUrl: url,
      });
      results.push({ phone: p.phone, success: true });
    } catch (err) {
      results.push({ phone: p.phone, success: false, error: String(err) });
    }
  }

  return NextResponse.json({ sent: results.length, results });
}
