# Timer-Dokumentation

## Übersicht

Der Timer ist eine zentrale Funktion der App und ermöglicht das präzise Erfassen von Lernzeit. Er unterstützt zwei Betriebsmodi: den freien Stoppuhr-Modus und den Pomodoro-Modus mit Countdown.

---

## Timer-Modi

### Stoppuhr-Modus (Frei)

- Standardmodus beim Start der App
- Zählt Sekunden kontinuierlich hoch
- Anzeigeformat: `HH:MM:SS`
- Flexible Zeiterfassung ohne Zeitlimit

### Pomodoro-Modus

- Countdown-Timer mit vordefinierten Intervallen
- Drei Phasen:
  - **Arbeit**: Standard 25 Minuten (konfigurierbar)
  - **Kurze Pause**: Standard 5 Minuten (konfigurierbar)
  - **Lange Pause**: Standard 15 Minuten (konfigurierbar)
- Automatische Phasenübergänge (lange Pause nach jeweils 4 Arbeitsphasen)
- Automatische Speicherung nach jeder Arbeitsphase

---

## Zustandsvariablen

```javascript
// Timer-Kernvariablen
let timerInterval = null;      // Interval-ID für setInterval
let timerSeconds = 0;         // Aktuelle Sekunden (Stoppuhr)
let isTimerRunning = false;    // Läuft der Timer gerade?
let timerStartTime = 0;       // Startzeit für Berechnung

// Pomodoro-spezifische Variablen
let pomodoroMode = false;      // false = Frei, true = Pomodoro
let pomodoroPhase = 'work';    // Mögliche Werte: 'work' | 'shortBreak' | 'longBreak'
let pomodoroCount = 0;         // Abgeschlossene Arbeitsphasen
let pomodoroCountdown = 0;     // Verbleibende Sekunden im Countdown
let pomodoroWorkSeconds = 0;   // Akkumulierte Arbeitssekunden

// Wake Lock Handle
let wakeLock = null;          // WakeLock-Objekt für Bildschirmaktivität
```

---

## Persistenz (localStorage)

### Speicherstruktur

| Key | Inhalt |
|-----|--------|
| `timer_state` | Vollständiger Timer-Zustand |
| `timer_notes` | Eingegebene Notizen |

### Timer-State (`timer_state`)

Der vollständige Zustand wird alle Sekunden in localStorage gespeichert:

```json
{
    "isRunning": boolean,
    "seconds": number,
    "subjectId": string,
    "timestamp": number,
    "pomodoroMode": boolean,
    "pomodoroPhase": string,
    "pomodoroCount": number,
    "pomodoroCountdown": number,
    "pomodoroWorkSeconds": number
}
```

- `timestamp`: Unix-Zeitstempel (ms) der letzten Speicherung, ermöglicht Berechnung der verstrichenen Zeit bei Wiederherstellung
- `seconds`: Sekunden zum Zeitpunkt der letzten Speicherung

### Timer-Notizen (`timer_notes`)

Eingegebene Notizen werden separat gespeichert und bei Neuladung wiederhergestellt.

---

## Wake Lock API

### Funktionen

- `requestWakeLock()`: Fordert Wake Lock an, um Bildschirm aktiv zu halten
- `releaseWakeLock()`: Gibt Wake Lock frei

### Implementierung

```javascript
async function requestWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
        } catch (err) {
            console.error('Wake Lock fehlgeschlagen:', err);
        }
    }
}
```

### Automatische Verwaltung

- Wake Lock wird beim **Start** des Timers aktiviert
- Wake Lock wird beim **Pausieren/Stoppen** freigegeben
- Bei **Sichtbarkeitsänderung** (Tab-Wechsel/Fensterwechsel) wird Wake Lock bei Rückkehr automatisch neu angefordert

---

## Pomodoro-Konfiguration

Die folgenden Werte werden in den Einstellungen gespeichert und können vom Benutzer angepasst werden:

| Einstellung | Schlüssel | Standardwert |
|-------------|-----------|--------------|
| Arbeitszeit | `pomoWork` | 25 Minuten |
| Kurze Pause | `pomoShortBreak` | 5 Minuten |
| Lange Pause | `pomoLongBreak` | 15 Minuten |
| Intervall (Lange Pause) | `pomoLongBreakInterval` | 4 Arbeitsphasen |
| Auto-Start Pause | `pomoAutoBreak` | true |
| Auto-Start Arbeit | `pomoAutoWork` | false |

### Abrufen der Einstellungen

```javascript
function getPomodoroSettings() {
    const settings = window.storageManager.getSettings();
    return {
        work: (settings.pomoWork || 25) * 60,
        shortBreak: (settings.pomoShortBreak || 5) * 60,
        longBreak: (settings.pomoLongBreak || 15) * 60,
        longBreakInterval: settings.pomoLongBreakInterval || 4,
        autoStartBreak: settings.pomoAutoBreak !== false,
        autoStartWork: settings.pomoAutoWork === true
    };
}
```

> **Hinweis:** `window.storageManager` ist ein globaler Service für den Zugriff auf Einstellungen und Persistenz.

---

## Audio-Benachrichtigungen

### playBeep()

Erzeugt akustische Signale über die Web Audio API.

```javascript
function playBeep(freq = 800, duration = 200, count = 2)
```

**Parameter:**

| Parameter | Typ | Standardwert | Beschreibung |
|-----------|-----|--------------|--------------|
| `freq` | number | 800 | Frequenz in Hz |
| `duration` | number | 200 | Dauer in Millisekunden |
| `count` | number | 2 | Anzahl der Signale |

