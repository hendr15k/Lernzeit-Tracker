# UI-Views und Komponenten Dokumentation

## Übersicht

Der Lernzeit-Tracker ist eine progressive Web-App (PWA) zum Tracking von Lernzeiten. Die Anwendung verwendet ein Single-Page-Application-Design mit fünf Hauptansichten und mehreren Modal-Overlays. Das UI basiert auf Tailwind CSS mit CSS Custom Properties für das dynamische Theme-System.

---

## 1. Hauptansichten (Views)

### 1.1 Dashboard (`#view-dashboard`)

**Beschreibung:** Die Startseite der Anwendung zeigt eine Übersicht aller Lernstatistiken auf einen Blick. Die Ansicht ist in mehrere Widget-Bereiche unterteilt, die kontinuierlich aktualisiert werden.

**Enthaltene Widgets:**

| Widget | ID | Funktion |
|--------|-----|----------|
| Tagesziel-Ring | `#daily-goal-ring` | SVG-basierter Fortschrittsring mit animierter SVG-Grafik |
| Wochenübersicht | `#dashboard-graph` | Balkendiagramm der letzten 7 Tage |
| Streak-Anzeige | `#dashboard-streak` | Anzahl Tage in Folge mit Lernaktivität |
| Gesamtzeit | `#dashboard-total` | Gesamte Lernzeit in Stunden |
| Heatmap | `#heatmap-grid` | 12-Wochen-Aktivitätsübersicht |
| Achievements | `#achievements-list` | Liste freigeschalteter Erfolge |
| Prüfungs-Countdown | `#exam-countdown-list` | Nächste Prüfungen mit Countdown |
| Statistik-Grid | `div` | Bester Tag, Ø pro Tag |
| Wochenstatistik | `#weekly-bar-chart` | Balkendiagramm Mo–So |
| Wochenvergleich | `#weekly-compare-list` | Vergleich mit Vorwoche nach Fach |
| Lern-Trends | diverse | Beste Zeit, Ø Sitzung, Trend |
| Fächer-Kacheln | `#dashboard-subject-tiles` | Fortschritt pro Fach |

---

### 1.2 Einheiten (`#view-einheiten`)

**Beschreibung:** Chronologische Liste aller Lernsessions mit Filter- und Suchfunktion. Diese Ansicht dient als Verlauf, um vergangene Sessions einzusehen und zu bearbeiten.

**Elemente:**

| Element | ID | Beschreibung |
|---------|-----|--------------|
| Überschrift | — | `<h1 class="text-3xl font-bold">Einheiten</h1>` |
| Fach-Filter | `#history-filter-subject` | Dropdown zur Filterung nach Fach |
| Suchfeld | `#history-search-input` | Freitextsuche in Notizen und Fächern |
| Einheiten-Liste | `#einheiten-list` | Dynamisch gerenderte Einträge, gruppiert nach Datum |

**Funktionalität:**

- Einträge werden nach Datum absteigend gruppiert
- Jeder Eintrag zeigt: Fach-Farbe, Fachname, Uhrzeit, Dauer in Minuten
- Bearbeiten- und Löschen-Buttons pro Eintrag
- Themen werden als Badges angezeigt

---

### 1.3 Fächer (`#view-faecher`)

**Beschreibung:** Verwaltungsoberfläche für Lernfächer mit Statistiken pro Fach. Hier können Fächer erstellt, bearbeitet und gelöscht werden.

**Elemente:**

| Element | ID | Beschreibung |
|---------|-----|--------------|
| Überschrift | — | `<h1 class="text-3xl font-bold">Fächer</h1>` |
| Hinzufügen-Button | `#btn-add-subject` | Öffnet das Fach-Modal |
| Fächer-Liste | `#faecher-list` | Grid mit Fach-Karten |

**Fach-Karte (dynamisch generiert):**

- Farbiger Kreis mit den ersten zwei Buchstaben des Fachnamens
- Fachname und Gesamtlernzeit
- Top 3 Themen als Tags
- Bearbeiten- und Löschen-Buttons

---

### 1.4 Kalender (`#view-kalender`)

**Beschreibung:** Aggregierte Zeitansicht mit Tag/Woche/Monat-Umschaltung. Diese Ansicht ermöglicht einen schnellen Überblick über die Lernzeit in verschiedenen Zeitrahmen.

**Elemente:**

