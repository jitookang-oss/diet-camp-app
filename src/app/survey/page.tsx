"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadParticipant, saveParticipant } from "@/lib/store";
import { SurveyAnswers, calculateScores, getBodyType } from "@/lib/scoring";

type Answers = Partial<SurveyAnswers>;

// 코드 키값 → 화면에 보여줄 레이블
const OPTION_LABELS: Record<string, string> = {
  // Q2·Q3·Q4 (빈도 명확화)
  주5회이상: "주 5회 이상",
  "주2~4회": "주 2~4회",
  주1회이하: "주 1회 이하",
  // Q5
  거의안먹음: "거의 안 먹음",
  거의매일: "거의 매일",
  // Q8 (결식 전용)
  주1회: "주 1회",
  주2회이상: "주 2회 이상",
  // Q9 (간식 세분화)
  "주2~3회": "주 2~3회",
  "주4회이상": "주 4회 이상",
  // Q10
  전혀그렇지않다: "전혀 그렇지 않다",
  주1회정도: "주 1회 정도 그렇다",
  주말에가끔: "주말에 가끔 그렇다",
  대부분그렇다: "대부분 그렇다",
  // Q12 (구간 재정비)
  "2시간미만": "2시간 미만",
  "2~4시간": "2~4시간",
  "4~6시간": "4~6시간",
  "6시간이상": "6시간 이상",
  // Q16
  "주2~3회그렇다": "주 2~3회 그렇다",
  거의매일그렇다: "거의 매일 그렇다",
  // Q17
  "주2~3회피로": "주 2~3회 피로하다고 느낀다",
  일상어려울만큼피곤: "일상생활이 어려울 만큼 피곤하다",
  // Q22 (스트레스 식이 행동 통합)
  절반정도먹는걸로푼다: "50% 정도는 먹는 걸로 푼다",
  매번먹는걸로푼다: "매번 먹는 걸로 푼다",
  // Q23
  주1회정도그렇다: "주 1회 정도 그렇다",
  주2회이상그렇다: "주 2회 이상 그렇다",
  // Q25
  "주1~2회": "주 1~2회",
  주3회이상: "주 3회 이상",
};

function optionLabel(opt: string): string {
  return OPTION_LABELS[opt] ?? opt;
}

