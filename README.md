# amaschine Dashboard

Ein kleines statisches Dashboard bestehend aus `index.html`, `app.js`, `styles.css` und zugehörigen Assets. Falls du die letzten Änderungen übernehmen willst, folge diesen Schritten.

## Änderungen übernehmen
1. Stelle sicher, dass du auf dem richtigen Branch bist (standardmäßig `work`):
   ```bash
   git checkout work
   ```
2. Ziehe die neuesten Änderungen aus dem Remote-Repo:
   ```bash
   git pull
   ```
3. Teste, ob die JavaScript-Datei syntaktisch korrekt ist (optional, aber empfohlen):
   ```bash
   node -c app.js
   ```
4. Starte eine lokale Vorschau, z. B. mit dem eingebauten Python-Server, und öffne die Seite im Browser:
   ```bash
   python -m http.server 8000
   # anschließend im Browser http://localhost:8000/index.html aufrufen
   ```

So kannst du sicherstellen, dass die aktuellen Anpassungen übernommen sind und die App wie erwartet läuft.
