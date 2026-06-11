"use client";

import { useEffect, useRef, useState } from "react";
import { loadParticipant } from "@/lib/store";
import { WEEKLY_MISSIONS } from "@/lib/missions";
import { supabase } from "@/lib/supabase";
import KoreanInput from "@/components/KoreanInput";
import imageCompression from "browser-image-compression";

type CheckinType = "supplement" | "lunch_walk" | "evening_exercise" | "mission";

interface HubData {
  today: Record<CheckinType, boolean>;
  weekStats: Record<CheckinType, number>;
  participant: {
    name: string;
    my_supplements: string | null;
    body_type: string | null;
    weeklyRecordDone: boolean;
  };
  todayDate: string;
  campWeek: number;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
}

function formatMsgDate(isoStr: string): string {
  const d = new Date(new Date(isoStr).getTime() + 9 * 60 * 60 * 1000);
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`;
}

const ITEMS: { type: CheckinType; icon: string; label: string }[] = [
  { type: "supplement", icon: "💊", label: "아침 영양제" },
  { type: "lunch_walk", icon: "🚶", label: "점심 걷기" },
  { type: "evening_exercise", icon: "🌙", label: "저녁 운동스낵" },
  { type: "mission", icon: "🎯", label: "이번 주 미션" },
];

function KoreanTextarea({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const composing = useRef(false);
  const [local, setLocal] = useState(value);

  useEffect(() => {
    if (!composing.current) setLocal(value);
  }, [value]);

  return (
    <textarea
      className={className}
      value={local}
      placeholder={placeholder}
      rows={3}
      onChange={(e) => {
        setLocal(e.target.value);
        if (!composing.current) onChange(e.target.value);
      }}
      onCompositionStart={() => {
        composing.current = true;
      }}
      onCompositionEnd={(e) => {
        composing.current = false;
        const val = (e.target as HTMLTextAreaElement).value;
        setLocal(val);
        onChange(val);
      }}
    />
  );
}

function getCountdownMinutes(): number | null {
  const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const h = kstNow.getUTCHours();
  const m = kstNow.getUTCMinutes();
  if (h >= 2 && h < 22) return null;
  const minutesPast22 = h >= 22 ? (h - 22) * 60 + m : (h + 2) * 60 + m;
  return Math.max(0, 240 - minutesPast22);
}

function formatCountdown(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}시간 ${m}분 뒤에 체크인이 마감됩니다` : `${h}시간 뒤에 체크인이 마감됩니다`;
  }
  return `${minutes}분 뒤에 체크인이 마감됩니다`;
}

