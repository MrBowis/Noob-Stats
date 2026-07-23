# ---------- Etapa de compilación ----------
FROM node:22-alpine AS builder
WORKDIR /app

# Se copian primero los manifiestos para aprovechar la caché de capas: las
# dependencias sólo se reinstalan si cambia package-lock.json.
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Descarta las devDependencies del árbol que se copiará a la imagen final.
RUN npm prune --omit=dev

# ---------- Imagen final ----------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3004

# Nest no necesita root en tiempo de ejecución.
USER node

COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/package.json ./package.json

EXPOSE 3004

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3004/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/main"]
