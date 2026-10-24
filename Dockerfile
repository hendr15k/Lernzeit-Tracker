# Build the locally generated utility CSS, then serve the PWA as static files.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY index.html manifest.json sw.js style.css tailwind.config.cjs ./
COPY css ./css
COPY js ./js
COPY vendor ./vendor
COPY icon-192.png icon-512.png ./
RUN npm run build:css

FROM nginx:1.29-alpine
LABEL org.opencontainers.image.title="Lernzeit Tracker" \
      org.opencontainers.image.description="Lokale Lernzeit-PWA" \
      org.opencontainers.image.source="https://github.com/hendr15k/Lernzeit-Tracker"
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/index.html /app/manifest.json /app/sw.js /app/style.css /usr/share/nginx/html/
COPY --from=build /app/css /usr/share/nginx/html/css
COPY --from=build /app/js /usr/share/nginx/html/js
COPY --from=build /app/vendor /usr/share/nginx/html/vendor
COPY --from=build /app/icon-192.png /app/icon-512.png /usr/share/nginx/html/
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1
