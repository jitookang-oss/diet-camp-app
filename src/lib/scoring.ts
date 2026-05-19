export type BodyType =
  | "혈당불안정형"
  | "대사저하형"
  | "스트레스과식형"
  | "복합형"
  | "습관정착형";

export interface SurveyAnswers {
  // PART 1: Meal (q1~q9)
  q1: string; // 식사 속도: "5분이내"|"10분내외"|"15분이상"
  q2: string; // 채소·단백질 먼저: "항상"|"가끔"|"거의안함"
  q3: string; // 단백질 포함: "항상"|"가끔"|"거의안함"
  q4: string; // 채소 매끼: "항상"|"가끔"|"거의안함"
  q5: string; // 초가공식품: "거의안먹음"|"주1~2회"|"주3~5회"|"거의매일"
  q6: string; // 물 섭취: "1L미만"|"1~1.5L"|"1.5L이상"
  q7: string; // 야식: "거의안함"|"주1~2회"|"주3회이상"
  q8: string; // 폭식 패턴: "없음"|"주1회정도"|"주2회이상"
  q9: string; // 디저트·간식: "0회"|"주1회"|"주2회이상"

  // PART 2: Mobility (q10~q17)
  q10: string; // 식후 앉거나 누움: "전혀그렇지않다"|"주1회정도"|"주말에가끔"|"대부분그렇다"
  q11: string; // 식후 걷기: "주5회이상"|"주2~4회"|"주1회이하"
  q12: string; // 앉아있는 시간: "2시간미만"|"4시간미만"|"6시간이상"
  q13: string; // 계단 이용: "5층내외걸음"|"2층까지걸음"|"계단안이용"
  q14: string; // 근력운동: "안함"|"주1회"|"주2~3회"|"주4회이상"
  q15: string; // 활동량: "한시도안가만"|"가만히좋아"|"누워있기좋아"
  q16: string; // 식후 졸음: "거의그렇지않다"|"주2~3회그렇다"|"거의매일그렇다"
  q17: string; // 피로: "거의그렇지않다"|"주2~3회피로"|"일상어려울만큼피곤"

  // PART 3: Mentation (q18~q25)
  q18: string; // 수면: "5시간미만"|"5~6시간"|"6~7시간"|"7~8시간"|"8시간이상"
  q19: string; // 수면 질: "전혀그렇지않다"|"주2~3회그렇다"|"거의매일그렇다"
  q20: number; // 스트레스 1~10
  q21: string; // 단것 당김: "전혀그렇지않다"|"가끔주2~3회"|"항상"
  q22: string; // 배달앱: "전혀그렇지않다"|"절반정도먹는걸로푼다"|"매번먹는걸로푼다"
  q23: string; // 폭식: "전혀그렇지않다"|"주1회정도그렇다"|"주2회이상그렇다"
  q24: string; // 다이어트 유지: "1년이상유지"|"절반성공요요"|"90%이상포기"
  q25: string; // 음식으로 위안: "전혀그렇지않다"|"주1~2회"|"주3회이상"
}

export interface Scores {
  meal: number;
  mobility: number;
  mentation: number;
  total: number;
}

function scoreQ1(v: string) {
  const map: Record<string, number> = {
    "15분이상": 100,
    "10분내외": 50,
    "5분이내": 0,
  };
  return map[v] ?? 50;
}

function scoreThreeStep(v: string, good: string, mid: string) {
  if (v === good) return 100;
  if (v === mid) return 50;
  return 0;
}

function scoreQ5(v: string) {
  const map: Record<string, number> = {
    거의안먹음: 100,
    "주1~2회": 67,
    "주3~5회": 33,
    거의매일: 0,
  };
  return map[v] ?? 50;
}

function scoreQ6(v: string) {
  const map: Record<string, number> = {
    "1.5L이상": 100,
    "1~1.5L": 50,
    "1L미만": 0,
  };
  return map[v] ?? 50;
}

function scoreQ7(v: string) {
  const map: Record<string, number> = {
    거의안함: 100,
    "주1~2회": 50,
    "주3회이상": 0,
  };
  return map[v] ?? 50;
}

function scoreQ12(v: string) {
  const map: Record<string, number> = {
    "2시간미만": 100,
    "4시간미만": 50,
    "6시간이상": 0,
  };
  return map[v] ?? 50;
}

function scoreQ10(v: string) {
  const map: Record<string, number> = {
    전혀그렇지않다: 100,
    주1회정도: 67,
    주말에가끔: 33,
    대부분그렇다: 0,
  };
  return map[v] ?? 50;
}

function scoreQ14(v: string) {
  const map: Record<string, number> = {
    "주4회이상": 100,
    "주2~3회": 75,
    주1회: 33,
    안함: 0,
  };
  return map[v] ?? 50;
}

function scoreQ18(v: string) {
  const map: Record<string, number> = {
    "7~8시간": 100,
    "8시간이상": 80,
    "6~7시간": 60,
    "5~6시간": 30,
    "5시간미만": 0,
  };
  return map[v] ?? 50;
}

function bool(pos: boolean, positive: boolean = true) {
  if (positive) return pos ? 100 : 0;
  return pos ? 0 : 100;
}

