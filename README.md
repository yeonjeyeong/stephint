# StepHint

StepHint는 학생의 풀이 과정을 읽고 막힌 지점을 진단한 뒤, 정답 대신 다음 한 단계 힌트만 제공하는 풀이형 학습 코치입니다. 교사는 연결된 학생의 반복 오개념, 복습 개념, 개입이 필요한 학생을 한눈에 볼 수 있습니다.

## 문제 정의

- 학생은 풀이 과정에서 어디서 막혔는지 설명하기 어렵고, 보통은 정답만 확인하고 넘어갑니다.
- 교사는 개별 학생의 사고 흐름을 모두 읽기 어렵고, 반복 오개념이 누적되어도 뒤늦게 파악하는 경우가 많습니다.
- StepHint는 학생의 풀이 이미지를 진단 데이터로 바꾸고, 그 결과를 교사용 인사이트까지 연결합니다.

## 핵심 가치

### 학생용

- 문제 이미지, 풀이 이미지, 메모를 올리면 OCR과 Gemini가 함께 풀이를 읽습니다.
- 정답 노출 없이 막힌 지점, 오개념 태그, 복습 개념, 다음 한 단계 힌트를 제공합니다.
- 추가 힌트는 2단계까지만 열리며 fallback 여부도 숨기지 않습니다.

### 교사용

- 연결된 학생만 대시보드에 노출됩니다.
- 반복 오개념, 복습 개념, 최근 제출 이미지, 개입 필요 학생을 한 화면에서 확인합니다.
- 학생 상세 화면에서 최근 풀이 이미지와 교사 추천 액션을 같이 볼 수 있습니다.

## AI 구성

- 진단 엔진: `Gemini + JSON schema validation + answer leakage guard`
- OCR: `Google Cloud Vision`
- 데이터 저장: `Supabase Auth + Postgres + Storage + RLS`
- 프론트엔드: `Next.js App Router + React + Tailwind`

기본 설정은 `AI_PROVIDER=gemini`입니다. Gemini 또는 Vision 호출이 실패하면 fallback 결과를 반환하지만, UI와 API 응답에 fallback 사용 여부를 명시합니다.

## 데모 계정

### 학생 1

- 이메일: `student.one@example.com`
- 비밀번호: `Student!123`
- 닉네임: `student.one`

### 학생 2

- 이메일: `student.two@example.com`
- 비밀번호: `Student!234`
- 닉네임: `student.two`

### 교사

- 이메일: `teacher.one@example.com`
- 비밀번호: `Teacher!123`
- 닉네임: `teacher.one`

## 권장 시연 순서

1. 학생 계정으로 로그인합니다.
2. 문제 이미지와 풀이 이미지를 업로드해 진단 결과 화면을 보여줍니다.
3. OCR 토글, 진단 메타데이터 배지, 추가 힌트를 확인합니다.
4. 교사 계정으로 로그인합니다.
5. 교사 대시보드에서 요약 문구, 개입 필요 학생, 최근 제출 이미지를 보여줍니다.
6. 학생 상세 화면으로 들어가 교사 추천 액션과 반복 오개념을 설명합니다.

## 저장 구조

- 업로드 이미지는 Supabase Storage `submission-images` 버킷에 저장됩니다.
- 경로 규칙:
  - `userId/submissionId/problem.ext`
  - `userId/submissionId/solution.ext`
- DB의 `problem_image_url`, `solution_image_url` 컬럼에는 storage path를 저장하고, API 응답 시 signed URL로 변환합니다.
