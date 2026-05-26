import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/rest\/v1\/?$/, "");

function getSupabase() {
  return createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

// 참여자 등록 (단건 / 일괄)
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { password, participants } = body as {
    password: string;
    participants: Array<{ name: string; phone: string }>;
  };

  if (password !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
    return NextResponse.json({ error: "인증 실패" }, { status: 401 });
  }

  if (!Array.isArray(participants) || participants.length === 0) {
    return NextResponse.json({ error: "참여자 데이터가 없습니다." }, { status: 400 });
  }

  const rows = participants.map((p) => ({
    name: p.name.trim(),
    phone: p.phone.replace(/-/g, "").trim(),
    invite_token: randomUUID(),
    is_onboarded: false,
  }));

  const invalid = rows.filter((r) => !r.name || !/^0\d{9,10}$/.test(r.phone));
  if (invalid.length > 0) {
    return NextResponse.json(
      { error: `유효하지 않은 항목: ${invalid.map((r) => r.name || "이름없음").join(", ")}` },
      { status: 400 }
    );
  }

  // 이미 등록된 참여자는 invite_token 유지 (ignoreDuplicates: false이지만 token은 덮어쓰지 않음)
  // 기존 토큰 보존을 위해 phone이 이미 있는 경우 name만 업데이트
  const supabase = getSupabase();

  const results = [];
  for (const row of rows) {
    // 기존 참여자 확인
    const { data: existing } = await supabase
      .from("participants")
      .select("phone, invite_token")
      .eq("phone", row.phone)
      .single();

    if (existing) {
      // 이미 있으면 이름만 업데이트, 토큰 유지
      const { data, error } = await supabase
        .from("participants")
        .update({ name: row.name })
        .eq("phone", row.phone)
        .select("name, phone, invite_token, is_onboarded")
        .single();
      if (!error && data) results.push(data);
    } else {
      // 신규 등록
      const { data, error } = await supabase
        .from("participants")
        .insert(row)
        .select("name, phone, invite_token, is_onboarded")
        .single();
      if (!error && data) results.push(data);
    }
  }

  return NextResponse.json({ added: results.length, participants: results });
}

// 참여자 삭제
export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { password, phone } = body as { password: string; phone: string };

  if (password !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
    return NextResponse.json({ error: "인증 실패" }, { status: 401 });
  }

  if (!phone) {
    return NextResponse.json({ error: "전화번호가 필요합니다." }, { status: 400 });
  }

  const supabase = getSupabase();

  // daily_checkins 먼저 삭제
  await supabase.from("daily_checkins").delete().eq("phone", phone);

  // participants 삭제
  const { error } = await supabase.from("participants").delete().eq("phone", phone);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
