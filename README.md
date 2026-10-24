# Lernzeit Tracker

Ein moderner Lernzeit-Tracker, der als Progressive Web App (PWA) konzipiert ist. Er ermöglicht es Studierenden und Lernenden, ihre Lernzeiten zu erfassen, zu visualisieren und zu analysieren.

[Live Demo](https://hendr15k.github.io/Lernzeit-Tracker/)


## Oberfläche

Ein ruhiger Arbeitsbereich statt einer langen Telefonliste: feste Seitenleiste am Desktop, kompakte Kopfzeile und Schnellnavigation am Handy, ein Fokusbereich mit direktem Start der Lernsession und ein Raster, das Kennzahlen und Diagramme nach Relevanz ordnet. Alle Daten bleiben lokal, die Oberfläche braucht zur Laufzeit kein CDN.

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
*   **Persistenz:**
    *   Alle Daten werden lokal im Browser (`localStorage`) gespeichert. Keine Registrierung notwendig.
*   **Design:**
    *   Modernes Dark-Mode Design.
    *   Responsive Layout (optimiert für Mobile First).

## Technologien

*   HTML5
*   CSS3 (lokal gebautes Tailwind)
*   JavaScript (ES6+)
*   Lucide Icons (für Icons)

## Installation & Nutzung

Da es sich um eine statische Webseite handelt, kann sie direkt im Browser geöffnet werden.

1.  Repository klonen oder herunterladen.
2.  `index.html` im Browser öffnen.

Alternativ kann die Seite über GitHub Pages gehostet werden.

## Projektstruktur

*   `index.html`: Hauptstruktur der Anwendung.
*   `style.css`: Benutzerdefinierte Styles und Anpassungen.
*   `js/app.js`: Hauptlogik für UI, Navigation und Timer.
*   `js/store.js`: Datenverwaltung und LocalStorage-Logik.
