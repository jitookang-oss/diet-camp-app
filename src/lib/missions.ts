export interface Mission {
  week: number;
  icon: string;
  title: string;
  detail: string;
}

export const WEEKLY_MISSIONS: Mission[] = [
  {
    week: 1,
    icon: "😴",
    title: "수면 7시간 확보하기",
    detail: "수면 패턴을 확인하고 매일 7시간 숙면을 목표로 해요. 잠들기 전 스마트폰은 멀리 두세요.",
  },
  {
    week: 2,
    icon: "🚶",
    title: "식후 10분 걷기 (하루 1회)",
    detail: "하루 1번 이상, 식사 후 30분 이내에 10분 걷기를 실천해요. 혈당 스파이크를 낮춰줘요.",
  },
  {
    week: 3,
    icon: "🚶‍♀️",
    title: "식후 10분 걷기 (하루 2회)",
    detail: "이번 주부터는 하루 2번 이상 식후 30분 이내 10분 걷기에 도전해요.",
  },
  {
    week: 4,
    icon: "💪",
    title: "스쿼트 운동 스낵",
    detail: "스쿼트 15회 × 3세트를 하루 1번 꼭 실천해요. 틈틈이 근육을 자극하는 운동 스낵이에요.",
  },
  {
    week: 5,
    icon: "💧",
    title: "하루 물 1.5L 마시기",
    detail: "물 섭취는 대사를 높이고 가짜 배고픔을 줄여줘요. 텀블러를 항상 곁에 두세요.",
  },
  {
    week: 6,
    icon: "🥗",
    title: "채소·단백질 먼저 먹기",
    detail: "매 식사마다 채소나 단백질을 먼저 드세요. 혈당 조절과 포만감에 큰 도움이 돼요.",
  },
  {
    week: 7,
    icon: "🌙",
    title: "저녁 8시 이후 금식",
    detail: "야식을 끊고 저녁 8시 이후 음식 섭취를 멈춰요. 수면의 질도 함께 올라가요.",
  },
  {
    week: 8,
    icon: "🏃",
    title: "하루 30분 유산소 운동",
    detail: "걷기, 자전거, 수영 등 좋아하는 유산소 운동을 30분 이상 해요.",
  },
  {
    week: 9,
    icon: "🧘",
    title: "스트레스 → 5분 명상·산책",
    detail: "스트레스 받을 때 음식 대신 5분 명상이나 가벼운 산책으로 마음을 달래요.",
  },
  {
    week: 10,
    icon: "🥦",
    title: "초가공식품 주 1회 이하",
    detail: "과자·햄버거·배달음식을 주 1회 이하로 줄여요. 작은 변화가 큰 차이를 만들어요.",
  },
  {
    week: 11,
    icon: "🍽️",
    title: "식사 시간 20분 이상",
    detail: "천천히 꼭꼭 씹어 드세요. 포만감 신호가 뇌에 전달되는 데 20분이 필요해요.",
  },
  {
    week: 12,
    icon: "🏆",
    title: "나만의 평생 습관 3가지 선언",
    detail: "12주 동안 배운 습관 중 앞으로도 계속할 3가지를 골라 직접 선언해봐요!",
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
