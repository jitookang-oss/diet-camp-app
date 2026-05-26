# 이지약국 12주 다이어트 캠프 — 프로젝트 컨텍스트

> 이 문서는 클로드 AI가 프로젝트 전체 맥락을 파악하기 위한 참조 문서입니다.
> 기획자: 이보라 약사 (@보라매직, 이지약국)
> 최종 업데이트: 2026-05-26

---

## 프로젝트 개요

**목적:** 약국 주도 12주 그룹 다이어트 캠프의 참여자 설문·추적·결과·알림 관리 웹앱  
**URL:** https://diet-camp-app.vercel.app  
**관리자 페이지:** https://diet-camp-app.vercel.app/admin (비밀번호: boramejic2026)  
**GitHub:** https://github.com/jitookang-oss/diet-camp-app  
**캠프 시작일:** 2026년 6월 1일

---

## 기술 스택

- **프레임워크:** Next.js 15 (App Router, TypeScript)
- **스타일:** Tailwind CSS + 커스텀 CSS 변수
- **차트:** Recharts (RadarChart, LineChart)
- **DB:** Supabase (PostgreSQL) — 참여자 데이터 클라우드 저장
- **로컬 캐시:** localStorage (오프라인 동작 보장)
- **알림:** 솔라피(Solapi) 카카오 알림톡 (ATA)
- **배포:** Vercel (GitHub 연동, push 시 자동 배포, Cron Jobs 내장)
- **엑셀 파싱:** SheetJS(xlsx)

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
- 캠프 D-day 카운터 (시작 전: D-N, 진행 중: N일차·N주차 + 진행률 바)
- 이번 주 미션 카드 (자동으로 해당 주차 미션 표시)
- 기존 참여자: 이어서 하기
- 신규 참여자: 이름 + 생년월일 입력 → 온보딩으로 이동

### `/onboarding` — 기본정보 입력 (3단계)
- Step 1: 성별, 키, 몸무게 → BMI·목표체중 자동계산 (현재 몸무게 × 0.85)
- Step 2: 카카오톡 알림 수신 번호(선택), 복용약 여부(+상세), 질환 여부(+상세)
- Step 3: 갱년기 증상 (여성만) → 완료 시 `/survey`로 이동

### `/survey` — 25문항 설문
- `?week=1` : 초기 설문 (체질 분석용)
- `?week=2~11` : 주차별 정기 설문 (매주 25문항 + 몸무게 입력)
- `?week=12` : 12주 최종 설문

### `/result` — 결과 페이지
- 체질 유형 배지 + 설명
- 3M 점수 (100점 만점)
- 레이더 차트 (균형 분석)
- 12주 전후 비교 (최종 설문 완료 시)
- 약사 추천 영양제 (1주차만, 체질 유형별 맞춤)
- PDF 결과지 다운로드 (html2canvas + jsPDF, A4 형식)

### `/dashboard` — 대시보드
- 주차별 몸무게 변화 (LineChart)
- 주차별 3M 점수 변화 (LineChart)
- 주차별 기록 테이블

### `/checkin` — 체크인 페이지 (알림톡 링크 전용)
- 카카오 알림톡 버튼에서 진입
- URL 파라미터: `type`, `date`, `phone`, `token` (HMAC-SHA256 서명 검증)
- 체크인 유형: `supplement`(영양제), `lunch_walk`(점심 걷기), `evening_exercise`(저녁 운동)
- 결과: 성공 / 이미완료 / 오류 화면 표시 후 창 닫기

### `/admin` — 관리자 페이지 (약사 전용)
- 비밀번호 로그인 (boramejic2026)
- 전체 참여자 목록: 이름, 전화번호, 성별·나이, BMI, 체질유형, 초기점수, 감량, 진행주차
- 참여자 클릭 → 상세 모달: 신체정보, 건강상태, 3M 점수 비교, 주차별 몸무게·점수
- **참여자 추가** 버튼: 이름 + 전화번호 단건 등록 모달
- **엑셀 업로드** 버튼: xlsx/csv 파싱 → 미리보기 → 일괄 등록 모달
  - 인식 열 이름: `이름/성명/Name`, `전화번호/핸드폰/휴대폰/연락처/Phone`
  - 같은 전화번호는 중복 등록 없이 업데이트(upsert)

---

## 카카오 알림톡 자동 발송 (Vercel Cron)

### 발송 시각 (한국시간 KST)

