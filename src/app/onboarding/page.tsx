"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadParticipant, saveParticipant, calculateBMI, BasicInfo } from "@/lib/store";
import KoreanInput from "@/components/KoreanInput";

const MENOPAUSE_ITEMS = [
  "생리 주기가 불규칙하거나 변화가 있음",
  "얼굴 홍조나 열감이 있음",
  "수면의 질이 낮거나 자다가 식은땀이 남",
  "감정 기복이 심하거나 예민해짐",
  "체중 변화 또는 복부지방이 늘었음",
  "피부 건조·탄력 저하 또는 탈모",
  "피로감이 지속되거나 무기력함",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [info, setInfo] = useState<Partial<BasicInfo>>({});
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [gender, setGender] = useState<"남" | "여">("여");
  const [medications, setMedications] = useState(false);
  const [medicationDetail, setMedicationDetail] = useState("");
  const [diseases, setDiseases] = useState(false);
  const [diseaseDetail, setDiseaseDetail] = useState("");
  const [menopause, setMenopause] = useState<string[]>([]);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    const data = loadParticipant();
    if (data?.basicInfo?.name) {
      // 기존 데이터가 있어도 step 0(개인정보 동의)은 항상 표시
      setInfo(data.basicInfo);
      setGender(data.basicInfo.gender ?? "여");
      setHeight(String(data.basicInfo.height || ""));
      setWeight(String(data.basicInfo.weight || ""));
      setPhone(data.basicInfo.phone ?? "");
      return;
    }
    const inviteName = localStorage.getItem("invite_name");
    const invitePhone = localStorage.getItem("invite_phone");
    if (inviteName) {
      setInfo({ name: inviteName, phone: invitePhone ?? undefined } as BasicInfo);
      if (invitePhone) setPhone(invitePhone);
      return;
    }
    router.push("/");
  }, [router]);

  const bmiResult =
    height && weight
      ? calculateBMI(parseFloat(weight), parseFloat(height))
      : null;

  function handleNext() {
    setError("");

    if (step === 0) {
      if (!agreed) {
        setError("개인정보 수집 및 이용에 동의해주세요.");
        return;
      }
      setStep(1);
    } else if (step === 1) {
      if (!height || !weight) {
        setError("키와 몸무게를 입력해주세요.");
        return;
      }
      const h = parseFloat(height);
      const w = parseFloat(weight);
      if (h < 100 || h > 250 || w < 20 || w > 300) {
        setError("올바른 값을 입력해주세요.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const clean = phone.replace(/-/g, "");
      if (!clean) {
        setError("전화번호를 입력해주세요. 알림 수신에 필요해요.");
        return;
      }
      if (!/^0\d{9,10}$/.test(clean)) {
        setError("올바른 전화번호를 입력해주세요. (예: 01012345678)");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      const h = parseFloat(height);
      const w = parseFloat(weight);
      const { bmi, category } = calculateBMI(w, h);
      const goalWeight = Math.round(w * 0.85 * 10) / 10;

      saveParticipant({
        basicInfo: {
          ...info,
          name: info.name ?? "",
          birthDate: info.birthDate ?? "",
          age: info.age ?? 0,
          gender,
          height: h,
          weight: w,
          goalWeight,
          bmi,
          bmiCategory: category,
          medications,
          medicationDetail: medications ? medicationDetail : undefined,
          diseases,
          diseaseDetail: diseases ? diseaseDetail : undefined,
          menopauseSymptoms: gender === "여" ? menopause : undefined,
          phone: phone.replace(/-/g, ""),
        },
      });
      router.push("/survey");
    }
  }

  function toggleMenopause(item: string) {
    setMenopause((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-md">

        {/* 진행 상태 (step 0은 표시 안 함) */}
        {step > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">기본정보 입력</span>
              <span className="text-sm font-semibold text-green-700">
                {step} / 3
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* STEP 0: 안내 및 개인정보 동의 */}
        {step === 0 && (
          <div className="space-y-4">
            {/* 서비스 안내 */}
            <div className="card p-6">
              <div className="text-center mb-4">
                <span className="text-3xl">🌿</span>
                <h2 className="font-bold text-xl text-gray-800 mt-2">
                  보라매직 12주 다이어트 캠프
                </h2>
                <p className="text-sm text-green-700 font-medium mt-1">시작 전 안내사항</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 space-y-2 mb-4">
                <p className="font-semibold">📢 참여자분들께 안내드립니다</p>
                <p>
                  본 다이어트 캠프는 <strong>1회차 운영</strong>으로, 아직 미흡하고
                  부족한 부분이 있을 수 있습니다. 넓은 마음으로 양해 부탁드립니다.
                </p>
                <p>
                  특히 <strong>모바일 페이지</strong>에서 오류가 발생할 수 있으며,
                  불편하신 점은 언제든지 아래 채널로 문의해주세요.
                </p>
                <a
                  href="https://ig.me/m/bora__magic"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 mt-2 border border-amber-200 font-semibold text-amber-900"
                >
                  <span>📸</span>
                  <span>@보라매직 인스타그램 DM</span>
                </a>
              </div>

              <p className="text-xs text-gray-400 text-center">
                CS에 최선을 다하겠습니다 🙏
              </p>
            </div>

            {/* 개인정보 동의 */}
            <div className="card p-6">
              <h3 className="font-bold text-gray-800 mb-3">개인정보 수집 및 이용 동의</h3>
              <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600 space-y-2 mb-4 max-h-40 overflow-y-auto">
                <p className="font-semibold text-gray-700">수집 항목</p>
                <p>닉네임, 성별, 키, 몸무게, 복용 약물, 질환 여부, 연락처</p>
                <p className="font-semibold text-gray-700 mt-2">수집 목적</p>
                <p>12주 다이어트 캠프 관리, 맞춤 건강 프로그램 제공, 일일 체크인 알림 발송</p>
                <p className="font-semibold text-gray-700 mt-2">보유 및 이용 기간</p>
                <p>캠프 종료 후 6개월</p>
                <p className="font-semibold text-gray-700 mt-2">제3자 제공</p>
                <p>제공하지 않음</p>
                <p className="text-gray-400 mt-2">
                  위 동의를 거부할 권리가 있으나, 거부 시 캠프 참여가 제한될 수 있습니다.
                </p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-5 h-5 accent-green-600 flex-shrink-0"
                />
                <span className="text-sm text-gray-700 leading-relaxed">
                  개인정보 수집 및 이용에 <strong>동의합니다</strong>
                </span>
              </label>

              {error && (
                <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg mt-3">
                  {error}
                </p>
              )}

              <button onClick={handleNext} className="btn-primary mt-4">
                동의하고 시작하기 →
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: 신체 정보 */}
        {step === 1 && (
          <div className="card p-6">
            <h2 className="font-bold text-xl text-gray-800 mb-1">신체 정보</h2>
            <p className="text-sm text-gray-500 mb-6">
              BMI와 목표 몸무게를 자동으로 계산해드려요
            </p>

            <div className="space-y-4">
              <div>
                <label className="label-text">성별</label>
                <div className="toggle-yes-no">
                  {(["여", "남"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={`toggle-btn ${gender === g ? "selected" : ""}`}
                      onClick={() => setGender(g)}
                    >
                      {g === "여" ? "👩 여성" : "👨 남성"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label-text">키 (cm)</label>
                <input
                  className="input-field"
                  type="number"
                  placeholder="160"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
              </div>

              <div>
                <label className="label-text">현재 몸무게 (kg)</label>
                <input
                  className="input-field"
                  type="number"
                  step="0.1"
                  placeholder="60.0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>

              {bmiResult && (
                <div className="bg-green-50 rounded-12 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">목표 몸무게</span>
                    <span className="font-bold text-green-700">
                      {Math.round(parseFloat(weight) * 0.85 * 10) / 10} kg
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">BMI</span>
                    <span className="font-bold text-gray-800">
                      {bmiResult.bmi}{" "}
                      <span className="text-sm font-normal text-green-700">
                        ({bmiResult.category})
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">감량 목표</span>
                    <span className="font-bold text-gray-800">
                      {Math.round((parseFloat(weight) * 0.15) * 10) / 10} kg
                    </span>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg mt-4">
                {error}
              </p>
            )}

            <button onClick={handleNext} className="btn-primary mt-6">
              다음 →
            </button>
          </div>
        )}

        {/* STEP 2: 복용약 & 질환 */}
        {step === 2 && (
          <div className="card p-6">
            <h2 className="font-bold text-xl text-gray-800 mb-1">건강 상태</h2>
            <p className="text-sm text-gray-500 mb-6">
              더 안전한 캠프 진행을 위해 확인해요
            </p>

            <div className="space-y-6">
              <div>
                <label className="label-text">카카오톡 알림 수신 번호</label>
                <p className="text-xs text-gray-400 mb-2">매일 영양제·운동 알림 수신에 필요해요 (필수)</p>
                <input
                  className="input-field"
                  type="tel"
                  placeholder="01012345678 (하이픈 없이)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="label-text">복용 중인 약이 있나요?</label>
                <div className="toggle-yes-no mb-2">
                  <button
                    type="button"
                    className={`toggle-btn ${medications ? "selected" : ""}`}
                    onClick={() => setMedications(true)}
                  >
                    예
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${!medications ? "selected" : ""}`}
                    onClick={() => setMedications(false)}
                  >
                    아니오
                  </button>
                </div>
                {medications && (
                  <KoreanInput
                    className="input-field"
                    type="text"
                    placeholder="약 이름을 입력해주세요"
                    value={medicationDetail}
                    onChange={setMedicationDetail}
                  />
                )}
              </div>

              <div>
                <label className="label-text">진단받은 질환이 있나요?</label>
                <div className="toggle-yes-no mb-2">
                  <button
                    type="button"
                    className={`toggle-btn ${diseases ? "selected" : ""}`}
                    onClick={() => setDiseases(true)}
                  >
                    예
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${!diseases ? "selected" : ""}`}
                    onClick={() => setDiseases(false)}
                  >
                    아니오
                  </button>
                </div>
                {diseases && (
                  <KoreanInput
                    className="input-field"
                    type="text"
                    placeholder="질환명을 입력해주세요"
                    value={diseaseDetail}
                    onChange={setDiseaseDetail}
                  />
                )}
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg mt-4">
                {error}
              </p>
            )}

            <button onClick={handleNext} className="btn-primary mt-6">
              다음 →
            </button>
          </div>
        )}

        {/* STEP 3: 호르몬 변화 (여성만) */}
        {step === 3 && (
          <div className="card p-6">
            <h2 className="font-bold text-xl text-gray-800 mb-1">
              {gender === "여" ? "호르몬 변화 관련 증상 확인" : "준비 완료!"}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {gender === "여"
                ? "최근 6개월 내 해당되는 항목을 모두 선택해주세요 (없으면 바로 다음)"
                : "이제 다이어트 시작 전 설문을 시작할게요"}
            </p>

            {gender === "여" && (
              <div className="space-y-3 mb-6">
                {MENOPAUSE_ITEMS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleMenopause(item)}
                    className={`radio-card w-full text-left text-sm ${
                      menopause.includes(item) ? "selected" : ""
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                        menopause.includes(item)
                          ? "border-green-600 bg-green-600"
                          : "border-gray-300"
                      }`}
                    >
                      {menopause.includes(item) && (
                        <span className="text-white text-xs">✓</span>
                      )}
                    </div>
                    {item}
                  </button>
                ))}
              </div>
            )}

            <button onClick={handleNext} className="btn-primary">
              다이어트 시작 전 설문 시작하기 →
            </button>
          </div>
        )}

        {/* 뒤로가기 */}
        {step > 1 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="btn-secondary mt-3"
          >
            ← 이전
          </button>
        )}
      </div>
    </main>
  );
}
