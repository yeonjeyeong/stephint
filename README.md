# StepHint

<p align="left">
  <img src="https://img.shields.io/badge/pages-15-1f6feb" alt="pages 15" />
  <img src="https://img.shields.io/badge/REST%20API-14%20endpoints-f97316" alt="REST API 14 endpoints" />
  <img src="https://img.shields.io/badge/AI-Gemini%20%2B%20Vision-7c3aed" alt="AI Gemini plus Vision" />
  <img src="https://img.shields.io/badge/Auth%20%2F%20DB-Supabase-0f9d58" alt="Auth and DB Supabase" />
  <img src="https://img.shields.io/badge/Deploy-Vercel-111111" alt="Deploy Vercel" />
</p>

StepHint는 학생의 풀이 과정을 읽고 막힌 지점을 진단한 뒤, 정답 대신 다음 한 단계 힌트만 제공하는 AI 기반 풀이형 학습 코치입니다.  
학생에게는 "어디에서 왜 막혔는지"를 설명 가능한 힌트로 돌려주고, 교사에게는 반복 오개념과 개입 우선순위를 빠르게 파악할 수 있는 인사이트를 제공합니다.

## 프로젝트 개요

기존의 정오답 중심 학습 도구는 결과는 보여줄 수 있어도, 학생이 풀이 과정에서 어디서 사고가 멈췄는지까지 설명해 주기는 어렵습니다.  
StepHint는 문제 이미지, 풀이 이미지, OCR 텍스트, 학생 메모를 함께 해석해 막힌 지점을 진단하고, 학생과 교사 모두가 활용할 수 있는 학습 피드백으로 연결하는 것을 목표로 합니다.

핵심 방향은 명확합니다.

- AI를 정답 생성기가 아니라 풀이 과정 진단 도구로 제한적으로 사용합니다.
- 학생에게는 정답 대신 다음 한 단계 힌트만 제공합니다.
- 교사에게는 연결된 학생 기준의 오개념, 복습 개념, 개입 필요 신호를 제공합니다.
- 권한, 데이터 접근, 이미지 저장은 교육 서비스 맥락에 맞게 역할 기반으로 분리합니다.

## 배포 정보

