# 🎮 Zählspiel für Kinder

Ein interaktives Webspiel, das Kindern das Zählen mit visuellen Objekten und Audio-Anweisungen beibringt.

## 🎯 Spielziel

Kinder lernen spielerisch das Zählen, indem sie visuelle Objekte betrachten und die richtige Anzahl über Zahlen-Buttons oder die Tastatur eingeben. Das Spiel ist speziell für Kinder entwickelt, die noch nicht lesen können.

## 🚀 Features

- **10 Zahlen-Buttons** (0-9): Große, farbenfrohe Buttons für einfache Bedienung
- **Tastatur-Unterstützung**: Zahlen können auch über die Tastatur eingegeben werden
- **Visuelle Objekte**: Verschiedene Objekte (Tiere, Früchte, etc.) in unterschiedlichen Mengen
- **Audio-Anweisungen**: Alle Anweisungen werden vorgelesen (keine Lesekenntnisse erforderlich)
- **Sprachausgabe**: Deutsche Sprachausgabe für Feedback und Anweisungen
- **Level-System**: Steigende Schwierigkeit
- **Belohnungssystem**: Punkte und Level für Motivation
- **Responsive Design**: Funktioniert auf Desktop, Tablet und Smartphone

## 🎮 Spielanleitung

1. **Ziel**: Zähle die angezeigten Objekte und drücke die richtige Zahl
2. **Spielablauf**:
   - Das Spiel zeigt verschiedene Objekte an (z.B. 4 Äpfel, 7 Einhörner)
   - Eine Stimme fragt: "Wie viele [Objekte] siehst du?"
   - Drücke die entsprechende Zahl (0-9) auf den Buttons oder der Tastatur
   - Bei richtiger Antwort: Belohnung und nächstes Level
   - Bei falscher Antwort: Hilfreiches Feedback

3. **Steuerung**:
   - **Maus/Touch**: Klicke auf die Zahlen-Buttons
   - **Tastatur**: Drücke die Zahlen-Tasten (0-9)
   - **"Neues Spiel"**: Spiel zurücksetzen
   - **"🔊"**: Ton und Sprache ein/ausschalten
   - **"🔄 Wiederholen"**: Anweisung nochmal hören

## 🛠️ Installation & Start

1. Lade alle Dateien in einen Ordner herunter
2. Öffne `index.html` in einem modernen Webbrowser
3. Das Spiel startet automatisch mit Audio-Anweisungen

**Oder starte einen lokalen Server:**
```bash
# Mit Python 3
python -m http.server 8000

# Mit Node.js (falls npx verfügbar)
npx serve .

# Dann öffne: http://localhost:8000
```

## 📱 Kompatibilität

- **Browser**: Chrome, Firefox, Safari, Edge (moderne Versionen)
- **Geräte**: Desktop, Tablet, Smartphone
- **Touch-Unterstützung**: Vollständig unterstützt
- **Sprachausgabe**: Web Speech API (funktioniert in den meisten modernen Browsern)

## 🎨 Technische Details

- **HTML5**: Semantische Struktur
- **CSS3**: Moderne Animationen und Responsive Design
- **JavaScript ES6**: Klassen-basierte Architektur
- **Web Speech API**: Für deutsche Sprachausgabe
- **Web Audio API**: Für Sound-Feedback
- **Emojis**: Für kinderfreundliche Objekte

## 🎯 Pädagogische Ziele

- **Zahlenverständnis**: Visuelle Verbindung zwischen Mengen und Zahlen
- **Zählen lernen**: Systematisches Zählen von Objekten
- **Feinmotorik**: Präzises Klicken/Tippen
- **Konzentration**: Fokus auf die Aufgabe
- **Sprachverständnis**: Hören und Verstehen von Anweisungen
- **Belohnungssystem**: Positive Verstärkung für Erfolge

## 🔧 Anpassungen

Das Spiel kann einfach angepasst werden:

- **Neue Objekte**: Füge Einträge zur `objectCategories`-Array hinzu
- **Schwierigkeit**: Ändere die Logik in `createNewChallenge()`
- **Sprache**: Modifiziere die `speak()`-Funktionen
- **Farben**: Passe das CSS an
- **Sounds**: Modifiziere die Audio-Funktionen

## 🎵 Audio-Features

- **Anweisungen**: "Wie viele [Objekte] siehst du?"
- **Erfolg**: "Super gemacht!", "Das ist richtig!", etc.
- **Fehler**: Hilfreiches Feedback mit der eingegebenen Zahl
- **Wiederholung**: Anweisungen können wiederholt werden
- **Einstellbar**: Ton und Sprache können ausgeschaltet werden

## 🎨 Emoji-Grafiken

Die bunten 3D-Emojis in den Spielen **Zählen** und **Buchstaben** stammen aus
[Microsoft Fluent UI Emoji](https://github.com/microsoft/fluentui-emoji)
(MIT-Lizenz). Die Assets liegen lokal in `images/emojis/` und können mit
`bash scripts/fetch-emojis.sh` jederzeit neu heruntergeladen werden.
Siehe `images/emojis/LICENSE.md` für den vollständigen Lizenztext.

## 📄 Lizenz

Frei verwendbar für Bildungszwecke.

---

**Viel Spaß beim Zählen! 🎉** 