| Element | ID | Beschreibung |
|---------|-----|--------------|
| Überschrift | — | `<h1 class="text-3xl font-bold">Kalender</h1>` |
| Tagesansicht-Button | `calendar-view-btn[data-view="day"]` | Zeigt einzelne Tage an |
| Wochensicht-Button | `calendar-view-btn[data-view="week"]` | Zeigt Kalenderwochen an |
| Monatssicht-Button | `calendar-view-btn[data-view="month"]` | Zeigt Monate an |
| Kalender-Liste | `#kalender-list` | Aggregierte Zeiteinträge |

**Kalender-Item (dynamisch):**

- Titel mit Datum, Woche oder Monat je nach Ansicht
- Fortschrittsbalken zum eingestellten Ziel
- Anzahl der Lernsessions im Zeitraum
- Trophäen-Badge bei 100% Ziellerreichung

---

### 1.5 Semester (`#view-semester`)

**Beschreibung:** Verwaltung von Semesterplänen mit Modulen und Prüfungen. Diese Ansicht bietet eine strukturierte Übersicht über akademische Zeiträume.

**Ansichten:**

#### 1.5.1 Liste-Ansicht (`#semester-list-view`)

| Element | ID | Beschreibung |
|---------|-----|--------------|
| Überschrift | — | `<h1 class="text-2xl font-bold">Semester</h1>` |
| Semester hinzufügen | `#btn-add-semester` | Button mit +-Icon |
| Semester-Liste | `#semester-list` | Liste der Semester-Karten |
| Leerer Zustand | `#semester-empty-state` | Wird angezeigt, wenn keine Semester vorhanden sind |

**Semester-Karte (dynamisch):**

- Semester-Name
- Start- und Enddatum
- Anzahl Tage
- Gesamt-ECTS, Stunden, Module
- Bearbeiten- und Löschen-Buttons

#### 1.5.2 Detail-Ansicht (`#semester-detail-view`)

| Element | ID | Beschreibung |
|---------|-----|--------------|
| Zurück-Button | `#btn-back-to-semesters` | Navigation zurück zur Liste |
| Titel | `#semester-detail-title` | Semester-Name |
| Modul hinzufügen | `#btn-add-module` | Button mit +-Icon |
| Statistik-Grid | `#semester-stats` | Übersicht: ECTS, Stunden, Module |
| Modul-Liste | `#module-list` | Liste der Module |
| Leerer Zustand | `#module-empty-state` | Wird angezeigt, wenn keine Module vorhanden sind |

**Modul-Karte (dynamisch):**

- Modulname und -code
- Fortschrittsbalken (wenn ein Fach zugeordnet ist)
- Spendierte/geschätzte Stunden
- Prüfungs-Badge (basierend auf Zeitraum)
- Noten-Badge
- Bearbeiten- und Löschen-Buttons

---

## 2. Modal-Overlays

### 2.1 Timer-Overlay (`#timer-overlay`)

**Beschreibung:** Vollbild-Overlay für die Stoppuhr-Funktion mit integriertem Pomodoro-Support. Der Timer kann flexibel als Stoppuhr oder als vordefinierter Pomodoro-Timer verwendet werden.

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
│   ├── #btn-timer-start (Start)
│   ├── #btn-timer-pause (Pause)
│   └── #btn-timer-stop (Stopp)
└── #btn-timer-save (Sitzung speichern)
```

**Timer-Modi:**

| Modus | Beschreibung |
|-------|--------------|
| Stoppuhr (frei) | Zählt Sekunden, Minuten und Stunden hoch |
| Pomodoro | Countdown-Timer mit konfigurierbaren Phasen |

**Pomodoro-Phasen:**

| Phase | Variable | Standarddauer |
|-------|----------|---------------|
| Arbeit | `pomodoroPhase = 'work'` | 25 Minuten |
| Kurze Pause | `pomodoroPhase = 'shortBreak'` | 5 Minuten |
| Lange Pause | `pomodoroPhase = 'longBreak'` | 15 Minuten |

**Timer-Ring-Farben:**

| Phase | Farbe |
|-------|-------|
| Arbeit | `border-green-500/30` |
| Pause | `border-amber-500/30` |

---

### 2.2 Eintrag hinzufügen (`#add-entry-overlay`)

**Beschreibung:** Modal zum manuellen Hinzufügen einer Lernsession. Ermöglicht das nachträgliche Erfassen von Sessions, die nicht mit dem Timer aufgezeichnet wurden.

