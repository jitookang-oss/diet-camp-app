import { SurveyAnswers, Scores, BodyType } from "./scoring";
import { supabase } from "./supabase";

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
  phone?: string;
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
  missionChecks?: Record<number, boolean>; // campWeek → 달성 여부 (localStorage only)
}

const STORAGE_KEY = "dietcamp_participant";

export function saveParticipant(data: Partial<ParticipantData>) {
  const existing = loadParticipant() ?? {};
  const merged = { ...existing, ...data } as ParticipantData;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

  // Supabase에 비동기 동기화 (실패해도 앱은 계속 작동)
  syncToSupabase(merged).catch(() => {});
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

async function syncToSupabase(data: ParticipantData) {
  if (!data.basicInfo?.name) return;

  const invitePhone = typeof window !== "undefined"
    ? localStorage.getItem("invite_phone")
    : null;
  const phone = data.basicInfo.phone ?? invitePhone ?? null;

  const row = {
    name: data.basicInfo.name,
    birth_date: data.basicInfo.birthDate ?? null,
    age: data.basicInfo.age,
    gender: data.basicInfo.gender,
    height: data.basicInfo.height,
    weight: data.basicInfo.weight,
    goal_weight: data.basicInfo.goalWeight,
    bmi: data.basicInfo.bmi,
    bmi_category: data.basicInfo.bmiCategory,
    medications: data.basicInfo.medications,
    medication_detail: data.basicInfo.medicationDetail ?? null,
    diseases: data.basicInfo.diseases,
    disease_detail: data.basicInfo.diseaseDetail ?? null,
    menopause_symptoms: data.basicInfo.menopauseSymptoms ?? null,
    phone,
    week1_answers: data.week1Answers ?? null,
    week1_scores: data.week1Scores ?? null,
    body_type: data.bodyType ?? null,
    weekly_records: data.weeklyRecords ?? [],
    week12_answers: data.week12Answers ?? null,
    week12_scores: data.week12Scores ?? null,
    is_onboarded: true,
    updated_at: new Date().toISOString(),
  };

  if (phone) {
    // 초대 링크로 진입한 경우: phone 기준으로 업데이트
    await supabase
      .from("participants")
      .update(row)
      .eq("phone", phone);
  } else {
    // 기존 방식 (phone 없는 경우): name 기준 upsert
    await supabase
      .from("participants")
      .upsert({ ...row, phone: null }, { onConflict: "name" });
  }
}
