/* ============================================================
   PRICE MEMORY - app.js
   Korean inflation awareness game
   Vanilla JS, no dependencies
============================================================ */

/* ============================================================
   DYNAMIC YEAR + PRICE INTERPOLATION
============================================================ */

const NOW_YEAR = new Date().getFullYear();

/**
 * Interpolate (or extrapolate) a price for a given year from historical trend data.
 * - Within the known range: linear interpolation between surrounding points.
 * - Beyond the last known point: extrapolate using the average annual growth rate
 *   of the last 3 intervals (or fewer if not enough data).
 */
function interpolatePrice(trend, trendYears, targetYear) {
  const last = trendYears.length - 1;

  for (let i = 0; i < last; i++) {
    if (targetYear >= trendYears[i] && targetYear <= trendYears[i + 1]) {
      const ratio = (targetYear - trendYears[i]) / (trendYears[i + 1] - trendYears[i]);
      return Math.round(trend[i] + ratio * (trend[i + 1] - trend[i]));
    }
  }

  // Extrapolate beyond the last data point
  const intervals = Math.min(3, last);
  const avgRate = Math.pow(
    trend[last] / trend[last - intervals],
    1 / (trendYears[last] - trendYears[last - intervals])
  );
  const yearsAhead = targetYear - trendYears[last];
  return Math.round(trend[last] * Math.pow(avgRate, yearsAhead));
}

/* ============================================================
   RAW QUESTION DATA
   Only historical trend data; nowYear and nowPrice are derived below.
============================================================ */

