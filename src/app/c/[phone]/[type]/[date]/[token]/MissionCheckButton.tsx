"use client";

import { useEffect, useState } from "react";

type MissionStatus = "idle" | "loading" | "done" | "already";

export default function MissionCheckButton({ phone, date }: { phone: string; date: string }) {
  const [status, setStatus] = useState<MissionStatus>("idle");

  useEffect(() => {
    fetch(`/api/mission-check?phone=${encodeURIComponent(phone)}&date=${date}`)
      .then((r) => r.json())
      .then((d) => { if (d.checked) setStatus("already"); })
      .catch(() => {});
  }, [phone, date]);

  async function handleCheck() {
    if (status !== "idle") return;
    setStatus("loading");
    const res = await fetch("/api/mission-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, date }),
    });
    const data = await res.json();
    setStatus(data.success ? "done" : data.already ? "already" : "idle");
  }

  if (status === "done" || status === "already") {
    return (
      <div className="mt-6 bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
        <p className="text-green-700 font-semibold text-sm">🎯 오늘 주간 미션 체크 완료!</p>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-gray-100 pt-6">
      <p className="text-sm text-gray-500 text-center mb-3">오늘 주간 미션도 수행하셨나요?</p>
      <button
        onClick={handleCheck}
        disabled={status === "loading"}
        className="w-full py-3 rounded-2xl bg-green-600 text-white font-semibold text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {status === "loading" ? "기록 중..." : "🎯 오늘 미션 수행했어요!"}
      </button>
    </div>
  );
}
