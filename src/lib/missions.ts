export interface Mission {
  week: number;
  icon: string;
  title: string;
  detail: string; // 카드에 표시되는 한 줄 요약
  isConsultationWeek?: boolean;
}

export const WEEKLY_MISSIONS: Mission[] = [
  {
    week: 1,
    icon: "☕",
    title: "커피는 하루 1잔, 식후 2시간 후에",
    detail: "카페인이 교감신경을 자극해 지방 저장 호르몬을 분비시켜요. 식후 2시간 후 아메리카노 1잔만 허용!",
    isConsultationWeek: true,
  },
  {
    week: 2,
    icon: "🥚",
    title: "아침 식단에서 정제 탄수화물 빼기",
    detail: "아침 흰밥·빵·시리얼 대신 계란+올리브오일+아보카도+사과로 혈당 스파이크를 막아요.",
  },
  {
    week: 3,
    icon: "🚶",
    title: "식후 10분 안에 10분 걷기",
    detail: "식사 후 10분 이내에 10분만 걸어도 혈당 상승을 최대 30% 낮출 수 있어요.",
  },
  {
    week: 4,
    icon: "🌙",
    title: "야식 금지 + 7시간 이상 수면",
    detail: "밤 9시 이후 야식·음주 금지, 매일 7시간 이상 수면으로 식욕 호르몬을 바로잡아요.",
  },
  {
    week: 5,
    icon: "🚫",
    title: "간식·초가공식품·액상과당·탄산음료 없애기",
    detail: "액상과당과 초가공식품을 끊고 견과류·삶은달걀로 대체해요. 진짜 배고픔을 느끼는 주!",
  },
  {
    week: 6,
    icon: "💪",
    title: "양치할 때 스쿼트 15회 3세트 (운동 스낵)",
    detail: "하루 두 번 양치 시간을 운동으로 바꿔요. 총 90회 스쿼트로 기초대사량을 높여요.",
  },
  {
    week: 7,
    icon: "🪜",
    title: "식후 10분 안에 계단 오르기 10분",
    detail: "계단 오르기는 걷기보다 칼로리 소모가 3배! 식후 혈당 스파이크를 막는 최강 운동이에요.",
  },
  {
    week: 8,
    icon: "🏃",
    title: "주 2회 유산소+근력 운동",
    detail: "유산소 20분 + 근력 20분을 주 2회 실천해요. 근육이 늘면 쉬어도 지방이 타요.",
  },
  {
    week: 9,
    icon: "🧘",
    title: "보상성 음식 금지 — 취미로 보상하기",
    detail: "스트레스를 음식 대신 반신욕·산책·음악으로 풀어요. 요요를 막는 가장 중요한 습관!",
  },
  {
    week: 10,
    icon: "📵",
    title: "식사 중 영상 금지 — 20~30분 천천히 먹기",
    detail: "식사 중 스마트폰·TV를 끄고 천천히 드세요. 같은 양으로 더 배부른 경험을 하게 돼요.",
  },
  {
    week: 11,
    icon: "🥗",
    title: "식사 전 채소(수용성 식이섬유) 먼저 먹기",
    detail: "채소 먼저 5분 → 혈당 상승 완만, 인슐린 분비 감소. 가장 강력한 식이 전략이에요.",
  },
  {
    week: 12,
    icon: "🥩",
    title: "매 끼니 단백질 20~30g + 건강한 지방으로 시작",
    detail: "계란·닭가슴살+올리브오일·아보카도로 식사를 시작해요. 12주 후에도 평생 유지할 습관!",
  },
];

// 캠프 시작일 (여기서 변경하면 전체에 반영됨)
export const CAMP_START_DATE = new Date("2026-06-01T00:00:00");

export interface CampDayInfo {
  daysFromStart: number; // 음수면 시작 전
  campDay: number;       // 1부터 시작, 시작 전은 0
  campWeek: number;      // 1부터 시작, 시작 전은 0
  isBeforeStart: boolean;
  isAfterCamp: boolean;  // 12주(84일) 이후
  currentMission: Mission | null;
}

// 주차별 체크인 잠금 해제 날짜 (2주차=6/7, 3주차=6/14, ...)
export function getWeekCheckUnlockDate(checkWeek: number): Date {
  const date = new Date(CAMP_START_DATE);
  date.setDate(date.getDate() + (checkWeek - 2) * 7 + 6);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function isCheckWeekUnlocked(checkWeek: number): boolean {
  if (checkWeek >= 12) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today >= getWeekCheckUnlockDate(checkWeek);
}

export function getCampDayInfo(): CampDayInfo {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(CAMP_START_DATE);
  start.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - start.getTime();
  const daysFromStart = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const isBeforeStart = daysFromStart < 0;
  const isAfterCamp = daysFromStart >= 84;
  const campDay = isBeforeStart ? 0 : daysFromStart + 1;
  const campWeek = isBeforeStart ? 0 : Math.min(Math.floor(daysFromStart / 7) + 1, 12);

  const currentMission =
    !isBeforeStart && campWeek >= 1 && campWeek <= 12
      ? WEEKLY_MISSIONS[campWeek - 1]
      : null;

  return { daysFromStart, campDay, campWeek, isBeforeStart, isAfterCamp, currentMission };
}
