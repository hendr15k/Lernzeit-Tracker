# UI-Views und Komponenten Dokumentation

## Übersicht

Der Lernzeit-Tracker ist eine progressive Web-App (PWA) zum Tracking von Lernzeiten. Die Anwendung verwendet ein Single-Page-Application-Design mit fünf Hauptansichten und mehreren Modal-Overlays. Das UI basiert auf Tailwind CSS mit CSS Custom Properties für das dynamische Theme-System.

---

## 1. Hauptansichten (Views)

### 1.1 Dashboard (`#view-dashboard`)

**Beschreibung:** Die Startseite der Anwendung zeigt eine Übersicht aller Lernstatistiken auf einen Blick.

**Enthaltene Widgets:**

| Widget | ID | Funktion |
|--------|-----|----------|
| Tagesziel-Ring | `#daily-goal-ring` | SVG-basierter Fortschrittsring mit animate SVG-Grafik |
| Wochenübersicht | `#dashboard-graph` | Balkendiagramm der letzten 7 Tage |
| Streak-Anzeige | `#dashboard-streak` | Anzahl Tage in Folge mit Lernaktivität |
| Gesamtzeit | `#dashboard-total` | Gesamte Lernzeit in Stunden |
| Heatmap | `#heatmap-grid` | 12-Wochen-Aktivitätsübersicht |
| Achievements | `#achievements-list` | Liste freigeschalteter Erfolge |
| Prüfungs-Countdown | `#exam-countdown-list` | Nächste Prüfungen mit Countdown |
| Statistik-Grid | div | Bester Tag, Ø pro Tag |
| Wochenstatistik | `#weekly-bar-chart` | Balkendiagramm Mo-So |
| Wochenvergleich | `#weekly-compare-list` | Vergleich mit Vorwoche nach Fach |
| Lern-Trends | diverse | Beste Zeit, Ø Sitzung, Trend |
| Fächer-Kacheln | `#dashboard-subject-tiles` | Fortschritt pro Fach |

---

### 1.2 Einheiten (`#view-einheiten`)

**Beschreibung:** Chronologische Liste aller Lernsessions mit Filter- und Suchfunktion.

**Elemente:**

| Element | ID | Beschreibung |
|---------|-----|--------------|
| Überschrift | — | `<h1 class="text-3xl font-bold">Einheiten</h1>` |
| Fach-Filter | `#history-filter-subject` | Dropdown zur Filterung nach Fach |
| Suchfeld | `#history-search-input` | Freitextsuche in Notizen/Fächern |
| Einheiten-Liste | `#einheiten-list` | Dynamisch gerenderte Einträge gruppiert nach Datum |

**Funktionalität:**
- Einträge werden nach Datum absteigend gruppiert
- Jeder Eintrag zeigt: Fach-Farbe, Fachname, Uhrzeit, Dauer in Minuten
- Bearbeiten/Löschen-Buttons pro Eintrag
- Themen werden als Badges angezeigt

---

### 1.3 Fächer (`#view-faecher`)

**Beschreibung:** Verwaltungsoberfläche für Lernfächer mit Statistiken pro Fach.

**Elemente:**

| Element | ID | Beschreibung |
|---------|-----|--------------|
| Überschrift | — | `<h1 class="text-3xl font-bold">Fächer</h1>` |
| Hinzufügen-Button | `#btn-add-subject` | Öffnet das Fach-Modal |
| Fächer-Liste | `#faecher-list` | Grid mit Fach-Karten |

**Fach-Karte (dynamisch generiert):**
- Farbiger Kreis mit ersten zwei Buchstaben
- Fachname und Gesamtlernzeit
- Top 3 Themen als Tags
- Bearbeiten/Löschen-Buttons

---

### 1.4 Kalender (`#view-kalender`)

**Beschreibung:** Aggregierte Zeitansicht mit Tag/Woche/Monat-Umschaltung.

**Elemente:**

