"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type Status = "loading" | "success" | "already" | "error";
type MissionStatus = "idle" | "loading" | "done" | "already";

const ICONS: Record<string, string> = {
  supplement: "💊",
  lunch_walk: "🚶",
  evening_exercise: "🌙",
};

function MissionCheckButton({ phone, date }: { phone: string; date: string }) {
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

function CheckinContent() {
  const params = useSearchParams();
  const [status, setStatus] = useState<Status>("loading");
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const type = params.get("type") ?? "";
  const date = params.get("date") ?? "";
  const phone = params.get("phone") ?? "";

  useEffect(() => {
    const token = params.get("token");

    if (!type || !date || !phone || !token) {
      setErrorMsg(`파라미터 누락 — type:${type || "없음"} date:${date || "없음"} phone:${phone ? "있음" : "없음"} token:${token ? "있음" : "없음"}`);
      setStatus("error");
      return;
    }

    fetch(`/api/checkin?type=${type}&date=${date}&phone=${encodeURIComponent(phone)}&token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        setName(data.name ?? "");
        setLabel(data.label ?? "");
        if (data.success) setStatus("success");
        else if (data.already) setStatus("already");
        else {
          setErrorMsg(data.error ?? "알 수 없는 오류");
          setStatus("error");
        }
      })
      .catch((e) => {
        setErrorMsg(`네트워크 오류: ${String(e)}`);
        setStatus("error");
      });
  }, [params, type, date, phone]);

  const icon = ICONS[type] ?? "✅";
  const isEvening = type === "evening_exercise";

  if (status === "loading") {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4 animate-pulse">⏳</div>
        <p className="text-gray-500">확인 중이에요...</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="text-center py-10">
        <div className="text-6xl mb-6">{icon}</div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">
          {name ? `${name}님, ` : ""}체크 완료!
        </h1>
        <p className="text-green-700 font-semibold text-lg mb-6">
          {label} 기록됐어요 🎉
        </p>
        <div className="bg-green-50 rounded-2xl p-5 max-w-xs mx-auto">
          <p className="text-sm text-gray-600 leading-relaxed">
            오늘도 건강한 하루를 보내고 계시네요.<br />
            꾸준함이 변화를 만들어요!
          </p>
        </div>
        {isEvening && phone && date && (
          <MissionCheckButton phone={phone} date={date} />
        )}
        <button
          onClick={() => window.close()}
          className="mt-6 btn-primary"
        >
          확인 완료 ✅
        </button>
      </div>
    );
  }

  if (status === "already") {
    return (
      <div className="text-center py-10">
        <div className="text-6xl mb-6">✔️</div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">이미 체크했어요!</h1>
        <p className="text-gray-500 mb-6">
          {name ? `${name}님은 ` : ""}오늘 {label} 이미 완료하셨어요.
        </p>
        {isEvening && phone && date && (
          <MissionCheckButton phone={phone} date={date} />
        )}
        <button
          onClick={() => window.close()}
          className="mt-6 btn-secondary"
        >
          확인 완료 ✅
        </button>
      </div>
    );
  }

  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-6">❌</div>
      <h1 className="text-2xl font-black text-gray-900 mb-2">오류가 발생했어요</h1>
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-left">
          <p className="text-xs text-red-600 font-mono break-all">{errorMsg}</p>
        </div>
      )}
      <p className="text-gray-500 mb-6">
        아래 오류 내용을 약사님께 전달해 주세요.
      </p>
      <a href="/" className="inline-block btn-secondary">
        홈으로 이동
      </a>
    </div>
  );
}

export default function CheckinPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-6">
            <p className="text-xs text-gray-400 tracking-widest uppercase">보라매직 다이어트 캠프</p>
          </div>
          <Suspense fallback={
            <div className="text-center py-10">
              <div className="text-4xl mb-4 animate-pulse">⏳</div>
              <p className="text-gray-500">확인 중이에요...</p>
            </div>
          }>
            <CheckinContent />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
