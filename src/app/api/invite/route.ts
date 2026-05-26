import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/rest\/v1\/?$/, "");

export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "토큰이 없습니다." }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const { data, error } = await supabase
    .from("participants")
    .select("name, phone, invite_token, is_onboarded")
    .eq("invite_token", token)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "유효하지 않은 초대 링크입니다." }, { status: 404 });
  }

  return NextResponse.json({
    name: data.name,
    phone: data.phone,
    isOnboarded: data.is_onboarded,
  });
}