| 시각 | API 경로 | 체크인 유형 | 템플릿 ID |
|------|----------|-------------|-----------|
| 오전 8:00 | `/api/cron/morning` | supplement (영양제) | KA01TP260521100936410Rf93C4rD1s3 |
| 오후 12:30 | `/api/cron/lunch` | lunch_walk (점심 걷기) | KA01TP260521101616298gAI5S47h3NN |
| 오후 7:00 | `/api/cron/evening` | evening_exercise (저녁 운동) | KA01TP260521101940280CYUcKcEPSTr |

### 발송 흐름
1. Vercel Cron이 `Authorization: Bearer {CRON_SECRET}` 헤더로 API 호출
2. Supabase `participants` 테이블에서 `phone` 있는 참여자 전체 조회
3. 각 참여자에게 HMAC-SHA256 서명된 체크인 링크 포함 알림톡 발송
4. 참여자가 링크 클릭 → `/checkin` 페이지 → `daily_checkins` 테이블에 기록

### 솔라피 설정
- **PFID:** KA01PF260521063443167FE715zBSge5
- **발신번호:** 0313739970
- 템플릿 변수: `#{이름}`, `#{주차}`

---

## 설문 문항 전체 (25문항)

### PART 1: Meal (식사) — Q1~Q9, 9문항

| 번호 | 질문 | 선택지 | 가중치 |
|------|------|--------|--------|
| Q1★ | 평소 식사 속도는? | 15분이상 / 10분내외 / 5분이내 | 2배 |
| Q2 | 식사 시 채소나 단백질을 먼저 먹나요? | 주5회이상 / 주2~4회 / 주1회이하 | 1배 |
| Q3 | 매끼 단백질(고기·생선·두부·달걀 등)을 포함하나요? | 주5회이상 / 주2~4회 / 주1회이하 | 1배 |
| Q4 | 매끼 채소를 충분히 드시나요? | 주5회이상 / 주2~4회 / 주1회이하 | 1배 |
| Q5★ | 초가공식품(과자·햄버거·햄 등)을 주 몇 회 먹나요? | 거의안먹음 / 주1~2회 / 주3~5회 / 거의매일 | 2배 |
| Q6 | 하루 물 섭취량은? | 1.5L이상 / 1~1.5L / 1L미만 | 1배 |
| Q7★ | 야식(저녁 9시 이후 식사·간식)을 먹나요? | 거의안함 / 주1~2회 / 주3회이상 | 2배 |
| Q8 | 끼니를 거르는 경우가 있나요? | 없음 / 주1회 / 주2회이상 | 1배 |
| Q9 | 디저트나 간식을 찾아서 먹나요? | 0회 / 주1회 / 주2~3회 / 주4회이상 | 1배 |

### PART 2: Mobility (활동) — 6문항 (Q13·Q15 삭제됨)

| 번호 | 질문 | 선택지 | 가중치 |
|------|------|--------|--------|
| Q10★ | 식사 후 바로 앉거나 눕는 편인가요? | 전혀그렇지않다 / 주1회정도 / 주말에가끔 / 대부분그렇다 | 2배 |
| Q11★ | 식후 10분 이상 걷거나 움직이나요? | 주5회이상 / 주2~4회 / 주1회이하 | 2배 |
| Q12★ | 하루 중 앉아 있는 시간은? | 2시간미만 / 2~4시간 / 4~6시간 / 6시간이상 | 2배 |
| Q14 | 근력운동(스쿼트·플랭크·헬스 등)을 하나요? | 주4회이상 / 주2~3회 / 주1회 / 안함 | 1배 |
| Q16 | 식후 졸음이 오나요? | 거의그렇지않다 / 주2~3회그렇다 / 거의매일그렇다 | 1배 |
| Q17 | 이유 없이 피로하다고 느끼나요? | 거의그렇지않다 / 주2~3회피로 / 일상어려울만큼피곤 | 1배 |

### PART 3: Mentation (마음) — 5문항 (Q19·Q21·Q24 삭제됨)

| 번호 | 질문 | 선택지 | 가중치 |
|------|------|--------|--------|
| Q18★ | 평균 수면 시간은? | 7~8시간(100) / 8시간이상(80) / 6~7시간(60) / 5~6시간(30) / 5시간미만(0) | 2배 |
| Q20★ | 현재 스트레스 수준은? (1~10 슬라이더) | 1=없음, 10=일상어려움 | 2배 |
| Q22★ | 스트레스 받은 날은 배달앱을 켜나요? | 전혀그렇지않다 / 절반정도먹는걸로푼다 / 매번먹는걸로푼다 | 2배 |
| Q23 | 폭식을 하거나 먹고 나서 후회한 적이 있나요? | 전혀그렇지않다 / 주1회정도그렇다 / 주2회이상그렇다 | 1배 |
| Q25 | 기분이 안 좋을 때 음식으로 위안을 삼나요? | 전혀그렇지않다 / 주1~2회 / 주3회이상 | 1배 |

