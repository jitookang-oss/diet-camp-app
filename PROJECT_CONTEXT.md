# 이지약국 12주 다이어트 캠프 — 프로젝트 컨텍스트

> 클로드 AI가 코딩 작업 시 참조하는 문서입니다. 기획자: 이보라 약사 (@보라매직, 이지약국)  
> **최종 업데이트: 2026-05-31**

---

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **목적** | 약국 주도 12주 그룹 다이어트 캠프의 참여자 설문·추적·결과 관리 웹앱 |
| **URL** | https://diet-camp-app.vercel.app |
| **관리자** | https://diet-camp-app.vercel.app/admin (비밀번호: 환경변수 `NEXT_PUBLIC_ADMIN_PASSWORD`) |
| **GitHub** | https://github.com/jitookang-oss/diet-camp-app |
| **캠프 시작일** | 2026년 6월 1일 (`src/lib/missions.ts` > `CAMP_START_DATE`) |
| **알림톡 발송 시작** | 2026년 6월 8일 (크론 API 내 하드코딩) |

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 16.2.6 (App Router, TypeScript, Turbopack) |
| 스타일 | Tailwind CSS + 커스텀 CSS 변수 |
| 차트 | Recharts (RadarChart, LineChart) |
| DB | Supabase (PostgreSQL) — 참여자·체크인 데이터 클라우드 저장 |
| 로컬 캐시 | localStorage (오프라인 동작 보장) |
| 알림톡 | Solapi SDK (`@solapi/message-service`) |
| PDF | html2canvas + jsPDF |
| 배포 | Vercel (cron 포함) |

---

## 3M 전략 (핵심 개념)

| 영문 | 한글 | 내용 |
|------|------|------|
| Meal | 식사 | 식사 속도·순서·구성·수분·야식 등 |
| Mobility | 활동 | 식후 활동, 앉는 시간, 근력운동 등 |
| Mentation | 마음 | 수면, 스트레스, 감정적 식이 행동 등 |

---

## 화면 구성 (페이지별)

### `/` — 메인 홈
- D-day 카운터: 시작 전 D-N, 진행 중 N일차·N주차 + 진행률 바, 캠프 종료 후 완료 배지
- 이번 주 미션 카드 (해당 주차 자동 표시)
- **기존 참여자:** "이어서 하기" 버튼 (대시보드로 이동)
- **신규 참여자:** 닉네임 + 생년월일 입력 → 온보딩으로 이동
- **기존 데이터 있으면 등록 폼 숨김** (중복 등록 방지)

### `/onboarding` — 기본정보 입력 (4단계: Step 0~3)
- **Step 0 (신규):** 1회차 시즌 안내 + @bora__magic 인스타그램 DM 링크 + 개인정보 동의 체크박스 (필수)
- Step 1: 성별, 키, 몸무게 → BMI·목표체중 자동계산 (현재 몸무게 × 0.85)
- Step 2: 카카오톡 알림 수신 번호(선택), 복용약 여부(+상세), 질환 여부(+상세)
- Step 3: 갱년기 증상 (여성만) → 완료 시 `/survey`로 이동

### `/survey` — 20문항 설문 (`?week=N` 파라미터)
- `week=1`: 초기 설문 → 체질 유형 분석 후 `/result`로
- `week=2~11`: 주차별 정기 설문 → 완료 시 몸무게 입력 → `/dashboard`로
- `week=12`: 최종 설문 → `/result?week=12`로

### `/result` — 결과 페이지 (`?week=12` 파라미터)
- 체질 유형 배지 + 설명
- 3M 점수 바 (100점 만점) + 레이더 차트
- 12주 전후 비교 (최종 설문 완료 시)
- 약사 추천 영양제 (1주차만, 체질 유형별 맞춤 4그룹)
- PDF 결과지 다운로드 (html2canvas + jsPDF, 버튼 클릭 시 렌더링)
- "매주 기록하러 가기" 또는 "최종 대시보드 보기" 버튼

### `/dashboard` — 참여자 대시보드
- 현재 체중 + 감량 + 목표 달성률 요약 카드
- 체질 유형 카드 (아이콘 + 가이드)
- 몸무게 변화 LineChart (목표 기준선 포함)
- 3M 스코어 변화 LineChart
- 주차별 기록 테이블
- **주차별 기록 버튼 날짜 잠금:** 1주차 기록하기 6/7~, 2주차 6/14~, 이후 매주 7일 간격
- **즐겨찾기 유도 배너:** 첫 방문 시(주차 기록 없을 때)만 표시

