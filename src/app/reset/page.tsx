"use client";

import { useState } from "react";

export default function ResetPage() {
  const [done, setDone] = useState(false);

  function handleReset() {
    localStorage.clear();
    setDone(true);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="card p-8 text-center">
          <p className="text-xs text-gray-400 tracking-widest uppercase mb-6">보라매직 다이어트 캠프</p>

          {done ? (
            <>
              <div className="text-5xl mb-4">✅</div>
              <h1 className="text-xl font-black text-gray-900 mb-2">초기화 완료</h1>
              <p className="text-gray-500 text-sm mb-6">이 기기의 저장된 데이터가 모두 지워졌어요.</p>
              <a href="/" className="btn-primary inline-block">홈으로 이동</a>
            </>
          ) : (
            <>
              <div className="text-5xl mb-4">🗑️</div>
              <h1 className="text-xl font-black text-gray-900 mb-2">데이터 초기화</h1>
              <p className="text-gray-500 text-sm mb-6">
                이 기기에 저장된 앱 데이터를 모두 지웁니다.<br />
                초대 링크로 다시 시작할 수 있어요.
              </p>
              <button onClick={handleReset} className="btn-primary w-full">
                초기화하기
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
