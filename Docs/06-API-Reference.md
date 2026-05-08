# API-Referenz

Vollständige Referenz aller globalen Funktionen im Lernzeit-Tracker.

---

## Inhaltsverzeichnis

1. [window.storageManager](#windowstoragemanager)
2. [Globale UI-Funktionen](#globale-ui-funktionen)
3. [Timer-Funktionen](#timer-funktionen)
4. [Render-Funktionen](#render-funktionen)
5. [Utility-Funktionen](#utility-funktionen)
6. [Export-Funktionen](#export-funktionen)
7. [Kalender & Aggregation](#kalender--aggregation)
8. [Achievements-System](#achievements-system)

---

## window.storageManager

Objekt zur Verwaltung aller Daten in localStorage.

### STORAGE_KEYS

```javascript
{
    ENTRIES: 'lernzeit_entries',
    SUBJECTS: 'lernzeit_subjects',
    SETTINGS: 'lernzeit_settings',
    SEMESTERS: 'lernzeit_semesters'
}
```

### getEntries()

**Beschreibung:** Gibt alle Lernzeit-Einträge zurück.

**Rückgabe:** `Array<Object>` - Array von Entry-Objekten

```javascript
const entries = window.storageManager.getEntries();
// [{ id: '123', subjectId: '1', duration: 3600, startTime: 1234567890, ... }]
```

---

### addEntry(entry)

**Beschreibung:** Fügt einen neuen Lernzeit-Eintrag hinzu.

**Parameter:**
- `entry` (Object): Entry-Daten
  - `subjectId` (string) - ID des Fachs
  - `duration` (number) - Dauer in Sekunden
  - `startTime` (number) - Startzeit als Unix-Timestamp
  - `endTime` (number) - Endzeit als Unix-Timestamp
  - `notes` (string, optional) - Notizen
  - `topics` (string, optional) - Themen (kommagetrennt)

**Rückgabe:** `void`

```javascript
window.storageManager.addEntry({
    subjectId: '1',
    duration: 3600,
    startTime: Date.now() - 3600000,
    endTime: Date.now(),
    notes: 'Kapitel 5 bearbeitet',
    topics: 'Integralrechnung, Differenziation'
});
```

---

### updateEntry(updatedEntry)

**Beschreibung:** Aktualisiert einen bestehenden Eintrag.

**Parameter:**
- `updatedEntry` (Object): Aktualisierte Entry-Daten mit `id`

**Rückgabe:** `void`

```javascript
window.storageManager.updateEntry({
    id: '123',
    duration: 7200,
    notes: 'Neue Notizen'
});
```

---

### deleteEntry(id)

**Beschreibung:** Löscht einen Eintrag anhand der ID.

**Parameter:**
- `id` (string|number) - ID des zu löschenden Eintrags

**Rückgabe:** `void`

```javascript
window.storageManager.deleteEntry('123');
```

---

### getSubjects()

**Beschreibung:** Gibt alle Fächer zurück.

**Rückgabe:** `Array<Object>` - Array von Subject-Objekten

```javascript
const subjects = window.storageManager.getSubjects();
// [{ id: '1', name: 'Mathe', color: 'bg-blue-500', weeklyGoal: 6 }, ...]
```

---

### addSubject(subject)

**Beschreibung:** Fügt ein neues Fach hinzu.

**Parameter:**
- `subject` (Object): Fach-Daten
  - `name` (string) - Name des Fachs
  - `color` (string) - CSS-Klasse für Farbe (z.B. 'bg-blue-500')
  - `weeklyGoal` (number, optional) - Wochenziel in Stunden

**Rückgabe:** `void`

```javascript
window.storageManager.addSubject({
    name: 'Physik',
    color: 'bg-purple-500',
    weeklyGoal: 8
});
```

---

### updateSubject(updatedSubject)

**Beschreibung:** Aktualisiert ein bestehendes Fach.

**Parameter:**
- `updatedSubject` (Object): Aktualisierte Fach-Daten mit `id`

**Rückgabe:** `void`

```javascript
window.storageManager.updateSubject({
    id: '1',
    name: 'Höhere Mathematik 2',
    color: 'bg-blue-600'
});
```

---

### deleteSubject(id)

**Beschreibung:** Löscht ein Fach. Verknüpfte Module behalten ihre Referenz, aber `subjectId` wird auf `null` gesetzt.

**Parameter:**
- `id` (string|number) - ID des zu löschenden Fachs

**Rückgabe:** `void`

```javascript
window.storageManager.deleteSubject('1');
```

---

### getSettings()

**Beschreibung:** Gibt alle App-Einstellungen zurück.

**Rückgabe:** `Object` - Einstellungsobjekt

```javascript
const settings = window.storageManager.getSettings();
// {
//   darkMode: true,
//   dailyGoal: 60,        // Minuten
//   learningDays: 5,
//   fontSize: 16,
//   themeMode: 'dark',    // 'dark' | 'light' | 'auto'
//   pomoWork: 25,         // Pomodoro: Arbeitszeit in Minuten
//   pomoShortBreak: 5,   // Pomodoro: Kurze Pause in Minuten
//   pomoLongBreak: 15,   // Pomodoro: Lange Pause in Minuten
//   pomoLongBreakInterval: 4,
//   pomoAutoBreak: true,
//   pomoAutoWork: false
// }
```

---

### updateSettings(newSettings)

**Beschreibung:** Aktualisiert App-Einstellungen.

**Parameter:**
- `newSettings` (Object): Einstellungen zum Aktualisieren (partielle Updates erlaubt)

**Rückgabe:** `void`

```javascript
window.storageManager.updateSettings({
    dailyGoal: 90,
    themeMode: 'auto'
});
```

---

### Semester-Methoden

#### getSemesters()

**Beschreibung:** Gibt alle Semester zurück.

**Rückgabe:** `Array<Object>`

```javascript
const semesters = window.storageManager.getSemesters();
```

---

#### addSemester(semester)

**Beschreibung:** Fügt ein neues Semester hinzu.

**Parameter:**
- `semester` (Object)
  - `name` (string)
  - `start` (string, ISO-Datum)
  - `end` (string, ISO-Datum)

---

#### updateSemester(updatedSemester)

**Beschreibung:** Aktualisiert ein Semester.

---

#### deleteSemester(id)

**Beschreibung:** Löscht ein Semester und alle zugehörigen Module.

---

#### addModule(semesterId, module)

**Beschreibung:** Fügt ein Modul zu einem Semester hinzu.

**Parameter:**
- `semesterId` (string)
- `module` (Object)
  - `name` (string)
  - `subjectId` (string, optional)
  - `code` (string, optional)
  - `ects` (number)
  - `hours` (number)
  - `examPeriod` (string, optional)
  - `examDate` (string, optional)
  - `grade` (string, optional)
  - `notes` (string, optional)

---

#### updateModule(semesterId, updatedModule)

**Beschreibung:** Aktualisiert ein Modul.

---

#### deleteModule(semesterId, moduleId)

**Beschreibung:** Löscht ein Modul.

---

## Globale UI-Funktionen

### showToast(message, type)

**Beschreibung:** Zeigt eine Toast-Benachrichtigung an.

**Parameter:**
- `message` (string) - Anzuzeigende Nachricht
- `type` (string, optional) - Toast-Typ: `'success'` (Standard), `'error'`, `'info'`

**Rückgabe:** `void`

```javascript
showToast('Eintrag gespeichert!', 'success');
showToast('Fehler aufgetreten', 'error');
showToast('Info-Nachricht', 'info');
```

---

### openAddEntryOverlay(editEntryId?)

**Beschreibung:** Öffnet den Overlay zum Hinzufügen/Bearbeiten eines Eintrags.

**Parameter:**
- `editEntryId` (string|number, optional) - ID des zu bearbeitenden Eintrags. Wenn nicht angegeben, wird ein neuer Eintrag erstellt.

**Rückgabe:** `void`

```javascript
window.openAddEntryOverlay(); // Neuer Eintrag
window.openAddEntryOverlay('123'); // Eintrag bearbeiten
```

---

### openAddSubjectOverlay(editSubjectId?)

**Beschreibung:** Öffnet den Overlay zum Hinzufügen/Bearbeiten eines Fachs.

**Parameter:**
- `editSubjectId` (string|number, optional) - ID des zu bearbeitenden Fachs

**Rückgabe:** `void`

```javascript
window.openAddSubjectOverlay(); // Neues Fach
window.openAddSubjectOverlay('1'); // Fach bearbeiten
```

---

### openOverlay(id)

**Beschreibung:** Öffnet ein Overlay-Element anhand seiner ID.

**Parameter:**
- `id` (string) - ID des Overlay-Elements (ohne '#')

**Rückgabe:** `void`

```javascript
openOverlay('add-semester-overlay');
```

---

### closeOverlay(id)

**Beschreibung:** Schließt ein Overlay-Element anhand seiner ID.

**Parameter:**
- `id` (string) - ID des Overlay-Elements (ohne '#')

**Rückgabe:** `void`

```javascript
closeOverlay('add-semester-overlay');
```

---

### updateSubjectSelects()

**Beschreibung:** Aktualisiert alle Fach-Auswahlfelder (Selects) im DOM mit aktuellen Fächern.

**Rückgabe:** `void`

```javascript
updateSubjectSelects();
```

---

## Timer-Funktionen

### initTimer()

**Beschreibung:** Initialisiert den Timer mit allen Event-Listenern und Zustandswiederherstellung.

**Rückgabe:** `void`

```javascript
initTimer();
```

---

### requestWakeLock()

**Beschreibung:** Fordert einen Screen Wake Lock an, um zu verhindern, dass der Bildschirm in den Ruhezustand geht, während der Timer läuft.

**Rückgabe:** `Promise<void>`

```javascript
await requestWakeLock();
```

**Hinweis:** Verwendet die Wake Lock API (`navigator.wakeLock`). Funktioniert nur in unterstützten Browsern.

---

### playBeep(freq, duration, count)

**Beschreibung:** Spielt einen akustischen Signalton ab (für Pomodoro-Benachrichtigungen).

**Parameter:**
- `freq` (number, optional) - Frequenz in Hz (Standard: 800)
- `duration` (number, optional) - Dauer in Millisekunden (Standard: 200)
- `count` (number, optional) - Anzahl der Wiederholungen (Standard: 2)

**Rückgabe:** `void`

```javascript
playBeep(600, 300, 3); // 600Hz, 300ms, 3 Mal
playBeep(); // Standard: 800Hz, 200ms, 2 Mal
```

---

### getPomodoroSettings()

**Beschreibung:** Gibt die aktuellen Pomodoro-Einstellungen zurück.

**Rückgabe:** `Object`

```javascript
const pomo = getPomodoroSettings();
// {
//   work: 1500,           // Sekunden (25 min)
//   shortBreak: 300,     // Sekunden (5 min)
//   longBreak: 900,      // Sekunden (15 min)
//   longBreakInterval: 4,
//   autoStartBreak: true,
//   autoStartWork: false
// }
```

---

## Render-Funktionen

### updateViews()

**Beschreibung:** Aktualisiert alle Ansichten (Dashboard, Historie, Kalender, Fächer, Heatmap).

**Rückgabe:** `void`

```javascript
updateViews();
```

---

### renderHistory(entries, subjects)

**Beschreibung:** Rendert die Historien-Liste mit allen Einträgen, gruppiert nach Datum.

**Parameter:**
- `entries` (Array) - Array von Entry-Objekten
- `subjects` (Array) - Array von Subject-Objekten

**Rückgabe:** `void`

```javascript
const entries = window.storageManager.getEntries();
const subjects = window.storageManager.getSubjects();
renderHistory(entries, subjects);
```

---

### renderCalendar(entries)

**Beschreibung:** Rendert die Kalender-Ansicht (Tages-/Wochen-/Monatsansicht).

**Parameter:**
- `entries` (Array) - Array von Entry-Objekten

**Rückgabe:** `void`

**Verwendet:** `currentCalendarView` (global) für die Ansicht:
- `'day'` - Tagesansicht
- `'week'` - Wochenansicht (KW)
- `'month'` - Monatsansicht

---

### renderFaecher(entries, subjects)

**Beschreibung:** Rendert die Fächer-Liste mit Statistiken.

**Parameter:**
- `entries` (Array) - Array von Entry-Objekten
- `subjects` (Array) - Array von Subject-Objekten

**Rückgabe:** `void`

---

### renderHeatmap(entries)

**Beschreibung:** Rendert die Aktivitäts-Heatmap (GitHub-Stil) der letzten 12 Wochen.

**Parameter:**
- `entries` (Array) - Array von Entry-Objekten

**Rückgabe:** `void`

---

### renderSemester(entries, subjects)

**Beschreibung:** Rendert die Semester-Ansicht (ruft `renderSemesterList` auf).

**Parameter:**
- `entries` (Array) - Array von Entry-Objekten
- `subjects` (Array) - Array von Subject-Objekten

---

### renderSemesterList()

**Beschreibung:** Rendert die Liste aller Semester.

**Rückgabe:** `void`

---

### renderModuleList(semesterId)

**Beschreibung:** Rendert die Modul-Liste eines Semesters.

**Parameter:**
- `semesterId` (string) - ID des Semesters

---

### renderTopicBadges(topics)

**Beschreibung:** Generiert HTML für Themen-Badges.

**Parameter:**
- `topics` (string) - Kommagetrennte Themenliste

**Rückgabe:** `string` - HTML-String mit Badge-Elementen

```javascript
const html = renderTopicBadges('Mathe, Physik, Chemie');
// <span class="...">Mathe</span><span class="...">Physik</span>...
```

---

### updateDashboard(entries)

**Beschreibung:** Aktualisiert alle Dashboard-Widgets (Streak, Gesamtdauer, Statistiken, Graphen).

**Parameter:**
- `entries` (Array) - Array von Entry-Objekten

---

### renderWeeklyStats(entries)

**Beschreibung:** Rendert die Wochenstatistiken mit Balkendiagramm (letzte Woche, Montag-Sonntag).

**Parameter:**
- `entries` (Array) - Array von Entry-Objekten

---

### renderWeeklyComparison(entries)

**Beschreibung:** Rendert den Wochenvergleich (diese Woche vs. letzte Woche) nach Fach.

**Parameter:**
- `entries` (Array) - Array von Entry-Objekten

---

### renderDashboardSubjects(entries)

**Beschreibung:** Rendert die Fach-Kacheln auf dem Dashboard mit Fortschrittsbalken.

**Parameter:**
- `entries` (Array) - Array von Entry-Objekten

---

### updateDailyGoalRing(entries)

**Beschreibung:** Aktualisiert den Tagesziel-Ring mit aktuellem Fortschritt.

**Parameter:**
- `entries` (Array) - Array von Entry-Objekten

---

### renderGraph(entries)

**Beschreibung:** Rendert den 7-Tage-Balkengraph auf dem Dashboard.

**Parameter:**
- `entries` (Array) - Array von Entry-Objekten

---

### updateWeeklyComparison(entries)

**Beschreibung:** Aktualisiert das Wochenvergleichs-Badge auf dem Dashboard.

**Parameter:**
- `entries` (Array) - Array von Entry-Objekten

---

### renderExamCountdown()

**Beschreibung:** Rendert die Prüfungs-Countdown-Liste.

---

### updateStudyRecommendation()

**Beschreibung:** Berechnet und zeigt eine Lernempfehlung basierend auf Prüfungsterminen und Lernfortschritt.

---

### renderAchievements(entries)

**Beschreibung:** Rendert die Achievements-Liste.

**Parameter:**
- `entries` (Array) - Array von Entry-Objekten

---

### renderTrends(entries)

**Beschreibung:** Rendert die Trend-Analyse (beste Lernzeit, durchschnittliche Session, Top-Tag).

**Parameter:**
- `entries` (Array) - Array von Entry-Objekten

---

## Utility-Funktionen

### formatDuration(seconds)

**Beschreibung:** Formatiert eine Sekundenanzahl als lesbare Dauer.

**Parameter:**
- `seconds` (number) - Dauer in Sekunden

**Rückgabe:** `string`

```javascript
formatDuration(3661); // "1h 1m"
formatDuration(90);   // "1m"
```

---

### formatDateShort(dateStr)

**Beschreibung:** Formatiert ein Datum als kurzes deutsches Format (DD.MM.YYYY).

**Parameter:**
- `dateStr` (string) - Datumsstring (ISO oder anderes von `new Date()` akzeptiertes Format)

**Rückgabe:** `string`

```javascript
formatDateShort('2024-03-15'); // "15.03.2024"
formatDateShort(new Date());    // "08.05.2026"
```

---

### escapeHtml(value)

**Beschreibung:** Escaped HTML-Sonderzeichen zur sicheren Ausgabe im DOM.

**Parameter:**
- `value` (any) - Zu escapender Wert

**Rückgabe:** `string`

```javascript
escapeHtml('<script>alert("xss")</script>'); // "&lt;script&gt;..."
escapeHtml('Mathe & Physik'); // "Mathe &amp; Physik"
```

---

### calculateStreak(entries)

**Beschreibung:** Berechnet die aktuelle Lern-Serie (Streak) in Tagen.

**Parameter:**
- `entries` (Array) - Array von Entry-Objekten

**Rückgabe:** `number` - Anzahl der aufeinanderfolgenden Tage

```javascript
calculateStreak(entries); // 7
```

**Logik:**
- Zählt rückwärts vom heutigen (oder gestern, falls heute noch nicht gelernt)
- Ein Tag zählt, wenn mindestens ein Eintrag existiert
- Unterbricht die Serie, wenn ein Tag ohne Einträge existiert

---

### getTopicsForSubject(subjectId)

**Beschreibung:** Gibt alle einzigartigen Themen für ein Fach zurück, sortiert nach Häufigkeit.

**Parameter:**
- `subjectId` (string) - ID des Fachs

**Rückgabe:** `Array<string>` - Array von Themen

---

### getTopTopicsForSubject(subjectId, limit?)

**Beschreibung:** Gibt die meistgenutzten Themen für ein Fach zurück.

**Parameter:**
- `subjectId` (string) - ID des Fachs
- `limit` (number, optional) - Maximale Anzahl (Standard: 3)

**Rückgabe:** `Array<string>`

---

### getWeekNumber(d)

**Beschreibung:** Berechnet die ISO-Wochennummer eines Datums.

**Parameter:**
- `d` (Date) - Datumsobjekt

**Rückgabe:** `Object` mit `year` und `week`

```javascript
getWeekNumber(new Date()); // { year: 2026, week: 19 }
```

---

### getWeekStart(date)

**Beschreibung:** Gibt den Montag einer Woche zurück.

**Parameter:**
- `date` (Date) - Beliebiges Datum in der Woche

**Rückgabe:** `Date` - Montag der Woche (00:00:00)

---

### getCurrentWeekRange()

**Beschreibung:** Gibt den Datumsbereich der aktuellen Woche zurück.

**Rückgabe:** `Object` mit `start` (Montag) und `end` (Sonntag 23:59:59)

---

### getCurrentMonthRange()

**Beschreibung:** Gibt den Datumsbereich des aktuellen Monats zurück.

**Rückgabe:** `Object` mit `start` (1. des Monats) und `end` (Letzter Tag, 23:59:59)

---

### getExamBadge(examPeriod, examDate)

**Beschreibung:** Generiert Badge-Informationen für Prüfungen.

**Parameter:**
- `examPeriod` (string) - Prüfungszeitraum
- `examDate` (string, optional) - Konkretes Prüfungsdatum

**Rückgabe:** `Object|null`

```javascript
getExamBadge('2026-07-14', '2026-07-28');
// { text: '28.07.26', bgClass: 'bg-red-900/40 text-red-300' }
```

---

### getGradeBadgeClass(grade)

**Beschreibung:** Gibt die CSS-Klasse für eine Noten-Badge zurück.

**Parameter:**
- `grade` (string|number) - Note

**Rückgabe:** `string` - CSS-Klassenstring

---

### getHeatmapLevel(seconds, maxSeconds)

**Beschreibung:** Berechnet das Heatmap-Level (0-4) basierend auf der Lernzeit.

**Parameter:**
- `seconds` (number) - Lernzeit in Sekunden
- `maxSeconds` (number) - Maximale Lernzeit für volle Intensität

**Rückgabe:** `number` - Level 0-4

---

## Export-Funktionen

### exportExamToICS(examDate, moduleName)

**Beschreibung:** Exportiert einen Prüfungstermin als ICS-Datei zum Import in Kalender-Apps.

**Parameter:**
- `examDate` (string) - Prüfungsdatum (ISO-Format)
- `moduleName` (string) - Name des Moduls

**Rückgabe:** `void`

```javascript
exportExamToICS('2026-07-28', 'Höhere Mathematik 2');
// Erstellt: pruefung_Hoehere_Mathematik_2.ics
```

---

### generateWeeklyPDFReport()

**Beschreibung:** Generiert einen Wochenbericht als Textdatei (ersetzt echte PDF-Funktionalität).

**Rückgabe:** `void`

**Inhalt:**
- Zeitraum (KW)
- Zusammenfassung (Gesamtzeit, Anzahl Sessions)
- Tägliche Übersicht
- Statistik nach Fach

```javascript
generateWeeklyPDFReport();
// Erstellt: lernzeit_kw19_bericht.txt
```

---

## Kalender & Aggregation

### showSemesterDetail(semesterId)

**Beschreibung:** Zeigt die Detailansicht eines Semesters mit Modul-Liste.

**Parameter:**
- `semesterId` (string) - ID des Semesters

---

### showSemesterList()

**Beschreibung:** Kehrt zur Semester-Listenansicht zurück.

---

### populateModuleSubjectSelect(selectedId?)

**Beschreibung:** Füllt das Modul-Fach-Select mit aktuellen Fächern.

**Parameter:**
- `selectedId` (string, optional) - Vorher ausgewählte ID

---

### openAddSemesterModal()

**Beschreibung:** Öffnet den Modal zum Hinzufügen eines Semesters.

---

### openEditSemesterModal(semesterId)

**Beschreibung:** Öffnet den Modal zum Bearbeiten eines Semesters.

**Parameter:**
- `semesterId` (string) - ID des Semesters

---

### saveSemester()

**Beschreibung:** Speichert ein Semester (neu oder aktualisiert).

---

### openAddModuleModal()

**Beschreibung:** Öffnet den Modal zum Hinzufügen eines Moduls.

---

### openEditModuleModal(semesterId, moduleId)

**Beschreibung:** Öffnet den Modal zum Bearbeiten eines Moduls.

**Parameter:**
- `semesterId` (string)
- `moduleId` (string)

---

### saveModule()

**Beschreibung:** Speichert ein Modul (neu oder aktualisiert).

---

## Achievements-System

### ACHIEVEMENT_DEFINITIONS

**Beschreibung:** Konstante mit allen Achievement-Definitionen.

**Typ:** `Array<Object>`

```javascript
[
    { id: 'first_timer', icon: '🏃', name: 'Erste Schritte', desc: 'Erste Lernsession' },
    { id: 'streak_7', icon: '🔥', name: '7-Tage-Streak', desc: '7 Tage hintereinander' },
    // ... weitere Achievements
]
```

---

### getStoredAchievements()

**Beschreibung:** Liest gespeicherte Achievements aus localStorage.

**Rückgabe:** `Array<Object>`

---

### saveAchievements(achievements)

**Beschreibung:** Speichert Achievements in localStorage.

**Parameter:**
- `achievements` (Array) - Array von Achievement-Objekten

---

### formatAchievementDate(dateString)

**Beschreibung:** Formatiert das Freischaltungsdatum eines Achievements.

**Parameter:**
- `dateString` (string) - ISO-Datumstring

**Rückgabe:** `string` - Deutsches Datumsformat (TT.MM.YYYY)

---

### getAchievementProgress(entries)

**Beschreibung:** Berechnet den Fortschritt für alle Achievements.

**Parameter:**
- `entries` (Array) - Array von Entry-Objekten

**Rückgabe:** `Object` - Map von Achievement-IDs zu Boolean

```javascript
getAchievementProgress(entries);
// { first_timer: true, streak_7: false, hours_10: true, ... }
```

---

### checkAchievements(entries, options?)

**Beschreibung:** Prüft auf neue Achievements und zeigt ggf. Toasts an.

**Parameter:**
- `entries` (Array) - Array von Entry-Objekten
- `options` (Object, optional)
  - `showToasts` (boolean) - Toasts anzeigen (Standard: false)

**Rückgabe:** `Array<Object>` - Alle freigeschalteten Achievements

---

## Themen-Management

### getTopicsForSubject(subjectId)

**Beschreibung:** Sammelt alle Themen für ein bestimmtes Fach aus den Einträgen.

**Parameter:**
- `subjectId` (string) - ID des Fachs

**Rückgabe:** `Array<string>` - Sortiert nach Häufigkeit

```javascript
const topics = getTopicsForSubject('1');
// ['Integralrechnung', 'Differenziation', 'Matrizen']
```

---

### getTopTopicsForSubject(subjectId, limit?)

**Beschreibung:** Gibt die Top-N Themen für ein Fach zurück.

**Parameter:**
- `subjectId` (string) - ID des Fachs
- `limit` (number, optional) - Anzahl (Standard: 3)

**Rückgabe:** `Array<string>`

---

## Globale Variablen

### Timer-Status

```javascript
let timerInterval      // Aktuelles setInterval-Handle oder null
let timerSeconds       // Aktuelle Timer-Zeit in Sekunden
let isTimerRunning     // true wenn Timer aktiv
let timerStartTime     // Start-Zeitstempel für Timer-Berechnung
let wakeLock           // WakeLock-Handle
```

### Pomodoro-Status

```javascript
let pomodoroMode          // true = Pomodoro, false = Frei (Stoppuhr)
let pomodoroPhase         // 'work' | 'shortBreak' | 'longBreak'
let pomodoroCount         // Anzahl abgeschlossener Pomodoros
let pomodoroCountdown     // Restzeit in Sekunden
let pomodoroWorkSeconds   // Akkumulierte Arbeitssekunden
```

### Kalender-Status

```javascript
let currentCalendarView   // 'day' | 'week' | 'month'
```

### Semester-Status

```javascript
let _currentSemesterId    // Aktuell ausgewähltes Semester
let _editingSemesterId    // ID des bearbeiteten Semesters
let _editingModuleId      // ID des bearbeiteten Moduls
```

---

## Datenstrukturen

### Entry (Lernzeit-Eintrag)

```javascript
{
    id: string,
    subjectId: string,
    duration: number,       // Sekunden
    startTime: number,     // Unix-Timestamp
    endTime: number,       // Unix-Timestamp
    notes: string,          // Optional
    topics: string          // Optional, kommagetrennt
}
```

### Subject (Fach)

```javascript
{
    id: string,
    name: string,
    color: string,          // Tailwind-Klasse, z.B. 'bg-blue-500'
    weeklyGoal: number     // Wochenziel in Stunden (optional)
}
```

### Semester

```javascript
{
    id: string,
    name: string,
    start: string,          // ISO-Datum
    end: string,            // ISO-Datum
    modules: Array<Module>
}
```

### Module

```javascript
{
    id: string,
    name: string,
    subjectId: string,      // Optional
    code: string,            // Optional
    ects: number,
    hours: number,          // Geschätzte Lernstunden
    examPeriod: string,     // Optional, ISO-Datum
    examDate: string,       // Optional, ISO-Datum
    grade: string,          // Optional
    notes: string           // Optional
}
```

### Achievement

```javascript
{
    id: string,
    unlockedAt: string      // ISO-Datum
}
```
