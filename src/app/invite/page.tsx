"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type Status = "loading" | "valid" | "onboarded" | "invalid";

function InviteContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [name, setName] = useState("");

  useEffect(() => {
    const token = params.get("token");
    if (!token) { setStatus("invalid"); return; }

    fetch(`/api/invite?token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setStatus("invalid"); return; }

        setName(data.name);

        // localStorage에 초대 정보 저장
        localStorage.setItem("invite_token", token);
        localStorage.setItem("invite_name", data.name);
        localStorage.setItem("invite_phone", data.phone);

        if (data.isOnboarded) {
          setStatus("onboarded");
        } else {
          setStatus("valid");
        }
      })
      .catch(() => setStatus("invalid"));
  }, [params]);

  if (status === "loading") {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4 animate-pulse">🔗</div>
        <p className="text-gray-500">초대 링크 확인 중이에요...</p>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-6">❌</div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">유효하지 않은 초대 링크예요</h1>
        <p className="text-gray-500">링크가 잘못됐거나 만료됐어요.<br />담당 약사에게 문의해주세요.</p>
      </div>
    );
  }

  if (status === "onboarded") {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-6">✅</div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">{name}님, 반가워요!</h1>
        <p className="text-gray-500 mb-8">이미 프로필이 완성되어 있어요.<br />대시보드에서 진행 현황을 확인해보세요.</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="btn-primary"
        >
          대시보드로 이동 →
        </button>
      </div>
    );
  }

  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-6">🌿</div>
      <h1 className="text-2xl font-black text-gray-900 mb-2">{name}님, 환영해요!</h1>
      <p className="text-gray-600 mb-2">이지약국 12주 다이어트 캠프에 초대됐어요.</p>
      <p className="text-sm text-gray-400 mb-8">아래 버튼을 눌러 기본 정보를 입력하면<br />캠프가 시작됩니다.</p>
      <button
        onClick={() => router.push("/onboarding")}
        className="btn-primary"
      >
        프로필 입력 시작하기 →
      </button>
    </div>
  );
}

export default function InvitePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-6">
            <p className="text-xs text-gray-400 tracking-widest uppercase">이지약국 다이어트 캠프</p>
          </div>
          <Suspense fallback={
            <div className="text-center py-10">
              <div className="text-4xl mb-4 animate-pulse">🔗</div>
              <p className="text-gray-500">확인 중이에요...</p>
            </div>
          }>
            <InviteContent />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
