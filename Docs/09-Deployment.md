# Deployment-Dokumentation

## Inhaltsverzeichnis

- [Lokale Entwicklung](#lokale-entwicklung)
- [PWA-Installation](#pwa-installation)
- [Service Worker Update-Mechanismus](#service-worker-update-mechanismus)
- [Offline-Fähigkeiten](#offline-fähigkeiten)
- [Browser-Kompatibilität](#browser-kompatibilität)
- [Performance-Überlegungen](#performance-überlegungen)
- [Produktions-Deployment](#produktions-deployment)
- [Troubleshooting](#troubleshooting)

---

## Lokale Entwicklung

### Entwicklungsserver starten

```bash
npx serve -p 8080
```

Der Entwicklungsserver wird auf `http://localhost:8080` gestartet. Die Anwendung ist dann im Browser erreichbar.

### Lokale Entwicklung mit HTTPS

Einige PWA-Features (z.B. Push-Benachrichtigungen, Background Sync) erfordern HTTPS. Für lokale Tests kann ein selbstsigniertes Zertifikat verwendet werden:

```bash
npx serve -p 8080 --ssl-cert cert.pem --ssl-key key.pem
```

> **Hinweis:** Nach dem Öffnen der HTTPS-URL zeigt der Browser eine Sicherheitswarnung an. Diese kann für lokale Tests ignoriert werden (Zertifikat vertrauen / weitermachen).

---

## PWA-Installation

### Installationsanforderungen

Die App erfüllt die Mindestanforderungen für PWA-Installation:

- `manifest.json` mit App-Metadaten (Name, Icons, Start-URL, Display-Modus)
- Service Worker registriert und aktiv
- HTTPS-Verbindung (oder `localhost` für lokale Entwicklung)
- Icons in zwei Größen (192×192 px und 512×512 px)

### Installationsprozess

1. Website im Browser öffnen
2. Browser zeigt automatisch Installationsbanner an (sofern verfügbar)
3. Auf **Zum Startbildschirm hinzufügen** klicken
4. App wird als eigenständige Anwendung installiert

### Browser-spezifische Hinweise

| Browser | Installationsmethode |
|---------|----------------------|
| Chrome / Edge | Automatisches Banner oder Menü → "App installieren" |
| Safari (iOS) | Teilen-Menü → "Zum Home-Bildschirm" |
| Firefox | Menü → "Seite installieren" |

> **iOS-Besonderheit:** Safari auf iOS unterstützt nicht alle PWA-Features (z.B. Background Sync). Die App bleibt jedoch vollständig funktional.

---

## Service Worker Update-Mechanismus

### Aktualisierungsverhalten

Der Service Worker verwendet eine automatisierte Update-Strategie:

1. Bei Seitenaufruf prüft der Browser auf neue Service-Worker-Version
2. Neue Version wird im Hintergrund heruntergeladen
3. Neue Version wartet, bis alle Tabs geschlossen sind
4. Bei nächster Navigation übernimmt die neue Version

### Manuelle Aktualisierung erzwingen

```javascript
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) {
            reg.update();
        }
    });
}
```

### Versionierung

Die Service-Worker-Version wird in `sw.js` verwaltet. Bei Änderungen an gecachten Dateien sollte die Version aktualisiert werden:

```javascript
const CACHE_VERSION = 'v2.0.0';
```

> **Tipp:** Bei Problemen nach einem Update: Browser-Cache leeren und Service Worker in DevTools deregistrieren. Alternativ "Update on reload" in den DevTools aktivieren.

---

## Offline-Fähigkeiten

### Caching-Strategie

Die App implementiert einen **Cache-First-Ansatz** (Stale-While-Revalidate):

- Statische Ressourcen werden beim ersten Besuch gecacht
- Seitenanfragen bedienen sich aus dem Cache
- Bei Netzwerkfehler wird gecachter Inhalt angezeigt

### Verfügbare Offline-Funktionen

| Funktion | Status |
|----------|--------|
| Timer-Funktionalität | Verfügbar (via localStorage) |
| Dashboard-Ansicht | Verfügbar (mit zuvor geladenen Daten) |
| Core-UI-Komponenten | Vollständig verfügbar |

### Offline-Einschränkungen

| Einschränkung | Beschreibung |
|---------------|---------------|
| Externer Datenabruf | Nicht verfügbar (API-Anfragen schlagen fehl) |
| Echtzeit-Synchronisation | Deaktiviert |
| Lokale Daten | Bleiben vollständig funktionsfähig |

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

> **Hinweis:** Nach dem Leeren des Caches werden alle Ressourcen beim nächsten Besuch neu heruntergeladen. Dies kann zu längeren Ladezeiten führen.

---

## Browser-Kompatibilität

### Unterstützte Desktop-Browser

| Browser | Version | PWA-Support |
|---------|---------|-------------|
| Chrome | 90+ | Vollständig |
| Firefox | 88+ | Vollständig |
| Safari | 14.1+ | Eingeschränkt* |
| Edge | 90+ | Vollständig |
| Samsung Internet | 14+ | Vollständig |
| Opera | 76+ | Vollständig |

*iOS Safari unterstützt: Installation, Offline-Nutzung, lokales Caching. **Nicht unterstützt:** Background Sync, Push-Benachrichtigungen.

### Mobile Browser

| Browser | Plattform | PWA-Support |
|---------|----------|-------------|
| Safari | iOS | Eingeschränkt |
| Chrome | Android | Vollständig |
| Samsung Internet | Android | Vollständig |
| Firefox | Android | Vollständig |

### Fallback für ältere Browser

Die App verwendet **progressive Verbesserung** (Progressive Enhancement). Ältere Browser zeigen die Kernfunktionalität ohne Offline-Fähigkeiten.

---

## Performance-Überlegungen

### First Contentful Paint (FCP)

Durch Service-Worker-Caching wird der FCP nach dem ersten Besuch deutlich verbessert. Bei wiederholten Besuchen werden Inhalte instant aus dem Cache geladen.

### Bundle-Größe

Die App ist als Single-Page-Application konzipiert mit minimaler Abhängigkeit. Keine externen Frameworks erforderlich.

### Caching-Strategie optimieren

| Ressource | Cache-Dauer | Hinweis |
|-----------|-------------|---------|
| HTML | Variabel | Update bei neuer Service-Worker-Version |
| CSS/JS | 1 Jahr | Versionierung im Dateinamen empfohlen |
| Bilder | 1 Jahr | |
| Externe Fonts | 1 Jahr | Versionierung im Dateinamen |
| API-Daten | Via Cache-Control Header | |

### Lighthouse-Empfehlungen

Die App sollte folgende Scores erreichen:

| Kategorie | Ziel-Score |
|-----------|------------|
| PWA-Validierung | Bestanden |
| Performance | ≥ 90 |
| Accessibility | ≥ 95 |
| Best Practices | Bestanden |

### Service-Worker-Registrierung

Die Registrierung erfolgt asynchron, um die initiale Seitenladung nicht zu blockieren:

```javascript
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW registriert:', reg.scope))
            .catch(err => console.error('SW Registrierung fehlgeschlagen:', err));
    });
}
```

---

## Produktions-Deployment

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
- `.well-known`-Pfad für AppLinks (optional, für Android Deep Links)
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
3. Nach kurzer Zeit verfügbar unter:
   ```
   https://username.github.io/repository-name
   ```

---

## Troubleshooting

### App wird nicht installiert

| Prüfpunkt | Lösung |
|-----------|--------|
| HTTPS | Seite muss über HTTPS erreichbar sein |
| manifest.json | Vollständige Felder prüfen (name, icons, start_url, display) |
| Service Worker | In DevTools → Application → Service Workers prüfen |
| Console | Fehlermeldungen auf Service-Worker-Fehler untersuchen |

### Offline funktioniert nicht

1. DevTools öffnen (F12) → Application → Service Workers
2. Status prüfen: "Activated and is running"
3. Application → Cache Storage: Dateien vorhanden?
4. Console auf Fehler prüfen

### Service Worker aktualisiert nicht

| Schritt | Aktion |
|---------|--------|
| 1 | Browser-Cache leeren (STRG+SHIFT+R / CMD+SHIFT+R) |
| 2 | In DevTools → Application → Service Workers: "Update on reload" aktivieren |
| 3 | `update()` manuell aufrufen |
| 4 | Service Worker deregistrieren und Seite neu laden |

### HTTPS-Fehler trotz Zertifikat

| Problem | Lösung |
|---------|--------|
| Zertifikat nicht für Domain gültig | Zertifikat für die Domain ausstellen (keine Wildcards für localhost) |
| Lokale Tests | `localhost` verwenden (kein HTTPS erforderlich) |
| Zertifikat nicht korrekt konfiguriert | Prüfen: nicht abgelaufen, korrekte Chain |
