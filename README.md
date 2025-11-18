# NotForResponding.github.io

This repository contains a small static website with a tiny canvas-based game and UI controls (Start / Pause / Reset, difficulty selector).

Open `index.html` in a browser to play locally. For a better experience (and to avoid CORS in some browsers), serve the folder with a simple HTTP server:

```bash
# from the repository root
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

Files of interest:
- `index.html` — the main page with buttons and canvas
- `styles.css` — styling
- `script.js` — game logic

Controls:
- Use arrow keys or WASD to move the player square.
- Click Start to begin, Pause to pause, Reset to restart the game.
- Collect the yellow circles to score points.

Enjoy!
# NotForResponding.github.io