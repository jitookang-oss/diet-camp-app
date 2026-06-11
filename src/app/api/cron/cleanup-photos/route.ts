import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  const cutoff = new Date(Date.now() + 9 * 60 * 60 * 1000 - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const { data: oldPhotos } = await supabase
    .from("food_photos")
    .select("id, photo_url")
    .lt("photo_date", cutoff);

  if (!oldPhotos || oldPhotos.length === 0) {
    return NextResponse.json({ deleted: 0 });
  }

  // 스토리지 삭제
  const paths = oldPhotos
    .map((p) => p.photo_url.split("/food-photos/")[1])
    .filter(Boolean);
  if (paths.length > 0) {
    await supabase.storage.from("food-photos").remove(paths);
  }

  // DB 삭제
  await supabase.from("food_photos").delete().in("id", oldPhotos.map((p) => p.id));

  return NextResponse.json({ deleted: oldPhotos.length });
}
