# Datenmodelle und Speicherstruktur

## Inhaltsverzeichnis

1. [StorageManager Klasse](#storagemanager-klasse)
2. [localStorage Schlüsselstruktur](#localstorage-schlüsselstruktur)
3. [Entry Modell (Lernsitzung)](#entry-modell-lernsitzung)
4. [Subject Modell (Fach)](#subject-modell-fach)
5. [Settings Modell (Einstellungen)](#settings-modell-einstellungen)
6. [Semester Modell](#semester-modell)
7. [Module Modell](#module-modell)
8. [Dateninitialisierung und Seeding](#dateninitialisierung-und-seeding)

---

## StorageManager Klasse

Die `StorageManager` Klasse ist die zentrale Schnittstelle für alle Datenzugriffe in der Anwendung. Sie abstrahiert den Zugriff auf `localStorage` und bietet CRUD-Operationen für alle Datenmodelle.

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

| Methode | Beschreibung |
|---------|--------------|
| `init()` | Initialisiert alle Daten mit Standardwerten falls leer |
| `getEntries()` | Gibt alle Lernsitzungen zurück |
| `addEntry(entry)` | Fügt eine neue Lernsitzung hinzu |
| `updateEntry(entry)` | Aktualisiert eine bestehende Lernsitzung |
| `deleteEntry(id)` | Löscht eine Lernsitzung |
| `getSubjects()` | Gibt alle Fächer zurück |
| `addSubject(subject)` | Fügt ein neues Fach hinzu |
| `updateSubject(subject)` | Aktualisiert ein bestehendes Fach |
| `deleteSubject(id)` | Löscht ein Fach |
| `getSettings()` | Gibt die aktuellen Einstellungen zurück |
| `updateSettings(settings)` | Aktualisiert die Einstellungen |
| `getSemesters()` | Gibt alle Semester zurück |
| `addSemester(semester)` | Fügt ein neues Semester hinzu |
| `updateSemester(semester)` | Aktualisiert ein bestehendes Semester |
| `deleteSemester(id)` | Löscht ein Semester |
| `addModule(semesterId, module)` | Fügt ein Modul zu einem Semester hinzu |
| `updateModule(semesterId, module)` | Aktualisiert ein Modul |
| `deleteModule(semesterId, moduleId)` | Löscht ein Modul |

### Private Hilfsmethoden

| Methode | Beschreibung |
|---------|--------------|
| `_save(key, data)` | Speichert Daten in localStorage mit Fehlerbehandlung |
| `migrateModulesSubjectId()` | Migriert Module ohne subjectId |
| `migrateExamDates()` | Migriert Prüfungsdaten |
| `initDefaultSemester()` | Erstellt Standard-Semester für FH Aachen ET |

### Error Handling

Die `_save()` Methode fängt Speicherfehler ab und zeigt dem Benutzer einen Toast mit Fehlermeldung:

```javascript
_save(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error(`Error saving to ${key}:`, e);
        window.showToast('Fehler beim Speichern! Möglicherweise ist der Speicher voll.', 'error');
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

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| `id` | `string` | Ja | Eindeutige ID (timestamp-basiert) |
| `subjectId` | `string` | Ja | Referenz zum Fach |
| `duration` | `number` | Ja | Dauer in **Sekunden** |
| `startTime` | `number` | Ja | Startzeit als Unix-Timestamp (ms) |
| `endTime` | `number` | Ja | Endzeit als Unix-Timestamp (ms) |
| `notes` | `string` | Nein | Freitext-Notizen zur Sitzung |
| `topics` | `string` | Nein | Behandelte Themen (kommasepariert) |

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
      "description": "Eindeutige Identifikator (basierend auf Date.now())"
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

- **Dauer in Minuten**: `duration / 60`
- **Dauer in Stunden**: `duration / 3600`
- **Datum**: `new Date(startTime)`
- **Wochentag**: `new Date(startTime).getDay()`

---

## Subject Modell (Fach)

Repräsentiert ein Studienfach mit Farbcodierung und Wochenziel.

### Feldbeschreibung

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| `id` | `string` | Ja | Eindeutige ID (timestamp-basiert) |
| `name` | `string` | Ja | Name des Fachs |
| `color` | `string` | Ja | CSS-Klasse für Farbdarstellung (Tailwind) |
| `weeklyGoal` | `number` | Nein | Wochenziel in Stunden |

### Farbcodierung

Die Farbe wird als Tailwind CSS-Klasse angegeben:

| Klasse | Farbe |
|--------|-------|
| `bg-blue-500` | Blau |
| `bg-green-500` | Grün |
| `bg-purple-500` | Violett |
| `bg-orange-500` | Orange |
| `bg-red-500` | Rot |
| `bg-yellow-500` | Gelb |
| `bg-pink-500` | Pink |
| `bg-indigo-500` | Indigo |
| `bg-teal-500` | Türkis |

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
      "description": "Eindeutige Identifikator"
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

| Feld | Typ | Pflicht | Standard | Beschreibung |
|------|-----|---------|----------|--------------|
| `darkMode` | `boolean` | Nein | `true` | Dunkelmodus (veraltet, nutze `themeMode`) |
| `dailyGoal` | `number` | Nein | `60` | Tagesziel in **Minuten** |
| `learningDays` | `number` | Nein | `5` | Lerntage pro Woche (1-7) |
| `fontSize` | `number` | Nein | `16` | Schriftgröße in Pixel |
| `themeMode` | `string` | Nein | `"dark"` | Theme-Modus: `"dark"`, `"light"` oder `"auto"` |
| `pomoWork` | `number` | Nein | `25` | Pomodoro Arbeitszeit in Minuten |
| `pomoShortBreak` | `number` | Nein | `5` | Pomodoro kurze Pause in Minuten |
| `pomoLongBreak` | `number` | Nein | `15` | Pomodoro lange Pause in Minuten |
| `pomoLongBreakInterval` | `number` | Nein | `4` | Anzahl Pomodoros bis zur langen Pause |
| `pomoAutoBreak` | `boolean` | Nein | `true` | Automatischer Start der Pause |
| `pomoAutoWork` | `boolean` | Nein | `false` | Automatischer Start der Arbeitsphase |

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

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| `id` | `string` | Ja | Eindeutige ID (timestamp-basiert) |
| `name` | `string` | Ja | Name des Semesters |
| `start` | `string` | Ja | Startdatum (YYYY-MM-DD) |
| `end` | `string` | Ja | Enddatum (YYYY-MM-DD) |
| `modules` | `Module[]` | Nein | Array der Module (Standard: leer) |

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
      "description": "Eindeutige Identifikator"
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

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| `id` | `string` | Ja | Eindeutige ID (timestamp-basiert) |
| `subjectId` | `string` | Nein | Zugehörige Fach-ID (optional, für Verknüpfung) |
| `name` | `string` | Ja | Modulname |
| `code` | `string` | Nein | Modulcode (z.B. "52111") |
| `ects` | `number` | Nein | Credits nach ECTS |
| `hours` | `number` | Nein | Gesamtstunden (Workload) |
| `examPeriod` | `string` | Nein | Prüfungszeitraum (YYYY-MM-DD) |
| `examDate` | `string` | Nein | Prüfungsdatum (YYYY-MM-DD) |
| `notes` | `string` | Nein | Modulnotizen/Beschreibung |

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
      "description": "Eindeutige Identifikator"
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

## Dateninitialisierung und Seeding

Beim ersten Start der Anwendung werden Standarddaten erstellt.

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

```json
[
  {
    "id": "1",
    "name": "Höhere Mathematik 2",
    "color": "bg-blue-500",
    "weeklyGoal": 6
  },
  {
    "id": "2",
    "name": "GET2",
    "color": "bg-green-500",
    "weeklyGoal": 8
  },
  {
    "id": "3",
    "name": "Physik",
    "color": "bg-purple-500",
    "weeklyGoal": 8
  },
  {
    "id": "4",
    "name": "Bauelemente",
    "color": "bg-orange-500",
    "weeklyGoal": 8
  },
  {
    "id": "5",
    "name": "Digitaltechnik",
    "color": "bg-red-500",
    "weeklyGoal": 5
  }
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

Die `init()` Methode führt automatisch Migrationen durch:

#### 1. `migrateModulesSubjectId()`

Verknüpft bestehende Module automatisch mit Fächern basierend auf dem Namen:

```javascript
// Matcht "GET2" mit "elektrotechnik" im Modulnamen
// Matcht "HM" mit "mathematik" im Modulnamen
```

#### 2. `migrateExamDates()`

Setzt Prüfungsdaten basierend auf einem Mapping:

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

Fügt fehlende Felder (`fontSize`, `themeMode`) zu bestehenden Einstellungen hinzu.

---

## Timer-State (Persistiert)

Der Timer-Zustand wird in `localStorage` gespeichert, um bei Seitenreload fortgesetzt werden zu können:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "TimerState",
  "type": "object",
  "properties": {
    "isRunning": { "type": "boolean" },
    "seconds": { "type": "integer" },
    "subjectId": { "type": "string" },
    "timestamp": { "type": "integer" },
    "pomodoroMode": { "type": "boolean" },
    "pomodoroPhase": { "type": "string", "enum": ["work", "shortBreak", "longBreak"] },
    "pomodoroCount": { "type": "integer" },
    "pomodoroCountdown": { "type": "integer" },
    "pomodoroWorkSeconds": { "type": "integer" }
  }
}
```
