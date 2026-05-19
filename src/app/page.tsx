"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveParticipant, loadParticipant, ParticipantData } from "@/lib/store";
import { getCampDayInfo, CampDayInfo, CAMP_START_DATE } from "@/lib/missions";
import KoreanInput from "@/components/KoreanInput";

function DayCounter({ info }: { info: CampDayInfo }) {
  if (info.isBeforeStart) {
    const daysLeft = Math.abs(info.daysFromStart);
    return (
      <div className="card p-5 mb-6 text-center bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
        <p className="text-xs text-green-600 font-medium mb-1 uppercase tracking-wide">캠프 시작까지</p>
        <p className="text-5xl font-bold text-green-700 mb-1">
          D-{daysLeft}
        </p>
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

function MissionCard({ info }: { info: CampDayInfo }) {
  if (!info.currentMission) return null;
  const { currentMission, campWeek } = info;

  return (
    <div className="card p-5 mb-6 border-l-4 border-green-500">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{currentMission.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
              {campWeek}주차 미션
            </span>
          </div>
          <p className="font-bold text-gray-800 text-sm mb-1">{currentMission.title}</p>
          <p className="text-xs text-gray-500 leading-relaxed">{currentMission.detail}</p>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState("");
  const [existing, setExisting] = useState<ParticipantData | null>(null);
  const [campInfo, setCampInfo] = useState<CampDayInfo | null>(null);

  useEffect(() => {
    setExisting(loadParticipant());
    setCampInfo(getCampDayInfo());
  }, []);

  function handleStart(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !birthDate) {
      setError("이름과 생년월일을 모두 입력해주세요.");
      return;
    }

    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

    if (age < 10 || age > 100) {
      setError("올바른 생년월일을 입력해주세요.");
      return;
    }

    saveParticipant({
      basicInfo: {
        name: name.trim(),
        birthDate,
        age,
        gender: "여",
        height: 0,
        weight: 0,
        goalWeight: 0,
        bmi: 0,
        bmiCategory: "",
        medications: false,
        diseases: false,
      },
      weeklyRecords: [],
    });

    router.push("/onboarding");
  }

  function handleContinue() {
    const data = loadParticipant();
    if (!data) return;

    if (!data.week1Scores) {
      router.push("/onboarding");
    } else if ((data.weeklyRecords?.length ?? 0) < 10) {
      router.push("/weekly");
    } else if (!data.week12Scores) {
      router.push("/survey?week=12");
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
            <span className="text-green-700 font-semibold text-sm">이지약국</span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-500 text-sm">@보라매직</span>
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
        {campInfo && <MissionCard info={campInfo} />}

        {/* 기존 기록 있는 경우 */}
        {existing?.basicInfo?.name && (
          <div className="card p-5 mb-4 border-l-4 border-blue-400">
            <p className="text-sm text-gray-500 mb-1">이전에 시작한 기록이 있어요</p>
            <p className="font-semibold text-gray-800 mb-3">
              {existing.basicInfo.name}님 반갑습니다 👋
            </p>
            <button onClick={handleContinue} className="btn-primary">
              이어서 하기
            </button>
          </div>
        )}

        {/* 본인 인증 카드 */}
        <div className="card p-6">
          <h2 className="font-bold text-lg text-gray-800 mb-1">본인 인증</h2>
          <p className="text-sm text-gray-500 mb-6">이름과 생년월일로 시작해요</p>

          <form onSubmit={handleStart} className="space-y-4">
            <div>
              <label className="label-text">이름</label>
              <KoreanInput
                className="input-field"
                type="text"
                placeholder="홍길동"
                value={name}
                onChange={setName}
              />
            </div>

            <div>
              <label className="label-text">생년월일</label>
              <input
                className="input-field"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button type="submit" className="btn-primary mt-2">
              새로 시작하기 →
            </button>
          </form>
        </div>

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
    </main>
  );
}