**Verwendung:**

| Ereignis | Frequenz | Dauer | Signale |
|----------|----------|-------|---------|
| Pomodoro-Arbeit beendet | 600 Hz | 300ms | 3 |
| Pomodoro-Pause beendet | 1000 Hz | 300ms | 3 |

---

## Zustandswiederherstellung

Beim Laden der App (Zeile 1022-1078) wird folgender Ablauf durchgeführt:

1. Gespeicherten State aus localStorage laden
2. Prüfen ob `isRunning = true`:
   - Verstrichene Zeit seit letzter Speicherung berechnen
   - Timer mit korrekter Startzeit neu starten
   - Wake Lock anfordern
   - Fortsetzungs-Overlay anzeigen (zeigt verstrichene Zeit)
3. Notizen wiederherstellen

```javascript
const now = Date.now();
const elapsedSinceSave = Math.floor((now - state.timestamp) / 1000);
timerSeconds = state.seconds + elapsedSinceSave;
```

> **Hinweis:** Die Zustandswiederherstellung ermöglicht es, den Timer im Hintergrund weiterlaufen zu lassen, auch wenn die App geschlossen oder der Tab gewechselt wurde.

---

## Wichtige Funktionen

### initTimer()

Initialisiert alle Timer-Events und UI-Elemente (Zeile 942-1323).

### startInterval()

Startet das 1-Sekunden-Intervall für den Timer (Zeile 1081-1102).

### transitionPomodoroPhase()

Behandelt Phasenübergänge im Pomodoro-Modus:

- Speichert abgeschlossene Arbeitsphasen automatisch
- Berechnet nächste Phase:
  - Arbeit → Kurze Pause (oder Lange Pause nach `longBreakInterval` Arbeitsphasen)
  - Pause → Arbeit
- Löst akustische Signale aus
- Setzt Countdown für neue Phase zurück

### saveState()

Speichert den aktuellen Timer-Zustand in localStorage (Zeile 1176-1189).

### clearState()

Entfernt den gespeicherten State aus localStorage (Zeile 1191-1193). Wird beim Stoppen des Timers aufgerufen.

### updateDisplay()

Aktualisiert die Timer-Anzeige:

- Stoppuhr-Modus: `HH:MM:SS`
- Pomodoro-Modus: `MM:SS`

### updatePomodoroDisplay()

Aktualisiert die Pomodoro-Countdown-Anzeige und Farbcodierung.

---

## UI-Steuerelemente

| Element | ID | Funktion |
|---------|-----|----------|
| Start | `btn-timer-start` | Timer starten |
| Pause | `btn-timer-pause` | Timer pausieren |
| Stopp | `btn-timer-stop` | Timer stoppen und verwerfen |
| Speichern | `btn-timer-save` | Zeit manuell speichern |
| Pomodoro-Toggle | `btn-pomodoro-toggle` | Zwischen Modi wechseln |
| FAB | `fab-main` | Schnellzugriff auf Timer-Overlay |

---

## Farbcodierung (Pomodoro)

| Phase | Farbe | CSS-Klasse |
|-------|-------|------------|
| Arbeit | Grün | `border-green-500/30` |
| Kurze/Lange Pause | Bernstein (Amber) | `border-amber-500/30` |

---

## Timer-Ablaufdiagramm

```
                    ┌─────────────────┐
                    │     App-Start    │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Stoppuhr-Modus  │
                    │  (Standard)     │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
     ┌─────────────────┐          ┌─────────────────┐
     │   Start gedrückt │          │ Pomodoro-Toggle │
     └────────┬────────┘          └────────┬────────┘
              │                             │
              │                             ▼
              │                    ┌─────────────────┐
              │                    │  Pomodoro-Modus │
              │                    └────────┬────────┘
              │                             │
              ▼                             ▼
     ┌─────────────────┐          ┌─────────────────┐
     │ Timer läuft     │          │ Countdown läuft │
     │ (HH:MM:SS)     │          │ (MM:SS)         │
     └────────┬────────┘          └────────┬────────┘
              │                             │
     ┌────────┴────────┐          ┌────────┴────────┐
     │                 │          │                 │
     ▼                 ▼          ▼                 ▼
┌─────────┐      ┌─────────┐ ┌─────────┐      ┌─────────┐
│ Pause   │      │  Stop   │ │ Pause   │      │ Countdown│
│gedrückt │      │gedrückt │ │gedrückt │      │ = 0     │
└────┬────┘      └────┬────┘ └────┬────┘      └────┬────┘
     │                │         │                │
     ▼                ▼         ▼                ▼
┌─────────┐    ┌─────────┐ ┌─────────┐    ┌─────────────────┐
│Timer    │    │Speichern│ │Timer    │    │ Phase wechseln  │
│pausiert │    │oder     │ │pausiert │    │ (Arbeit/Pause)  │
└─────────┘    │verwerfen│ └─────────┘    │ Signalton       │
               └─────────┘                └─────────────────┘
```

---

## Tipps zur Fehlerbehebung

| Problem | Mögliche Ursache | Lösung |
|---------|------------------|--------|
| Timer startet nicht | Wake Lock verweigert | Browser-Einstellungen prüfen |
| Anzeige bleibt bei 00:00 | Intervall nicht gestartet | Browser-Konsole auf Fehler prüfen |
| State wird nicht gespeichert | localStorage voll | Speicher prüfen/lehren |
| Ton wird nicht abgespielt | Audio-Kontext blockiert | Nach erstem Klick/Touch erneut versuchen |