> ★ 표시는 핵심 문항 (가중치 2배 적용)

---

## 점수 체계

- **각 파트 점수:** 가중 평균 → 0~100점
- **종합 점수:** (Meal + Mobility + Mentation) / 3
- **표시 형식:** "72 / 100점"

---

## 체질 유형 분류 (기준: 50점 미만 파트 수)

| 유형 | 조건 | 아이콘 |
|------|------|--------|
| 습관정착형 | 3파트 모두 50점 이상 | ✨ |
| 혈당불안정형 | Meal만 50점 미만 | 🍽️ |
| 대사저하형 | Mobility만 50점 미만 | 🚶 |
| 스트레스과식형 | Mentation만 50점 미만 | 🧘 |
| 복합형 | 2파트 이상 50점 미만 | ⚡ |

---

## 주차별 미션 (12주)

| 주차 | 미션 제목 | 내용 |
|------|-----------|------|
| 1주 | 수면 7시간 확보하기 | 매일 7시간 숙면 목표 |
| 2주 | 식후 10분 걷기 1회 | 식사 후 30분 이내 10분 걷기 하루 1회 |
| 3주 | 식후 10분 걷기 2회 | 하루 2번 이상으로 늘리기 |
| 4주 | 스쿼트 운동 스낵 | 스쿼트 15회×3세트 하루 1번 |
| 5주 | 하루 물 1.5L 마시기 | 텀블러 항상 곁에 두기 |
| 6주 | 채소·단백질 먼저 먹기 | 매 식사 채소·단백질 선행 |
| 7주 | 저녁 8시 이후 금식 | 야식 끊기 |
| 8주 | 하루 30분 유산소 운동 | 걷기·자전거·수영 등 |
| 9주 | 스트레스 → 5분 명상·산책 | 음식 대신 감정 관리 |
| 10주 | 초가공식품 주 1회 이하 | 배달·가공식품 줄이기 |
| 11주 | 식사 시간 20분 이상 | 천천히 꼭꼭 씹기 |
| 12주 | 평생 습관 3가지 선언 | 12주 배운 것 중 평생 실천할 것 선택 |

---

## 데이터 구조 (Supabase DB)

### `participants` 테이블

```
id (uuid, PK)
name (text)
phone (text, unique) — 알림톡 발송 대상, upsert 기준 키
birth_date (text)
age (int)
gender (text)
height (float), weight (float), goal_weight (float)
bmi (float), bmi_category (text)
medications (bool), medication_detail (text)
diseases (bool), disease_detail (text)
menopause_symptoms (text[])
body_type (text)
week1_answers (jsonb), week1_scores (jsonb)
weekly_records (jsonb) → [{week, weight, answers, scores, completedAt}]
week12_answers (jsonb), week12_scores (jsonb)
updated_at (timestamptz)
```

> 관리자가 직접 등록한 참여자는 name + phone만 입력, 나머지는 참여자 온보딩 시 채워짐

### `daily_checkins` 테이블

```
id (uuid, PK)
phone (text)
name (text)
check_date (date)
type (text) — supplement | lunch_walk | evening_exercise
created_at (timestamptz)
UNIQUE(phone, check_date, type) — 중복 체크인 방지
```

---

## 주요 파일 구조

```
src/
├── app/
│   ├── page.tsx                    # 홈 (D-day + 미션 + 로그인)
│   ├── onboarding/page.tsx         # 기본정보 입력 3단계
│   ├── survey/page.tsx             # 25문항 설문 (week 파라미터)
│   ├── result/
│   │   ├── page.tsx                # 체질 분석 결과 + 영양제 추천
│   │   └── PdfReport.tsx           # PDF 캡처 전용 레이아웃
│   ├── dashboard/page.tsx          # 주차별 진행 현황 차트
│   ├── checkin/page.tsx            # 알림톡 체크인 랜딩 페이지
│   ├── admin/page.tsx              # 관리자 페이지 (등록·조회)
│   └── api/
│       ├── checkin/route.ts        # 체크인 처리 API
│       ├── admin/
│       │   └── participants/route.ts  # 참여자 등록 API (단건/일괄)
│       └── cron/
│           ├── morning/route.ts    # 아침 영양제 알림톡 cron
│           ├── lunch/route.ts      # 점심 걷기 알림톡 cron
│           └── evening/route.ts    # 저녁 운동 알림톡 cron
├── lib/
│   ├── store.ts                    # localStorage + Supabase 동기화
│   ├── scoring.ts                  # 점수 계산 + 체질 분류 + 영양제 추천
│   ├── missions.ts                 # 주차 미션 + D-day 계산 (CAMP_START_DATE)
│   ├── supabase.ts                 # Supabase 클라이언트
│   └── alimtalk.ts                 # 솔라피 알림톡 발송 + 토큰 생성/검증
└── components/
    └── KoreanInput.tsx             # 한글 IME 버그 방지 입력 컴포넌트
```

