# Konfigurationsdateien

Dieses Dokument beschreibt alle Konfigurationsdateien des Lernzeit-Tracker-Projekts.

---

## Inhaltsverzeichnis

1. [package.json](#1-packagejson)
2. [manifest.json](#2-manifestjson)
3. [playwright.config.js](#3-playwrightconfigjs)
4. [sw.js Service Worker](#4-swjs-service-worker)
5. [style.css](#5-stylecss)
6. [css/toast.css](#6-csstoastcss)
7. [GitHub Actions Workflow](#7-github-actions-workflow)

---

## 1. package.json

Die zentrale Konfigurationsdatei für Node.js-Projekte. Enthält Metadaten, Abhängigkeiten und Skripte.

```json
{
  "name": "lernzeit-tracker",
  "version": "1.0.0",
  "description": "Ein moderner Lernzeit-Tracker, der als Progressive Web App (PWA) konzipiert ist. Er ermöglicht es Studierenden und Lernenden, ihre Lernzeiten zu erfassen, zu visualisieren und zu analysieren.",
  "main": "sw.js",
  "devDependencies": {
    "@playwright/test": "^1.59.1",
    "serve": "^14.2.6"
  },
  "scripts": {
    "test": "playwright test",
    "test:mobile": "playwright test --project=iPhone",
    "test:android": "playwright test --project=Android",
    "test:viewport": "playwright test tests/mobile/00-viewports.spec.js",
    "test:dashboard": "playwright test tests/mobile/01-dashboard.spec.js",
    "test:timer": "playwright test tests/mobile/02-timer.spec.js",
    "test:nav": "playwright test tests/mobile/03-navigation.spec.js",
    "test:themes": "playwright test tests/mobile/04-themes.spec.js",
    "test:heatmap": "playwright test tests/mobile/05-heatmap.spec.js",
    "test:headed": "playwright test --headed",
    "test:ui": "playwright test --ui"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/hendr15k/Lernzeit-Tracker.git"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "bugs": {
    "url": "https://github.com/hendr15k/Lernzeit-Tracker/issues"
  },
  "homepage": "https://github.com/hendr15k/Lernzeit-Tracker#readme"
}
```

### Abschnitte

| Abschnitt | Beschreibung |
|-----------|--------------|
| `name` | Der Paketname |
| `version` | Aktuelle Versionsnummer (SemVer) |
| `description` | Beschreibung der Anwendung |
| `main` | Einstiegspunkt der Anwendung (`sw.js` als Service Worker) |
| `devDependencies` | Entwicklungsabhängigkeiten (`@playwright/test` für E2E-Tests, `serve` für lokale Server) |
| `scripts` | NPM-Skripte für verschiedene Test-Szenarien |
| `repository` | Git-Repository-Informationen |
| `license` | Lizenztyp (ISC) |

### Verfügbare NPM-Skripte

| Skript | Beschreibung |
|--------|--------------|
| `test` | Alle Playwright-Tests ausführen |
| `test:mobile` | Tests nur für iPhone-Emulation |
| `test:android` | Tests nur für Android-Emulation |
| `test:viewport` | Tests für verschiedene Viewport-Größen |
| `test:dashboard` | Tests für die Dashboard-Komponente |
| `test:timer` | Tests für die Timer-Funktionalität |
| `test:nav` | Tests für die Navigation |
| `test:themes` | Tests für Light/Dark-Mode |
| `test:heatmap` | Tests für die Heatmap-Komponente |
| `test:headed` | Tests mit sichtbarem Browser (Debugging) |
| `test:ui` | Playwright UI-Modus starten |

---

## 2. manifest.json

Die Manifest-Datei definiert die Progressive Web App (PWA). Ermöglicht die Installation der App auf dem Home-Bildschirm von Mobilgeräten.

```json
{
    "name": "Lernzeit Tracker",
    "short_name": "LernTracker",
    "version": "2.0.0",
    "start_url": "./index.html",
    "display": "standalone",
    "background_color": "#0f172a",
    "theme_color": "#3b82f6",
    "icons": [
        {
            "src": "icon-192.png",
            "sizes": "192x192",
            "type": "image/png"
        },
        {
            "src": "icon-512.png",
            "sizes": "512x512",
            "type": "image/png"
        }
    ]
}
```

### Eigenschaften

| Eigenschaft | Typ | Standardwert | Beschreibung |
|------------|-----|--------------|--------------|
| `name` | string | — | Vollständiger App-Name (wird im App-Info-Dialog angezeigt) |
| `short_name` | string | — | Kurzname (max. 12 Zeichen, für den Home-Bildschirm) |
| `version` | string | — | Manifest-Version für Update-Erkennung |
| `start_url` | string | — | URL, die beim Starten der installierten App geöffnet wird |
| `display` | string | `standalone` | Anzeigemodus (siehe unten) |
| `background_color` | string | `#0f172a` | Hintergrundfarbe während des Ladevorgangs |
| `theme_color` | string | `#3b82f6` | Farbe der Statusleiste und Adressleiste |
| `icons` | array | — | App-Symbole für verschiedene Auflösungen |

### Display-Modi

| Modus | Beschreibung |
|-------|--------------|
| `standalone` | App läuft in eigenem Fenster ohne Browser-UI |
| `fullscreen` | Vollbildmodus ohne jegliche Browser-Elemente |
| `minimal-ui` | Minimale Browser-UI (Adressleiste ausgeblendet) |
| `browser` | Normale Browser-Ansicht |

### Icons

Die beiden Icon-Größen werden für verschiedene Display-Dichten verwendet:

- **192×192**: Standard-Displays (mdpi)
- **512×512**: Hochauflösende Displays (xxhdpi/Retina)

---

## 3. playwright.config.js

Playwright-Testkonfiguration für End-to-End-Tests. Definiert mobile Testumgebungen mit verschiedenen Viewport-Größen.

```javascript
const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: `file://${path.resolve(__dirname)}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-mobile',
      use: {
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'chromium-mobile-small',
      use: {
        viewport: { width: 360, height: 640 },
        userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G960F) AppleWebKit/537.36',
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: 'chromium-mobile-large',
      use: {
        viewport: { width: 414, height: 896 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        hasTouch: true,
        isMobile: true,
      },
    },
  ],
});
```

### Globale Konfigurationsoptionen

| Option | Standardwert | Beschreibung |
|--------|--------------|--------------|
| `testDir` | `./tests` | Verzeichnis mit Testdateien |
| `fullyParallel` | `true` | Alle Tests parallel ausführen |
| `forbidOnly` | `false` (lokaler Modus) | Verhindert `test.only()` in CI-Umgebungen |
| `retries` | `0` (lokal) / `2` (CI) | Wiederholungen bei fehlgeschlagenen Tests |
| `workers` | `undefined` (alle) | Anzahl paralleler Worker |
| `reporter` | `list` | Ausgabeformat der Testergebnisse |
| `baseURL` | `file://...` | Basis-URL für alle Tests |
| `trace` | `on-first-retry` | Trace-Sammlung bei ersten Retry |
| `screenshot` | `only-on-failure` | Screenshots nur bei Testfehlern |

### Definierte Testprojekte

| Projekt | Viewport | Gerät | Beschreibung |
|---------|---------|-------|--------------|
| `chromium-mobile` | 393×851 | Pixel 5 | Standard Android-Smartphone |
| `chromium-mobile-small` | 360×640 | Galaxy S5/SM-G960F | Kleine Android-Geräte |
| `chromium-mobile-large` | 414×896 | iPhone 11/12 | iPhone (Large-Viewport) |

---

## 4. sw.js (Service Worker)

Der Service Worker ermöglicht Offline-Funktionalität und Caching-Strategien. Damit funktioniert die App auch ohne Internetverbindung.

```javascript
const CACHE_NAME = 'lernzeit-tracker-v6';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './css/toast.css',
    './js/app.js',
    './js/store.js',
    './sw.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/lucide@0.473.0'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME && key.startsWith('lernzeit-tracker-')) {
                    return caches.delete(key);
                }
            }));
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        })
    );
});

self.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
```

### Lebenszyklus-Events

| Event | Beschreibung |
|-------|--------------|
| `install` | Wird beim erstmaligen Laden des Service Workers ausgeführt. Cacht alle definierten Assets vor. |
| `activate` | Wird nach der Installation ausgeführt. Bereinigt alte Cache-Versionen. |
| `fetch` | Wird bei jedem Netzwerk-Request ausgeführt. Implementiert die Cache-First-Strategie. |
| `message` | Empfängt Nachrichten von der App (z.B. für manuelle Update-Auslösung). |

### Caching-Strategie

Der Service Worker implementiert eine **Cache-First**-Strategie (Stale-While-Revalidate):

1. **Install**: Pre-Caching aller definierten Assets
2. **Activate**: Bereinigung alter Cache-Versionen
3. **Fetch**: Prüft zuerst den Cache, dann das Netzwerk
4. **Message**: Ermöglicht Steuerung für Update-Auslösung via `postMessage`

### Cache-Versionierung

Der `CACHE_NAME` dient der Versionierung. Bei Änderungen muss die Version aktualisiert werden (`v6` → `v7`), damit der `activate`-Handler automatisch alte Caches löscht.

### Gecachte Assets

| Typ | Dateien |
|-----|---------|
| Lokale Dateien | `index.html`, `style.css`, `js/app.js`, `js/store.js`, `sw.js`, `manifest.json`, Icons |
| Externe Ressourcen | Tailwind CSS CDN, Lucide Icons |

---

## 5. style.css

Hauptstylesheet mit CSS Custom Properties für Theming. Unterstützt sowohl Light- als auch Dark-Mode mit automatischen Übergängen.

```css
:root {
    /* Light Mode Default */
    --color-bg: #f3f4f6; /* gray-100 */
    --color-surface: #ffffff; /* white */
    --color-text: #111827; /* gray-900 */
    --color-text-muted: #6b7280; /* gray-500 */

    --color-primary: #3b82f6;
    --color-success: #22c55e;

    --timer-overlay-bg: radial-gradient(circle at top, #bfdbfe 0%, #f3f4f6 60%);
}

.dark {
    --color-bg: #0f0f11;
    --color-surface: #1c1c1e;
    --color-text: #ffffff;
    --color-text-muted: #a1a1aa;

    --timer-overlay-bg: radial-gradient(circle at top, #1e3a8a 0%, #0f0f11 60%);
}

body {
    background-color: var(--color-bg);
    color: var(--color-text);
    transition: background-color 0.3s, color 0.3s;
}

.surface-card {
    background-color: var(--color-surface);
    border-radius: 1rem;
    transition: background-color 0.3s;
}

/* Heatmap Styles */
.heatmap-cell {
    width: 14px;
    height: 14px;
    border-radius: 3px;
    cursor: pointer;
    transition: transform 0.1s ease;
}

.heatmap-cell:hover {
    transform: scale(1.2);
}

.heatmap-level-0 { background: var(--color-surface); }
.heatmap-level-1 { background: #064e3b; }
.heatmap-level-2 { background: #047857; }
.heatmap-level-3 { background: #059669; }
.heatmap-level-4 { background: #34d399; }

/* Light mode heatmap levels */
.light .heatmap-level-0 { background: #e5e7eb; }
.light .heatmap-level-1 { background: #a7f3d0; }
.light .heatmap-level-2 { background: #6ee7b7; }
.light .heatmap-level-3 { background: #34d399; }
.light .heatmap-level-4 { background: #10b981; }
```

### Theming-Variablen

Diese CSS-Variablen ermöglichen ein konsistentes Farbschema und einfaches Theming:

| Variable | Light Mode | Dark Mode | Verwendung |
|----------|------------|-----------|------------|
| `--color-bg` | `#f3f4f6` | `#0f0f11` | Seitenhintergrund |
| `--color-surface` | `#ffffff` | `#1c1c1e` | Karten und Oberflächenelemente |
| `--color-text` | `#111827` | `#ffffff` | Haupttextfarbe |
| `--color-text-muted` | `#6b7280` | `#a1a1aa` | Gedämpfter Text (Sekundärtext) |
| `--color-primary` | `#3b82f6` | `#3b82f6` | Akzentfarbe (Buttons, Links) |
| `--color-success` | `#22c55e` | `#22c55e` | Erfolgsindikatoren |
| `--timer-overlay-bg` | Radiales Gradient | Radiales Gradient | Timer-Overlay-Hintergrund |

### Heatmap-Level

Die Aktivitäts-Heatmap verwendet 5 Intensitätsstufen zur Visualisierung der Lernaktivität:

| Level | Dark Mode | Light Mode | Aktivitätsstufe |
|-------|-----------|------------|-----------------|
| 0 | `--color-surface` | `#e5e7eb` | Keine Aktivität |
| 1 | `#064e3b` | `#a7f3d0` | Geringe Aktivität |
| 2 | `#047857` | `#6ee7b7` | Leichte Aktivität |
| 3 | `#059669` | `#34d399` | Mittlere Aktivität |
| 4 | `#34d399` | `#10b981` | Hohe Aktivität |

---

## 6. css/toast.css

Toast-Benachrichtigungsstile für Benachrichtigungen am unteren Bildschirmrand.

```css
#toast-container {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 100;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
    align-items: center;
}

.toast {
    position: static;
    background-color: var(--color-surface);
    color: var(--color-text);
    padding: 12px 24px;
    border-radius: 99px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    opacity: 0;
    transform: translateY(100%);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-size: 0.875rem;
    font-weight: 500;
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 8px;
}

.toast.show {
    transform: translateY(0);
    opacity: 1;
}

.toast-success {
    border-left: 4px solid #22c55e;
}

.toast-error {
    border-left: 4px solid #ef4444;
}
```

### Toast-Varianten

| Variante | CSS-Klasse | Akzentfarbe | Verwendung |
|----------|------------|-------------|------------|
| Standard | `.toast` | — | Allgemeine Meldungen |
| Erfolg | `.toast-success` | `#22c55e` (Grün) | Erfolgreiche Aktionen |
| Fehler | `.toast-error` | `#ef4444` (Rot) | Fehlermeldungen |

### Animationsverhalten

- **Eingeblendet**: Slide-Up + Fade-In (0.3s, ease-out)
- **Ausgeblendet**: Slide-Down + Fade-Out (0.3s)
- **Position**: Zentriert am unteren Bildschirmrand (24px Abstand)
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` für natürliche Bewegung

---

## 7. GitHub Actions Workflow

CI-Workflow für automatisierte Validierung bei jedem Push und Pull Request.

### Datei: `.github/workflows/validate.yml`

```yaml
name: Validate
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check files
        run: |
          [ -f index.html ] && echo "HTML OK" || echo "No index.html"
          for f in *.js; do [ -f "$f" ] && node --check "$f" 2>/dev/null && echo "$f OK" || echo "$f syntax error"; done
          echo "Done"
```

### Workflow-Details

| Eigenschaft | Wert | Beschreibung |
|------------|------|--------------|
| **Trigger** | `push`, `pull_request` | Wird bei jedem Push und PR ausgeführt |
| **Runner** | `ubuntu-latest` | Ubuntu 24.04 (Latest) |
| **Checkout** | `actions/checkout@v4` | Repository auschecken |

### Validierungsschritte

1. **HTML-Prüfung**: Verifiziert, dass `index.html` existiert
2. **JavaScript-Syntax**: Prüft alle `.js`-Dateien mit `node --check` auf syntaktische Korrektheit

---

## Zusammenfassung

| Datei | Zweck | Schlüsselfunktion |
|-------|-------|-------------------|
| `package.json` | Projektmetriken und npm-Skripte | Testautomatisierung |
| `manifest.json` | PWA-Konfiguration | Installation auf Home-Bildschirm |
| `playwright.config.js` | E2E-Test-Setup | Responsive Testing |
| `sw.js` | Offline-Unterstützung | Funktionalität ohne Internet |
| `style.css` | Dynamisches Theming | Light/Dark Mode |
| `css/toast.css` | Toast-Benachrichtigungen | Benutzerfeedback |
| `.github/workflows/validate.yml` | CI-Validierung | Code-Qualitätssicherung |
