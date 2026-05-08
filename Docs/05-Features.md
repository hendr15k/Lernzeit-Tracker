# Lernzeit-Tracker — Funktionsdokumentation

Der Lernzeit-Tracker ist eine Progressive Web App (PWA), die Studierenden und Lernenden ermöglicht, ihre Lernzeiten zu erfassen, zu analysieren und zu optimieren. Alle Daten werden lokal im Browser (localStorage) gespeichert — keine Registrierung erforderlich.

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

---

## 1. Lernsitzungen erfassen

### 1.1 Timer-Modus (Stoppuhr)

Der Timer ist das zentrale Feature der App und ermöglicht das punktgenaue Erfassen von Lernzeiten.

**Timer starten:**
- Drücke den Play-Button in der Kopfzeile oder das Floating Action Button (FAB) unten rechts
- Wähle ein Fach aus dem Dropdown-Menü
- Optional: Gib ein Thema ein (Autocomplete aus früheren Eingaben)
- Klicke auf "Start" — die Stoppuhr beginnt zu laufen

**Timer-Steuerung:**
- **Start/Pause:** Timer starten oder pausieren
- **Stopp:** Timer anhalten (Popup-Menü: Speichern oder Verwerfen)
- **Speichern:** Lernsitzung speichern und Overlay schließen

**Timer-Anzeige:**
- Das große Display zeigt die verstrichene Zeit im Format `HH:MM:SS`
- Der Timer-Ring wechselt die Farbe basierend auf dem Modus (Blau für Arbeit)

**Bildschirm aktiv halten (Wake Lock):**
- Bei laufendem Timer wird automatisch der sogenannte "Wake Lock" aktiviert
- Dies verhindert, dass der Bildschirm dimmt oder sperrt
- Der Wake Lock wird beim Pausieren oder Stoppen automatisch freigegeben

**Persistenz:**
- Timer-Zustand wird automatisch in localStorage gespeichert
- Bei App-Neustart wird der Timer mit allen Eingaben wiederhergestellt

### 1.2 Pomodoro-Modus

Der Pomodoro-Timer ist ein countdown-basierter Modus für fokussiertes Arbeiten in Intervallen.

**Pomodoro aktivieren:**
- Klicke im Timer-Overlay auf den Button "🍅 Pomodoro"

**Pomodoro-Phasen:**
- **Arbeit:** Standardmäßig 25 Minuten (konfigurierbar)
- **Kurze Pause:** Standardmäßig 5 Minuten
- **Lange Pause:** Standardmäßig 15 Minuten (nach 4 Arbeitsintervallen)

**Automatische Funktionen:**
- Arbeit automatisch starten nach Pause
- Pause automatisch starten nach Arbeit
- Akustische Benachrichtigung (Piep-Ton) bei Phasenwechsel

**Konfiguration (Einstellungen):**
- Arbeitszeit (1-120 Minuten)
- Kurze Pause (1-60 Minuten)
- Lange Pause (1-60 Minuten)
- Lange Pause nach X Arbeitseinheiten
- Automatischer Start für Pausen/Arbeit

**Automatisches Speichern:**
- Nach jeder abgeschlossenen Pomodoro-Arbeitsphase wird automatisch eine Lernsitzung gespeichert
- Die Notiz enthält automatisch das Emoji "🍅" zur Kennzeichnung

### 1.3 Manuelle Eingabe

Für vergangene Lernzeiten, die nicht live getrackt wurden:

**Manuellen Eintrag erstellen:**
- Klicke auf den "+"-Button in der Kopfzeile
- Fülle die Felder aus:
  - **Fach:** Auswahl aus vorhandenen Fächern
  - **Thema:** Freitext mit Autocomplete
  - **Datum:** Standardmäßig heute
  - **Uhrzeit:** Standardmäßig aktuelle Zeit
  - **Dauer:** In Minuten (Schnellwahltasten: 15m, 30m, 45m, 60m)
  - **Notizen:** Freitext für zusätzliche Informationen

