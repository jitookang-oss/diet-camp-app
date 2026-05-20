export type BodyType =
  | "혈당불안정형"
  | "대사저하형"
  | "스트레스과식형"
  | "복합형"
  | "습관정착형";

export interface SurveyAnswers {
  // PART 1: Meal (q1~q9, 8문항)
  q1: string; // 식사 속도: "5분이내"|"10분내외"|"15분이상"
  q2: string; // 채소·단백질 먼저: "주5회이상"|"주2~4회"|"주1회이하"
  q3: string; // 단백질 포함: "주5회이상"|"주2~4회"|"주1회이하"
  q4: string; // 채소 매끼: "주5회이상"|"주2~4회"|"주1회이하"
  q5: string; // 초가공식품: "거의안먹음"|"주1~2회"|"주3~5회"|"거의매일"
  q6: string; // 물 섭취: "1L미만"|"1~1.5L"|"1.5L이상"
  q7: string; // 야식: "거의안함"|"주1~2회"|"주3회이상"
  q8: string; // 결식: "없음"|"주1회"|"주2회이상"
  q9: string; // 디저트·간식: "0회"|"주1회"|"주2~3회"|"주4회이상"

  // PART 2: Mobility (q10~q17, 6문항 — q13·q15 제거)
  q10: string; // 식후 앉거나 누움: "전혀그렇지않다"|"주1회정도"|"주말에가끔"|"대부분그렇다"
  q11: string; // 식후 걷기: "주5회이상"|"주2~4회"|"주1회이하"
  q12: string; // 앉아있는 시간: "2시간미만"|"2~4시간"|"4~6시간"|"6시간이상"
  q14: string; // 근력운동: "안함"|"주1회"|"주2~3회"|"주4회이상"
  q16: string; // 식후 졸음: "거의그렇지않다"|"주2~3회그렇다"|"거의매일그렇다"
  q17: string; // 피로: "거의그렇지않다"|"주2~3회피로"|"일상어려울만큼피곤"

