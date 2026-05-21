import { ParticipantData } from "@/lib/store";
import { Scores, bodyTypeInfo, getSupplements, BodyType } from "@/lib/scoring";

interface Props {
  data: ParticipantData;
  scores: Scores;
  isWeek12: boolean;
}

function Bar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: "#d1fae5" }}>{label}</span>
        <span style={{ fontSize: 16, fontWeight: 800, color }}>{score}<span style={{ fontSize: 11, color: "#6b7280" }}>/100</span></span>
      </div>
      <div style={{ background: "#1a3d2b", borderRadius: 6, height: 10, overflow: "hidden" }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 6 }} />
      </div>
    </div>
  );
}

export default function PdfReport({ data, scores, isWeek12 }: Props) {
  const bodyType = data.bodyType as BodyType | undefined;
  const info = bodyType ? bodyTypeInfo[bodyType] : null;

  const colorMap: Record<string, string> = {
    amber: "#f59e0b",
    blue: "#3b82f6",
    purple: "#8b5cf6",
    red: "#ef4444",
    green: "#22c55e",
  };
  const accent = info ? (colorMap[info.color] ?? "#22c55e") : "#22c55e";

  const today = new Date().toLocaleDateString("ko-KR");
  const supplements = bodyType ? getSupplements(bodyType, scores) : [];

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        background: "#0d2818",
        color: "#f0fdf4",
        fontFamily: "'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
        padding: "48px 56px",
        boxSizing: "border-box",
      }}
    >
      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36 }}>
        <div>
          <p style={{ fontSize: 11, color: "#6ee7b7", letterSpacing: 2, marginBottom: 6 }}>이지약국 12주 다이어트 캠프</p>
          <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0 }}>
            {data.basicInfo.name}님의 3M 리포트
          </h1>
          <p style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
            {isWeek12 ? "12주차 최종 결과" : "1주차 체질 분석 결과"} · {today}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 48, fontWeight: 900, color: "#22c55e", lineHeight: 1 }}>
            {scores.total}
          </div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>종합 점수 / 100</div>
        </div>
      </div>

      {/* 체질 유형 */}
      {info && bodyType && (
        <div style={{ background: "#122b1c", borderRadius: 16, padding: "20px 24px", marginBottom: 24, borderLeft: `4px solid ${accent}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 28 }}>{info.icon}</span>
            <div>
              <span style={{ fontSize: 13, fontWeight: 800, color: accent }}>{bodyType}</span>
              <p style={{ fontSize: 12, color: "#9ca3af", margin: "4px 0 0" }}>{info.guide}</p>
            </div>
          </div>
          <p style={{ fontSize: 12, color: "#d1fae5", lineHeight: 1.7, margin: 0 }}>{info.description}</p>
        </div>
      )}

      {/* 3M 점수 */}
      <div style={{ background: "#122b1c", borderRadius: 16, padding: "20px 24px", marginBottom: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "#6ee7b7", marginBottom: 16 }}>3M 파트 점수</h2>
        <Bar label="🍽️ Meal · 식사 습관" score={scores.meal} color="#f59e0b" />
        <Bar label="🚶 Mobility · 활동 대사" score={scores.mobility} color="#3b82f6" />
        <Bar label="🧘 Mentation · 마음 관리" score={scores.mentation} color="#8b5cf6" />
      </div>

      {/* 신체 정보 */}
      <div style={{ background: "#122b1c", borderRadius: 16, padding: "20px 24px", marginBottom: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "#6ee7b7", marginBottom: 16 }}>신체 정보</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
          {[
            { label: "현재 몸무게", value: `${data.basicInfo.weight} kg` },
            { label: "목표 몸무게", value: `${data.basicInfo.goalWeight} kg` },
            { label: "BMI", value: String(data.basicInfo.bmi) },
            { label: "BMI 분류", value: data.basicInfo.bmiCategory },
          ].map((item) => (
            <div key={item.label} style={{ background: "#0d2818", borderRadius: 10, padding: "12px 14px" }}>
              <p style={{ fontSize: 10, color: "#6b7280", margin: "0 0 4px" }}>{item.label}</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#f0fdf4", margin: 0 }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 1주차 vs 12주차 비교 */}
      {isWeek12 && data.week1Scores && (
        <div style={{ background: "#122b1c", borderRadius: 16, padding: "20px 24px", marginBottom: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#6ee7b7", marginBottom: 16 }}>1주차 → 12주차 변화</h2>
          {(
            [
              ["🍽️ Meal", data.week1Scores.meal, scores.meal],
              ["🚶 Mobility", data.week1Scores.mobility, scores.mobility],
              ["🧘 Mentation", data.week1Scores.mentation, scores.mentation],
            ] as [string, number, number][]
          ).map(([label, before, after]) => {
            const diff = after - before;
            return (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <span style={{ fontSize: 13, width: 100, color: "#d1fae5" }}>{label}</span>
                <span style={{ fontSize: 13, color: "#9ca3af" }}>{before}점</span>
                <span style={{ color: "#4b5563" }}>→</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#f0fdf4" }}>{after}점</span>
                <span style={{
                  fontSize: 12, fontWeight: 700, marginLeft: "auto",
                  color: diff > 0 ? "#22c55e" : diff < 0 ? "#ef4444" : "#6b7280"
                }}>
                  {diff > 0 ? `+${diff}` : diff}점
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* 영양제 추천 (1주차만) */}
      {!isWeek12 && supplements.length > 0 && (
        <div style={{ background: "#122b1c", borderRadius: 16, padding: "20px 24px", marginBottom: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#6ee7b7", marginBottom: 16 }}>💊 약사 추천 영양제 (이보라 약사)</h2>
          {supplements.map((group) => (
            <div key={group.label} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: colorMap[group.color] ?? "#22c55e", marginBottom: 8 }}>
                ● {group.label}
              </div>
              {group.supplements.map((s) => (
                <div key={s.name} style={{ background: "#0d2818", borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#f0fdf4" }}>{s.name}</span>
                    {s.timing && <span style={{ fontSize: 10, color: "#6b7280" }}>{s.timing}</span>}
                  </div>
                  <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 4px", lineHeight: 1.5 }}>{s.reason}</p>
                  <p style={{ fontSize: 10, color: "#6ee7b7", margin: 0 }}>체감 신호: {s.signal}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* 푸터 */}
      <div style={{ borderTop: "1px solid #1a3d2b", paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "#4b5563" }}>이지약국 12주 다이어트 캠프</span>
        <span style={{ fontSize: 11, color: "#4b5563" }}>이보라 약사 · {today}</span>
      </div>
    </div>
  );
}
