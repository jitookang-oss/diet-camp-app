import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get("phone");
  if (!phone) return NextResponse.json({ error: "phone required" }, { status: 400 });

  const supabase = getSupabase();
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from("messages")
    .select("id, content, created_at")
    .eq("phone", phone)
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false });

  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(request: NextRequest) {
  const { phone, content, broadcast, password } = await request.json();

  if (password !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!content?.trim()) {
    return NextResponse.json({ error: "content required" }, { status: 400 });
  }

  const supabase = getSupabase();

  if (broadcast) {
    const { data: participants } = await supabase
      .from("participants")
      .select("phone")
      .not("phone", "is", null);

    if (!participants?.length) return NextResponse.json({ sent: 0 });

    const rows = (participants as { phone: string }[]).map((p) => ({
      phone: p.phone,
      content: content.trim(),
    }));
    await supabase.from("messages").insert(rows);
    return NextResponse.json({ sent: rows.length });
  }

  if (!phone) return NextResponse.json({ error: "phone required" }, { status: 400 });
  await supabase.from("messages").insert({ phone, content: content.trim() });
  return NextResponse.json({ sent: 1 });
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const supabase = getSupabase();
  await supabase.from("messages").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