const RAW_QUESTIONS = [
  {
    id: 'jjajang',
    category: 'food',
    item: 'Jjajangmyeon (짜장면)',
    context: 'Standard neighborhood Chinese restaurant',
    pastYear: 1990,
    trend: [700, 900, 1200, 1800, 2500, 3500, 5000, 7000],
    trendYears: [1990, 1994, 1998, 2002, 2006, 2010, 2015, 2024],
    fallbackInsight: 'Jjajangmyeon is the benchmark of Korean working-class food prices. From ₩700 in 1990 to ₩7,000 today: exactly 10×. The Korean government once directly controlled its price. Flour, labor, and rent all rose together. Interestingly, wages grew about 8× in the same period, meaning jjajang got slightly more expensive relative to income.'
  },
  {
    id: 'subway',
    category: 'transport',
    item: 'Seoul Subway Base Fare',
    context: 'Line 1, standard adult ticket',
    pastYear: 1994,
    trend: [300, 400, 500, 700, 900, 1050, 1250, 1500],
    trendYears: [1994, 1997, 1999, 2004, 2007, 2013, 2019, 2024],
    fallbackInsight: 'Seoul subway fares are a textbook example of politically suppressed prices. From ₩300 in 1994 to ₩1,500 today: 5×, but the actual operating cost rose far more. The city government covers the deficit from tax revenue. Compare this to jjajangmyeon at 10×: the subway has been kept artificially cheap for decades.'
  },
  {
    id: 'chicken',
    category: 'food',
    item: 'Fried Chicken (후라이드)',
    context: 'One whole chicken, standard delivery brand',
    pastYear: 1995,
    trend: [5000, 6000, 7000, 8000, 10000, 13000, 17000, 22000],
    trendYears: [1995, 1998, 2001, 2004, 2008, 2012, 2017, 2024],
    fallbackInsight: 'Chicken prices have become a social flashpoint in Korea. From ₩5,000 in 1995 to ₩22,000 today: 4.4×. The hidden driver since 2015: delivery app commissions now eat 15–30% of each order, pushing prices up. "₩30,000 chicken" is no longer a joke; premium brands already cross that line.'
  },
  {
    id: 'movie',
    category: 'culture',
    item: 'Movie Ticket',
    context: 'CGV standard screening, weekend',
    pastYear: 2000,
    trend: [5000, 6000, 7000, 8000, 8000, 9000, 11000, 15000],
    trendYears: [2000, 2003, 2006, 2009, 2012, 2015, 2018, 2024],
    fallbackInsight: 'Movie tickets are a paradox: competing with Netflix made cinemas more expensive, not cheaper. Theaters responded by investing in IMAX and 4DX premium formats, pulling standard prices up with them. From ₩5,000 in 2000 to ₩15,000 today: 3×. A Netflix monthly subscription now costs roughly the same as one weekend ticket.'
  },
  {
    id: 'ramen',
    category: 'food',
    item: 'Shin Ramyun (신라면)',
    context: 'One pack, convenience store price',
    pastYear: 1986,
    trend: [150, 200, 300, 400, 500, 600, 720, 1000],
    trendYears: [1986, 1990, 1995, 2000, 2005, 2010, 2016, 2024],
    fallbackInsight: 'Shin Ramyun launched at ₩150 in 1986. At ₩1,000 today, it has risen about 6.7× over 38 years, actually less than overall inflation of roughly 7–8×. Nongshim held prices down through aggressive mass production and efficiency. Ramyun is one of the few foods that got relatively cheaper in real terms, a rare Korean inflation winner.'
  },
  {
    id: 'bus',
    category: 'transport',
    item: 'Seoul City Bus Fare',
    context: 'Standard bus, adult fare',
    pastYear: 1990,
    trend: [170, 250, 400, 600, 900, 1050, 1200, 1500],
    trendYears: [1990, 1993, 1997, 2002, 2007, 2013, 2019, 2024],
    fallbackInsight: 'Seoul bus fares rose from ₩170 in 1990 to ₩1,500 today: about 8.8×. The 2004 public management reform was a turning point: the city capped fares in exchange for covering operating deficits with tax money. Riders pay less than the true cost; the gap comes from public funds. A deliberate trade-off between affordability and fiscal sustainability.'
  },
  {
    id: 'coke',
    category: 'food',
    item: 'Coca-Cola 500ml',
    context: 'Convenience store price',
    pastYear: 1993,
    trend: [500, 600, 700, 800, 1000, 1200, 1500, 2000],
    trendYears: [1993, 1996, 1999, 2003, 2008, 2012, 2018, 2024],
    fallbackInsight: 'Coke rose from ₩500 in 1993 to ₩2,000 today: 4×. For years the price barely moved, then jumped sharply after 2022. The cause: post-COVID commodity shocks hit sugar, aluminum cans, and logistics simultaneously, worldwide. Korea was not alone; Coca-Cola raised prices across most global markets during 2022–2023, posting record profits in the process.'
  },
  {
    id: 'tv',
    category: 'tech',
    item: '32-inch Samsung TV',
    context: 'Mid-range model, retail price',
    pastYear: 2005,
    trend: [1200000, 900000, 700000, 500000, 400000, 350000, 300000, 350000],
    trendYears: [2005, 2007, 2009, 2011, 2013, 2016, 2020, 2024],
    fallbackInsight: "This is the only item in the game that got cheaper. A 32-inch Samsung TV cost ₩1,200,000 in 2005; today it costs around ₩350,000. LCD and LED manufacturing became vastly more efficient, and Chinese competitors forced prices down. Meanwhile, a bowl of jjajang doubled. Technology follows Moore's Law; food does not."
  },
  {
    id: 'coffee',
    category: 'food',
    item: 'Americano (아메리카노)',
    context: 'Starbucks standard size',
    pastYear: 2000,
    trend: [3000, 3300, 3500, 3800, 4000, 4100, 4500, 5500],
    trendYears: [2000, 2003, 2006, 2009, 2012, 2015, 2019, 2024],
    fallbackInsight: "Starbucks Americano rose from ₩3,000 in 2000 to ₩5,500 today: only 1.8×, one of the slowest rises in this game. Starbucks deliberately kept increases modest to protect its premium brand image. But here's the real shift: in 2000, ₩3,000 bought you 4 bowls of jjajang. Today, ₩5,500 does not even buy one. Coffee won; jjajang lost."
  },
  {
    id: 'taxi',
    category: 'transport',
    item: 'Seoul Taxi Base Fare',
    context: 'Standard taxi, daytime rate',
    pastYear: 1990,
    trend: [700, 1000, 1300, 1600, 2400, 3000, 3800, 4800],
    trendYears: [1990, 1994, 1998, 2002, 2007, 2013, 2019, 2024],
    fallbackInsight: 'Seoul taxi base fares rose from ₩700 in 1990 to ₩4,800 today: nearly 7×. The single biggest jump came in 2023, when fares leapt from ₩3,800 to ₩4,800 overnight, a 26% hike. Behind it: Kakao Taxi\'s dominance shifted bargaining power to drivers, and fuel plus labor costs had been building for years. Night surcharges and distance fees make the real increase even steeper.'
  }
];

