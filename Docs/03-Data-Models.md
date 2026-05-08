# Datenmodelle und Speicherstruktur

Dokumentation der Datenmodelle und Persistenzschicht der Lernzeit-Tracker Anwendung.

---

## Inhaltsverzeichnis

1. [StorageManager Klasse](#storagemanager-klasse)
2. [localStorage Schlüsselstruktur](#localstorage-schlüsselstruktur)
3. [Entry Modell (Lernsitzung)](#entry-modell-lernsitzung)
4. [Subject Modell (Fach)](#subject-modell-fach)
5. [Settings Modell (Einstellungen)](#settings-modell-einstellungen)
6. [Semester Modell](#semester-modell)
7. [Module Modell](#module-modell)
8. [Timer-State (Persistiert)](#timer-state-persistiert)
9. [Dateninitialisierung und Seeding](#dateninitialisierung-und-seeding)

---

## StorageManager Klasse

Die `StorageManager`-Klasse ist die zentrale Schnittstelle für alle Datenzugriffe in der Anwendung. Sie abstrahiert den Zugriff auf `localStorage` und bietet CRUD-Operationen für alle Datenmodelle.

### Konstruktor und Initialisierung

```javascript
class StorageManager {
    constructor() {
        this.STORAGE_KEYS = {
            ENTRIES: 'lernzeit_entries',
            SUBJECTS: 'lernzeit_subjects',
            SETTINGS: 'lernzeit_settings',
            SEMESTERS: 'lernzeit_semesters'
        };
        this.init();
    }
}
```

### Öffentliche Methoden

| Methode | Rückgabe | Beschreibung |
|---------|----------|--------------|
| `init()` | `void` | Initialisiert alle Daten mit Standardwerten, falls Speicher leer ist |
| `getEntries()` | `Entry[]` | Gibt alle Lernsitzungen zurück |
| `addEntry(entry)` | `Entry` | Fügt eine neue Lernsitzung hinzu |
| `updateEntry(entry)` | `Entry` | Aktualisiert eine bestehende Lernsitzung |
| `deleteEntry(id)` | `boolean` | Löscht eine Lernsitzung anhand der ID |
| `getSubjects()` | `Subject[]` | Gibt alle Fächer zurück |
| `addSubject(subject)` | `Subject` | Fügt ein neues Fach hinzu |
| `updateSubject(subject)` | `Subject` | Aktualisiert ein bestehendes Fach |
| `deleteSubject(id)` | `boolean` | Löscht ein Fach anhand der ID |
| `getSettings()` | `Settings` | Gibt die aktuellen Einstellungen zurück |
| `updateSettings(settings)` | `Settings` | Aktualisiert die Einstellungen |
| `getSemesters()` | `Semester[]` | Gibt alle Semester zurück |
| `addSemester(semester)` | `Semester` | Fügt ein neues Semester hinzu |
| `updateSemester(semester)` | `Semester` | Aktualisiert ein bestehendes Semester |
| `deleteSemester(id)` | `boolean` | Löscht ein Semester anhand der ID |
| `addModule(semesterId, module)` | `Module` | Fügt ein Modul zu einem Semester hinzu |
| `updateModule(semesterId, module)` | `Module` | Aktualisiert ein Modul in einem Semester |
| `deleteModule(semesterId, moduleId)` | `boolean` | Löscht ein Modul aus einem Semester |

### Private Hilfsmethoden

| Methode | Rückgabe | Beschreibung |
|---------|----------|--------------|
| `_save(key, data)` | `void` | Speichert Daten in localStorage mit Fehlerbehandlung |
| `_load(key)` | `any` | Lädt Daten aus localStorage |
| `migrateModulesSubjectId()` | `void` | Migriert Module ohne subjectId anhand des Namens |
| `migrateExamDates()` | `void` | Migriert Prüfungsdaten basierend auf Mapping |
| `initDefaultSemester()` | `void` | Erstellt Standard-Semester für FH Aachen ET |

### Fehlerbehandlung

Die `_save()`-Methode fängt Speicherfehler ab und zeigt dem Benutzer einen Toast mit Fehlermeldung:

```javascript
_save(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error(`Fehler beim Speichern von ${key}:`, e);
        window.showToast(
            'Fehler beim Speichern! Möglicherweise ist der Speicher voll.',
            'error'
        );
    }
}
```

---

## localStorage Schlüsselstruktur

Die Anwendung verwendet vier primäre Schlüssel in localStorage:

| Schlüssel | Datentyp | Beschreibung |
|-----------|----------|--------------|
| `lernzeit_entries` | `Entry[]` | Array aller Lernsitzungen |
| `lernzeit_subjects` | `Subject[]` | Array aller Fächer |
| `lernzeit_settings` | `Settings` | Einstellungsobjekt |
| `lernzeit_semesters` | `Semester[]` | Array aller Semester |

### Zusätzliche lokale Schlüssel

| Schlüssel | Datentyp | Beschreibung |
|-----------|----------|--------------|
| `timer_state` | `TimerState` | Aktueller Timer-Zustand (persistiert über Reload) |
| `timer_notes` | `string` | Aktuelle Timer-Notizen |
| `pwa_banner_dismissed` | `string` | Boolean als String für PWA-Banner-Status |

---

## Entry Modell (Lernsitzung)

Repräsentiert eine einzelne Lernsitzung mit Zeitmessung.

### Feldbeschreibung

| Feld | Typ | Pflicht | Standard | Beschreibung |
|------|-----|---------|---------|--------------|
| `id` | `string` | Ja | - | Eindeutige ID (timestamp-basiert via `Date.now()`) |
| `subjectId` | `string` | Ja | - | Referenz zum zugehörigen Fach |
| `duration` | `number` | Ja | - | Dauer in **Sekunden** |
| `startTime` | `number` | Ja | - | Startzeit als Unix-Timestamp in Millisekunden |
| `endTime` | `number` | Ja | - | Endzeit als Unix-Timestamp in Millisekunden |
| `notes` | `string` | Nein | `""` | Freitext-Notizen zur Sitzung |
| `topics` | `string` | Nein | `""` | Behandelte Themen (kommasepariert) |

### JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Entry",
  "type": "object",
  "required": ["id", "subjectId", "duration", "startTime", "endTime"],
  "properties": {
    "id": {
      "type": "string",
      "description": "Eindeutiger Identifikator (basierend auf Date.now())"
    },
    "subjectId": {
      "type": "string",
      "description": "Referenz zum zugehörigen Fach"
    },
    "duration": {
      "type": "integer",
      "minimum": 1,
      "description": "Dauer in Sekunden"
    },
    "startTime": {
      "type": "integer",
      "description": "Startzeit als Unix-Timestamp in Millisekunden"
    },
    "endTime": {
      "type": "integer",
      "description": "Endzeit als Unix-Timestamp in Millisekunden"
    },
    "notes": {
      "type": "string",
      "description": "Optionale Notizen zur Lernsitzung"
    },
    "topics": {
      "type": "string",
      "description": "Behandelte Themen, kommasepariert"
    }
  }
}
```

### Beispiel

```json
{
  "id": "1715092800000",
  "subjectId": "1",
  "duration": 3600,
  "startTime": 1715092800000,
  "endTime": 1715096400000,
  "notes": "Kapitel 5: Differentialgleichungen bearbeitet",
  "topics": "DGL,l'Hospital,Integration"
}
```

### Berechnungen

Aus den Entry-Daten können folgende Werte berechnet werden:

| Berechnung | Formel | Beispiel |
|------------|--------|---------|
| Dauer in Minuten | `duration / 60` | `3600 / 60 = 60` |
| Dauer in Stunden | `duration / 3600` | `3600 / 3600 = 1` |
| Datum | `new Date(startTime)` | `Date` Objekt |
| Wochentag | `new Date(startTime).getDay()` | `0-6` (So-Sa) |

---

## Subject Modell (Fach)

Repräsentiert ein Studienfach mit Farbcodierung und Wochenziel.

### Feldbeschreibung

| Feld | Typ | Pflicht | Standard | Beschreibung |
|------|-----|---------|----------|--------------|
| `id` | `string` | Ja | - | Eindeutige ID (timestamp-basiert) |
| `name` | `string` | Ja | - | Anzeigename des Fachs |
| `color` | `string` | Ja | - | CSS-Klasse für Farbdarstellung (Tailwind) |
| `weeklyGoal` | `number` | Nein | `0` | Wochenziel in Stunden |

### Farbcodierung

Die Farbe wird als Tailwind CSS-Klasse angegeben:

| Klasse | Farbe | Verwendung |
|--------|-------|------------|
| `bg-blue-500` | Blau | Standard für Mathematik |
| `bg-green-500` | Grün | Standard für GET |
| `bg-purple-500` | Violett | Standard für Physik |
| `bg-orange-500` | Orange | Standard für Elektrotechnik |
| `bg-red-500` | Rot | Standard für Digitaltechnik |
| `bg-yellow-500` | Gelb | Alternative Farbe |
| `bg-pink-500` | Pink | Alternative Farbe |
| `bg-indigo-500` | Indigo | Alternative Farbe |
| `bg-teal-500` | Türkis | Alternative Farbe |

### JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Subject",
  "type": "object",
  "required": ["id", "name", "color"],
  "properties": {
    "id": {
      "type": "string",
      "description": "Eindeutiger Identifikator"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "description": "Name des Fachs"
    },
    "color": {
      "type": "string",
      "pattern": "^bg-[a-z]+-[0-9]{3}$",
      "description": "Tailwind CSS Farbklasse"
    },
    "weeklyGoal": {
      "type": "number",
      "minimum": 0,
      "description": "Wochenziel in Stunden"
    }
  }
}
```

### Beispiel

```json
{
  "id": "1",
  "name": "Höhere Mathematik 2",
  "color": "bg-blue-500",
  "weeklyGoal": 6
}
```

---

## Settings Modell (Einstellungen)

Enthält alle globalen Anwendungseinstellungen.

### Feldbeschreibung

| Feld | Typ | Pflicht | Standard | Min | Max | Beschreibung |
|------|-----|---------|---------|-----|-----|--------------|
| `darkMode` | `boolean` | Nein | `true` | - | - | **Veraltet!** Nutze `themeMode` |
| `dailyGoal` | `number` | Nein | `60` | 1 | - | Tagesziel in **Minuten** |
| `learningDays` | `number` | Nein | `5` | 1 | 7 | Lerntage pro Woche |
| `fontSize` | `number` | Nein | `16` | 12 | 24 | Schriftgröße in Pixel |
| `themeMode` | `string` | Nein | `"dark"` | - | - | `"dark"`, `"light"` oder `"auto"` |
| `pomoWork` | `number` | Nein | `25` | 1 | 120 | Pomodoro Arbeitszeit in Minuten |
| `pomoShortBreak` | `number` | Nein | `5` | 1 | 30 | Pomodoro kurze Pause in Minuten |
| `pomoLongBreak` | `number` | Nein | `15` | 1 | 60 | Pomodoro lange Pause in Minuten |
| `pomoLongBreakInterval` | `number` | Nein | `4` | 1 | 10 | Anzahl Pomodoros bis zur langen Pause |
| `pomoAutoBreak` | `boolean` | Nein | `true` | - | - | Automatischer Start der Pause |
| `pomoAutoWork` | `boolean` | Nein | `false` | - | - | Automatischer Start der Arbeitsphase |

### Theme-Modi

| Modus | Beschreibung |
|-------|--------------|
| `"dark"` | Immer dunkles Theme |
| `"light"` | Immer helles Theme |
| `"auto"` | Folgt dem System-Theme (`prefers-color-scheme`) |

### JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Settings",
  "type": "object",
  "properties": {
    "darkMode": {
      "type": "boolean",
      "description": "Veraltet, nutze themeMode"
    },
    "dailyGoal": {
      "type": "integer",
      "minimum": 1,
      "default": 60,
      "description": "Tagesziel in Minuten"
    },
    "learningDays": {
      "type": "integer",
      "minimum": 1,
      "maximum": 7,
      "default": 5,
      "description": "Anzahl Lerntage pro Woche"
    },
    "fontSize": {
      "type": "integer",
      "minimum": 12,
      "maximum": 24,
      "default": 16,
      "description": "Schriftgröße in Pixel"
    },
    "themeMode": {
      "type": "string",
      "enum": ["dark", "light", "auto"],
      "default": "dark",
      "description": "Theme-Modus"
    },
    "pomoWork": {
      "type": "integer",
      "minimum": 1,
      "maximum": 120,
      "default": 25,
      "description": "Pomodoro Arbeitszeit in Minuten"
    },
    "pomoShortBreak": {
      "type": "integer",
      "minimum": 1,
      "maximum": 30,
      "default": 5,
      "description": "Pomodoro kurze Pause in Minuten"
    },
    "pomoLongBreak": {
      "type": "integer",
      "minimum": 1,
      "maximum": 60,
      "default": 15,
      "description": "Pomodoro lange Pause in Minuten"
    },
    "pomoLongBreakInterval": {
      "type": "integer",
      "minimum": 1,
      "maximum": 10,
      "default": 4,
      "description": "Pomodoro-Intervall für lange Pause"
    },
    "pomoAutoBreak": {
      "type": "boolean",
      "default": true,
      "description": "Automatischer Start der Pause"
    },
    "pomoAutoWork": {
      "type": "boolean",
      "default": false,
      "description": "Automatischer Start der Arbeitsphase"
    }
  }
}
```

### Beispiel

```json
{
  "darkMode": true,
  "dailyGoal": 60,
  "learningDays": 5,
  "fontSize": 16,
  "themeMode": "dark",
  "pomoWork": 25,
  "pomoShortBreak": 5,
  "pomoLongBreak": 15,
  "pomoLongBreakInterval": 4,
  "pomoAutoBreak": true,
  "pomoAutoWork": false
}
```

---

## Semester Modell

Repräsentiert ein akademisches Semester mit zugehörigen Modulen.

### Feldbeschreibung

| Feld | Typ | Pflicht | Standard | Beschreibung |
|------|-----|---------|----------|--------------|
| `id` | `string` | Ja | - | Eindeutige ID (timestamp-basiert) |
| `name` | `string` | Ja | - | Anzeigename des Semesters |
| `start` | `string` | Ja | - | Startdatum im Format `YYYY-MM-DD` |
| `end` | `string` | Ja | - | Enddatum im Format `YYYY-MM-DD` |
| `modules` | `Module[]` | Nein | `[]` | Array der Module |

### JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Semester",
  "type": "object",
  "required": ["id", "name", "start", "end"],
  "properties": {
    "id": {
      "type": "string",
      "description": "Eindeutiger Identifikator"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "description": "Name des Semesters"
    },
    "start": {
      "type": "string",
      "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
      "description": "Startdatum im Format YYYY-MM-DD"
    },
    "end": {
      "type": "string",
      "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
      "description": "Enddatum im Format YYYY-MM-DD"
    },
    "modules": {
      "type": "array",
      "items": { "$ref": "#/definitions/Module" },
      "description": "Module des Semesters"
    }
  },
  "definitions": {
    "Module": {
      "type": "object",
      "required": ["id", "name"],
      "properties": {
        "id": { "type": "string" },
        "subjectId": { "type": ["string", "null"] },
        "name": { "type": "string" },
        "code": { "type": "string" },
        "ects": { "type": "number" },
        "hours": { "type": "number" },
        "examPeriod": { "type": "string" },
        "examDate": { "type": "string" },
        "notes": { "type": "string" }
      }
    }
  }
}
```

### Beispiel

```json
{
  "id": "1712505600000",
  "name": "2. Semester (Kernstudium) - 2026",
  "start": "2026-04-01",
  "end": "2026-09-30",
  "modules": []
}
```

---

## Module Modell

Repräsentiert ein einzelnes Studienmodul innerhalb eines Semesters.

### Feldbeschreibung

| Feld | Typ | Pflicht | Standard | Beschreibung |
|------|-----|---------|----------|--------------|
| `id` | `string` | Ja | - | Eindeutige ID (timestamp-basiert) |
| `subjectId` | `string \| null` | Nein | `null` | Verknüpfung zum Fach (optional) |
| `name` | `string` | Ja | - | Vollständiger Modulname |
| `code` | `string` | Nein | `""` | Modulcode (z.B. "52111") |
| `ects` | `number` | Nein | `0` | Credits nach ECTS |
| `hours` | `number` | Nein | `0` | Gesamtarbeitsstunden (Workload) |
| `examPeriod` | `string` | Nein | `""` | Prüfungszeitraum (YYYY-MM-DD) |
| `examDate` | `string` | Nein | `""` | Prüfungsdatum (YYYY-MM-DD) |
| `notes` | `string` | Nein | `""` | Modulnotizen/Beschreibung |

### JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Module",
  "type": "object",
  "required": ["id", "name"],
  "properties": {
    "id": {
      "type": "string",
      "description": "Eindeutiger Identifikator"
    },
    "subjectId": {
      "type": ["string", "null"],
      "description": "Optionale Verknüpfung zum Fach"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "description": "Vollständiger Modulname"
    },
    "code": {
      "type": "string",
      "description": "Modulnummer (z.B. 52111)"
    },
    "ects": {
      "type": "number",
      "minimum": 0,
      "description": "ECTS-Punkte"
    },
    "hours": {
      "type": "number",
      "minimum": 0,
      "description": "Gesamtarbeitsstunden"
    },
    "examPeriod": {
      "type": "string",
      "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
      "description": "Prüfungszeitraum (Datum)"
    },
    "examDate": {
      "type": "string",
      "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
      "description": "Prüfungsdatum"
    },
    "notes": {
      "type": "string",
      "description": "Modulbeschreibung und Notizen"
    }
  }
}
```

### Beispiel

```json
{
  "id": "1712505600001",
  "subjectId": "1",
  "name": "Höhere Mathematik 2 für ET",
  "code": "52111",
  "ects": 5,
  "hours": 150,
  "examPeriod": "2026-07-14",
  "examDate": "2026-07-28",
  "notes": "Differenzial- und Integralrechnung mehrerer Veränderlicher, Differenzialgleichungen"
}
```

---

## Timer-State (Persistiert)

Der Timer-Zustand wird in `localStorage` gespeichert, um bei Seitenreload fortgesetzt werden zu können.

### Feldbeschreibung

| Feld | Typ | Pflicht | Standard | Beschreibung |
|------|-----|---------|----------|--------------|
| `isRunning` | `boolean` | Nein | `false` | Zeigt an, ob Timer läuft |
| `seconds` | `number` | Nein | `0` | Aktuelle Sekunden im Timer |
| `subjectId` | `string` | Nein | `null` | Aktives Fach |
| `timestamp` | `number` | Nein | - | Zeitstempel beim Start |
| `pomodoroMode` | `boolean` | Nein | `false` | Pomodoro-Modus aktiv |
| `pomodoroPhase` | `string` | Nein | `"work"` | Aktuelle Phase: `"work"`, `"shortBreak"`, `"longBreak"` |
| `pomodoroCount` | `number` | Nein | `0` | Anzahl absolvierter Pomodoros |
| `pomodoroCountdown` | `number` | Nein | `0` | Countdown in Sekunden |
| `pomodoroWorkSeconds` | `number` | Nein | `0` | Arbeitssekunden dieses Pomodoros |

### JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "TimerState",
  "type": "object",
  "properties": {
    "isRunning": {
      "type": "boolean",
      "description": "Zeigt an, ob Timer läuft"
    },
    "seconds": {
      "type": "integer",
      "minimum": 0,
      "description": "Aktuelle Sekunden im Timer"
    },
    "subjectId": {
      "type": "string",
      "description": "Aktives Fach"
    },
    "timestamp": {
      "type": "integer",
      "description": "Zeitstempel beim Start (Unix ms)"
    },
    "pomodoroMode": {
      "type": "boolean",
      "description": "Pomodoro-Modus aktiv"
    },
    "pomodoroPhase": {
      "type": "string",
      "enum": ["work", "shortBreak", "longBreak"],
      "description": "Aktuelle Pomodoro-Phase"
    },
    "pomodoroCount": {
      "type": "integer",
      "minimum": 0,
      "description": "Anzahl absolvierter Pomodoros"
    },
    "pomodoroCountdown": {
      "type": "integer",
      "minimum": 0,
      "description": "Countdown in Sekunden"
    },
    "pomodoroWorkSeconds": {
      "type": "integer",
      "minimum": 0,
      "description": "Arbeitssekunden dieses Pomodoros"
    }
  }
}
```

### Beispiel

```json
{
  "isRunning": true,
  "seconds": 1523,
  "subjectId": "1",
  "timestamp": 1715092800000,
  "pomodoroMode": true,
  "pomodoroPhase": "work",
  "pomodoroCount": 2,
  "pomodoroCountdown": 600,
  "pomodoroWorkSeconds": 600
}
```

---

## Dateninitialisierung und Seeding

Beim ersten Start der Anwendung werden Standarddaten erstellt, wenn der Speicher leer ist.

### Initialisierungslogik (`init()`)

```javascript
init() {
    // 1. Subjects: Seed wenn leer oder corrupt
    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
        this._save(this.STORAGE_KEYS.SUBJECTS, defaultSubjects);
    }

    // 2. Settings: Seed wenn nicht vorhanden
    if (!storedSettings) {
        this._save(this.STORAGE_KEYS.SETTINGS, defaults);
    } else {
        // Migration für fehlende Felder
    }

    // 3. Semesters: Seed wenn leer
    if (!storedSemesters) {
        this.initDefaultSemester();
    } else {
        // Migrationen ausführen
    }
}
```

### Standard-Fächer

Beim ersten Start werden folgende Fächer erstellt:

| ID | Name | Farbe | Wochenziel |
|----|------|-------|------------|
| 1 | Höhere Mathematik 2 | `bg-blue-500` | 6 Stunden |
| 2 | GET2 | `bg-green-500` | 8 Stunden |
| 3 | Physik | `bg-purple-500` | 8 Stunden |
| 4 | Bauelemente | `bg-orange-500` | 8 Stunden |
| 5 | Digitaltechnik | `bg-red-500` | 5 Stunden |

```json
[
  { "id": "1", "name": "Höhere Mathematik 2", "color": "bg-blue-500", "weeklyGoal": 6 },
  { "id": "2", "name": "GET2", "color": "bg-green-500", "weeklyGoal": 8 },
  { "id": "3", "name": "Physik", "color": "bg-purple-500", "weeklyGoal": 8 },
  { "id": "4", "name": "Bauelemente", "color": "bg-orange-500", "weeklyGoal": 8 },
  { "id": "5", "name": "Digitaltechnik", "color": "bg-red-500", "weeklyGoal": 5 }
]
```

### Standard-Semester (FH Aachen ET 2. Semester)

```json
{
  "id": "1712505600000",
  "name": "2. Semester (Kernstudium) - 2026",
  "start": "2026-04-01",
  "end": "2026-09-30",
  "modules": [
    {
      "id": "1712505600001",
      "subjectId": "1",
      "name": "Höhere Mathematik 2 für ET",
      "code": "52111",
      "ects": 5,
      "hours": 150,
      "examPeriod": "2026-07-14",
      "examDate": "2026-07-28",
      "notes": "Differenzial- und Integralrechnung mehrerer Veränderlicher, Differenzialgleichungen, Fourier- und Laplace-Transformation, Grundlagen der Wahrscheinlichkeitsrechnung und Statistik"
    },
    {
      "id": "1712505600002",
      "subjectId": "2",
      "name": "Grundgebiete der Elektrotechnik 2",
      "code": "52102",
      "ects": 7,
      "hours": 210,
      "examPeriod": "2026-07-14",
      "examDate": "2026-07-28",
      "notes": "Elektrisches Feld, Magnetisches Feld, Induktionsgesetz, Wechselstrom"
    },
    {
      "id": "1712505600003",
      "subjectId": "3",
      "name": "Physik",
      "code": "52103",
      "ects": 7,
      "hours": 210,
      "examPeriod": "2026-07-14",
      "examDate": "2026-07-24",
      "notes": "Mechanik, Thermodynamik, Elektrodynamik, Optik, Festkörperphysik"
    },
    {
      "id": "1712505600004",
      "subjectId": "4",
      "name": "Bauelemente und Grundschaltungen",
      "code": "52112",
      "ects": 7,
      "hours": 210,
      "examPeriod": "2026-07-14",
      "examDate": "2026-07-20",
      "notes": "Halbleiter, Dioden, Transistoren, Operationsverstärker"
    },
    {
      "id": "1712505600005",
      "subjectId": "5",
      "name": "Digitaltechnik",
      "code": "52107",
      "ects": 4,
      "hours": 120,
      "examPeriod": "2026-07-14",
      "examDate": "2026-07-28",
      "notes": "Boolesche Algebra, Karnaugh-Veitch-Diagramm, Flip-Flops, Schaltnetze, Schaltwerke"
    }
  ]
}
```

### Standard-Einstellungen

```json
{
  "darkMode": true,
  "dailyGoal": 60,
  "learningDays": 5,
  "fontSize": 16,
  "themeMode": "dark"
}
```

### Migrationen

Die `init()`-Methode führt automatisch Migrationen durch, um bestehende Daten zu aktualisieren.

#### 1. `migrateModulesSubjectId()`

Verknüpft bestehende Module automatisch mit Fächern basierend auf dem Namen:

| Stichwort | Zugehöriges Fach |
|-----------|------------------|
| `GET2`, `elektrotechnik` | GET2 |
| `HM`, `mathematik` | Höhere Mathematik 2 |

```javascript
// Beispiel-Mapping-Logik
const subjectMappings = [
    { keywords: ['GET2', 'elektrotechnik'], subjectId: '2' },
    { keywords: ['HM', 'mathematik'], subjectId: '1' }
];
```

#### 2. `migrateExamDates()`

Setzt Prüfungsdaten basierend auf einem festen Mapping:

```javascript
const examDateMap = {
    'Höhere Mathematik 2': '2026-07-28',
    'Grundgebiete der Elektrotechnik 2': '2026-07-28',
    'Physik': '2026-07-24',
    'Bauelemente': '2026-07-20',
    'Digitaltechnik': '2026-07-28'
};
```

#### 3. Settings-Migration

Fügt fehlende Felder (`fontSize`, `themeMode`) zu bestehenden Einstellungen hinzu und markiert `darkMode` als veraltet.