**Validierung:**
- Fach muss ausgewählt sein
- Dauer muss größer als 0 und maximal 24 Stunden sein
- Datum/Uhrzeit darf nicht in der Zukunft liegen

### 1.4 Notizen und Themen

**Themen (Topics):**
- Freitext-Eingabe für spezifische Lerninhalte
- Autocomplete-Vorschläge basierend auf früheren Eingaben desselben Fachs
- Mehrere Themen durch Kommas getrennt möglich
- Themen werden als Badges in der Einheiten-Historie angezeigt

**Notizen:**
- Freitextfeld für beliebige Zusatzinformationen
- Wird pro Sitzung gespeichert und bleibt zwischen Timer-Sessions erhalten
- Optional ausklappbar (versteckt standardmäßig für Übersichtlichkeit)

---

## 2. Fächerverwaltung

### 2.1 Fächer erstellen (CRUD)

**Neues Fach erstellen:**
- Navigiere zum Tab "Fächer"
- Klicke auf den "+"-Button
- Fülle die Felder aus:
  - **Name:** z.B. "Höhere Mathematik 2"
  - **Farbe:** Auswahl aus 10 Farben (Rot, Orange, Gelb, Grün, Türkis, Blau, Indigo, Lila, Pink, Grau)
  - **Wochenziel:** Angabe in Stunden (optional)

**Fach bearbeiten:**
- Klicke auf den Stift-Icon neben dem Fach
- Ändere Name, Farbe oder Wochenziel
- Speichere mit dem Speichern-Button

**Fach löschen:**
- Klicke auf das Papierkorb-Icon
- Bestätige die Löschung im Dialog
- **Hinweis:** Bestehende Lernsitzungen bleiben erhalten, verlieren aber die Fachzuordnung

### 2.2 Fächer-Farben

Folgende Farben stehen zur Auswahl:

| Farbe | CSS-Klasse | Empfohlene Verwendung |
|-------|------------|---------------------|
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

### 2.3 Wochenziele

**Wochenziel setzen:**
- Pro Fach kann ein individuelles Wochenziel in Stunden definiert werden
- Das Ziel wird für die Wochenvergleichs-Analyse und Empfehlungen verwendet

**Zielerreichung:**
- Die Wochenansicht zeigt für jedes Fach den Fortschritt zum Wochenziel
- Farbcodierung: Grün = Ziel erreicht, Blau = in Progress

---

## 3. Semester- und Modulverwaltung

### 3.1 Semester erstellen und verwalten

**Neues Semester erstellen:**
- Navigiere zum Tab "Semester"
- Klicke auf den "+"-Button
- Felder:
  - **Name:** z.B. "3. Semester" oder "Wintersemester 2025/26"
  - **Startdatum:** Semesterbeginn
  - **Enddatum:** Semesterende

**Semester bearbeiten/löschen:**
- Bearbeiten: Stift-Icon in der Semesterkarte
- Löschen: Papierkorb-Icon (mit Bestätigungsdialog)
- **Hinweis:** Das Löschen eines Semesters entfernt auch alle zugehörigen Module

**Semester-Details:**
- Angezeigt werden: Gesamt-ECTS, Gesamtstunden, Anzahl Module

### 3.2 Module erstellen und verwalten

**Neues Modul erstellen:**
- Öffne ein Semester und klicke auf "+"
- Felder:
  - **Modulname:** z.B. "Höhere Mathematik 2 für ET"
  - **Modulcode:** z.B. "52111"
  - **ECTS:** Kreditpunkte (Zahl)
  - **Geschätzte Stunden:** Erwarteter Lernaufwand
  - **Prüfungsphase:** Aus Dropdown oder leer lassen
  - **Prüfungsdatum:** Konkretes Datum (optional)
  - **Note:** Nach Prüfung eintragen
  - **Notizen:** Freitext für Modulbeschreibung
  - **Fach-Verknüpfung:** Verknüpfung mit einem Tracking-Fach

**Modul bearbeiten:**
- Stift-Icon in der Modulkarte
- Alle Felder sind editierbar

