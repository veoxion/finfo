# finfo - Financial Information Service

## 서비스 목적

흩어져 있는 글로벌/국내 경제 지표를 하나의 대시보드에서 통합 제공하는 서비스.
무료로 공개된 경제 데이터 API들을 수집·정규화·시각화하여 개인 투자자, 학생, 연구자 등이 쉽게 경제 데이터를 탐색할 수 있도록 한다.

**핵심 가치**: 한국(ECOS, KOSIS)과 글로벌(World Bank, FRED, BLS) 경제 지표를 통합 비교

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | Next.js 14 (App Router) + TypeScript + Tailwind CSS + Recharts + TanStack Query |
| 백엔드 | Node.js + Fastify 4.x + TypeScript |
| 인증 | @fastify/jwt@8 (JWT Bearer Token) |
| DB | PostgreSQL 16 + Redis 7 (캐시) |
| ORM | Prisma |
| AI | Groq API (llama-3.3-70b-versatile) |
| 배포 | Railway (프론트엔드 + 백엔드 + PostgreSQL + Redis) |

## 핵심 설계 원칙

- **외부 API 호출 최소화**: 모든 데이터는 DB에 캐시 후 서빙. 호출 제한 초과 방지.
- **정규화 레이어 필수**: API마다 날짜 포맷·단위·통화가 다름. 수집 시 반드시 통일.
- **장애 대비**: 외부 API 장애 시 서킷 브레이커 + 재시도 로직 적용.
- **출처 표기**: World Bank, FRED 등 attribution 요구 API는 UI에 출처 표시.

## 주요 제약사항

- BLS(500회/일), BEA(1,000회/일) 일일 호출 제한 엄수
- SEC EDGAR: `User-Agent` 헤더에 이메일 포함 필수
- API Key는 환경 변수로만 관리. 코드에 하드코딩 금지.
- 상업적 이용 시 각 API 이용약관 별도 확인 필요

## 문서 가이드

> `docs/` 폴더는 git에 포함되지 않으며 로컬에서만 관리합니다.

| 파일 | 내용 |
|------|------|
| `docs/planning.md` | 앞으로의 작업 계획 (P2/P3 미착수 항목) |
| `docs/progress.md` | 완료된 구현 현황 (P0 MVP → P1 회원/커뮤니티 → 배포) |
| `docs/issue.md` | 버그·이슈 발생 및 해결 내역 |
| `docs/finfo-infra.md` | 기술 스택, API 엔드포인트, DB 스키마, 수집 스케줄, 환경변수, 배포 가이드 |
