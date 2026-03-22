# finfo 이슈 및 버그 관리

> 최종 업데이트: 2026-03-22

---

## 해결된 이슈

### [FIX] ECOS 수집기 0건 수집
- **증상**: ECOS 수집 실행 시 데이터가 0건 저장됨
- **원인**: 주기 코드를 `MM`으로 잘못 입력 (올바른 값: `M`)
- **해결**: `backend/src/collectors/ecos.ts` — 모든 series의 `cycle` 값을 `'M'`으로 수정

### [FIX] 원달러 환율 데이터 2020년까지만 수집
- **증상**: ECOS 환율 데이터가 최근 5년치만 채워짐
- **원인**: 일별(D) 데이터를 10년치 가져오려니 limit 1000 초과
- **해결**: 기간을 5년으로 축소하고 limit을 2000으로 증가. statCode도 `036Y001` → `731Y001`(일별 환율 코드)로 교체 후 월별 평균 계산

### [FIX] 대시보드 데이터 null 표시
- **증상**: 데이터 수집 완료 후에도 대시보드에 null 또는 빈 값 표시
- **원인**: Redis가 데이터 수집 전 null 값을 캐시해 둠
- **해결**: `docker exec finfo-redis redis-cli FLUSHALL` 로 캐시 초기화 후 재조회

### [FIX] next.config.ts 빌드 오류
- **증상**: 프론트엔드 개발 서버 실행 시 `next.config.ts` 관련 오류
- **원인**: Next.js 14.1.3 버전은 `.ts` 설정 파일을 지원하지 않음
- **해결**: `next.config.ts` → `next.config.mjs`로 변경, TypeScript 타입 import 제거

### [FIX] Prisma DATABASE_URL 환경변수 오류
- **증상**: `prisma db push` 실행 시 DATABASE_URL을 찾지 못함
- **원인**: `.env` 파일이 루트(`/finfo/.env`)에만 있고 `backend/` 디렉토리에는 없음
- **해결**: `ln -sf /Users/raeheonyeom/claude-use/finfo/.env /Users/raeheonyeom/claude-use/finfo/backend/.env` 심링크 생성

### [FIX] 서브에이전트 Write/Bash 권한 없음
- **증상**: Team agent 실행 시 Write, Bash 툴 권한 거부됨
- **원인**: `.claude/settings.local.json`에 WebFetch만 허용되어 있고 Write/Bash 미포함
- **해결**: `.claude/settings.local.json` 의 `permissions.allow` 배열에 `"Write"`, `"Bash"` 추가

### [FIX] 스케줄러 indicatorCode ≠ DB id 불일치
- **증상**: 데이터 수집 후 DB에 저장되지 않음
- **원인**: 스케줄러가 `indicatorCode` 문자열(예: `WB_USA_GDP`)을 Prisma의 CUID `indicatorId`로 직접 사용하려 함
- **해결**: 수집 전 `prisma.indicator.findMany`로 `code → id` 매핑 테이블 생성 후 upsert 시 실제 id 사용

### [FIX] Y축 대형 숫자 raw 표시
- **증상**: GDP 차트 Y축에 `28,750,956,130,731` 같은 원시 값이 표시됨
- **원인**: Recharts YAxis에 포매터 없이 숫자 그대로 렌더링
- **해결**: `frontend/src/lib/formatters.ts` 생성. 단위별 자동 포맷: `US$` → `$28.8T`, `%` → `2.50%`, `원` → `₩1,478`, `천명` → `1,234천`

### [FIX] 국가 비교 차트 잘못된 지표 포함
- **증상**: `WB_USA_GDP` 비교 시 `FRED_GDP`(미국)가 같이 포함되어 미국 데이터 중복
- **원인**: compare API가 `code.contains: 'GDP'`로 조회 — source prefix 무관하게 GDP 포함한 모든 지표 반환
- **해결**: `backend/src/routes/indicators.ts` — 코드를 `prefix_COUNTRY_suffix` 패턴으로 파싱. `startsWith: 'WB_'` + `endsWith: '_GDP'`로 정확한 동일 소스 지표만 조회

### [FIX] @fastify/jwt 버전 충돌
- **증상**: `@fastify/jwt` 설치 후 서버 시작 시 `fastify.decorate` 관련 오류 발생
- **원인**: `@fastify/jwt@10`은 Fastify 5.x 전용. 프로젝트는 Fastify 4.x 사용
- **해결**: `@fastify/jwt@8`로 다운그레이드

### [FIX] index.ts main() 함수 닫는 중괄호 누락
- **증상**: 백엔드 서버 빌드 오류 — `startScheduler()` 호출이 else 블록 안에 들어감
- **원인**: Edit 작업 중 마스터 계정 생성 else 블록 이후 닫는 `}` 미추가
- **해결**: `startScheduler()` 호출 앞에 `}` 추가하여 else 블록 정상 종료

### [FIX] /admin 리다이렉트 작동 안 함
- **증상**: 마스터 계정으로 로그인해도 `/admin`으로 이동하지 않고 일반 대시보드로 이동
- **원인**: `NEXT_PUBLIC_MASTER_EMAIL` 환경변수가 빈 문자열 — `frontend/.env.local` 파일이 없었음
- **해결**: `frontend/.env.local` 생성:
  ```
  NEXT_PUBLIC_API_URL=http://localhost:3001
  NEXT_PUBLIC_MASTER_EMAIL=master@finfo.com
  ```

### [FIX] GLM API 429 오류 (잔액 부족)
- **증상**: AI 브리핑 생성 시 GLM API에서 `余额不足` (잔액 부족) 429 오류
- **원인**: GLM API 계정 크레딧 소진
- **해결**: Groq API로 교체 (`llama-3.3-70b-versatile` 모델, 무료 티어)

### [FIX] Gemini API 무료 티어 사용 불가
- **증상**: Gemini API Key 발급 후에도 API 호출 시 quota 오류
- **원인**: Google AI Studio 무료 API Key가 결제 계정 미연동으로 할당량 0
- **해결**: Groq API로 교체 (무료 티어에서 안정적으로 동작 확인)

---

## 알려진 미해결 이슈

현재 없음
