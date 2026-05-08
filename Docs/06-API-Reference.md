# API-Referenz

> **Hinweis:** Diese Dokumentation ist Teil der [Projektdokumentation](./README.md).
> Siehe auch: [03-Data-Models.md](./03-Data-Models.md) für Datenstrukturen.

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
9. [Themen-Management](#themen-management)
10. [Globale Variablen](#globale-variablen)
11. [Datenstrukturen](#datenstrukturen)

---

## 1. window.storageManager

Objekt zur Verwaltung aller Daten in localStorage.

### 1.1 STORAGE_KEYS

```javascript
{
    ENTRIES: 'lernzeit_entries',
    SUBJECTS: 'lernzeit_subjects',
    SETTINGS: 'lernzeit_settings',
    SEMESTERS: 'lernzeit_semesters'
}
```

---

### 1.2 getEntries()

Gibt alle Lernzeit-Einträge aus dem Storage zurück.

**Rückgabe:** `Array<Object>` — Array von Entry-Objekten

```javascript
const entries = window.storageManager.getEntries();
// Ergebnis: [{ id: '123', subjectId: '1', duration: 3600, ... }, ...]
```

---

### 1.3 addEntry(entry)

Fügt einen neuen Lernzeit-Eintrag hinzu.

**Parameter:**

| Name | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| `entry.subjectId` | `string` | ✓ | ID des Fachs |
| `entry.duration` | `number` | ✓ | Dauer in Sekunden |
| `entry.startTime` | `number` | ✓ | Startzeit als Unix-Timestamp (ms) |
| `entry.endTime` | `number` | ✓ | Endzeit als Unix-Timestamp (ms) |
| `entry.notes` | `string` | ✗ | Notizen zum Eintrag |
| `entry.topics` | `string` | ✗ | Themen, kommagetrennt |

**Beispiel:**

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

### 1.4 updateEntry(updatedEntry)

Aktualisiert einen bestehenden Eintrag.

**Parameter:**

| Name | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| `updatedEntry.id` | `string \| number` | ✓ | ID des Eintrags |

**Beispiel:**

```javascript
window.storageManager.updateEntry({
    id: '123',
    duration: 7200,
    notes: 'Neue Notizen'
});
```

---

### 1.5 deleteEntry(id)

Löscht einen Eintrag anhand seiner ID.

**Parameter:**

| Name | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| `id` | `string \| number` | ✓ | ID des Eintrags |

---

### 1.6 getSubjects()

Gibt alle Fächer zurück.

**Rückgabe:** `Array<Object>` — Array von Subject-Objekten

---

### 1.7 addSubject(subject)

Fügt ein neues Fach hinzu.

**Parameter:**

| Name | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| `subject.name` | `string` | ✓ | Name des Fachs |
| `subject.color` | `string` | ✓ | CSS-Klasse (z.B. `'bg-blue-500'`) |
| `subject.weeklyGoal` | `number` | ✗ | Wochenziel in Stunden |

---

### 1.8 updateSubject(updatedSubject)

Aktualisiert ein bestehendes Fach.

---

### 1.9 deleteSubject(id)

Löscht ein Fach. Verknüpfte Einträge behalten ihre Referenz, aber `subjectId` wird auf `null` gesetzt.

---

### 1.10 getSettings()

Gibt alle App-Einstellungen zurück.

**Rückgabe:**

```javascript
{
    darkMode: true,
    dailyGoal: 60,               // Minuten
    learningDays: 5,
    fontSize: 16,
    themeMode: 'dark',           // 'dark' | 'light' | 'auto'
    pomoWork: 25,
    pomoShortBreak: 5,
    pomoLongBreak: 15,
    pomoLongBreakInterval: 4,
    pomoAutoBreak: true,
    pomoAutoWork: false
}
```

---

### 1.11 updateSettings(newSettings)

Aktualisiert App-Einstellungen (partielle Updates erlaubt).

**Beispiel:**

```javascript
window.storageManager.updateSettings({
    dailyGoal: 90,
    themeMode: 'auto'
});
```

---

### 1.12 Semester-Methoden

| Methode | Beschreibung |
|---------|--------------|
| `getSemesters()` | Gibt alle Semester zurück |
| `addSemester(semester)` | Fügt neues Semester hinzu |
| `updateSemester(updatedSemester)` | Aktualisiert Semester |
| `deleteSemester(id)` | Löscht Semester und Module |
| `addModule(semesterId, module)` | Fügt Modul zu Semester hinzu |
| `updateModule(semesterId, updatedModule)` | Aktualisiert Modul |
| `deleteModule(semesterId, moduleId)` | Löscht Modul |

Siehe auch: [03-Data-Models.md](./03-Data-Models.md) für vollständige Datenmodell-Dokumentation.

---

## 2. Globale UI-Funktionen

### 2.1 showToast(message, type)

Zeigt eine temporäre Toast-Benachrichtigung an.

**Parameter:**

| Name | Typ | Standard | Beschreibung |
|------|-----|---------|--------------|
| `message` | `string` | — | Anzuzeigende Nachricht |
| `type` | `string` | `'success'` | `'success'` \| `'error'` \| `'info'` |

**Beispiel:**

```javascript
showToast('Eintrag gespeichert!', 'success');
showToast('Fehler aufgetreten', 'error');
```

---

### 2.2 openAddEntryOverlay(editEntryId?)

Öffnet den Overlay zum Hinzufügen/Bearbeiten eines Eintrags.

**Parameter:**

| Name | Typ | Beschreibung |
|------|-----|--------------|
| `editEntryId` | `string \| number` | ID des zu bearbeitenden Eintrags (optional) |

---

### 2.3 openAddSubjectOverlay(editSubjectId?)

Öffnet den Overlay zum Hinzufügen/Bearbeiten eines Fachs.

---

### 2.4 openOverlay(id) / closeOverlay(id)

Öffnet/schließt ein Overlay-Element anhand seiner ID.

---

### 2.5 updateSubjectSelects()

Aktualisiert alle Fach-Auswahlfelder im DOM.

---

## 3. Timer-Funktionen

### 3.1 initTimer()

Initialisiert den Timer und stellt vorherigen Zustand wieder her.

---

### 3.2 requestWakeLock()

Fordert Screen Wake Lock an, um den Bildschirm aktiv zu halten.

**Rückgabe:** `Promise<void>`

> **Hinweis:** Verwendet die [Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/WakeLock).

---

### 3.3 playBeep(freq?, duration?, count?)

Spielt akustische Signaltöne ab.

**Parameter:**

| Name | Standard | Beschreibung |
|------|---------|--------------|
| `freq` | `800` | Frequenz in Hz |
| `duration` | `200` | Dauer in Millisekunden |
| `count` | `2` | Anzahl der Wiederholungen |

**Beispiel:**

```javascript
playBeep(600, 300, 3);  // 600Hz, 300ms, 3 Mal
```

---

### 3.4 getPomodoroSettings()

Gibt die aktuellen Pomodoro-Einstellungen zurück.

**Rückgabe:**

```javascript
{
    work: 1500,              // 25 Minuten
    shortBreak: 300,         // 5 Minuten
    longBreak: 900,          // 15 Minuten
    longBreakInterval: 4,
    autoStartBreak: true,
    autoStartWork: false
}
```

Siehe auch: [02-Timer.md](./02-Timer.md) für vollständige Timer-Dokumentation.

---

## 4. Render-Funktionen

### 4.1 updateViews()

Aktualisiert alle Ansichten (Dashboard, Historie, Kalender, Fächer, Heatmap).

---

### 4.2 renderHistory(entries, subjects)

Rendert die Historien-Liste mit allen Einträgen, gruppiert nach Datum.

---

### 4.3 renderCalendar(entries)

Rendert die Kalender-Ansicht (Tages-, Wochen- oder Monatsansicht).

Die globale Variable `currentCalendarView` bestimmt die aktuelle Ansicht:

| Wert | Beschreibung |
|------|--------------|
| `'day'` | Tagesansicht |
| `'week'` | Wochenansicht |
| `'month'` | Monatsansicht |

---

### 4.4 renderFaecher(entries, subjects)

Rendert die Fächer-Übersicht mit Statistiken pro Fach.

---

### 4.5 renderHeatmap(entries)

Rendert die Aktivitäts-Heatmap (GitHub-Stil) der letzten 12 Wochen.

---

### 4.6 renderSemester(entries, subjects)

Rendert die Semester-Ansicht.

---

### 4.7 updateDashboard(entries)

Aktualisiert alle Dashboard-Widgets.

---

### 4.8 renderWeeklyStats(entries)

Rendert die Wochenstatistiken mit Balkendiagramm.

---

### 4.9 renderWeeklyComparison(entries)

Rendert den Wochenvergleich (diese Woche vs. letzte Woche).

---

### 4.10 renderAchievements(entries)

Rendert die Achievements-Liste mit Fortschrittsanzeigen.

---

### 4.11 renderTrends(entries)

Rendert die Trend-Analyse:

- **Beste Lernzeit:** Optimale Tageszeit
- **Ø Session-Dauer:** Mittlere Dauer einer Lernsession
- **Top-Lerntag:** Der produktivste Wochentag

---

## 5. Utility-Funktionen

### 5.1 formatDuration(seconds)

Formatiert Sekunden als lesbare Dauer.

**Beispiel:**

```javascript
formatDuration(3661);  // "1h 1m"
formatDuration(90);    // "1m"
```

---

### 5.2 formatDateShort(dateStr)

Formatiert ein Datum als deutsches Format (DD.MM.YYYY).

**Beispiel:**

```javascript
formatDateShort('2024-03-15');  // "15.03.2024"
```

---

### 5.3 escapeHtml(value)

Escapt HTML-Sonderzeichen zur sicheren DOM-Ausgabe (XSS-Schutz).

**Beispiel:**

```javascript
escapeHtml('<script>');  // "&lt;script&gt;"
```

---

### 5.4 calculateStreak(entries)

Berechnet die aktuelle Lern-Serie in Tagen.

**Beispiel:**

```javascript
calculateStreak(entries);  // 7 (7 Tage in Folge)
```

---

### 5.5 getTopicsForSubject(subjectId)

Gibt alle einzigartigen Themen für ein Fach zurück, sortiert nach Häufigkeit.

---

### 5.6 getTopTopicsForSubject(subjectId, limit?)

Gibt die meistgenutzten Themen für ein Fach zurück.

**Parameter:**

| Name | Standard | Beschreibung |
|------|---------|--------------|
| `limit` | `3` | Maximale Anzahl der Ergebnisse |

---

### 5.7 getWeekNumber(d)

Berechnet die ISO-Wochennummer.

**Rückgabe:** `{ year: number, week: number }`

**Beispiel:**

```javascript
getWeekNumber(new Date());  // { year: 2026, week: 19 }
```

---

### 5.8 getWeekStart(date)

Gibt den Montag (Wochenanfang) der Woche zurück.

---

### 5.9 getCurrentWeekRange()

Gibt den Datumsbereich (Montag bis Sonntag) der aktuellen Woche zurück.

---

### 5.10 getHeatmapLevel(seconds, maxSeconds)

Berechnet das Heatmap-Level (0–4).

| Level | Bedeutung |
|-------|----------|
| 0 | Keine Aktivität |
| 1 | <25% des Maximums |
| 2 | 25–50% |
| 3 | 50–75% |
| 4 | >75% |

---

## 6. Export-Funktionen

### 6.1 exportExamToICS(examDate, moduleName)

Exportiert einen Prüfungstermin als ICS-Datei.

**Beispiel:**

```javascript
exportExamToICS('2026-07-28', 'Höhere Mathematik 2');
// Erstellt: pruefung_Hoehere_Mathematik_2.ics
```

---

### 6.2 generateWeeklyPDFReport()

Generiert einen Wochenbericht als Textdatei.

---

## 7. Kalender & Aggregation

### 7.1 showSemesterDetail(semesterId)

Zeigt die Detailansicht eines Semesters an.

---

### 7.2 showSemesterList()

Kehrt zur Semester-Listenansicht zurück.

---

### 7.3 populateModuleSubjectSelect(selectedId?)

Füllt das Modul-Fach-Select-Dropdown mit aktuellen Fächern.

---

### 7.4 Semester-Modal-Funktionen

| Funktion | Beschreibung |
|---------|--------------|
| `openAddSemesterModal()` | Öffnet Modal für neues Semester |
| `openEditSemesterModal(semesterId)` | Öffnet Modal zum Bearbeiten |
| `saveSemester()` | Speichert Semester |
| `openAddModuleModal()` | Öffnet Modal für neues Modul |
| `openEditModuleModal(semesterId, moduleId)` | Öffnet Modal zum Bearbeiten |
| `saveModule()` | Speichert Modul |

---

## 8. Achievements-System

### 8.1 ACHIEVEMENT_DEFINITIONS

Konstante mit allen verfügbaren Achievement-Definitionen.

```javascript
[
    { id: 'first_timer', icon: '🏃', name: 'Erste Schritte', desc: 'Erste Lernsession' },
    { id: 'streak_7', icon: '🔥', name: '7-Tage-Streak', desc: '7 Tage hintereinander' },
    // ... weitere Achievements
]
```

---

### 8.2 getStoredAchievements()

Liest alle freigeschalteten Achievements aus dem localStorage.

**Rückgabe:** `Array<{ id: string, unlockedAt: string }>`

---

### 8.3 saveAchievements(achievements)

Speichert freigeschaltete Achievements im localStorage.

---

### 8.4 formatAchievementDate(dateString)

Formatiert das Freischaltungsdatum (TT.MM.YYYY).

---

### 8.5 getAchievementProgress(entries)

Berechnet den Fortschritt für alle Achievements.

**Rückgabe:** `{ [achievementId]: boolean }`

---

### 8.6 checkAchievements(entries, options?)

Prüft auf neu freigeschaltete Achievements und zeigt optional Toasts an.

**Parameter:**

| Name | Standard | Beschreibung |
|------|---------|--------------|
| `options.showToasts` | `false` | Ob Toasts angezeigt werden sollen |

---

## 9. Themen-Management

### 9.1 getTopicsForSubject(subjectId)

Sammelt alle einzigartigen Themen für ein bestimmtes Fach.

**Rückgabe:** `Array<string>` — sortiert nach Häufigkeit

---

### 9.2 getTopTopicsForSubject(subjectId, limit?)

Gibt die Top-N Themen für ein bestimmtes Fach zurück.

---

## 10. Globale Variablen

### 10.1 Timer-Status

| Variable | Typ | Beschreibung |
|----------|-----|--------------|
| `timerInterval` | `number \| null` | `setInterval`-Handle oder `null` |
| `timerSeconds` | `number` | Aktuelle Timer-Zeit in Sekunden |
| `isTimerRunning` | `boolean` | `true` wenn Timer aktiv |
| `timerStartTime` | `number \| null` | Start-Zeitstempel |
| `wakeLock` | `WakeLockSentinel \| null` | WakeLock-Handle |

---

### 10.2 Pomodoro-Status

| Variable | Typ | Beschreibung |
|----------|-----|--------------|
| `pomodoroMode` | `boolean` | `true` = Pomodoro-Modus |
| `pomodoroPhase` | `string` | `'work'` \| `'shortBreak'` \| `'longBreak'` |
| `pomodoroCount` | `number` | Anzahl abgeschlossener Pomodoros |
| `pomodoroCountdown` | `number` | Restzeit in Sekunden |
| `pomodoroWorkSeconds` | `number` | Akkumulierte Arbeitssekunden |

---

### 10.3 Kalender-Status

| Variable | Typ | Beschreibung |
|----------|-----|--------------|
| `currentCalendarView` | `string` | `'day'` \| `'week'` \| `'month'` |

---

### 10.4 Semester-Status

| Variable | Typ | Beschreibung |
|----------|-----|--------------|
| `_currentSemesterId` | `string \| number \| null` | Aktuell ausgewähltes Semester |
| `_editingSemesterId` | `string \| number \| null` | ID des bearbeiteten Semesters |
| `_editingModuleId` | `string \| number \| null` | ID des bearbeiteten Moduls |

---

## 11. Datenstrukturen

Siehe [03-Data-Models.md](./03-Data-Models.md) für vollständige Dokumentation:

- [Entry](./03-Data-Models.md#entry-modell-lernsitzung)
- [Subject](./03-Data-Models.md#subject-modell-fach)
- [Settings](./03-Data-Models.md#settings-modell-einstellungen)
- [Semester](./03-Data-Models.md#semester-modell)
- [Module](./03-Data-Models.md#module-modell)
- [Achievement](./03-Data-Models.md#timer-state-persistiert)

---

*Siehe auch: [01-Architecture.md](./01-Architecture.md) | [03-Data-Models.md](./03-Data-Models.md) | [04-UI-Views.md](./04-UI-Views.md)*
