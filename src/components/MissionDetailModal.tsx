"use client";

import { Mission } from "@/lib/missions";
import { MISSION_DESCRIPTIONS } from "@/lib/mission-descriptions";

interface Props {
  mission: Mission;
  campWeek: number;
  checked: boolean;
  onCheck: () => void;
  onClose: () => void;
}

export default function MissionDetailModal({ mission, campWeek, checked, onCheck, onClose }: Props) {
  const paragraphs = MISSION_DESCRIPTIONS[campWeek] ?? [];

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[85vh] overflow-y-auto"
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

        {/* 미션 달성 체크 */}
        <div className="px-6 pb-8 pt-2 border-t border-gray-100">
          <button
            onClick={onCheck}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all ${
              checked
                ? "bg-green-100 text-green-700 border-2 border-green-400"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {checked ? "✓ 이번 주 미션 달성! (취소하려면 다시 누르세요)" : "이번 주 미션 달성했어요!"}
          </button>
        </div>
      </div>
    </div>
  );
}
