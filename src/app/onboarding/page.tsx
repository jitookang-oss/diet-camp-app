"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadParticipant, saveParticipant, calculateBMI, BasicInfo } from "@/lib/store";
import KoreanInput from "@/components/KoreanInput";

const MENOPAUSE_ITEMS = [
  "생리가 불규칙하거나 끊긴 상태",
  "얼굴이 화끈거리거나 열감이 있음",
  "수면 중 식은땀이 남",
  "감정 기복이 심해짐",
  "체중이 갑자기 늘거나 복부비만이 심해짐",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
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

  useEffect(() => {
    const data = loadParticipant();
    if (data?.basicInfo?.name) {
      setInfo(data.basicInfo);
      setGender(data.basicInfo.gender ?? "여");
      return;
    }
    // 초대 링크로 진입한 경우
    const inviteName = localStorage.getItem("invite_name");
    const invitePhone = localStorage.getItem("invite_phone");
    if (inviteName) {
      setInfo({ name: inviteName, phone: invitePhone ?? undefined } as BasicInfo);
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

    if (step === 1) {
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
      if (phone && !/^0\d{9,10}$/.test(clean)) {
        setError("올바른 전화번호를 입력해주세요. (예: 01012345678)");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      // 완료
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
          phone: phone.replace(/-/g, "") || undefined,
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
        {/* 진행 상태 */}
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
                <p className="text-xs text-gray-400 mb-2">매일 영양제·운동 알림을 드려요 (선택)</p>
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

            <button onClick={handleNext} className="btn-primary mt-6">
              다음 →
            </button>
          </div>
        )}

        {/* STEP 3: 갱년기 (여성만) */}
        {step === 3 && (
          <div className="card p-6">
            <h2 className="font-bold text-xl text-gray-800 mb-1">
              {gender === "여" ? "갱년기 증상 확인" : "준비 완료!"}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {gender === "여"
                ? "해당되는 항목을 모두 선택해주세요 (없으면 바로 다음)"
                : "이제 3M 설문을 시작할게요"}
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
              설문 시작하기 →
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
