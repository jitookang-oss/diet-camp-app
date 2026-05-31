"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadParticipant, saveParticipant, ParticipantData } from "@/lib/store";
import { getCampDayInfo, CampDayInfo, CAMP_START_DATE } from "@/lib/missions";
import MissionDetailModal from "@/components/MissionDetailModal";

function DayCounter({ info }: { info: CampDayInfo }) {
  if (info.isBeforeStart) {
    const daysLeft = Math.abs(info.daysFromStart);
    return (
      <div className="card p-5 mb-6 text-center bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
        <p className="text-xs text-green-600 font-medium mb-1 uppercase tracking-wide">캠프 시작까지</p>
        <p className="text-5xl font-bold text-green-700 mb-1">D-{daysLeft}</p>
        <p className="text-sm text-gray-500">
          {CAMP_START_DATE.toLocaleDateString("ko-KR", { month: "long", day: "numeric" })} 시작
        </p>
      </div>
    );
  }

  if (info.isAfterCamp) {
    return (
      <div className="card p-5 mb-6 text-center bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100">
        <p className="text-2xl mb-1">🏆</p>
        <p className="text-lg font-bold text-amber-700">12주 캠프 완료!</p>
        <p className="text-sm text-gray-500">수고하셨습니다</p>
      </div>
    );
  }

  return (
    <div className="card p-5 mb-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-green-600 font-medium uppercase tracking-wide mb-0.5">진행 중</p>
          <p className="text-2xl font-bold text-green-800">
            {info.campDay}일차 · {info.campWeek}주차
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 mb-0.5">전체 진행률</p>
          <p className="text-sm font-semibold text-gray-600">{info.campDay} / 84일</p>
        </div>
      </div>
      <div className="w-full bg-green-100 rounded-full h-2">
        <div
          className="bg-green-500 h-2 rounded-full transition-all"
          style={{ width: `${Math.min((info.campDay / 84) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}

function MissionCard({ info, onOpen }: { info: CampDayInfo; onOpen: () => void }) {
  if (!info.currentMission) return null;
  const { currentMission, campWeek } = info;
  return (
    <button
      onClick={onOpen}
      className="w-full card p-5 mb-6 border-l-4 border-green-500 text-left hover:bg-green-50 transition-colors"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{currentMission.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
              {campWeek}주차 미션
            </span>
            {currentMission.isConsultationWeek && (
              <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                상담 주간
              </span>
            )}
          </div>
          <p className="font-bold text-gray-800 text-sm mb-1">{currentMission.title}</p>
          <p className="text-xs text-gray-500 leading-relaxed">{currentMission.detail}</p>
        </div>
        <span className="text-green-500 text-sm flex-shrink-0 mt-0.5">→</span>
      </div>
    </button>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [existing, setExisting] = useState<ParticipantData | null>(null);
  const [campInfo, setCampInfo] = useState<CampDayInfo | null>(null);
  const [showMissionModal, setShowMissionModal] = useState(false);

  useEffect(() => {
    const d = loadParticipant();
    setExisting(d);
    setCampInfo(getCampDayInfo());
  }, []);

  const missionChecked =
    campInfo?.campWeek && existing?.missionChecks
      ? existing.missionChecks[campInfo.campWeek] ?? false
      : false;

  function handleMissionCheck() {
    if (!campInfo?.campWeek || !existing) return;
    const week = campInfo.campWeek;
    const newChecks = { ...(existing.missionChecks ?? {}), [week]: !missionChecked };
    const updated = { ...existing, missionChecks: newChecks };
    saveParticipant({ missionChecks: newChecks });
    setExisting(updated);
  }

  function handleContinue() {
    const data = loadParticipant();
    if (!data) return;
    if (!data.week1Scores) {
      router.push("/onboarding");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* 헤더 */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm mb-4">
            <span className="text-green-700 font-semibold text-sm">보라매직</span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-500 text-sm">@bora__magic</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">
            12주<br />다이어트 캠프
          </h1>
          <p className="text-gray-500 text-sm">
            3M 전략 기반 · 대사 체질 분석<br />
            개인 맞춤 웰니스 프로그램
          </p>
        </div>

        {/* D-day 카운터 */}
        {campInfo && <DayCounter info={campInfo} />}

        {/* 이번 주 미션 */}
        {campInfo && (
          <MissionCard info={campInfo} onOpen={() => setShowMissionModal(true)} />
        )}

        {/* 기존 기록 있는 경우 */}
        {existing?.basicInfo?.name ? (
          <div className="card p-5 mb-4 border-l-4 border-blue-400">
            <p className="text-sm text-gray-500 mb-1">이전에 시작한 기록이 있어요</p>
            <p className="font-semibold text-gray-800 mb-3">
              {existing.basicInfo.name}님 반갑습니다 👋
            </p>
            <button onClick={handleContinue} className="btn-primary">
              이어서 하기
            </button>
          </div>
        ) : (
          <div className="card p-6 text-center">
            <div className="text-4xl mb-3">🔗</div>
            <h2 className="font-bold text-lg text-gray-800 mb-2">초대 링크로 참여하세요</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              이 캠프는 초대된 분만 참여하실 수 있어요.<br />
              담당 약사에게 초대 링크를 받아 접속해주세요.
            </p>
          </div>
        )}

        {/* 3M 아이콘 */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          {[
            { icon: "🍽️", label: "Meal", desc: "식사 습관" },
            { icon: "🚶", label: "Mobility", desc: "활동 대사" },
            { icon: "🧘", label: "Mentation", desc: "마음 관리" },
          ].map((item) => (
            <div key={item.label} className="card p-3">
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="font-semibold text-green-700 text-sm">{item.label}</div>
              <div className="text-gray-500 text-xs">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 미션 상세 모달 */}
      {showMissionModal && campInfo?.currentMission && (
        <MissionDetailModal
          mission={campInfo.currentMission}
          campWeek={campInfo.campWeek}
          checked={missionChecked}
          onCheck={handleMissionCheck}
          onClose={() => setShowMissionModal(false)}
        />
      )}
    </main>
  );
}