### `/checkin` — 체크인 페이지
- 알림톡 링크 클릭 시 도달하는 페이지
- URL 파라미터: `type`, `date`, `phone`, `token`
- HMAC-SHA256 토큰 검증 → Supabase `daily_checkins`에 기록
- 완료/이미체크/오류 상태 표시 → "확인 완료" 버튼 클릭 시 `window.close()`

### `/weekly` — 주차 라우팅 (redirect only)
- 날짜 잠금 체크 → 미해제 시 `/dashboard`로 돌려보냄
- 해제됐으면 적절한 `/survey?week=N`으로 이동

### `/admin` — 관리자 페이지 (약사 전용)
- 비밀번호 로그인 (`NEXT_PUBLIC_ADMIN_PASSWORD` 환경변수)
- 전체 참여자 목록 테이블: 닉네임, BMI, 체질유형, 초기/최종 점수, 감량, 진행주차
- **참여자 클릭 → 전체 리포트 모달:**
  - 핵심 요약 (시작·현재 체중 / 감량 / 목표 달성률)
  - 체질 유형 카드 (아이콘 + 설명 + 가이드)
  - 몸무게 변화 LineChart
  - 3M 스코어 변화 LineChart
  - 초기 vs 최종 점수 비교
  - 주차별 상세 테이블 (초기·각주차·최종, 식사·활동·마음·종합)
  - 건강 상태 (복용약·질환·갱년기 증상)

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
- 체크인 링크: HMAC-SHA256(`phone + date + type + CHECKIN_SECRET`) 토큰
- 토큰 재사용 방지: Supabase `unique(phone, date, type)` 제약

### 알림톡 버튼 URL 형식
```
{NEXT_PUBLIC_APP_URL}/checkin?type={type}&date={date}&phone={phone}&token={token}
```

---

## 설문 문항 (20문항)

### PART 1: Meal (식사) — 9문항

| 번호 | 질문 | 선택지 | 가중치 |
|------|------|--------|--------|
| Q1★ | 한 끼 식사 시간은? | 5분이내 / 10분내외 / 15분이상 | 2배 |
| Q2 | 채소·단백질 먼저 먹나요? | 주5회이상 / 주2~4회 / 주1회이하 | 1배 |
| Q3 | 매끼 단백질 포함? | 주5회이상 / 주2~4회 / 주1회이하 | 1배 |
| Q4 | 채소를 매끼 챙기나요? | 주5회이상 / 주2~4회 / 주1회이하 | 1배 |
| Q5★ | 초가공식품 주 몇 회? | 거의안먹음 / 주1~2회 / 주3~5회 / 거의매일 | 2배 |
| Q6 | 하루 물 섭취량? | 1L미만 / 1~1.5L / 1.5L이상 | 1배 |
| Q7★ | 야식 빈도? | 거의안함 / 주1~2회 / 주3회이상 | 2배 |
| Q8 | 식사를 거른 날? | 없음 / 주1회 / 주2회이상 | 1배 |
| Q9 | 디저트·간식 횟수? | 0회 / 주1회 / 주2~3회 / 주4회이상 | 1배 |

### PART 2: Mobility (활동) — 6문항 (Q13·Q15 삭제됨)

| 번호 | 질문 | 선택지 | 가중치 |
|------|------|--------|--------|
| Q10★ | 식후 바로 앉거나 눕나요? | 전혀그렇지않다 / 주1회정도 / 주말에가끔 / 대부분그렇다 | 2배 |
| Q11★ | 식후 걷기 실천 빈도? | 주5회이상 / 주2~4회 / 주1회이하 | 2배 |
| Q12★ | 하루 앉아 있는 시간? | 2시간미만 / 2~4시간 / 4~6시간 / 6시간이상 | 2배 |
| Q14 | 근력운동 횟수? | 안함 / 주1회 / 주2~3회 / 주4회이상 | 1배 |
| Q16 | 식후 졸음이 오나요? | 거의그렇지않다 / 주2~3회그렇다 / 거의매일그렇다 | 1배 |
| Q17 | 쉽게 피로한가요? | 거의그렇지않다 / 주2~3회피로 / 일상어려울만큼피곤 | 1배 |

