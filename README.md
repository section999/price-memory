# Price Memory: Inflation Game

A browser-based quiz game that tests how well you know Korea's 30 years of inflation. Given a past price, guess what the same item costs today.

## Features

- **200 questions** across 5 categories: Food, Transport, Culture, Tech, and more
- **Price trend chart** — a canvas bar chart showing historical price movement for each question
- **Instant feedback** — see your error percentage, the real price, and the price multiplier after each guess
- **AI explanations** — optionally provide an Anthropic API key to receive Claude-powered insights on why prices changed
- **Fallback insights** — every question ships with a detailed written explanation, so the game is fully playable without an API key
- **Stats tracking** — games played, average error, per-category breakdown, and recent game history, all stored in `localStorage`
- **Export / Import** — move your progress across devices via JSON file
- **Dynamic pricing** — current-year prices are extrapolated from historical trend data, so the game stays accurate over time
- **No build step** — plain HTML, CSS, and vanilla JavaScript; open `index.html` directly in a browser

## Categories

| Category  | Examples                                      |
|-----------|-----------------------------------------------|
| Food      | Jjajangmyeon, fried chicken, ramen, coffee    |
| Transport | Seoul subway, taxi, KTX, gasoline             |
| Culture   | Movie ticket, concert, book, gym membership   |
| Tech      | Smartphone, laptop, internet service          |

## Getting Started

No installation or build tools required.

```bash
git clone <repo-url>
cd price-memory
# Open index.html in your browser
```

Or simply double-click `index.html`.

## Optional: AI Explanations

1. Click **"Enable explanations (Optional)"** on the start screen.
2. Paste your [Anthropic API key](https://console.anthropic.com/).
3. The key is stored in `sessionStorage` only and is never sent anywhere except Anthropic's API.

Without a key, each question still shows a pre-written fallback explanation.

## Project Structure

```
price-memory/
├── index.html      # All screens (Start, Game, Result, End, Stats)
├── app.js          # Game logic, question data, stats, AI integration
├── style.css       # Stylesheet (freeCodeCamp "command line chic" design system)
├── favicon.png     # Site icon
└── platform.yaml   # Deployment config
```

## How Scoring Works

After each guess, your error is calculated as:

```
Error % = |guess - real price| / real price * 100
```

| Error     | Label         |
|-----------|---------------|
| 0–10%     | Perfect       |
| 10–20%    | Great         |
| 20–40%    | Good          |
| 40–70%    | Okay          |
| 70%+      | Off           |

Your final skill title is determined by your average error across the session.

## Browser Compatibility

Works in any modern browser (Chrome, Firefox, Safari, Edge). No frameworks, no bundler, no dependencies beyond Google Fonts.

---

## License

Copyright &copy; 2014 [freeCodeCamp.org](https://www.freecodecamp.org)

The content of this repository is bound by the following licenses:

- The computer software is licensed under the [BSD-3-Clause](https://github.com/freeCodeCamp/freeCodeCamp/blob/main/LICENSE.md) license.
- The curriculum content is copyright &copy; 2014 [freeCodeCamp.org](https://www.freecodecamp.org)
