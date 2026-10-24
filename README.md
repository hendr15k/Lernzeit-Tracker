# Lernzeit Tracker

Ein moderner Lernzeit-Tracker, der als Progressive Web App (PWA) konzipiert ist. Er ermöglicht es Studierenden und Lernenden, ihre Lernzeiten zu erfassen, zu visualisieren und zu analysieren.

Der eigene Container läuft standardmäßig unter `http://<server>:8085/`. GitHub Pages kann den Login nicht bereitstellen, weil dort kein API-Dienst läuft.


## Oberfläche

Ein ruhiger Arbeitsbereich statt einer langen Telefonliste: feste Seitenleiste am Desktop, kompakte Kopfzeile und Schnellnavigation am Handy, ein Fokusbereich mit direktem Start der Lernsession und ein Raster, das Kennzahlen und Diagramme nach Relevanz ordnet. Die Oberfläche braucht zur Laufzeit kein CDN. Lerndaten werden hinter dem Login auf dem eigenen Server gespeichert und im Browser nur als Arbeitskopie vorgehalten.

Screenshots und Prüfung: `npm install`, `npm test` (Playwright, Handy und Desktop). Tailwind wird lokal gebaut mit `npm run build:css`.

## Funktionen

*   **Dashboard:**
    *   Visualisierung der Lernzeiten der letzten 7 Tage als Balkendiagramm ("Aktienkurs"-Stil).
    *   Anzeige des aktuellen Streaks (Tage in Folge gelernt).
    *   Gesamtstundenanzeige für den aktuellen Tag.
*   **Timer:**
    *   Integrierter Stopwatch-Timer.
    *   Auswahl des Fachs (z.B. Informatik, Mathe, Englisch).
    *   Speichern von Lernsitzungen.
*   **Historie (Einheiten):**
    *   Chronologische Liste aller gespeicherten Lernsitzungen.
    *   Anzeige von Dauer, Fach und Zeitstempel.
*   **Kalender:**
    *   Monatsübersicht mit täglichen Lernzeiten.
*   **Fächerverwaltung:**
    *   Übersicht der angelegten Fächer.
*   **Login und Persistenz:**
    *   Anmeldung mit Benutzername und Passwort, Sitzung als HttpOnly-Cookie.
    *   Lerndaten werden im Browser und zusätzlich serverseitig in einem Docker Volume gespeichert.
    *   Beim ersten Login werden vorhandene lokale Daten in das Konto übernommen.
*   **Design:**
    *   Modernes Dark-Mode Design.
    *   Responsive Layout (optimiert für Mobile First).

## Technologien

*   HTML5
*   CSS3 (lokal gebautes Tailwind)
*   JavaScript (ES6+)
*   Lucide Icons (für Icons)

## Installation & Nutzung

Für den vollen Funktionsumfang wird der Node-Dienst benötigt. Nur die Hülle lässt sich ohne Login über `npm run start:static` ansehen, dann fehlen aber Anmeldung und serverseitige Speicherung.

1.  Repository klonen und `npm install` ausführen.
2.  `.env.example` nach `.env` kopieren und Werte setzen (siehe Login).
3.  `npm start` startet die App unter `http://localhost:3000/`.

## Login einrichten

Die Zugangsdaten liegen ausschließlich in der nicht versionierten `.env` auf dem Server. Es gibt keinen Standardzugang im Repository.

```bash
cp .env.example .env
openssl rand -hex 32
# AUTH_SECRET auf den ausgegebenen Wert setzen
PASSWORD='dein-passwort' node server/hash-password.js
# AUTH_PASSWORD_HASH auf die Ausgabe setzen, in .env in einfache Anführungszeichen
chmod 600 .env
```

`AUTH_USER` ist der Benutzername. Das Passwort wird mit scrypt gehasht und nie im Klartext gespeichert. Bei vergessenem Passwort den Hash neu erzeugen und den API-Container neu starten. Sitzungen sind 30 Tage gültig, als `HttpOnly` und `SameSite=Strict` gesetzt und werden bei HTTPS zusätzlich mit `Secure` ausgeliefert.

## Docker

Die App besteht aus zwei Containern: nginx liefert die statischen Dateien, ein kleiner Node-Dienst stellt Login und Datenspeicherung unter `/api/` bereit. Die Daten liegen im benannten Volume `lernzeit-data` und überleben Rebuilds und Neustarts.

```bash
docker compose up -d --build --wait
```

Danach ist die App unter `http://localhost:8085/` erreichbar. Ein anderer Port lässt sich über `APP_PORT` setzen:

```bash
APP_PORT=9000 docker compose up -d
```

Der Container läuft schreibgeschützt, ohne zusätzliche Linux-Capabilities und mit Healthcheck auf `/healthz`. nginx setzt CSP, `nosniff`, `X-Frame-Options: DENY` und passende Cache-Regeln: `index.html` und `sw.js` werden nie veraltet ausgeliefert, Assets dürfen eine Stunde zwischengespeichert werden. Aktualisieren nach einem neuen Stand:

```bash
git pull
docker compose up -d --build
```

Für Installation als PWA braucht der Browser einen sicheren Kontext. Über eine öffentliche IP mit reinem HTTP verweigert er den Service Worker. Hinter einem TLS-Reverse-Proxy, etwa Caddy oder Traefik mit Zertifikat, funktioniert die PWA vollständig. Ohne Netz zeigt die App die Login-Schranke, weil die Anmeldung serverseitig geprüft wird.

Daten sichern und zurücksetzen:

```bash
docker run --rm -v lernzeit-data:/data -v "$PWD":/backup alpine tar czf /backup/lernzeit-data.tar.gz -C /data .
```

Das Volume lässt sich über `docker volume inspect lernzeit-data` finden. Ein Löschen des Volumes entfernt alle Kontodaten endgültig.

## Projektstruktur

*   `index.html`: Hauptstruktur der Anwendung.
*   `style.css`: Benutzerdefinierte Styles und Anpassungen.
*   `js/app.js`: Hauptlogik für UI, Navigation und Timer.
*   `js/store.js`: Datenverwaltung und LocalStorage-Logik.
*   `js/auth.js`: Login-Schranke, Sitzung und Server-Synchronisierung.
*   `server/server.js`: Node-API für Login und Kontodaten, ohne externe Abhängigkeiten.
*   `server/hash-password.js`: erzeugt den scrypt-Hash für `.env`.
*   `Dockerfile` und `nginx.conf`: Container-Build, Proxy und Auslieferung.
*   `compose.yaml`: Betrieb mit API, Volume, Healthchecks und gehärteten Rechten.