const QUESTIONS = [
  // PART 1: Meal (8문항)
  {
    id: "q1",
    part: "Meal 🍽️",
    text: "한 끼 식사를 마치는 데 보통 얼마나 걸리나요?",
    type: "radio",
    star: true,
    options: ["5분이내", "10분내외", "15분이상"],
  },
  {
    id: "q2",
    part: "Meal 🍽️",
    text: "식사할 때 채소·단백질을 먼저 먹나요?",
    hint: "채소나 단백질로 시작하면 포만감과 식사 속도 조절에 도움이 돼요",
    type: "radio",
    star: false,
    options: ["주5회이상", "주2~4회", "주1회이하"],
  },
  {
    id: "q3",
    part: "Meal 🍽️",
    text: "식사마다 단백질을 신경써서 먹나요?",
    type: "radio",
    star: false,
    options: ["주5회이상", "주2~4회", "주1회이하"],
  },
  {
    id: "q4",
    part: "Meal 🍽️",
    text: "채소를 매 끼니 챙겨 먹나요?",
    type: "radio",
    star: false,
    options: ["주5회이상", "주2~4회", "주1회이하"],
  },
  {
    id: "q5",
    part: "Meal 🍽️",
    text: "초가공식품(과자, 햄버거, 햄 등)을 주 몇 회 먹나요?",
    type: "radio",
    star: true,
    options: ["거의안먹음", "주1~2회", "주3~5회", "거의매일"],
  },
  {
    id: "q6",
    part: "Meal 🍽️",
    text: "하루 물 섭취량은?",
    type: "radio",
    star: false,
    options: ["1L미만", "1~1.5L", "1.5L이상"],
  },
  {
    id: "q7",
    part: "Meal 🍽️",
    text: "야식을 먹는 빈도는?",
    type: "radio",
    star: true,
    options: ["거의안함", "주1~2회", "주3회이상"],
  },
  {
    id: "q8",
    part: "Meal 🍽️",
    text: "식사를 거른 날이 얼마나 되나요?",
    type: "radio",
    star: false,
    options: ["없음", "주1회", "주2회이상"],
  },
  {
    id: "q9",
    part: "Meal 🍽️",
    text: "디저트나 간식을 찾아서 먹은 횟수는?",
    type: "radio",
    star: false,
    options: ["0회", "주1회", "주2~3회", "주4회이상"],
  },
  // PART 2: Mobility (6문항)
  {
    id: "q10",
    part: "Mobility 🚶",
    text: "식사 후 바로 앉거나 눕는 편인가요?",
    type: "radio",
    star: true,
    options: ["전혀그렇지않다", "주1회정도", "주말에가끔", "대부분그렇다"],
  },
  {
    id: "q11",
    part: "Mobility 🚶",
    text: "식후 걷기를 얼마나 자주 실천하나요?",
    type: "radio",
    star: true,
    options: ["주5회이상", "주2~4회", "주1회이하"],
  },
  {
    id: "q12",
    part: "Mobility 🚶",
    text: "하루 중 앉아 있는 시간은 총 얼마나 되나요?",
    type: "radio",
    star: true,
    options: ["2시간미만", "2~4시간", "4~6시간", "6시간이상"],
  },
  {
    id: "q14",
    part: "Mobility 🚶",
    text: "주당 근력운동 횟수는?",
    type: "radio",
    star: false,
    options: ["안함", "주1회", "주2~3회", "주4회이상"],
  },
  {
    id: "q16",
    part: "Mobility 🚶",
    text: "식사 후 졸음이 오는 편인가요?",
    type: "radio",
    star: false,
    options: ["거의그렇지않다", "주2~3회그렇다", "거의매일그렇다"],
  },
  {
    id: "q17",
    part: "Mobility 🚶",
    text: "조금만 움직여도 쉽게 피로한 편인가요?",
    type: "radio",
    star: false,
    options: ["거의그렇지않다", "주2~3회피로", "일상어려울만큼피곤"],
  },
  // PART 3: Mentation (6문항)
  {
    id: "q18",
    part: "Mentation 🧘",
    text: "하루 평균 수면 시간은?",
    type: "radio",
    star: true,
    options: ["5시간미만", "5~6시간", "6~7시간", "7~8시간", "8시간이상"],
  },
  {
    id: "q20",
    part: "Mentation 🧘",
    text: "최근 한 달 스트레스 수준은?",
    type: "slider",
    star: true,
  },
  {
    id: "q22",
    part: "Mentation 🧘",
    text: "스트레스 받은 날, 실제로 과식하거나 배달을 시켰나요?",
    type: "radio",
    star: true,
    options: ["전혀그렇지않다", "절반정도먹는걸로푼다", "매번먹는걸로푼다"],
  },
  {
    id: "q23",
    part: "Mentation 🧘",
    text: "참다가 한꺼번에 폭식하는 경우가 있나요?",
    type: "radio",
    star: false,
    options: ["전혀그렇지않다", "주1회정도그렇다", "주2회이상그렇다"],
  },
  {
    id: "q25",
    part: "Mentation 🧘",
    text: "기분이 우울할 때 음식으로 위안을 받나요?",
    type: "radio",
    star: false,
    options: ["전혀그렇지않다", "주1~2회", "주3회이상"],
  },
];