/* ============================================================
   DERIVE QUESTIONS with dynamic nowYear / nowPrice
============================================================ */

const QUESTIONS = RAW_QUESTIONS.map(q => {
  const nowPrice = interpolatePrice(q.trend, q.trendYears, NOW_YEAR);
  const trendYears = [...q.trendYears];
  const trend = [...q.trend];

  // Append NOW_YEAR to trend arrays if it's not already the last point
  if (trendYears[trendYears.length - 1] !== NOW_YEAR) {
    trendYears.push(NOW_YEAR);
    trend.push(nowPrice);
  }

  return { ...q, nowYear: NOW_YEAR, nowPrice, trend, trendYears };
});

/* ============================================================
   UTILITY FUNCTIONS
============================================================ */

/** Format a number as Korean Won: 15000 → "₩15,000" */
function formatWon(n) {
  return '₩' + n.toLocaleString('ko-KR');
}

/** Shuffle an array (Fisher-Yates) */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Clamp a value between min and max */
function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

/** Return accuracy label based on error percentage */
function getAccuracyLabel(errorPct) {
  if (errorPct <= 5)  return 'Perfect instinct';
  if (errorPct <= 15) return 'Sharp eye';
  if (errorPct <= 30) return 'Close enough';
  if (errorPct <= 60) return 'Off the mark';
  return 'Far off';
}

/** Return skill title for end screen based on average error */
function getSkillTitle(avgError) {
  if (avgError <= 10) return 'Price Genius: Local Level';
  if (avgError <= 20) return 'Sharp Traveler';
  if (avgError <= 35) return 'Getting There';
  if (avgError <= 60) return 'Price Rookie';
  return 'Keep Practicing';
}

/* ============================================================
   CANVAS BAR CHART
   Renders a simple bar chart using the Canvas 2D API.
   The last bar is highlighted in accent yellow.
============================================================ */

function drawBarChart(canvas, trend, trendYears) {
  const ctx = canvas.getContext('2d');
  const dpr  = window.devicePixelRatio || 1;

  // Set physical pixel size for sharp rendering on HiDPI screens
  const cssWidth  = canvas.clientWidth  || canvas.width;
  const cssHeight = canvas.clientHeight || canvas.height;
  canvas.width  = cssWidth  * dpr;
  canvas.height = cssHeight * dpr;
  ctx.scale(dpr, dpr);

  const W = cssWidth;
  const H = cssHeight;

  ctx.clearRect(0, 0, W, H);

  const n          = trend.length;
  const labelH     = 22;          // height reserved for year labels
  const chartH     = H - labelH;
  const barGap     = 6;
  const totalGap   = barGap * (n + 1);
  const barWidth   = (W - totalGap) / n;
  const maxPrice   = Math.max(...trend);

  trend.forEach((price, i) => {
    const barH  = Math.max(4, (price / maxPrice) * (chartH - 8));
    const x     = barGap + i * (barWidth + barGap);
    const y     = chartH - barH;
    const isLast = i === n - 1;

    // Bar fill
    ctx.fillStyle = isLast ? '#f1be32' : '#3b3b4f';
    ctx.fillRect(x, y, barWidth, barH);

    // Year label beneath the bar
    ctx.fillStyle    = '#dfdfe2';
    ctx.font         = `${Math.min(11, Math.floor(barWidth * 0.7))}px 'Courier New', monospace`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';

    // Show only the last 2 digits of the year to save horizontal space
    const yearStr = String(trendYears[i]).slice(2);
    ctx.fillText("'" + yearStr, x + barWidth / 2, chartH + 4);
  });
}

/* ============================================================
   ANTHROPIC API - AI INSIGHT FETCH
============================================================ */

/**
 * Fetch an AI-generated insight from the Anthropic API.
 * Falls back to the provided fallback string on any error.
 * Updates targetElement.textContent in both success and failure cases.
 */
