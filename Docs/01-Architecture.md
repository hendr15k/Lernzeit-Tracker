# Lernzeit-Tracker — Technische Architektur

## 1. Projektübersicht

Der **Lernzeit-Tracker** ist eine Progressive Web App (PWA) zur Erfassung, Visualisierung und Analyse von Lernzeiten für Studierende. Die Anwendung ermöglicht das Tracking von Lernsitzungen mittels Timer oder manueller Eingabe, die Verwaltung von Fächern und Semestern, sowie umfangreiche Statistiken und Visualisierungen.

**Hauptziele:**
- Mobile-first Design mit Touch-optimierter Oberfläche
- Offline-Fähigkeit durch Service Worker
- Lokale Datenspeicherung ohne Backend-Abhängigkeit
- Umfassende Statistiken und Gamification (Achievements, Streaks)

## 2. Technologie-Stack

### Frontend-Frameworks & Bibliotheken
| Technologie | Version | Verwendung |
|-------------|---------|------------|
| Tailwind CSS | CDN | Utility-First CSS-Framework für Styling |
| Lucide Icons | 0.473.0 | SVG-Icon-Bibliothek |

### Build & Testing
| Technologie | Verwendung |
|-------------|------------|
| Playwright | E2E-Tests für Mobile-Responsivität |
| serve | Lokaler Entwicklungsserver |

### Datenpersistenz
| Technologie | Beschreibung |
|-------------|--------------|
| localStorage | Primärer Datenspeicher für alle App-Daten |
| JSON | Serialisierungsformat für Datensätze |

### PWA & Web APIs
| API | Verwendung |
|-----|------------|
| Service Worker | Offline-Caching und PWA-Funktionalität |
| Web App Manifest | PWA-Installation und Metadaten |
| Wake Lock API | Verhindert Display-Standby während Timer läuft |
| Web Audio API | Akustische Benachrichtigungen (Pomodoro) |

## 3. Verzeichnisstruktur

```
/root/github/Lernzeit-Tracker/
├── index.html              # Haupteinstiegspunkt
├── manifest.json           # PWA-Manifest
├── sw.js                   # Service Worker
├── style.css               # Globale CSS-Styles
├── app.js                  # Hauptlogik (UI, Timer, Views)
├── store.js                # Datenverwaltung (StorageManager)
├── package.json            # Node.js-Abhängigkeiten
├── playwright.config.js    # Playwright-Testkonfiguration
├── css/
│   └── toast.css           # Toast-Benachrichtigungs-Styles
├── tests/                  # Playwright-E2E-Tests
├── Docs/                   # Dokumentation
└── icons/                  # App-Icons (192x192, 512x512)
```

## 4. Modulare Architektur

### 4.1 Daten-Schicht: `store.js` (StorageManager-Klasse)

Der `StorageManager` bildet die Datenzentrale der Anwendung.

**Storage Keys:**
```javascript
{
    ENTRIES: 'lernzeit_entries',      // Lernsitzungen
    SUBJECTS: 'lernzeit_subjects',    // Fächer
    SETTINGS: 'lernzeit_settings',    # Benutzereinstellungen
    SEMESTERS: 'lernzeit_semesters'   // Semester & Module
}
```

**Kernmethoden:**
- `getEntries()` / `addEntry()` / `updateEntry()` / `deleteEntry()`
- `getSubjects()` / `addSubject()` / `updateSubject()` / `deleteSubject()`
- `getSettings()` / `updateSettings()`
- `getSemesters()` / `addSemester()` / `addModule()` / `updateModule()`

**Datenmodell:**