| Element | ID | Beschreibung |
|---------|-----|--------------|
| Überschrift | — | `<h1 class="text-3xl font-bold">Kalender</h1>` |
| Tagesansicht-Button | `calendar-view-btn[data-view="day"]` | Zeigt Tage an |
| Wochensicht-Button | `calendar-view-btn[data-view="week"]` | Zeigt Kalenderwochen an |
| Monatssicht-Button | `calendar-view-btn[data-view="month"]` | Zeigt Monate an |
| Kalender-Liste | `#kalender-list` | Aggregierte Zeiteinträge |

**Kalender-Item (dynamisch):**
- Titel mit Datum/Woche/Monat
- Fortschrittsbalken zum Ziel
- Anzahl Einheiten
- Trophäe bei 100% Ziellerreichung

---

### 1.5 Semester (`#view-semester`)

**Beschreibung:** Verwaltung von Semesterplänen mit Modulen und Prüfungen.

**Ansichten:**

#### Liste-Ansicht (`#semester-list-view`)

| Element | ID | Beschreibung |
|---------|-----|--------------|
| Überschrift | — | `<h1 class="text-2xl font-bold">Semester</h1>` |
| Semester hinzufügen | `#btn-add-semester` | Button mit + Icon |
| Semester-Liste | `#semester-list` | Liste der Semester-Karten |
| Leerer Zustand | `#semester-empty-state` | Wird angezeigt wenn keine Semester |

**Semester-Karte (dynamisch):**
- Semester-Name
- Start → Enddatum
- Anzahl Tage
- Gesamt-ECTS, Stunden, Module
- Bearbeiten/Löschen-Buttons

#### Detail-Ansicht (`#semester-detail-view`)

| Element | ID | Beschreibung |
|---------|-----|--------------|
| Zurück-Button | `#btn-back-to-semesters` | Navigation zur Liste |
| Titel | `#semester-detail-title` | Semester-Name |
| Modul hinzufügen | `#btn-add-module` | Button mit + Icon |
| Statistik-Grid | `#semester-stats` | ECTS, Stunden, Module |
| Modul-Liste | `#module-list` | Liste der Module |
| Leerer Zustand | `#module-empty-state` | Wird angezeigt wenn keine Module |

**Modul-Karte (dynamisch):**
- Modulname und -code
- Fortschrittsbalken (wenn Fach zugeordnet)
- Spendierte/geschätzte Stunden
- Prüfungsbadge (nach Zeitraum)
- Noten-Badge
- Bearbeiten/Löschen-Buttons

---

## 2. Modal-Overlays

### 2.1 Timer-Overlay (`#timer-overlay`)

**Beschreibung:** Vollbild-Overlay für die Stoppuhr-Funktion mit Pomodoro-Support.

**Struktur:**

```
#timer-overlay
├── Header
│   ├── #btn-timer-close (Schließen)
│   ├── "Timer" Label
│   └── Maximize-Button
├── Content
│   ├── #timer-subject-select (Fach-Auswahl)
│   ├── #study-recommendation (Lerntipp)
│   ├── #timer-topics-input (Thema)
│   │   └── #timer-topics-datalist
│   ├── #timer-ring-bg + #timer-display (Timer-Anzeige)
│   │   └── #pomodoro-indicator (Pomodoro-Status)
│   ├── #btn-timer-notes-toggle + #timer-notes-collapsed (Notizen)
│   │   └── #timer-notes-input
│   └── #btn-pomodoro-toggle (Pomodoro-Modus)
├── Controls
│   ├── #btn-timer-start (Play)
│   ├── #btn-timer-pause (Pause)
│   └── #btn-timer-stop (Stop)
└── #btn-timer-save (Sitzung speichern)
```

**Timer-Zustände:**
- **Frei (Stoppuhr):** Zählt Sekunden, Minuten, Stunden hoch
- **Pomodoro:** Countdown mit Phasen (Arbeit/Kurze Pause/Lange Pause)

**Pomodoro-Phasen:**
- `pomodoroPhase = 'work'`: Arbeit (Standard 25 Min)
- `pomodoroPhase = 'shortBreak'`: Kurze Pause (Standard 5 Min)
- `pomodoroPhase = 'longBreak'`: Lange Pause (Standard 15 Min)

**Timer-Ring-Farben:**
- Arbeit: `border-green-500/30`
- Pause: `border-amber-500/30`

---

### 2.2 Eintrag hinzufügen (`#add-entry-overlay`)

