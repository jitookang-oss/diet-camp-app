# 보라매직 12주 다이어트 캠프 — 프로젝트 컨텍스트

> 클로드 AI가 코딩 작업 시 **반드시 먼저 읽어야 하는** 기획 문서입니다.  
> 기획자: 이보라 약사 (@bora__magic, 이지약국)  
> **최종 업데이트: 2026-06-01**

---

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **목적** | 약국 주도 12주 그룹 다이어트 캠프의 참여자 설문·추적·결과·알림 관리 웹앱 |
| **URL** | https://diet-camp-app.vercel.app |
| **관리자** | https://diet-camp-app.vercel.app/admin (비밀번호: `NEXT_PUBLIC_ADMIN_PASSWORD` 환경변수) |
| **GitHub** | https://github.com/jitookang-oss/diet-camp-app |
| **캠프 시작일** | 2026년 6월 1일 (`src/lib/missions.ts` > `CAMP_START_DATE`) |
| **알림톡 발송 시작** | 2026년 6월 8일 (`src/lib/cron-alimtalk.ts` 내 하드코딩) |
| **브랜드** | 대외 노출은 @bora__magic. "이지약국"은 사용자에게 최소 노출 |

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 16.2.6 (App Router, TypeScript, Turbopack) |
| 스타일 | Tailwind CSS + 커스텀 CSS 변수 |
| 차트 | Recharts (RadarChart, LineChart) |
| DB | Supabase (PostgreSQL) |
| 로컬 캐시 | localStorage (오프라인 동작 보장) |
| 알림톡 | Solapi SDK (`@solapi/message-service`) |
| PDF | html2canvas + jsPDF |
| 배포 | Vercel (cron 포함) |

---

## 화면 구성 (페이지별)

### `/` — 메인 홈
- D-day 카운터: 시작 전 D-N / 진행 중 N일차·N주차 + 진행률 바 / 종료 후 완료 배지
- 이번 주 미션 카드 (해당 주차 자동 표시) → 클릭 시 미션 상세 모달
- **기존 참여자:** "이어서 하기" 버튼 (대시보드로 이동)
- **신규 참여자:** 인스타그램 아이디(@없이) + 생년월일 입력 → 온보딩으로 이동
- 기존 데이터 있으면 등록 폼 숨김 (중복 등록 방지)

### `/invite` — 초대 링크 진입
- 관리자가 생성한 초대 링크로만 캠프 참여 가능
- URL 파라미터: `phone` (사전 등록된 전화번호)
- 검증 후 `/onboarding`으로 이동, `invite_phone`을 localStorage에 저장

### `/onboarding` — 기본정보 입력 (4단계: Step 0~3)
- **Step 0:** 1회차 시즌 안내 + @bora__magic 인스타그램 DM 링크 + 개인정보 동의 (필수) — 항상 표시
- **Step 1:** 성별, 키, 몸무게 → BMI·목표체중 자동계산 (현재 × 0.85)
- **Step 2:** 카카오톡 알림 수신 번호 **(필수)**, 복용약 여부(+상세), 질환 여부(+상세)
- **Step 3:** 호르몬 변화 관련 증상 (여성만, 최근 6개월 기준 복수 선택) → 완료 시 `/survey`로 이동
  - 항목: 생리 주기 불규칙, 얼굴 홍조/열감, 수면 질 저하/식은땀, 감정 기복, 체중·복부지방 변화, 피부 건조·탈력·탈모, 피로·무기력

### `/survey` — 20문항 설문 (`?week=N` 파라미터)
- `week=1`: 초기 설문 → 체질 유형 분석 후 `/result`로
- `week=2~11`: 주차별 정기 설문 → 완료 시 몸무게 입력 → `/dashboard`로
- `week=12`: 최종 설문 → `/result?week=12`로

### `/result` — 결과 페이지
- 체질 유형 배지 + 설명 + 핵심 가이드
- 대사관리 스코어 바 (음식/활동/멘탈, 100점 만점) + 레이더 차트
- 12주 전후 비교 (최종 설문 완료 시)
- 약사 추천 영양제 (1주차만, 체질 유형별 맞춤 4그룹)
- PDF 결과지 다운로드 (html2canvas + jsPDF, A4)
- "매주 기록하러 가기" 또는 "최종 대시보드 보기" 버튼