  // PART 3: Mentation (q18~q25, 6문항 — q19·q21·q24 제거)
  q18: string; // 수면: "5시간미만"|"5~6시간"|"6~7시간"|"7~8시간"|"8시간이상"
  q20: number; // 스트레스 1~10
  q22: string; // 스트레스 식이 행동: "전혀그렇지않다"|"절반정도먹는걸로푼다"|"매번먹는걸로푼다"
  q23: string; // 폭식: "전혀그렇지않다"|"주1회정도그렇다"|"주2회이상그렇다"
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

function scoreQ12v2(v: string) {
  const map: Record<string, number> = {
    "2시간미만": 100,
    "2~4시간": 75,
    "4~6시간": 33,
    "6시간이상": 0,
  };
  return map[v] ?? 50;
}

function scoreQ9v2(v: string) {
  const map: Record<string, number> = {
    "0회": 100,
    "주1회": 75,
    "주2~3회": 33,
    "주4회이상": 0,
  };
  return map[v] ?? 50;
}

export function calculateScores(a: SurveyAnswers): Scores {
  // MEAL (8문항, 핵심★ 가중치 2배: q1, q5, q7)
  const mealScores = [
    { score: scoreQ1(a.q1), weight: 2 }, // ★ 식사 속도
    { score: scoreThreeStep(a.q2, "주5회이상", "주2~4회"), weight: 1 }, // 채소·단백질 먼저
    { score: scoreThreeStep(a.q3, "주5회이상", "주2~4회"), weight: 1 }, // 단백질 포함
    { score: scoreThreeStep(a.q4, "주5회이상", "주2~4회"), weight: 1 }, // 채소 매끼
    { score: scoreQ5(a.q5), weight: 2 }, // ★ 초가공식품
    { score: scoreQ6(a.q6), weight: 1 }, // 물 섭취
    { score: scoreQ7(a.q7), weight: 2 }, // ★ 야식
    { score: scoreThreeStep(a.q8, "없음", "주1회"), weight: 1 }, // 결식
    { score: scoreQ9v2(a.q9), weight: 1 }, // 디저트·간식
  ];
  const mealTotal = mealScores.reduce((s, x) => s + x.score * x.weight, 0);
  const mealWeight = mealScores.reduce((s, x) => s + x.weight, 0);
  const meal = Math.round(mealTotal / mealWeight);

  // MOBILITY (6문항, 핵심★ 가중치 2배: q10, q11, q12)
  const mobilityScores = [
    { score: scoreQ10(a.q10), weight: 2 }, // ★ 식후 앉거나 누움
    { score: scoreThreeStep(a.q11, "주5회이상", "주2~4회"), weight: 2 }, // ★ 식후 걷기
    { score: scoreQ12v2(a.q12), weight: 2 }, // ★ 앉아있는 시간
    { score: scoreQ14(a.q14), weight: 1 }, // 근력운동
    { score: scoreThreeStep(a.q16, "거의그렇지않다", "주2~3회그렇다"), weight: 1 }, // 식후 졸음
    { score: scoreThreeStep(a.q17, "거의그렇지않다", "주2~3회피로"), weight: 1 }, // 피로
  ];
  const mobilityTotal = mobilityScores.reduce(
    (s, x) => s + x.score * x.weight,
    0
  );
  const mobilityWeight = mobilityScores.reduce((s, x) => s + x.weight, 0);
  const mobility = Math.round(mobilityTotal / mobilityWeight);

  // MENTATION (6문항, 핵심★ 가중치 2배: q18, q20, q22)
  const mentationScores = [
    { score: scoreQ18(a.q18), weight: 2 }, // ★ 수면 시간
    { score: Math.round(((10 - a.q20) / 9) * 100), weight: 2 }, // ★ 스트레스 (낮을수록 good)
    { score: scoreThreeStep(a.q22, "전혀그렇지않다", "절반정도먹는걸로푼다"), weight: 2 }, // ★ 스트레스 식이 행동
    { score: scoreThreeStep(a.q23, "전혀그렇지않다", "주1회정도그렇다"), weight: 1 }, // 폭식
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

// ─── 영양제 추천 ───────────────────────────────────────────

export interface Supplement {
  name: string;
  reason: string;
  signal: string;
  timing?: string;
  isProtein?: boolean;
}

export interface SupplementGroup {
  label: string;
  color: string;
  supplements: Supplement[];
}

export function getSupplements(
  bodyType: BodyType,
  scores: Scores
): SupplementGroup[] {
  const threshold = 50;
  const lowMeal = scores.meal < threshold;
  const lowMob  = scores.mobility < threshold;
  const lowMen  = scores.mentation < threshold;

  const mealGroup: SupplementGroup = {
    label: "혈당 안정",
    color: "amber",
    supplements: [
      {
        name: "피크노제놀 (Pycnogenol)",
        reason: "α-글루코시다아제 억제 → 식후 혈당 급상승을 직접 차단해요.",
        signal: "식후 졸음 감소, 식후 혈당 완화",
        timing: "식사 직전 복용",
      },
      {
        name: "식이섬유 (차전자피)",
        reason: "식전 섭취 시 혈당 상승 속도를 늦추고 포만감을 높여줘요.",
        signal: "포만감 지속 시간 증가",
        timing: "식사 10~15분 전, 물과 함께",
      },
      {
        name: "단백질 보충제",
        reason: "단백질은 탄수화물보다 혈당을 천천히 올리고 포만감을 길게 유지시켜요.",
        signal: "식후 포만감 유지, 간식 욕구 감소",
        timing: "식사 대용 또는 간식 대체",
        isProtein: true,
      },
    ],
  };

  const mobGroup: SupplementGroup = {
    label: "대사 활성",
    color: "blue",
    supplements: [
      {
        name: "코엔자임Q10 + L-카르니틴",
        reason: "미토콘드리아 에너지 생산을 도와 기초대사율 저하에 대응해요.",
        signal: "일상 피로감 감소, 운동 회복력 향상",
        timing: "아침 식후",
      },
      {
        name: "마그네슘",
        reason: "근육 이완·에너지 대사에 관여하고 운동 초기 근육 피로를 줄여줘요.",
        signal: "근육 경련 감소, 수면 개선",
        timing: "저녁 식후 또는 취침 전",
      },
      {
        name: "단백질 보충제",
        reason: "다이어트 중 근육 손실 방지가 기초대사율 보존의 핵심이에요.",
        signal: "근육량 유지, 기초대사율 보존",
        timing: "근력운동 후 30분 이내",
        isProtein: true,
      },
    ],
  };

  const menGroup: SupplementGroup = {
    label: "스트레스 관리",
    color: "purple",
    supplements: [
      {
        name: "마그네슘 + 테아닌",
        reason: "코르티솔 과분비를 억제하고 감정적 식이 충동과 연결된 신경계를 안정시켜요.",
        signal: "야식 충동 감소, 수면 입면 시간 단축",
        timing: "저녁 식후 또는 취침 전",
      },
      {
        name: "비타민 B군",
        reason: "세로토닌·도파민 합성을 도와 스트레스로 인한 감정 기복을 완화해요.",
        signal: "기분 안정, 단 음식 욕구 감소",
        timing: "아침 식후",
      },
    ],
  };

  const baseGroup: SupplementGroup = {
    label: "기본 베이스",
    color: "green",
    supplements: [
      {
        name: "오메가3 + 비타민 D",
        reason: "염증 억제·지방 대사 개선(오메가3), 인슐린 감수성·면역 조절(비타민D). 모든 유형의 기본 베이스예요.",
        signal: "체지방 감소 속도, 면역력 유지",
        timing: "식후",
      },
    ],
  };

  if (bodyType === "습관정착형") return [baseGroup];
  if (bodyType === "혈당불안정형") return [mealGroup, baseGroup];
  if (bodyType === "대사저하형") return [mobGroup, baseGroup];
  if (bodyType === "스트레스과식형") return [menGroup, baseGroup];

  // 복합형 — 낮은 파트 조합
  const groups: SupplementGroup[] = [];
  if (lowMeal) groups.push(mealGroup);
  if (lowMob)  groups.push(mobGroup);
  if (lowMen)  groups.push(menGroup);
  groups.push(baseGroup);
  return groups;
}

