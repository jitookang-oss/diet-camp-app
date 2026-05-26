"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

interface Participant {
  id: string;
  name: string;
  birth_date: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  goal_weight: number;
  bmi: number;
  bmi_category: string;
  medications: boolean;
  medication_detail: string | null;
  diseases: boolean;
  disease_detail: string | null;
  menopause_symptoms: string[] | null;
  body_type: string | null;
  week1_scores: Record<string, number> | null;
  weekly_records: Array<{
    week: number;
    weight: number;
    scores: Record<string, number>;
    completedAt: string;
  }>;
  week12_scores: Record<string, number> | null;
  phone: string | null;
  invite_token: string | null;
  is_onboarded: boolean;
  updated_at: string;
}

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "";

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70 ? "bg-green-100 text-green-700" :
    score >= 50 ? "bg-yellow-100 text-yellow-700" :
    "bg-red-100 text-red-700";
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>
      {score}점
    </span>
  );
}

function ParticipantRow({ p, onClick }: { p: Participant; onClick: () => void }) {
  const latestRecord = p.weekly_records?.[p.weekly_records.length - 1];
  const currentWeight = latestRecord?.weight ?? p.weight;
  const weightLost = p.weight > 0 ? Math.round((p.weight - currentWeight) * 10) / 10 : null;
  const progress = p.weekly_records?.length ?? 0;

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={onClick}>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-800">{p.name}</span>
          {p.is_onboarded ? (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">온보딩완료</span>
          ) : (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">미완료</span>
          )}
        </div>
        <div className="text-xs text-gray-400">{p.phone ?? "번호없음"}</div>
      </td>
      <td className="py-3 px-4 text-sm text-gray-500">
        {p.gender || "-"} · {p.age > 0 ? `${p.age}세` : "-"}
      </td>
      <td className="py-3 px-4 text-sm text-gray-600">
        {p.bmi > 0 ? (
          <>
            <span className="font-medium">{p.bmi}</span>
            <span className="text-xs text-gray-400 ml-1">({p.bmi_category})</span>
          </>
        ) : "-"}
      </td>
      <td className="py-3 px-4 text-sm">
        {p.body_type ? (
          <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded-full">
            {p.body_type}
          </span>
        ) : <span className="text-gray-300">미완료</span>}
      </td>
      <td className="py-3 px-4 text-sm">
        {p.week1_scores ? <ScoreBadge score={p.week1_scores.total ?? 0} /> : <span className="text-gray-300">-</span>}
      </td>
      <td className="py-3 px-4 text-sm">
        {weightLost !== null && weightLost > 0 ? (
          <span className="text-green-600 font-medium">-{weightLost}kg</span>
        ) : weightLost !== null && weightLost < 0 ? (
          <span className="text-red-500 font-medium">+{Math.abs(weightLost)}kg</span>
        ) : "-"}
      </td>
      <td className="py-3 px-4 text-sm text-gray-500">{progress}주 완료</td>
    </tr>
  );
}

