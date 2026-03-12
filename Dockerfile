# ============================================
# Stage 1: Dependencies (캐시: package.json, yarn.lock 변경 시에만 재실행)
# ============================================
FROM node:22-alpine AS deps
WORKDIR /app

# 패키지 매니페스트만 먼저 복사 → 의존성 레이어 캐시
COPY package.json yarn.lock .yarnrc* ./

# devDependencies 포함 설치 (빌드에 필요). lockfile 기준으로 설치해 재현성 확보
RUN yarn install --frozen-lockfile

# ============================================
# Stage 2: Build (캐시: 소스 변경 시에만 재실행)
# ============================================
FROM deps AS builder
WORKDIR /app

# 의존성은 이미 위 레이어에 있으므로, 소스만 복사
COPY . .

RUN yarn build

# ============================================
# Stage 3: Production (경량 런타임 이미지)
# ============================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# 프로덕션 의존성만 설치 (package.json, lock 복사 → 캐시 활용)
COPY package.json yarn.lock .yarnrc* ./
RUN yarn install --frozen-lockfile --production && yarn cache clean

# 빌드 결과물만 복사
COPY --from=builder /app/dist ./dist

USER node
EXPOSE 3000

CMD ["node", "dist/main.js"]
