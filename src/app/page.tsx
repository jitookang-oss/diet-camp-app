"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveParticipant, loadParticipant, ParticipantData } from "@/lib/store";
import KoreanInput from "@/components/KoreanInput";

export default function HomePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState("");
  const [existing, setExisting] = useState<ParticipantData | null>(null);

  useEffect(() => {
    setExisting(loadParticipant());
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
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm mb-6">
            <span className="text-green-700 font-semibold text-sm">이지약국</span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-500 text-sm">@보라매직</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3 leading-tight">
            12주<br />다이어트 캠프
          </h1>
          <p className="text-gray-500 text-sm">
            3M 전략 기반 · 대사 체질 분석<br />
            개인 맞춤 웰니스 프로그램
          </p>
        </div>

        {/* 기존 기록 있는 경우 */}
        {existing?.basicInfo?.name && (
          <div className="card p-5 mb-4 border-l-4 border-green-500">
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
        <div className="mt-8 grid grid-cols-3 gap-3 text-center">
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