```javascript
// Entry (Lernsitzung)
{
    id: string,
    subjectId: string,
    startTime: timestamp,
    endTime: timestamp,
    duration: seconds,
    notes: string,
    topics: string
}

// Subject (Fach)
{
    id: string,
    name: string,
    color: string,      // Tailwind-Klasse
    weeklyGoal: number  // Stunden
}

// Semester
{
    id: string,
    name: string,
    start: date,
    end: date,
    modules: Module[]
}

// Module
{
    id: string,
    subjectId: string,
    name: string,
    code: string,
    ects: number,
    hours: number,
    examPeriod: string,
    examDate: date,
    grade: string,
    notes: string
}

// Settings
{
    dailyGoal: number,          // Minuten
    learningDays: number,
    fontSize: number,
    themeMode: 'light'|'dark'|'auto',
    pomoWork: number,
    pomoShortBreak: number,
    pomoLongBreak: number,
    pomoLongBreakInterval: number,
    pomoAutoBreak: boolean,
    pomoAutoWork: boolean
}
```

### 4.2 Präsentations-Schicht: `app.js`

Enthält alle UI-Logik, Event-Handler und View-Updates.

**Hauptkomponenten:**

| Funktion | Beschreibung |
|----------|--------------|
| `initNavigation()` | Bottom-Navigation und View-Switching |
| `initTimer()` | Timer/Stoppuhr mit Pomodoro-Modus |
| `initAddEntry()` | Manuelle Eintragserstellung |
| `initSettings()` | Einstellungen, Export/Import |
| `initSubjectManagement()` | Fach-Verwaltung |
| `initCalendarViews()` | Kalenderansichten (Tag/Woche/Monat) |
| `initSemesterHandlers()` | Semester/Modul-Verwaltung |
| `initTheme()` | Dark/Light/Auto Theme-Switching |
| `updateViews()` | Aktualisiert alle Dashboard-Widgets |

**Timer-Architektur:**

```
Timer States:
├── isTimerRunning: boolean
├── timerSeconds: number
├── pomodoroMode: boolean
└── pomodoroPhase: 'work' | 'shortBreak' | 'longBreak'

Timer Persistence:
├── timer_state (localStorage)
└── timer_notes (localStorage)
```

### 4.3 UI-Komponenten (index.html)

**Views:**
- `#view-dashboard` — Hauptübersicht mit Statistiken
- `#view-einheiten` — Chronologische Sitzungsliste
- `#view-faecher` — Fachverwaltung
- `#view-kalender` — Kalendarische Ansicht
- `#view-semester` — Semester- und Modulverwaltung

**Overlays (Bottom-Sheet-Style):**
- `#timer-overlay` — Timer-Steuerung
- `#add-entry-overlay` — Manuelle Eingabe
- `#add-subject-overlay` — Fach hinzufügen
- `#settings-overlay` — Einstellungen
- `#add-semester-overlay` — Semester-Verwaltung
- `#add-module-overlay` — Modul-Verwaltung

## 5. Architektonische Entscheidungen

### 5.1 Client-Only Architecture
**Entscheidung:** Kein Backend-Server erforderlich

**Begründung:**
- Maximale Privacy (alle Daten lokal)
- Keine Serverkosten
- Funktioniert vollständig offline
- Schnelle Entwicklung ohne API-Komplexität

**Kompromisse:**
- Keine Cross-Device-Synchronisation
- localStorage-Limit von ~5MB
- Keine server-seitigen Berechnungen

### 5.2 Dual-Mode Timer
**Entscheidung:** Stoppuhr-Modus (Frei) + Pomodoro-Countdown

Die Anwendung unterstützt zwei Timer-Modi:
- **Frei:** Stoppuhr ohne Zeitlimit
- **Pomodoro:** 25/5/15 Minuten-Zyklen mit automatischer Speicherung

### 5.3 CSS-First Styling
**Entscheidung:** Tailwind CSS via CDN

**Begründung:**
- Schnelle Iteration ohne Build-Prozess
- Konsistente Design-System-Prinzipien
- Kleine Bundle-Größe (nur genutzte Styles)

### 5.4 View-basierte Navigation
**Entscheidung:** Single-Page mit View-Toggling statt Routing

 Alle Views werden im DOM gerendert und per CSS-Classes (`hidden`) ein-/ausgeblendet. Dies vereinfacht die Architektur erheblich.

## 6. Datenfluss

