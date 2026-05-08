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
- Automatische Phasenübergänge
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
let pomodoroPhase = 'work';    // 'work' | 'shortBreak' | 'longBreak'
let pomodoroCount = 0;         // Abgeschlossene Arbeitsphasen
let pomodoroCountdown = 0;     // Verbleibende Sekunden im Countdown
let pomodoroWorkSeconds = 0;   // Akkumulierte Arbeitssekunden
```

---

## Persistenz (localStorage)

### Timer-State (`timer_state`)
Der vollständige Zustand wird alle Sekunden in localStorage gespeichert:

```javascript
{
    isRunning: boolean,
    seconds: number,
    subjectId: string,
    timestamp: number,        // Zeitpunkt der letzten Speicherung
    pomodoroMode: boolean,
    pomodoroPhase: string,
    pomodoroCount: number,
    pomodoroCountdown: number,
    pomodoroWorkSeconds: number
}
```

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
        wakeLock = await navigator.wakeLock.request('screen');
    }
}
```

### Automatische Verwaltung
- Wake Lock wird beim Start des Timers aktiviert
- Wake Lock wird beim Pausieren/Stoppen freigegeben
- Bei Sichtbarkeitsänderung (Tab-Wechsel) wird Wake Lock bei Rückkehr neu angefordert

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

---

## Audio-Benachrichtigungen

### playBeep()
Erzeugt akustische Signale über die Web Audio API.

```javascript
function playBeep(freq = 800, duration = 200, count = 2)
```

**Parameter:**
- `freq`: Frequenz in Hz (Standard: 800)
- `duration`: Dauer in Millisekunden (Standard: 200)
- `count`: Anzahl der Signale (Standard: 2)

**Verwendung:**
- Pomodoro-Arbeit beendet: 600 Hz, 300ms, 3 Signale
- Pomodoro-Pause beendet: 1000 Hz, 300ms, 3 Signale

---

## Zustandswiederherstellung

Beim Laden der App (Zeile 1022-1078):
1. Gespeicherten State aus localStorage laden
2. Bei `isRunning = true`:
   - Verstrichene Zeit seit letzter Speicherung berechnen
   - Timer neu starten
   - Wake Lock anfordern
   - Overlay anzeigen
3. Notizen wiederherstellen

```javascript
const now = Date.now();
const elapsedSinceSave = Math.floor((now - state.timestamp) / 1000);
timerSeconds = state.seconds + elapsedSinceSave;
```

---

## Wichtige Funktionen

### initTimer()
Initialisiert alle Timer-Events und UI-Elemente (Zeile 942-1323).

### startInterval()
Startet das 1-Sekunden-Intervall für den Timer (Zeile 1081-1102).

### transitionPomodoroPhase()
Behandelt Phasenübergänge im Pomodoro-Modus:
- Speichert abgeschlossene Arbeitsphasen automatisch
- Berechnet nächste Phase (Arbeit/Pause)
- Löst akustische Signale aus

### saveState()
Speichert den aktuellen Timer-Zustand in localStorage (Zeile 1176-1189).

### clearState()
Entfernt den gespeicherten State aus localStorage (Zeile 1191-1193).

### updateDisplay()
Aktualisiert die Timer-Anzeige im Format `HH:MM:SS` oder `MM:SS` (Pomodoro).

### updatePomodoroDisplay()
Aktualisiert die Pomodoro-Countdown-Anzeige und Farbcodierung (grün = Arbeit, amber = Pause).

---

## UI-Steuerelemente

| Element | ID | Funktion |
|---------|-----|----------|
| Start | `btn-timer-start` | Timer starten |
| Pause | `btn-timer-pause` | Timer pausieren |
| Stopp | `btn-timer-stop` | Timer stoppen (Speichern/Verwerfen) |
| Speichern | `btn-timer-save` | Zeit manuell speichern |
| Pomodoro-Toggle | `btn-pomodoro-toggle` | Zwischen Modi wechseln |
| FAB | `fab-main` | Schnellzugriff auf Timer-Overlay |

---

## Farbcodierung (Pomodoro)

- **Grün**: Arbeitsphase (`border-green-500/30`)
- **Amber**: Pausenphase (`border-amber-500/30`)