function ParticipantDetail({
  p,
  password,
  onClose,
  onDeleted,
}: {
  p: Participant;
  password: string;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://diet-camp-app.vercel.app";
  const inviteUrl = p.invite_token ? `${baseUrl}/invite?token=${p.invite_token}` : null;

  function handleCopyLink() {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch("/api/admin/participants", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, id: p.id, phone: p.phone }),
    });
    setDeleting(false);
    if (res.ok) {
      onDeleted();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg text-gray-800">{p.name}</h2>
              {p.is_onboarded ? (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">온보딩완료</span>
              ) : (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">미완료</span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {p.gender || "-"} · {p.age > 0 ? `${p.age}세` : "-"} · {p.phone ?? "번호없음"}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="p-6 space-y-5">
          {/* 초대 링크 */}
          {inviteUrl && (
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-700 mb-2">초대 링크</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={inviteUrl}
                  className="flex-1 text-xs bg-white border border-blue-200 rounded-lg px-3 py-2 text-gray-600 truncate"
                />
                <button
                  onClick={handleCopyLink}
                  className="text-xs font-semibold px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap"
                >
                  {copied ? "복사됨 ✓" : "복사"}
                </button>
              </div>
            </div>
          )}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">신체 정보</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "키", value: p.height > 0 ? `${p.height}cm` : "-" },
                { label: "시작 몸무게", value: p.weight > 0 ? `${p.weight}kg` : "-" },
                { label: "목표 몸무게", value: p.goal_weight > 0 ? `${p.goal_weight}kg` : "-" },
                { label: "BMI", value: p.bmi > 0 ? `${p.bmi}` : "-" },
                { label: "비만도", value: p.bmi_category || "-" },
                { label: "체질 유형", value: p.body_type || "-" },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
                  <p className="font-semibold text-gray-800 text-sm">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {(p.medications || p.diseases || (p.menopause_symptoms?.length ?? 0) > 0) && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">건강 상태</h3>
              <div className="space-y-2 text-sm">
                {p.medications && (
                  <div className="bg-orange-50 rounded-xl px-3 py-2">
                    <span className="font-medium text-orange-700">복용약:</span>{" "}
                    <span className="text-gray-700">{p.medication_detail || "있음"}</span>
                  </div>
                )}
                {p.diseases && (
                  <div className="bg-red-50 rounded-xl px-3 py-2">
                    <span className="font-medium text-red-700">질환:</span>{" "}
                    <span className="text-gray-700">{p.disease_detail || "있음"}</span>
                  </div>
                )}
                {(p.menopause_symptoms?.length ?? 0) > 0 && (
                  <div className="bg-purple-50 rounded-xl px-3 py-2">
                    <span className="font-medium text-purple-700">갱년기 증상:</span>{" "}
                    <span className="text-gray-700">{p.menopause_symptoms!.join(", ")}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {(p.week1_scores || p.week12_scores) && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">3M 점수 비교</h3>
              <div className="grid grid-cols-2 gap-3">
                {(["meal", "mobility", "mentation", "total"] as const).map((key) => {
                  const label = key === "total" ? "종합" : key === "meal" ? "식사(Meal)" : key === "mobility" ? "활동(Mobility)" : "마음(Mentation)";
                  const before = p.week1_scores?.[key] ?? null;
                  const after = p.week12_scores?.[key] ?? null;
                  return (
                    <div key={key} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-1">{label}</p>
                      <div className="flex items-center gap-2">
                        {before !== null ? <span className="text-sm font-medium text-gray-600">{before}점</span> : <span className="text-gray-300 text-sm">-</span>}
                        {before !== null && after !== null && <span className="text-gray-300">→</span>}
                        {after !== null ? (
                          <span className={`text-sm font-bold ${after > (before ?? 0) ? "text-green-600" : "text-red-500"}`}>
                            {after}점
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(p.weekly_records?.length ?? 0) > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">주차별 몸무게</h3>
              <div className="space-y-2">
                {p.weekly_records.map((rec, i) => {
                  const prev = i === 0 ? p.weight : p.weekly_records[i - 1].weight;
                  const diff = Math.round((rec.weight - prev) * 10) / 10;
                  return (
                    <div key={rec.week} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 text-sm">
                      <span className="w-12 text-gray-500">{rec.week}주차</span>
                      <span className="w-16 font-medium">{rec.weight}kg</span>
                      <span className={`w-12 text-xs font-semibold ${diff < 0 ? "text-green-600" : diff > 0 ? "text-red-500" : "text-gray-400"}`}>
                        {diff > 0 ? "+" : ""}{diff}kg
                      </span>
                      <ScoreBadge score={rec.scores?.total ?? 0} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 삭제 */}
          <div className="pt-2 border-t border-gray-100">
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full text-sm text-red-500 hover:text-red-700 font-semibold py-2 rounded-xl hover:bg-red-50 transition-colors"
              >
                참여자 삭제
              </button>
            ) : (
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <p className="text-sm font-semibold text-red-700 mb-3">
                  {p.name}님의 모든 데이터가 삭제됩니다. 정말 삭제할까요?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="btn-secondary flex-1 text-sm py-2"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 text-sm py-2 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50"
                  >
                    {deleting ? "삭제 중..." : "삭제 확인"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 단건 등록 모달
function AddParticipantModal({
  password,
  onClose,
  onSuccess,
}: {
  password: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const cleanPhone = phone.replace(/-/g, "");
    if (!name.trim()) { setError("이름을 입력해주세요."); return; }
    if (!/^0\d{9,10}$/.test(cleanPhone)) { setError("올바른 전화번호를 입력해주세요. (예: 01012345678)"); return; }

    setLoading(true);
    const res = await fetch("/api/admin/participants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, participants: [{ name: name.trim(), phone: cleanPhone }] }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error ?? "등록 실패"); return; }
    onSuccess();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-bold text-lg text-gray-800">참여자 추가</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
            <input
              className="input-field"
              type="text"
              placeholder="홍길동"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
            <input
              className="input-field"
              type="tel"
              placeholder="01012345678 (하이픈 없이)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">취소</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? "등록 중..." : "등록하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 엑셀 업로드 모달
function ExcelUploadModal({
  password,
  onClose,
  onSuccess,
}: {
  password: string;
  onClose: () => void;
  onSuccess: (count: number) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<Array<{ name: string; phone: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });

        const parsed = rows
          .map((row) => {
            // 열 이름 유연하게 파싱 (이름/성명/Name, 전화번호/핸드폰/Phone 등)
            const name =
              row["이름"] || row["성명"] || row["Name"] || row["name"] || "";
            const phone =
              row["전화번호"] || row["핸드폰"] || row["휴대폰"] || row["Phone"] || row["phone"] || row["연락처"] || "";
            return {
              name: String(name).trim(),
              phone: String(phone).replace(/-/g, "").trim(),
            };
          })
          .filter((r) => r.name && r.phone);

        if (parsed.length === 0) {
          setError("이름/전화번호 열을 찾을 수 없어요. 열 이름을 확인해주세요.");
          return;
        }
        setPreview(parsed);
      } catch {
        setError("파일을 읽는 중 오류가 발생했어요.");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async function handleUpload() {
    setError("");
    setLoading(true);
    const res = await fetch("/api/admin/participants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, participants: preview }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error ?? "업로드 실패"); return; }
    onSuccess(data.added ?? preview.length);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
          <h2 className="font-bold text-lg text-gray-800">엑셀 일괄 업로드</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="p-6 space-y-5">
          {/* 형식 안내 */}
          <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700 space-y-1">
            <p className="font-semibold">엑셀 파일 형식</p>
            <p>첫 번째 행은 열 이름, 아래 열이 있어야 해요:</p>
            <div className="mt-2 bg-white rounded-lg p-3 font-mono text-xs text-gray-700">
              <div className="grid grid-cols-2 gap-2">
                <span className="bg-gray-100 px-2 py-1 rounded">이름</span>
                <span className="bg-gray-100 px-2 py-1 rounded">전화번호</span>
                <span className="px-2 py-1 text-gray-500">홍길동</span>
                <span className="px-2 py-1 text-gray-500">01012345678</span>
              </div>
            </div>
            <p className="text-xs text-blue-500 mt-1">성명·Name, 핸드폰·휴대폰·연락처·Phone도 인식돼요</p>
          </div>

          {/* 파일 선택 */}
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFile}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="btn-secondary w-full"
            >
              {fileName ? `📄 ${fileName}` : "파일 선택 (.xlsx / .csv)"}
            </button>
          </div>

          {/* 미리보기 */}
          {preview.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">
                미리보기 — 총 {preview.length}명
              </p>
              <div className="border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs text-gray-500 font-semibold">#</th>
                      <th className="text-left px-3 py-2 text-xs text-gray-500 font-semibold">이름</th>
                      <th className="text-left px-3 py-2 text-xs text-gray-500 font-semibold">전화번호</th>
                      <th className="text-left px-3 py-2 text-xs text-gray-500 font-semibold">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => {
                      const valid = row.name && /^0\d{9,10}$/.test(row.phone);
                      return (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                          <td className="px-3 py-2 font-medium text-gray-800">{row.name}</td>
                          <td className="px-3 py-2 text-gray-600">{row.phone}</td>
                          <td className="px-3 py-2">
                            {valid ? (
                              <span className="text-green-600 text-xs font-semibold">✓</span>
                            ) : (
                              <span className="text-red-500 text-xs font-semibold">오류</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {preview.some((r) => !/^0\d{9,10}$/.test(r.phone)) && (
                <p className="text-xs text-red-500 mt-2">오류 항목은 전화번호를 확인해주세요 (예: 01012345678)</p>
              )}
            </div>
          )}

          {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1">취소</button>
            <button
              onClick={handleUpload}
              disabled={loading || preview.length === 0 || preview.some((r) => !/^0\d{9,10}$/.test(r.phone))}
              className="btn-primary flex-1"
            >
              {loading ? "업로드 중..." : `${preview.length}명 등록하기`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const CHECKIN_TYPES = [
  { key: "supplement", label: "영양제", icon: "💊" },
  { key: "lunch_walk", label: "점심 걷기", icon: "🚶" },
  { key: "evening_exercise", label: "저녁 운동", icon: "🌙" },
] as const;

interface CheckinRecord {
  phone: string;
  name: string;
  type: string;
}

function CheckinTab({ participants }: { participants: Participant[] }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(todayStr);
  const [checkins, setCheckins] = useState<CheckinRecord[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchCheckins(d: string) {
    setLoading(true);
    const { data } = await supabase
      .from("daily_checkins")
      .select("phone, name, type")
      .eq("check_date", d);
    setCheckins((data as CheckinRecord[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchCheckins(date); }, [date]);

  const checkinSet = new Set(checkins.map((c) => `${c.phone}::${c.type}`));

  const summary = CHECKIN_TYPES.map((t) => ({
    ...t,
    count: checkins.filter((c) => c.type === t.key).length,
    total: participants.filter((p) => p.phone).length,
  }));

  return (
    <div>
      {/* 날짜 선택 + 새로고침 */}
      <div className="flex items-center gap-3 mb-5">
        <input
          type="date"
          value={date}
          max={todayStr}
          onChange={(e) => setDate(e.target.value)}
          className="input-field w-auto px-3 py-2 text-sm"
        />
        <button
          onClick={() => fetchCheckins(date)}
          className="btn-secondary text-sm px-4 py-2"
        >
          새로고침
        </button>
        {date === todayStr && (
          <span className="text-xs text-green-600 font-semibold bg-green-50 px-3 py-1 rounded-full">오늘</span>
        )}
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {summary.map((t) => (
          <div key={t.key} className="card p-4 text-center">
            <div className="text-2xl mb-1">{t.icon}</div>
            <div className="text-xs text-gray-500 mb-1">{t.label}</div>
            <div className="text-2xl font-black text-gray-800">
              {t.count}
              <span className="text-sm font-normal text-gray-400"> / {t.total}</span>
            </div>
            {t.total > 0 && (
              <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${Math.round((t.count / t.total) * 100)}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 참여자별 체크인 현황 테이블 */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">불러오는 중...</div>
      ) : participants.filter((p) => p.phone).length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>전화번호가 등록된 참여자가 없어요</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">이름</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">전화번호</th>
                {CHECKIN_TYPES.map((t) => (
                  <th key={t.key} className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                    {t.icon} {t.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {participants
                .filter((p) => p.phone)
                .map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 px-4 font-semibold text-gray-800 text-sm">{p.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-400">{p.phone}</td>
                    {CHECKIN_TYPES.map((t) => {
                      const done = checkinSet.has(`${p.phone}::${t.key}`);
                      return (
                        <td key={t.key} className="py-3 px-4 text-center">
                          {done ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 bg-green-100 text-green-600 rounded-full text-sm font-bold">✓</span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-7 h-7 bg-gray-100 text-gray-300 rounded-full text-sm">–</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Participant | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [toast, setToast] = useState("");
  const [activeTab, setActiveTab] = useState<"participants" | "checkin">("participants");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
    } else {
      setPwError(true);
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function fetchParticipants() {
    setLoading(true);
    const { data } = await supabase
      .from("participants")
      .select("*")
      .order("updated_at", { ascending: false });
    setParticipants((data as Participant[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (authed) fetchParticipants();
  }, [authed]);

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="card p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="text-3xl mb-2">🔐</div>
            <h1 className="font-bold text-xl text-gray-800">관리자 로그인</h1>
            <p className="text-sm text-gray-500 mt-1">이지약국 전용</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              className="input-field"
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPwError(false); }}
            />
            {pwError && <p className="text-red-500 text-sm text-center">비밀번호가 틀렸어요</p>}
            <button type="submit" className="btn-primary">로그인</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* 헤더 */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">관리자</h1>
            <p className="text-sm text-gray-500 mt-0.5">이지약국 12주 다이어트 캠프</p>
          </div>
          {activeTab === "participants" && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-green-100 text-green-700 font-semibold px-4 py-2 rounded-full text-sm">
                총 {participants.length}명
              </span>
              <button
                onClick={() => setShowExcelModal(true)}
                className="btn-secondary text-sm px-4 py-2"
              >
                📊 엑셀 업로드
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary text-sm px-4 py-2"
              >
                + 참여자 추가
              </button>
            </div>
          )}
        </div>

        {/* 탭 */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          {([
            { key: "participants", label: "참여자 목록" },
            { key: "checkin", label: "체크인 현황" },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        {activeTab === "participants" && (
          loading ? (
            <div className="text-center py-20 text-gray-400">불러오는 중...</div>
          ) : participants.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-4xl mb-3">📭</div>
              <p className="mb-4">아직 참여자가 없어요</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setShowExcelModal(true)} className="btn-secondary">
                  📊 엑셀로 일괄 등록
                </button>
                <button onClick={() => setShowAddModal(true)} className="btn-primary">
                  + 한 명씩 추가
                </button>
              </div>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">이름 / 전화번호</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">성별 · 나이</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">BMI</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">체질</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">초기점수</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">감량</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">진행</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p) => (
                    <ParticipantRow key={p.id} p={p} onClick={() => setSelected(p)} />
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {activeTab === "checkin" && (
          <CheckinTab participants={participants} />
        )}
      </div>

      {/* 상세 모달 */}
      {selected && (
        <ParticipantDetail
          p={selected}
          password={password}
          onClose={() => setSelected(null)}
          onDeleted={() => {
            setSelected(null);
            fetchParticipants();
            showToast(`${selected.name}님이 삭제됐어요.`);
          }}
        />
      )}

      {/* 참여자 추가 모달 */}
      {showAddModal && (
        <AddParticipantModal
          password={password}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchParticipants();
            showToast("참여자가 등록됐어요!");
          }}
        />
      )}

      {/* 엑셀 업로드 모달 */}
      {showExcelModal && (
        <ExcelUploadModal
          password={password}
          onClose={() => setShowExcelModal(false)}
          onSuccess={(count) => {
            setShowExcelModal(false);
            fetchParticipants();
            showToast(`${count}명이 등록됐어요!`);
          }}
        />
      )}

      {/* 토스트 알림 */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm font-semibold px-5 py-3 rounded-full shadow-lg z-50">
          {toast}
        </div>
      )}
    </main>
  );
}
