"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Participant {
  id: string;
  name: string;
  birth_date: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  goal_weight: number;
  bmi: number;
  bmi_category: string;
  medications: boolean;
  medication_detail: string | null;
  diseases: boolean;
  disease_detail: string | null;
  menopause_symptoms: string[] | null;
  body_type: string | null;
  week1_scores: Record<string, number> | null;
  weekly_records: Array<{
    week: number;
    weight: number;
    scores: Record<string, number>;
    completedAt: string;
  }>;
  week12_scores: Record<string, number> | null;
  updated_at: string;
}

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "";

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70 ? "bg-green-100 text-green-700" :
    score >= 50 ? "bg-yellow-100 text-yellow-700" :
    "bg-red-100 text-red-700";
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>
      {score}점
    </span>
  );
}

function ParticipantRow({
  p,
  onClick,
}: {
  p: Participant;
  onClick: () => void;
}) {
  const latestRecord = p.weekly_records?.[p.weekly_records.length - 1];
  const currentWeight = latestRecord?.weight ?? p.weight;
  const weightLost = p.weight > 0 ? Math.round((p.weight - currentWeight) * 10) / 10 : null;
  const progress = p.weekly_records?.length ?? 0;

  return (
    <tr
      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
      onClick={onClick}
    >
      <td className="py-3 px-4">
        <div className="font-semibold text-gray-800">{p.name}</div>
        <div className="text-xs text-gray-400">{p.gender} · {p.age}세</div>
      </td>
      <td className="py-3 px-4 text-sm text-gray-600">
        {p.bmi > 0 ? (
          <>
            <span className="font-medium">{p.bmi}</span>
            <span className="text-xs text-gray-400 ml-1">({p.bmi_category})</span>
          </>
        ) : "-"}
      </td>
      <td className="py-3 px-4 text-sm">
        {p.body_type ? (
          <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded-full">
            {p.body_type}
          </span>
        ) : <span className="text-gray-300">미완료</span>}
      </td>
      <td className="py-3 px-4 text-sm">
        {p.week1_scores ? (
          <ScoreBadge score={p.week1_scores.total ?? 0} />
        ) : <span className="text-gray-300">-</span>}
      </td>
      <td className="py-3 px-4 text-sm">
        {p.week12_scores ? (
          <ScoreBadge score={p.week12_scores.total ?? 0} />
        ) : <span className="text-gray-300">-</span>}
      </td>
      <td className="py-3 px-4 text-sm text-gray-600">
        {weightLost !== null && weightLost > 0 ? (
          <span className="text-green-600 font-medium">-{weightLost}kg</span>
        ) : weightLost !== null && weightLost < 0 ? (
          <span className="text-red-500 font-medium">+{Math.abs(weightLost)}kg</span>
        ) : "-"}
      </td>
      <td className="py-3 px-4 text-sm text-gray-500">
        {progress}주 완료
      </td>
    </tr>
  );
}

