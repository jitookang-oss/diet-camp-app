// 로컬 스토리지 기반 상태 관리 (DB 없이도 동작)
import { SurveyAnswers, Scores, BodyType } from "./scoring";

export interface BasicInfo {
  name: string;
  birthDate: string;
  age: number;
  gender: "남" | "여";
  height: number;
  weight: number;
  goalWeight: number;
  bmi: number;
  bmiCategory: string;
  medications: boolean;
  medicationDetail?: string;
  diseases: boolean;
  diseaseDetail?: string;
  menopauseSymptoms?: string[];
}

export interface WeeklyRecord {
  week: number;
  weight: number;
  answers: SurveyAnswers;
  scores: Scores;
  completedAt: string;
}

export interface ParticipantData {
  basicInfo: BasicInfo;
  week1Answers?: SurveyAnswers;
  week1Scores?: Scores;
  bodyType?: BodyType;
  weeklyRecords: WeeklyRecord[];
  week12Answers?: SurveyAnswers;
  week12Scores?: Scores;
}

const STORAGE_KEY = "dietcamp_participant";

export function saveParticipant(data: Partial<ParticipantData>) {
  const existing = loadParticipant() ?? {};
  const merged = { ...existing, ...data };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
}

export function loadParticipant(): ParticipantData | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearParticipant() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getCurrentWeek(data: ParticipantData): number {
  return (data.weeklyRecords?.length ?? 0) + 2;
}

export function calculateBMI(weight: number, height: number) {
  const bmi = weight / Math.pow(height / 100, 2);
  let category = "";
  if (bmi < 18.5) category = "저체중";
  else if (bmi < 23.0) category = "정상";
  else if (bmi < 25.0) category = "과체중";
  else if (bmi < 30.0) category = "비만 1단계";
  else category = "비만 2단계";
  return { bmi: Math.round(bmi * 10) / 10, category };
}
