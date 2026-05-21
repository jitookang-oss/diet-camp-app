"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type Status = "loading" | "success" | "already" | "error";

const ICONS: Record<string, string> = {
  supplement: "💊",
  lunch_walk: "🚶",
  evening_exercise: "🌙",
};

function CheckinContent() {
  const params = useSearchParams();
  const [status, setStatus] = useState<Status>("loading");
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const type = params.get("type") ?? "";

  useEffect(() => {
    const date = params.get("date");
    const phone = params.get("phone");
    const token = params.get("token");

    if (!type || !date || !phone || !token) {
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
        else setStatus("error");
      })
      .catch(() => setStatus("error"));
  }, [params, type]);

  const icon = ICONS[type] ?? "✅";

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
      <div className="text-center py-16">
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
        <a
          href="/"
          className="mt-8 inline-block btn-primary"
        >
          앱으로 이동
        </a>
      </div>
    );
  }

  if (status === "already") {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-6">✔️</div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">이미 체크했어요!</h1>
        <p className="text-gray-500 mb-6">
          {name ? `${name}님은 ` : ""}오늘 {label} 이미 완료하셨어요.
        </p>
        <a href="/" className="inline-block btn-secondary">
          앱으로 이동
        </a>
      </div>
    );
  }

  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-6">❌</div>
      <h1 className="text-2xl font-black text-gray-900 mb-2">링크가 유효하지 않아요</h1>
      <p className="text-gray-500 mb-6">
        링크가 만료됐거나 잘못된 접근이에요.
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
            <p className="text-xs text-gray-400 tracking-widest uppercase">이지약국 다이어트 캠프</p>
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
