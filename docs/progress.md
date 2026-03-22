# finfo 개발 진행 현황

> 최종 업데이트: 2026-03-22

---

## 완료된 작업

### P0 — MVP (완료)

#### 인프라
- 모노레포 구조 (`/frontend`, `/backend` npm 워크스페이스)
- Docker Compose — PostgreSQL 16 + Redis 7
- `.env` 환경변수 파일 (루트 위치, `backend/.env` 심링크)
- `.claude/settings.local.json` — 서브에이전트용 Write/Bash 권한 포함

#### 백엔드
- Fastify REST API 서버 (포트 3001)
- Prisma ORM + PostgreSQL 스키마 (`Indicator`, `IndicatorValue`, `CollectorLog`)
- **데이터 수집기 5종** (모두 서킷브레이커 + 재시도 내장)
  - `WorldBankCollector` — 5개국 GDP
  - `FredCollector` — 미국 금리·CPI·GDP·실업률·10년 국채
  - `EcosCollector` — 한국 기준금리·원달러 환율·CPI
  - `BlsCollector` — 미국 실업률·비농업고용·평균시간당임금
  - `KosisCollector` — 한국 실업률·경제활동인구·CPI
- node-cron 스케줄러 (WorldBank 02:00 / FRED 03:00 / ECOS 04:00 / KOSIS 05:00 / BLS 05:30)
- Redis 캐시 (API 응답 1시간 TTL)
- API 엔드포인트
  - `GET /health`
  - `GET /api/indicators` (country/category/source 필터)
  - `GET /api/indicators/:code` (startDate/endDate 필터)
  - `GET /api/indicators/:code/compare` (국가 비교)
  - `GET /api/indicators/:code/download?format=csv`

#### 프론트엔드
- Next.js 14 App Router (포트 3000)
- 대시보드 (`/`) — 한국/미국/글로벌 지표 카드 그리드 (즐겨찾기 버튼, 전월비 ▲▼ 표시)
- 지표 탐색 (`/indicators`) — 검색창 + 카테고리/국가 필터 + 결과 그리드
- 지표 상세 (`/indicators/:code`) — 시계열 차트 + 기간 선택(1Y/5Y/10Y/전체) + 데이터 테이블 + 국가 비교 차트
- 즐겨찾기 (`/favorites`) — localStorage 기반
- 지표 비교 (`/compare`) — 2개 지표 dual Y-axis 오버레이 차트
- 경제 캘린더 (`/calendar`) — FOMC·CPI·고용보고서·한국은행 금통위 일정 (2025~2026)
- AI 경제 브리핑 (`/briefing`) — Groq API(llama-3.3-70b-versatile)로 한국어 브리핑 생성 (6시간 캐시)
- CSV 다운로드 버튼 (`DownloadButton` 컴포넌트)
- Y축 단위 포매터 (`formatters.ts`) — GDP($T), 금리(%), 환율(₩), 고용(천명) 자동 포맷
- 모바일 반응형 최적화
- TanStack Query 서버 상태 캐싱

#### 지표 설명
- 19개 지표 전체 description 필드 한국어 설명 보강

#### 시드 데이터 (19개 지표)
| 코드 | 지표명 | 소스 |
|------|--------|------|
| WB_USA_GDP | 미국 GDP | World Bank |
| WB_KOR_GDP | 한국 GDP | World Bank |
| WB_CHN_GDP | 중국 GDP | World Bank |
| WB_JPN_GDP | 일본 GDP | World Bank |
| WB_DEU_GDP | 독일 GDP | World Bank |
| FRED_FEDFUNDS | 미국 기준금리 | FRED |
| FRED_CPIAUCSL | 미국 CPI | FRED |
| FRED_GDP | 미국 GDP (분기) | FRED |
| FRED_UNRATE | 미국 실업률 | FRED |
| FRED_DGS10 | 미국 10년 국채금리 | FRED |
| ECOS_BASE_RATE | 한국 기준금리 | ECOS |
| ECOS_USD_KRW | 원달러 환율 | ECOS |
| ECOS_CPI | 한국 CPI | ECOS |
| BLS_UNRATE | 미국 실업률 (BLS) | BLS |
| BLS_NONFARM_PAYROLL | 미국 비농업 고용자수 | BLS |
| BLS_AVG_HOURLY_EARNINGS | 미국 평균 시간당 임금 | BLS |
| KOSIS_UNEMPLOYMENT | 한국 실업률 | KOSIS |
| KOSIS_ECONOMICALLY_ACTIVE | 한국 경제활동인구 | KOSIS |
| KOSIS_CPI | 한국 소비자물가지수 | KOSIS |