**Felder:**

| Feld | ID | Typ | Beschreibung |
|------|-----|-----|--------------|
| Fach | `#add-subject-select` | Select | Auswahl des Lernfachs |
| Thema | `#add-topics-input` | Text mit Datalist | Themen/Tags der Session |
| Datum | `#add-date-input` | Date | Datum der Session |
| Uhrzeit | `#add-time-input` | Time | Startzeit der Session |
| Dauer | `#add-duration-input` | Number | Dauer in Minuten |
| Quick-Duration | `.btn-quick-duration` | Buttons | Schnellauswahl: 15m, 30m, 45m, 60m |
| Notizen | `#add-notes-input` | Textarea | Freitextnotizen |

**Buttons:**

| Button | ID | Funktion |
|--------|-----|----------|
| Schließen | `#btn-add-close` | Schließt das Modal |
| Speichern | `#btn-add-save` | Speichert den Eintrag |

---

### 2.3 Fach hinzufügen/bearbeiten (`#add-subject-overlay`)

**Beschreibung:** Modal zur Erstellung und Bearbeitung von Fächern. Jedes Fach hat eine eindeutige Farbe zur visuellen Unterscheidung.

**Felder:**

| Feld | ID | Typ | Beschreibung |
|------|-----|-----|--------------|
| Name | `#add-subject-name` | Text | Name des Fachs |
| Farbe | `#add-subject-color` | Select | Auswahl aus 10 Farben |
| Wochenziel | `#add-subject-weekly-goal` | Number | Ziel in Stunden pro Woche |

**Buttons:**

| Button | ID | Funktion |
|--------|-----|----------|
| Schließen | `#btn-add-subject-close` | Schließt das Modal |
| Speichern | `#btn-add-subject-save` | Speichert das Fach |

**Verfügbare Farben:**

`bg-red-500`, `bg-orange-500`, `bg-yellow-500`, `bg-green-500`, `bg-teal-500`, `bg-blue-500`, `bg-indigo-500`, `bg-purple-500`, `bg-pink-500`, `bg-gray-500`

---

### 2.4 Einstellungen (`#settings-overlay`)

**Beschreibung:** Umfassende Einstellungsverwaltung mit mehreren Abschnitten für Personalisierung und Datenverwaltung.

**Abschnitte:**

#### 2.4.1 Allgemein

| Einstellung | ID | Typ | Standardwert |
|-------------|-----|-----|--------------|
| Tägliches Ziel | `#settings-daily-goal` | Number (Minuten) | 60 |
| Lern-Tage/Woche | `#settings-learning-days` | Number | 5 |
| Schriftgröße | `#settings-font-size` | Range (12–24) | 16 |

#### 2.4.2 Design

| Option | ID | Beschreibung |
|--------|-----|--------------|
| Hell | `#settings-theme-light` | Wechselt zum hellen Theme |
| Dunkel | `#settings-theme-dark` | Wechselt zum dunklen Theme |
| Auto | `#settings-theme-auto` | Folgt der Systemeinstellung |

#### 2.4.3 Pomodoro

| Einstellung | ID | Standardwert |
|-------------|-----|--------------|
| Arbeitszeit | `#settings-pomo-work` | 25 Minuten |
| Kurze Pause | `#settings-pomo-short` | 5 Minuten |
| Lange Pause | `#settings-pomo-long` | 15 Minuten |
| Lange Pause alle X | `#settings-pomo-interval` | 4 |
| Auto Pause | `#settings-pomo-auto-break` | Checkbox |
| Auto Arbeit | `#settings-pomo-auto-work` | Checkbox |

#### 2.4.4 Datenverwaltung

| Button | ID | Funktion |
|--------|-----|----------|
| Backup (JSON) | `#btn-settings-export` | Exportiert alle Daten als JSON-Datei |
| Importieren | `#btn-settings-import-trigger` | Importiert ein JSON-Backup |
| CSV | `#btn-settings-export-csv` | Exportiert Einträge als CSV-Datei |
| Wochen-PDF | `#btn-settings-export-pdf` | Generiert einen Wochenbericht als PDF |
| Hidden Input | `#settings-import-input` | Versteckter Datei-Upload für Importe |

#### 2.4.5 Gefahrenzone

| Button | ID | Funktion |
|--------|-----|----------|
| Alle Daten löschen | `#btn-settings-reset` | Löscht alle lokalen Daten unwiderruflich |