**Beschreibung:** Modal zum manuellen Hinzufügen einer Lernsession.

**Felder:**

| Feld | ID | Typ |
|------|-----|-----|
| Fach | `#add-subject-select` | Select |
| Thema | `#add-topics-input` | Text mit Datalist |
| Datum | `#add-date-input` | Date |
| Uhrzeit | `#add-time-input` | Time |
| Dauer | `#add-duration-input` | Number |
| Quick-Duration | `.btn-quick-duration` | Buttons (15m, 30m, 45m, 60m) |
| Notizen | `#add-notes-input` | Textarea |

**Buttons:**
- `#btn-add-close` (Schließen)
- `#btn-add-save` (Speichern)

---

### 2.3 Fach hinzufügen/bearbeiten (`#add-subject-overlay`)

**Beschreibung:** Modal zur Erstellung und Bearbeitung von Fächern.

**Felder:**

| Feld | ID | Typ |
|------|-----|-----|
| Name | `#add-subject-name` | Text |
| Farbe | `#add-subject-color` | Select (11 Farben) |
| Wochenziel | `#add-subject-weekly-goal` | Number (Stunden) |

**Buttons:**
- `#btn-add-subject-close` (Schließen)
- `#btn-add-subject-save` (Speichern)

**Verfügbare Farben:**
`bg-red-500`, `bg-orange-500`, `bg-yellow-500`, `bg-green-500`, `bg-teal-500`, `bg-blue-500`, `bg-indigo-500`, `bg-purple-500`, `bg-pink-500`, `bg-gray-500`

---

### 2.4 Einstellungen (`#settings-overlay`)

**Beschreibung:** Umfassende Einstellungsverwaltung mit mehreren Abschnitten.

**Abschnitte:**

#### Allgemein

| Einstellung | ID | Typ | Standard |
|-------------|-----|-----|----------|
| Tägliches Ziel | `#settings-daily-goal` | Number (Min) | 60 |
| Lern-Tage/Woche | `#settings-learning-days` | Number | 5 |
| Schriftgröße | `#settings-font-size` | Range (12-24) | 16 |

#### Design

| Option | ID | Funktion |
|--------|-----|----------|
| Hell | `#settings-theme-light` | Wechselt zu hellem Theme |
| Dunkel | `#settings-theme-dark` | Wechselt zu dunklem Theme |
| Auto | `#settings-theme-auto` | Folgt Systemeinstellung |

#### Pomodoro

| Einstellung | ID | Standard |
|-------------|-----|----------|
| Arbeitszeit | `#settings-pomo-work` | 25 Min |
| Kurze Pause | `#settings-pomo-short` | 5 Min |
| Lange Pause | `#settings-pomo-long` | 15 Min |
| Lange Pause alle X | `#settings-pomo-interval` | 4 |
| Auto Pause | `#settings-pomo-auto-break` | Checkbox |
| Auto Arbeit | `#settings-pomo-auto-work` | Checkbox |

#### Datenverwaltung

| Button | ID | Funktion |
|--------|-----|----------|
| Backup (JSON) | `#btn-settings-export` | Exportiert alle Daten als JSON |
| Importieren | `#btn-settings-import-trigger` | Importiert JSON-Backup |
| CSV | `#btn-settings-export-csv` | Exportiert Einträge als CSV |
| Wochen-PDF | `#btn-settings-export-pdf` | Generiert Wochenbericht |
| Hidden Input | `#settings-import-input` | Datei-Upload |

#### Gefahrenzone

| Button | ID | Funktion |
|--------|-----|----------|
| Alle Daten löschen | `#btn-settings-reset` | Löscht alle lokalen Daten |

---

### 2.5 Semester hinzufügen/bearbeiten (`#add-semester-overlay`)

**Beschreibung:** Modal zur Semesterverwaltung.

**Felder:**

| Feld | ID | Typ |
|------|-----|-----|
| Name | `#add-semester-name` | Text |
| Startdatum | `#add-semester-start` | Date |
| Enddatum | `#add-semester-end` | Date |

**Buttons:**
- `#btn-add-semester-close` (Schließen)
- `#btn-add-semester-save` (Speichern)
- `#btn-delete-semester` (Löschen, nur im Bearbeiten-Modus)