### `/dashboard` — 참여자 대시보드
- 즐겨찾기 유도 배너 (첫 방문 시만 표시)
- 이번 주 미션 카드 → 클릭 시 미션 상세 모달 오픈
- **이번 주 미션 현황 카드:** 월~일 요일별 달성 체크 (탭으로 토글, API 저장)
- 몸무게 + 목표 달성률 요약 카드
- 체질 유형 카드
- 몸무게 변화 LineChart (목표 기준선 포함)
- 대사관리 스코어 변화 LineChart
- 주차별 기록 테이블
- **주차별 기록 버튼:** 날짜 잠금 (1주차 기록하기 → 6/7~, 매주 7일 간격)
  - 잠금 시: 🔒 표시 + 해제 날짜 안내
  - 해제 시: 버튼 활성화 → `/weekly` 경유 → `/survey?week=N`으로

### `/weekly` — 주차 라우팅 (redirect only)
- 날짜 잠금 체크 → 미해제 시 `/dashboard`로 돌려보냄
- 해제됐으면 적절한 `/survey?week=N`으로 이동

### `/checkin` — 체크인 페이지 (알림톡 링크 전용)
- URL 파라미터: `type`, `date`, `phone`, `token`
- HMAC-SHA256 토큰 검증 → Supabase `daily_checkins`에 기록
- 완료/이미완료/오류 상태 표시 → "확인 완료" 버튼 클릭 시 `window.close()`
- 저녁 체크인 완료 후: 주간 미션 체크 버튼 별도 표시

### `/admin` — 관리자 페이지 (약사 전용)
- 비밀번호 로그인 (`NEXT_PUBLIC_ADMIN_PASSWORD`)
- **참여자 목록 탭:**
  - 전체 참여자 테이블 (인스타 아이디, BMI, 체질유형, 초기점수, 감량, 진행주차)
  - 참여자 클릭 → 간략 모달 (초대 링크, 신체 정보, 건강 상태, 대사관리 점수 비교, 주차별 몸무게)
  - **상세 조회 버튼** (1주차 설문 완료 또는 호르몬 증상 데이터 있는 참여자에 한해 표시):
    - 몸무게 변화 LineChart
    - 대사관리 스코어 변화 LineChart (음식/활동/멘탈/종합)
    - 레이더 차트 (최신 주차 기준)
    - 설문 답변 상세 (1주차 vs 12주차 문항별 비교, PART별 펼치기)
    - 호르몬 변화 관련 증상 목록
  - 참여자 추가 버튼 (이름+전화번호 단건 등록)
  - 엑셀/CSV 일괄 업로드 (xlsx 파싱 → 미리보기 → 등록)
  - 초대 링크 복사 버튼 (참여자별)
  - 참여자 삭제 버튼
- **체크인 현황 탭:**
  - 날짜 선택 → 당일 체크인 내역 조회 (영양제/점심걷기/저녁운동/주간미션)

### `/reset` — 데이터 초기화 페이지
- 이 기기의 localStorage 전체 삭제
- 초대 링크로 다시 시작할 수 있도록 안내

---

## 카카오 알림톡 시스템

### 발송 일정 (Vercel Cron, UTC 기준)

| 시간(KST) | UTC | 내용 | 체크인 타입 |
|-----------|-----|------|-------------|
| 오전 8시 | 23:00 전일 | 영양제 챙기기 | `supplement` |
| 낮 12:30 | 03:30 | 점심 걷기 | `lunch_walk` |
| 저녁 7시 | 10:00 | 저녁 운동 | `evening_exercise` |

### 보안
- 크론 API: `Authorization: Bearer {CRON_SECRET}` 헤더 검증
- 체크인 링크: HMAC-SHA256(`phone:date:type` + `CHECKIN_SECRET`) 앞 16자리
- 중복 방지: Supabase `unique(phone, check_date, type)` 제약

