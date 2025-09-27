FROM node:20-slim AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-slim AS runner

ENV NODE_ENV production

WORKDIR /app

COPY --from=builder /app/package*.json ./
RUN npm install --only=production
COPY --from=builder /app/build ./build

CMD ["node", "build/index.js"]