---

### 2.6 Modul hinzufügen/bearbeiten (`#add-module-overlay`)

**Beschreibung:** Modal zur Modulverwaltung innerhalb eines Semesters.

**Felder:**

| Feld | ID | Typ |
|------|-----|-----|
| Modulname | `#add-module-name` | Text |
| Fach | `#add-module-subject` | Select |
| Modulcode | `#add-module-code` | Text |
| ECTS | `#add-module-ects` | Number |
| Geschätzte Stunden | `#add-module-hours` | Number |
| Prüfungsphase | `#add-module-exam-period` | Select |
| Prüfungsdatum | `#add-module-exam-date` | Date |
| Note | `#add-module-grade` | Select |
| Notizen | `#add-module-notes` | Textarea |

**Prüfungsperioden:**
- `2026-03-30`: Mär/Apr 2026 (30.03.–02.04.)
- `2026-07-14`: Jul 2026 (14.07.–31.07.)
- `2026-09-21`: Sep 2026 (21.09.–02.10.)
- `2027-02-01`: Jan/Feb 2027 (01.02.–19.02.)

**Buttons:**
- `#btn-add-module-close` (Schließen)
- `#btn-add-module-save` (Speichern)
- `#btn-delete-module` (Löschen, nur im Bearbeiten-Modus)

---

## 3. Dashboard-Widgets

### 3.1 Tagesziel-Ring (`#daily-goal-ring`)

**Beschreibung:** SVG-basierter Ringdiagramm zur Visualisierung des Tagesziels.

**SVG-Elemente:**
- `#daily-goal-progress`: Fortschrittsbogen (stroke-dashoffset Animation)
- `#daily-goal-time`: Zentrierter Text mit aktueller Zeit
- `#daily-goal-label`: Tagesziel-Beschriftung
- `#daily-goal-fire`: Feuer-Emoji bei Zielerreichung

**Berechnung:**
```javascript
pct = min(todaySeconds / dailyGoalSeconds, 1)
offset = circumference * (1 - pct)
```

---

### 3.2 Heatmap (`#heatmap-grid`)

**Beschreibung:** GitHub-style Aktivitätsübersicht der letzten 12 Wochen.

**Struktur:**
- 12 Spalten (Wochen)
- 7 Zeilen (Tage, Mo-So)
- Zellen: 14x14px mit 3px Gap

**Level-Farben (Dunkelmodus):**
| Level | Dunkel | Hell | Bedeutung |
|-------|--------|------|-----------|
| 0 | Surface | #e5e7eb | Keine Aktivität |
| 1 | #064e3b | #a7f3d0 | < 25% des Maximums |
| 2 | #047857 | #6ee7b7 | 25-50% |
| 3 | #059669 | #34d399 | 50-75% |
| 4 | #34d399 | #10b981 | > 75% |

**Interaktion:**
- Hover: Tooltip mit Datum und Zeit
- Skalierung bei Hover: `transform: scale(1.2)`

---

### 3.3 Achievements (`#achievements-list`)

**Beschreibung:** Grid mit freigeschalteten und gesperrten Achievements.

**Verfügbare Achievements:**

| ID | Icon | Name | Bedingung |
|----|------|------|-----------|
| first_timer | 🏃 | Erste Schritte | Erste Lernsession |
| streak_7 | 🔥 | 7-Tage-Streak | 7 Tage hintereinander |
| hours_10 | ⏰ | Stunden-Jäger | 10 Stunden gesamt |
| hours_50 | 💪 | Halbzeit | 50 Stunden gesamt |
| hours_100 | 📚 | 100-Stunden-Krieger | 100 Stunden gesamt |
| pomodoro_1 | 🍅 | Pomodoro-Anfänger | Erste Pomodoro-Session |
| pomodoro_10 | 🍅 | Pomodoro-Meister | 10 Pomodoro-Sessions |
| weekly_goal | 📅 | Wochenziel erreicht | Tagesziel × 5 pro Woche |
| monthly_goal | 🎯 | Monatsziel erreicht | Tagesziel × 20 pro Monat |
| early_bird | 🌅 | Früher Vogel | Vor 8 Uhr gelernt |
| night_owl | 🦉 | Nachteule | Nach 22 Uhr gelernt |
| marathon | 🏃 | Marathon | 3h am Stück |
| all_subjects | 🎓 | Allrounder | Alle Fächer an einem Tag |
| perfect_week | ⭐ | Perfekte Woche | 7 Tage hintereinander |
| consistency_30 | 📈 | Beständigkeit | 30-Tage Streak |
| first_hour | ⏱️ | Erste Stunde | Erste 60 Minuten |