---

### 2.5 Semester hinzufügen/bearbeiten (`#add-semester-overlay`)

**Beschreibung:** Modal zur Semesterverwaltung. Ein Semester definiert einen akademischen Zeitraum mit Start- und Enddatum.

**Felder:**

| Feld | ID | Typ | Beschreibung |
|------|-----|-----|--------------|
| Name | `#add-semester-name` | Text | Name des Semesters |
| Startdatum | `#add-semester-start` | Date | Beginn des Semesters |
| Enddatum | `#add-semester-end` | Date | Ende des Semesters |

**Buttons:**

| Button | ID | Funktion |
|--------|-----|----------|
| Schließen | `#btn-add-semester-close` | Schließt das Modal |
| Speichern | `#btn-add-semester-save` | Speichert das Semester |
| Löschen | `#btn-delete-semester` | Löscht das Semester (nur im Bearbeiten-Modus) |

---

### 2.6 Modul hinzufügen/bearbeiten (`#add-module-overlay`)

**Beschreibung:** Modal zur Modulverwaltung innerhalb eines Semesters. Module repräsentieren einzelne Kurse oder Prüfungen.

**Felder:**

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

**Buttons:**

| Button | ID | Funktion |
|--------|-----|----------|
| Schließen | `#btn-add-module-close` | Schließt das Modal |
| Speichern | `#btn-add-module-save` | Speichert das Modul |
| Löschen | `#btn-delete-module` | Löscht das Modul (nur im Bearbeiten-Modus) |

**Verfügbare Prüfungsperioden:**

| ID | Label | Zeitraum |
|----|-------|----------|
| `2026-03-30` | Mär/Apr 2026 | 30.03.–02.04.2026 |
| `2026-07-14` | Jul 2026 | 14.07.–31.07.2026 |
| `2026-09-21` | Sep 2026 | 21.09.–02.10.2026 |
| `2027-02-01` | Jan/Feb 2027 | 01.02.–19.02.2027 |

---

## 3. Dashboard-Widgets

### 3.1 Tagesziel-Ring (`#daily-goal-ring`)

**Beschreibung:** SVG-basierter Ringdiagramm zur Visualisierung des Tagesziels. Der Ring füllt sich proportional zur erreichten Lernzeit.

**SVG-Elemente:**

| Element | ID | Beschreibung |
|---------|-----|--------------|
| Fortschrittsbogen | `#daily-goal-progress` | Animierter Fortschrittsbogen (stroke-dashoffset) |
| Zeit-Anzeige | `#daily-goal-time` | Zentrierter Text mit aktueller Zeit |
| Beschriftung | `#daily-goal-label` | Tagesziel-Beschriftung |
| Feuer-Animation | `#daily-goal-fire` | Feuer-Animation bei Zielerreichung |

**Berechnung:**

```javascript
pct = min(todaySeconds / dailyGoalSeconds, 1)
offset = circumference * (1 - pct)
```

---

### 3.2 Heatmap (`#heatmap-grid`)

**Beschreibung:** GitHub-inspirierte Aktivitätsübersicht der letzten 12 Wochen. Bietet einen visuellen Überblick über die Lernaktivität über einen längeren Zeitraum.

**Struktur:**

- 12 Spalten (entspricht 12 Wochen)
- 7 Zeilen (Wochentage, Mo–So)
- Zellen: 14×14px mit 3px Abstand

**Level-Farben:**

| Level | Dunkelmodus | Hellmodus | Bedeutung |
|-------|-------------|-----------|-----------|
| 0 | Surface | `#e5e7eb` | Keine Aktivität |
| 1 | `#064e3b` | `#a7f3d0` | Weniger als 25% des Maximums |
| 2 | `#047857` | `#6ee7b7` | 25–50% des Maximums |
| 3 | `#059669` | `#34d399` | 50–75% des Maximums |
| 4 | `#34d399` | `#10b981` | Mehr als 75% des Maximums |

**Interaktion:**

- Hover: Zeigt Tooltip mit Datum und Lernzeit
- Skalierung bei Hover: `transform: scale(1.2)`

---

### 3.3 Achievements (`#achievements-list`)

**Beschreibung:** Grid mit freigeschalteten und gesperrten Achievements. Erfolge motivieren durch Gamification und Anerkennung von Meilensteinen.

**Verfügbare Achievements:**

