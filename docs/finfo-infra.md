# finfo 인프라 문서

> 최종 업데이트: 2026-03-22

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | Next.js 14 (App Router) + TypeScript + Tailwind CSS + Recharts + TanStack Query |
| 백엔드 | Node.js + Fastify 4.x + TypeScript |
| 인증 | @fastify/jwt@8 (JWT Bearer Token) |
| 스케줄러 | node-cron |
| DB | PostgreSQL 16 (시계열 데이터 + 유저/채팅) |
| 캐시 | Redis 7 (API 응답 캐시 TTL 1시간, 브리핑 카운터) |
| ORM | Prisma |
| AI | Groq API (llama-3.3-70b-versatile) |
| 배포 (계획) | Vercel (프론트) + Railway 또는 Fly.io (백엔드) |

---

## 로컬 개발 환경

### 포트
| 서비스 | 포트 |
|--------|------|
| Next.js (프론트엔드) | 3000 |
| Fastify (백엔드) | 3001 |
| PostgreSQL | 5432 |
| Redis | 6379 |

### 로컬 실행 방법

```bash
# 1. DB 컨테이너 실행
docker compose up -d

# 2. 의존성 설치 (최초 1회)
npm install

# 3. DB 마이그레이션 + 시드 (최초 1회)
cd backend
npx prisma db push
npx prisma db seed
cd ..

# 4. 백엔드 실행 (포트 3001)
npm run dev:backend

# 5. 프론트엔드 실행 (포트 3000)
npm run dev:frontend

# 6. 수동 데이터 수집 (필요 시)
cd backend && npx tsx src/collect-now.ts

# 7. Redis 캐시 초기화 (필요 시)
docker exec finfo-redis redis-cli FLUSHALL
```

### 주의사항
- `.env`는 루트(`/finfo/.env`)에 위치하고 `backend/.env`로 심링크됨
- `prisma migrate dev` 대신 `prisma db push` 사용 (TTY 없는 환경에서 프롬프트 문제 방지)
- `frontend/.env.local`은 별도 파일로 관리 (Next.js `NEXT_PUBLIC_*` 변수)

---

## 환경변수

### 루트 `.env` (백엔드용)

```
DATABASE_URL=postgresql://finfo:finfo@localhost:5432/finfo
REDIS_URL=redis://localhost:6379
FRED_API_KEY=...
BLS_API_KEY=...
BEA_API_KEY=...
ECOS_API_KEY=...
KOSIS_API_KEY=...
SEC_EDGAR_USER_AGENT=finfo contact@example.com
JWT_SECRET=...
MASTER_EMAIL=master@finfo.com
MASTER_PASSWORD=...
GROQ_API_KEY=...
FRONTEND_URL=http://localhost:3000
PORT=3001
```

### `frontend/.env.local` (프론트엔드용)

```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_MASTER_EMAIL=master@finfo.com
```

---

## 디렉토리 구조

