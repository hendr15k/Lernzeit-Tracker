# Datenmodelle und Speicherstruktur

> **Hinweis:** Diese Dokumentation ist Teil der [Projektdokumentation](./README.md).
> Siehe auch: [01-Architecture.md](./01-Architecture.md) für die architektonische Einordnung.

---

## Inhaltsverzeichnis

1. [StorageManager Klasse](#storagemanager-klasse)
2. [localStorage Schlüsselstruktur](#localstorage-schlüsselstruktur)
3. [Entry Modell](#entry-modell-lernsitzung)
4. [Subject Modell](#subject-modell-fach)
5. [Settings Modell](#settings-modell-einstellungen)
6. [Semester Modell](#semester-modell)
7. [Module Modell](#module-modell)
8. [Timer-State](#timer-state-persistiert)
9. [Dateninitialisierung und Seeding](#dateninitialisierung-und-seeding)

---

## 1. StorageManager Klasse

Die `StorageManager`-Klasse bildet die **zentrale Schnittstelle** für alle Datenzugriffe in der Anwendung. Sie abstrahiert den Zugriff auf `localStorage` und bietet konsistente CRUD-Operationen für alle Datenmodelle.

Siehe auch: [06-API-Reference.md](./06-API-Reference.md#windowstoragemanager) für die vollständige API-Referenz.

### 1.1 Konstruktor und Initialisierung

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

### 1.2 Öffentliche Methoden

| Methode | Rückgabetyp | Beschreibung |
|---------|-------------|--------------|
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

### 1.3 Private Hilfsmethoden

| Methode | Rückgabetyp | Beschreibung |
|---------|-------------|--------------|
| `_save(key, data)` | `void` | Speichert Daten in localStorage mit Fehlerbehandlung |
| `_load(key)` | `any` | Lädt Daten aus localStorage |
| `migrateModulesSubjectId()` | `void` | Migriert Module ohne subjectId anhand des Namens |
| `migrateExamDates()` | `void` | Migriert Prüfungsdaten basierend auf Mapping |
| `initDefaultSemester()` | `void` | Erstellt Standard-Semester für FH Aachen ET |

### 1.4 Fehlerbehandlung

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

## 2. localStorage Schlüsselstruktur

Die Anwendung verwendet vier **primäre Schlüssel** in localStorage:

| Schlüssel | Datentyp | Beschreibung |
|-----------|----------|--------------|
| `lernzeit_entries` | `Entry[]` | Array aller Lernsitzungen |
| `lernzeit_subjects` | `Subject[]` | Array aller Fächer |
| `lernzeit_settings` | `Settings` | Einstellungsobjekt |
| `lernzeit_semesters` | `Semester[]` | Array aller Semester |

### 2.1 Zusätzliche lokale Schlüssel

| Schlüssel | Datentyp | Beschreibung |
|-----------|----------|--------------|
| `timer_state` | `TimerState` | Aktueller Timer-Zustand (persistiert über Reload) |
| `timer_notes` | `string` | Aktuelle Timer-Notizen |
| `pwa_banner_dismissed` | `string` | Boolean als String für PWA-Banner-Status |

---

## 3. Entry Modell (Lernsitzung)

Repräsentiert eine einzelne Lernsitzung mit Zeitmessung.

### 3.1 Feldbeschreibung

| Feld | Typ | Pflicht | Standardwert | Beschreibung |
|------|-----|---------|--------------|--------------|
| `id` | `string` | Ja | - | Eindeutige ID (timestamp-basiert via `Date.now()`) |
| `subjectId` | `string` | Ja | - | Referenz zum zugehörigen Fach |
| `duration` | `number` | Ja | - | Dauer in **Sekunden** |
| `startTime` | `number` | Ja | - | Startzeit als Unix-Timestamp in Millisekunden |
| `endTime` | `number` | Ja | - | Endzeit als Unix-Timestamp in Millisekunden |
| `notes` | `string` | Nein | `""` | Freitext-Notizen zur Sitzung |
| `topics` | `string` | Nein | `""` | Behandelte Themen (kommasepariert) |

### 3.2 JSON Schema

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

### 3.3 Beispiel

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

### 3.4 Berechnungen

Aus den Entry-Daten können folgende Werte berechnet werden:

| Berechnung | Formel | Beispiel |
|------------|--------|---------|
| Dauer in Minuten | `duration / 60` | `3600 / 60 = 60` |
| Dauer in Stunden | `duration / 3600` | `3600 / 3600 = 1` |
| Datum | `new Date(startTime)` | `Date` Objekt |
| Wochentag | `new Date(startTime).getDay()` | `0-6` (So-Sa) |

---

## 4. Subject Modell (Fach)

Repräsentiert ein Studienfach mit Farbcodierung und Wochenziel.

### 4.1 Feldbeschreibung

| Feld | Typ | Pflicht | Standardwert | Beschreibung |
|------|-----|---------|--------------|--------------|
| `id` | `string` | Ja | - | Eindeutige ID (timestamp-basiert) |
| `name` | `string` | Ja | - | Anzeigename des Fachs |
| `color` | `string` | Ja | - | CSS-Klasse für Farbdarstellung (Tailwind) |
| `weeklyGoal` | `number` | Nein | `0` | Wochenziel in Stunden |

### 4.2 Farbcodierung

Die Farbe wird als **Tailwind CSS-Klasse** angegeben:

| Klasse | Farbe | Standard für |
|--------|-------|--------------|
| `bg-blue-500` | Blau | Mathematik |
| `bg-green-500` | Grün | GET |
| `bg-purple-500` | Violett | Physik |
| `bg-orange-500` | Orange | Elektrotechnik |
| `bg-red-500` | Rot | Digitaltechnik |
| `bg-yellow-500` | Gelb | Alternative |
| `bg-pink-500` | Pink | Alternative |
| `bg-indigo-500` | Indigo | Alternative |
| `bg-teal-500` | Türkis | Alternative |

### 4.3 JSON Schema

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

### 4.4 Beispiel

```json
{
  "id": "1",
  "name": "Höhere Mathematik 2",
  "color": "bg-blue-500",
  "weeklyGoal": 6
}
```

---

## 5. Settings Modell (Einstellungen)

Enthält alle globalen Anwendungseinstellungen.

### 5.1 Feldbeschreibung

| Feld | Typ | Pflicht | Standardwert | Min | Max | Beschreibung |
|------|-----|---------|--------------|-----|-----|--------------|
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

### 5.2 Theme-Modi

| Modus | Beschreibung |
|-------|--------------|
| `"dark"` | Immer dunkles Theme |
| `"light"` | Immer helles Theme |
| `"auto"` | Folgt dem System-Theme (`prefers-color-scheme`) |

### 5.3 JSON Schema

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

### 5.4 Beispiel

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

## 6. Semester Modell

Repräsentiert ein akademisches Semester mit zugehörigen Modulen.

### 6.1 Feldbeschreibung

| Feld | Typ | Pflicht | Standardwert | Beschreibung |
|------|-----|---------|--------------|--------------|
| `id` | `string` | Ja | - | Eindeutige ID (timestamp-basiert) |
| `name` | `string` | Ja | - | Anzeigename des Semesters |
| `start` | `string` | Ja | - | Startdatum im Format `YYYY-MM-DD` |
| `end` | `string` | Ja | - | Enddatum im Format `YYYY-MM-DD` |
| `modules` | `Module[]` | Nein | `[]` | Array der Module |

### 6.2 JSON Schema

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

### 6.3 Beispiel

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

## 7. Module Modell

Repräsentiert ein einzelnes Studienmodul innerhalb eines Semesters.

### 7.1 Feldbeschreibung

| Feld | Typ | Pflicht | Standardwert | Beschreibung |
|------|-----|---------|--------------|--------------|
| `id` | `string` | Ja | - | Eindeutige ID (timestamp-basiert) |
| `subjectId` | `string \| null` | Nein | `null` | Verknüpfung zum Fach (optional) |
| `name` | `string` | Ja | - | Vollständiger Modulname |
| `code` | `string` | Nein | `""` | Modulcode (z.B. "52111") |
| `ects` | `number` | Nein | `0` | Credits nach ECTS |
| `hours` | `number` | Nein | `0` | Gesamtarbeitsstunden (Workload) |
| `examPeriod` | `string` | Nein | `""` | Prüfungszeitraum (Datum) |
| `examDate` | `string` | Nein | `""` | Prüfungsdatum |
| `notes` | `string` | Nein | `""` | Modulnotizen/Beschreibung |

### 7.2 JSON Schema

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

### 7.3 Beispiel

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

## 8. Timer-State (Persistiert)

Der Timer-Zustand wird in `localStorage` gespeichert, um bei Seitenreload fortgesetzt werden zu können.

### 8.1 Feldbeschreibung

| Feld | Typ | Pflicht | Standardwert | Beschreibung |
|------|-----|---------|--------------|--------------|
| `isRunning` | `boolean` | Nein | `false` | Zeigt an, ob Timer läuft |
| `seconds` | `number` | Nein | `0` | Aktuelle Sekunden im Timer |
| `subjectId` | `string` | Nein | `null` | Aktives Fach |
| `timestamp` | `number` | Nein | - | Zeitstempel beim Start |
| `pomodoroMode` | `boolean` | Nein | `false` | Pomodoro-Modus aktiv |
| `pomodoroPhase` | `string` | Nein | `"work"` | Aktuelle Phase: `"work"`, `"shortBreak"`, `"longBreak"` |
| `pomodoroCount` | `number` | Nein | `0` | Anzahl absolvierter Pomodoros |
| `pomodoroCountdown` | `number` | Nein | `0` | Countdown in Sekunden |
| `pomodoroWorkSeconds` | `number` | Nein | `0` | Arbeitssekunden dieses Pomodoros |

Siehe auch: [02-Timer.md](./02-Timer.md) für vollständige Timer-Dokumentation.

### 8.2 JSON Schema

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

### 8.3 Beispiel

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

## 9. Dateninitialisierung und Seeding

Beim ersten Start der Anwendung werden Standarddaten erstellt, wenn der Speicher leer ist.

### 9.1 Initialisierungslogik (`init()`)

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

### 9.2 Standard-Fächer

Beim ersten Start werden folgende Fächer erstellt:

| ID | Name | Farbe | Wochenziel (Std.) |
|----|------|-------|-------------------|
| 1 | Höhere Mathematik 2 | `bg-blue-500` | 6 |
| 2 | GET2 | `bg-green-500` | 8 |
| 3 | Physik | `bg-purple-500` | 8 |
| 4 | Bauelemente | `bg-orange-500` | 8 |
| 5 | Digitaltechnik | `bg-red-500` | 5 |

### 9.3 Standard-Semester (FH Aachen ET 2. Semester)

Das Standard-Semester enthält Module für das aktuelle Sommersemester mit Prüfungsdaten der FH Aachen.

### 9.4 Migrationen

Die `init()`-Methode führt automatisch Migrationen durch, um bestehende Daten zu aktualisieren.

#### 9.4.1 `migrateModulesSubjectId()`

Verknüpft bestehende Module automatisch mit Fächern basierend auf dem Namen:

| Stichwort | Zugehöriges Fach |
|-----------|------------------|
| `GET2`, `elektrotechnik` | GET2 |
| `HM`, `mathematik` | Höhere Mathematik 2 |

#### 9.4.2 `migrateExamDates()`

Setzt Prüfungsdaten basierend auf einem festen Mapping.

#### 9.4.3 Settings-Migration

Fügt fehlende Felder (`fontSize`, `themeMode`) zu bestehenden Einstellungen hinzu und markiert `darkMode` als veraltet.

---

*Siehe auch: [01-Architecture.md](./01-Architecture.md) | [06-API-Reference.md](./06-API-Reference.md)*
