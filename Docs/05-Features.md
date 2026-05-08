# Lernzeit-Tracker — Funktionsdokumentation

> **Hinweis:** Diese Dokumentation ist Teil der [Projektdokumentation](./README.md).
> Siehe auch: [01-Architecture.md](./01-Architecture.md) für die architektonische Einordnung.

---

## Inhaltsverzeichnis

1. [Lernsitzungen erfassen](#1-lernsitzungen-erfassen)
2. [Fächerverwaltung](#2-fächerverwaltung)
3. [Semester- und Modulverwaltung](#3-semester--und-modulverwaltung)
4. [Kalenderansichten](#4-kalenderansichten)
5. [Analytics & Statistiken](#5-analytics--statistiken)
6. [Achievements-System](#6-achievements-system)
7. [Export & Import](#7-export--import)
8. [PWA-Funktionen](#8-pwa-funktionen)
9. [Einstellungen](#einstellungen)

---

## 1. Lernsitzungen erfassen

### 1.1 Timer-Modus (Stoppuhr)

Der Timer ist das zentrale Feature der App und ermöglicht das punktgenaue Erfassen von Lernzeiten.

#### Timer starten

1. Drücke den Play-Button in der Kopfzeile oder den FAB
2. Wähle ein Fach aus dem Dropdown-Menü
3. Optional: Gib ein Thema ein (Autocomplete)
4. Klicke auf "Start"

#### Timer-Steuerung

| Aktion | Beschreibung |
|--------|--------------|
| Start/Pause | Timer starten oder pausieren |
| Stopp | Timer anhalten (Popup: Speichern oder Verwerfen) |
| Speichern | Lernsitzung speichern und Overlay schließen |

#### Wake Lock

- Verhindert Bildschirm-Dimming während Timer läuft
- Automatische Freigabe bei Pausieren/Stoppen

Siehe auch: [02-Timer.md](./02-Timer.md) für vollständige Timer-Dokumentation.

---

### 1.2 Pomodoro-Modus

Countdown-basierter Modus für fokussiertes Arbeiten in Intervallen.

#### Pomodoro-Phasen

| Phase | Standarddauer | Konfigurierbar |
|-------|---------------|----------------|
| **Arbeit** | 25 Minuten | Ja (1–120 min) |
| **Kurze Pause** | 5 Minuten | Ja (1–60 min) |
| **Lange Pause** | 15 Minuten | Ja (1–60 min) |

#### Automatische Funktionen

- Arbeit automatisch starten nach Pause
- Pause automatisch starten nach Arbeit
- Akustische Benachrichtigung bei Phasenwechsel
- Automatisches Speichern nach jeder Arbeitsphase

---

### 1.3 Manuelle Eingabe

Für vergangene Lernzeiten, die nicht live getrackt wurden.

#### Felder

| Feld | Beschreibung |
|------|--------------|
| Fach | Auswahl aus vorhandenen Fächern |
| Thema | Freitext mit Autocomplete |
| Datum | Standardmäßig heute |
| Uhrzeit | Standardmäßig aktuelle Zeit |
| Dauer | In Minuten (Schnellwahltasten: 15m, 30m, 45m, 60m) |
| Notizen | Freitext für zusätzliche Informationen |

#### Validierung

- Fach muss ausgewählt sein
- Dauer muss > 0 und ≤ 24 Stunden
- Datum/Uhrzeit darf nicht in der Zukunft liegen

---

### 1.4 Notizen und Themen

#### Themen (Topics)

- Freitext-Eingabe für spezifische Lerninhalte
- Autocomplete-Vorschläge basierend auf früheren Eingaben
- Mehrere Themen durch Kommas getrennt
- Themen werden als Badges angezeigt

---

## 2. Fächerverwaltung

### 2.1 Fächer erstellen (CRUD)

#### Neues Fach erstellen

1. Navigiere zum Tab "Fächer"
2. Klicke auf den "+"-Button
3. Felder ausfüllen: Name, Farbe, Wochenziel

#### Verfügbare Farben

| Farbe | Klasse | Empfohlene Verwendung |
|-------|--------|----------------------|
| Rot | `bg-red-500` | Wichtige/Schwierige Fächer |
| Orange | `bg-orange-500` | Mittelschwer |
| Gelb | `bg-yellow-500` | Prüfungen |
| Grün | `bg-green-500` | Leichte/neue Fächer |
| Türkis | `bg-teal-500` | Naturwissenschaften |
| Blau | `bg-blue-500` | Standard |
| Indigo | `bg-indigo-500` | Sprachen |
| Lila | `bg-purple-500` | Kreativfächer |
| Pink | `bg-pink-500` | Freifächer |
| Grau | `bg-gray-500` | Sonstiges |

---

### 2.2 Wochenziele

| Funktion | Beschreibung |
|----------|--------------|
| Wochenziel setzen | Pro Fach individuelles Ziel in Stunden |
| Zielerreichung | Wochenansicht zeigt Fortschritt zum Wochenziel |

---

## 3. Semester- und Modulverwaltung

### 3.1 Semester erstellen und verwalten

#### Felder

| Feld | Beschreibung |
|------|--------------|
| Name | z.B. "3. Semester" oder "Wintersemester 2025/26" |
| Startdatum | Semesterbeginn |
| Enddatum | Semesterende |

#### Statistiken

- Gesamt-ECTS
- Gesamtstunden
- Anzahl Module

---

### 3.2 Module erstellen und verwalten

#### Felder

| Feld | Beschreibung |
|------|--------------|
| Modulname | z.B. "Höhere Mathematik 2 für ET" |
| Modulcode | z.B. "52111" |
| ECTS | Kreditpunkte |
| Geschätzte Stunden | Erwarteter Lernaufwand |
| Prüfungsphase | Aus Dropdown oder leer lassen |
| Prüfungsdatum | Konkretes Datum |
| Note | Nach Prüfung eintragen |
| Notizen | Freitext |
| Fach-Verknüpfung | Verknüpfung mit Tracking-Fach |

---

### 3.3 Prüfungstracking

#### Vordefinierte Prüfungszeiträume

| ID | Label | Zeitraum |
|----|-------|----------|
| `2026-03-30` | Mär/Apr 2026 | 30.03.–02.04.2026 |
| `2026-07-14` | Jul 2026 | 14.07.–31.07.2026 |
| `2026-09-21` | Sep 2026 | 21.09.–02.10.2026 |
| `2027-02-01` | Jan/Feb 2027 | 01.02.–19.02.2027 |

#### Countdown-Farbcodierung

| Tage bis Prüfung | Farbe |
|------------------|-------|
| ≤ 14 | Gelb |
| ≤ 60 | Blau |
| > 60 | Grau |
| Bestanden | Grün |

#### ICS-Export

Button neben jeder Prüfung zum Exportieren als `.ics`-Datei für Kalender-Import (Google Calendar, Apple Calendar, Outlook).

---

### 3.4 Notenverwaltung

#### Notenoptionen

- Numerische Noten: 1.0, 1.3, 1.7, 2.0, 2.3, 2.7, 3.0, 3.3, 3.7, 4.0
- Bestanden (B)
- Nicht bestanden (NB)
- Keine Note

---

## 4. Kalenderansichten

### 4.1 Tagessicht

- Zeigt jeden Tag mit aggregierter Lernzeit
- Anzeige: Datum, Wochentag, Lernzeit, Anzahl Sitzungen
- Fortschrittsbalken zum Tagesziel

### 4.2 Wochensicht

- Gruppiert nach Kalenderwochen (KW)
- Fortschritt zum Wochenziel = Tagesziel × Lern-Tage

### 4.3 Monatssicht

- Gruppiert nach Monaten
- Dynamische Berechnung des Monatsziels

---

## 5. Analytics & Statistiken

### 5.1 Dashboard-Übersicht

| Widget | Beschreibung |
|--------|--------------|
| Tagesziel-Ring | Kreisförmiger Fortschrittsindikator |
| Wochenübersicht | Balkendiagramm letzte 7 Tage |
| Streak-Anzeige | Tage in Folge mit Lernaktivität |
| Gesamtzeit | Kumulative Lernzeit aller Sitzungen |

### 5.2 Wochenstatistik

| Metrik | Beschreibung |
|--------|--------------|
| Ø pro Tag | Durchschnitt über alle 7 Tage |
| Ø pro Fach | Durchschnitt über aktive Fächer |
| Produktivster Tag | Wochentag mit meisten Stunden |
| Woche gesamt | Summe aller Stunden |

### 5.3 Wochenvergleich

- Diese Woche vs. Letzte Woche nach Fach
- Prozentuale Änderung (↑/↓)

### 5.4 Lern-Trends

| Metrik | Beschreibung |
|--------|--------------|
| Beste Zeit | Tageszeitbereich mit meisten Stunden |
| Ø Sitzung | Durchschnittliche Sitzungsdauer |
| Trend | Wochenvergleichsrichtung |
| Top Tag | Wochentag mit meisten Stunden |

### 5.5 Heatmap

GitHub-Beitrag-ähnliche Heatmap der letzten 12 Wochen.

| Level | Bedeutung |
|-------|----------|
| 0 | Keine Aktivität |
| 1 | <25% des Maximums |
| 2 | 25–50% des Maximums |
| 3 | 50–75% des Maximums |
| 4 | >75% des Maximums |

### 5.6 Streak-Berechnung

1. Sammle alle eindeutigen Lerntage
2. Prüfe ob heute oder gestern Lernaktivität hat
3. Zähle rückwärts bis Lücke in Serie

---

## 6. Achievements-System

Insgesamt 16 Achievements können freigeschaltet werden:

| ID | Emoji | Name | Freischaltbedingung |
|----|-------|------|---------------------|
| first_timer | 🏃 | Erste Schritte | ≥1 Sitzung |
| streak_7 | 🔥 | 7-Tage-Streak | Streak ≥7 Tage |
| hours_10 | ⏰ | Stunden-Jäger | ≥10 Stunden |
| hours_50 | 💪 | Halbzeit | ≥50 Stunden |
| hours_100 | 📚 | 100-Stunden-Krieger | ≥100 Stunden |
| pomodoro_1 | 🍅 | Pomodoro-Anfänger | ≥1 Pomodoro |
| pomodoro_10 | 🍅 | Pomodoro-Meister | ≥10 Pomodoros |
| weekly_goal | 📅 | Wochenziel erreicht | 5× Tagesziel diese Woche |
| monthly_goal | 🎯 | Monatsziel erreicht | 20× Tagesziel diesen Monat |
| early_bird | 🌅 | Früher Vogel | ≥1 Sitzung vor 08:00 |
| night_owl | 🦉 | Nachteule | ≥1 Sitzung nach 22:00 |
| marathon | 🏃 | Marathon | ≥1 Sitzung ≥3 Stunden |
| all_subjects | 🎓 | Allrounder | Alle Fächer an einem Tag |
| perfect_week | ⭐ | Perfekte Woche | Streak ≥7 Tage |
| consistency_30 | 📈 | Beständigkeit | Streak ≥30 Tage |
| first_hour | ⏱️ | Erste Stunde | ≥1 Stunde gesamt |

---

## 7. Export & Import

### 7.1 JSON-Backup

- Einstellungen → Datenverwaltung → "Backup (JSON)"
- Exportiert: Alle Lernsitzungen, Fächer, Semester, Module, Einstellungen
- Importiert: Überschreibt alle aktuellen Daten

### 7.2 CSV-Export

Format:

```csv
Datum,Uhrzeit,Fach,Dauer (Min),Notizen
08.05.2026,14:30,Höhere Mathematik 2,45,"Integrale besprochen"
```

### 7.3 ICS-Export für Prüfungen

Exportiert Prüfungsdatum als `.ics`-Datei für Kalender-Import.

---

## 8. PWA-Funktionen

### 8.1 Offline-Unterstützung

| Funktion | Status |
|----------|--------|
| Timer-Funktionalität | Verfügbar (via localStorage) |
| Dashboard-Ansicht | Verfügbar |
| Core-UI-Komponenten | Vollständig verfügbar |

### 8.2 Installierbare App

- PWA-Install-Banner erscheint nach 5 Sekunden
- Installation über Browser-spezifisches Install-Menü
- Vorteile: Eigenes App-Icon, eigenständiges Fenster, bessere Performance

### 8.3 Automatische Updates

- Service Worker prüft stündlich auf neue Versionen
- Banner zeigt "Update verfügbar" bei neuer Version

### 8.4 Theme-Unterstützung

- **Hell** — Heller Hintergrund, dunkler Text
- **Dunkel** — Dunkler Hintergrund, heller Text (Standard)
- **Auto** — Folgt dem System-Theme

Siehe auch: [09-Deployment.md](./09-Deployment.md) für vollständige Deployment-Dokumentation.

---

## 9. Einstellungen

### 9.1 Allgemein

| Einstellung | Standard | Beschreibung |
|------------|----------|--------------|
| Tägliches Ziel | 60 min | Anpassbar in Minuten |
| Lern-Tage/Woche | 5 | Bereich: 1–7 |
| Schriftgröße | 16px | Slider 12–24px |

### 9.2 Pomodoro-Einstellungen

| Einstellung | Standard | Bereich |
|-------------|----------|---------|
| Arbeitszeit | 25 min | 1–120 min |
| Kurze Pause | 5 min | 1–60 min |
| Lange Pause | 15 min | 1–60 min |
| Lange Pause alle X | 4 | 1–10 |
| Pause automatisch starten | ✓ | - |
| Arbeit automatisch starten | ✗ | - |

### 9.3 Datenverwaltung

| Aktion | Beschreibung |
|--------|--------------|
| Backup (JSON) | Vollständiges Backup exportieren |
| Importieren | JSON-Backup importieren |
| CSV | CSV-Export der Einträge |
| Wochenbericht | Wochenübersicht als Textdatei |
| Alle Daten löschen | Unwiderrufliches Löschen aller Daten |

---

*Siehe auch: [01-Architecture.md](./01-Architecture.md) | [04-UI-Views.md](./04-UI-Views.md) | [06-API-Reference.md](./06-API-Reference.md) | [09-Deployment.md](./09-Deployment.md)*