**Zustände:**
- Freigeschaltet: Emoji sichtbar, grüner Rahmen
- Gesperrt: 🔒, grau, "Noch gesperrt"

---

### 3.4 Wochenstatistik (`#weekly-bar-chart`)

**Beschreibung:** Balkendiagramm für aktuelle Woche (Mo-So).

**Elemente:**
- 7 Balken mit gleicher Breite
- Höhe proportional zur Lernzeit
- Tooltip bei Hover
- Labels: Mo, Di, Mi, Do, Fr, Sa, So

**Statistiken:**
| Element | ID | Beschreibung |
|---------|-----|--------------|
| Zeitraum | `#weekly-range-label` | KW-Format |
| Ø pro Tag | `#weekly-avg-day` | Durchschnitt |
| Ø pro Fach | `#weekly-avg-subject` | Durchschnitt |
| Produktivster Tag | `#weekly-most-productive` | Tag mit meisten Stunden |
| Woche gesamt | `#weekly-total` | Summe der Woche |

---

### 3.5 Trends (`#trends-period`)

**Beschreibung:** Analyse der persönlichen Lernmuster.

**Metriken:**

| Metrik | ID | Berechnung |
|--------|-----|-----------|
| Beste Zeit | `#trend-best-time` | 2-Stunden-Fenster mit meisten Stunden |
| Ø Sitzung | `#trend-avg-session` | Durchschnittliche Sessiondauer |
| Trend | `#trend-direction` | Prozentuale Änderung vs. Vorwoche |
| Top Tag | `#trend-top-day` | Wochentag mit meisten Stunden |

---

### 3.6 Prüfungs-Countdown (`#exam-countdown-list`)

**Beschreibung:** Liste der nächsten Prüfungen mit Countdown.

**Element-Struktur:**
```
Modul-Item
├── Farbiger Kreis (Fach)
├── Modulname + Datum + ECTS
├── Kalender-Export-Button
└── Countdown-Badge
```

**Dringlichkeitsfarben:**
| Tage bis Prüfung | Badge-Farbe | Rahmenfarbe |
|-------------------|-------------|-------------|
| ≤ 14 | gelb | gelb |
| ≤ 60 | blau | blau |
| > 60 | grau | grau |

**Funktionen:**
- `exportExamToICS()`: Exportiert .ics-Datei zum Kalender

---

## 4. Navigationssystem

### 4.1 Header (`<header>`)

**Buttons:**

| Button | ID | Icon | Funktion |
|--------|-----|------|----------|
| Home | — | `home` | Navigation (optional) |
| Eintrag hinzufügen | `#btn-add` | `plus` | Öffnet Add-Entry-Overlay |
| Timer | `#btn-timer-toggle` | `play` | Öffnet Timer-Overlay |
| Theme | `#btn-theme` | `lightbulb` | Wechselt Theme (Dunkel→Hell→Auto) |
| Menü | `#btn-menu` | `menu` | Öffnet Settings-Overlay |

---

### 4.2 Bottom Navigation (`<nav>`)

**Buttons:**

| Button | Klasse | Icon | Ziel |
|--------|--------|------|------|
| Dashboard | `.nav-btn` | `gauge` | `#view-dashboard` |
| Einheiten | `.nav-btn` | `history` | `#view-einheiten` |
| Fächer | `.nav-btn` | `landmark` | `#view-faecher` |
| Kalender | `.nav-btn` | `calendar` | `#view-kalender` |
| Semester | `.nav-btn` | `graduation-cap` | `#view-semester` |

**Aktiver Zustand:**
- Klasse: `active`
- Farbe: `text-primary` (CSS Variable)

