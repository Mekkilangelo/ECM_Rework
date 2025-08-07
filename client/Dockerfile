FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

FROM caddy:2-alpine
COPY --from=builder /app/build /usr/share/caddy
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 80
