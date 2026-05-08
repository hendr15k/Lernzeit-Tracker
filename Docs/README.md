# Dokumentation

> **Hinweis:** Diese Dokumentation ist Teil der [Projektdokumentation](./README.md).

Willkommen zur Dokumentation des **Lernzeit-Tracker-Projekts**. Diese Seite bietet einen umfassenden Überblick über die verfügbaren Dokumentationsressourcen und die Projektstruktur.

---

## Inhaltsverzeichnis

1. [Dokumentationsübersicht](#dokumentationsübersicht)
2. [Projektstruktur](#projektstruktur)
3. [Dokumentationsdateien](#dokumentationsdateien)
4. [Weitere Ressourcen](#weitere-ressourcen)
5. [Beitragen](#beitragen)

---

## Dokumentationsübersicht

| Kategorie | Beschreibung |
|-----------|--------------|
| [01-Architecture.md](./01-Architecture.md) | Technische Dokumentation: Stack, Datenmodell, Module |
| [README.md](../README.md) | Projektübersicht, Features, Installation |

---

## Projektstruktur

```
Lernzeit-Tracker/
├── Docs/
│   ├── README.md              # Diese Dokumentation
│   ├── 01-Architecture.md    # Technische Architektur
│   ├── 02-Timer.md           # Timer-Dokumentation
│   ├── 03-Data-Models.md    # Datenmodelle
│   ├── 04-UI-Views.md       # UI-Komponenten
│   ├── 05-Features.md       # Funktionsübersicht
│   ├── 06-API-Reference.md  # API-Referenz
│   ├── 07-Configuration.md  # Konfigurationsdateien
│   ├── 08-Testing.md        # Test-Dokumentation
│   └── 09-Deployment.md      # Deployment-Anleitung
├── index.html                 # Haupteinstiegspunkt
├── manifest.json              # PWA-Manifest
├── sw.js                      # Service Worker
├── style.css                  # Globale Styles
├── js/
│   ├── app.js               # Hauptlogik
│   └── store.js              # Datenverwaltung
├── css/
│   └── toast.css             # Toast-Benachrichtigungen
├── tests/                    # Playwright-E2E-Tests
├── package.json              # Node.js-Abhängigkeiten
└── README.md                 # Hauptübersicht
```

---

## Dokumentationsdateien

| Dokument | Beschreibung |
|----------|-------------|
| [01-Architecture.md](./01-Architecture.md) | Technische Architektur, Datenmodell, Module, PWA-Support |
| [02-Timer.md](./02-Timer.md) | Timer-Funktionalität, Pomodoro-Modus, Wake Lock |
| [03-Data-Models.md](./03-Data-Models.md) | Datenmodelle, StorageManager, localStorage |
| [04-UI-Views.md](./04-UI-Views.md) | Views, Overlays, Dashboard-Widgets, Theme-System |
| [05-Features.md](./05-Features.md) | Alle Funktionen der App im Detail |
| [06-API-Reference.md](./06-API-Reference.md) | Vollständige API-Referenz aller Funktionen |
| [07-Configuration.md](./07-Configuration.md) | Konfigurationsdateien (package.json, manifest.json, etc.) |
| [08-Testing.md](./08-Testing.md) | Playwright-Testdokumentation |
| [09-Deployment.md](./09-Deployment.md) | Deployment-Anleitung, PWA-Installation |

### Schnellnavigation

| Bereich | Dokument | Schlüsselthemen |
|---------|----------|-----------------|
| **Technische Grundlagen** | [01-Architecture.md](./01-Architecture.md) | Stack, Datenfluss, PWA |
| **Timer** | [02-Timer.md](./02-Timer.md) | Stoppuhr, Pomodoro, Wake Lock |
| **Daten** | [03-Data-Models.md](./03-Data-Models.md) | Entry, Subject, Semester, Module |
| **UI** | [04-UI-Views.md](./04-UI-Views.md) | Views, Widgets, Navigation |
| **Funktionen** | [05-Features.md](./05-Features.md) | Tracking, Analytics, Achievements |
| **API** | [06-API-Reference.md](./06-API-Reference.md) | Alle Funktionen und Datenstrukturen |
| **Konfiguration** | [07-Configuration.md](./07-Configuration.md) | package.json, manifest.json, sw.js |
| **Tests** | [08-Testing.md](./08-Testing.md) | Playwright, mobile Testing |
| **Deployment** | [09-Deployment.md](./09-Deployment.md) | Hosting, PWA-Installation |

---

## Weitere Ressourcen

| Ressource | Beschreibung |
|-----------|--------------|
| [Haupt-README](../README.md) | Detaillierte Informationen zu Features, Installation und Nutzung |
| [Live Demo](https://hendr15k.github.io/Lernzeit-Tracker/) | Anwendung direkt im Browser testen |

---

## Beitragen

Interessiert daran, zum Projekt beizutragen? Bitte lesen Sie die [CONTRIBUTING-Richtlinien](../CONTRIBUTING.md) für weitere Informationen.

---

*Siehe auch: [01-Architecture.md](./01-Architecture.md) | [Haupt-README](../README.md)*