| ID | Icon | Name | Freischaltbedingung |
|----|------|------|---------------------|
| first_timer | 🏃 | Erste Schritte | Erste Lernsession abgeschlossen |
| streak_7 | 🔥 | 7-Tage-Streak | 7 Tage hintereinander gelernt |
| hours_10 | ⏰ | Stunden-Jäger | 10 Stunden gesamt erreicht |
| hours_50 | 💪 | Halbzeit | 50 Stunden gesamt erreicht |
| hours_100 | 📚 | 100-Stunden-Krieger | 100 Stunden gesamt erreicht |
| pomodoro_1 | 🍅 | Pomodoro-Anfänger | Erste Pomodoro-Session abgeschlossen |
| pomodoro_10 | 🍅 | Pomodoro-Meister | 10 Pomodoro-Sessions abgeschlossen |
| weekly_goal | 📅 | Wochenziel erreicht | Tagesziel × 5 in einer Woche erreicht |
| monthly_goal | 🎯 | Monatsziel erreicht | Tagesziel × 20 in einem Monat erreicht |
| early_bird | 🌅 | Früher Vogel | Vor 8 Uhr morgens gelernt |
| night_owl | 🦉 | Nachteule | Nach 22 Uhr abends gelernt |
| marathon | 🏃 | Marathon | 3 Stunden am Stück gelernt |
| all_subjects | 🎓 | Allrounder | Alle Fächer an einem Tag |
| perfect_week | ⭐ | Perfekte Woche | 7 Tage hintereinander ohne Unterbrechung |
| consistency_30 | 📈 | Beständigkeit | 30-Tage-Streak erreicht |
| first_hour | ⏱️ | Erste Stunde | Erste 60 Minuten gesamt |

**Zustände:**

| Zustand | Darstellung |
|---------|-------------|
| Freigeschaltet | Emoji sichtbar, grüner Rahmen, Freischaltungsdatum |
| Gesperrt | 🔒, grau hinterlegt, "Noch gesperrt" |

---

### 3.4 Wochenstatistik (`#weekly-bar-chart`)

**Beschreibung:** Balkendiagramm für die aktuelle Woche (Montag bis Sonntag). Zeigt die tägliche Lernzeit als visuelle Balken.

**Struktur:**

- 7 Balken mit gleicher Breite
- Höhe proportional zur Lernzeit
- Tooltip bei Hover mit genauer Zeitangabe
- Wochentag-Labels: Mo, Di, Mi, Do, Fr, Sa, So

**Statistik-Bereiche:**

| Element | ID | Beschreibung |
|---------|-----|--------------|
| Zeitraum | `#weekly-range-label` | Kalenderwoche im Format "KW XX" |
| Ø pro Tag | `#weekly-avg-day` | Durchschnittliche Lernzeit pro Tag |
| Ø pro Fach | `#weekly-avg-subject` | Durchschnittliche Zeit pro Fach |
| Produktivster Tag | `#weekly-most-productive` | Tag mit den meisten Stunden |
| Woche gesamt | `#weekly-total` | Summe aller Stunden der Woche |

---

### 3.5 Trends (`#trends-period`)

**Beschreibung:** Analyse der persönlichen Lernmuster. Identifiziert optimale Lernzeiten und zeigt Trends über Zeit.

**Metriken:**

| Metrik | ID | Berechnung/Beschreibung |
|--------|-----|-------------------------|
| Beste Zeit | `#trend-best-time` | 2-Stunden-Fenster mit den meisten Stunden |
| Ø Sitzung | `#trend-avg-session` | Durchschnittliche Sitzungsdauer |
| Trend | `#trend-direction` | Prozentuale Änderung im Vergleich zur Vorwoche |
| Top Tag | `#trend-top-day` | Wochentag mit den meisten Stunden |

---

### 3.6 Prüfungs-Countdown (`#exam-countdown-list`)

**Beschreibung:** Liste der nächsten Prüfungen mit automatischer Countdown-Anzeige. Hilft bei der Priorisierung der Lernzeit.

**Element-Struktur:**

```
Modul-Item
├── Farbiger Kreis (Fach-Farbe)
├── Modulname, Datum und ECTS
├── Kalender-Export-Button
└── Countdown-Badge
```

**Dringlichkeitsfarben:**

| Tage bis Prüfung | Badge-Farbe | Rahmenfarbe |
|-------------------|-------------|-------------|
| 14 oder weniger | Gelb | Gelb |
| 60 oder weniger | Blau | Blau |
| Mehr als 60 | Grau | Grau |

