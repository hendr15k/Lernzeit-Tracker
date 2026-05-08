# UI-Views und Komponenten Dokumentation

> **Hinweis:** Diese Dokumentation ist Teil der [Projektdokumentation](./README.md).
> Siehe auch: [01-Architecture.md](./01-Architecture.md) für die architektonische Einordnung.

---

## Inhaltsverzeichnis

1. [Übersicht](#übersicht)
2. [Hauptansichten](#1-hauptansichten-views)
3. [Modal-Overlays](#2-modal-overlays)
4. [Dashboard-Widgets](#3-dashboard-widgets)
5. [Navigationssystem](#4-navigationssystem)
6. [Theme-System](#5-theme-system)
7. [Toast-Benachrichtigungen](#6-toast-benachrichtigungen)
8. [Floating Action Button](#7-floating-action-button-fab)
9. [Weitere Komponenten](#8-weitere-komponenten)
10. [Utility-Funktionen](#9-utility-funktionen)

---

## 1. Übersicht

Der Lernzeit-Tracker ist eine progressive Web-App (PWA) zum Tracking von Lernzeiten. Die Anwendung verwendet ein Single-Page-Application-Design mit fünf Hauptansichten und mehreren Modal-Overlays. Das UI basiert auf Tailwind CSS mit CSS Custom Properties für das dynamische Theme-System.

**Technologie-Stack:**

| Kategorie | Technologie |
|-----------|-------------|
| Framework | Progressive Web App (PWA) |
| Styling | Tailwind CSS mit CSS Custom Properties |
| Icons | Lucide Icons |

---

## 2. Hauptansichten (Views)

### 2.1 Dashboard (`#view-dashboard`)

Die Startseite der Anwendung zeigt eine Übersicht aller Lernstatistiken auf einen Blick. Die Ansicht ist in mehrere Widget-Bereiche unterteilt.

#### Enthaltene Widgets

| Widget | ID | Beschreibung |
|--------|-----|--------------|
| Tagesziel-Ring | `#daily-goal-ring` | SVG-basierter Fortschrittsring |
| Wochenübersicht | `#dashboard-graph` | Balkendiagramm der letzten 7 Tage |
| Streak-Anzeige | `#dashboard-streak` | Anzahl Tage in Folge mit Lernaktivität |
| Gesamtzeit | `#dashboard-total` | Gesamte Lernzeit in Stunden |
| Heatmap | `#heatmap-grid` | 12-Wochen-Aktivitätsübersicht |
| Achievements | `#achievements-list` | Liste freigeschalteter Erfolge |
| Prüfungs-Countdown | `#exam-countdown-list` | Nächste Prüfungen mit Countdown |
| Wochenstatistik | `#weekly-bar-chart` | Balkendiagramm Mo–So |
| Wochenvergleich | `#weekly-compare-list` | Vergleich mit Vorwoche nach Fach |
| Fächer-Kacheln | `#dashboard-subject-tiles` | Fortschritt pro Fach |

Siehe auch: [Dashboard-Widgets](#3-dashboard-widgets) für Details.

---

### 2.2 Einheiten (`#view-einheiten`)

Chronologische Liste aller Lernsessions mit Filter- und Suchfunktion.

#### Elemente

| Element | ID | Beschreibung |
|---------|-----|--------------|
| Fach-Filter | `#history-filter-subject` | Dropdown zur Filterung nach Fach |
| Suchfeld | `#history-search-input` | Freitextsuche in Notizen und Fächern |
| Einheiten-Liste | `#einheiten-list` | Dynamisch gerenderte Einträge, gruppiert nach Datum |

#### Funktionalität

- Einträge werden nach Datum absteigend gruppiert
- Jeder Eintrag zeigt: Fach-Farbe, Fachname, Uhrzeit, Dauer
- Bearbeiten- und Löschen-Buttons pro Eintrag

---

### 2.3 Fächer (`#view-faecher`)

Verwaltungsoberfläche für Lernfächer mit Statistiken pro Fach.

#### Elemente

| Element | ID | Beschreibung |
|---------|-----|--------------|
| Hinzufügen-Button | `#btn-add-subject` | Öffnet das Fach-Modal |
| Fächer-Liste | `#faecher-list` | Grid mit Fach-Karten |

#### Fach-Karte (dynamisch generiert)

- Farbiger Kreis mit den ersten zwei Buchstaben des Fachnamens
- Fachname und Gesamtlernzeit
- Top 3 Themen als Tags
- Bearbeiten- und Löschen-Buttons

---

### 2.4 Kalender (`#view-kalender`)

Aggregierte Zeitansicht mit Tag/Woche/Monat-Umschaltung.

#### Elemente

| Element | Beschreibung |
|---------|--------------|
| Tagesansicht-Button | Zeigt einzelne Tage an |
| Wochensicht-Button | Zeigt Kalenderwochen an |
| Monatssicht-Button | Zeigt Monate an |
| Kalender-Liste | Aggregierte Zeiteinträge |

---

### 2.5 Semester (`#view-semester`)

Verwaltung von Semesterplänen mit Modulen und Prüfungen.

#### 2.5.1 Liste-Ansicht (`#semester-list-view`)

| Element | ID | Beschreibung |
|---------|-----|--------------|
| Semester hinzufügen | `#btn-add-semester` | Button mit +-Icon |
| Semester-Liste | `#semester-list` | Liste der Semester-Karten |
| Leerer Zustand | `#semester-empty-state` | Wird angezeigt, wenn keine Semester vorhanden sind |

#### 2.5.2 Detail-Ansicht (`#semester-detail-view`)

| Element | ID | Beschreibung |
|---------|-----|--------------|
| Zurück-Button | `#btn-back-to-semesters` | Navigation zurück zur Liste |
| Modul hinzufügen | `#btn-add-module` | Button mit +-Icon |
| Modul-Liste | `#module-list` | Liste der Module |

---

## 3. Modal-Overlays

### 3.1 Timer-Overlay (`#timer-overlay`)

Vollbild-Overlay für die Stoppuhr-Funktion mit integriertem Pomodoro-Support.

Siehe auch: [02-Timer.md](./02-Timer.md) für vollständige Timer-Dokumentation.

#### Struktur

```
#timer-overlay
├── Header
│   ├── #btn-timer-close (Schließen)
│   └── Maximize-Button
├── Content
│   ├── #timer-subject-select (Fach-Auswahl)
│   ├── #timer-topics-input (Thema)
│   ├── #timer-display (Timer-Anzeige)
│   ├── #timer-notes-collapsed (Notizen)
│   └── #btn-pomodoro-toggle (Pomodoro-Modus)
├── Controls
│   ├── #btn-timer-start (Start)
│   ├── #btn-timer-pause (Pause)
│   └── #btn-timer-stop (Stopp)
└── #btn-timer-save (Sitzung speichern)
```

#### Timer-Modi

| Modus | Beschreibung |
|-------|--------------|
| Stoppuhr (frei) | Zählt Sekunden, Minuten und Stunden hoch |
| Pomodoro | Countdown-Timer mit konfigurierbaren Phasen |

---

### 3.2 Eintrag hinzufügen (`#add-entry-overlay`)

Modal zum manuellen Hinzufügen einer Lernsession.

#### Felder

| Feld | ID | Typ | Beschreibung |
|------|-----|-----|--------------|
| Fach | `#add-subject-select` | Select | Auswahl des Lernfachs |
| Thema | `#add-topics-input` | Text | Themen/Tags der Session |
| Datum | `#add-date-input` | Date | Datum der Session |
| Uhrzeit | `#add-time-input` | Time | Startzeit der Session |
| Dauer | `#add-duration-input` | Number | Dauer in Minuten |
| Quick-Duration | `.btn-quick-duration` | Buttons | Schnellauswahl: 15m, 30m, 45m, 60m |
| Notizen | `#add-notes-input` | Textarea | Freitextnotizen |

---

### 3.3 Fach hinzufügen/bearbeiten (`#add-subject-overlay`)

Modal zur Erstellung und Bearbeitung von Fächern.

#### Felder

| Feld | ID | Typ | Beschreibung |
|------|-----|-----|--------------|
| Name | `#add-subject-name` | Text | Name des Fachs |
| Farbe | `#add-subject-color` | Select | Auswahl aus 10 Farben |
| Wochenziel | `#add-subject-weekly-goal` | Number | Ziel in Stunden pro Woche |

#### Verfügbare Farben

| Klasse | Farbe |
|--------|-------|
| `bg-red-500` | Rot |
| `bg-orange-500` | Orange |
| `bg-yellow-500` | Gelb |
| `bg-green-500` | Grün |
| `bg-teal-500` | Türkis |
| `bg-blue-500` | Blau |
| `bg-indigo-500` | Indigo |
| `bg-purple-500` | Lila |
| `bg-pink-500` | Pink |
| `bg-gray-500` | Grau |

---

### 3.4 Einstellungen (`#settings-overlay`)

Umfassende Einstellungsverwaltung mit mehreren Abschnitten.

#### 3.4.1 Allgemein

| Einstellung | ID | Typ | Standardwert |
|-------------|-----|-----|--------------|
| Tägliches Ziel | `#settings-daily-goal` | Number | 60 (Minuten) |
| Lern-Tage/Woche | `#settings-learning-days` | Number | 5 |
| Schriftgröße | `#settings-font-size` | Range | 16 (12–24px) |

#### 3.4.2 Design

| Option | ID | Beschreibung |
|--------|-----|--------------|
| Hell | `#settings-theme-light` | Wechselt zum hellen Theme |
| Dunkel | `#settings-theme-dark` | Wechselt zum dunklen Theme |
| Auto | `#settings-theme-auto` | Folgt der Systemeinstellung |

#### 3.4.3 Pomodoro

| Einstellung | ID | Standardwert |
|-------------|-----|--------------|
| Arbeitszeit | `#settings-pomo-work` | 25 Minuten |
| Kurze Pause | `#settings-pomo-short` | 5 Minuten |
| Lange Pause | `#settings-pomo-long` | 15 Minuten |
| Lange Pause alle X | `#settings-pomo-interval` | 4 |
| Auto Pause | `#settings-pomo-auto-break` | Checkbox |
| Auto Arbeit | `#settings-pomo-auto-work` | Checkbox |

#### 3.4.4 Datenverwaltung

| Button | ID | Funktion |
|--------|-----|----------|
| Backup (JSON) | `#btn-settings-export` | Exportiert alle Daten als JSON-Datei |
| Importieren | `#btn-settings-import-trigger` | Importiert ein JSON-Backup |
| CSV | `#btn-settings-export-csv` | Exportiert Einträge als CSV-Datei |
| Wochen-PDF | `#btn-settings-export-pdf` | Generiert Wochenbericht |
| Alle Daten löschen | `#btn-settings-reset` | Löscht alle lokalen Daten |

---

### 3.5 Semester hinzufügen/bearbeiten (`#add-semester-overlay`)

Modal zur Semesterverwaltung.

#### Felder

| Feld | ID | Typ | Beschreibung |
|------|-----|-----|--------------|
| Name | `#add-semester-name` | Text | Name des Semesters |
| Startdatum | `#add-semester-start` | Date | Beginn des Semesters |
| Enddatum | `#add-semester-end` | Date | Ende des Semesters |

---

### 3.6 Modul hinzufügen/bearbeiten (`#add-module-overlay`)

Modal zur Modulverwaltung innerhalb eines Semesters.

#### Felder

| Feld | ID | Typ | Beschreibung |
|------|-----|-----|--------------|
| Modulname | `#add-module-name` | Text | Name des Moduls |
| Fach | `#add-module-subject` | Select | Zugehöriges Lernfach |
| Modulcode | `#add-module-code` | Text | Offizieller Modulcode |
| ECTS | `#add-module-ects` | Number | Erzielbare ECTS-Punkte |
| Geschätzte Stunden | `#add-module-hours` | Number | Erwartete Lernstunden |
| Prüfungsphase | `#add-module-exam-period` | Select | Vordefinierte Prüfungszeiträume |
| Prüfungsdatum | `#add-module-exam-date` | Date | Konkretes Prüfungsdatum |
| Note | `#add-module-grade` | Select | Erhaltene Note |
| Notizen | `#add-module-notes` | Textarea | Zusätzliche Notizen |

---

## 4. Dashboard-Widgets

### 4.1 Tagesziel-Ring (`#daily-goal-ring`)

SVG-basierter Ringdiagramm zur Visualisierung des Tagesziels.

#### SVG-Elemente

| Element | ID | Beschreibung |
|---------|-----|--------------|
| Fortschrittsbogen | `#daily-goal-progress` | Animierter Fortschrittsbogen |
| Zeit-Anzeige | `#daily-goal-time` | Zentrierter Text mit aktueller Zeit |
| Feuer-Animation | `#daily-goal-fire` | Feuer-Animation bei Zielerreichung |

#### Berechnung

```javascript
pct = min(todaySeconds / dailyGoalSeconds, 1)
offset = circumference * (1 - pct)
```

---

### 4.2 Heatmap (`#heatmap-grid`)

GitHub-inspirierte Aktivitätsübersicht der letzten 12 Wochen.

#### Level-Farben

| Level | Dunkelmodus | Hellmodus | Bedeutung |
|-------|-------------|-----------|-----------|
| 0 | Surface | `#e5e7eb` | Keine Aktivität |
| 1 | `#064e3b` | `#a7f3d0` | <25% des Maximums |
| 2 | `#047857` | `#6ee7b7` | 25–50% des Maximums |
| 3 | `#059669` | `#34d399` | 50–75% des Maximums |
| 4 | `#34d399` | `#10b981` | >75% des Maximums |

---

### 4.3 Achievements (`#achievements-list`)

Grid mit freigeschalteten und gesperrten Achievements.

#### Zustände

| Zustand | Darstellung |
|---------|-------------|
| Freigeschaltet | Emoji sichtbar, grüner Rahmen |
| Gesperrt | 🔒, grau hinterlegt |

Siehe auch: [05-Features.md](./05-Features.md#6-achievements-system) für vollständige Achievement-Liste.

---

### 4.4 Wochenstatistik (`#weekly-bar-chart`)

Balkendiagramm für die aktuelle Woche (Montag bis Sonntag).

#### Statistik-Bereiche

| Element | ID | Beschreibung |
|---------|-----|--------------|
| Ø pro Tag | `#weekly-avg-day` | Durchschnittliche Lernzeit pro Tag |
| Ø pro Fach | `#weekly-avg-subject` | Durchschnittliche Zeit pro Fach |
| Produktivster Tag | `#weekly-most-productive` | Tag mit den meisten Stunden |
| Woche gesamt | `#weekly-total` | Summe aller Stunden der Woche |

---

## 5. Navigationssystem

### 5.1 Header (`<header>`)

#### Buttons

| Button | ID | Icon | Funktion |
|--------|-----|------|----------|
| Eintrag hinzufügen | `#btn-add` | `plus` | Öffnet Add-Entry-Overlay |
| Timer | `#btn-timer-toggle` | `play` | Öffnet Timer-Overlay |
| Theme | `#btn-theme` | `lightbulb` | Wechselt Theme |
| Menü | `#btn-menu` | `menu` | Öffnet Settings-Overlay |

### 5.2 Bottom Navigation (`<nav>`)

#### Buttons

| Button | Klasse | Icon | Ziel-View |
|--------|--------|------|-----------|
| Dashboard | `.nav-btn` | `gauge` | `#view-dashboard` |
| Einheiten | `.nav-btn` | `history` | `#view-einheiten` |
| Fächer | `.nav-btn` | `landmark` | `#view-faecher` |
| Kalender | `.nav-btn` | `calendar` | `#view-kalender` |
| Semester | `.nav-btn` | `graduation-cap` | `#view-semester` |

---

## 6. Theme-System

### 6.1 Modi

| Modus | Beschreibung | Aktivierung |
|-------|--------------|-------------|
| Dark | Dunkles Theme (Standard) | `#btn-theme` oder `#settings-theme-dark` |
| Light | Helles Theme | `#settings-theme-light` |
| Auto | Folgt Systemeinstellung | `#settings-theme-auto` |

### 6.2 CSS Custom Properties

#### Dunkelmodus (Standard)

```css
--color-bg: #0f0f11;
--color-surface: #1c1c1e;
--color-text: #ffffff;
--color-text-muted: #a1a1aa;
```

#### Hellmodus

```css
--color-bg: #f3f4f6;
--color-surface: #ffffff;
--color-text: #111827;
--color-text-muted: #6b7280;
```

---

## 7. Toast-Benachrichtigungen

### 7.1 Container (`#toast-container`)

| Property | Wert |
|----------|------|
| Position | `fixed; bottom: 24px; left: 50%;` |
| Stil | Pill-Form, Schatten |
| Animation | Slide-up mit Fade-In/Out |

### 7.2 Typen

| Typ | Klasse | Rahmenfarbe |
|-----|--------|-------------|
| Success | `.toast-success` | Links: 4px solid #22c55e |
| Error | `.toast-error` | Links: 4px solid #ef4444 |
| Info | Standard | Keine zusätzliche Rahmenfarbe |

### 7.3 API

```javascript
showToast(message, type = 'success')
```

Siehe auch: [06-API-Reference.md](./06-API-Reference.md) für vollständige API-Dokumentation.

---

## 8. Floating Action Button (FAB)

### 8.1 Element (`#fab-main`)

| Property | Wert |
|----------|------|
| Position | `fixed; bottom: 24px; right: 16px;` |
| Größe | 56×56px |
| Farbe | `--color-primary` |

### 8.2 Zustände

| Zustand | Icon | Animation |
|---------|------|-----------|
| Gestoppt | `plus` | Keine |
| Läuft | `pause` | Puls-Animation |

### 8.3 Interaktion

| Zustand | Klick-Aktion |
|---------|--------------|
| Läuft | Timer pausieren |
| Gestoppt | Timer-Overlay öffnen |

---

## 9. Weitere Komponenten

### 9.1 PWA Install Banner (`#pwa-install-banner`)

- Position: `fixed; bottom: 20px;`
- Erscheint nach 5 Sekunden, wenn PWA installierbar

### 9.2 Update Banner (`#update-banner`)

- Position: `fixed; bottom: 20px;`
- Erscheint bei Service-Worker-Updates

---

## 10. Utility-Funktionen

### 10.1 Overlay-Helfer

```javascript
openOverlay(id)   // Öffnet Overlay
closeOverlay(id)  // Schließt Overlay
```

### 10.2 Formatierung

```javascript
formatDuration(seconds)    // "Xh Ym" oder "Ym"
formatDateShort(dateStr)  // "DD.MM.YYYY"
```

### 10.3 Datenverarbeitung

```javascript
calculateStreak(entries)      // Berechnet aktuelle Lern-Serie
getHeatmapLevel(seconds, max) // Level 0-4 für Heatmap
getWeekNumber(date)           // ISO 8601 Kalenderwoche
```

Siehe auch: [06-API-Reference.md](./06-API-Reference.md) für vollständige API-Referenz.

---

*Siehe auch: [01-Architecture.md](./01-Architecture.md) | [05-Features.md](./05-Features.md) | [06-API-Reference.md](./06-API-Reference.md)*
