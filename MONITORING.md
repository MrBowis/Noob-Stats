# Monitoreo y observabilidad — Noob Stats

Observabilidad completa dentro de Docker, desplegada junto con la app. No
requiere tocar la instancia EC2, los Security Groups ni instalar agentes: todo
son contenedores gestionados por `docker-compose.yml`.

## 1. Arquitectura

```
                         EC2
                          │
                       Docker
        ┌─────────────────┼─────────────────────────┐
        ▼                 ▼                          ▼
   Aplicación         Métricas                     Logs
   auth-ms            ├── cAdvisor (contenedores)  Alloy ──► Loki
   equipos-ms         ├── Node Exporter (host)       (lee el socket
   admin-ms           └── /metrics de cada MS         de Docker)
   jugadores-ms              │                          │
   frontend                  ▼                          │
                        Prometheus ◄────────────────────┘
                             │        (Grafana consulta ambos)
                             └──────────► Grafana ◄──── Loki
```

| Servicio        | Imagen                        | Puerto | Público |
| --------------- | ----------------------------- | ------ | ------- |
| prometheus      | prom/prometheus:v2.55.1       | 9090   | No      |
| grafana         | grafana/grafana:11.3.0        | 3000   | **Sí**  |
| loki            | grafana/loki:3.2.1            | 3100   | No      |
| alloy           | grafana/alloy:v1.5.1          | 12345  | No      |
| cadvisor        | gcr.io/cadvisor/cadvisor:0.49 | 8080   | No      |
| node-exporter   | prom/node-exporter:v1.8.2     | 9100   | No      |

Sólo Grafana publica puerto. El resto son accesibles únicamente por la red
interna de Docker (`noobstats`), por nombre de servicio.

## 2. Componentes

- **Prometheus** — recolecta (scrape cada 15 s) las métricas de los cuatro
  microservicios (`/metrics`), de cAdvisor y de Node Exporter. Retención 15 días.
- **Grafana** — visualiza. Prometheus y Loki quedan provisionados como
  datasources automáticamente; los cuatro dashboards se cargan solos.
- **Loki** — almacena logs. Retención 7 días.
- **Alloy** — descubre los contenedores por el socket de Docker, sigue sus
  logs y los envía a Loki. Extrae `level` del JSON como etiqueta.
- **cAdvisor** — métricas por contenedor (CPU, RAM, red, disco, reinicios).
- **Node Exporter** — métricas del host EC2 (CPU, RAM, disco, red, load).

## 3. Instrumentación de los microservicios NestJS

Cada microservicio (`auth-ms`, `equipos-ms`, `admin-ms`, `futbolista-ms`)
incorpora un módulo `src/observability/` idéntico, registrado en `app.module.ts`
con `ObservabilityModule.forRoot('<nombre-servicio>')`. Añade:

- **`GET /health`** → `{ "status": "ok", "service": "auth-ms" }`. Sin datos
  sensibles. Lo usa el healthcheck de Docker.
- **`GET /metrics`** → formato Prometheus. Métricas de proceso
  (`process_*`, `nodejs_*`) más las de HTTP:
  - `http_requests_total{service,method,route,status}`
  - `http_request_duration_seconds{service,method,route,status}` (histograma)
- **Middleware de observabilidad** (Express, antes de guards y enrutado):
  propaga/genera `X-Request-ID`, ejecuta la petición dentro de un contexto
  (`AsyncLocalStorage`) y registra las métricas al terminar la respuesta.
- **Logger estructurado JSON** — una línea por evento con `timestamp`, `level`,
  `service`, `message`, y `requestId`/`context` cuando aplican.

Las rutas se normalizan al patrón de Express (`/jugadores/:id`), nunca al valor
concreto: se evita alta cardinalidad y no se registran IDs, emails ni tokens.

## 4. Métricas

Prometheus distingue cada microservicio por la etiqueta `service` (la emite la
propia app). Ejemplos de consulta:

```promql
sum(rate(http_requests_total[5m])) by (service)                       # req/s
sum(rate(http_requests_total{status=~"5.."}[5m])) by (service)        # errores 5xx
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service))
```

## 5. Logs

Alloy etiqueta cada flujo con `service`, `container` y `level`. El `requestId`
va dentro de la línea JSON; se filtra sin convertirlo en etiqueta:

```logql
{service="futbolista-ms"}                       # todo un servicio
{service="auth-ms", level="error"}              # sólo errores
{service=~".+"} | json | requestId="abc-123"    # seguir una petición
```

## 6. Dashboards de Grafana

Carpeta **Noob Stats**, provisionados desde `monitoring/grafana/dashboards/`:

1. **Host / EC2** — CPU, RAM, disco, disk I/O, red RX/TX, load average.
2. **Microservicios Docker** — CPU, RAM, límite de memoria, red, reinicios y
   disponibilidad (`up`) por contenedor.
