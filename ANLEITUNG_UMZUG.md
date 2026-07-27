# Umzug der Mantrailing Card App: Vercel → trailercard.hs-bw.com

**Wichtigstes Prinzip:** Ihre Vercel-App bleibt die ganze Zeit unberührt und
live. Wir bauen alles getrennt neu auf. Erst wenn Sie auf der neuen Adresse
alles getestet haben, schalten Sie um. Solange können beide Versionen parallel
laufen.

Es wird **kein PHP** gebraucht. Die App redet direkt mit Supabase, genau wie
bisher. Der E-Mail-Versand (Resend) läuft in Supabase und muss **nicht**
angefasst werden.

---

## Was ich schon für Sie gemacht habe

- `index.html` aufgeräumt, damit sie sauber gebaut werden kann (die alte
  Importmap und eine tote Stylesheet-Zeile sind raus – sonst alles gleich).
- `manifest.json` in den Ordner `public/` verschoben, damit sie beim Bauen
  automatisch im fertigen `dist/`-Ordner landet.
- `.htaccess` für den Webspace erstellt (Datei `htaccess_fuer_webspace.txt`).
- Vercel-Datei `vercel.json` **bewusst drin gelassen** – die braucht die
  laufende Vercel-Version während der Testphase noch.

---

## Phase 1: Subdomain in All-Inkl anlegen

1. Im All-Inkl-Menü (KAS) unter **Domains → Subdomain** die Subdomain
   `trailercard.hs-bw.com` anlegen.
2. Ihr einen **eigenen, leeren Ordner** als Ziel geben (z. B. `/trailercard/`).
3. Für die Subdomain ein **SSL-Zertifikat** (Let's Encrypt) aktivieren – bei
   All-Inkl ist das ein Häkchen.

## Phase 2: App bauen (über GitHub Codespaces – kein eigener Rechner nötig)

1. Dieses Projekt (dieser Ordner) in Ihr GitHub-Repository laden bzw. dort
   ersetzen.
2. GitHub → Repository → **Code → Codespaces → Create codespace on main**.
3. Im Terminal eingeben und Enter:
   ```bash
   npm install
   npm run build
   ```
4. Es entsteht ein Ordner **`dist/`**. Links im Datei-Explorer: Rechtsklick auf
   `dist` → **Download** (lädt eine ZIP mit dem fertigen Build).
5. Codespace danach wieder stoppen.

## Phase 3: Per FTP auf den Webspace hochladen

In den Zielordner von `trailercard.hs-bw.com` (aus Phase 1) hochladen:

```
/ (Stammverzeichnis von trailercard.hs-bw.com)
├── index.html          ← aus dist/
├── assets/             ← aus dist/  (der komplette Ordner)
├── manifest.json       ← aus dist/
└── .htaccess           ← aus "htaccess_fuer_webspace.txt", umbenannt zu .htaccess
```

**Wichtig:** Die Datei heißt am Ende `.htaccess` (mit Punkt am Anfang, ohne
`.txt`). Im Browser-Dateimanager einfach beim Hochladen bzw. Umbenennen so
setzen.

## Phase 4: Supabase auf die neue Adresse vorbereiten (der eine Pflicht-Klick)

Supabase-Dashboard → **Authentication → URL Configuration**:

1. Bei **Redirect URLs** die neue Adresse **zusätzlich** eintragen (die alte
   Vercel-Adresse erstmal drin lassen):
   ```
   https://trailercard.hs-bw.com/**
   ```
2. **Site URL** noch NICHT umstellen – das machen wir erst ganz am Schluss.

Damit funktionieren **beide** Adressen parallel, und der „Passwort vergessen"-
Link führt auf jeder Adresse an die richtige Stelle zurück.

## Phase 5: Testen (auf https://trailercard.hs-bw.com)

- Einloggen mit einem bestehenden Konto
- Eine Registrierung durchspielen → Bestätigungsmail kommt an?
- „Passwort vergessen" durchspielen → Reset-Mail kommt an, Link führt zurück
  auf `trailercard.hs-bw.com` und das neue Passwort lässt sich setzen?
- Ein, zwei Kunden/Buchungen ansehen → Daten sind wie gewohnt da?

## Phase 6: Umschalten (wenn alles passt)

1. Supabase → **Authentication → URL Configuration → Site URL** auf
   `https://trailercard.hs-bw.com` stellen.
2. Alte Vercel-Adresse aus der Redirect-Liste entfernen (optional).
3. Vercel können Sie danach in Ruhe abschalten oder als Reserve stehen lassen.

---

## Was am App-Code NICHT geändert werden musste

- Login, Registrierung, Kunden, Buchungen, PDF-Erstellung, Transaktionen:
  alles läuft unverändert direkt gegen Supabase.
- Der „Passwort vergessen"-Link baut sich selbst aus der aktuellen Adresse –
  er zeigt auf der neuen Domain automatisch richtig.
- Resend / E-Mail-Versand: keine Änderung, liegt in Supabase.

## Hinweis zum App-Icon (PWA)

Das „Zur Startseite hinzufügen"-Icon (manifest.json) bleibt erhalten. Der
Service Worker ist – wie schon bei Ihnen zuvor – **deaktiviert**, weil er früher
Cross-Origin-Fehler verursacht hat. Die App läuft dadurch normal im Browser und
lässt sich trotzdem mit Icon zum Startbildschirm hinzufügen. Wenn Sie später
echtes Offline-Verhalten möchten, bauen wir den Service Worker separat sauber
ein.
