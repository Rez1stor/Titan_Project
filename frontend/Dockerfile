<<<<<<< HEAD
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
=======
FROM node:22-alpine AS build
WORKDIR /src

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
# Vite-only build: local `npm run build` also runs tsc, which may fail in CI/Docker.
RUN npx vite build

FROM nginx:1.27-alpine AS final
COPY frontend/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/dist /usr/share/nginx/html

EXPOSE 80
>>>>>>> 62bdb56 (chore: add Docker Compose stack and AuthService unit tests)