3. **API NestJS** — req/s, totales, 2xx/4xx/5xx, latencia media, p95 y p99, top
   rutas. Filtrable por `service`.
4. **Logs** — buscador con filtros `service` y `level`, volumen y visor de logs.

## 7. Acceso a Grafana

Grafana escucha en el puerto `GRAFANA_PORT` (por defecto 3000). Como no se
tocan los Security Groups, la forma recomendada de entrar sin exponerlo es un
túnel SSH desde tu máquina:

```bash
ssh -L 3000:localhost:3000 <EC2_USER>@<EC2_HOST>
# luego abre http://localhost:3000
```

Usuario/clave: `GRAFANA_ADMIN_USER` / `GRAFANA_ADMIN_PASSWORD` (ver §9).

## 8. Despliegue

Sin pasos manuales nuevos. El mismo comando levanta app + monitoreo:

```bash
docker compose up -d --build
```

El pipeline de CI/CD (`fase-3.yml`) ya usa `docker compose up -d --build
--remove-orphans`, así que despliega los servicios de monitoreo sin cambios.

## 9. Variables de entorno

En el `.env` de la raíz (documentadas en `.env.example`, no versionado):

```env
LOG_LEVEL=info               # error|warn|info|debug|verbose (microservicios)
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=...    # OBLIGATORIA, sin valor por defecto
GRAFANA_PORT=3000
```

Los secretos de Supabase siguen sólo en el `.env`; no se pasan a Prometheus,
Loki ni Grafana.

## 10. Añadir un microservicio nuevo a Prometheus

1. Instrumenta el servicio (§11).
2. Añade el target en `monitoring/prometheus/prometheus.yml`, job `nestjs`:
   ```yaml
   - targets: ['nuevo-ms:PUERTO']
     labels: { service: nuevo-ms }
   ```
3. `docker compose restart prometheus`. Los logs los recoge Alloy solo.

## 11. Añadir métricas/observabilidad a un NestJS nuevo

1. Copia `src/observability/` de cualquier microservicio.
2. Añade `prom-client` a `package.json` y `npm install`.
3. En `app.module.ts`: `ObservabilityModule.forRoot('nuevo-ms')`.
4. En `main.ts` (patrón ya aplicado en los cuatro):
   ```ts
   const app = await NestFactory.create(AppModule, { bufferLogs: true });
   app.useLogger(app.get(AppLogger));
   app.use(createObservabilityMiddleware(app.get(MetricsService)));
   ```
5. Para una métrica propia, inyecta `MetricsService` y usa su `registry`.

## 12. Consultar logs

En Grafana → dashboard **4 · Logs**, o en **Explore** con la fuente Loki y las
consultas LogQL de §5.

## 13. Verificar que todo funciona

```bash
# Contenedores y salud
docker compose ps

# Targets de Prometheus (todos "up")
docker compose exec prometheus wget -qO- 'http://localhost:9090/api/v1/targets?state=active'

# /health y /metrics de un microservicio
docker compose exec auth-ms node -e "fetch('http://127.0.0.1:3001/health').then(r=>r.text()).then(console.log)"

# Servicios con logs en Loki
docker compose exec loki wget -qO- 'http://localhost:3100/loki/api/v1/label/service/values'
```

## 14. Health checks

Cada microservicio tiene healthcheck en `docker-compose.yml` (y en su
Dockerfile) contra `/health`: `interval 30s`, `timeout 5s`, `retries 3`,
`start_period 20s`. Docker marca cada contenedor `healthy` / `unhealthy` /
`starting`, visible en `docker compose ps` y en el dashboard 2.

## 15. Problemas comunes

- **Grafana no arranca** — falta `GRAFANA_ADMIN_PASSWORD` en el `.env`
  (obligatoria).
- **Un target sale `down`** — el microservicio no arrancó; revisa
  `docker compose logs <servicio>`.
- **No hay logs de un servicio en Loki** — Alloy necesita el socket de Docker;
  confirma que `/var/run/docker.sock` está montado y que Alloy está `Up`.
- **Sin métricas de contenedor** — cAdvisor requiere `privileged: true` y los
  montajes de `/sys`, `/var/lib/docker`; en algunas distros hace falta
  `/dev/kmsg` (ya declarado).
- **Grafana desde fuera** — usa el túnel SSH de §7; los puertos de AWS no se
  modifican.

## Limitación conocida

El `X-Request-ID` se genera y registra en cada microservicio, pero **no se
propaga entre servicios**: la llamada interna `jugadores-ms → equipos-ms` no
reenvía la cabecera. Correlacionar una petición end-to-end requeriría pasar el
header en esa llamada; se deja fuera para no ampliar el alcance.