---

## 설문 문항 (20문항 = 25문항 중 Q13·Q15·Q19·Q21·Q24 삭제)

### PART 1: 음식 (Meal) — 9문항

| 번호 | 질문 | 가중치 |
|------|------|--------|
| Q1★ | 한 끼 식사 시간은? | 2배 |
| Q2 | 채소·단백질 먼저 먹나요? | 1배 |
| Q3 | 매끼 단백질 포함? | 1배 |
| Q4 | 채소를 매끼 챙기나요? | 1배 |
| Q5★ | 초가공식품 주 몇 회? | 2배 |
| Q6 | 하루 물 섭취량? | 1배 |
| Q7★ | 야식 빈도? | 2배 |
| Q8 | 식사를 거른 날? | 1배 |
| Q9 | 디저트·간식 횟수? | 1배 |

### PART 2: 활동 (Mobility) — 6문항

| 번호 | 질문 | 가중치 |
|------|------|--------|
| Q10★ | 식후 바로 앉거나 눕나요? | 2배 |
| Q11★ | 식후 걷기 실천 빈도? | 2배 |
| Q12★ | 하루 앉아 있는 시간? | 2배 |
| Q14 | 근력운동 횟수? | 1배 |
| Q16 | 식후 졸음이 오나요? | 1배 |
| Q17 | 쉽게 피로한가요? | 1배 |

### PART 3: 멘탈 (Mentation) — 5문항

| 번호 | 질문 | 가중치 |
|------|------|--------|
| Q18★ | 평균 수면 시간? | 2배 |
| Q20★ | 스트레스 수준 (1~10 슬라이더) | 2배 |
| Q22★ | 스트레스 날 과식·배달? | 2배 |
| Q23 | 폭식 후 후회한 적? | 1배 |
| Q25 | 음식으로 위안을 삼나요? | 1배 |

> ★ = 핵심 문항 (가중치 2배). DB 필드명은 meal/mobility/mentation 유지.

---

## 점수 체계 & 체질 유형

- 각 파트: 가중 평균 → 0~100점 (높을수록 좋음)
- 종합: (음식 + 활동 + 멘탈) / 3

| 유형 | 아이콘 | 조건 |
|------|--------|------|
| 습관정착형 | ✨ | 3파트 모두 50점 이상 |
| 혈당불안정형 | 🍽️ | 음식만 50점 미만 |
| 대사저하형 | 🚶 | 활동만 50점 미만 |
| 스트레스과식형 | 🧘 | 멘탈만 50점 미만 |
| 복합형 | ⚡ | 2파트 이상 50점 미만 |

---

## 주차별 미션 (실제 운영 내용)

| 주차 | 아이콘 | 미션 제목 | 상담주간 |
|------|--------|-----------|---------|
| 1 | ☕ | 커피는 하루 1잔, 아침 식후 2시간 후에 | ✅ |
| 2 | 🥚 | 아침 식단에서 정제 탄수화물 빼기 | |
| 3 | 🚶 | 식후 10분 안에 10분 걷기 | |
| 4 | 🌙 | 야식 금지 + 7시간 이상 수면 | |
| 5 | 🚫 | 간식·초가공식품·액상과당·탄산음료 없애기 | |
| 6 | 💪 | 양치할 때 스쿼트 15회 3세트 (운동 스낵) | |
| 7 | 🪜 | 식후 10분 안에 계단 오르기 10분 | |
| 8 | 🏃 | 주 2회 유산소+근력 운동 | |
| 9 | 🧘 | 보상성 음식 금지 — 취미로 보상하기 | |
| 10 | 📵 | 식사 중 영상 금지 — 20~30분 천천히 먹기 | |
| 11 | 🥗 | 식사 전 채소(수용성 식이섬유) 먼저 먹기 | |
| 12 | 🥩 | 매 끼니 단백질 20~30g + 건강한 지방으로 시작 | |

> 미션 상세 설명: `src/lib/mission-descriptions.ts`

---

## 미션 체크 시스템