async function fetchInsight(prompt, fallback, targetElement) {
  const apiKey = sessionStorage.getItem('priceMemoryApiKey');
  targetElement.textContent = 'Analyzing...';

  if (!apiKey) {
    targetElement.textContent = fallback;
    return;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const text = data.content?.map(c => c.text || '').join('') || fallback;
    targetElement.textContent = text;
  } catch (err) {
    targetElement.textContent = fallback;
  }
}

/* ============================================================
   GAME STATE
============================================================ */

const state = {
  selectedCategory: 'all',  // current category filter
  queue:            [],      // shuffled question pool for this round
  currentIndex:     0,       // index into queue (0–4)
  results:          [],      // { question, userGuess, errorPct } per question answered
  currentQuestion:  null     // the active question object
};

/* ============================================================
   SCREEN MANAGEMENT
   Show one screen at a time by toggling the .active class.
============================================================ */

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

/* ============================================================
   SCREEN 1: START - setup and category filtering
============================================================ */

function initStartScreen() {
  // Restore saved API key for this session
  const saved = sessionStorage.getItem('priceMemoryApiKey');
  if (saved) {
    document.getElementById('api-key-input').value = saved;
  }

  // Category filter buttons
  document.getElementById('category-filters').addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.selectedCategory = btn.dataset.category;
  });

  // Start button
  document.getElementById('start-btn').addEventListener('click', startGame);
}

function startGame() {
  // Save API key to sessionStorage
  const key = document.getElementById('api-key-input').value.trim();
  if (key) {
    sessionStorage.setItem('priceMemoryApiKey', key);
  } else {
    sessionStorage.removeItem('priceMemoryApiKey');
  }

  // Filter questions by selected category, then pick 5 at random
  const pool = state.selectedCategory === 'all'
    ? QUESTIONS
    : QUESTIONS.filter(q => q.category === state.selectedCategory);

  if (pool.length === 0) {
    alert('No questions available for this category.');
    return;
  }

  state.queue   = shuffle(pool).slice(0, 5);
  state.results = [];
  state.currentIndex = 0;

  showScreen('screen-game');
  loadQuestion(state.queue[0]);
}

/* ============================================================
   SCREEN 2: GAME - display question + chart, handle submission
============================================================ */

function loadQuestion(q) {
  state.currentQuestion = q;

  // Progress dots
  renderProgressDots(state.currentIndex, state.queue.length);

  // Populate question card fields
  document.getElementById('q-category').textContent   = q.category;
  document.getElementById('q-item').textContent        = q.item;
  document.getElementById('q-context').textContent     = q.context;
  document.getElementById('q-past-year').textContent   = q.pastYear;
  document.getElementById('q-now-year').textContent    = q.nowYear;
  document.getElementById('q-past-year-label').textContent = q.pastYear;

  // Past price: find the price that corresponds to pastYear in the trend
  const pastIdx = q.trendYears.indexOf(q.pastYear);
  const pastPrice = pastIdx >= 0 ? q.trend[pastIdx] : q.trend[0];
  document.getElementById('q-past-price').textContent = formatWon(pastPrice);

  // Clear previous guess and error
  const guessInput = document.getElementById('guess-input');
  guessInput.value = '';
  document.getElementById('guess-error').textContent = '';

  // Draw bar chart on canvas
  const canvas = document.getElementById('trend-chart');
  // Use requestAnimationFrame to ensure the canvas has laid out
  requestAnimationFrame(() => drawBarChart(canvas, q.trend, q.trendYears));

  // Focus the guess input
  guessInput.focus();
}

/** Render progress dots: done (green) → active (yellow) → upcoming (gray) */
function renderProgressDots(activeIndex, total) {
  const container = document.getElementById('progress-dots');
  container.innerHTML = '';
  for (let i = 0; i < total; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot';
    if (i < activeIndex)    dot.classList.add('done');
    if (i === activeIndex)  dot.classList.add('active');
    container.appendChild(dot);
  }
}

function initGameScreen() {
  document.getElementById('submit-btn').addEventListener('click', handleSubmit);

  // Allow Enter key to submit on the game screen
  document.getElementById('guess-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleSubmit();
  });
}