```
finfo/
├── frontend/               # Next.js 14 App Router
│   ├── .env.local          # NEXT_PUBLIC_* 환경변수 (gitignore)
│   └── src/
│       ├── app/            # 페이지 라우트
│       │   ├── page.tsx                      # 대시보드
│       │   ├── login/page.tsx                # 로그인
│       │   ├── register/page.tsx             # 회원가입
│       │   ├── mypage/page.tsx               # 마이페이지
│       │   ├── admin/page.tsx                # 관리자 (마스터 전용)
│       │   ├── indicators/page.tsx           # 지표 탐색
│       │   ├── indicators/[code]/page.tsx    # 지표 상세
│       │   ├── favorites/page.tsx            # 즐겨찾기
│       │   ├── compare/page.tsx              # 지표 비교
│       │   ├── calendar/page.tsx             # 경제 캘린더
│       │   ├── briefing/page.tsx             # AI 경제 브리핑
│       │   └── discussion/
│       │       ├── page.tsx                  # 토론방 목록
│       │       └── [id]/page.tsx             # 채팅방
│       ├── components/
│       │   ├── charts/
│       │   │   ├── TimeSeriesChart.tsx
│       │   │   └── CompareChart.tsx
│       │   ├── download/DownloadButton.tsx
│       │   └── layout/Header.tsx
│       ├── hooks/useIndicators.ts
│       ├── middleware.ts                     # 전체 라우트 인증 보호
│       └── lib/
│           ├── auth.ts                       # 토큰/이메일/닉네임 저장·조회·삭제
│           ├── api.ts                        # Axios 인터셉터 (401 → 로그아웃)
│           ├── types.ts
│           └── formatters.ts
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma   # DB 스키마
│   │   └── seed.ts         # 초기 지표 데이터 (19개)
│   └── src/
│       ├── collectors/
│       │   ├── base.ts
│       │   ├── worldbank.ts
│       │   ├── fred.ts
│       │   ├── ecos.ts
│       │   ├── bls.ts
│       │   └── kosis.ts
│       ├── plugins/
│       │   ├── prisma.ts
│       │   ├── redis.ts
│       │   └── jwt.ts
│       ├── routes/
│       │   ├── health.ts
│       │   ├── auth.ts         # 회원가입·로그인
│       │   ├── user.ts         # 내 정보·닉네임·탈퇴
│       │   ├── admin.ts        # 관리자 전용 API
│       │   ├── chat.ts         # 채팅방·메시지·신고
│       │   ├── indicators.ts
│       │   └── briefing.ts     # AI 브리핑 (Groq)
│       ├── scheduler/
│       │   └── index.ts        # node-cron + collectSource/collectAll export
│       └── index.ts            # Fastify 서버 진입점 + 마스터 계정 시드
│
├── docker-compose.yml
├── .env                    # 루트 환경변수 (gitignore)
└── .claude/
    └── settings.local.json # 서브에이전트 권한 설정
```

---

## DB 스키마

### User
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | String (CUID) | PK |
| email | String (unique) | 이메일 |
| password | String | bcrypt 해시 |
| nickname | String? | 닉네임 |
| deletedAt | DateTime? | 소프트 삭제 시각 |
| createdAt | DateTime | 가입 시각 |
| updatedAt | DateTime | 수정 시각 |

### Indicator
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | String (CUID) | PK |
| code | String (unique) | 지표 코드 (예: `WB_USA_GDP`) |
| name | String | 영문 지표명 |
| nameKo | String? | 한국어 지표명 |
| category | Enum | gdp / interest_rate / cpi / exchange_rate / employment / trade / other |
| unit | String | 단위 (예: `US$`, `%`, `KRW`, `천명`) |
| source | String | 데이터 소스 |
| country | String | 국가 코드 |
| description | String? | 지표 설명 |

### IndicatorValue
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | String (CUID) | PK |
| indicatorId | String | FK → Indicator.id |
| date | DateTime | 기준 날짜 |
| value | Float | 지표 값 |
| unique | (indicatorId, date) | 중복 방지 |

### CollectorLog
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | String (CUID) | PK |
| source | String | 수집기 이름 |
| status | String | success / failure |
| recordsCount | Int? | 수집된 레코드 수 |
| message | String? | 실패 시 에러 메시지 |
| createdAt | DateTime | 실행 시각 |

### ChatRoom
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | String (CUID) | PK |
| name | String | 채팅방 이름 (2~30자) |
| createdBy | String | FK → User.id |
| deletedAt | DateTime? | 소프트 삭제 시각 |
| createdAt | DateTime | 생성 시각 |

### ChatMessage
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | String (CUID) | PK |
| roomId | String | FK → ChatRoom.id |
| userId | String | FK → User.id |
| content | String | 메시지 내용 (최대 500자) |
| createdAt | DateTime | 전송 시각 |
| index | (roomId, createdAt) | 조회 최적화 |

### ChatReport
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | String (CUID) | PK |
| roomId | String | FK → ChatRoom.id |
| userId | String | FK → User.id |
| reason | String | 신고 사유 |
| createdAt | DateTime | 신고 시각 |
| unique | (roomId, userId) | 사용자당 방 1회 신고 |

