# Deployment-Dokumentation

> **Hinweis:** Diese Dokumentation ist Teil der [Projektdokumentation](./README.md).
> Siehe auch: [07-Configuration.md](./07-Configuration.md) für Konfigurationsdetails.

---

## Inhaltsverzeichnis

1. [Lokale Entwicklung](#1-lokale-entwicklung)
2. [PWA-Installation](#2-pwa-installation)
3. [Service Worker Update-Mechanismus](#3-service-worker-update-mechanismus)
4. [Offline-Fähigkeiten](#4-offline-fähigkeiten)
5. [Browser-Kompatibilität](#5-browser-kompatibilität)
6. [Performance-Überlegungen](#6-performance-überlegungen)
7. [Produktions-Deployment](#7-produktions-deployment)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Lokale Entwicklung

### Entwicklungsserver starten

```bash
npx serve -p 8080
```

Der Entwicklungsserver wird auf `http://localhost:8080` gestartet.

### Lokale Entwicklung mit HTTPS

```bash
npx serve -p 8080 --ssl-cert cert.pem --ssl-key key.pem
```

> **Hinweis:** Nach dem Öffnen der HTTPS-URL zeigt der Browser eine Sicherheitswarnung an. Diese kann für lokale Tests ignoriert werden.

---

## 2. PWA-Installation

### Installationsanforderungen

Die App erfüllt die Mindestanforderungen für PWA-Installation:

- `manifest.json` mit App-Metadaten
- Service Worker registriert und aktiv
- HTTPS-Verbindung (oder `localhost`)
- Icons in zwei Größen (192×192 px und 512×512 px)

### Browser-spezifische Hinweise

| Browser | Installationsmethode |
|---------|----------------------|
| Chrome / Edge | Automatisches Banner oder Menü → "App installieren" |
| Safari (iOS) | Teilen-Menü → "Zum Home-Bildschirm" |
| Firefox | Menü → "Seite installieren" |

> **iOS-Besonderheit:** Safari auf iOS unterstützt nicht alle PWA-Features (z.B. Background Sync). Die App bleibt jedoch vollständig funktional.

---

## 3. Service Worker Update-Mechanismus

### Aktualisierungsverhalten

1. Bei Seitenaufruf prüft der Browser auf neue Service-Worker-Version
2. Neue Version wird im Hintergrund heruntergeladen
3. Neue Version wartet, bis alle Tabs geschlossen sind
4. Bei nächster Navigation übernimmt die neue Version

### Manuelle Aktualisierung erzwingen

```javascript
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) reg.update();
    });
}
```

### Versionierung

Die Service-Worker-Version wird in `sw.js` verwaltet:

```javascript
const CACHE_VERSION = 'v2.0.0';
```

> **Tipp:** Bei Problemen nach einem Update: Browser-Cache leeren und Service Worker in DevTools deregistrieren.

Siehe auch: [07-Configuration.md](./07-Configuration.md#4-swjs-service-worker).

---

## 4. Offline-Fähigkeiten

### Caching-Strategie

Die App implementiert einen **Cache-First-Ansatz**:

- Statische Ressourcen werden beim ersten Besuch gecacht
- Seitenanfragen bedienen sich aus dem Cache
- Bei Netzwerkfehler wird gecachter Inhalt angezeigt

### Verfügbare Offline-Funktionen

| Funktion | Status |
|----------|--------|
| Timer-Funktionalität | Verfügbar (via localStorage) |
| Dashboard-Ansicht | Verfügbar |
| Core-UI-Komponenten | Vollständig verfügbar |

### Cache manuell leeren

```javascript
navigator.serviceWorker.getRegistration().then(reg => {
    if (reg) {
        reg.unregister().then(() => {
            caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
            });
        });
    }
});
```

---

## 5. Browser-Kompatibilität

### Unterstützte Desktop-Browser

| Browser | Version | PWA-Support |
|---------|---------|-------------|
| Chrome | 90+ | Vollständig |
| Firefox | 88+ | Vollständig |
| Safari | 14.1+ | Eingeschränkt* |
| Edge | 90+ | Vollständig |
| Samsung Internet | 14+ | Vollständig |

*iOS Safari: Installation und Offline-Nutzung unterstützt. **Nicht:** Background Sync, Push-Benachrichtigungen.

### Mobile Browser

| Browser | Plattform | PWA-Support |
|---------|----------|-------------|
| Safari | iOS | Eingeschränkt |
| Chrome | Android | Vollständig |
| Samsung Internet | Android | Vollständig |
| Firefox | Android | Vollständig |

---

## 6. Performance-Überlegungen

### First Contentful Paint (FCP)

Durch Service-Worker-Caching wird der FCP nach dem ersten Besuch deutlich verbessert.

### Bundle-Größe

Die App ist als Single-Page-Application konzipiert mit minimaler Abhängigkeit. Keine externen Frameworks erforderlich.

### Lighthouse-Empfehlungen

| Kategorie | Ziel-Score |
|-----------|------------|
| PWA-Validierung | Bestanden |
| Performance | ≥ 90 |
| Accessibility | ≥ 95 |
| Best Practices | Bestanden |

---

## 7. Produktions-Deployment

### Empfohlene Hosting-Optionen

| Anbieter | Typ | Besonderheit |
|----------|-----|--------------|
| GitHub Pages | Statisch | Kostenlos, einfach |
| Netlify | Statisch | CI/CD-Integration |
| Vercel | Statisch | Schnelles CDN |
| Cloudflare Pages | Statisch | Globales CDN |
| Apache/Nginx | Statisch | Volle Kontrolle |

### Hosting-Anforderungen

- **HTTPS obligatorisch** – PWA-Installation erfordert sichere Verbindung
- Korrekte MIME-Types:

| Datei | MIME-Type |
|-------|-----------|
| `manifest.json` | `application/manifest+json` |
| `sw.js` | `application/javascript` |

### Verzeichnisstruktur

Die App benötigt keinen Build-Prozess. Alle Dateien sind produktionsfertig:

```
/
├── index.html
├── manifest.json
├── sw.js
├── js/
│   ├── app.js
│   └── store.js
├── css/
│   └── styles.css
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

### GitHub Pages Deployment

1. Repository auf GitHub erstellen/hochladen
2. **Settings** → **Pages** → **Source:** `main` / `root`
3. Verfügbar unter:
   ```
   https://username.github.io/repository-name
   ```

---

## 8. Troubleshooting

### App wird nicht installiert

| Prüfpunkt | Lösung |
|-----------|--------|
| HTTPS | Seite muss über HTTPS erreichbar sein |
| manifest.json | Vollständige Felder prüfen |
| Service Worker | In DevTools → Application → Service Workers prüfen |
| Console | Fehlermeldungen untersuchen |

### Offline funktioniert nicht

1. DevTools öffnen (F12) → Application → Service Workers
2. Status prüfen: "Activated and is running"
3. Application → Cache Storage: Dateien vorhanden?

### Service Worker aktualisiert nicht

| Schritt | Aktion |
|---------|--------|
| 1 | Browser-Cache leeren (STRG+SHIFT+R) |
| 2 | In DevTools "Update on reload" aktivieren |
| 3 | `update()` manuell aufrufen |
| 4 | Service Worker deregistrieren und neu laden |

---

*Siehe auch: [01-Architecture.md](./01-Architecture.md) | [07-Configuration.md](./07-Configuration.md) | [08-Testing.md](./08-Testing.md)*