---

### P1 — 회원 시스템 & 커뮤니티 (완료)

#### 인증 시스템
- `@fastify/jwt@8` 기반 JWT 인증 (`JWT_SECRET` env var)
- 회원가입 (`POST /api/auth/register`) — 이메일 + 비밀번호 + 닉네임
  - 강력한 비밀번호 정책: 8자 이상, 대/소문자 + 특수문자 필수
- 로그인 (`POST /api/auth/login`) — JWT 토큰 발급, 탈퇴 계정 차단
- JWT preHandler 글로벌 훅 — `/api/auth/*`·`/health` 제외 모든 라우트 인증 필수
- 토큰: localStorage + cookie 이중 저장 (cookie = Next.js 미들웨어용, localStorage = 클라이언트용)

#### 마스터 계정 & 관리자
- 서버 시작 시 마스터 계정 자동 생성 (`MASTER_EMAIL` / `MASTER_PASSWORD` env var)
- 관리자 페이지 (`/admin`) — 마스터 계정 전용, 미들웨어 + 클라이언트 이중 보호
- 관리자 기능:
  - AI 브리핑 호출 통계 (총 호출 / AI 실제 호출 — Redis 카운터)
  - 데이터 수집기 상태 (소스별 최근 로그) + 개별/전체 수동 수집 트리거
  - 신고된 채팅방 목록 (신고 횟수 태그, 메시지 펼치기, 삭제)
  - 전체 채팅방 목록 (삭제)
  - 사용자 목록 (이메일, 닉네임, 가입일, 정상/탈퇴 태그)

#### 마이페이지
- `GET /api/user/me` — 내 정보 조회
- `PUT /api/user/nickname` — 닉네임 수정
- `DELETE /api/user` — 회원탈퇴 (소프트 삭제, `deletedAt` 필드)
- 마이페이지 UI (`/mypage`) — 닉네임 편집, 탈퇴 확인 2단계

#### 토론방 (채팅)
- 채팅방 CRUD (`/api/chat/rooms`)
  - 목록 조회 (생성자 닉네임, 메시지 수, 신고 수)
  - 생성 (이름 2~30자)
  - 삭제 (방 생성자 또는 마스터만 가능)
- 채팅 메시지 (`/api/chat/rooms/:id/messages`)
  - 조회 (`?after=` 파라미터로 새 메시지만 폴링)
  - 전송 (신고 10회 이상 잠금 시 차단)
- 신고 (`POST /api/chat/rooms/:id/report`) — 사용자당 방 1회 제한
- 프론트엔드
  - 토론방 목록 (`/discussion`) — 방 만들기, 신고 횟수 태그(⚠️/🔒), 내 방 삭제
  - 채팅방 (`/discussion/:id`) — 말풍선 UI, 3초 폴링, 신고 폼, 잠금 상태 표시
- DB: `ChatRoom`, `ChatMessage`, `ChatReport` 모델 (ChatReport: `[roomId, userId]` unique 제약)

#### 헤더 & 라우팅
- Next.js 미들웨어 — 모든 페이지 로그인 필수, `/login`·`/register`는 공개
- 헤더: 로그인 시 닉네임 표시 마이페이지 탭, 마스터 전용 관리자 배지
- 토론방 탭 헤더에 추가 (md 이상 화면에서만 표시)

#### AI 브리핑 — Groq 전환
- GLM / Gemini 사용 불가로 Groq API로 전환
- 모델: `llama-3.3-70b-versatile`
- Redis 카운터: `briefing:total_calls`, `briefing:ai_calls`

#### API Key 현황
| API | 상태 |
|-----|------|
| FRED | ✅ .env에 저장됨 |
| BLS | ✅ .env에 저장됨 |
| BEA | ✅ .env에 저장됨 |
| ECOS (한국은행) | ✅ .env에 저장됨 |
| KOSIS (통계청) | ✅ .env에 저장됨 |
| Groq | ✅ .env에 저장됨 |
| SEC EDGAR | ✅ Key 불필요, User-Agent 설정 완료 |
| World Bank / IMF / OECD | ✅ Key 불필요 |
| 공공데이터포털 | ⏸ 미신청 (P2 이후) |

---

## 현재 진행 중

없음 — 다음 작업은 `docs/planning.md` 참조