---

## API 엔드포인트

### 인증 불필요
| Method | Path | 설명 |
|--------|------|------|
| GET | `/health` | 서버 상태 확인 |
| POST | `/api/auth/register` | 회원가입 (email, password, nickname) |
| POST | `/api/auth/login` | 로그인 → JWT 발급 |

### 인증 필요 (Authorization: Bearer <token>)

#### 사용자
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/user/me` | 내 정보 조회 |
| PUT | `/api/user/nickname` | 닉네임 수정 |
| DELETE | `/api/user` | 회원탈퇴 (소프트 삭제) |

#### 지표
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/indicators` | 지표 목록 (country/category/source 필터) |
| GET | `/api/indicators/:code` | 지표 상세 + 시계열 |
| GET | `/api/indicators/:code/compare` | 국가 비교 |
| GET | `/api/indicators/:code/download` | CSV 다운로드 |

#### AI 브리핑
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/briefing` | AI 브리핑 생성 (6시간 Redis 캐시) |

#### 채팅
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/chat/rooms` | 채팅방 목록 |
| POST | `/api/chat/rooms` | 채팅방 생성 |
| DELETE | `/api/chat/rooms/:id` | 채팅방 삭제 (방장 또는 마스터) |
| GET | `/api/chat/rooms/:id/messages` | 메시지 조회 (?after= 폴링) |
| POST | `/api/chat/rooms/:id/messages` | 메시지 전송 |
| POST | `/api/chat/rooms/:id/report` | 채팅방 신고 |

#### 관리자 (마스터 계정 전용)
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/admin/users` | 사용자 목록 |
| GET | `/api/admin/stats` | 브리핑 통계 + 수집기 상태 |
| GET | `/api/admin/chat-reports` | 신고된 채팅방 목록 |
| GET | `/api/admin/chat-rooms` | 전체 채팅방 목록 |
| DELETE | `/api/admin/chat-rooms/:id` | 채팅방 강제 삭제 |
| POST | `/api/admin/collect/:source` | 특정 수집기 수동 실행 |
| POST | `/api/admin/collect-all` | 전체 수집기 수동 실행 |

---

## 데이터 수집 스케줄

| 수집기 | 실행 시각 | 지표 수 | API 제한 |
|--------|----------|--------|---------|
| WorldBankCollector | 매일 02:00 | 5개 (5개국 GDP) | 제한 없음 |
| FredCollector | 매일 03:00 | 5개 (금리/CPI/GDP/실업률/국채) | 사실상 무제한 |
| EcosCollector | 매일 04:00 | 3개 (기준금리/환율/CPI) | 10,000건/일 |
| KosisCollector | 매일 05:00 | 3개 (실업률/경활인구/CPI) | 10,000건/일 |
| BlsCollector | 매일 05:30 | 3개 (실업률/비농업고용/임금) | 500회/일 |

---

## Redis 키 목록

| 키 | 용도 | TTL |
|----|------|-----|
| `briefing:cache` | AI 브리핑 응답 캐시 | 6시간 |
| `briefing:total_calls` | 브리핑 총 호출 횟수 카운터 | 영구 |
| `briefing:ai_calls` | 실제 AI 호출 횟수 카운터 | 영구 |
| `indicators:*` | 지표 API 응답 캐시 | 1시간 |

---

## 배포 계획 (미완료)

### 프론트엔드 — Vercel
- `frontend/` 디렉토리를 Vercel 프로젝트로 연결
- 환경변수: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_MASTER_EMAIL`

### 백엔드 — Railway 또는 Fly.io
- `backend/` 디렉토리를 Railway 서비스로 배포
- 환경변수: `.env` 전체 항목 설정
- PostgreSQL: Railway managed DB 또는 Supabase
- Redis: Railway Redis 또는 Upstash

### CI/CD
- GitHub Actions — main 브랜치 push 시 자동 배포 (미구성)