- **요일별 개별 체크:** 이번 주 월~일 각 날짜를 독립적으로 체크/해제
- **저장:** Supabase `daily_checkins` (type=`mission`, 날짜별 1레코드)
- **UI 위치:** 대시보드 "이번 주 미션 현황" 카드 + 미션 상세 모달 하단
- **미래 날짜:** 비활성화 (체크 불가)
- **관리자 확인:** 체크인 현황 탭에서 날짜별 조회

---

## 데이터 구조 (Supabase)

### `participants` 테이블
```
id (uuid, PK)
name (text) — 인스타그램 아이디 (@없이) 저장
phone (text, unique) — 초대·알림톡·체크인 기준 키 (필수)
birth_date, age, gender
height, weight, goal_weight, bmi, bmi_category
medications (bool), medication_detail
diseases (bool), disease_detail
menopause_symptoms (text[])
body_type
week1_answers (jsonb), week1_scores (jsonb)
weekly_records (jsonb[]) → [{week, weight, answers, scores, completedAt}]
week12_answers (jsonb), week12_scores (jsonb)
is_onboarded (bool)
updated_at (timestamptz)
```

### `daily_checkins` 테이블
```
id (uuid, PK)
phone (text)
name (text)
check_date (date)
type (text) — supplement | lunch_walk | evening_exercise | mission
created_at (timestamptz)
UNIQUE(phone, check_date, type)
```

---

## 환경 변수

| 변수명 | 용도 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | 관리자 페이지 비밀번호 |
| `NEXT_PUBLIC_APP_URL` | 앱 베이스 URL (체크인 링크 생성용) |
| `CRON_SECRET` | 크론 API 인증 토큰 |
| `CHECKIN_SECRET` | 체크인 링크 HMAC 서명 키 |
| `SOLAPI_API_KEY` | Solapi API 키 |
| `SOLAPI_API_SECRET` | Solapi API 시크릿 |
| `SOLAPI_SENDER_PHONE` | 발신 번호 (0313739970) |
| `SOLAPI_PFID` | 알림톡 채널 ID |
| `SOLAPI_TEMPLATE_MORNING` | 아침 영양제 템플릿 ID |
| `SOLAPI_TEMPLATE_LUNCH` | 점심 걷기 템플릿 ID |
| `SOLAPI_TEMPLATE_EVENING` | 저녁 운동 템플릿 ID |

---

## 파일 구조

```
src/
├── app/
│   ├── page.tsx                      # 홈 (D-day + 미션 + 로그인)
│   ├── invite/page.tsx               # 초대 링크 진입 + 전화번호 검증
│   ├── onboarding/page.tsx           # 기본정보 입력 (Step 0~3)
│   ├── survey/page.tsx               # 20문항 설문 (?week=N)
│   ├── result/
│   │   ├── page.tsx                  # 체질 분석 결과 + 영양제 추천
│   │   └── PdfReport.tsx             # PDF 캡처 전용 레이아웃
│   ├── dashboard/page.tsx            # 참여자 대시보드
│   ├── weekly/page.tsx               # 주차 라우팅 (redirect + 날짜 잠금)
│   ├── checkin/page.tsx              # 알림톡 체크인 페이지
│   ├── admin/page.tsx                # 관리자 페이지
│   ├── reset/page.tsx                # localStorage 초기화
│   └── api/
│       ├── invite/route.ts           # 초대 링크 검증 API
│       ├── checkin/route.ts          # 체크인 API (토큰 검증 + DB 저장)
│       ├── mission-check/route.ts    # 미션 체크 API (GET주간/POST체크/DELETE해제)
│       ├── admin/
│       │   └── participants/route.ts # 참여자 등록/삭제 API
│       └── cron/
│           ├── morning/route.ts      # 아침 크론 (→ cron-alimtalk.ts)
│           ├── lunch/route.ts        # 점심 크론
│           └── evening/route.ts      # 저녁 크론
├── lib/
│   ├── store.ts                      # localStorage + Supabase 동기화
│   ├── scoring.ts                    # 점수 계산 + 체질 분류 + 영양제 추천
│   ├── missions.ts                   # 주차 미션 + D-day + 날짜 잠금 + 주간날짜
│   ├── mission-descriptions.ts       # 12주 미션 상세 설명 (단락 배열)
│   ├── alimtalk.ts                   # Solapi 알림톡 발송 + 토큰 생성/검증
│   ├── cron-alimtalk.ts              # 크론 공통 핸들러 (3개 크론 공유)
│   ├── supabase.ts                   # Supabase 클라이언트 (Proxy 패턴)
│   └── supabase-server.ts            # 서버용 Supabase (getSupabase())
└── components/
    ├── KoreanInput.tsx               # 한글 IME 버그 방지 입력 컴포넌트
    └── MissionDetailModal.tsx        # 미션 상세 모달 + 요일별 체크 그리드
```