function SurveyContent() {
  const router = useRouter();
  const params = useSearchParams();
  const weekParam = params.get("week");
  const isWeek12 = weekParam === "12";
  const weekNum = weekParam ? parseInt(weekParam) : 1;
  const isWeekly = weekNum >= 2 && weekNum <= 11;

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [showWeight, setShowWeight] = useState(false);
  const [weight, setWeight] = useState("");
  const [weightError, setWeightError] = useState("");

  useEffect(() => {
    const data = loadParticipant();
    if (!data?.basicInfo?.name) {
      router.push("/");
    }
  }, [router]);

  const q = QUESTIONS[current];
  const answer = answers[q.id as keyof Answers];
  const isAnswered = answer !== undefined;
  const progress = ((current + 1) / QUESTIONS.length) * 100;

  function setAnswer(val: string | number) {
    setAnswers((prev) => ({ ...prev, [q.id]: val }));
  }

  function handleNext() {
    if (!isAnswered) return;

    if (current < QUESTIONS.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      const full = answers as SurveyAnswers;
      const scores = calculateScores(full);

      if (isWeekly) {
        // 2~11주차: 몸무게 입력 후 주차 기록 저장
        setShowWeight(true);
      } else if (isWeek12) {
        saveParticipant({ week12Answers: full, week12Scores: scores });
        router.push("/result?week=12");
      } else {
        // 1주차
        const bodyType = getBodyType(scores);
        saveParticipant({ week1Answers: full, week1Scores: scores, bodyType });
        router.push("/result");
      }
    }
  }

  function handleWeightSubmit() {
    setWeightError("");
    const w = parseFloat(weight);
    if (!weight || isNaN(w) || w < 20 || w > 300) {
      setWeightError("올바른 몸무게를 입력해주세요.");
      return;
    }
    const full = answers as SurveyAnswers;
    const scores = calculateScores(full);
    const data = loadParticipant();
    if (!data) return;

    const records = data.weeklyRecords ?? [];
    records.push({
      week: weekNum,
      weight: w,
      answers: full,
      scores,
      completedAt: new Date().toISOString(),
    });
    saveParticipant({ weeklyRecords: records });
    router.push("/dashboard");
  }

  // 2~11주차 몸무게 입력 화면
  if (showWeight) {
    return (
      <main className="min-h-screen flex flex-col items-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">⚖️</div>
            <h2 className="font-bold text-xl text-gray-800">{weekNum}주차 몸무게</h2>
            <p className="text-sm text-gray-500 mt-1">오늘 아침 공복 기준으로 입력해주세요</p>
          </div>
          <div className="card p-6">
            <label className="label-text">현재 몸무게 (kg)</label>
            <div className="flex items-center gap-3">
              <input
                className="input-field text-2xl font-bold text-center"
                type="number"
                step="0.1"
                placeholder="60.0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                autoFocus
              />
              <span className="text-gray-500 font-medium flex-shrink-0">kg</span>
            </div>
            {weightError && (
              <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg mt-3">{weightError}</p>
            )}
            <button onClick={handleWeightSubmit} className="btn-primary mt-6">
              기록 완료 →
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* 주차 배지 */}
        <div className="text-center mb-4">
          <span className="inline-block bg-green-100 text-green-700 text-sm font-bold px-4 py-1 rounded-full">
            {weekNum === 1 ? "1주차 초기 설문" : isWeek12 ? "12주차 최종 설문" : `${weekNum}주차 정기 설문`}
          </span>
        </div>

        {/* 진행 상태 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500 font-medium">{q.part}</span>
            <span className="text-sm font-semibold text-green-700">
              {current + 1} / {QUESTIONS.length}
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* 질문 카드 */}
        <div className="card p-6">
          <div className="mb-6">
            {q.star && (
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full inline-block mb-2">
                핵심★
              </span>
            )}
            <h2 className="font-bold text-lg text-gray-800 leading-snug">
              {q.text}
            </h2>
            {"hint" in q && q.hint && (
              <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2 mt-2">
                💡 {q.hint}
              </p>
            )}
          </div>

          {/* 객관식 */}
          {q.type === "radio" && q.options && (
            <div className="space-y-3">
              {q.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`radio-card w-full ${answer === opt ? "selected" : ""}`}
                  onClick={() => setAnswer(opt)}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                      answer === opt
                        ? "border-green-600 bg-green-600"
                        : "border-gray-300"
                    }`}
                  />
                  <span className="text-sm font-medium">{optionLabel(opt)}</span>
                </button>
              ))}
            </div>
          )}

          {/* 슬라이더 */}
          {q.type === "slider" && (
            <div className="space-y-4">
              <div className="flex justify-between text-xs text-gray-400">
                <span>1점 (매우 낮음)</span>
                <span>10점 (매우 높음)</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={(answer as number) ?? 5}
                onChange={(e) => setAnswer(parseInt(e.target.value))}
                className="w-full accent-green-600"
                style={{ height: "6px" }}
              />
              <div className="text-center">
                <span className="text-5xl font-black text-green-700">
                  {(answer as number) ?? 5}
                </span>
                <span className="text-gray-400 text-sm ml-1">점</span>
              </div>
              <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
                <p className="text-sm font-semibold text-gray-700">
                  {(() => {
                    const v = (answer as number) ?? 5;
                    if (v <= 2) return "😊 매우 안정적이에요";
                    if (v <= 4) return "🙂 다소 여유 있어요";
                    if (v <= 6) return "😐 힘들지만 견딜 만해요";
                    if (v <= 8) return "😟 꽤 힘든 상태예요";
                    return "😰 일상생활이 어려운 수준이에요";
                  })()}
                </p>
              </div>
              {answer === undefined && (
                <p className="text-xs text-center text-gray-400">
                  슬라이더를 움직여 점수를 선택하세요
                </p>
              )}
            </div>
          )}
        </div>

        {/* 버튼 */}
        <div className="mt-4 space-y-3">
          <button
            onClick={handleNext}
            disabled={!isAnswered && q.type !== "slider"}
            className="btn-primary"
          >
            {current < QUESTIONS.length - 1 ? "다음 →" : "결과 보기 →"}
          </button>

          {current > 0 && (
            <button
              onClick={() => setCurrent((c) => c - 1)}
              className="btn-secondary"
            >
              ← 이전
            </button>
          )}
        </div>

        {/* 슬라이더 힌트 */}
        {q.type === "slider" && (
          <button
            onClick={handleNext}
            className="w-full text-center text-sm text-green-700 mt-2 underline"
          >
            현재 값({(answer as number) ?? 5}점)으로 다음
          </button>
        )}
      </div>
    </main>
  );
}

export default function SurveyPage() {
  return (
    <Suspense>
      <SurveyContent />
    </Suspense>
  );
}
