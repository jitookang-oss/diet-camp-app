"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadParticipant, getCurrentWeek } from "@/lib/store";

export default function WeeklyPage() {
  const router = useRouter();

  useEffect(() => {
    const data = loadParticipant();
    if (!data?.week1Scores) {
      router.push("/");
      return;
    }

    const week = getCurrentWeek(data);

    if (week > 11) {
      router.push("/survey?week=12");
    } else {
      router.push(`/survey?week=${week}`);
    }
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center text-gray-400">
        <div className="text-3xl mb-2">⏳</div>
        <p className="text-sm">이동 중...</p>
      </div>
    </main>
  );
}