---

## 개발 시 주의사항

1. **한글 입력:** 텍스트 입력은 반드시 `KoreanInput` 컴포넌트 사용 (IME 조합 버그)
2. **캠프 시작일 변경:** `src/lib/missions.ts`의 `CAMP_START_DATE` 하나만 수정
3. **알림톡 시작일 변경:** `src/lib/cron-alimtalk.ts`의 날짜 수정
4. **recharts SSR:** 차트는 `mounted` state 후에만 렌더링 (`{mounted && <Chart />}`)
5. **Supabase 초기화:** `supabase.ts`는 Proxy 패턴 — 모듈 레벨에서 직접 초기화 금지
6. **API 클라이언트:** 모듈 레벨 생성 금지, 함수 내부에서 생성 (`alimtalk.ts` 참고)
7. **weeklyRecords:** localStorage에서 로드 시 undefined 가능 → `data.weeklyRecords ?? []` 필수
8. **KST 날짜:** `new Date(Date.now() + 9*60*60*1000).toISOString().slice(0,10)` 사용
9. **배포:** `vercel --prod` (또는 git push → Vercel 자동 배포)

---

## 구현 완료 내역

| 기능 | 완료일 |
|------|--------|
| 초기 앱 (홈·온보딩·설문·결과·대시보드) | 2026-05 |
| Supabase 연동 + 관리자 페이지 기초 | 2026-05 |
| 영양제 추천 (체질 유형별 4그룹) | 2026-05 |
| PDF 결과지 다운로드 | 2026-05 |
| 카카오 알림톡 3종 + 체크인 시스템 | 2026-05 |
| 관리자 참여자별 전체 리포트 (차트) | 2026-05 |
| 관리자 엑셀/CSV 일괄 업로드 | 2026-05 |
| 관리자 체크인 현황 탭 | 2026-05 |
| 초대 링크 시스템 (/invite + API) | 2026-05 |
| 인스타그램 아이디 기반 참여자 식별 | 2026-05 |
| 주차별 기록 날짜 잠금 | 2026-05 |
| 대시보드 즐겨찾기 유도 배너 | 2026-05 |
| 미션 상세 모달 (MissionDetailModal) | 2026-05 |
| 대사관리 스코어 네이밍 전환 (3M→음식/활동/멘탈) | 2026-05 |
| 온보딩 전화번호 필수화 + Step 0 항상 표시 | 2026-05 |
| cron KST 타임존 버그 수정 | 2026-05 |
| /reset 페이지 (localStorage 초기화) | 2026-06-01 |
| 요일별 미션 체크 (월~일 개별 토글, API 저장) | 2026-06-01 |
| 관리자 참여자 상세 조회 (차트·설문 답변·호르몬 증상) | 2026-06-01 |
| 호르몬 변화 관련 문항으로 네이밍 전환 (갱년기 → 호르몬 변화) | 2026-06-01 |

---

## 향후 계획 / 미구현

| 항목 | 비고 |
|------|------|
| 기기 변경 시 Supabase → localStorage 데이터 복원 | 현재 기기 잃으면 데이터 접근 불가 |
| 관리자 엑셀 내보내기 | 전체 참여자 데이터 xlsx 다운로드 |