### PART 3: Mentation (마음) — 5문항 (Q19·Q21·Q24 삭제됨)

| 번호 | 질문 | 선택지 | 가중치 |
|------|------|--------|--------|
| Q18★ | 평균 수면 시간? | 5시간미만 / 5~6시간 / 6~7시간 / 7~8시간 / 8시간이상 | 2배 |
| Q20★ | 스트레스 수준 (1~10 슬라이더) | 1=낮음, 10=매우높음 | 2배 |
| Q22★ | 스트레스 날 과식·배달? | 전혀그렇지않다 / 절반정도먹는걸로푼다 / 매번먹는걸로푼다 | 2배 |
| Q23 | 폭식 후 후회한 적? | 전혀그렇지않다 / 주1회정도그렇다 / 주2회이상그렇다 | 1배 |
| Q25 | 음식으로 위안을 삼나요? | 전혀그렇지않다 / 주1~2회 / 주3회이상 | 1배 |

> ★ = 핵심 문항 (가중치 2배)

---

## 점수 체계

- 각 파트: 가중 평균 → 0~100점 (높을수록 좋음)
- 종합: (Meal + Mobility + Mentation) / 3

## 체질 유형 분류 (50점 미만 파트 기준)

| 유형 | 아이콘 | 조건 |
|------|--------|------|
| 습관정착형 | ✨ | 3파트 모두 50점 이상 |
| 혈당불안정형 | 🍽️ | Meal만 50점 미만 |
| 대사저하형 | 🚶 | Mobility만 50점 미만 |
| 스트레스과식형 | 🧘 | Mentation만 50점 미만 |
| 복합형 | ⚡ | 2파트 이상 50점 미만 |

---

## 주차별 미션

| 주차 | 미션 |
|------|------|
| 1 | 수면 7시간 확보하기 |
| 2 | 식후 10분 걷기 (하루 1회) |
| 3 | 식후 10분 걷기 (하루 2회) |
| 4 | 스쿼트 15회×3세트 |
| 5 | 하루 물 1.5L 마시기 |
| 6 | 채소·단백질 먼저 먹기 |
| 7 | 저녁 8시 이후 금식 |
| 8 | 하루 30분 유산소 운동 |
| 9 | 스트레스 → 5분 명상·산책 |
| 10 | 초가공식품 주 1회 이하 |
| 11 | 식사 시간 20분 이상 |
| 12 | 평생 습관 3가지 선언 |

---

## 데이터 구조 (Supabase)

### `participants` 테이블
```
id (uuid, PK)
name, birth_date → upsert 기준 (이름+생년월일 복합 유니크)
age, gender, height, weight, goal_weight, bmi, bmi_category
medications (bool), medication_detail
diseases (bool), disease_detail
menopause_symptoms (text[])
phone (선택)
body_type
week1_answers (jsonb), week1_scores (jsonb)
weekly_records (jsonb[]) → [{week, weight, answers, scores, completedAt}]
week12_answers (jsonb), week12_scores (jsonb)
updated_at
```

### `daily_checkins` 테이블
```
id (uuid, PK)
phone, date, type → unique 복합키 (중복 방지)
name
created_at
```
- type 값: `supplement` | `lunch_walk` | `evening_exercise`

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
| `SOLAPI_FROM` | 발신 번호 |
| `SOLAPI_TEMPLATE_MORNING` | 아침 알림 템플릿 ID |
| `SOLAPI_TEMPLATE_LUNCH` | 점심 알림 템플릿 ID |
| `SOLAPI_TEMPLATE_EVENING` | 저녁 알림 템플릿 ID |

---

## 파일 구조

