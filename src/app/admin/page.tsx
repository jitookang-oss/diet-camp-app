"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { bodyTypeInfo } from "@/lib/scoring";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

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
  phone: string | null;
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

function ParticipantRow({ p, onClick }: { p: Participant; onClick: () => void }) {
  const latestRecord = p.weekly_records?.[p.weekly_records.length - 1];
  const currentWeight = latestRecord?.weight ?? p.weight;
  const weightLost = p.weight > 0 ? Math.round((p.weight - currentWeight) * 10) / 10 : null;
  const progress = p.weekly_records?.length ?? 0;

  return (
    <tr
      className="border-b border-gray-100 hover:bg-green-50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <td className="py-3 px-4">
        <div className="font-semibold text-gray-800">@{p.name}</div>
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
        {p.week1_scores ? <ScoreBadge score={p.week1_scores.total ?? 0} /> : <span className="text-gray-300">-</span>}
      </td>
      <td className="py-3 px-4 text-sm">
        {p.week12_scores ? <ScoreBadge score={p.week12_scores.total ?? 0} /> : <span className="text-gray-300">-</span>}
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
      <td className="py-3 px-4">
        <span className="text-xs text-green-600 font-semibold">리포트 →</span>
      </td>
    </tr>
  );
}

function ParticipantReport({ p, onClose }: { p: Participant; onClose: () => void }) {
  const latestRecord = p.weekly_records?.[p.weekly_records.length - 1];
  const currentWeight = latestRecord?.weight ?? p.weight;
  const weightLost = p.weight > 0 ? Math.round((p.weight - currentWeight) * 10) / 10 : 0;
  const progressToGoal =
    p.weight === p.goal_weight ? 100 :
    p.weight > 0 && p.goal_weight > 0
      ? Math.min(100, Math.max(0, Math.round(((p.weight - currentWeight) / (p.weight - p.goal_weight)) * 100)))
      : 0;

  const typeInfo = p.body_type ? bodyTypeInfo[p.body_type as keyof typeof bodyTypeInfo] : null;

  // 차트 데이터
  const weightData = [
    { week: "초기", weight: p.weight },
    ...(p.weekly_records ?? []).map((r) => ({
      week: `${r.week}주`,
      weight: r.weight,
    })),
  ];

  const scoreData = [
    {
      week: "초기",
      Meal: p.week1_scores?.meal,
      Mobility: p.week1_scores?.mobility,
      Mentation: p.week1_scores?.mentation,
    },
    ...(p.weekly_records ?? []).map((r) => ({
      week: `${r.week}주`,
      Meal: r.scores?.meal,
      Mobility: r.scores?.mobility,
      Mentation: r.scores?.mentation,
    })),
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-2xl z-10">
          <div>
            <h2 className="font-bold text-xl text-gray-800">@{p.name}</h2>
            <p className="text-sm text-gray-500">{p.gender} · {p.age}세 · {p.birth_date}{p.phone ? ` · ${p.phone}` : ""}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center">×</button>
        </div>

        <div className="p-6 space-y-6">
          {/* 핵심 요약 카드 */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "시작 체중", value: p.weight > 0 ? `${p.weight}kg` : "-", sub: "" },
              { label: "현재 체중", value: currentWeight > 0 ? `${currentWeight}kg` : "-", sub: "" },
              {
                label: "감량",
                value: weightLost > 0 ? `-${weightLost}kg` : weightLost < 0 ? `+${Math.abs(weightLost)}kg` : "0kg",
                color: weightLost > 0 ? "text-green-600" : weightLost < 0 ? "text-red-500" : "text-gray-600",
              },
              { label: "목표 달성률", value: `${progressToGoal}%`, color: "text-green-700" },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                <p className={`font-bold text-lg ${item.color ?? "text-gray-800"}`}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* 체질 유형 */}
          {typeInfo && p.body_type && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl p-4 flex items-start gap-4">
              <div className="text-3xl">{typeInfo.icon}</div>
              <div>
                <p className="text-xs text-green-600 font-semibold mb-0.5">체질 유형</p>
                <p className="font-bold text-gray-800 text-lg">{p.body_type}</p>
                <p className="text-sm text-gray-600 mt-0.5">{typeInfo.guide}</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{typeInfo.description}</p>
              </div>
            </div>
          )}

          {/* 몸무게 차트 */}
          {weightData.length >= 2 && (
            <div>
              <h3 className="text-sm font-bold text-gray-600 mb-3">몸무게 변화</h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={weightData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} width={38} />
                  <Tooltip formatter={(v) => [`${v}kg`, "몸무게"]} />
                  {p.goal_weight > 0 && (
                    <ReferenceLine
                      y={p.goal_weight}
                      stroke="#22c55e"
                      strokeDasharray="5 5"
                      label={{ value: "목표", fontSize: 10, fill: "#22c55e" }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#2d6a4f"
                    strokeWidth={2.5}
                    dot={{ fill: "#2d6a4f", r: 4 }}
                    name="몸무게"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 3M 스코어 차트 */}
          {scoreData.length >= 2 && (
            <div>
              <h3 className="text-sm font-bold text-gray-600 mb-3">3M 스코어 변화</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={scoreData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={30} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="Meal" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Mobility" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Mentation" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 초기 vs 최종 3M 비교 */}
          {(p.week1_scores || p.week12_scores) && (
            <div>
              <h3 className="text-sm font-bold text-gray-600 mb-3">초기 vs 최종 점수 비교</h3>
              <div className="grid grid-cols-2 gap-2">
                {(["meal", "mobility", "mentation", "total"] as const).map((key) => {
                  const label = key === "total" ? "종합" : key === "meal" ? "🍽️ 식사" : key === "mobility" ? "🚶 활동" : "🧘 마음";
                  const before = p.week1_scores?.[key] ?? null;
                  const after = p.week12_scores?.[key] ?? null;
                  const diff = before !== null && after !== null ? after - before : null;
                  return (
                    <div key={key} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-2">{label}</p>
                      <div className="flex items-center gap-2">
                        {before !== null && (
                          <span className="text-sm text-gray-500">{before}점</span>
                        )}
                        {before !== null && after !== null && (
                          <span className="text-gray-300 text-xs">→</span>
                        )}
                        {after !== null && (
                          <span className={`text-sm font-bold ${after > (before ?? 0) ? "text-green-600" : after < (before ?? 0) ? "text-red-500" : "text-gray-600"}`}>
                            {after}점
                          </span>
                        )}
                        {diff !== null && (
                          <span className={`text-xs ml-auto font-semibold ${diff > 0 ? "text-green-600" : diff < 0 ? "text-red-500" : "text-gray-400"}`}>
                            {diff > 0 ? "+" : ""}{diff}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 주차별 상세 기록 */}
          {(p.weekly_records?.length ?? 0) > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-600 mb-3">주차별 상세 기록</h3>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left py-2 px-3 text-xs text-gray-400 font-semibold">주차</th>
                      <th className="text-right py-2 px-3 text-xs text-gray-400 font-semibold">몸무게</th>
                      <th className="text-right py-2 px-3 text-xs text-gray-400 font-semibold">변화</th>
                      <th className="text-right py-2 px-3 text-xs text-amber-500 font-semibold">식사</th>
                      <th className="text-right py-2 px-3 text-xs text-blue-500 font-semibold">활동</th>
                      <th className="text-right py-2 px-3 text-xs text-purple-500 font-semibold">마음</th>
                      <th className="text-right py-2 px-3 text-xs text-gray-500 font-semibold">종합</th>
                    </tr>
                    {/* 초기(week1) */}
                    {p.week1_scores && (
                      <tr className="border-b border-gray-50 bg-blue-50/30">
                        <td className="py-2 px-3 text-xs text-blue-600 font-semibold">초기</td>
                        <td className="py-2 px-3 text-right text-gray-600">{p.weight > 0 ? `${p.weight}kg` : "-"}</td>
                        <td className="py-2 px-3 text-right text-gray-300 text-xs">-</td>
                        <td className="py-2 px-3 text-right font-semibold text-amber-600">{p.week1_scores.meal ?? "-"}</td>
                        <td className="py-2 px-3 text-right font-semibold text-blue-600">{p.week1_scores.mobility ?? "-"}</td>
                        <td className="py-2 px-3 text-right font-semibold text-purple-600">{p.week1_scores.mentation ?? "-"}</td>
                        <td className="py-2 px-3 text-right font-bold text-gray-700">{p.week1_scores.total ?? "-"}</td>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {p.weekly_records.map((rec, i) => {
                      const prev = i === 0 ? p.weight : p.weekly_records[i - 1].weight;
                      const diff = Math.round((rec.weight - prev) * 10) / 10;
                      return (
                        <tr key={rec.week} className="border-b border-gray-50 last:border-0">
                          <td className="py-2 px-3 text-gray-600 font-semibold">{rec.week}주차</td>
                          <td className="py-2 px-3 text-right text-gray-700 font-medium">{rec.weight}kg</td>
                          <td className={`py-2 px-3 text-right text-xs font-semibold ${diff < 0 ? "text-green-600" : diff > 0 ? "text-red-500" : "text-gray-400"}`}>
                            {diff > 0 ? "+" : ""}{diff}kg
                          </td>
                          <td className="py-2 px-3 text-right font-semibold text-amber-600">{rec.scores?.meal ?? "-"}</td>
                          <td className="py-2 px-3 text-right font-semibold text-blue-600">{rec.scores?.mobility ?? "-"}</td>
                          <td className="py-2 px-3 text-right font-semibold text-purple-600">{rec.scores?.mentation ?? "-"}</td>
                          <td className="py-2 px-3 text-right font-bold text-gray-700">{rec.scores?.total ?? "-"}</td>
                        </tr>
                      );
                    })}
                    {/* 최종(week12) */}
                    {p.week12_scores && (
                      <tr className="border-t border-green-100 bg-green-50/40">
                        <td className="py-2 px-3 text-xs text-green-600 font-semibold">최종</td>
                        <td className="py-2 px-3 text-right text-gray-600">-</td>
                        <td className="py-2 px-3 text-right text-gray-300 text-xs">-</td>
                        <td className="py-2 px-3 text-right font-semibold text-amber-600">{p.week12_scores.meal ?? "-"}</td>
                        <td className="py-2 px-3 text-right font-semibold text-blue-600">{p.week12_scores.mobility ?? "-"}</td>
                        <td className="py-2 px-3 text-right font-semibold text-purple-600">{p.week12_scores.mentation ?? "-"}</td>
                        <td className="py-2 px-3 text-right font-bold text-green-700">{p.week12_scores.total ?? "-"}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 건강 상태 */}
          {(p.medications || p.diseases || (p.menopause_symptoms?.length ?? 0) > 0) && (
            <div>
              <h3 className="text-sm font-bold text-gray-600 mb-3">건강 상태</h3>
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

          {/* 신체 정보 */}
          <div>
            <h3 className="text-sm font-bold text-gray-600 mb-3">기본 정보</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "키", value: p.height > 0 ? `${p.height}cm` : "-" },
                { label: "목표 몸무게", value: p.goal_weight > 0 ? `${p.goal_weight}kg` : "-" },
                { label: "BMI", value: p.bmi > 0 ? `${p.bmi} (${p.bmi_category})` : "-" },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
                  <p className="font-semibold text-gray-800 text-sm">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
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
      <div className="max-w-5xl mx-auto">
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">인스타 ID</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">BMI</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">체질</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">초기점수</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">최종점수</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">감량</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">진행</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase"></th>
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
          </div>
        )}
      </div>

      {selected && (
        <ParticipantReport p={selected} onClose={() => setSelected(null)} />
      )}
    </main>
  );
}