---

## 환경변수 (Vercel + .env.local)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_ADMIN_PASSWORD       # 관리자 페이지 비밀번호
NEXT_PUBLIC_APP_URL              # https://diet-camp-app.vercel.app

SOLAPI_API_KEY
SOLAPI_API_SECRET
SOLAPI_SENDER_PHONE              # 0313739970
SOLAPI_PFID                      # KA01PF260521063443167FE715zBSge5
SOLAPI_TEMPLATE_MORNING          # KA01TP260521100936410Rf93C4rD1s3
SOLAPI_TEMPLATE_LUNCH            # KA01TP260521101616298gAI5S47h3NN
SOLAPI_TEMPLATE_EVENING          # KA01TP260521101940280CYUcKcEPSTr

CRON_SECRET                      # Vercel Cron 인증 키
CHECKIN_SECRET                   # 체크인 토큰 HMAC 서명 키
```

---

## 개발 시 주의사항

1. **한글 입력:** 이름·약명 등 텍스트 입력은 반드시 `KoreanInput` 컴포넌트 사용 (IME 조합 버그 방지)
2. **설문 답안 키:** 내부 키는 공백 없는 한글 (예: `"주2~3회그렇다"`), 특수문자 포함 시 따옴표로 감싸야 함
3. **캠프 시작일 변경:** `src/lib/missions.ts`의 `CAMP_START_DATE` 값만 수정
4. **배포:** `git push` 하면 Vercel 자동 배포
5. **Supabase 연동:** `saveParticipant()` 호출 시 자동으로 DB 동기화, 실패해도 localStorage로 앱 작동
6. **솔라피 초기화:** `SolapiMessageService`는 모듈 최상위가 아닌 `getClient()` 함수 안에서 생성 (빌드 시 환경변수 없음 문제)
7. **체크인 토큰:** `phone:date:type` 조합을 HMAC-SHA256으로 서명, 앞 16자리만 사용

---

## 구현 완료 내역

| 기능 | 완료일 | 비고 |
|------|--------|------|
| 초기 앱 구현 (홈·온보딩·설문·결과·대시보드) | 2026-05-01 | |
| D-day 카운터 + 주차별 미션 카드 | 2026-05-01 | |
| Supabase 연동 + 관리자 페이지 기초 | 2026-05-01 | |
| 설문 문항 수정 (Q13·Q15·Q19·Q21·Q24 삭제) | 2026-05-01 | |
| 영양제 추천 기능 (체질 유형별 4그룹) | 2026-05-01 | |
| PDF 결과지 다운로드 (html2canvas + jsPDF) | 2026-05-08 | A4, 다크 테마 |
| 카카오 알림톡 일일 체크인 (아침/점심/저녁 cron) | 2026-05-25 | Vercel Cron + 솔라피 |
| 체크인 완료 후 창 닫기 (앱 이동 제거) | 2026-05-25 | |
| SolapiMessageService 빌드 오류 수정 | 2026-05-25 | getClient() 지연 초기화 |
| 솔라피 알림톡 템플릿 3개 승인 및 적용 | 2026-05-26 | 아침/점심/저녁 Template ID 확정 |
| 관리자 페이지 참여자 단건 등록 | 2026-05-26 | 이름 + 전화번호 모달 |
| 관리자 페이지 엑셀 일괄 업로드 | 2026-05-26 | xlsx/csv, 미리보기 포함 |
| POST /api/admin/participants (upsert on phone) | 2026-05-26 | |

---

## 향후 계획 (미구현)

- 관리자 페이지 일일 체크인 현황 조회 (오늘 누가 체크인했는지)
- 관리자 페이지 엑셀 내보내기 (참여자 전체 데이터 다운로드)
- 참여자 기기 변경 시 Supabase에서 데이터 복원 기능
- 주차별 알림톡 내용 개인화 (이번 주 미션 내용 포함)
