"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadParticipant, ParticipantData } from "@/lib/store";
import { bodyTypeInfo, Scores } from "@/lib/scoring";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

function ScoreBar({
  label,
  score,
  color,
}: {
  label: string;
  score: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between items-end mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="text-right">
          <span className="text-2xl font-black" style={{ color }}>
            {score}
          </span>
          <span className="text-sm text-gray-400 ml-0.5">/ 100점</span>
        </div>
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{
            width: `${score}%`,
            background: color,
            transition: "width 1s ease",
          }}
        />
      </div>
    </div>
  );
}

function ResultContent() {
  const router = useRouter();
  const params = useSearchParams();
  const isWeek12 = params.get("week") === "12";
  const [data, setData] = useState<ParticipantData | null>(null);

  useEffect(() => {
    const d = loadParticipant();
    if (!d) {
      router.push("/");
      return;
    }
    setData(d);
  }, [router]);

  if (!data) return null;

  const scores: Scores | undefined = isWeek12
    ? data.week12Scores
    : data.week1Scores;
  const bodyType = data.bodyType;

  if (!scores || !bodyType) {
    router.push("/");
    return null;
  }

  const info = bodyTypeInfo[bodyType];

  const radarData = [
    { subject: "Meal", value: scores.meal },
    { subject: "Mobility", value: scores.mobility },
    { subject: "Mentation", value: scores.mentation },
  ];

  const colorMap: Record<string, string> = {
    amber: "#f59e0b",
    blue: "#3b82f6",
    purple: "#8b5cf6",
    red: "#ef4444",
    green: "#22c55e",
  };
  const accentColor = colorMap[info.color] ?? "#2d6a4f";

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-10 pb-24">
      <div className="w-full max-w-md space-y-4">
        {/* 헤더 */}
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">
            {isWeek12 ? "12주차 최종 결과" : "1주차 체질 분석 결과"}
          </p>
          <h1 className="text-2xl font-bold text-gray-900">
            {data.basicInfo.name}님의 3M 리포트
          </h1>
        </div>

        {/* 체질 유형 카드 */}
        <div
          className="card p-6 text-center"
          style={{ borderTop: `4px solid ${accentColor}` }}
        >
          <div className="text-5xl mb-3">{info.icon}</div>
          <div
            className="inline-block px-4 py-1 rounded-full text-sm font-bold mb-3"
            style={{ background: `${accentColor}20`, color: accentColor }}
          >
            {bodyType}
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">
            {info.description}
          </p>
          <div className="mt-4 bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">핵심 가이드</p>
            <p className="font-semibold text-gray-800 text-sm">{info.guide}</p>
          </div>
        </div>

        {/* 총점 + 3M 스코어 한 카드에 */}
        <div className="card p-6">
          {/* 종합 점수 */}
          <div className="flex items-center justify-between mb-5 pb-5 border-b border-gray-100">
            <div>
              <p className="text-sm text-gray-500 mb-0.5">종합 점수</p>
              <p className="text-xs text-gray-400">3M 파트 평균</p>
            </div>
            <div className="text-right">
              <span className="text-5xl font-black text-green-700">
                {scores.total}
              </span>
              <span className="text-lg text-gray-400 ml-1">/ 100</span>
            </div>
          </div>

          {/* 3M 상세 점수 */}
          <div className="space-y-5">
            <ScoreBar label="🍽️ Meal · 식사 습관" score={scores.meal} color="#f59e0b" />
            <ScoreBar label="🚶 Mobility · 활동 대사" score={scores.mobility} color="#3b82f6" />
            <ScoreBar label="🧘 Mentation · 마음 관리" score={scores.mentation} color="#8b5cf6" />
          </div>
        </div>

        {/* 레이더 차트 */}
        <div className="card p-6">
          <h3 className="font-bold text-gray-800 mb-4">균형 분석</h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fontSize: 13, fontWeight: 600 }}
              />
              <Radar
                name="점수"
                dataKey="value"
                stroke="#2d6a4f"
                fill="#2d6a4f"
                fillOpacity={0.25}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* 신체 정보 */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-800 mb-3">나의 신체 정보</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "현재 몸무게",
                value: `${data.basicInfo.weight} kg`,
              },
              {
                label: "목표 몸무게",
                value: `${data.basicInfo.goalWeight} kg`,
              },
              { label: "BMI", value: data.basicInfo.bmi },
              { label: "BMI 분류", value: data.basicInfo.bmiCategory },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                <p className="font-bold text-gray-800">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 비교 (12주차) */}
        {isWeek12 && data.week1Scores && (
          <div className="card p-5">
            <h3 className="font-bold text-gray-800 mb-3">1주차 vs 12주차 비교</h3>
            <div className="space-y-3">
              {(
                [
                  ["Meal", data.week1Scores.meal, scores.meal],
                  ["Mobility", data.week1Scores.mobility, scores.mobility],
                  [
                    "Mentation",
                    data.week1Scores.mentation,
                    scores.mentation,
                  ],
                ] as [string, number, number][]
              ).map(([label, before, after]) => {
                const diff = after - before;
                return (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-sm w-20 font-medium">{label}</span>
                    <span className="text-sm text-gray-500">{before}점</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-sm font-bold text-gray-800">
                      {after}점
                    </span>
                    <span
                      className={`text-xs font-bold ml-auto ${
                        diff > 0
                          ? "text-green-600"
                          : diff < 0
                          ? "text-red-500"
                          : "text-gray-400"
                      }`}
                    >
                      {diff > 0 ? `+${diff}` : diff}점
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 버튼 */}
        <button
          onClick={() => router.push("/dashboard")}
          className="btn-primary"
        >
          {isWeek12 ? "최종 대시보드 보기 →" : "매주 기록하러 가기 →"}
        </button>
      </div>
    </main>
  );
}

export default function ResultPage() {
  return (
    <Suspense>
      <ResultContent />
    </Suspense>
  );
}
