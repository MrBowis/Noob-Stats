# ---------- Etapa de compilación ----------
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json .npmrc ./
RUN npm ci

COPY . .

# Las EXPO_PUBLIC_* se incrustan en el bundle en tiempo de compilación, así que
# tienen que estar presentes aquí y no en el arranque del contenedor.
#
# Por defecto son rutas relativas: el propio nginx de esta imagen hace de
# pasarela hacia los microservicios, de modo que el bundle funciona en
# cualquier host sin recompilar.
ARG EXPO_PUBLIC_AUTH_API_URL=/api/auth
ARG EXPO_PUBLIC_EQUIPOS_API_URL=/api/equipos
ARG EXPO_PUBLIC_ADMIN_API_URL=/api/admin
ARG EXPO_PUBLIC_JUGADORES_API_URL=/api/jugadores
ARG EXPO_PUBLIC_AUTH_REDIRECT_SCHEME=noobstats

ENV EXPO_PUBLIC_AUTH_API_URL=$EXPO_PUBLIC_AUTH_API_URL \
    EXPO_PUBLIC_EQUIPOS_API_URL=$EXPO_PUBLIC_EQUIPOS_API_URL \
    EXPO_PUBLIC_ADMIN_API_URL=$EXPO_PUBLIC_ADMIN_API_URL \
    EXPO_PUBLIC_JUGADORES_API_URL=$EXPO_PUBLIC_JUGADORES_API_URL \
    EXPO_PUBLIC_AUTH_REDIRECT_SCHEME=$EXPO_PUBLIC_AUTH_REDIRECT_SCHEME

RUN npx expo export --platform web --output-dir dist

# ---------- Imagen final ----------
FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf         /etc/nginx/conf.d/default.conf
COPY proxy-headers.inc  /etc/nginx/conf.d/proxy-headers.inc

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