**Modul löschen:**
- Papierkorb-Icon mit Bestätigungsdialog
- **Hinweis:** Zugehörige Lernsitzungen bleiben erhalten

### 3.3 Prüfungstracking

**Prüfungsphasen:**
Vordefinierte Prüfungszeiträume:
- März/April 2026 (30.03.–02.04.)
- Juli 2026 (14.07.–31.07.)
- September 2026 (21.09.–02.10.)
- Januar/Februar 2027 (01.02.–19.02.)

**Countdown-Widget:**
- Zeigt die nächsten Prüfungen mit Countdown
- Farbcodierung:
  - Gelb: Weniger als 14 Tage
  - Blau: Weniger als 60 Tage
  - Grau: Mehr als 60 Tage
  - Grün: Prüfung bestanden

**ICS-Export:**
- Button neben jeder Prüfung zum Exportieren als `.ics`-Datei
- Importierbar in Google Calendar, Apple Calendar, Outlook etc.

### 3.4 Notenverwaltung

**Notenoptionen:**
- Numerische Noten: 1.0, 1.3, 1.7, 2.0, 2.3, 2.7, 3.0, 3.3, 3.7, 4.0
- Bestanden (B)
- Nicht bestanden (NB)
- Keine Note

**Anzeige:**
- Modulkarten zeigen die Note nach der Prüfung
- Farbcodierung: Grün für bestanden (≤4.0), Rot für nicht bestanden (>4.0)

### 3.5 Lernzeit-Analyse pro Modul

**Fortschrittsanzeige:**
- Pro Modul wird der Fortschritt basierend auf verknüpften Lernsitzungen angezeigt
- Berechnung: Tatsächliche Lernstunden / Geschätzte Stunden
- Fortschrittsbalken mit Farbcodierung

---

## 4. Kalenderansichten

### 4.1 Tagessicht

**Standardansicht:**
- Zeigt jeden Tag mit aggregierter Lernzeit
- Sortiert nach Datum (neueste zuerst)
- Anzeige: Datum, Wochentag, Lernzeit, Anzahl Sitzungen
- Fortschrittsbalken zum Tagesziel

**Daten pro Tag:**
- Gesamtzeit in Stunden und Minuten
- Anzahl der einzelnen Lernsitzungen
- Fortschritt zum täglichen Ziel in Prozent

### 4.2 Wochensicht

**Aggregierte Wochenansicht:**
- Gruppiert nach Kalenderwochen (KW)
- Anzeige: Woche, Jahr, Lernzeit, Anzahl Sitzungen
- Fortschritt zum Wochenziel (basierend auf Lerntagen)

**Wochenziel-Berechnung:**
- Wochenziel = Tagesziel × Lern-Tage pro Woche
- **Beispiel:** 60 Minuten × 5 Tage = 5 Stunden/Woche

### 4.3 Monatssicht

**Monatsaggregation:**
- Gruppiert nach Monaten
- Anzeige: Monatsname, Lernzeit, Anzahl Sitzungen
- Fortschritt zum Monatsziel

**Monatsziel-Berechnung:**
- Monatsziel = Tagesziel × (Tage im Monat / 7) × Lern-Tage pro Woche
- Dynamische Berechnung basierend auf tatsächlichen Tagen

---

## 5. Analytics & Statistiken

### 5.1 Dashboard-Übersicht

**Tagesziel-Ring:**
- Kreisförmiger Fortschrittsindikator
- Zeigt heutige Lernzeit vs. Tagesziel
- Emoji-Feedback (Feuer) bei Zielerreichung

**Wochenübersicht (Balkendiagramm):**
- Letzte 7 Tage als vertikale Balken
- Tooltips mit exakten Zeiten
- Wochenvergleichs-Badge (Prozent vs. Vorwoche)

**Streak-Anzeige:**
- Anzahl Tage in Folge mit mindestens einer Lernsitzung
- Berücksichtigt heute und gestern für den aktuellen Streak
- Der Streak bleibt erhalten, wenn heute noch nicht gelernt wurde

**Gesamtzeit:**
- Kumulative Lernzeit aller Sitzungen