---

## 5. Theme-System

### 5.1 Modi

| Modus | Beschreibung | Toggle-Position |
|-------|--------------|-----------------|
| Dark | Dunkles Theme (Standard) | `#btn-theme` oder `#settings-theme-dark` |
| Light | Helles Theme | `#settings-theme-light` |
| Auto | Folgt Systemeinstellung | `#settings-theme-auto` |

### 5.2 CSS Custom Properties

**Dunkelmodus (Standard):**
```css
--color-bg: #0f0f11;
--color-surface: #1c1c1e;
--color-text: #ffffff;
--color-text-muted: #a1a1aa;
--timer-overlay-bg: radial-gradient(circle at top, #1e3a8a 0%, #0f0f11 60%);
```

**Hellmodus:**
```css
--color-bg: #f3f4f6;
--color-surface: #ffffff;
--color-text: #111827;
--color-text-muted: #6b7280;
--timer-overlay-bg: radial-gradient(circle at top, #bfdbfe 0%, #f3f4f6 60%);
```

### 5.3 Umschaltung

```javascript
applyTheme(isDark) {
    if (isDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}
```

---

## 6. Toast-Benachrichtigungen

### 6.1 Container (`#toast-container`)

**CSS:** `css/toast.css:1-44`

**Position:** `position: fixed; bottom: 24px; left: 50%;`

**Stil:**
- Pill-Form: `border-radius: 99px`
- Schatten: `box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3)`
- Animation: Slide-up mit opacity fade

### 6.2 Typen

| Typ | Klasse | Rahmenfarbe |
|-----|--------|-------------|
| Success | `.toast-success` | Links: 4px solid #22c55e |
| Error | `.toast-error` | Links: 4px solid #ef4444 |
| Info | Standard | Keine额外边框 |

### 6.3 Anzeige

**Dauer:** 3000ms (3 Sekunden)

**API:**
```javascript
showToast(message, type = 'success')
```

---

## 7. Floating Action Button (FAB)

### 7.1 Element (`#fab-main`)

**Position:** `fixed; bottom: 24; right: 4;`

**Größe:** 56x56px (w-14 h-14)

**Farbe:** `--color-primary` (#3b82f6)

**Schatten:** `box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4)`

### 7.2 Zustände

| Zustand | Icon | Animation |
|---------|------|-----------|
| Gestoppt | `plus` | Keine |
| Läuft | `pause` | Puls-Animation |

### 7.3 Puls-Animation

```css
@keyframes fab-pulse {
    0%   { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
    70%  { box-shadow: 0 0 0 12px rgba(59, 130, 246, 0); }
    100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
}
```

**Interaktion:**
- Klick bei läuft: Timer pausieren
- Klick bei gestoppt: Timer-Overlay öffnen

---

## 8. Weitere Komponenten

### 8.1 PWA Install Banner (`#pwa-install-banner`)

**Position:** `fixed; bottom: 20; left: 4; right: 4;`

**Anzeige:** Nach 5 Sekunden wenn PWA installierbar

**Buttons:**
- `#pwa-install-btn`: Installiert PWA
- `#pwa-dismiss-btn`: Schließt Banner (speichert in localStorage)

### 8.2 Update Banner (`#update-banner`)

**Position:** `fixed; bottom: 20;`

**Anzeige:** Bei Service-Worker Update

**Verhalten:** Automatische Reload nach 2 Sekunden

---

## 9. Utility-Funktionen

### 9.1 Overlay-Helfer

```javascript
openOverlay(id)    // Entfernt translate-y-full Klasse
closeOverlay(id)   // Fügt translate-y-full Klasse hinzu
```

### 9.2 Formatierung

```javascript
formatDuration(seconds)  // "Xh Ym" oder "Ym"
formatDateShort(dateStr) // "DD.MM.YYYY"
formatAchievementDate()  // "DD.MM.YYYY"
```

### 9.3 Datenverarbeitung

```javascript
calculateStreak(entries)      // Berechnet Lern-Streak
getHeatmapLevel(seconds, max) // 0-4 für Heatmap-Level
getWeekNumber(date)           // ISO 8601 Kalenderwoche
```