**Funktionen:**

- `exportExamToICS()`: Exportiert Prüfungsdatum als .ics-Datei für Kalender-Import

---

## 4. Navigationssystem

### 4.1 Header (`<header>`)

**Buttons:**

| Button | ID | Icon | Funktion |
|--------|-----|------|----------|
| Home | — | `home` | Navigation zur Startseite (optional) |
| Eintrag hinzufügen | `#btn-add` | `plus` | Öffnet Add-Entry-Overlay |
| Timer | `#btn-timer-toggle` | `play` | Öffnet Timer-Overlay |
| Theme | `#btn-theme` | `lightbulb` | Wechselt Theme (Dunkel → Hell → Auto) |
| Menü | `#btn-menu` | `menu` | Öffnet Settings-Overlay |

---

### 4.2 Bottom Navigation (`<nav>`)

**Buttons:**

| Button | Klasse | Icon | Ziel-View |
|--------|--------|------|-----------|
| Dashboard | `.nav-btn` | `gauge` | `#view-dashboard` |
| Einheiten | `.nav-btn` | `history` | `#view-einheiten` |
| Fächer | `.nav-btn` | `landmark` | `#view-faecher` |
| Kalender | `.nav-btn` | `calendar` | `#view-kalender` |
| Semester | `.nav-btn` | `graduation-cap` | `#view-semester` |

**Aktiver Zustand:**

- Klasse: `active`
- Farbe: `text-primary` (definiert über CSS-Variable)

---

## 5. Theme-System

### 5.1 Modi

| Modus | Beschreibung | Aktivierung |
|-------|--------------|-------------|
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

### 5.3 Theme-Umschaltung

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

**Stylesheet:** `css/toast.css:1-44`

**Position:** `position: fixed; bottom: 24px; left: 50%;`

**Stil:**

- Pill-Form: `border-radius: 99px`
- Schatten: `box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3)`
- Animation: Slide-up mit Fade-In/Out

### 6.2 Typen

| Typ | Klasse | Rahmenfarbe |
|-----|--------|-------------|
| Success | `.toast-success` | Links: 4px solid #22c55e |
| Error | `.toast-error` | Links: 4px solid #ef4444 |
| Info | Standard | Keine zusätzliche Rahmenfarbe |

### 6.3 Anzeige

**Anzeigedauer:** 3000ms (3 Sekunden)

**API:**

```javascript
showToast(message, type = 'success')
```

---

## 7. Floating Action Button (FAB)

### 7.1 Element (`#fab-main`)

**Position:** `fixed; bottom: 24px; right: 16px;`

**Größe:** 56×56px (`w-14 h-14`)

**Farbe:** `--color-primary` (Standard: #3b82f6)

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

**Position:** `fixed; bottom: 20px; left: 16px; right: 16px;`

**Anzeige:** Erscheint nach 5 Sekunden, wenn PWA installierbar ist

**Buttons:**

| Button | ID | Funktion |
|--------|-----|----------|
| Installieren | `#pwa-install-btn` | Installiert die PWA |
| Schließen | `#pwa-dismiss-btn` | Schließt Banner (speichert Zustand in localStorage) |

### 8.2 Update Banner (`#update-banner`)

**Position:** `fixed; bottom: 20px;`

**Anzeige:** Erscheint bei Service-Worker-Updates

**Verhalten:** Automatischer Reload nach 2 Sekunden

---

## 9. Utility-Funktionen

### 9.1 Overlay-Helfer

```javascript
openOverlay(id)   // Entfernt die translate-y-full Klasse, zeigt Overlay
closeOverlay(id)  // Fügt die translate-y-full Klasse hinzu, versteckt Overlay
```

### 9.2 Formatierung

```javascript
formatDuration(seconds)    // Formatiert als "Xh Ym" oder "Ym"
formatDateShort(dateStr)  // Formatiert als "DD.MM.YYYY"
formatAchievementDate()    // Formatiert als "DD.MM.YYYY"
```

### 9.3 Datenverarbeitung

```javascript
calculateStreak(entries)      // Berechnet die aktuelle Lern-Serie
getHeatmapLevel(seconds, max)  // Gibt Level 0-4 für Heatmap-Farbe zurück
getWeekNumber(date)            // Berechnet ISO 8601 Kalenderwoche
```
