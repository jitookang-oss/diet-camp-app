"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadParticipant, saveParticipant, ParticipantData, getCurrentWeek } from "@/lib/store";
import { bodyTypeInfo } from "@/lib/scoring";
import { getCampDayInfo, getWeekCheckUnlockDate, isCheckWeekUnlocked } from "@/lib/missions";
import MissionDetailModal from "@/components/MissionDetailModal";
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

function getKSTDateStr() {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<ParticipantData | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showBookmarkTip, setShowBookmarkTip] = useState(false);
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [todayMissionChecked, setTodayMissionChecked] = useState(false);
  const [missionChecking, setMissionChecking] = useState(false);

  useEffect(() => {
    setMounted(true);
    const d = loadParticipant();
    if (!d?.week1Scores) {
      router.push("/");
      return;
    }
    setData(d);
    if ((d.weeklyRecords?.length ?? 0) === 0) setShowBookmarkTip(true);

    // 오늘 미션 체크 여부 조회
    const phone = d.basicInfo.phone;
    if (phone) {
      const today = getKSTDateStr();
      fetch(`/api/mission-check?phone=${encodeURIComponent(phone)}&date=${today}`)
        .then((r) => r.json())
        .then((res) => { if (res.checked) setTodayMissionChecked(true); })
        .catch(() => {});
    }
  }, [router]);

  async function handleTodayMissionCheck() {
    if (!data?.basicInfo.phone || missionChecking || todayMissionChecked) return;
    setMissionChecking(true);
    const today = getKSTDateStr();
    const res = await fetch("/api/mission-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: data.basicInfo.phone, date: today }),
    });
    const json = await res.json();
    if (json.success || json.already) setTodayMissionChecked(true);
    setMissionChecking(false);
  }

  if (!data) return null;

  const { basicInfo, week1Scores, weeklyRecords, bodyType } = data;
  const currentWeek = getCurrentWeek(data);
  const typeInfo = bodyType ? bodyTypeInfo[bodyType] : null;
  const campInfo = getCampDayInfo();
  const { campWeek, currentMission } = campInfo;

  // 이번 주 미션 달성 여부
  const missionChecked = campWeek > 0 ? (data.missionChecks?.[campWeek] ?? false) : false;

  function handleMissionCheck() {
    if (!campWeek || !data) return;
    const newChecks = { ...(data.missionChecks ?? {}), [campWeek]: !missionChecked };
    saveParticipant({ missionChecks: newChecks });
    setData({ ...data, missionChecks: newChecks });
  }

  // 주차별 잠금 상태
  const weekLocked = currentWeek <= 11 && !isCheckWeekUnlocked(currentWeek);
  const unlockDate = currentWeek <= 11 ? getWeekCheckUnlockDate(currentWeek) : null;
  const unlockLabel = unlockDate
    ? `${unlockDate.getMonth() + 1}/${unlockDate.getDate()}부터 가능`
    : "";
  const recordWeekLabel = currentWeek <= 11 ? `${currentWeek - 1}주차 기록하기` : "12주차 최종 설문";

  // 차트 데이터
  const weightData = [
    { week: "1주", weight: basicInfo.weight },
    ...(weeklyRecords ?? []).map((r) => ({ week: `${r.week}주`, weight: r.weight })),
  ];
  const scoreData = [
    { week: "1주", 음식: week1Scores?.meal, 활동: week1Scores?.mobility, 멘탈: week1Scores?.mentation },
    ...(weeklyRecords ?? []).map((r) => ({
      week: `${r.week}주`,
      음식: r.scores.meal,
      활동: r.scores.mobility,
      멘탈: r.scores.mentation,
    })),
  ];

  const latestWeight = weeklyRecords.length > 0 ? weeklyRecords[weeklyRecords.length - 1].weight : basicInfo.weight;
  const weightDiff = Math.round((latestWeight - basicInfo.weight) * 10) / 10;
  const progressToGoal =
    basicInfo.weight === basicInfo.goalWeight
      ? 100
      : Math.min(100, Math.max(0, Math.round(((basicInfo.weight - latestWeight) / (basicInfo.weight - basicInfo.goalWeight)) * 100)));

  return (
    <main className="min-h-screen px-4 py-10 pb-24">
      <div className="w-full max-w-md mx-auto space-y-4">
        {/* 헤더 */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">{basicInfo.name}님의 대시보드</h1>
          <p className="text-sm text-gray-500 mt-1">현재 {currentWeek - 1}주차 진행 중</p>
        </div>

        {/* 즐겨찾기 안내 */}
        {showBookmarkTip && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-amber-800 mb-1">📌 이 페이지를 즐겨찾기에 추가하세요!</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  다음에도 이 화면에서 기록을 이어갈 수 있어요.<br />
                  브라우저 주소창 옆 ☆ 아이콘을 눌러 저장해두세요.
                </p>
              </div>
              <button onClick={() => setShowBookmarkTip(false)} className="text-amber-400 hover:text-amber-600 text-lg flex-shrink-0">✕</button>
            </div>
          </div>
        )}

        {/* 이번 주 미션 카드 */}
        {currentMission && (
          <button
            onClick={() => setShowMissionModal(true)}
            className="w-full card p-5 border-l-4 border-green-500 text-left hover:bg-green-50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{currentMission.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                    {campWeek}주차 미션
                  </span>
                  {currentMission.isConsultationWeek && (
                    <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">상담 주간</span>
                  )}
                  {missionChecked && (
                    <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">✓ 달성</span>
                  )}
                </div>
                <p className="font-bold text-gray-800 text-sm mb-1">{currentMission.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{currentMission.detail}</p>
              </div>
              <span className="text-green-500 text-sm flex-shrink-0 mt-0.5">→</span>
            </div>
          </button>
        )}

        {/* 오늘 미션 체크 */}
        {campWeek > 0 && data.basicInfo.phone && (
          <div className={`card p-4 flex items-center gap-4 ${todayMissionChecked ? "bg-green-50 border-green-200" : ""}`}>
            <div className="text-2xl">{todayMissionChecked ? "✅" : "🎯"}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800">
                {todayMissionChecked ? "오늘 미션 완료!" : "오늘 미션 수행했나요?"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {todayMissionChecked ? "오늘도 잘 하셨어요 💪" : "매일 체크하면 관리자가 확인해요"}
              </p>
            </div>
            {!todayMissionChecked && (
              <button
                onClick={handleTodayMissionCheck}
                disabled={missionChecking}
                className="flex-shrink-0 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {missionChecking ? "..." : "완료!"}
              </button>
            )}
          </div>
        )}

        {/* 요약 카드 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">현재 몸무게</p>
            <p className="text-2xl font-black text-gray-900">
              {latestWeight}<span className="text-sm font-normal text-gray-500 ml-1">kg</span>
            </p>
            <p className={`text-xs font-semibold mt-1 ${weightDiff <= 0 ? "text-green-600" : "text-red-500"}`}>
              {weightDiff <= 0 ? `▼ ${Math.abs(weightDiff)}` : `▲ ${weightDiff}`} kg
            </p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">목표까지</p>
            <p className="text-2xl font-black text-green-700">
              {progressToGoal}<span className="text-sm font-normal text-gray-500 ml-1">%</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">목표 {basicInfo.goalWeight}kg</p>
          </div>
        </div>

        {/* 체질 유형 */}
        {typeInfo && bodyType && (
          <div className="card p-4 flex items-center gap-4">
            <div className="text-3xl">{typeInfo.icon}</div>
            <div>
              <p className="text-xs text-gray-500">나의 체질 유형</p>
              <p className="font-bold text-gray-800">{bodyType}</p>
              <p className="text-xs text-gray-600 mt-0.5">{typeInfo.guide}</p>
            </div>
            <button onClick={() => router.push("/result")} className="ml-auto text-green-700 text-xs font-semibold flex-shrink-0">
              상세 →
            </button>
          </div>
        )}

        {/* 몸무게 그래프 */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-800 mb-4">몸무게 변화</h3>
          {mounted && weightData.length >= 2 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weightData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 12 }} width={40} />
                <Tooltip />
                <ReferenceLine y={basicInfo.goalWeight} stroke="#22c55e" strokeDasharray="5 5" label={{ value: "목표", fontSize: 11, fill: "#22c55e" }} />
                <Line type="monotone" dataKey="weight" stroke="#2d6a4f" strokeWidth={2.5} dot={{ fill: "#2d6a4f", r: 4 }} name="몸무게" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-400">
              <p className="text-sm">2주차부터 그래프가 표시돼요</p>
            </div>
          )}
        </div>

        {/* 3M 스코어 그래프 */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-800 mb-4">대사관리 스코어 변화</h3>
          {mounted && scoreData.length >= 2 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={scoreData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} width={35} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="음식" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="활동" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="멘탈" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-400">
              <p className="text-sm">2주차부터 그래프가 표시돼요</p>
            </div>
          )}
        </div>

        {/* 주차별 기록 */}
        {weeklyRecords.length > 0 && (
          <div className="card p-5">
            <h3 className="font-bold text-gray-800 mb-0.5">주차별 기록</h3>
            <p className="text-xs text-gray-400 mb-3">각 점수는 100점 만점 기준</p>
            <div className="flex items-center justify-between pb-2 border-b border-gray-200 text-xs font-semibold text-gray-400">
              <span className="w-10">주차</span>
              <span className="w-14">몸무게</span>
              <span className="text-amber-500">식사</span>
              <span className="text-blue-500">활동</span>
              <span className="text-purple-500">마음</span>
            </div>
            <div className="space-y-0">
              {[{ week: 1, weight: basicInfo.weight, scores: week1Scores!, completedAt: "" }, ...weeklyRecords].map((r) => (
                <div key={r.week} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm font-semibold text-gray-700 w-10">{r.week}주</span>
                  <span className="text-sm text-gray-600 w-14">{r.weight}kg</span>
                  <span className="text-sm font-bold text-amber-600 w-10 text-center">{r.scores?.meal ?? "-"}</span>
                  <span className="text-sm font-bold text-blue-600 w-10 text-center">{r.scores?.mobility ?? "-"}</span>
                  <span className="text-sm font-bold text-purple-600 w-10 text-center">{r.scores?.mentation ?? "-"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 다음 주차 버튼 */}
        {currentWeek <= 12 && (
          weekLocked ? (
            <div className="w-full rounded-2xl bg-gray-100 border border-gray-200 p-4 text-center">
              <p className="text-sm font-bold text-gray-400">🔒 {recordWeekLabel}</p>
              <p className="text-xs text-gray-400 mt-1">{unlockLabel}</p>
            </div>
          ) : (
            <button
              onClick={() => currentWeek <= 11 ? router.push("/weekly") : router.push("/survey?week=12")}
              className="btn-primary"
            >
              {recordWeekLabel} →
            </button>
          )
        )}

        <button onClick={() => router.push("/")} className="btn-secondary">처음으로</button>
      </div>

      {/* 미션 상세 모달 */}
      {showMissionModal && currentMission && (
        <MissionDetailModal
          mission={currentMission}
          campWeek={campWeek}
          checked={missionChecked}
          onCheck={handleMissionCheck}
          onClose={() => setShowMissionModal(false)}
        />
      )}
    </main>
  );
}
