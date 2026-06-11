import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase-server";

function getKSTDateStr() {
  const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  if (kstNow.getUTCHours() < 2) {
    return new Date(kstNow.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  }
  return kstNow.toISOString().slice(0, 10);
}

// POST: 사진 업로드
export async function POST(request: NextRequest) {
  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });

  const phone = formData.get("phone") as string;
  const file = formData.get("file") as File | null;

  if (!phone || !file) {
    return NextResponse.json({ error: "필수 파라미터 누락" }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "파일 크기가 너무 커요 (5MB 이하)" }, { status: 400 });
  }

  const supabase = getSupabase();
  const today = getKSTDateStr();
  const storagePath = `${today}/${phone.replace(/\D/g, "")}-${Date.now()}.jpg`;

  // 기존 사진이 있으면 스토리지에서 삭제
  const { data: existing } = await supabase
    .from("food_photos")
    .select("photo_url")
    .eq("phone", phone)
    .eq("photo_date", today)
    .maybeSingle();

  if (existing?.photo_url) {
    const oldPath = existing.photo_url.split("/food-photos/")[1];
    if (oldPath) await supabase.storage.from("food-photos").remove([oldPath]);
  }

  // 스토리지 업로드
  const buffer = Buffer.from(await file.arrayBuffer());
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("food-photos")
    .upload(storagePath, buffer, { contentType: "image/jpeg", upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: `업로드 실패: ${uploadError.message}` }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from("food-photos").getPublicUrl(uploadData.path);
  const photoUrl = urlData.publicUrl;

  // DB 저장 (upsert)
  const { error: dbError } = await supabase
    .from("food_photos")
    .upsert({ phone, photo_date: today, photo_url: photoUrl }, { onConflict: "phone,photo_date" });

  if (dbError) {
    return NextResponse.json({ error: `DB 저장 실패: ${dbError.message}` }, { status: 500 });
  }

  return NextResponse.json({ success: true, photo_url: photoUrl });
}

// GET: 사진 조회
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");
  const date = searchParams.get("date");

  const supabase = getSupabase();

  // 단일 조회 (체크인 페이지)
  if (phone && date) {
    const { data } = await supabase
      .from("food_photos")
      .select("photo_url")
      .eq("phone", phone)
      .eq("photo_date", date)
      .maybeSingle();
    return NextResponse.json({ photo_url: data?.photo_url ?? null });
  }

  // 날짜별 전체 조회 (관리자)
  if (date) {
    const { data } = await supabase
      .from("food_photos")
      .select("phone, photo_url")
      .eq("photo_date", date);
    return NextResponse.json({ photos: data ?? [] });
  }

  return NextResponse.json({ error: "파라미터 부족" }, { status: 400 });
}