### 5.2 Wochenstatistik

**Täglicher Breakdown (Montag–Sonntag):**
- Balkendiagramm für jeden Wochentag
- Tooltips mit Minutenangaben
- Maximum-Skalierung für bessere Vergleichbarkeit

**Statistiken:**
- Ø pro Tag: Durchschnitt über alle 7 Tage
- Ø pro Fach: Durchschnitt über aktive Fächer
- Produktivster Tag: Wochentag mit meisten Stunden
- Woche gesamt: Summe aller Stunden

### 5.3 Wochenvergleich

**Vorwochen-Vergleich:**
- Balkendiagramm mit zwei Balken pro Fach
- Diese Woche (blau) vs. Letzte Woche (grau)
- Prozentuale Änderung (↑/↓)

**Sortierung:**
- Nach dieser Woche absteigend sortiert
- Zeigt nur Fächer mit Daten

**Aggregation:**
- Gesamtzeile am Ende für übergreifenden Vergleich
- Farb-Legende zur Unterscheidung dieser vs. Vorwoche

### 5.4 Lern-Trends

**Analysierte Metriken:**

1. **Beste Zeit:** Tageszeitbereich mit meisten Lernstunden
   - Berechnung: Stunden-Peak mit ±2 Stunden Fenster
   - Format: "14–16 Uhr"

2. **Ø Sitzung:** Durchschnittliche Dauer einer Lernsitzung
   - Berechnung: Gesamte Zeit / Anzahl Sitzungen
   - Format: "45 min"

3. **Trend:** Wochenvergleichsrichtung
   - ↑ Grün: Steigend
   - ↓ Rot: Fallend
   - → Grau: Unverändert
   - "Neu!": Keine Daten in Vorwoche

4. **Top Tag:** Wochentag mit meisten Stunden
   - Berechnung: Aggregiert über alle Daten
   - Format: "Montag", "Mittwoch" etc.

### 5.5 Heatmap (Aktivitätskalender)

**Darstellung:**
- GitHub-Beitrag-ähnliche Heatmap
- Zeigt die letzten 12 Wochen
- Farbintensität basiert auf Lernzeit

**Farbstufen:**
- Level 0: Keine Aktivität (dunkel)
- Level 1: <25% des Maximums
- Level 2: 25-50% des Maximums
- Level 3: 50-75% des Maximums
- Level 4: >75% des Maximums

**Interaktivität:**
- Hover zeigt Tooltip mit Datum und Zeit
- Zukünftige Tage sind leicht abgedunkelt

### 5.6 Prüfungs-Countdown

**Anzeige auf Dashboard:**
- Liste der nächsten 5 Prüfungen
- Countdown in Tagen
- Farbcodierung nach Dringlichkeit
- ICS-Export-Button pro Prüfung
- Klick auf Prüfung öffnet die Modul-Detailansicht

### 5.7 Streak-Berechnung

**Algorithmus:**
1. Sammle alle eindeutigen Lerntage
2. Prüfe ob heute oder gestern Lernaktivität hat
3. Zähle rückwärts bis Lücke in Serie

**Besonderheiten:**
- Streak bleibt erhalten wenn heute noch nicht gelernt wurde
- Streak = 0 wenn weder heute noch gestern aktiv

---

## 6. Achievements-System

Insgesamt 16 Achievements können freigeschaltet werden:

| ID | Emoji | Name | Beschreibung | Freischaltbedingung |
|----|-------|------|-------------|-------------------|
| first_timer | 🏃 | Erste Schritte | Erste Lernsession | ≥1 Sitzung |
| streak_7 | 🔥 | 7-Tage-Streak | 7 Tage hintereinander | Streak ≥7 Tage |
| hours_10 | ⏰ | Stunden-Jäger | 10 Stunden gesamt | ≥10 Stunden |
| hours_50 | 💪 | Halbzeit | 50 Stunden gesamt | ≥50 Stunden |
| hours_100 | 📚 | 100-Stunden-Krieger | 100 Stunden gesamt | ≥100 Stunden |
| pomodoro_1 | 🍅 | Pomodoro-Anfänger | Erste Pomodoro-Session | ≥1 Pomodoro |
| pomodoro_10 | 🍅 | Pomodoro-Meister | 10 Pomodoro-Sessions | ≥10 Pomodoros |
| weekly_goal | 📅 | Wochenziel erreicht | Wochenziel erfüllt | 5× Tagesziel diese Woche |
| monthly_goal | 🎯 | Monatsziel erreicht | Monatsziel erfüllt | 20× Tagesziel diesen Monat |
| early_bird | 🌅 | Früher Vogel | Vor 8 Uhr gelernt | ≥1 Sitzung vor 08:00 |
| night_owl | 🦉 | Nachteule | Nach 22 Uhr gelernt | ≥1 Sitzung nach 22:00 |
| marathon | 🏃 | Marathon | 3h am Stück | ≥1 Sitzung ≥3 Stunden |
| all_subjects | 🎓 | Allrounder | Alle Fächer an einem Tag | Alle Fächer an einem Tag |
| perfect_week | ⭐ | Perfekte Woche | 7 Tage hintereinander | Streak ≥7 Tage |
| consistency_30 | 📈 | Beständigkeit | 30-Tage Streak | Streak ≥30 Tage |
| first_hour | ⤵️ | Erste Stunde | Erste 60 Minuten | ≥1 Stunde gesamt |

**Anzeige:**
- Widget auf Dashboard zeigt Fortschritt
- Card-Grid mit freigeschalteten (bunt) und gesperrten (ausgegraut, 🔒)
- Freischaltungsdatum pro Achievement

**Benachrichtigungen:**
- Toast-Benachrichtigung bei Freischaltung
- Werden nur einmalig angezeigt

---

## 7. Export & Import

### 7.1 JSON-Backup (Vollbackup)

**Exportieren:**
- Einstellungen → Datenverwaltung → "Backup (JSON)"
- Generiert `lernzeit_backup_YYYY-MM-DD.json`

**Datenumfang:**
- Alle Lernsitzungen (entries)
- Alle Fächer (subjects)
- Alle Semester und Module
- Alle Einstellungen

**Importieren:**
- Einstellungen → Datenverwaltung → "Importieren"
- Wählt die JSON-Datei aus
- Warnung: Überschreibt alle aktuellen Daten

### 7.2 CSV-Export

**Exportieren:**
- Einstellungen → Datenverwaltung → "CSV"

**Format:**
```csv
Datum,Uhrzeit,Fach,Dauer (Min),Notizen
08.05.2026,14:30,Höhere Mathematik 2,45,"Integrale besprochen"
```

**Verwendung:**
- Importierbar in Excel, Google Sheets
- UTF-8 BOM für deutsche Umlaute

### 7.3 Wochenbericht

**Exportieren:**
- Einstellungen → Datenverwaltung → "Wochenbericht"

**Inhalt:**
- Berichtszeitraum (Kalenderwoche und Jahr)
- Zusammenfassung (Gesamtzeit, Anzahl Sessions)
- Tägliche Übersicht (Montag–Sonntag)
- Aufschlüsselung nach Fach
- Generierungsdatum

**Format:**
- Plain-Text (.txt) Datei
- Einfach zu drucken oder weiterzuleiten

### 7.4 ICS-Export für Prüfungen

**Einzelner Export:**
- Im Prüfungs-Countdown auf Kalender-Icon klicken
- Generiert `.ics`-Datei für diese Prüfung

**ICS-Format:**
```
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20260728T080000Z
DTEND:20260728T110000Z
SUMMARY:Prüfung: Höhere Mathematik 2
END:VEVENT
END:VCALENDAR
```

**Kompatibilität:**
- Google Calendar ✓
- Apple Calendar ✓
- Microsoft Outlook ✓
- Jeder andere CalDAV-Client ✓

---

## 8. PWA-Funktionen

### 8.1 Offline-Unterstützung

**Service Worker:**
- Cached alle App-Assets beim ersten Besuch
- Ermöglicht Nutzung ohne Internetverbindung

