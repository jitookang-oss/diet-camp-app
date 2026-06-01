"use client";

import { useEffect, useState, useCallback } from "react";
import { Mission, getWeekDates } from "@/lib/missions";
import { MISSION_DESCRIPTIONS } from "@/lib/mission-descriptions";

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

function getKSTToday() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

interface Props {
  mission: Mission;
  campWeek: number;
  phone?: string;
  onClose: () => void;
}

export default function MissionDetailModal({ mission, campWeek, phone, onClose }: Props) {
  const paragraphs = MISSION_DESCRIPTIONS[campWeek] ?? [];
  const weekDates = getWeekDates(campWeek);
  const kstToday = getKSTToday();

  const [checkedDates, setCheckedDates] = useState<Set<string>>(new Set());
  const [toggling, setToggling] = useState<string | null>(null);

  const loadChecks = useCallback(async () => {
    if (!phone) return;
    const res = await fetch(
      `/api/mission-check?phone=${encodeURIComponent(phone)}&weekStart=${weekDates[0]}`
    );
    const json = await res.json();
    setCheckedDates(new Set(json.checkedDates ?? []));
  }, [phone, weekDates[0]]);

  useEffect(() => {
    loadChecks();
  }, [loadChecks]);

  async function toggleDate(date: string) {
    if (!phone || toggling) return;
    setToggling(date);
    const isChecked = checkedDates.has(date);

    if (isChecked) {
      await fetch("/api/mission-check", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, date }),
      });
      setCheckedDates((prev) => { const s = new Set(prev); s.delete(date); return s; });
    } else {
      await fetch("/api/mission-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, date }),
      });
      setCheckedDates((prev) => new Set([...prev, date]));
    }
    setToggling(null);
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 핸들 바 (모바일) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* 헤더 */}
        <div className="sticky top-0 bg-white px-6 pt-4 pb-3 border-b border-gray-100 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{mission.icon}</span>
            <div>
              <p className="text-xs font-semibold text-green-600 mb-0.5">{campWeek}주차 미션</p>
              <h2 className="font-bold text-gray-900 text-base leading-snug">{mission.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none flex-shrink-0 mt-0.5"
          >
            ×
          </button>
        </div>

        {/* 상담 주간 배지 */}
        {mission.isConsultationWeek && (
          <div className="mx-6 mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-sm font-bold text-amber-800">📋 이번 주는 집중 상담 주간이에요</p>
            <p className="text-xs text-amber-700 mt-0.5">
              설문 결과를 바탕으로 인스타그램 DM(@bora__magic)으로 개별 연락드릴 예정이에요.
            </p>
          </div>
        )}

        {/* 본문 */}
        <div className="px-6 py-5 space-y-4">
          {paragraphs.length > 0 ? (
            paragraphs.map((para, i) => (
              <p key={i} className="text-sm text-gray-700 leading-relaxed">
                {para}
              </p>
            ))
          ) : (
            <p className="text-sm text-gray-500">{mission.detail}</p>
          )}
        </div>

        {/* 요일별 미션 체크 */}
        <div className="px-6 pb-8 pt-2 border-t border-gray-100">
          <p className="text-sm font-bold text-gray-700 mb-3">
            이번 주 미션 달성한 날을 체크하세요
          </p>
          {!phone ? (
            <p className="text-xs text-gray-400 text-center py-4">
              전화번호가 등록된 참여자만 이용할 수 있어요
            </p>
          ) : (
            <div className="grid grid-cols-7 gap-1.5">
              {weekDates.map((date, i) => {
                const isChecked = checkedDates.has(date);
                const isToday = date === kstToday;
                const isFuture = date > kstToday;
                const isToggling = toggling === date;
                const monthDay = date.slice(5).replace("-", "/");

                return (
                  <button
                    key={date}
                    onClick={() => !isFuture && toggleDate(date)}
                    disabled={isFuture || isToggling}
                    className={[
                      "flex flex-col items-center py-2.5 rounded-xl transition-colors",
                      isChecked
                        ? "bg-green-100 border-2 border-green-400 text-green-700"
                        : isFuture
                        ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                        : isToday
                        ? "bg-white border-2 border-gray-300 text-gray-500 hover:border-green-400"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                      isToggling ? "opacity-50" : "",
                    ].join(" ")}
                  >
                    <span className="text-xs font-bold">{DAY_LABELS[i]}</span>
                    <span className="text-[10px] mt-0.5 opacity-70">{monthDay}</span>
                    <span className="mt-1 text-xs font-bold">
                      {isChecked ? "✓" : isToggling ? "…" : "·"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          {checkedDates.size > 0 && (
            <p className="text-xs text-green-600 font-semibold text-center mt-3">
              이번 주 {checkedDates.size}일 달성 중! 💪
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