function handleSubmit() {
  const input   = document.getElementById('guess-input');
  const errorEl = document.getElementById('guess-error');
  const raw     = input.value.trim();

  // Validation: reject empty, zero, or negative values
  if (raw === '' || isNaN(Number(raw))) {
    errorEl.textContent = 'Please enter a number.';
    input.focus();
    return;
  }
  const guess = Number(raw);
  if (guess <= 0) {
    errorEl.textContent = 'Price must be greater than ₩0.';
    input.focus();
    return;
  }
  errorEl.textContent = '';

  // Calculate error percentage
  const q         = state.currentQuestion;
  const real      = q.nowPrice;
  const errorPct  = Math.round(Math.abs(guess - real) / real * 100);
  const direction = guess > real ? 'overestimated' : 'underestimated';

  // Store result
  state.results.push({ question: q, userGuess: guess, errorPct, direction });

  showResultScreen(q, guess, errorPct, direction);
}

/* ============================================================
   SCREEN 3: RESULT - show answer, trigger AI explanation
============================================================ */

function showResultScreen(q, userGuess, errorPct, direction) {
  showScreen('screen-result');

  // Past price value (first data point at pastYear)
  const pastIdx  = q.trendYears.indexOf(q.pastYear);
  const pastPrice = pastIdx >= 0 ? q.trend[pastIdx] : q.trend[0];

  // Multiplier from past to now
  const multiplier = (q.nowPrice / pastPrice).toFixed(1);

  // Error % and accuracy label
  document.getElementById('r-error-pct').textContent       = errorPct + '%';
  document.getElementById('r-accuracy-label').textContent  = getAccuracyLabel(errorPct);
  document.getElementById('r-now-year').textContent         = q.nowYear;
  document.getElementById('r-user-guess').textContent      = formatWon(userGuess);
  document.getElementById('r-real-price').textContent      = formatWon(q.nowPrice);

  // Multiplier line
  document.getElementById('r-past-display').textContent    = formatWon(pastPrice) + ' (' + q.pastYear + ')';
  document.getElementById('r-multiplier').textContent      = multiplier + '× increase';

  // Proportional bar visual: past bar is always at some proportion of 100%
  // Now bar width is relative to past bar, capped at 100%
  const nowWidth  = clamp((q.nowPrice / pastPrice) * (pastPrice / Math.max(q.nowPrice, pastPrice)) * 100, 2, 100);
  const pastWidth = clamp((pastPrice  / Math.max(q.nowPrice, pastPrice)) * 100, 2, 100);

  // Animate bars in after a short delay
  const barPast = document.getElementById('bar-past');
  const barNow  = document.getElementById('bar-now');
  barPast.style.width = '0';
  barNow.style.width  = '0';
  requestAnimationFrame(() => {
    setTimeout(() => {
      barPast.style.width = pastWidth + '%';
      barNow.style.width  = nowWidth  + '%';
    }, 80);
  });

  // AI explanation
  const insightEl = document.getElementById('r-insight');
  const prompt = buildQuestionPrompt(q, userGuess, errorPct, direction);
  fetchInsight(prompt, q.fallbackInsight, insightEl);

  // "Next Question →" button: update label on last question
  const nextBtn = document.getElementById('next-btn');
  const isLast  = state.currentIndex >= state.queue.length - 1;
  nextBtn.textContent = isLast ? 'See Results →' : 'Next Question →';
}

/** Build the per-question AI prompt */
function buildQuestionPrompt(q, userGuess, errorPct, direction) {
  const pastIdx   = q.trendYears.indexOf(q.pastYear);
  const pastPrice = pastIdx >= 0 ? q.trend[pastIdx] : q.trend[0];
  const multiplier = (q.nowPrice / pastPrice).toFixed(1);

  return `You are a Korean economic history expert helping users learn about inflation through a game.
Item: ${q.item} (${q.context})

Price in ${q.pastYear}: ₩${pastPrice.toLocaleString()}
Price in ${q.nowYear}: ₩${q.nowPrice.toLocaleString()} (${multiplier}× increase)

User's guess: ₩${userGuess.toLocaleString()} (${direction}: ${errorPct}% off)
Note: nowYear is dynamically set to the current calendar year via new Date().getFullYear().
Write exactly 3 sentences in English:
1. The 1–2 key reasons this price changed the way it did
2. An interesting social or economic context specific to Korea
3. A memorable comparison anchor to help them retain the intuition

Tone: Friendly, like a well-traveled friend who knows Korean economics.
Style: Conversational, no jargon, concrete and specific.`;
}

