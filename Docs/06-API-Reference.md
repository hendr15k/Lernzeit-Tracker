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
9. [Themen-Management](#themen-management)
10. [Globale Variablen](#globale-variablen)
11. [Datenstrukturen](#datenstrukturen)

---

## window.storageManager

Objekt zur Verwaltung aller Daten in localStorage.

### STORAGE_KEYS

Vordefinierte Storage-Schlüssel:

| Schlüssel | Wert |
|-----------|------|
| ENTRIES | `lernzeit_entries` |
| SUBJECTS | `lernzeit_subjects` |
| SETTINGS | `lernzeit_settings` |
| SEMESTERS | `lernzeit_semesters` |

```javascript
{
    ENTRIES: 'lernzeit_entries',
    SUBJECTS: 'lernzeit_subjects',
    SETTINGS: 'lernzeit_settings',
    SEMESTERS: 'lernzeit_semesters'
}
```

---

### getEntries()

Gibt alle Lernzeit-Einträge aus dem Storage zurück.

**Rückgabe:** `Array<Object>` — Array von Entry-Objekten (siehe [Datenstrukturen](#datenstrukturen))

**Beispiel:**

```javascript
const entries = window.storageManager.getEntries();
// Ergebnis:
// [
//   { id: '123', subjectId: '1', duration: 3600, startTime: 1234567890000, ... },
//   { id: '124', subjectId: '2', duration: 1800, startTime: 1234571490000, ... }
// ]
```

---

### addEntry(entry)

Fügt einen neuen Lernzeit-Eintrag hinzu.

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `entry` | `Object` | ✓ | Entry-Daten |
| `entry.subjectId` | `string` | ✓ | ID des Fachs |
| `entry.duration` | `number` | ✓ | Dauer in Sekunden |
| `entry.startTime` | `number` | ✓ | Startzeit als Unix-Timestamp (Millisekunden) |
| `entry.endTime` | `number` | ✓ | Endzeit als Unix-Timestamp (Millisekunden) |
| `entry.notes` | `string` | — | Notizen zum Eintrag |
| `entry.topics` | `string` | — | Themen, kommagetrennt |

**Rückgabe:** `void`

**Beispiel:**

```javascript
window.storageManager.addEntry({
    subjectId: '1',
    duration: 3600,                    // 1 Stunde
    startTime: Date.now() - 3600000,  // Vor 1 Stunde
    endTime: Date.now(),
    notes: 'Kapitel 5 bearbeitet',
    topics: 'Integralrechnung, Differenziation'
});
```

---

### updateEntry(updatedEntry)

Aktualisiert einen bestehenden Eintrag.

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `updatedEntry` | `Object` | ✓ | Aktualisierte Entry-Daten |
| `updatedEntry.id` | `string \| number` | ✓ | ID des Eintrags |
| * | * | — | Alle weiteren Felder sind optional |

**Rückgabe:** `void`

**Beispiel:**

```javascript
window.storageManager.updateEntry({
    id: '123',
    duration: 7200,         // 2 Stunden
    notes: 'Neue Notizen'
});
```

---

### deleteEntry(id)

Löscht einen Eintrag anhand der ID.

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `id` | `string \| number` | ✓ | ID des zu löschenden Eintrags |

**Rückgabe:** `void`

**Beispiel:**

```javascript
window.storageManager.deleteEntry('123');
```

---

### getSubjects()

Gibt alle Fächer zurück.

**Rückgabe:** `Array<Object>` — Array von Subject-Objekten (siehe [Datenstrukturen](#datenstrukturen))

**Beispiel:**

```javascript
const subjects = window.storageManager.getSubjects();
// Ergebnis:
// [
//   { id: '1', name: 'Mathe', color: 'bg-blue-500', weeklyGoal: 6 },
//   { id: '2', name: 'Physik', color: 'bg-purple-500', weeklyGoal: 4 }
// ]
```

---

### addSubject(subject)

Fügt ein neues Fach hinzu.

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `subject` | `Object` | ✓ | Fach-Daten |
| `subject.name` | `string` | ✓ | Name des Fachs |
| `subject.color` | `string` | ✓ | CSS-Klasse für Farbe (z.B. `'bg-blue-500'`) |
| `subject.weeklyGoal` | `number` | — | Wochenziel in Stunden |

**Rückgabe:** `void`

**Beispiel:**

```javascript
window.storageManager.addSubject({
    name: 'Physik',
    color: 'bg-purple-500',
    weeklyGoal: 8
});
```

---

### updateSubject(updatedSubject)

Aktualisiert ein bestehendes Fach.

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `updatedSubject` | `Object` | ✓ | Aktualisierte Fach-Daten |
| `updatedSubject.id` | `string \| number` | ✓ | ID des Fachs |
| * | * | — | Alle weiteren Felder sind optional |

**Rückgabe:** `void`

**Beispiel:**

```javascript
window.storageManager.updateSubject({
    id: '1',
    name: 'Höhere Mathematik 2',
    color: 'bg-blue-600'
});
```

---

### deleteSubject(id)

Löscht ein Fach. Verknüpfte Einträge behalten ihre Referenz, aber `subjectId` wird auf `null` gesetzt.

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `id` | `string \| number` | ✓ | ID des zu löschenden Fachs |

**Rückgabe:** `void`

**Beispiel:**

```javascript
window.storageManager.deleteSubject('1');
```

---

### getSettings()

Gibt alle App-Einstellungen zurück.

**Rückgabe:** `Object` — Einstellungsobjekt

**Beispiel:**

```javascript
const settings = window.storageManager.getSettings();
// Ergebnis:
{
    darkMode: true,
    dailyGoal: 60,               // Minuten
    learningDays: 5,             // Anzahl Lerntage pro Woche
    fontSize: 16,                // Schriftgröße in px
    themeMode: 'dark',           // 'dark' | 'light' | 'auto'
    pomoWork: 25,                // Pomodoro: Arbeitszeit in Minuten
    pomoShortBreak: 5,           // Pomodoro: Kurze Pause in Minuten
    pomoLongBreak: 15,           // Pomodoro: Lange Pause in Minuten
    pomoLongBreakInterval: 4,    // Nach wie vielen Pomodoros eine lange Pause
    pomoAutoBreak: true,         // Automatischer Start der Pause
    pomoAutoWork: false          // Automatischer Start der Arbeit
}
```

---

### updateSettings(newSettings)

Aktualisiert App-Einstellungen (partielle Updates erlaubt).

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `newSettings` | `Object` | ✓ | Einstellungen zum Aktualisieren |
| * | * | — | BeliebigeSubset von Einstellungsfeldern |

**Rückgabe:** `void`

**Beispiel:**

```javascript
window.storageManager.updateSettings({
    dailyGoal: 90,
    themeMode: 'auto'
});
```

---

### Semester-Methoden

#### getSemesters()

Gibt alle Semester zurück.

**Rückgabe:** `Array<Object>` — Array von Semester-Objekten

**Beispiel:**

```javascript
const semesters = window.storageManager.getSemesters();
// Ergebnis:
// [
//   { id: '1', name: 'WS 2025', start: '2025-10-01', end: '2026-03-31', modules: [...] },
//   { id: '2', name: 'SS 2026', start: '2026-04-01', end: '2026-09-30', modules: [...] }
// ]
```

---

#### addSemester(semester)

Fügt ein neues Semester hinzu.

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `semester` | `Object` | ✓ | Semester-Daten |
| `semester.name` | `string` | ✓ | Name des Semesters |
| `semester.start` | `string` | ✓ | Startdatum (ISO-Format: `YYYY-MM-DD`) |
| `semester.end` | `string` | ✓ | Enddatum (ISO-Format: `YYYY-MM-DD`) |

**Rückgabe:** `void`

**Beispiel:**

```javascript
window.storageManager.addSemester({
    name: 'SS 2026',
    start: '2026-04-01',
    end: '2026-09-30'
});
```

---

#### updateSemester(updatedSemester)

Aktualisiert ein bestehendes Semester.

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `updatedSemester` | `Object` | ✓ | Aktualisierte Semester-Daten |
| `updatedSemester.id` | `string \| number` | ✓ | ID des Semesters |
| * | * | — | Alle weiteren Felder sind optional |

**Rückgabe:** `void`

**Beispiel:**

```javascript
window.storageManager.updateSemester({
    id: '1',
    name: 'WS 2025/26'
});
```

---

#### deleteSemester(id)

Löscht ein Semester und alle zugehörigen Module.

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `id` | `string \| number` | ✓ | ID des zu löschenden Semesters |

**Rückgabe:** `void`

**Beispiel:**

```javascript
window.storageManager.deleteSemester('1');
```

---

#### addModule(semesterId, module)

Fügt ein Modul zu einem Semester hinzu.

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `semesterId` | `string \| number` | ✓ | ID des Semesters |
| `module` | `Object` | ✓ | Modul-Daten |
| `module.name` | `string` | ✓ | Name des Moduls |
| `module.ects` | `number` | ✓ | ECTS-Punkte |
| `module.hours` | `number` | ✓ | Geschätzte Lernstunden |
| `module.subjectId` | `string` | — | Verknüpftes Fach |
| `module.code` | `string` | — | Modulkürzel (z.B. `MATH-101`) |
| `module.examPeriod` | `string` | — | Prüfungszeitraum (ISO-Datum) |
| `module.examDate` | `string` | — | Konkretes Prüfungsdatum (ISO-Datum) |
| `module.grade` | `string` | — | Erhaltene Note |
| `module.notes` | `string` | — | Notizen |

**Rückgabe:** `void`

**Beispiel:**

```javascript
window.storageManager.addModule('1', {
    name: 'Höhere Mathematik 2',
    subjectId: '1',
    code: 'MATH-102',
    ects: 8,
    hours: 120,
    examPeriod: '2026-07-14',
    examDate: '2026-07-28'
});
```

---

#### updateModule(semesterId, updatedModule)

Aktualisiert ein bestehendes Modul.

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `semesterId` | `string \| number` | ✓ | ID des Semesters |
| `updatedModule` | `Object` | ✓ | Aktualisierte Modul-Daten |
| `updatedModule.id` | `string \| number` | ✓ | ID des Moduls |
| * | * | — | Alle weiteren Felder sind optional |

**Rückgabe:** `void`

**Beispiel:**

```javascript
window.storageManager.updateModule('1', {
    id: 'mod-1',
    grade: '1.3'
});
```

---

#### deleteModule(semesterId, moduleId)

Löscht ein Modul aus einem Semester.

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `semesterId` | `string \| number` | ✓ | ID des Semesters |
| `moduleId` | `string \| number` | ✓ | ID des zu löschenden Moduls |

**Rückgabe:** `void`

**Beispiel:**

```javascript
window.storageManager.deleteModule('1', 'mod-1');
```

---

## Globale UI-Funktionen

### showToast(message, type)

Zeigt eine Toast-Benachrichtigung an.

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `message` | `string` | ✓ | Anzuzeigende Nachricht |
| `type` | `string` | — | Toast-Typ: `'success'` (Standard), `'error'`, `'info'` |

**Rückgabe:** `void`

**Beispiel:**

```javascript
showToast('Eintrag gespeichert!', 'success');
showToast('Fehler aufgetreten', 'error');
showToast('Info-Nachricht', 'info');
showToast('Standard: Erfolg');  // type ist optional
```

---

### openAddEntryOverlay(editEntryId?)

Öffnet den Overlay zum Hinzufügen oder Bearbeiten eines Eintrags.

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `editEntryId` | `string \| number` | — | ID des zu bearbeitenden Eintrags. Wenn nicht angegeben, wird ein neuer Eintrag erstellt. |

**Rückgabe:** `void`

**Beispiel:**

```javascript
openAddEntryOverlay();           // Öffnet Overlay für neuen Eintrag
openAddEntryOverlay('123');      // Öffnet Overlay zum Bearbeiten von Eintrag '123'
```

---

### openAddSubjectOverlay(editSubjectId?)

Öffnet den Overlay zum Hinzufügen oder Bearbeiten eines Fachs.

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `editSubjectId` | `string \| number` | — | ID des zu bearbeitenden Fachs. Wenn nicht angegeben, wird ein neues Fach erstellt. |

**Rückgabe:** `void`

**Beispiel:**

```javascript
openAddSubjectOverlay();         // Öffnet Overlay für neues Fach
openAddSubjectOverlay('1');      // Öffnet Overlay zum Bearbeiten von Fach '1'
```

---

### openOverlay(id)

Öffnet ein Overlay-Element anhand seiner ID.

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `id` | `string` | ✓ | ID des Overlay-Elements (ohne '#'-Präfix) |

**Rückgabe:** `void`

**Beispiel:**

```javascript
openOverlay('add-semester-overlay');
openOverlay('timer-settings-overlay');
```

---

### closeOverlay(id)

Schließt ein Overlay-Element anhand seiner ID.

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `id` | `string` | ✓ | ID des Overlay-Elements (ohne '#'-Präfix) |

**Rückgabe:** `void`

**Beispiel:**

```javascript
closeOverlay('add-semester-overlay');
closeOverlay('timer-settings-overlay');
```

---

### updateSubjectSelects()

Aktualisiert alle Fach-Auswahlfelder (Selects) im DOM mit den aktuellen Fächern aus dem Storage.

**Rückgabe:** `void`

**Beispiel:**

```javascript
updateSubjectSelects();
```

---

## Timer-Funktionen

### initTimer()

Initialisiert den Timer mit allen Event-Listenern und stellt einen vorherigen Zustand wieder her (z.B. nach Page-Reload).

**Rückgabe:** `void`

**Beispiel:**

```javascript
initTimer();
```

---

### requestWakeLock()

Fordert einen Screen Wake Lock an, um zu verhindern, dass der Bildschirm in den Ruhezustand geht, während der Timer läuft.

**Rückgabe:** `Promise<void>`

**Beispiel:**

```javascript
await requestWakeLock();
// Bildschirm bleibt aktiv, solange der Timer läuft
```

> **Hinweis:** Verwendet die [Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/WakeLock) (`navigator.wakeLock`). Funktioniert nur in unterstützenden Browsern. Das Wake Lock wird automatisch freigegeben, wenn die Seite den Fokus verliert.

---

### playBeep(freq?, duration?, count?)

Spielt einen akustischen Signalton ab (verwendet für Pomodoro-Benachrichtigungen).

**Parameter:**

| Name | Typ | erforderlich | Standard | Beschreibung |
|------|-----|--------------|---------|--------------|
| `freq` | `number` | — | `800` | Frequenz in Hz |
| `duration` | `number` | — | `200` | Dauer in Millisekunden |
| `count` | `number` | — | `2` | Anzahl der Wiederholungen |

**Rückgabe:** `void`

**Beispiel:**

```javascript
playBeep(600, 300, 3);  // 600Hz, 300ms, 3 Mal wiederholen
playBeep();            // Standard: 800Hz, 200ms, 2 Mal
```

---

### getPomodoroSettings()

Gibt die aktuellen Pomodoro-Einstellungen zurück.

**Rückgabe:** `Object`

| Eigenschaft | Typ | Beschreibung |
|-------------|-----|--------------|
| `work` | `number` | Arbeitszeit in Sekunden (Standard: 1500 = 25 min) |
| `shortBreak` | `number` | Kurze Pause in Sekunden (Standard: 300 = 5 min) |
| `longBreak` | `number` | Lange Pause in Sekunden (Standard: 900 = 15 min) |
| `longBreakInterval` | `number` | Anzahl Pomodoros vor langer Pause (Standard: 4) |
| `autoStartBreak` | `boolean` | Automatischer Start der Pause |
| `autoStartWork` | `boolean` | Automatischer Start der Arbeit |

**Beispiel:**

```javascript
const pomo = getPomodoroSettings();
// Ergebnis:
// {
//   work: 1500,              // 25 Minuten
//   shortBreak: 300,         // 5 Minuten
//   longBreak: 900,          // 15 Minuten
//   longBreakInterval: 4,
//   autoStartBreak: true,
//   autoStartWork: false
// }
```

---

## Render-Funktionen

### updateViews()

Aktualisiert alle Ansichten (Dashboard, Historie, Kalender, Fächer, Heatmap). Ruft alle anderen Render-Funktionen auf.

**Rückgabe:** `void`

**Beispiel:**

```javascript
updateViews();
```

---

### renderHistory(entries, subjects)

Rendert die Historien-Liste mit allen Einträgen, gruppiert nach Datum.

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `entries` | `Array<Object>` | ✓ | Array von Entry-Objekten |
| `subjects` | `Array<Object>` | ✓ | Array von Subject-Objekten |

**Rückgabe:** `void`

**Beispiel:**

```javascript
const entries = window.storageManager.getEntries();
const subjects = window.storageManager.getSubjects();
renderHistory(entries, subjects);
```

---

### renderCalendar(entries)

Rendert die Kalender-Ansicht (Tages-, Wochen-, Monatsansicht).

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `entries` | `Array<Object>` | ✓ | Array von Entry-Objekten |

**Rückgabe:** `void`

**Verwendet:** Die globale Variable `currentCalendarView` bestimmt die Ansicht:

| Wert | Beschreibung |
|------|--------------|
| `'day'` | Tagesansicht |
| `'week'` | Wochenansicht (Kalenderwoche) |
| `'month'` | Monatsansicht |

**Beispiel:**

```javascript
const entries = window.storageManager.getEntries();
renderCalendar(entries);
```

---

### renderFaecher(entries, subjects)

Rendert die Fächer-Liste mit Statistiken (Gesamtzeit, durchschnittliche Session-Dauer).

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `entries` | `Array<Object>` | ✓ | Array von Entry-Objekten |
| `subjects` | `Array<Object>` | ✓ | Array von Subject-Objekten |

**Rückgabe:** `void`

**Beispiel:**

```javascript
renderFaecher(entries, subjects);
```

---

### renderHeatmap(entries)

Rendert die Aktivitäts-Heatmap (GitHub-Stil) der letzten 12 Wochen.

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `entries` | `Array<Object>` | ✓ | Array von Entry-Objekten |

**Rückgabe:** `void`

**Beispiel:**

```javascript
renderHeatmap(entries);
```

---

### renderSemester(entries, subjects)

Rendert die Semester-Ansicht (ruft intern `renderSemesterList` auf).

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `entries` | `Array<Object>` | ✓ | Array von Entry-Objekten |
| `subjects` | `Array<Object>` | ✓ | Array von Subject-Objekten |

**Rückgabe:** `void`

---

### renderSemesterList()

Rendert die Liste aller Semester mit Übersicht (Anzahl Module, Gesamt-ECTs).

**Rückgabe:** `void`

---

### renderModuleList(semesterId)

Rendert die Modul-Liste eines bestimmten Semesters.

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `semesterId` | `string \| number` | ✓ | ID des Semesters |

**Rückgabe:** `void`

---

### renderTopicBadges(topics)

Generiert HTML für Themen-Badges.

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `topics` | `string` | ✓ | Kommagetrennte Themenliste |

**Rückgabe:** `string` — HTML-String mit Badge-Elementen

**Beispiel:**

```javascript
const html = renderTopicBadges('Mathe, Physik, Chemie');
// Gibt HTML zurück:
// <span class="badge ...">Mathe</span><span class="badge ...">Physik</span><span class="badge ...">Chemie</span>

// Im DOM verwenden:
document.getElementById('topics').innerHTML = renderTopicBadges('Integralrechnung');
```

---

### updateDashboard(entries)

Aktualisiert alle Dashboard-Widgets (Streak, Gesamtdauer, Statistiken, Graphen).

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `entries` | `Array<Object>` | ✓ | Array von Entry-Objekten |

**Rückgabe:** `void`

---

### renderWeeklyStats(entries)

Rendert die Wochenstatistiken mit Balkendiagramm (letzte Woche, Montag–Sonntag).

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `entries` | `Array<Object>` | ✓ | Array von Entry-Objekten |

**Rückgabe:** `void`

---

### renderWeeklyComparison(entries)

Rendert den Wochenvergleich (diese Woche vs. letzte Woche) aufgeschlüsselt nach Fach.

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `entries` | `Array<Object>` | ✓ | Array von Entry-Objekten |

**Rückgabe:** `void`

---

### renderDashboardSubjects(entries)

Rendert die Fach-Kacheln auf dem Dashboard mit Fortschrittsbalken zum Wochenziel.

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `entries` | `Array<Object>` | ✓ | Array von Entry-Objekten |

**Rückgabe:** `void`

---

### updateDailyGoalRing(entries)

Aktualisiert den Tagesziel-Ring mit dem aktuellen Fortschritt.

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `entries` | `Array<Object>` | ✓ | Array von Entry-Objekten |

**Rückgabe:** `void`

---

### renderGraph(entries)

Rendert den 7-Tage-Balkengraph auf dem Dashboard.

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `entries` | `Array<Object>` | ✓ | Array von Entry-Objekten |

**Rückgabe:** `void`

---

### updateWeeklyComparison(entries)

Aktualisiert das Wochenvergleichs-Badge auf dem Dashboard (Prozentuale Änderung).

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `entries` | `Array<Object>` | ✓ | Array von Entry-Objekten |

**Rückgabe:** `void`

---

### renderExamCountdown()

Rendert die Prüfungs-Countdown-Liste mit den nächsten Prüfungen.

**Rückgabe:** `void`

---

### updateStudyRecommendation()

Berechnet und zeigt eine Lernempfehlung basierend auf Prüfungsterminen und Lernfortschritt.

**Rückgabe:** `void`

---

### renderAchievements(entries)

Rendert die Achievements-Liste mit Fortschrittsanzeigen.

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `entries` | `Array<Object>` | ✓ | Array von Entry-Objekten |

**Rückgabe:** `void`

---

### renderTrends(entries)

Rendert die Trend-Analyse mit folgenden Statistiken:
- Beste Lernzeit (Tageszeit)
- Durchschnittliche Session-Dauer
- Top-Lerntag der Woche

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `entries` | `Array<Object>` | ✓ | Array von Entry-Objekten |

**Rückgabe:** `void`

---

## Utility-Funktionen

### formatDuration(seconds)

Formatiert eine Sekundenanzahl als lesbare Dauer (z.B. "1h 30m").

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `seconds` | `number` | ✓ | Dauer in Sekunden |

**Rückgabe:** `string`

**Beispiel:**

```javascript
formatDuration(3661);  // "1h 1m"
formatDuration(90);    // "1m"
formatDuration(7200);   // "2h"
formatDuration(45);    // "0m" (unter 60 Sekunden)
```

---

### formatDateShort(dateStr)

Formatiert ein Datum als kurzes deutsches Format (DD.MM.YYYY).

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `dateStr` | `string \| Date` | ✓ | Datumsstring (ISO oder anderes von `new Date()` akzeptiertes Format) |

**Rückgabe:** `string` — Formatiertes Datum (z.B. "15.03.2024")

**Beispiel:**

```javascript
formatDateShort('2024-03-15');    // "15.03.2024"
formatDateShort('2024-12-25');    // "25.12.2024"
formatDateShort(new Date());       // Aktuelles Datum im deutschen Format
```

---

### escapeHtml(value)

Escaped HTML-Sonderzeichen zur sicheren Ausgabe im DOM (XSS-Schutz).

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `value` | `any` | ✓ | Zu escapender Wert (wird in String konvertiert) |

**Rückgabe:** `string` — Escapter String

**Beispiel:**

```javascript
escapeHtml('<script>alert("xss")</script>');  // "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
escapeHtml('Mathe & Physik');                  // "Mathe &amp; Physik"
escapeHtml('Klein < Groß > Klein');            // "Klein &lt; Groß &gt; Klein"
```

---

### calculateStreak(entries)

Berechnet die aktuelle Lern-Serie (Streak) in Tagen.

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `entries` | `Array<Object>` | ✓ | Array von Entry-Objekten |

**Rückgabe:** `number` — Anzahl der aufeinanderfolgenden Tage

**Logik:**
1. Zählt rückwärts vom heutigen Tag (oder gestern, falls heute noch nicht gelernt wurde)
2. Ein Tag zählt, wenn mindestens ein Eintrag existiert
3. Unterbricht die Serie, wenn ein Tag ohne Einträge existiert

**Beispiel:**

```javascript
calculateStreak(entries);  // 7 (7 Tage in Folge gelernt)
calculateStreak(entries);  // 0 (heute noch nicht gelernt, gestern auch nicht)
```

---

### getTopicsForSubject(subjectId)

Gibt alle einzigartigen Themen für ein Fach zurück, sortiert nach Häufigkeit.

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `subjectId` | `string \| number` | ✓ | ID des Fachs |

**Rückgabe:** `Array<string>` — Array von Themen (sortiert nach Häufigkeit)

**Beispiel:**

```javascript
const topics = getTopicsForSubject('1');
// Ergebnis: ['Integralrechnung', 'Differenziation', 'Matrizen']
```

---

### getTopTopicsForSubject(subjectId, limit?)

Gibt die meistgenutzten Themen für ein Fach zurück.

**Parameter:**

| Name | Typ | erforderlich | Standard | Beschreibung |
|------|-----|--------------|---------|--------------|
| `subjectId` | `string \| number` | ✓ | — | ID des Fachs |
| `limit` | `number` | — | `3` | Maximale Anzahl der Ergebnisse |

**Rückgabe:** `Array<string>`

**Beispiel:**

```javascript
getTopTopicsForSubject('1');        // Top 3 Themen
getTopTopicsForSubject('1', 5);     // Top 5 Themen
```

---

### getWeekNumber(d)

Berechnet die ISO-Wochennummer eines Datums.

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `d` | `Date` | ✓ | Datumsobjekt |

**Rückgabe:** `Object` mit `year` (Jahr) und `week` (Kalenderwoche)

**Beispiel:**

```javascript
getWeekNumber(new Date());              // { year: 2026, week: 19 }
getWeekNumber(new Date('2026-01-01'));  // { year: 2025, week: 1 } (ISO-Wochenstart)
```

---

### getWeekStart(date)

Gibt den Montag einer Woche zurück (00:00:00 Uhr).

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `date` | `Date` | ✓ | Beliebiges Datum in der Woche |

**Rückgabe:** `Date` — Montag der Woche

**Beispiel:**

```javascript
getWeekStart(new Date('2026-05-14'));  // Date object für Montag, 11.05.2026
getWeekStart(new Date());               // Montag der aktuellen Woche
```

---

### getCurrentWeekRange()

Gibt den Datumsbereich der aktuellen Woche zurück.

**Rückgabe:** `Object`

| Eigenschaft | Typ | Beschreibung |
|-------------|-----|--------------|
| `start` | `Date` | Montag 00:00:00 |
| `end` | `Date` | Sonntag 23:59:59 |

**Beispiel:**

```javascript
const range = getCurrentWeekRange();
// {
//   start: Date(Mon May 11 2026 00:00:00),
//   end: Date(Sun May 17 2026 23:59:59)
// }
```

---

### getCurrentMonthRange()

Gibt den Datumsbereich des aktuellen Monats zurück.

**Rückgabe:** `Object`

| Eigenschaft | Typ | Beschreibung |
|-------------|-----|--------------|
| `start` | `Date` | Erster Tag des Monats 00:00:00 |
| `end` | `Date` | Letzter Tag des Monats 23:59:59 |

**Beispiel:**

```javascript
const range = getCurrentMonthRange();
// {
//   start: Date(Thu May 01 2026 00:00:00),
//   end: Date(Sat May 31 2026 23:59:59)
// }
```

---

### getExamBadge(examPeriod, examDate)

Generiert Badge-Informationen für Prüfungen (Text und CSS-Klassen).

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `examPeriod` | `string` | ✓ | Prüfungszeitraum (ISO-Datum) |
| `examDate` | `string` | — | Konkretes Prüfungsdatum (ISO-Datum) |

**Rückgabe:** `Object | null`

| Eigenschaft | Typ | Beschreibung |
|-------------|-----|--------------|
| `text` | `string` | Angezeigter Text (z.B. "28.07.26") |
| `bgClass` | `string` | CSS-Klassen für Hintergrundfarbe |

**Beispiel:**

```javascript
getExamBadge('2026-07-14', '2026-07-28');
// Ergebnis:
// {
//   text: '28.07.26',
//   bgClass: 'bg-red-900/40 text-red-300'
// }
```

---

### getGradeBadgeClass(grade)

Gibt die CSS-Klasse für eine Noten-Badge zurück (grün für beste Noten, rot für schlechte).

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `grade` | `string \| number` | ✓ | Note (z.B. "1.0", "2.3", 4) |

**Rückgabe:** `string` — CSS-Klassenstring (z.B. `"bg-green-900/40 text-green-300"`)

**Beispiel:**

```javascript
getGradeBadgeClass('1.0');    // Grüner Badge für Bestnote
getGradeBadgeClass('4.0');    // Roter Badge für nicht bestanden
getGradeBadgeClass(2.3);      // Funktioniert auch mit Zahlen
```

---

### getHeatmapLevel(seconds, maxSeconds)

Berechnet das Heatmap-Level (0–4) basierend auf der Lernzeit.

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `seconds` | `number` | ✓ | Lernzeit in Sekunden |
| `maxSeconds` | `number` | ✓ | Maximale Lernzeit für volle Intensität (Level 4) |

**Rückgabe:** `number` — Level zwischen 0 und 4

| Level | Bedeutung |
|-------|-----------|
| 0 | Keine Aktivität |
| 1 | Wenig Aktivität (< 25% von max) |
| 2 | Moderate Aktivität (25–50%) |
| 3 | Hohe Aktivität (50–75%) |
| 4 | Sehr hohe Aktivität (> 75%) |

**Beispiel:**

```javascript
getHeatmapLevel(1800, 7200);   // 1 (25% von max)
getHeatmapLevel(5400, 7200);   // 3 (75% von max)
getHeatmapLevel(0, 7200);      // 0
```

---

## Export-Funktionen

### exportExamToICS(examDate, moduleName)

Exportiert einen Prüfungstermin als ICS-Datei zum Import in Kalender-Apps (Google Calendar, Apple Calendar, Outlook).

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `examDate` | `string` | ✓ | Prüfungsdatum (ISO-Format: `YYYY-MM-DD`) |
| `moduleName` | `string` | ✓ | Name des Moduls |

**Rückgabe:** `void`

**Beispiel:**

```javascript
exportExamToICS('2026-07-28', 'Höhere Mathematik 2');
// Erstellt und lädt herunter: pruefung_Hoehere_Mathematik_2.ics
```

---

### generateWeeklyPDFReport()

Generiert einen Wochenbericht. Die Datei wird als Textdatei heruntergeladen (ersetzt echte PDF-Funktionalität).

**Rückgabe:** `void`

**Inhalt des Berichts:**
- Zeitraum (Kalenderwoche)
- Zusammenfassung (Gesamtzeit, Anzahl Sessions)
- Tägliche Übersicht
- Statistik nach Fach

**Beispiel:**

```javascript
generateWeeklyPDFReport();
// Erstellt und lädt herunter: lernzeit_kw19_bericht.txt
```

---

## Kalender & Aggregation

### showSemesterDetail(semesterId)

Zeigt die Detailansicht eines Semesters mit Modul-Liste.

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `semesterId` | `string \| number` | ✓ | ID des Semesters |

**Rückgabe:** `void`

---

### showSemesterList()

Kehrt zur Semester-Listenansicht zurück (zeigt alle Semester).

**Rückgabe:** `void`

---

### populateModuleSubjectSelect(selectedId?)

Füllt das Modul-Fach-Select mit aktuellen Fächern aus dem Storage.

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `selectedId` | `string \| number` | — | Vorher ausgewählte ID (bleibt ausgewählt) |

**Rückgabe:** `void`

---

### openAddSemesterModal()

Öffnet den Modal zum Hinzufügen eines neuen Semesters.

**Rückgabe:** `void`

---

### openEditSemesterModal(semesterId)

Öffnet den Modal zum Bearbeiten eines Semesters und lädt dessen Daten vor.

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `semesterId` | `string \| number` | ✓ | ID des Semesters |

**Rückgabe:** `void`

---

### saveSemester()

Speichert ein Semester (neu oder aktualisiert, je nach Kontext). Wird vom Modal-Formular aufgerufen.

**Rückgabe:** `void`

---

### openAddModuleModal()

Öffnet den Modal zum Hinzufügen eines neuen Moduls.

**Rückgabe:** `void`

---

### openEditModuleModal(semesterId, moduleId)

Öffnet den Modal zum Bearbeiten eines Moduls und lädt dessen Daten vor.

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `semesterId` | `string \| number` | ✓ | ID des Semesters |
| `moduleId` | `string \| number` | ✓ | ID des Moduls |

**Rückgabe:** `void`

---

### saveModule()

Speichert ein Modul (neu oder aktualisiert, je nach Kontext). Wird vom Modal-Formular aufgerufen.

**Rückgabe:** `void`

---

## Achievements-System

### ACHIEVEMENT_DEFINITIONS

Konstante mit allen Achievement-Definitionen (Typ: `Array<Object>`).

**Struktur:**

```javascript
[
    { id: 'first_timer', icon: '🏃', name: 'Erste Schritte', desc: 'Erste Lernsession' },
    { id: 'streak_7', icon: '🔥', name: '7-Tage-Streak', desc: '7 Tage hintereinander' },
    { id: 'hours_10', icon: '⏰', name: '10 Stunden', desc: 'Gesamt 10 Stunden gelernt' },
    { id: 'hours_100', icon: '💯', name: '100 Stunden', desc: 'Gesamt 100 Stunden gelernt' },
    { id: 'sessions_50', icon: '📚', name: '50 Sessions', desc: '50 Lernsessions absolviert' },
    // ... weitere Achievements
]
```

---

### getStoredAchievements()

Liest gespeicherte Achievements aus dem localStorage.

**Rückgabe:** `Array<Object>` — Array von Achievement-Objekten

**Beispiel:**

```javascript
const achievements = getStoredAchievements();
// Ergebnis:
// [
//   { id: 'first_timer', unlockedAt: '2026-05-01' },
//   { id: 'streak_7', unlockedAt: '2026-05-08' }
// ]
```

---

### saveAchievements(achievements)

Speichert Achievements in localStorage.

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `achievements` | `Array<Object>` | ✓ | Array von Achievement-Objekten |

**Rückgabe:** `void`

**Beispiel:**

```javascript
saveAchievements([
    { id: 'first_timer', unlockedAt: '2026-05-01' },
    { id: 'hours_10', unlockedAt: '2026-05-10' }
]);
```

---

### formatAchievementDate(dateString)

Formatiert das Freischaltungsdatum eines Achievements.

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `dateString` | `string` | ✓ | ISO-Datumstring |

**Rückgabe:** `string` — Deutsches Datumsformat (TT.MM.YYYY)

**Beispiel:**

```javascript
formatAchievementDate('2026-05-01');  // "01.05.2026"
```

---

### getAchievementProgress(entries)

Berechnet den Fortschritt für alle Achievements basierend auf den Einträgen.

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `entries` | `Array<Object>` | ✓ | Array von Entry-Objekten |

**Rückgabe:** `Object` — Map von Achievement-IDs zu Boolean (freigeschaltet oder nicht)

**Beispiel:**

```javascript
getAchievementProgress(entries);
// Ergebnis:
// {
//   first_timer: true,    // Freigeschaltet
//   streak_7: false,      // Noch nicht freigeschaltet
//   hours_10: true,       // Freigeschaltet
//   hours_100: false,     // Noch nicht freigeschaltet
//   sessions_50: false
// }
```

---

### checkAchievements(entries, options?)

Prüft auf neue Achievements und zeigt ggf. Toast-Benachrichtigungen an.

**Parameter:**

| Name | Typ | erforderlich | Standard | Beschreibung |
|------|-----|--------------|---------|--------------|
| `entries` | `Array<Object>` | ✓ | — | Array von Entry-Objekten |
| `options` | `Object` | — | `{ showToasts: false }` | Optionen |
| `options.showToasts` | `boolean` | — | `false` | Ob Toasts angezeigt werden sollen |

**Rückgabe:** `Array<Object>` — Alle freigeschalteten Achievements (neu und bereits freigeschaltete)

**Beispiel:**

```javascript
// Nur prüfen, keine Toasts
const allAchievements = checkAchievements(entries);

// Prüfen und Toasts anzeigen
const newAchievements = checkAchievements(entries, { showToasts: true });
```

---

## Themen-Management

### getTopicsForSubject(subjectId)

Sammelt alle Themen für ein bestimmtes Fach aus den Einträgen.

**Parameter:**

| Name | Typ | erforderlich | Beschreibung |
|------|-----|--------------|--------------|
| `subjectId` | `string \| number` | ✓ | ID des Fachs |

**Rückgabe:** `Array<string>` — Themen, sortiert nach Häufigkeit (meistgenutztes zuerst)

**Beispiel:**

```javascript
const topics = getTopicsForSubject('1');
// Ergebnis: ['Integralrechnung', 'Differenziation', 'Matrizen']
```

---

### getTopTopicsForSubject(subjectId, limit?)

Gibt die Top-N Themen für ein Fach zurück.

**Parameter:**

| Name | Typ | erforderlich | Standard | Beschreibung |
|------|-----|--------------|---------|--------------|
| `subjectId` | `string \| number` | ✓ | — | ID des Fachs |
| `limit` | `number` | — | `3` | Anzahl der Ergebnisse |

**Rückgabe:** `Array<string>` — Top-N Themen nach Häufigkeit

**Beispiel:**

```javascript
getTopTopicsForSubject('1');      // Top 3 Themen
getTopTopicsForSubject('1', 5);  // Top 5 Themen
getTopTopicsForSubject('2');     // Top 3 Themen für anderes Fach
```

---

## Globale Variablen

### Timer-Status

| Variable | Typ | Beschreibung |
|----------|-----|--------------|
| `timerInterval` | `number \| null` | Aktuelles `setInterval`-Handle oder `null` |
| `timerSeconds` | `number` | Aktuelle Timer-Zeit in Sekunden |
| `isTimerRunning` | `boolean` | `true` wenn Timer aktiv |
| `timerStartTime` | `number \| null` | Start-Zeitstempel für Timer-Berechnung |
| `wakeLock` | `WakeLockSentinel \| null` | WakeLock-Handle |

```javascript
let timerInterval;      // Aktuelles setInterval-Handle oder null
let timerSeconds;       // Aktuelle Timer-Zeit in Sekunden
let isTimerRunning;     // true wenn Timer aktiv
let timerStartTime;     // Start-Zeitstempel für Timer-Berechnung
let wakeLock;           // WakeLock-Handle
```

---

### Pomodoro-Status

| Variable | Typ | Beschreibung |
|----------|-----|--------------|
| `pomodoroMode` | `boolean` | `true` = Pomodoro, `false` = Freie Stoppuhr |
| `pomodoroPhase` | `string` | Aktuelle Phase: `'work'` \| `'shortBreak'` \| `'longBreak'` |
| `pomodoroCount` | `number` | Anzahl abgeschlossener Pomodoros |
| `pomodoroCountdown` | `number` | Restzeit in Sekunden |
| `pomodoroWorkSeconds` | `number` | Akkumulierte Arbeitssekunden |

```javascript
let pomodoroMode;          // true = Pomodoro, false = Frei (Stoppuhr)
let pomodoroPhase;         // 'work' | 'shortBreak' | 'longBreak'
let pomodoroCount;         // Anzahl abgeschlossener Pomodoros
let pomodoroCountdown;     // Restzeit in Sekunden
let pomodoroWorkSeconds;   // Akkumulierte Arbeitssekunden
```

---

### Kalender-Status

| Variable | Typ | Beschreibung |
|----------|-----|--------------|
| `currentCalendarView` | `string` | Aktuelle Ansicht: `'day'` \| `'week'` \| `'month'` |

```javascript
let currentCalendarView;   // 'day' | 'week' | 'month'
```

---

### Semester-Status

| Variable | Typ | Beschreibung |
|----------|-----|--------------|
| `_currentSemesterId` | `string \| number \| null` | Aktuell ausgewähltes Semester |
| `_editingSemesterId` | `string \| number \| null` | ID des bearbeiteten Semesters |
| `_editingModuleId` | `string \| number \| null` | ID des bearbeiteten Moduls |

```javascript
let _currentSemesterId;    // Aktuell ausgewähltes Semester
let _editingSemesterId;    // ID des bearbeiteten Semesters
let _editingModuleId;      // ID des bearbeiteten Moduls
```

---

## Datenstrukturen

### Entry (Lernzeit-Eintrag)

| Eigenschaft | Typ | erforderlich | Beschreibung |
|-------------|-----|--------------|--------------|
| `id` | `string \| number` | ✓ | Eindeutige ID |
| `subjectId` | `string \| number` | ✓ | ID des Fachs |
| `duration` | `number` | ✓ | Dauer in Sekunden |
| `startTime` | `number` | ✓ | Startzeit als Unix-Timestamp (Millisekunden) |
| `endTime` | `number` | ✓ | Endzeit als Unix-Timestamp (Millisekunden) |
| `notes` | `string` | — | Notizen zum Eintrag |
| `topics` | `string` | — | Themen, kommagetrennt (z.B. `"Mathe, Physik"`) |

```javascript
{
    id: '123',
    subjectId: '1',
    duration: 3600,        // Sekunden (1 Stunde)
    startTime: 1746748800000,  // Unix-Timestamp in ms
    endTime: 1746752400000,    // Unix-Timestamp in ms
    notes: 'Kapitel 5 bearbeitet',
    topics: 'Integralrechnung, Differenziation'
}
```

---

### Subject (Fach)

| Eigenschaft | Typ | erforderlich | Beschreibung |
|-------------|-----|--------------|--------------|
| `id` | `string \| number` | ✓ | Eindeutige ID |
| `name` | `string` | ✓ | Name des Fachs |
| `color` | `string` | ✓ | Tailwind-CSS-Klasse für Farbe (z.B. `'bg-blue-500'`) |
| `weeklyGoal` | `number` | — | Wochenziel in Stunden |

```javascript
{
    id: '1',
    name: 'Mathe',
    color: 'bg-blue-500',     // Tailwind-Farbklasse
    weeklyGoal: 6              // 6 Stunden pro Woche
}
```

---

### Semester

| Eigenschaft | Typ | erforderlich | Beschreibung |
|-------------|-----|--------------|--------------|
| `id` | `string \| number` | ✓ | Eindeutige ID |
| `name` | `string` | ✓ | Name des Semesters (z.B. "WS 2025/26") |
| `start` | `string` | ✓ | Startdatum (ISO-Format: `YYYY-MM-DD`) |
| `end` | `string` | ✓ | Enddatum (ISO-Format: `YYYY-MM-DD`) |
| `modules` | `Array<Module>` | — | Liste der Module |

```javascript
{
    id: '1',
    name: 'WS 2025/26',
    start: '2025-10-01',
    end: '2026-03-31',
    modules: [
        { id: 'mod-1', name: 'Mathe 2', ects: 8, hours: 120, ... },
        { id: 'mod-2', name: 'Physik 2', ects: 6, hours: 90, ... }
    ]
}
```

---

### Module

| Eigenschaft | Typ | erforderlich | Beschreibung |
|-------------|-----|--------------|--------------|
| `id` | `string \| number` | ✓ | Eindeutige ID |
| `name` | `string` | ✓ | Name des Moduls |
| `ects` | `number` | ✓ | ECTS-Punkte |
| `hours` | `number` | ✓ | Geschätzte Lernstunden |
| `subjectId` | `string \| number` | — | Verknüpftes Fach |
| `code` | `string` | — | Modulkürzel (z.B. `MATH-101`) |
| `examPeriod` | `string` | — | Prüfungszeitraum (ISO-Datum) |
| `examDate` | `string` | — | Konkretes Prüfungsdatum (ISO-Datum) |
| `grade` | `string` | — | Erhaltene Note |
| `notes` | `string` | — | Notizen |

```javascript
{
    id: 'mod-1',
    name: 'Höhere Mathematik 2',
    subjectId: '1',
    code: 'MATH-102',
    ects: 8,
    hours: 120,
    examPeriod: '2026-07-14',
    examDate: '2026-07-28',
    grade: '1.3',
    notes: 'Bestandene Prüfung'
}
```

---

### Achievement

| Eigenschaft | Typ | erforderlich | Beschreibung |
|-------------|-----|--------------|--------------|
| `id` | `string` | ✓ | Achievement-ID (entspricht Definition) |
| `unlockedAt` | `string` | ✓ | Freischaltungsdatum (ISO-Format: `YYYY-MM-DD`) |

```javascript
{
    id: 'streak_7',
    unlockedAt: '2026-05-08'
}
```