| 항목 | 내용 |
| --- | --- |
| 서비스 URL | [https://stephint.vercel.app/](https://stephint.vercel.app/) |
| 저장소 | [https://github.com/yeonjeyeong/stephint](https://github.com/yeonjeyeong/stephint) |
| 주요 사용자 | 학생, 교사, 관리자 교사 |
| 핵심 가치 | 정답 제공이 아닌 막힘 진단과 다음 단계 유도 |

## 핵심 기능

### 학생용 기능

- 문제 이미지, 풀이 이미지, 메모를 업로드하면 OCR과 Gemini가 함께 풀이를 해석합니다.
- 정답 노출 없이 막힌 지점, 오개념 태그, 복습 개념, 다음 한 단계 힌트를 제공합니다.
- 추가 힌트는 2단계까지만 열리며, fallback 사용 여부도 UI와 API에서 숨기지 않습니다.
- 학생은 누적 기록을 통해 어떤 유형에서 반복적으로 막히는지 스스로 점검할 수 있습니다.

### 교사용 기능

- 연결된 학생만 대시보드에 노출되어 불필요한 데이터 접근을 줄입니다.
- 반복 오개념, 복습 개념, 최근 제출 이미지, 개입 필요 학생을 한 화면에서 확인할 수 있습니다.
- 학생 상세 화면에서 최근 풀이 흐름과 교사 추천 액션을 함께 확인할 수 있습니다.
- 승인 기반 교사 권한 구조로 운영 흐름을 통제할 수 있습니다.

## 시스템 구성도

```mermaid
flowchart LR
    A["학생 업로드<br/>문제 이미지 / 풀이 이미지 / 메모"] --> B["Next.js App Router"]
    B --> C["OCR<br/>Google Cloud Vision"]
    B --> D["AI 진단 엔진<br/>Gemini + Schema Validation + Leakage Guard"]
    B --> E["Supabase<br/>Auth / Postgres / Storage / RLS"]
    C --> D
    D --> E
    E --> F["학생 결과 화면<br/>막힘 진단 / 힌트 / 복습 개념"]
    E --> G["교사 대시보드<br/>오개념 / 개입 필요 학생 / 최근 제출"]
```

## 기술 스택

| 영역 | 스택 |
| --- | --- |
| Frontend | Next.js App Router, React 19, Tailwind CSS 4 |
| Backend | Next.js Route Handlers |
| AI | Gemini, Zod schema validation, answer leakage guard |
| OCR | Google Cloud Vision |
| Auth / DB / Storage | Supabase Auth, Postgres, Storage, RLS |
| 차트 / 시각화 | Recharts |
| 언어 | TypeScript |

기본 AI 설정은 `AI_PROVIDER=gemini`입니다.  
Gemini 또는 Vision 호출이 실패하면 fallback 결과를 반환하며, 이 상태는 UI와 API 응답에 명시됩니다.

## 프로젝트 구조

```text
stephint/
├─ public/
│  ├─ file.svg
│  ├─ globe.svg
│  ├─ next.svg
│  ├─ vercel.svg
│  └─ window.svg
├─ src/
│  ├─ app/
│  │  ├─ access-denied/
│  │  │  └─ page.tsx
│  │  ├─ api/
│  │  │  ├─ analyze/route.ts
│  │  │  ├─ auth/
│  │  │  │  ├─ forgot-password/route.ts
│  │  │  │  ├─ login/route.ts
│  │  │  │  ├─ logout/route.ts
│  │  │  │  ├─ reset-password/route.ts
│  │  │  │  ├─ session/route.ts
│  │  │  │  └─ signup/route.ts
│  │  │  ├─ dashboard/summary/route.ts
│  │  │  ├─ hints/route.ts
│  │  │  ├─ history/route.ts
│  │  │  ├─ submissions/[id]/route.ts
│  │  │  └─ teacher/
│  │  │     ├─ approvals/[id]/route.ts
│  │  │     └─ students/
│  │  │        ├─ link/route.ts
│  │  │        └─ [id]/dashboard/route.ts
│  │  ├─ auth/confirm/route.ts
│  │  ├─ features/
│  │  │  ├─ hint/page.tsx
│  │  │  ├─ insight/page.tsx
│  │  │  └─ misconception/page.tsx
│  │  ├─ forgot-password/page.tsx
│  │  ├─ login/page.tsx
│  │  ├─ reset-password/page.tsx
│  │  ├─ signup/page.tsx
│  │  ├─ student/
│  │  │  ├─ history/page.tsx
│  │  │  ├─ result/[id]/page.tsx
│  │  │  └─ upload/page.tsx
│  │  ├─ teacher/
│  │  │  ├─ dashboard/page.tsx
│  │  │  ├─ pending/page.tsx
│  │  │  └─ students/[id]/page.tsx
│  │  ├─ favicon.ico
│  │  ├─ globals.css
│  │  ├─ layout.tsx
│  │  └─ page.tsx
│  ├─ components/
│  │  ├─ auth/RoleGuard.tsx
│  │  ├─ layout/
│  │  │  ├─ Footer.tsx
│  │  │  └─ Header.tsx
│  │  └─ submission/ZoomableSubmissionImage.tsx
│  ├─ context/RoleContext.tsx
│  ├─ lib/
│  │  ├─ ai/
│  │  │  ├─ guards/answer-leak-guard.ts
│  │  │  ├─ providers/
│  │  │  │  ├─ gemini-provider.ts
│  │  │  │  ├─ mock-provider.ts
│  │  │  │  └─ provider-types.ts
│  │  │  ├─ schemas/diagnosis-schema.ts
│  │  │  ├─ analyzer.ts
│  │  │  ├─ format-ai-text.ts
│  │  │  └─ hint-generator.ts
│  │  ├─ auth/
│  │  │  ├─ access.ts
│  │  │  ├─ rate-limit.ts
│  │  │  ├─ session.ts
│  │  │  └─ types.ts
│  │  ├─ db/
│  │  │  ├─ queries.ts
│  │  │  ├─ supabase-browser.ts
│  │  │  └─ supabase.ts
│  │  ├─ diagnosis/misconception-tags.ts
│  │  ├─ ocr/vision-ocr.ts
│  │  └─ storage/submission-images.ts
│  ├─ seed/mock-data.ts
│  ├─ types/
│  │  ├─ diagnosis.ts
│  │  └─ submission.ts
│  └─ proxy.ts
├─ supabase/
│  ├─ schema.sql
│  └─ seed.sql
├─ .gitignore
├─ eslint.config.mjs
├─ next.config.ts
├─ package-lock.json
├─ package.json
├─ postcss.config.mjs
├─ README.md
└─ tsconfig.json
```

## 권한 및 보안 구조

- 학생과 교사 기능은 역할 기반으로 분리되어 있습니다.
- 교사 기능은 관리자 승인 이후 활성화되도록 설계되어 있습니다.
- 승인되지 않은 교사 계정은 교사 전용 기능에 접근할 수 없으며 승인 대기 화면으로 이동합니다.
- 교사 대시보드는 연결된 학생 데이터만 조회할 수 있습니다.
- 업로드 이미지는 비공개 Storage에 저장되며, 응답 시 signed URL로 변환해 제공합니다.

## 저장 구조

- 업로드 이미지는 Supabase Storage `submission-images` 버킷에 저장됩니다.
- 경로 규칙은 아래와 같습니다.
  - `userId/submissionId/problem.ext`
  - `userId/submissionId/solution.ext`
- DB의 `problem_image_url`, `solution_image_url` 컬럼에는 storage path를 저장하고, API 응답 시 signed URL로 변환합니다.

## 공식 데모 계정

시연은 아래 계정을 기준으로 진행하는 것을 권장합니다.  
필요한 경우 학생 계정과 교사 계정을 추가하여 시나리오를 확장할 수 있습니다.  
단, 추가 교사 계정은 관리자 교사의 승인을 거쳐야 교사 전용 기능을 사용할 수 있습니다.

### 학생 1

- 이메일: `student.one@example.com`
- 비밀번호: `Student!123`
- 닉네임: `student.one`

### 학생 2

- 이메일: `student.two@example.com`
- 비밀번호: `Student!234`
- 닉네임: `student.two`

### 관리자 교사

- 이메일: `teacher.one@example.com`
- 비밀번호: `Teacher!123`
- 닉네임: `teacher.one`

## 권장 시연 순서

1. 학생 계정으로 로그인합니다.
2. 문제 이미지와 풀이 이미지를 업로드해 진단 결과 화면을 보여줍니다.
3. OCR 토글, 진단 메타데이터 배지, 추가 힌트를 확인합니다.
4. 관리자 교사 계정으로 로그인합니다.
5. 교사 대시보드에서 요약 문구, 개입 필요 학생, 최근 제출 이미지를 보여줍니다.
6. 학생 상세 화면에서 교사 추천 액션과 반복 오개념을 설명합니다.
7. 필요하다면 추가 교사 계정을 생성한 뒤 승인 대기부터 관리자 승인까지의 권한 흐름을 시연합니다.

## 라이선스

이 프로젝트는 2026 KIT 바이브코딩 공모전 출품작입니다.