```
src/
├── app/
│   ├── page.tsx                    # 홈 (D-day + 미션 + 로그인)
│   ├── onboarding/page.tsx         # 기본정보 입력 (Step 0~3)
│   ├── survey/page.tsx             # 20문항 설문 (?week=N)
│   ├── result/
│   │   ├── page.tsx                # 체질 분석 결과 + 영양제 추천
│   │   └── PdfReport.tsx           # PDF 캡처 전용 레이아웃
│   ├── dashboard/page.tsx          # 참여자 대시보드 (차트 + 기록)
│   ├── checkin/page.tsx            # 알림톡 체크인 페이지
│   ├── weekly/page.tsx             # 주차 라우팅 (redirect + 날짜 잠금)
│   ├── admin/page.tsx              # 관리자 페이지 (리포트 포함)
│   └── api/
│       ├── checkin/route.ts        # 체크인 API (토큰 검증 + DB 저장)
│       └── cron/
│           ├── morning/route.ts    # 아침 크론 (→ lib/cron-alimtalk.ts)
│           ├── lunch/route.ts      # 점심 크론
│           └── evening/route.ts    # 저녁 크론
├── lib/
│   ├── store.ts                    # localStorage + Supabase 동기화
│   ├── scoring.ts                  # 점수 계산 + 체질 분류 + 영양제 추천
│   ├── missions.ts                 # 주차 미션 + D-day 계산 + 날짜 잠금
│   ├── alimtalk.ts                 # Solapi 알림톡 발송 함수
│   ├── cron-alimtalk.ts            # 크론 공통 핸들러 (3개 크론 공유)
│   └── supabase.ts                 # Supabase 클라이언트 (Proxy 패턴)
└── components/
    └── KoreanInput.tsx             # 한글 IME 버그 방지 입력 컴포넌트
```

---

## 개발 시 주의사항

1. **한글 입력:** 이름·약명 등 텍스트 입력은 반드시 `KoreanInput` 컴포넌트 사용 (IME 조합 버그 방지)
2. **캠프 시작일 변경:** `src/lib/missions.ts`의 `CAMP_START_DATE` 하나만 수정
3. **알림톡 시작일 변경:** 크론 3개 파일에서 `"2026-06-08"` 날짜를 `cron-alimtalk.ts`에서 수정
4. **recharts SSR:** 차트는 클라이언트에서만 렌더링 (`mounted` state 또는 조건부 렌더링 필수)
5. **Supabase 초기화:** `supabase.ts`는 Proxy 패턴으로 빌드 시점 초기화 방지 → 모듈 레벨에서 직접 초기화 금지
6. **환경 변수 초기화:** API 클라이언트를 모듈 레벨에서 직접 생성 금지 (빌드 실패 원인). 함수 내부에서 생성할 것 (`alimtalk.ts` 참고)
7. **배포:** `npx vercel --prod --cwd .` (또는 git push → Vercel 자동 배포)

---

## 구현 완료 내역

| 기능 | 완료일 | 비고 |
|------|--------|------|
| 초기 앱 (홈·온보딩·설문·결과·대시보드) | 2026-05 | |
| D-day 카운터 + 주차별 미션 카드 | 2026-05 | |
| Supabase 연동 + 관리자 페이지 | 2026-05 | |
| 설문 문항 수정 (Q13·Q15·Q19·Q21·Q24 삭제) | 2026-05 | |
| 영양제 추천 기능 (체질 유형별 4그룹) | 2026-05 | |
| PDF 결과지 다운로드 (html2canvas + jsPDF) | 2026-05 | A4, 다크 테마 |
| 카카오 알림톡 (Solapi) — 아침·점심·저녁 3종 | 2026-05 | 6/8부터 발송 |
| 알림톡 체크인 시스템 (`/checkin` 페이지 + API) | 2026-05 | HMAC 토큰 보안 |
| `daily_checkins` Supabase 테이블 | 2026-05 | 중복 방지 |
| 관리자 페이지 — 참여자별 전체 리포트 (차트) | 2026-05 | 몸무게·3M 차트 |
| 이름 → 닉네임 변경 (전체 UI) | 2026-05 | |
| 온보딩 Step 0 (1회차 안내 + 개인정보 동의) | 2026-05 | |
| 중복 사용자 등록 방지 | 2026-05 | |
| 주차별 기록 날짜 잠금 (6/7, 6/14...) | 2026-05 | `/weekly` 직접 접근도 차단 |
| 대시보드 즐겨찾기 유도 배너 | 2026-05 | 첫 방문 시만 표시 |
| 대시보드 recharts SSR 버그 수정 | 2026-05 | `mounted` state |
| 크론 공통 핸들러 분리 (`cron-alimtalk.ts`) | 2026-05 | 코드 중복 제거 |

---

## 향후 계획 / 미구현 항목

- 기기 변경 시 Supabase에서 데이터 복원 (현재는 localStorage만 의존)
- 관리자 페이지 엑셀 내보내기
- 체크인 현황 관리자 대시보드 (날짜별 체크인 현황)
