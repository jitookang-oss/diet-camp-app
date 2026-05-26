import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/rest\/v1\/?$/, "");

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

  const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const rows = participants.map((p) => ({
    name: p.name.trim(),
    phone: p.phone.replace(/-/g, "").trim(),
  }));

  const invalid = rows.filter((r) => !r.name || !/^0\d{9,10}$/.test(r.phone));
  if (invalid.length > 0) {
    return NextResponse.json(
      { error: `유효하지 않은 항목: ${invalid.map((r) => r.name || "이름없음").join(", ")}` },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("participants")
    .upsert(rows, { onConflict: "phone", ignoreDuplicates: false })
    .select("name, phone");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ added: data?.length ?? 0, participants: data });
}