export default function CheckinPage() {
  const [phase, setPhase] = useState<"init" | "identify" | "ready">("init");
  const [countdownMinutes, setCountdownMinutes] = useState<number | null>(null);
  const [phone, setPhone] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [hub, setHub] = useState<HubData | null>(null);
  const [hubLoading, setHubLoading] = useState(false);
  const [editingSupplements, setEditingSupplements] = useState(false);
  const [supplementsInput, setSupplementsInput] = useState("");
  const [savingSupplements, setSavingSupplements] = useState(false);
  const [toggling, setToggling] = useState<CheckinType | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgOpen, setMsgOpen] = useState(false);

  useEffect(() => {
    function tick() { setCountdownMinutes(getCountdownMinutes()); }
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const invitePhone = localStorage.getItem("invite_phone");
    const participant = loadParticipant();
    const stored = participant?.basicInfo?.phone ?? invitePhone ?? null;
    if (stored) {
      setPhone(stored);
      loadHub(stored);
    } else {
      setPhase("identify");
    }
  }, []);

  async function loadMessages(p: string) {
    const res = await fetch(`/api/message?phone=${encodeURIComponent(p)}`);
    const data = await res.json();
    const msgs: Message[] = data.messages ?? [];
    setMessages(msgs);
    if (msgs.length > 0) setMsgOpen(true);
  }

  async function confirmMessage(id: string) {
    await fetch(`/api/message?id=${id}`, { method: "DELETE" });
    setMessages((prev) => {
      const next = prev.filter((m) => m.id !== id);
      if (next.length === 0) setMsgOpen(false);
      return next;
    });
  }

  async function loadPhoto(p: string, date: string) {
    const res = await fetch(`/api/food-photo?phone=${encodeURIComponent(p)}&date=${date}`);
    const data = await res.json();
    setPhotoUrl(data.photo_url ?? null);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !phone || !hub) return;

    if (file.size > 20 * 1024 * 1024) {
      setPhotoError("20MB 이하의 사진만 업로드할 수 있어요.");
      return;
    }

    setPhotoError("");
    setPhotoUploading(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1080,
        useWebWorker: true,
        fileType: "image/jpeg",
      });

      const formData = new FormData();
      formData.append("phone", phone);
      formData.append("file", compressed, "photo.jpg");

      const res = await fetch("/api/food-photo", { method: "POST", body: formData });
      const data = await res.json();

      if (data.success) {
        setPhotoUrl(data.photo_url);
      } else {
        setPhotoError(data.error ?? "업로드에 실패했어요. 다시 시도해주세요.");
      }
    } catch {
      setPhotoError("업로드 중 오류가 발생했어요. 다시 시도해주세요.");
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function loadHub(p: string) {
    setHubLoading(true);
    try {
      const res = await fetch(`/api/daily-checkin?phone=${encodeURIComponent(p)}`);
      const data = await res.json();
      if (!res.ok || data.error) {
        setPhase("identify");
        return;
      }
      setHub(data);
      setSupplementsInput(data.participant?.my_supplements ?? "");
      if (!data.participant?.my_supplements) setEditingSupplements(true);
      setPhase("ready");
      loadPhoto(p, data.todayDate);
      loadMessages(p);
    } finally {
      setHubLoading(false);
    }
  }

  async function handleLookup() {
    const last4 = nameInput.trim();
    if (!/^\d{4}$/.test(last4)) {
      setLookupError("숫자 4자리를 입력해주세요.");
      return;
    }
    setLookupError("");
    setLookupLoading(true);
    try {
      const { data } = await supabase
        .from("participants")
        .select("phone")
        .like("phone", `%${last4}`);
      if (!data || data.length === 0) {
        setLookupError("등록된 참여자를 찾을 수 없어요. 전화번호를 다시 확인해주세요.");
        return;
      }
      if (data.length > 1) {
        setLookupError("중복된 번호가 있어요. 운영자에게 문의해주세요.");
        return;
      }
      setPhone(data[0].phone);
      loadHub(data[0].phone);
    } finally {
      setLookupLoading(false);
    }
  }

  async function toggleCheckin(type: CheckinType) {
    if (!hub || !phone || toggling) return;
    setToggling(type);

    const wasChecked = hub.today[type];
    setHub((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        today: { ...prev.today, [type]: !wasChecked },
        weekStats: {
          ...prev.weekStats,
          [type]: wasChecked
            ? Math.max(0, prev.weekStats[type] - 1)
            : prev.weekStats[type] + 1,
        },
      };
    });

    const res = await fetch("/api/daily-checkin", {
      method: wasChecked ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, type }),
    });

    if (!res.ok) {
      setHub((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          today: { ...prev.today, [type]: wasChecked },
          weekStats: {
            ...prev.weekStats,
            [type]: wasChecked
              ? prev.weekStats[type] + 1
              : Math.max(0, prev.weekStats[type] - 1),
          },
        };
      });
    }
    setToggling(null);
  }

  async function saveSupplements() {
    if (!phone) return;
    setSavingSupplements(true);
    await fetch("/api/my-supplements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, my_supplements: supplementsInput }),
    });
    setHub((prev) =>
      prev
        ? {
            ...prev,
            participant: {
              ...prev.participant,
              my_supplements: supplementsInput,
            },
          }
        : null
    );
    setEditingSupplements(false);
    setSavingSupplements(false);
  }

  // ── Loading ──────────────────────────────────────────────────────
  if (phase === "init" || hubLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">🌿</div>
          <p className="text-sm text-gray-400">불러오는 중...</p>
        </div>
      </main>
    );
  }

  // ── 본인 확인 ────────────────────────────────────────────────────
  if (phase === "identify") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="card w-full max-w-sm p-8">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🌿</div>
            <p className="text-xs text-gray-400 tracking-widest uppercase mb-2">
              보라매직 다이어트 캠프
            </p>
            <h1 className="text-xl font-black text-gray-900">체크인</h1>
            <p className="text-sm text-gray-500 mt-2">
              전화번호 뒤 4자리를 입력해주세요
            </p>
          </div>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={4}
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
            onKeyDown={(e) => { if (e.key === "Enter") handleLookup(); }}
            placeholder="예: 1234"
            className="input-field w-full mb-3 text-center text-2xl tracking-widest font-bold"
          />
          {lookupError && (
            <p className="text-red-500 text-xs mb-3 text-center leading-relaxed">
              {lookupError}
            </p>
          )}
          <button
            onClick={handleLookup}
            disabled={lookupLoading || !nameInput.trim()}
            className="btn-primary"
          >
            {lookupLoading ? "확인 중..." : "확인"}
          </button>
        </div>
      </main>
    );
  }

  // ── 메인 체크인 화면 ─────────────────────────────────────────────
  if (!hub) return null;

  const { today, weekStats, participant, campWeek } = hub;
  const mission =
    campWeek >= 1 && campWeek <= 12 ? WEEKLY_MISSIONS[campWeek - 1] : null;
  const doneCount = Object.values(today).filter(Boolean).length;
  const mySupplements = participant.my_supplements ?? "";

  const isGracePeriod = new Date(Date.now() + 9 * 60 * 60 * 1000).getUTCHours() < 2;

  const [y, m, d] = hub.todayDate.split("-");
  const todayLabel = new Date(
    Number(y),
    Number(m) - 1,
    Number(d)
  ).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });

  return (
    <main className="min-h-screen pb-12">
      <div className="max-w-md mx-auto px-4 pt-8 space-y-4">

        {/* 헤더 */}
        <div className="text-center mb-2">
          <p className="text-xs text-gray-400 tracking-widest uppercase">
            보라매직 다이어트 캠프
          </p>
          <h1 className="text-2xl font-black text-gray-900 mt-1">
            {participant.name}님 👋
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {todayLabel}{isGracePeriod && " (어제)"}
          </p>
          {countdownMinutes !== null && (
            <div className={`mt-2 inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-full ${
              countdownMinutes < 60
                ? "bg-red-100 text-red-600"
                : "bg-amber-100 text-amber-700"
            }`}>
              ⏰ {formatCountdown(countdownMinutes)}
            </div>
          )}
          {doneCount === 4 ? (
            <div className="mt-3 inline-block bg-green-100 text-green-700 font-bold text-sm px-5 py-2 rounded-full">
              🎉 오늘 모두 완료! 정말 잘하셨어요!
            </div>
          ) : doneCount > 0 ? (
            <div className="mt-3 inline-block bg-blue-50 text-blue-600 text-sm px-4 py-1.5 rounded-full">
              {doneCount}개 완료 · {4 - doneCount}개 남았어요 💪
            </div>
          ) : null}
        </div>

        {/* 체크리스트 */}
        <div className="card p-5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
            {isGracePeriod ? "어제 체크리스트" : "오늘의 체크리스트"}
          </h2>
          <div className="space-y-3">
            {ITEMS.map(({ type, icon, label }) => {
              const checked = today[type];
              const isSupp = type === "supplement";
              const isMission = type === "mission";

              return (
                <div key={type}>
                  <button
                    onClick={() => toggleCheckin(type)}
                    disabled={toggling === type}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all text-left active:scale-[0.98] ${
                      checked
                        ? "bg-green-50 border-2 border-green-300"
                        : "bg-gray-50 border-2 border-transparent"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        checked
                          ? "bg-green-500 border-green-500"
                          : "border-gray-300"
                      }`}
                    >
                      {checked && (
                        <span className="text-white text-xs font-bold">✓</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg leading-none">{icon}</span>
                        <span
                          className={`font-semibold text-sm ${
                            checked
                              ? "text-green-800 line-through decoration-green-400"
                              : "text-gray-900"
                          }`}
                        >
                          {label}
                        </span>
                      </div>
                      {isSupp && !editingSupplements && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {mySupplements || "복용 중인 영양제를 입력해주세요 →"}
                        </p>
                      )}
                      {isMission && mission && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {mission.title}
                        </p>
                      )}
                    </div>
                  </button>

                  {/* 영양제 입력 영역 */}
                  {isSupp && (
                    <div className="mt-1 px-1">
                      {editingSupplements ? (
                        <div className="bg-blue-50 rounded-2xl p-4 mt-2">
                          <p className="text-xs font-semibold text-blue-800 mb-2">
                            복용 중인 영양제를 입력해주세요
                          </p>
                          <KoreanTextarea
                            value={supplementsInput}
                            onChange={setSupplementsInput}
                            placeholder="예: 비타민D 1000IU, 오메가3 1캡슐, 마그네슘"
                            className="input-field w-full text-sm resize-none"
                          />
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={saveSupplements}
                              disabled={savingSupplements}
                              className="flex-1 bg-green-600 text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-50"
                            >
                              {savingSupplements ? "저장 중..." : "저장"}
                            </button>
                            <button
                              onClick={() => {
                                setEditingSupplements(false);
                                setSupplementsInput(mySupplements);
                              }}
                              className="flex-1 border-2 border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2 px-3 py-1">
                          {mySupplements ? (
                            <>
                              <p className="text-xs text-gray-500 flex-1 leading-relaxed">
                                {mySupplements}
                              </p>
                              <button
                                onClick={() => setEditingSupplements(true)}
                                className="text-xs text-blue-500 font-medium flex-shrink-0"
                              >
                                수정
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setEditingSupplements(true)}
                              className="text-xs text-orange-500 font-semibold"
                            >
                              ⚠️ 복용 중인 영양제를 입력해 주세요
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 아침 식사 사진 */}
        <div className="card p-5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
            오늘의 아침 식사 📸
          </h2>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
          {photoUrl ? (
            <div>
              <div className="relative">
                <img
                  src={photoUrl}
                  alt="오늘의 아침 식사"
                  className="w-full rounded-2xl object-cover max-h-56"
                />
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  ✓ 완료
                </div>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={photoUploading}
                className="mt-3 w-full text-xs text-gray-400 font-medium py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                다시 찍기
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={photoUploading}
              className="w-full flex flex-col items-center justify-center gap-2 py-8 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-gray-300 transition-colors disabled:opacity-50"
            >
              {photoUploading ? (
                <>
                  <div className="text-3xl animate-pulse">📸</div>
                  <span className="text-sm font-medium text-gray-500">압축 및 업로드 중...</span>
                </>
              ) : (
                <>
                  <div className="text-3xl">📸</div>
                  <span className="text-sm font-medium text-gray-600">사진 업로드하기</span>
                  <span className="text-xs text-gray-400">카메라 또는 사진첩에서 선택</span>
                </>
              )}
            </button>
          )}
          {photoError && (
            <p className="text-red-500 text-xs mt-2 text-center">{photoError}</p>
          )}
        </div>

        {/* 약사 메시지 */}
        {messages.length > 0 && (
          <div className="card overflow-hidden">
            <button
              onClick={() => setMsgOpen((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-4"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">💌</span>
                <span className="font-bold text-gray-800 text-sm">이보라 약사님의 메시지</span>
                <span className="inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
                  {messages.length}
                </span>
              </div>
              <span className="text-gray-400 text-sm">{msgOpen ? "▲" : "▼"}</span>
            </button>
            {msgOpen && (
              <div className="border-t border-gray-100 px-5 py-4 space-y-4">
                {messages.map((msg, i) => (
                  <div key={msg.id}>
                    {i > 0 && <div className="border-t border-gray-100 mb-4" />}
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                    <div className="mt-4">
                      <span className="text-xs text-gray-400 block mb-3">{formatMsgDate(msg.created_at)}</span>
                      <button
                        onClick={() => confirmMessage(msg.id)}
                        className="w-full py-3 bg-green-500 hover:bg-green-600 active:scale-[0.98] text-white font-bold text-sm rounded-2xl transition-all"
                      >
                        확인했어요 !!
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 이번 주 달성률 */}
        <div className="card p-5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
            이번 주 달성률{" "}
            <span className="font-normal normal-case text-gray-300">
              ({campWeek}주차)
            </span>
          </h2>
          <div className="space-y-4">
            {ITEMS.map(({ type, icon, label }) => {
              const count = weekStats[type];
              const pct = Math.round((count / 7) * 100);
              return (
                <div key={type} className="flex items-center gap-3">
                  <span className="text-base w-5 text-center">{icon}</span>
                  <span className="text-xs text-gray-500 w-20 flex-shrink-0">
                    {label}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                    <div
                      className="bg-green-400 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-700 w-8 text-right">
                    {count}/7
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 주간 기록 알림 */}
        {!participant.weeklyRecordDone && campWeek >= 2 && (
          <div className="card p-5 border-2 border-orange-200 bg-orange-50">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📋</span>
              <div className="flex-1">
                <p className="font-bold text-orange-800 text-sm">
                  {campWeek}주차 기록이 아직 없어요
                </p>
                <p className="text-xs text-orange-600 mt-0.5">
                  몸무게와 주간 설문을 기록해주세요
                </p>
              </div>
              <a
                href="/weekly"
                className="bg-orange-500 text-white text-xs font-bold py-2 px-4 rounded-xl flex-shrink-0 whitespace-nowrap"
              >
                기록하기
              </a>
            </div>
          </div>
        )}

        {/* 대시보드 이동 */}
        <a
          href="/dashboard"
          className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
        >
          📊 내 대시보드 보기
        </a>
      </div>
    </main>
  );
}
