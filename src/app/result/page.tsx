"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadParticipant, ParticipantData } from "@/lib/store";
import { bodyTypeInfo, Scores, getSupplements } from "@/lib/scoring";
import PdfReport from "./PdfReport";
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

// ─── 영양제 추천 섹션 ─────────────────────────────────────
const colorTokens: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  amber:  { bg: "bg-amber-50",  text: "text-amber-800",  border: "border-amber-200",  dot: "bg-amber-400" },
  blue:   { bg: "bg-blue-50",   text: "text-blue-800",   border: "border-blue-200",   dot: "bg-blue-400" },
  purple: { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200", dot: "bg-purple-400" },
  green:  { bg: "bg-green-50",  text: "text-green-800",  border: "border-green-200",  dot: "bg-green-500" },
  red:    { bg: "bg-red-50",    text: "text-red-800",    border: "border-red-200",    dot: "bg-red-400" },
};

function SupplementSection({
  bodyType,
  scores,
  weight,
}: {
  bodyType: import("@/lib/scoring").BodyType;
  scores: Scores;
  weight: number;
}) {
  const groups = getSupplements(bodyType, scores);
  const proteinGoal = Math.round(weight * 1.5);

  return (
    <div className="space-y-4">
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-2">
        <span className="text-xl">💊</span>
        <h3 className="font-bold text-gray-800 text-base">약사 추천 영양제</h3>
        <span className="ml-auto text-xs text-gray-400">이보라 약사 처방</span>
      </div>

      {groups.map((group) => {
        const tok = colorTokens[group.color] ?? colorTokens.green;
        return (
          <div key={group.label} className="card p-5">
            {/* 그룹 레이블 */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4 ${tok.bg} ${tok.text}`}>
              <span className={`w-2 h-2 rounded-full ${tok.dot}`} />
              {group.label}
            </div>

            <div className="space-y-4">
              {group.supplements.map((s) => (
                <div key={s.name} className={`rounded-xl border p-4 ${tok.border} bg-white`}>
                  {/* 영양제 이름 */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-bold text-gray-800 text-sm leading-snug">{s.name}</p>
                    {s.timing && (
                      <span className="text-xs text-gray-400 whitespace-nowrap shrink-0 mt-0.5">⏰ {s.timing}</span>
                    )}
                  </div>

                  {/* 추천 이유 */}
                  <p className="text-xs text-gray-600 leading-relaxed mb-2">{s.reason}</p>

                  {/* 효과 체감 신호 */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400">체감 신호</span>
                    <span className={`text-xs font-medium ${tok.text}`}>{s.signal}</span>
                  </div>

                  {/* 단백질 가이드 */}
                  {s.isProtein && (
                    <div className="mt-3 bg-gray-50 rounded-lg px-3 py-2">
                      <p className="text-xs text-gray-500 leading-relaxed">
                        <span className="font-bold text-gray-700">하루 권장 섭취량</span>은{" "}
                        <span className="font-bold text-green-700">
                          체중 × 1.5g = 약 {proteinGoal}g
                        </span>
                        이에요. 식사만으로 채우기 어렵다면 보충제로 보완하세요.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
function ResultContent() {
  const router = useRouter();
  const params = useSearchParams();
  const isWeek12 = params.get("week") === "12";
  const [data, setData] = useState<ParticipantData | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

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

  async function handleDownloadPdf() {
    if (!pdfRef.current || !data) return;
    setPdfLoading(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#0d2818",
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = (canvas.height * pageW) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pageW, pageH);
      pdf.save(`${data.basicInfo.name}_3M리포트_${isWeek12 ? "12주차" : "1주차"}.pdf`);
    } catch (e) {
      console.error(e);
      alert("PDF 저장 중 오류가 발생했어요. 다시 시도해주세요.");
    } finally {
      setPdfLoading(false);
    }
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

        {/* 영양제 추천 — 1주차 결과에서만 표시 */}
        {!isWeek12 && (
          <SupplementSection bodyType={bodyType} scores={scores} weight={data.basicInfo.weight} />
        )}

        {/* 버튼 영역 */}
        <div className="space-y-3">
          {/* PDF 저장 버튼 */}
          <button
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
            className="btn-secondary"
          >
            {pdfLoading ? "PDF 생성 중..." : "📄 PDF 결과지 저장"}
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="btn-primary"
          >
            {isWeek12 ? "최종 대시보드 보기 →" : "매주 기록하러 가기 →"}
          </button>
        </div>

        {/* PDF 캡처 전용 영역 — 화면 밖에 숨김 */}
        <div
          style={{
            position: "fixed",
            top: "-9999px",
            left: "-9999px",
            zIndex: -1,
            pointerEvents: "none",
          }}
          ref={pdfRef}
        >
          <PdfReport data={data} scores={scores} isWeek12={isWeek12} />
        </div>
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
