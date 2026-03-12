# NestJS TypeScript Boilerplate

## 스택

- **NestJS** — API 프레임워크
- **TypeORM** — MySQL ORM
- **Redis 어댑터** (`src/adapters/redis`) — 캐시 (ioredis)
- **Kafka 어댑터** (`src/adapters/kafka`) — 비동기 이벤트 발행
- **API Key Guard** — 헤더 기반 인증 (선택 적용)

## 요구 사항

- Node.js 18+
- MySQL, Redis (로컬 또는 원격)

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 모드 (파일 변경 시 자동 재시작)
npm run start:dev
```

실행 후:

- **http://localhost:3000** — 메인 메시지
- **http://localhost:3000/health** — 헬스 체크 (JSON)
- **http://localhost:3000/users** — 사용자 목록 (GET), 생성 (POST) — `api-key` 헤더 필요
- **http://localhost:3000/users/:id** — 사용자 단건 (GET), 수정 (PATCH) — `api-key` 헤더 필요

## 환경 변수 (.env)

프로젝트 루트에 `.env` 파일을 두고 아래 값을 설정합니다. `.env.example`을 참고하세요.

| 변수 | 설명 |
|------|------|
| `db_host`, `db_user`, `db_pass`, `db_name` | MySQL 접속 정보 (예: AWS RDS 엔드포인트) |
| `redis_host`, `redis_port` | Redis (미설정 시 127.0.0.1:6379) |
| `kafka_broker` | Kafka 브로커 주소 (미설정 시 `localhost:9092`) |
| `API_KEY` | API 키 검증용 (미설정 시 1234) |

`.env`는 Git에 포함되지 않습니다.

## 프로젝트 구조

```
src/
  main.ts
  app.module.ts
  app.controller.ts
  app.service.ts
  common/
    guards/
      api-key.guard.ts          # 헤더 api-key / x-api-key 검증
  adapters/                     # 인프라/어댑터 계층
    redis/
      redis.module.ts
      redis.service.ts          # get, set, del, TTL 지원
      redis.constants.ts
    kafka/
      kafka.service.ts          # Kafka 프로듀서 (user.created 이벤트)
  users/                        # 도메인 모듈
    users.module.ts
    users.controller.ts         # GET/POST /users, GET/PATCH /users/:id
    users.service.ts            # Redis 캐시, Kafka 이벤트 발행
    entities/
      user.entity.ts
      order.entity.ts
    dto/
```

## 주요 구성

- **Controller / Service / Module** — NestJS DI 구조
- **TypeORM** — MySQL 엔티티 및 Repository 주입
- **Redis 어댑터** — 유저 단건 조회 캐시 (TTL 60초), 수정 시 캐시 무효화
- **Kafka 어댑터** — 유저 생성 시 `user.created` 토픽으로 `{ userId, userName }` 이벤트 발행
- **ApiKeyGuard** — `@UseGuards(ApiKeyGuard)` 로 컨트롤러·라우트별 인증

## Docker / Docker Compose

- **프로덕션 이미지 빌드 및 실행**

```bash
docker compose up --build
```

- 앱 컨테이너는:
  - 호스트의 **Redis**에 `redis_host=host.docker.internal` 로 접속
  - **DB(hosted RDS 등)** 는 `.env` 의 `db_host` 값을 그대로 사용
  - **Kafka 브로커**는 `kafka_broker=host.docker.internal:9092` 로 접속

- **개발용 (로컬 코드 변경 반영)**

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

- `docker-compose.dev.yml`:
  - `.:/app` 볼륨으로 로컬 코드를 컨테이너에 마운트
  - `yarn start:dev` 로 Nest watch 모드 실행

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run start` | 한 번 실행 |
| `npm run start:dev` | 감시 모드 (개발용) |
| `npm run build` | `dist/` 빌드 |
| `npm run start:prod` | 빌드 결과로 실행 |

## 포트 변경

```bash
PORT=4000 npm run start:dev
```