function ParticipantDetail({
  p,
  onClose,
}: {
  p: Participant;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-lg text-gray-800">{p.name}</h2>
            <p className="text-sm text-gray-500">{p.gender} · {p.age}세 · {p.birth_date}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="p-6 space-y-5">
          {/* 신체 정보 */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">신체 정보</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "키", value: p.height > 0 ? `${p.height}cm` : "-" },
                { label: "시작 몸무게", value: p.weight > 0 ? `${p.weight}kg` : "-" },
                { label: "목표 몸무게", value: p.goal_weight > 0 ? `${p.goal_weight}kg` : "-" },
                { label: "BMI", value: p.bmi > 0 ? `${p.bmi}` : "-" },
                { label: "비만도", value: p.bmi_category || "-" },
                { label: "체질 유형", value: p.body_type || "-" },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
                  <p className="font-semibold text-gray-800 text-sm">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 건강 상태 */}
          {(p.medications || p.diseases || (p.menopause_symptoms?.length ?? 0) > 0) && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">건강 상태</h3>
              <div className="space-y-2 text-sm">
                {p.medications && (
                  <div className="bg-orange-50 rounded-xl px-3 py-2">
                    <span className="font-medium text-orange-700">복용약:</span>{" "}
                    <span className="text-gray-700">{p.medication_detail || "있음"}</span>
                  </div>
                )}
                {p.diseases && (
                  <div className="bg-red-50 rounded-xl px-3 py-2">
                    <span className="font-medium text-red-700">질환:</span>{" "}
                    <span className="text-gray-700">{p.disease_detail || "있음"}</span>
                  </div>
                )}
                {(p.menopause_symptoms?.length ?? 0) > 0 && (
                  <div className="bg-purple-50 rounded-xl px-3 py-2">
                    <span className="font-medium text-purple-700">갱년기 증상:</span>{" "}
                    <span className="text-gray-700">{p.menopause_symptoms!.join(", ")}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 초기/최종 3M 점수 */}
          {(p.week1_scores || p.week12_scores) && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">3M 점수 비교</h3>
              <div className="grid grid-cols-2 gap-3">
                {(["meal", "mobility", "mentation", "total"] as const).map((key) => {
                  const label = key === "total" ? "종합" : key === "meal" ? "식사(Meal)" : key === "mobility" ? "활동(Mobility)" : "마음(Mentation)";
                  const before = p.week1_scores?.[key] ?? null;
                  const after = p.week12_scores?.[key] ?? null;
                  return (
                    <div key={key} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-1">{label}</p>
                      <div className="flex items-center gap-2">
                        {before !== null ? <span className="text-sm font-medium text-gray-600">{before}점</span> : <span className="text-gray-300 text-sm">-</span>}
                        {before !== null && after !== null && <span className="text-gray-300">→</span>}
                        {after !== null ? (
                          <span className={`text-sm font-bold ${after > (before ?? 0) ? "text-green-600" : "text-red-500"}`}>
                            {after}점
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 주차별 기록 */}
          {(p.weekly_records?.length ?? 0) > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">주차별 몸무게</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500 px-3">
                  <span className="w-12">주차</span>
                  <span className="w-16">몸무게</span>
                  <span className="w-12">변화</span>
                  <span>종합</span>
                </div>
                {p.weekly_records.map((rec, i) => {
                  const prev = i === 0 ? p.weight : p.weekly_records[i - 1].weight;
                  const diff = Math.round((rec.weight - prev) * 10) / 10;
                  return (
                    <div key={rec.week} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 text-sm">
                      <span className="w-12 text-gray-500">{rec.week}주차</span>
                      <span className="w-16 font-medium">{rec.weight}kg</span>
                      <span className={`w-12 text-xs font-semibold ${diff < 0 ? "text-green-600" : diff > 0 ? "text-red-500" : "text-gray-400"}`}>
                        {diff > 0 ? "+" : ""}{diff}kg
                      </span>
                      <ScoreBadge score={rec.scores?.total ?? 0} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Participant | null>(null);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
    } else {
      setPwError(true);
    }
  }

  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    supabase
      .from("participants")
      .select("*")
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        setParticipants((data as Participant[]) ?? []);
        setLoading(false);
      });
  }, [authed]);

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="card p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="text-3xl mb-2">🔐</div>
            <h1 className="font-bold text-xl text-gray-800">관리자 로그인</h1>
            <p className="text-sm text-gray-500 mt-1">이지약국 전용</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              className="input-field"
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPwError(false); }}
            />
            {pwError && (
              <p className="text-red-500 text-sm text-center">비밀번호가 틀렸어요</p>
            )}
            <button type="submit" className="btn-primary">
              로그인
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">참여자 관리</h1>
            <p className="text-sm text-gray-500 mt-0.5">이지약국 12주 다이어트 캠프</p>
          </div>
          <div className="bg-green-100 text-green-700 font-semibold px-4 py-2 rounded-full text-sm">
            총 {participants.length}명
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">불러오는 중...</div>
        ) : participants.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-4xl mb-3">📭</div>
            <p>아직 참여자가 없어요</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">이름</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">BMI</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">체질</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">초기점수</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">최종점수</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">감량</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">진행</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <ParticipantRow
                    key={p.id}
                    p={p}
                    onClick={() => setSelected(p)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <ParticipantDetail p={selected} onClose={() => setSelected(null)} />
      )}
    </main>
  );
}
