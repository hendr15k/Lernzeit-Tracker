# Timer-Dokumentation

> **Hinweis:** Diese Dokumentation ist Teil der [Projektdokumentation](./README.md).
> Siehe auch: [01-Architecture.md](./01-Architecture.md) für die architektonische Einordnung.

---

## Inhaltsverzeichnis

1. [Übersicht](#übersicht)
2. [Timer-Modi](#timer-modi)
3. [Zustandsvariablen](#zustandsvariablen)
4. [Persistenz](#persistenz)
5. [Wake Lock API](#wake-lock-api)
6. [Pomodoro-Konfiguration](#pomodorokonfiguration)
7. [Audio-Benachrichtigungen](#audio-benachrichtigungen)
8. [Zustandswiederherstellung](#zustandswiederherstellung)
9. [Wichtige Funktionen](#wichtige-funktionen)
10. [UI-Steuerelemente](#ui-steuerelemente)
11. [Timer-Ablaufdiagramm](#timer-ablaufdiagramm)
12. [Tipps zur Fehlerbehebung](#tipps-zur-fehlerbehebung)

---

## 1. Übersicht

Der Timer ist eine zentrale Funktion der App und ermöglicht das präzise Erfassen von Lernzeit. Er unterstützt zwei Betriebsmodi:

| Modus | Beschreibung |
|-------|--------------|
| **Stoppuhr-Modus** | Freie Zeiterfassung ohne Zeitlimit |
| **Pomodoro-Modus** | Countdown-Timer mit strukturierten Arbeits- und Pausenintervallen |

---

## 2. Timer-Modi

### 2.1 Stoppuhr-Modus (Frei)

Der Stoppuhr-Modus ist der Standardmodus beim Start der App.

- Zählt Sekunden kontinuierlich hoch
- Anzeigeformat: `HH:MM:SS`
- Flexible Zeiterfassung ohne Zeitlimit
- Geeignet für spontanes Lernen oder variable Sitzungen

### 2.2 Pomodoro-Modus

Der Pomodoro-Modus verwendet einen Countdown-Timer mit vordefinierten Intervallen, um fokussiertes Arbeiten und regelmäßige Pausen zu fördern.

**Drei Phasen:**

| Phase | Standarddauer | Konfigurierbar |
|-------|---------------|----------------|
| **Arbeit** | 25 Minuten | Ja |
| **Kurze Pause** | 5 Minuten | Ja |
| **Lange Pause** | 15 Minuten | Ja |

**Automatische Funktionen:**

- Automatische Phasenübergänge
- Lange Pause wird nach jeweils 4 Arbeitsphasen eingelegt
- Automatische Speicherung nach jeder Arbeitsphase

---

## 3. Zustandsvariablen

### 3.1 Timer-Kernvariablen

```javascript
let timerInterval = null;      // Interval-ID für setInterval
let timerSeconds = 0;          // Aktuelle Sekunden (Stoppuhr)
let isTimerRunning = false;     // Läuft der Timer gerade?
let timerStartTime = 0;        // Startzeit für Berechnung
```

### 3.2 Pomodoro-spezifische Variablen

```javascript
let pomodoroMode = false;       // false = Frei, true = Pomodoro
let pomodoroPhase = 'work';     // Mögliche Werte: 'work' | 'shortBreak' | 'longBreak'
let pomodoroCount = 0;          // Abgeschlossene Arbeitsphasen
let pomodoroCountdown = 0;      // Verbleibende Sekunden im Countdown
let pomodoroWorkSeconds = 0;    // Akkumulierte Arbeitssekunden
```

### 3.3 Wake Lock Handle

```javascript
let wakeLock = null;           // WakeLock-Objekt für Bildschirmaktivität
```

---

## 4.Persistenz

### 4.1 Speicherstruktur

| Key | Inhalt | Beschreibung |
|-----|--------|--------------|
| `timer_state` | Vollständiger Timer-Zustand | Wird jede Sekunde aktualisiert |
| `timer_notes` | Eingegebene Notizen | Wird bei Neuladung wiederhergestellt |

### 4.2 Timer-State (`timer_state`)

Der vollständige Zustand wird alle Sekunden in localStorage gespeichert, um bei einem Seitenreload oder Tab-Wechsel eine nahtlose Fortsetzung zu ermöglichen.

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

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `isRunning` | boolean | Gibt an, ob der Timer läuft |
| `seconds` | number | Sekunden zum Zeitpunkt der letzten Speicherung |
| `timestamp` | number | Unix-Zeitstempel (Millisekunden) der letzten Speicherung |
| `pomodoroMode` | boolean | Aktueller Modus (Stoppuhr oder Pomodoro) |
| `pomodoroPhase` | string | Aktuelle Phase im Pomodoro-Modus |
| `pomodoroCount` | number | Anzahl abgeschlossener Arbeitsphasen |
| `pomodoroCountdown` | number | Verbleibende Sekunden im Countdown |
| `pomodoroWorkSeconds` | number | Gesamte Arbeitssekunden der aktuellen Sitzung |

### 4.3 Timer-Notizen (`timer_notes`)

Eingegebene Notizen werden separat gespeichert und bei Neuladung wiederhergestellt.

---

## 5. Wake Lock API

Die Wake Lock API verhindert, dass der Bildschirm des Geräts in den Ruhezustand wechselt, solange der Timer läuft.

### 5.1 Funktionen

| Funktion | Beschreibung |
|----------|--------------|
| `requestWakeLock()` | Fordert Wake Lock an, um Bildschirm aktiv zu halten |
| `releaseWakeLock()` | Gibt Wake Lock frei |

### 5.2 Implementierung

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

### 5.3 Automatische Verwaltung

| Ereignis | Aktion |
|----------|--------|
| Timer-**Start** | Wake Lock wird aktiviert |
| Timer-**Pausieren/Stoppen** | Wake Lock wird freigegeben |
| **Sichtbarkeitsänderung** (Tab-/Fensterwechsel) | Wake Lock wird bei Rückkehr automatisch neu angefordert |

> **Hinweis:** Der Wake Lock wird automatisch freigegeben, wenn der Browser-Tab im Hintergrund ist. Beim Zurückwechseln wird er automatisch wieder angefordert, um den Timer-Betrieb fortzusetzen.

---

## 6. Pomodoro-Konfiguration

Die folgenden Werte werden in den Einstellungen gespeichert und können vom Benutzer angepasst werden:

| Einstellung | Schlüssel | Standardwert | Beschreibung |
|-------------|-----------|--------------|--------------|
| Arbeitszeit | `pomoWork` | 25 Minuten | Dauer einer Arbeitsphase |
| Kurze Pause | `pomoShortBreak` | 5 Minuten | Dauer einer kurzen Pause |
| Lange Pause | `pomoLongBreak` | 15 Minuten | Dauer einer langen Pause |
| Intervall (Lange Pause) | `pomoLongBreakInterval` | 4 Arbeitsphasen | Anzahl Arbeitseinheiten vor langer Pause |
| Auto-Start Pause | `pomoAutoBreak` | true | Automatischer Start der Pause nach Arbeit |
| Auto-Start Arbeit | `pomoAutoWork` | false | Automatischer Start der Arbeit nach Pause |

### 6.1 Abrufen der Einstellungen

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

## 7. Audio-Benachrichtigungen

### 7.1 playBeep()

Erzeugt akustische Signale über die Web Audio API, um den Benutzer über Phasenwechsel im Pomodoro-Modus zu informieren.

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
| Pomodoro-Arbeit beendet | 600 Hz | 300 ms | 3 |
| Pomodoro-Pause beendet | 1000 Hz | 300 ms | 3 |

---

## 8. Zustandswiederherstellung

Beim Laden der App wird der gespeicherte Zustand wiederhergestellt, damit der Timer im Hintergrund weiterlaufen kann.

### 8.1 Wiederherstellungsprozess

1. Gespeicherten State aus localStorage laden
2. Prüfen, ob `isRunning = true`:
   - Verstrichene Zeit seit letzter Speicherung berechnen
   - Timer mit korrekter Startzeit neu starten
   - Wake Lock anfordern
   - Fortsetzungs-Overlay anzeigen (zeigt verstrichene Zeit)
3. Notizen wiederherstellen

### 8.2 Zeitberechnung

```javascript
const now = Date.now();
const elapsedSinceSave = Math.floor((now - state.timestamp) / 1000);
timerSeconds = state.seconds + elapsedSinceSave;
```

> **Hinweis:** Die Zustandswiederherstellung ermöglicht es, den Timer im Hintergrund weiterlaufen zu lassen, auch wenn die App geschlossen oder der Tab gewechselt wurde.

---

## 9. Wichtige Funktionen

### 9.1 initTimer()

Initialisiert alle Timer-Events und UI-Elemente.

### 9.2 startInterval()

Startet das 1-Sekunden-Intervall für den Timer.

### 9.3 transitionPomodoroPhase()

Behandelt Phasenübergänge im Pomodoro-Modus und führt folgende Aktionen aus:

- Speichert abgeschlossene Arbeitsphasen automatisch
- Berechnet nächste Phase:
  - Arbeit → Kurze Pause (oder Lange Pause nach `longBreakInterval` Arbeitsphasen)
  - Pause → Arbeit
- Löst akustische Signale aus
- Setzt Countdown für neue Phase zurück

### 9.4 saveState()

Speichert den aktuellen Timer-Zustand in localStorage.

### 9.5 clearState()

Entfernt den gespeicherten State aus localStorage. Wird beim Stoppen des Timers aufgerufen.

### 9.6 updateDisplay()

Aktualisiert die Timer-Anzeige:

| Modus | Format |
|-------|--------|
| Stoppuhr-Modus | `HH:MM:SS` |
| Pomodoro-Modus | `MM:SS` |

### 9.7 updatePomodoroDisplay()

Aktualisiert die Pomodoro-Countdown-Anzeige und Farbcodierung.

---

## 10. UI-Steuerelemente

| Element | ID | Funktion |
|---------|-----|----------|
| Start | `btn-timer-start` | Timer starten |
| Pause | `btn-timer-pause` | Timer pausieren |
| Stopp | `btn-timer-stop` | Timer stoppen und verwerfen |
| Speichern | `btn-timer-save` | Zeit manuell speichern |
| Pomodoro-Toggle | `btn-pomodoro-toggle` | Zwischen Modi wechseln |
| FAB | `fab-main` | Schnellzugriff auf Timer-Overlay |

Siehe auch: [04-UI-Views.md](./04-UI-Views.md) für vollständige UI-Dokumentation.

---

## 11. Farbcodierung (Pomodoro)

| Phase | Farbe | CSS-Klasse |
|-------|-------|------------|
| Arbeit | Grün | `border-green-500/30` |
| Kurze Pause | Bernstein (Amber) | `border-amber-500/30` |
| Lange Pause | Bernstein (Amber) | `border-amber-500/30` |

---

## 12. Timer-Ablaufdiagramm

```
                     ┌─────────────────┐
                     │     App-Start    │
                     └────────┬────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │ Stoppuhr-Modus   │
                     │  (Standard)      │
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
 ┌─────────┐      ┌─────────┐ ┌─────────┐    ┌─────────────────┐
 │ Pause   │      │  Stop   │ │ Pause   │    │ Countdown       │
 │gedrückt │      │gedrückt │ │gedrückt │    │ abgelaufen      │
 └────┬────┘      └────┬────┘ └────┬────┘    └────────┬────────┘
      │                │         │                  │
      ▼                ▼         ▼                  ▼
 ┌─────────┐    ┌─────────┐ ┌─────────┐    ┌─────────────────┐
 │Timer    │    │Speichern│ │Timer    │    │ Phase wechseln  │
 │pausiert │    │oder     │ │pausiert │    │ (Arbeit/Pause)  │
 └─────────┘    │verwerfen│ └─────────┘    │ Signalton       │
                └─────────┘                └─────────────────┘
```

---

## 13. Tipps zur Fehlerbehebung

| Problem | Mögliche Ursache | Lösung |
|---------|------------------|--------|
| Timer startet nicht | Wake Lock wurde vom Browser verweigert | Browser-Einstellungen prüfen, Berechtigungen erteilen |
| Anzeige bleibt bei `00:00` | Intervall wurde nicht korrekt gestartet | Browser-Konsole auf Fehler prüfen |
| State wird nicht gespeichert | localStorage ist voll oder deaktiviert | Speicher prüfen/lehren, localStorage aktivieren |
| Ton wird nicht abgespielt | Audio-Kontext wurde blockiert | Nach erstem Klick/Touch erneut versuchen |
| Timer zeigt falsche Zeit nach Reload | Tab war im Hintergrund | Korrekte Zeit wird durch Zustandswiederherstellung berechnet |

---

*Siehe auch: [01-Architecture.md](./01-Architecture.md) | [06-API-Reference.md](./06-API-Reference.md)*