export function calculateScores(a: SurveyAnswers): Scores {
  // MEAL (9문항, 핵심★ 가중치 2배: q1, q5, q7)
  const mealScores = [
    { score: scoreQ1(a.q1), weight: 2 }, // ★ 식사 속도
    { score: scoreThreeStep(a.q2, "항상", "가끔"), weight: 1 }, // 채소·단백질 먼저
    { score: scoreThreeStep(a.q3, "항상", "가끔"), weight: 1 }, // 단백질 포함
    { score: scoreThreeStep(a.q4, "항상", "가끔"), weight: 1 }, // 채소 매끼
    { score: scoreQ5(a.q5), weight: 2 }, // ★ 초가공식품
    { score: scoreQ6(a.q6), weight: 1 }, // 물 섭취
    { score: scoreQ7(a.q7), weight: 2 }, // ★ 야식
    { score: scoreThreeStep(a.q8, "없음", "주1회정도"), weight: 1 }, // 폭식 패턴
    { score: scoreThreeStep(a.q9, "0회", "주1회"), weight: 1 }, // 디저트·간식
  ];
  const mealTotal = mealScores.reduce((s, x) => s + x.score * x.weight, 0);
  const mealWeight = mealScores.reduce((s, x) => s + x.weight, 0);
  const meal = Math.round(mealTotal / mealWeight);

  // MOBILITY (8문항, 핵심★ 가중치 2배: q10, q11, q12)
  const mobilityScores = [
    { score: scoreQ10(a.q10), weight: 2 }, // ★ 식후 앉거나 누움
    { score: scoreThreeStep(a.q11, "주5회이상", "주2~4회"), weight: 2 }, // ★ 식후 걷기
    { score: scoreQ12(a.q12), weight: 2 }, // ★ 앉아있는 시간
    { score: scoreThreeStep(a.q13, "5층내외걸음", "2층까지걸음"), weight: 1 }, // 계단 이용
    { score: scoreQ14(a.q14), weight: 1 }, // 근력운동
    { score: scoreThreeStep(a.q15, "한시도안가만", "가만히좋아"), weight: 1 }, // 활동량
    { score: scoreThreeStep(a.q16, "거의그렇지않다", "주2~3회그렇다"), weight: 1 }, // 식후 졸음
    { score: scoreThreeStep(a.q17, "거의그렇지않다", "주2~3회피로"), weight: 1 }, // 피로
  ];
  const mobilityTotal = mobilityScores.reduce(
    (s, x) => s + x.score * x.weight,
    0
  );
  const mobilityWeight = mobilityScores.reduce((s, x) => s + x.weight, 0);
  const mobility = Math.round(mobilityTotal / mobilityWeight);

  // MENTATION (8문항, 핵심★ 가중치 2배: q18, q20, q22)
  const mentationScores = [
    { score: scoreQ18(a.q18), weight: 2 }, // ★ 수면 시간
    { score: scoreThreeStep(a.q19, "전혀그렇지않다", "주2~3회그렇다"), weight: 1 }, // 수면 질
    { score: Math.round(((10 - a.q20) / 9) * 100), weight: 2 }, // ★ 스트레스 (낮을수록 good)
    { score: scoreThreeStep(a.q21, "전혀그렇지않다", "가끔주2~3회"), weight: 1 }, // 단것 당김
    { score: scoreThreeStep(a.q22, "전혀그렇지않다", "절반정도먹는걸로푼다"), weight: 2 }, // ★ 배달앱
    { score: scoreThreeStep(a.q23, "전혀그렇지않다", "주1회정도그렇다"), weight: 1 }, // 폭식
    { score: scoreThreeStep(a.q24, "1년이상유지", "절반성공요요"), weight: 1 }, // 다이어트 유지
    { score: scoreThreeStep(a.q25, "전혀그렇지않다", "주1~2회"), weight: 1 }, // 음식으로 위안
  ];
  const mentationTotal = mentationScores.reduce(
    (s, x) => s + x.score * x.weight,
    0
  );
  const mentationWeight = mentationScores.reduce((s, x) => s + x.weight, 0);
  const mentation = Math.round(mentationTotal / mentationWeight);

  const total = Math.round((meal + mobility + mentation) / 3);

  return { meal, mobility, mentation, total };
}

export function getBodyType(scores: Scores): BodyType {
  const threshold = 50;
  const low = {
    meal: scores.meal < threshold,
    mobility: scores.mobility < threshold,
    mentation: scores.mentation < threshold,
  };
  const lowCount = Object.values(low).filter(Boolean).length;

  if (lowCount === 0) return "습관정착형";
  if (lowCount >= 2) return "복합형";
  if (low.meal) return "혈당불안정형";
  if (low.mobility) return "대사저하형";
  return "스트레스과식형";
}

export const bodyTypeInfo: Record<
  BodyType,
  { icon: string; color: string; guide: string; description: string }
> = {
  혈당불안정형: {
    icon: "🍽️",
    color: "amber",
    guide: "식사 순서·속도·가공식품 교정",
    description:
      "식사 습관이 혈당 변동을 일으키고 있어요. 채소·단백질 먼저 먹기, 천천히 씹기부터 시작해보세요.",
  },
  대사저하형: {
    icon: "🚶",
    color: "blue",
    guide: "식후 걷기·생활 활동량 증가",
    description:
      "움직임이 부족해 대사가 느려진 상태예요. 식후 10분 산책이 가장 효과적인 첫 걸음이에요.",
  },
  스트레스과식형: {
    icon: "🧘",
    color: "purple",
    guide: "수면 개선·보상회로 관리",
    description:
      "감정과 스트레스가 식욕에 영향을 주고 있어요. 수면 개선과 스트레스 관리가 핵심이에요.",
  },
  복합형: {
    icon: "⚡",
    color: "red",
    guide: "전반적 생활습관 개선",
    description:
      "여러 영역에서 개선이 필요한 상태예요. 가장 낮은 점수 파트부터 하나씩 집중해보세요.",
  },
  습관정착형: {
    icon: "✨",
    color: "green",
    guide: "현재 습관 유지·심화",
    description:
      "전반적으로 좋은 습관을 가지고 있어요! 지금 상태를 유지하면서 더 심화해나가면 돼요.",
  },
};

