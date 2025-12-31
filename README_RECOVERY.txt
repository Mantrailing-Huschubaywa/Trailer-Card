TrailerCard – Recovery ZIP

Dieses ZIP enthält ZWEI Teile:

1) Root (Produktiv, läuft auf Vercel OHNE Install/Build)
   - index.html
   - assets/...
   - runtime-config.js  (hier Supabase URL + ANON KEY eintragen)
   - vercel.json

2) source/ (Vollständiger Quellcode der App als Sicherung)
   - Enthält die ursprünglichen Projektdateien (ohne node_modules)

Wichtig:
- Für das Online-Hosting auf Vercel muss NUR der Root-Teil benutzt werden.
- Der Ordner "source/" ist nur zur Wiederherstellung/Weiterentwicklung und wird von Vercel nicht als Projekt-Root erkannt.
