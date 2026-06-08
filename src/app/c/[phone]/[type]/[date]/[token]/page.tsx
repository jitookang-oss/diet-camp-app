import { verifyCheckinToken } from "@/lib/alimtalk";
import { getSupabase } from "@/lib/supabase-server";
import MissionCheckButton from "./MissionCheckButton";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  supplement: "영양제",
  lunch_walk: "점심 걷기",
  evening_exercise: "저녁 운동",
};

const ICONS: Record<string, string> = {
  supplement: "💊",
  lunch_walk: "🚶",
  evening_exercise: "🌙",
};

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-6">
            <p className="text-xs text-gray-400 tracking-widest uppercase">보라매직 다이어트 캠프</p>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}

export default async function CheckinPage({
  params,
}: {
  params: Promise<{ phone: string; type: string; date: string; token: string }>;
}) {
  const { phone: rawPhone, type, date, token } = await params;
  const phone = decodeURIComponent(rawPhone);
  const label = TYPE_LABELS[type];
  const icon = ICONS[type] ?? "✅";

  if (!label) {
    return (
      <Wrapper>
        <div className="text-center py-16">
          <div className="text-6xl mb-6">❌</div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">오류가 발생했어요</h1>
          <p className="text-xs text-red-600 font-mono bg-red-50 rounded p-2 mt-2">잘못된 체크인 유형: {type}</p>
        </div>
      </Wrapper>
    );
  }

  if (!verifyCheckinToken(phone, date, type, token)) {
    return (
      <Wrapper>
        <div className="text-center py-16">
          <div className="text-6xl mb-6">❌</div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">링크가 유효하지 않아요</h1>
          <p className="text-gray-500 text-sm">링크가 만료됐거나 잘못된 접근이에요.</p>
        </div>
      </Wrapper>
    );
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

  if (error && error.code !== "23505") {
    return (
      <Wrapper>
        <div className="text-center py-16">
          <div className="text-6xl mb-6">❌</div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">오류가 발생했어요</h1>
          <p className="text-xs text-red-600 font-mono bg-red-50 rounded p-2 mt-2 break-all">
            DB 오류: {error.message} (code: {error.code})
          </p>
          <p className="text-gray-500 text-sm mt-4">아래 내용을 약사님께 전달해 주세요.</p>
        </div>
      </Wrapper>
    );
  }

  const already = error?.code === "23505";
  const name = participant?.name;

  if (already) {
    return (
      <Wrapper>
        <div className="text-center py-10">
          <div className="text-6xl mb-6">✔️</div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">이미 체크했어요!</h1>
          <p className="text-gray-500 mb-6">
            {name ? `${name}님은 ` : ""}오늘 {label} 이미 완료하셨어요.
          </p>
          {type === "evening_exercise" && <MissionCheckButton phone={phone} date={date} />}
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <div className="text-center py-10">
        <div className="text-6xl mb-6">{icon}</div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">
          {name ? `${name}님, ` : ""}체크 완료!
        </h1>
        <p className="text-green-700 font-semibold text-lg mb-6">{label} 기록됐어요 🎉</p>
        <div className="bg-green-50 rounded-2xl p-5 max-w-xs mx-auto">
          <p className="text-sm text-gray-600 leading-relaxed">
            오늘도 건강한 하루를 보내고 계시네요.<br />
            꾸준함이 변화를 만들어요!
          </p>
        </div>
        {type === "evening_exercise" && <MissionCheckButton phone={phone} date={date} />}
      </div>
    </Wrapper>
  );
}
