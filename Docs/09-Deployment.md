# Deployment-Dokumentation

## Lokale Entwicklung

### Entwicklungserver starten

```bash
npx serve -p 8080
```

Der Entwicklungsserver wird auf `http://localhost:8080` gestartet. Die Anwendung ist dann im Browser erreichbar.

### Lokale Entwicklung mit HTTPS

Einige PWA-Features erfordern HTTPS. Für lokale Tests kann ein selbstsigniertes Zertifikat verwendet werden:

```bash
npx serve -p 8080 --ssl-cert cert.pem --ssl-key key.pem
```

---

## PWA-Installation

### Installationsanforderungen

Die App erfüllt die Mindestanforderungen für PWA-Installation:

- `manifest.json` mit App-Metadaten
- Service Worker registriert
- HTTPS-Verbindung (oder localhost)
- Icon in zwei Größen (192x192 und 512x512)

### Installationsprozess

1. Website im Browser öffnen
2. Browser zeigt automatisch Installationsbanner an
3. Auf "Zum Startbildschirm hinzufügen" klicken
4. App wird als eigenständige Anwendung installiert

### Browser-spezifische Hinweise

| Browser | Installationsmethode |
|---------|---------------------|
| Chrome/Edge | Automatisches Banner oder Menü > "App installieren" |
| Safari (iOS) | Teilen-Menü > "Zum Home-Bildschirm" |
| Firefox | Menü > "Seite installieren" |

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
        reg.update();
    });
}
```

### Versionierung

Die Service-Worker-Version wird in `sw.js` verwaltet. Bei Änderungen an gecachten Dateien sollte die Version aktualisiert werden:

```javascript
const CACHE_VERSION = 'v2.0.0';
```

---

## Offline-Fähigkeiten

### Caching-Strategie

Die App implementiert einen Cache-First-Ansatz:

- Statische Ressourcen werden beim ersten Besuch gecacht
- Seitenanfragen bedienen sich aus dem Cache
- Bei Netzwerkfehler wird gecachter Inhalt angezeigt

### Verfügbare Offline-Funktionen

- Timer-Funktionalität (lokal gespeichert)
- Dashboard-Ansicht mit zuvor geladenen Daten
- Alle core UI-Komponenten

### Offline-Einschränkungen

- Datenabruf von externen APIs nicht verfügbar
- Echtzeit-Synchronisation deaktiviert
- Lokale Daten bleiben vollständig funktionsfähig

### Cache leeren

```javascript
navigator.serviceWorker.getRegistration().then(reg => {
    reg.unregister().then(() => {
        caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
        });
    });
});
```

---

## Browser-Kompatibilität

### Unterstützte Browser

| Browser | Version | PWA-Support |
|---------|---------|-------------|
| Chrome | 90+ | Vollständig |
| Firefox | 88+ | Vollständig |
| Safari | 14.1+ | Eingeschränkt |
| Edge | 90+ | Vollständig |
| Samsung Internet | 14+ | Vollständig |
| Opera | 76+ | Vollständig |

### Mobile Browser

- iOS Safari ab Version 14.1
- Chrome für Android
- Samsung Internet Browser
- Firefox für Android

### Fallback für ältere Browser

Die App verwendet progressive Verbesserung. Ältere Browser zeigen die Kernfunktionalität ohne Offline-Fähigkeiten.

---

## Performance-Überlegungen

### First Contentful Paint (FCP)

Durch Service-Worker-Caching wird der FCP nach dem ersten Besuch deutlich verbessert.

### Bundle-Größe

Die App ist als Single-Page-Application konzipiert mit minimaler Abhängigkeit. Keine externen Frameworks erforderlich.

### Caching-Strategie optimieren

| Ressource | Cache-Dauer |
|-----------|-------------|
| HTML | Variiert (Update bei neuem SW) |
| CSS/JS | 1 Jahr (versioniert) |
| Bilder | 1 Jahr |
| API-Daten | Cache-Control Header |

### Lighthouse-Empfehlungen

- PWA-Validierung bestehen
- Performance-Score über 90
- Accessibility-Score über 95
- Best Practices einhalten

### Service-Worker-Registrierung

Die Registrierung erfolgt asynchron, um die initiale Seitenladung nicht zu blockieren:

```javascript
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js');
    });
}
```

---

## Produktions-Deployment

### Empfohlene Hosting-Optionen

- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages
- Jeder statische Webserver

### Anforderungen an Hosting

- HTTPS obligatorisch
- `.well-known`-Pfad für AppLinks (optional)
- Korrekte MIME-Types für manifest.json und sw.js

### Build-Prozess

Die App benötigt keinen Build-Prozess. Alle Dateien sind produktionsfertig:

```
/
├── index.html
├── manifest.json
├── sw.js
├── js/
│   ├── app.js
│   └── store.js
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

---

## Troubleshooting

### App wird nicht installiert

- Prüfe HTTPS-Konfiguration
- Prüfe manifest.json auf Vollständigkeit
- Prüfe Service-Worker-Registrierung in DevTools

### Offline funktioniert nicht

- Öffne DevTools > Application > Service Workers
- Prüfe Cache-Storage auf vorhandene Dateien
- Prüfe Konsole auf Service-Worker-Fehler

### Service Worker aktualisiert nicht

- Browser-Cache leeren
- `update()` manuell aufrufen
- Service Worker in DevTools abbrechen und erneut registrieren