**Gecachte Ressourcen:**
- `index.html`
- `style.css`
- `js/app.js`
- `js/store.js`
- `sw.js`
- `manifest.json`
- Icons (192×192, 512×512)
- Tailwind CSS CDN
- Lucide Icons CDN

**Offline-Verhalten:**
- App ist vollständig funktionsfähig
- Alle Daten werden in localStorage gespeichert
- Keine serverseitige Komponente erforderlich
- Bereits besuchte Seiten werden aus dem Cache geladen

### 8.2 Installierbare App

**Install-Banner:**
- Erscheint automatisch nach 5 Sekunden
- Kann vom Benutzer verworfen werden
- Wird nach Installation oder Ablehnung nicht mehr angezeigt

**Installation:**
- Klick auf "Installieren" im Banner
- Oder browser-spezifisches Install-Menü

**Vorteile der Installation:**
- Eigenes App-Icon auf dem Homescreen
- Eigenständiges Fenster (kein Browser-Chrome)
- Bessere Performance
- Schnellerer App-Start
- Push-Benachrichtigungen (zukünftig geplant)

### 8.3 Automatische Updates

**Update-Erkennung:**
- Service Worker prüft stündlich auf neue Versionen
- Bei Update: Banner am unteren Bildschirmrand

**Update-Prozess:**
1. Neuer Service Worker wird im Hintergrund installiert
2. Banner zeigt "Update verfügbar"
3. Nach 2 Sekunden: Automatischer Neustart
4. Neue Version wird aktiviert

### 8.4 Responsive Design

**Mobile First:**
- Optimiert für Smartphones
- Bottom-Navigation mit 5 Tabs
- Touch-freundliche Schaltflächen

**Breakpoints:**
- Max-Width: 448px (max-w-md)
- Zentral ausgerichtet auf größeren Bildschirmen

### 8.5 Theme-Unterstützung

**Theme-Modi:**
- **Hell:** Heller Hintergrund, dunkler Text
- **Dunkel:** Dunkler Hintergrund, heller Text (Standard)
- **Auto:** Folgt dem System-Theme

**Wechseln:**
- Schnellwechsel über Lichtbulben-Icon in der Kopfzeile
- Oder in den Einstellungen

---

## Einstellungen

**Tägliches Ziel:**
- Standard: 60 Minuten
- Anpassbar in Minuten

**Lern-Tage pro Woche:**
- Standard: 5 (Montag–Freitag)
- Bereich: 1–7

**Schriftgröße:**
- Slider von 12px bis 24px
- Standard: 16px

**Design:**
- Hell / Dunkel / Auto

**Pomodoro-Einstellungen:**
- Arbeitszeit (Minuten)
- Kurze Pause (Minuten)
- Lange Pause (Minuten)
- Lange Pause alle X Arbeitseinheiten
- Pause automatisch starten
- Arbeit automatisch nach Pause starten

**Datenverwaltung:**
- Backup (JSON) exportieren
- Importieren
- CSV exportieren
- Wochen-PDF exportieren
- Alle Daten löschen

---

## Technische Details

**Frameworks & Bibliotheken:**
- Tailwind CSS (via CDN)
- Lucide Icons
- Native Web APIs (localStorage, Service Worker, Wake Lock)

**Browser-Speicher:**
- localStorage für alle Daten
- Key: `lernzeit_entries`, `lernzeit_subjects`, `lernzeit_settings`, `lernzeit_semesters`

**Standard-Fächer:**
Beim ersten Start werden folgende Fächer angelegt:
1. Höhere Mathematik 2 (Blau, 6h/Woche)
2. GET2 (Grün, 8h/Woche)
3. Physik (Lila, 8h/Woche)
4. Bauelemente (Orange, 8h/Woche)
5. Digitaltechnik (Rot, 5h/Woche)

**Standard-Semester:**
Beinhaltet Module für das aktuelle Sommersemester mit Prüfungsdaten der FH Aachen.
Module sind mit vordefinierten Fächern verknüpft für automatisiertes Tracking.