```
┌─────────────────────────────────────────────────────────┐
│                      User Interface                      │
│  (index.html: Dashboard, Timer, Overlays, Navigation)   │
└─────────────────────────┬───────────────────────────────┘
                          │ Events (click, input, etc.)
                          ▼
┌─────────────────────────────────────────────────────────┐
│                      app.js                              │
│  • Event-Handler (initTimer, initAddEntry, etc.)        │
│  • View-Updates (updateViews, renderDashboard, etc.)    │
│  • State-Management (timerSeconds, isTimerRunning)      │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                     store.js                             │
│                  (StorageManager)                        │
│  • CRUD-Operationen für alle Entitäten                  │
│  • localStorage-Read/Write                              │
│  • Daten-Migration bei Schema-Änderungen                │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    localStorage                         │
│  • lernzeit_entries    • lernzeit_subjects              │
│  • lernzeit_settings   • lernzeit_semesters             │
│  • timer_state        • timer_notes                     │
└─────────────────────────────────────────────────────────┘
```

### Timer-Save-Cycle:
```
User startet Timer
    → startInterval() beginnt
    → saveState() alle 1s in localStorage
    → Wake Lock aktiviert
    
User stoppt Timer
    → entry-Objekt erstellt
    → storageManager.addEntry()
    → checkAchievements()
    → updateViews()
    → Wake Lock freigegeben
```

## 7. PWA-Architektur

### 7.1 Service Worker (`sw.js`)

**Cache-Strategie:** Cache-First

```javascript
// Install: Cache alle Assets
self.addEventListener('install', (e) => {
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS));
});

// Fetch: Cache-First oder Network-Fallback
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then(response => response || fetch(e.request))
    );
});

// Activate: Alte Caches löschen
```

**Gecachte Assets:**
- Lokale Dateien: `index.html`, `style.css`, `app.js`, `store.js`
- Externe CDN: Tailwind CSS, Lucide Icons
- App-Resources: Icons, Manifest

### 7.2 Manifest

```json
{
    "name": "Lernzeit Tracker",
    "short_name": "LernTracker",
    "start_url": "./index.html",
    "display": "standalone",
    "background_color": "#0f172a",
    "theme_color": "#3b82f6",
    "icons": [...]
}
```

### 7.3 Update-Mechanismus

```
1. SW prüft periodisch auf Updates (1x/Stunde)
2. Neue Version gefunden → installiert im Hintergrund
3. Banner zeigt "Update verfügbar"
4. Bei Bestätigung: SKIP_WAITING → neuer SW aktiv
5. window.location.reload() für sofortige Aktualisierung
```

### 7.4 Wake Lock

Der Wake Lock verhindert, dass das Display während aktiver Timer-Sessions in den Standby-Modus geht:

```javascript
// Aktivierung
navigator.wakeLock.request('screen')

// Automatische Reaktivierung bei Tab-Wechsel
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && isTimerRunning) {
        requestWakeLock();
    }
});
```

## 8. Widget-Architektur (Dashboard)

Das Dashboard besteht aus modularen Widgets:

| Widget | Datenquelle | Berechnung |
|--------|-------------|------------|
| Tagesziel-Ring | today's entries | (todaySeconds / dailyGoal) * circumference |
| Wochenübersicht | week entries | Balkendiagramm |
| Streak | entries per day | Consecutive days mit learning |
| Heatmap | 12 weeks entries | Farb-Intensität pro Tag |
| Achievements | entries, settings | Bedingungsprüfung |
| Prüfungs-Countdown | semesters.modules | days until examDate |
| Wochenstatistik | week entries | Summen, Durchschnitte |

## 9. Export/Import

### JSON-Export
Vollständiger Datensatz inkl. aller Entitäten und Metadaten.

### CSV-Export
Flache Tabellenstruktur für Tabellenkalkulations-Import.

### Import
Validiert Struktur, fragt Bestätigung, ersetzt lokale Daten.

---

*Letzte Aktualisierung: Version 2.0.0*
