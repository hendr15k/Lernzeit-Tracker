# Lernzeit-Tracker — Technische Architektur

## Inhaltsverzeichnis

1. [Projektübersicht](#1-projektübersicht)
2. [Technologie-Stack](#2-technologie-stack)
3. [Verzeichnisstruktur](#3-verzeichnisstruktur)
4. [Modulare Architektur](#4-modulare-architektur)
5. [Architektonische Entscheidungen](#5-architektonische-entscheidungen)
6. [Datenfluss](#6-datenfluss)
7. [PWA-Architektur](#7-pwa-architektur)
8. [Dashboard-Widgets](#8-dashboard-widgets)
9. [Achievements-System](#9-achievements-system)
10. [Export/Import](#10-exportimport)
11. [Anhang: Abkürzungen](#11-anhang-abkürzungen)

---

## 1. Projektübersicht

Der **Lernzeit-Tracker** ist eine Progressive Web App (PWA) zur Erfassung, Visualisierung und Analyse von Lernzeiten für Studierende. Die Anwendung ermöglicht das Tracking von Lernsitzungen mittels Timer oder manueller Eingabe, die Verwaltung von Fächern und Semestern, sowie umfangreiche Statistiken und Visualisierungen.

### Hauptziele

| Ziel | Beschreibung |
|------|--------------|
| **Mobile-first** | Touch-optimierte Oberfläche für Smartphone-Nutzung |
| **Offline-Fähigkeit** | Vollständige Funktionalität ohne Internetverbindung |
| **Datensouveränität** | Lokale Datenspeicherung ohne Backend-Abhängigkeit |
| **Motivation** | Gamification mit Achievements und Streaks |

---

## 2. Technologie-Stack

### 2.1 Frontend-Frameworks & Bibliotheken

| Technologie | Version | Verwendung |
|-------------|---------|------------|
| Tailwind CSS | CDN (3.x) | Utility-First CSS-Framework für Styling |
| Lucide Icons | 0.473.0 | Leichtgewichtige SVG-Icon-Bibliothek |

### 2.2 Build & Testing

| Technologie | Verwendung |
|-------------|------------|
| Playwright | E2E-Tests für Mobile-Responsivität und Funktionalität |
| serve | Lokaler Entwicklungsserver |

### 2.3 Datenpersistenz

| Technologie | Beschreibung |
|-------------|--------------|
| localStorage | Primärer Datenspeicher für alle App-Daten (~5 MB) |
| JSON | Serialisierungsformat für Datensätze |

### 2.4 PWA & Web APIs

| API | Verwendung |
|-----|------------|
| Service Worker | Offline-Caching und PWA-Funktionalität |
| Web App Manifest | PWA-Installation und Metadaten |
| Wake Lock API | Verhindert Display-Standby während Timer läuft |
| Web Audio API | Akustische Benachrichtigungen (Pomodoro-Timer) |

---

## 3. Verzeichnisstruktur

```
Lernzeit-Tracker/
├── index.html              # Haupteinstiegspunkt und Single-Page-Struktur
├── manifest.json           # PWA-Manifest für Installation
├── sw.js                   # Service Worker für Offline-Funktionalität
├── style.css               # Globale CSS-Styles und Theme-Variablen
├── app.js                  # Hauptlogik: UI, Timer, Views, Event-Handler
├── store.js                # Datenverwaltung via StorageManager-Klasse
├── package.json            # Node.js-Abhängigkeiten und Scripts
├── playwright.config.js    # Playwright-Testkonfiguration
├── css/
│   └── toast.css           # Toast-Benachrichtigungs-Styles
├── tests/
│   └── *.spec.js           # Playwright-E2E-Tests
├── Docs/
│   └── *.md                # Technische Dokumentation
└── icons/
    ├── icon-192.png        # 192×192 Pixel
    └── icon-512.png        # 512×512 Pixel
```

---

## 4. Modulare Architektur

### 4.1 Daten-Schicht: `store.js` (StorageManager-Klasse)

Der `StorageManager` bildet die zentrale Datenschicht der Anwendung und kapselt alle lokalen Speicheroperationen.

#### Storage Keys

```javascript
const STORAGE_KEYS = {
    ENTRIES: 'lernzeit_entries',      // Lernsitzungen
    SUBJECTS: 'lernzeit_subjects',     // Fächer
    SETTINGS: 'lernzeit_settings',    // Benutzereinstellungen
    SEMESTERS: 'lernzeit_semesters',   // Semester & Module
    TIMER_STATE: 'timer_state',        // Aktiver Timer-Zustand
    TIMER_NOTES: 'timer_notes'         // Notizen während Timer
};
```

#### Kernmethoden

| Kategorie | Methoden |
|-----------|----------|
| **Einträge** | `getEntries()`, `addEntry()`, `updateEntry()`, `deleteEntry()` |
| **Fächer** | `getSubjects()`, `addSubject()`, `updateSubject()`, `deleteSubject()` |
| **Einstellungen** | `getSettings()`, `updateSettings()` |
| **Semester** | `getSemesters()`, `addSemester()`, `deleteSemester()` |
| **Module** | `getModules()`, `addModule()`, `updateModule()`, `deleteModule()` |
| **Hilfsfunktionen** | `exportData()`, `importData()`, `migrateData()` |

#### Datenmodell

**Entry (Lernsitzung)**

```typescript
interface Entry {
    id: string;           // UUID
    subjectId: string;    // Referenz zum Fach
    startTime: number;    // Unix-Timestamp
    endTime: number;      // Unix-Timestamp
    duration: number;     // Dauer in Sekunden
    notes: string;        // Optionale Notizen
    topics: string;       // Behandelte Themen
}
```

**Subject (Fach)**

```typescript
interface Subject {
    id: string;           // UUID
    name: string;         // Fachbezeichnung
    color: string;        // Tailwind-Farbklasse (z.B. 'bg-blue-500')
    weeklyGoal: number;    // Wochenziel in Stunden
}
```

**Semester**

```typescript
interface Semester {
    id: string;           // UUID
    name: string;         // Bezeichnung (z.B. "WiSe 2025")
    start: string;        // Startdatum (ISO-Format)
    end: string;          // Enddatum (ISO-Format)
    modules: Module[];    // Enthaltene Module
}
```

**Module**

```typescript
interface Module {
    id: string;           // UUID
    subjectId: string;    // Zugehöriges Fach
    name: string;         // Modulbezeichnung
    code: string;         // Modulcode (z.B. "INF-001")
    ects: number;         // ECTS-Punkte
    hours: number;        // Vorlesungsstunden pro Woche
    examPeriod: string;   // Prüfungszeitraum
    examDate: string;     // Prüfungsdatum (ISO-Format)
    grade: string;        // Note (nach Bestehen)
    notes: string;        // Zusätzliche Notizen
}
```

**Settings (Benutzereinstellungen)**

```typescript
interface Settings {
    dailyGoal: number;              // Tagesziel in Minuten
    learningDays: number;            // Lerntage pro Woche
    fontSize: number;               // Schriftgröße (1-3)
    themeMode: 'light' | 'dark' | 'auto';
    pomoWork: number;               // Arbeitsphase in Minuten
    pomoShortBreak: number;         // Kurze Pause in Minuten
    pomoLongBreak: number;          // Lange Pause in Minuten
    pomoLongBreakInterval: number;   // Intervalle bis zur langen Pause
    pomoAutoBreak: boolean;          // Automatische Pause starten
    pomoAutoWork: boolean;           // Automatische Arbeit starten
}
```

---

### 4.2 Präsentations-Schicht: `app.js`

Enthält alle UI-Logik, Event-Handler und View-Updates. Strukturiert nach Funktionsbereichen.

#### Hauptkomponenten

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

#### Timer-Architektur

**Timer State Machine**

```
┌─────────────────────────────────────────────────────────────┐
│                     Timer State Machine                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌──────────────┐     Start      ┌──────────────────┐      │
│   │   IDLE       │ ─────────────> │ RUNNING          │      │
│   │              │                │                  │      │
│   │              │ <──────────────│ timerSeconds++   │      │
│   └──────────────┘     Pause      └──────────────────┘      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Zustandsvariablen**

| Variable | Typ | Beschreibung |
|----------|-----|--------------|
| `isTimerRunning` | `boolean` | Timer läuft gerade |
| `timerSeconds` | `number` | Aktuelle Sekundenanzahl |
| `pomodoroMode` | `boolean` | Pomodoro-Modus aktiv |
| `pomodoroPhase` | `'work' \| 'shortBreak' \| 'longBreak'` | Aktuelle Pomodoro-Phase |
| `startTime` | `number` | Startzeitpunkt (Unix-Timestamp) |

**Persistenz**

| localStorage-Key | Inhalt |
|-----------------|--------|
| `timer_state` | TimerState-Objekt |
| `timer_notes` | Notizen während Timer |

---

### 4.3 UI-Komponenten (`index.html`)

Die Anwendung basiert auf einer Single-Page-Architektur mit View-basiertem Navigation.

#### Views (Hauptbereiche)

| View-ID | Beschreibung |
|---------|--------------|
| `#view-dashboard` | Hauptübersicht mit Statistiken und Widgets |
| `#view-einheiten` | Chronologische Liste aller Lernsitzungen |
| `#view-faecher` | Verwaltung der Lernfächer |
| `#view-kalender` | Kalendarische Ansicht (Tag/Woche/Monat) |
| `#view-semester` | Semester- und Modulverwaltung |

#### Overlays (Bottom-Sheet)

| Overlay-ID | Beschreibung |
|------------|--------------|
| `#timer-overlay` | Timer-Steuerung (Start/Pause/Stop) |
| `#add-entry-overlay` | Manuelle Eingabe einer Lernsitzung |
| `#add-subject-overlay` | Fach hinzufügen/bearbeiten |
| `#settings-overlay` | Alle Anwendungseinstellungen |
| `#add-semester-overlay` | Semester hinzufügen/bearbeiten |
| `#add-module-overlay` | Modul hinzufügen/bearbeiten |

---

## 5. Architektonische Entscheidungen

### 5.1 Client-Only Architecture

> **Entscheidung:** Kein Backend-Server erforderlich

**Begründung:**

- **Datenschutz:** Alle Daten verbleiben lokal auf dem Gerät des Nutzers
- **Kosten:** Keine Serverkosten oder Hosting-Gebühren
- **Offline-First:** Funktioniert vollständig ohne Internetverbindung
- **Einfachheit:** Schnelle Entwicklung ohne API-Komplexität

**Kompromisse:**

| Einschränkung | Auswirkung |
|---------------|------------|
| Keine plattformübergreifende Synchronisation | Daten sind an ein Gerät gebunden |
| localStorage-Limit (~5 MB) | Begrenzte Datenmenge möglich |
| Keine serverseitigen Berechnungen | Komplexe Analysen müssen client-seitig laufen |

---

### 5.2 Dual-Mode Timer

> **Entscheidung:** Stoppuhr-Modus + Pomodoro-Countdown

Die Anwendung unterstützt zwei komplementäre Timer-Modi:

| Modus | Beschreibung | Typischer Einsatz |
|-------|--------------|-------------------|
| **Stoppuhr** | Stoppuhr ohne Zeitlimit | Offenes Lernen |
| **Pomodoro** | 25/5/15 Minuten-Zyklen | Fokussiertes Arbeiten mit Pausen |

Pomodoro-Einstellungen sind vollständig konfigurierbar in den Einstellungen.

---

### 5.3 CSS-First Styling

> **Entscheidung:** Tailwind CSS via CDN ohne Build-Prozess

**Begründung:**

- **Schnelle Iteration:** Änderungen sofort ohne Neukompilierung sichtbar
- **Konsistenz:** Integriertes Design-System mit vordefinierten Werten
- **Kleine Bundle-Größe:** Nur genutzte CSS-Klassen werden verwendet

---

### 5.4 View-basierte Navigation

> **Entscheidung:** Single-Page mit View-Toggling statt Routing

Alle Views werden im DOM vorgehalten und per CSS-Klasse `.hidden` ein-/ausgeblendet. Der View-Switch erfolgt durch Entfernen/Hinzufügen dieser Klasse.

```javascript
// Navigation-Logik (vereinfacht)
function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
}
```

---

## 6. Datenfluss

```
┌─────────────────────────────────────────────────────────────┐
│                        User Interface                        │
│           (index.html: Dashboard, Timer, Overlays)          │
└──────────────────────────────┬──────────────────────────────┘
                               │ Events (click, input, touch)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                         app.js                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Event-Handler                                       │    │
│  │  • initTimer(), initAddEntry(), initSettings()       │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │  View-Updates                                        │    │
│  │  • updateViews(), renderDashboard(), renderStats()   │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │  State-Management                                    │    │
│  │  • timerSeconds, isTimerRunning, currentView        │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                        store.js                             │
│                     (StorageManager)                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  CRUD-Operationen                                    │    │
│  │  • addEntry(), getEntries(), updateEntry()           │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │  localStorage-Read/Write                             │    │
│  │  • JSON.parse(), JSON.stringify()                    │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │  Daten-Migration                                     │    │
│  │  • Versionierung bei Schema-Änderungen               │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       localStorage                          │
│  ┌──────────────┬──────────────┬──────────────────────┐     │
│  │ lernzeit_    │ lernzeit_    │ lernzeit_           │     │
│  │ entries      │ subjects     │ semesters           │     │
│  ├──────────────┼──────────────┼──────────────────────┤     │
│  │ lernzeit_    │ timer_       │ timer_              │     │
│  │ settings     │ state        │ notes               │     │
│  └──────────────┴──────────────┴──────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Timer-Save-Cycle

```
┌─────────────────────────────────────────────────────────────┐
│                    Timer Save-Cycle                          │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. User drückt "Start"                                       │
└─────────────────────────────────────────────────────────────┘
       │
       ├──────────────────────────────────────────────────────┐
       ▼                                                      ▼
┌─────────────────────┐                        ┌─────────────────────┐
│ startInterval()      │                        │ requestWakeLock()   │
│ wird aufgerufen     │                        │ Display bleibt an   │
└─────────────────────┘                        └─────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Timer läuft: saveState() alle 1s in localStorage        │
│    timer_state aktualisiert mit aktuellen Werten           │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. User drückt "Stopp"                                      │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Entry-Objekt wird erstellt                               │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ storage.    │    │ check-      │    │ updateViews │
│ addEntry()  │───>│ Achievements│───>│ ()          │
└─────────────┘    └─────────────┘    └─────────────┘
                                               │
       ┌─────────────────────────────────────┘
       ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Wake Lock wird freigegeben                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. PWA-Architektur

### 7.1 Service Worker (`sw.js`)

Der Service Worker ermöglicht die Offline-Funktionalität der Anwendung.

#### Cache-Strategie: Cache-First

```javascript
// Install: Cache alle statischen Assets
const CACHE_NAME = 'lernzeit-v2.0.0';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './store.js',
    './manifest.json',
    './css/toast.css'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Fetch: Cache-First mit Network-Fallback
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});

// Activate: Alte Caches löschen
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        )
    );
});
```

#### Gecachte Assets

| Kategorie | Dateien |
|-----------|---------|
| **Lokale Dateien** | `index.html`, `style.css`, `app.js`, `store.js`, `sw.js` |
| **Externe CDN** | Tailwind CSS, Lucide Icons (bei Erstverbindung) |
| **App-Resources** | Icons, Manifest, CSS-Dateien |

---

### 7.2 Manifest

```json
{
    "name": "Lernzeit Tracker",
    "short_name": "LernTracker",
    "description": "Tracke deine Lernzeiten einfach und effektiv",
    "start_url": "./index.html",
    "display": "standalone",
    "background_color": "#0f172a",
    "theme_color": "#3b82f6",
    "orientation": "portrait",
    "icons": [
        {
            "src": "./icons/icon-192.png",
            "sizes": "192x192",
            "type": "image/png"
        },
        {
            "src": "./icons/icon-512.png",
            "sizes": "512x512",
            "type": "image/png"
        }
    ]
}
```

---

### 7.3 Update-Mechanismus

```
┌─────────────────────────────────────────────────────────────┐
│                    PWA Update-Flow                           │
└─────────────────────────────────────────────────────────────┘

    ┌──────────────────────────────────────────────────────┐
    │ 1. Service Worker prüft periodisch auf Updates      │
    │    (Intervall: 1× pro Stunde oder bei Tab-Wechsel)  │
    └──────────────────────────┬───────────────────────────┘
                               │
                               ▼
    ┌──────────────────────────────────────────────────────┐
    │ 2. Neue Version erkannt                              │
    │    → Neuer SW wird im Hintergrund installiert        │
    └──────────────────────────┬───────────────────────────┘
                               │
                               ▼
    ┌──────────────────────────────────────────────────────┐
    │ 3. UI zeigt "Update verfügbar"-Banner               │
    └──────────────────────────┬───────────────────────────┘
                               │
                               ▼
    ┌──────────────────────────────────────────────────────┐
    │ 4. Nutzer bestätigt Update                          │
    │    → skipWaiting() + clients.claim()                 │
    └──────────────────────────┬───────────────────────────┘
                               │
                               ▼
    ┌──────────────────────────────────────────────────────┐
    │ 5. window.location.reload()                         │
    │    → Neue Version wird sofort aktiv                  │
    └──────────────────────────────────────────────────────┘
```

---

### 7.4 Wake Lock

Der Wake Lock verhindert, dass das Display während aktiver Timer-Sessions in den Standby-Modus geht:

```javascript
let wakeLock = null;

async function requestWakeLock() {
    try {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => {
            console.log('Wake Lock released');
        });
    } catch (err) {
        console.error('Wake Lock failed:', err);
    }
}

// Automatische Reaktivierung bei Tab-Wechsel
document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && isTimerRunning) {
        await requestWakeLock();
    }
});
```

---

## 8. Dashboard-Widgets

Das Dashboard besteht aus modularen, datengetriebenen Widgets:

| Widget | Datenquelle | Berechnung/Visualisierung |
|--------|-------------|---------------------------|
| **Tagesziel-Ring** | Today's entries | Kreisdiagramm: `(todaySeconds / dailyGoal) * circumference` |
| **Wochenübersicht** | Week entries | Balkendiagramm (7 Tage) |
| **Streak** | Entries per day | Konsekutive Tage mit Lernaktivität |
| **Heatmap** | 12 weeks entries | Farbintensität pro Tag (GitHub-Style) |
| **Achievements** | Entries, Settings | Bedingungsprüfung und Fortschritt |
| **Prüfungs-Countdown** | Semesters.modules | `days until examDate` |
| **Wochenstatistik** | Week entries | Summen, Durchschnitte, Vergleiche |

---

## 9. Achievements-System

Das Achievements-System motiviert durch Gamification:

| Achievement | Bedingung |
|-------------|-----------|
| **Erste Schritte** | Erste Lernsitzung abgeschlossen |
| **Starter** | 1 Stunde insgesamt gelernt |
| **Aufsteiger** | 10 Stunden insgesamt gelernt |
| **Profi** | 50 Stunden insgesamt gelernt |
| **Meister** | 100 Stunden insgesamt gelernt |
| **Monday Motivator** | Am Montag lernen |
| **Weekend Warrior** | Am Wochenende lernen |
| **Streak: 3 Tage** | 3 Tage hintereinander |
| **Streak: 7 Tage** | 7 Tage hintereinander |
| **Streak: 30 Tage** | 30 Tage hintereinander |

---

## 10. Export/Import

### Export-Formate

| Format | Beschreibung | Anwendungsfall |
|--------|--------------|----------------|
| **JSON** | Vollständiger Datensatz inkl. aller Entitäten und Metadaten | Backup, Migration |
| **CSV** | Flache Tabellenstruktur | Tabellenkalkulation, externe Analyse |

### Import-Prozess

```
1. Datei auswählen (JSON oder CSV)
   │
   ▼
2. Struktur validieren
   │
   ├── Valide → Bestätigungsdialog anzeigen
   │
   └── Invalide → Fehlermeldung
   │
   ▼
3. Nutzer bestätigt
   │
   ▼
4. Lokale Daten werden ersetzt
   │
   ▼
5. Views aktualisieren
```

---

## 11. Anhang: Abkürzungen

| Abkürzung | Bedeutung |
|-----------|-----------|
| PWA | Progressive Web App |
| SW | Service Worker |
| CRUD | Create, Read, Update, Delete |
| UUID | Universally Unique Identifier |
| E2E | End-to-End (Test) |
| Pomodoro | Zeitmanagement-Technik (25/5/15 min Zyklen) |
| ECTS | European Credit Transfer and Accumulation System |

---

*Letzte Aktualisierung: Version 2.0.0*