function initResultScreen() {
  document.getElementById('next-btn').addEventListener('click', () => {
    state.currentIndex++;
    if (state.currentIndex < state.queue.length) {
      showScreen('screen-game');
      loadQuestion(state.queue[state.currentIndex]);
    } else {
      showEndScreen();
    }
  });
}

/* ============================================================
   SCREEN 4: END - final scores + AI summary
============================================================ */

function showEndScreen() {
  showScreen('screen-end');

  const results = state.results;
  const n       = results.length;

  // Average error
  const avgError = Math.round(results.reduce((s, r) => s + r.errorPct, 0) / n);

  // Best (lowest error) and worst (highest error)
  const sorted   = [...results].sort((a, b) => a.errorPct - b.errorPct);
  const best     = sorted[0];
  const worst    = sorted[sorted.length - 1];

  // Questions within 20% accuracy
  const within20 = results.filter(r => r.errorPct <= 20).length;

  // Skill title
  document.getElementById('e-skill-title').textContent = getSkillTitle(avgError);

  // Score grid
  document.getElementById('e-avg-error').textContent  = avgError + '%';
  document.getElementById('e-best-pct').textContent   = best.errorPct + '%';
  document.getElementById('e-within-20').textContent  = within20 + '/' + n;
  document.getElementById('e-total').textContent      = n;

  // AI summary
  const summaryEl = document.getElementById('e-summary');
  const prompt    = buildEndPrompt(results, avgError, best, worst);

  // Generate a fallback summary from the data in case there's no API key
  const fallback  = generateFallbackSummary(results, avgError, best, worst);
  fetchInsight(prompt, fallback, summaryEl);
}

/** Build the end-of-game AI prompt */
function buildEndPrompt(results, avgError, best, worst) {
  const resultsList = results.map(r =>
    `${r.question.item}: guessed ${formatWon(r.userGuess)}, real ${formatWon(r.question.nowPrice)}, ${r.errorPct}% off`
  ).join('\n');

  return `You are a Korean economic history expert giving feedback after a price-guessing game.
Player results:

Average error: ${avgError}%
Best answer: ${best.question.item} (${best.errorPct}% off)
Worst answer: ${worst.question.item} (${worst.errorPct}% off)
Full results:
${resultsList}

Write exactly 3 sentences in English:
1. Identify what type of items they over- or under-estimated and why that pattern makes sense
2. One key insight about Korean inflation that their results reveal
3. One practical tip for building better price intuition in daily life

Tone: Smart, encouraging, specific to their actual results. Not generic.`;
}

/** Fallback summary when no API key is present */
function generateFallbackSummary(results, avgError, best, worst) {
  const skill = getSkillTitle(avgError);
  return `You finished with an average error of ${avgError}%: ${skill.toLowerCase()}. ` +
    `Your sharpest instinct was for ${best.question.item} (only ${best.errorPct}% off), ` +
    `while ${worst.question.item} surprised you the most (${worst.errorPct}% off). ` +
    `To build price intuition, try checking the prices of everyday items each time you shop; ` +
    `anchoring real numbers to real experiences is the fastest way to develop an economic sixth sense.`;
}

function initEndScreen() {
  document.getElementById('play-again-btn').addEventListener('click', () => {
    showScreen('screen-start');
  });
}

/* ============================================================
   RESIZE HANDLER: redraw chart when window resizes
============================================================ */

let resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const q = state.currentQuestion;
    if (q && document.getElementById('screen-game').classList.contains('active')) {
      drawBarChart(document.getElementById('trend-chart'), q.trend, q.trendYears);
    }
  }, 150);
});

/* ============================================================
   INIT: wire up all screens on DOMContentLoaded
============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initStartScreen();
  initGameScreen();
  initResultScreen();
  initEndScreen();
});
