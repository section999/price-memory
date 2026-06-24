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
  },
  {
    id: 'kimbap',
    category: 'food',
    item: 'Gimbap (김밥)',
    context: 'One roll, standard restaurant',
    pastYear: 1990,
    trend: [500, 700, 1000, 1500, 2000, 2500, 3000, 4000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Gimbap rose from ₩500 in 1990 to ₩4,000 today: 8×. Once called the "national lunch box," it is Korea\'s most accessible street food. Rice, eggs, and vegetables all got more expensive, but the biggest driver is labor: rolling gimbap by hand is skilled, time-intensive work. A convenience store roll is still cheaper, but the homemade-style restaurant version has crossed a price threshold that surprised many Koreans.'
  },
  {
    id: 'samgyeopsal',
    category: 'food',
    item: 'Samgyeopsal (삼겹살)',
    context: '200g per person serving, standard restaurant',
    pastYear: 1995,
    trend: [4000, 6000, 8000, 10000, 12000, 15000, 18000],
    trendYears: [1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Samgyeopsal rose from ₩4,000 per person in 1995 to ₩18,000 today: 4.5×. Pork belly itself hasn\'t risen dramatically, but everything around it has: charcoal or gas, lettuce, garlic, dipping sauces, and above all, restaurant rent and labor. Every outbreak of foot-and-mouth disease or African Swine Fever (ASF) triggers a short-term price spike. Samgyeopsal is the ultimate benchmark of the Korean social dining experience.'
  },
  {
    id: 'soju',
    category: 'food',
    item: 'Soju — Restaurant Bottle (소주)',
    context: 'One 360ml bottle, standard restaurant',
    pastYear: 1990,
    trend: [700, 1000, 1500, 2000, 3000, 4000, 5000, 6000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Restaurant soju jumped from ₩700 in 1990 to ₩6,000 today: 8.6×. The supermarket price is only around ₩1,500 — the gap reveals how much rent, labor, and markup inflate the dining-out version. Post-COVID rent spikes hit restaurants hard, and soju became a convenient way to recover margin. Koreans notice every ₩500 hike on soju; it is an emotional price point like no other.'
  },
  {
    id: 'bigmac',
    category: 'food',
    item: 'Big Mac (빅맥)',
    context: "McDonald's Korea, standard price",
    pastYear: 1995,
    trend: [2300, 2900, 3200, 3700, 4400, 5400, 6500],
    trendYears: [1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "The Big Mac is used globally as the 'Big Mac Index' to compare purchasing power. In Korea it rose from ₩2,300 in 1995 to ₩6,500 today: 2.8×. McDonald's raises prices conservatively to protect its mass-market image. But two sharp increases in 2022 and 2023, driven by global beef, bread, and labor cost surges, surprised consumers who had trusted the chain to hold the line."
  },
  {
    id: 'naengmyeon',
    category: 'food',
    item: 'Naengmyeon (냉면)',
    context: 'One bowl, standard restaurant',
    pastYear: 1990,
    trend: [2000, 3000, 4000, 5000, 7000, 8000, 10000, 13000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Naengmyeon rose from ₩2,000 in 1990 to ₩13,000 today: 6.5×. The dish requires buckwheat noodles, beef broth, and garnishes — all of which track beef and grain prices. The moment famous old restaurants broke the ₩10,000 barrier around 2019, it became a national talking point. Now ₩13,000–15,000 is standard even at mid-range spots, and the "₩10,000 bowl of naengmyeon" already feels like a memory.'
  },
  {
    id: 'melona',
    category: 'food',
    item: 'Melona Ice Cream (메로나)',
    context: 'One bar, convenience store',
    pastYear: 1992,
    trend: [200, 300, 500, 600, 700, 800, 1000, 1500],
    trendYears: [1992, 1997, 2002, 2006, 2010, 2014, 2018, 2024],
    fallbackInsight: "Melona launched in 1992 at ₩200 — Korea's quintessential summer treat. It has risen to ₩1,500 today: 7.5×. For years, ice cream prices were one of Korea's most politically sensitive categories; manufacturers absorbed cost increases to avoid backlash. Then in 2022, raw material and logistics shocks forced simultaneous hikes industry-wide. 'The ₩1,000 Melona' is now nostalgia."
  },
  {
    id: 'bread',
    category: 'food',
    item: 'White Bread Loaf (식빵)',
    context: 'Standard supermarket loaf (~270g)',
    pastYear: 1990,
    trend: [600, 800, 1200, 1500, 2000, 2500, 3000, 3800],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'A loaf of white bread rose from ₩600 in 1990 to ₩3,800 today: 6.3×. Korea imports over 90% of its wheat, making bread prices directly exposed to international grain markets. The 2022 Russian invasion of Ukraine devastated global wheat supply, and Korean bread prices spiked nearly 30% in a single year. It was a vivid reminder of import dependency in something as basic as a morning sandwich.'
  },
  {
    id: 'pizza',
    category: 'food',
    item: 'Delivery Pizza — Regular Size',
    context: "Domino's or Pizza Hut, standard menu",
    pastYear: 2000,
    trend: [12000, 15000, 17000, 19000, 21000, 23000, 28000],
    trendYears: [2000, 2005, 2009, 2012, 2015, 2019, 2024],
    fallbackInsight: 'Delivery pizza rose from ₩12,000 in 2000 to ₩28,000 today: 2.3×. The biggest recent driver is not ingredients but delivery app commissions: Baemin and Coupang Eats now take 15–30% of each order. Pizza chains responded with menu price hikes. Coupons and deals still exist, but the base sticker price has crossed ₩25,000–30,000, making pizza a semi-premium item rather than a casual weeknight meal.'
  },
  {
    id: 'triangle_kimbap',
    category: 'food',
    item: 'Triangle Kimbap (삼각김밥)',
    context: 'Convenience store, standard filling',
    pastYear: 2000,
    trend: [500, 600, 700, 800, 1000, 1200, 1500],
    trendYears: [2000, 2003, 2006, 2009, 2013, 2018, 2024],
    fallbackInsight: 'Triangle kimbap was ₩500 in 2000 — the original Korean convenience meal. At ₩1,500 today, it has only tripled over 24 years: one of the smaller increases in this game. Automated factory production kept costs down. But since 2022, rising rice, sesame oil, and minimum wage costs have pushed prices higher every year. The era of the ₩1,000 onigiri is ending.'
  },
  {
    id: 'seolleongtang',
    category: 'food',
    item: 'Seolleongtang (설렁탕)',
    context: 'One bowl, standard restaurant',
    pastYear: 1990,
    trend: [2000, 3000, 4000, 5000, 7000, 8000, 10000, 12000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Seolleongtang rose from ₩2,000 in 1990 to ₩12,000 today: 6×. The soup requires beef bones simmered for 12+ hours, making energy costs and labor unusually high. It is also a benchmark of "old Seoul" neighborhood dining — the restaurants that served it for decades are closing as rents rise. The bowl you get today costs 6× more than your parents paid, and is often made by fewer people in a smaller kitchen.'
  },
  {
    id: 'ktx',
    category: 'transport',
    item: 'KTX Seoul–Busan',
    context: 'Standard seat, one way',
    pastYear: 2004,
    trend: [41500, 44800, 49800, 53600, 59800, 59800, 62800],
    trendYears: [2004, 2007, 2010, 2013, 2017, 2020, 2024],
    fallbackInsight: 'KTX Seoul–Busan launched in 2004 at ₩41,500 and sits at ₩62,800 today: a 51% rise. Compared to food prices that have tripled or more, the KTX has stayed remarkably affordable. As a state-owned rail system, KORAIL suppresses fare increases for political and social reasons. The real cost of operating high-speed rail is far higher than the ticket price; the gap is covered by public funds.'
  },
  {
    id: 'gasoline',
    category: 'transport',
    item: 'Gasoline (휘발유)',
    context: 'Per liter, national average pump price',
    pastYear: 1995,
    trend: [600, 1000, 1400, 1900, 1750, 1600, 1400, 1700],
    trendYears: [1995, 2000, 2005, 2008, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Gasoline rose from ₩600/L in 1995 to ₩1,700 in 2024: 2.8×. But the chart is a roller coaster. The 2008 oil crisis pushed it past ₩1,900; the 2020 COVID collapse pulled it below ₩1,400; the 2022 energy crisis spiked it again. About 50% of the pump price is taxes. Korea\'s gasoline price is almost entirely set by two things: the global crude market and the Korean tax code.'
  },
  {
    id: 'expressway_toll',
    category: 'transport',
    item: 'Highway Toll Seoul–Busan',
    context: 'Passenger car, Gyeongbu Expressway (경부고속도로)',
    pastYear: 1995,
    trend: [10900, 14400, 18600, 23900, 24100, 24100, 26000],
    trendYears: [1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'The Seoul–Busan highway toll rose from ₩10,900 in 1995 to ₩26,000 today: 2.4×. For a public infrastructure fee, this is a relatively modest rise. Korea Expressway Corporation is state-owned and politically constrained on price. But private expressways (민자고속도로) are a different story — their tolls rose far faster with less oversight, creating a two-tier system on Korea\'s roads.'
  },
  {
    id: 'karaoke',
    category: 'culture',
    item: 'Norebang (노래방)',
    context: 'Per hour, standard private room',
    pastYear: 1995,
    trend: [3000, 5000, 6000, 8000, 10000, 12000, 15000],
    trendYears: [1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Norebang was born in Korea and spread across Asia. From ₩3,000/hour in 1995 to ₩15,000 today: 5×. Rent, music licensing fees, and equipment upgrades all contributed. The rise of coin-operated mini norebang in the late 2010s created a cheaper alternative, but private room karaoke prices continued climbing. It remains a core Korean social ritual regardless of cost.'
  },
  {
    id: 'jjimjilbang',
    category: 'culture',
    item: 'Jjimjilbang (찜질방)',
    context: 'Entry fee, standard facility',
    pastYear: 1995,
    trend: [3000, 5000, 7000, 8000, 9000, 10000, 12000],
    trendYears: [1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Jjimjilbang entry rose from ₩3,000 in 1995 to ₩12,000 today: 4×. Energy is the dominant cost: heating sauna rooms, pools, and sleeping areas 24/7 is expensive. The 2022 energy price surge hit jjimjilbang especially hard — many raised prices or closed. As an informal overnight shelter for travelers and unhoused people alike, jjimjilbang price hikes have real social consequences beyond mere inconvenience.'
  },
  {
    id: 'pccafe',
    category: 'culture',
    item: 'PC Café (PC방)',
    context: 'Per hour, standard seat',
    pastYear: 1999,
    trend: [1000, 1000, 1000, 1000, 1000, 1500, 2000],
    trendYears: [1999, 2003, 2007, 2011, 2016, 2020, 2024],
    fallbackInsight: 'PC cafés held ₩1,000 per hour for nearly two decades — one of the most remarkable price locks in Korean consumer history. Competition was so intense that no one dared raise prices. Then in the 2020s, rising minimum wages and rent finally broke the dam. ₩2,000/hour is now common in urban areas. The "₩1,000 PC bang" era, central to Korean gaming culture, is officially over.'
  },
  {
    id: 'newspaper',
    category: 'culture',
    item: 'Newspaper Subscription (신문)',
    context: 'Monthly subscription, major daily paper',
    pastYear: 1990,
    trend: [3000, 5000, 7000, 10000, 13000, 15000, 18000, 20000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'A monthly newspaper subscription rose from ₩3,000 in 1990 to ₩20,000 today: 6.7×. But readership has collapsed. As advertising moved online, publishers lost revenue and compensated by raising subscription prices. This created a doom loop: higher prices drove more cancellations, which required further price hikes. Print journalism is now expensive and niche — a textbook example of a dying industry\'s pricing spiral.'
  },
  {
    id: 'novel',
    category: 'culture',
    item: 'Korean Novel (소설책)',
    context: 'New release, major publisher',
    pastYear: 1990,
    trend: [3000, 5000, 7000, 8000, 10000, 12000, 14000, 17000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'A Korean novel cost ₩3,000 in 1990 and costs ₩17,000 today: 5.7×. Paper, printing, and labor all rose. E-books are now 60–70% of the print price, but many readers still prefer physical books. The bigger story: Korean publishing is thriving globally thanks to the Hallyu wave — BTS, Squid Game, and Korean literature exports are all rising. The industry is paradoxical: culturally booming, economically fragile.'
  },
  {
    id: 'baseball',
    category: 'culture',
    item: 'KBO Baseball Ticket',
    context: 'Standard seat (일반석), KBO League',
    pastYear: 2000,
    trend: [3000, 5000, 8000, 10000, 12000, 13000, 15000],
    trendYears: [2000, 2005, 2010, 2015, 2019, 2022, 2024],
    fallbackInsight: 'KBO baseball tickets rose from ₩3,000 in 2000 to ₩15,000 today: 5×. Baseball attendance has boomed, especially since 2023–2024 when the league set new records. As demand exploded, teams raised prices aggressively. Premium seating now commands ₩30,000–50,000. Chimaek (chicken + beer) at the stadium adds another ₩20,000+. A family outing to a game is now a significant expense.'
  },
  {
    id: 'galaxy',
    category: 'tech',
    item: 'Samsung Galaxy Flagship (갤럭시)',
    context: 'S-series top model, launch retail price',
    pastYear: 2010,
    trend: [800000, 900000, 900000, 990000, 1000000, 1250000, 1350000],
    trendYears: [2010, 2012, 2014, 2016, 2019, 2022, 2024],
    fallbackInsight: "Samsung's Galaxy flagship rose from ₩800,000 in 2010 to ₩1,350,000 today: 1.7×. But performance improved perhaps 1,000×. Whether this counts as inflation depends on how you measure it. In absolute won terms, flagship phones got more expensive; in performance-per-won terms, they got dramatically cheaper. The real shift: mid-range phones now outperform 2010's flagship, making the premium segment feel increasingly optional."
  },
  {
    id: 'internet',
    category: 'tech',
    item: 'Home Internet (인터넷)',
    context: 'Monthly broadband subscription',
    pastYear: 2000,
    trend: [35000, 30000, 27000, 25000, 25000, 27000, 30000],
    trendYears: [2000, 2005, 2008, 2012, 2016, 2020, 2024],
    fallbackInsight: 'Home internet is one of the few items that got cheaper. From ₩35,000/month in 2000 to ₩25,000 at its cheapest (2012–2018), before creeping back to ₩30,000. Technology cost curves and fierce ISP competition drove the decline. Korea went from dial-up to the world\'s fastest broadband without a significant price increase. In this game, almost everything went up — internet is the rare exception, and it\'s worth noticing.'
  },
  {
    id: 'laptop',
    category: 'tech',
    item: 'Mid-range Laptop (노트북)',
    context: 'Samsung/LG standard model',
    pastYear: 2000,
    trend: [1500000, 1200000, 900000, 700000, 700000, 800000, 1000000],
    trendYears: [2000, 2004, 2008, 2012, 2016, 2020, 2024],
    fallbackInsight: 'A mid-range laptop cost ₩1,500,000 in 2000 and costs around ₩1,000,000 today — nominally 33% cheaper, but infinitely more powerful. It dropped to ₩700,000 by 2012 as manufacturing scaled. Then pandemic demand and chip shortages pushed prices back up. The real question is not "did the price change?" but "how much computing power does ₩1 million buy?" — and that answer is incomparably better today.'
  },
  {
    id: 'wireless_earphones',
    category: 'tech',
    item: 'Wireless Earphones (무선 이어폰)',
    context: 'Mid-range TWS earphones',
    pastYear: 2017,
    trend: [150000, 120000, 100000, 80000, 70000],
    trendYears: [2017, 2019, 2020, 2022, 2024],
    fallbackInsight: "TWS earphones entered mass market around 2017 at ₩150,000 for a decent mid-range pair. By 2024 you can find capable ones for ₩70,000: a 53% price drop in 7 years. Chinese manufacturers commoditized the category with remarkable speed. This is the tech deflation story compressed into a single product cycle. In a game full of items that cost 4–10× more than before, wireless earphones went the other way entirely."
  },

  // ── FOOD (25 more) ──────────────────────────────────────────
  {
    id: 'donkkaseu',
    category: 'food',
    item: 'Donkkaseu (돈가스)',
    context: 'Standard pork cutlet restaurant',
    pastYear: 1990,
    trend: [2000, 3000, 4000, 5000, 7000, 8000, 10000, 13000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Donkkaseu rose from ₩2,000 in 1990 to ₩13,000 today: 6.5×. A staple of Korean school cafeterias and family restaurants, the dish requires pork loin, breadcrumbs, and frying oil — all of which rose in price. Energy costs for commercial fryers are significant. The "학생 돈가스" that once cost pocket money is now a sit-down meal expense.'
  },
  {
    id: 'sundaegukbap',
    category: 'food',
    item: 'Sundae Gukbap (순대국밥)',
    context: 'One bowl, standard restaurant',
    pastYear: 1990,
    trend: [1500, 2000, 3000, 4000, 5000, 7000, 8000, 10000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Sundae gukbap rose from ₩1,500 in 1990 to ₩10,000 today: 6.7×. Once the cheapest hot meal a Korean worker could buy, it is now approaching five digits. Pork offal and blood sausage prices track pork industry costs closely. The meal\'s working-class identity is now at odds with its climbing price tag.'
  },
  {
    id: 'bibimbap',
    category: 'food',
    item: 'Bibimbap (비빔밥)',
    context: 'One bowl, standard restaurant',
    pastYear: 1990,
    trend: [2000, 3000, 4000, 5000, 7000, 8000, 10000, 12000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Bibimbap rose from ₩2,000 in 1990 to ₩12,000 today: 6×. The dish requires over 10 separate vegetable toppings, each prepared individually — labor-intensive even by Korean standards. It is now served in airline business class and high-end restaurants globally, yet the neighborhood bowl has also quietly crossed the ₩10,000 barrier.'
  },
  {
    id: 'kimchijjigae',
    category: 'food',
    item: 'Kimchi Jjigae (김치찌개)',
    context: 'Per person, standard restaurant',
    pastYear: 1990,
    trend: [1500, 2500, 3500, 4500, 6000, 7000, 8000, 10000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Korea's national comfort food rose from ₩1,500 in 1990 to ₩10,000 today: 6.7×. Made from aged kimchi, pork, and tofu — all of which rose in price. Its widespread availability made it a go-to cheap meal for decades, but it has now crossed the ₩10,000 mark alongside nearly every other Korean staple."
  },
  {
    id: 'samgyetang',
    category: 'food',
    item: 'Samgyetang (삼계탕)',
    context: 'One whole chicken, standard restaurant',
    pastYear: 1990,
    trend: [5000, 7000, 10000, 12000, 14000, 16000, 18000, 22000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Samgyetang rose from ₩5,000 in 1990 to ₩22,000 today: 4.4×. Traditionally eaten on the hottest days of summer (복날), it requires a whole small chicken, ginseng, jujubes, and garlic — ingredients that all rose with agricultural inflation. Avian flu outbreaks periodically spike chicken prices. As a seasonal ritual dish, consumers pay a premium without much resistance.'
  },
  {
    id: 'tteokbokki',
    category: 'food',
    item: 'Tteokbokki (떡볶이)',
    context: 'Standard street food portion',
    pastYear: 1990,
    trend: [500, 700, 1000, 1500, 2000, 3000, 4000, 5000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Tteokbokki rose from ₩500 in 1990 to ₩5,000 today: 10×. Korea's most iconic street food has risen as fast as jjajangmyeon over the same period. Rice cake prices track rice costs; gochujang has also risen sharply. The dish migrated from pojangmacha carts to franchise chains, which brought standardization but also higher margins."
  },
  {
    id: 'kalguksu',
    category: 'food',
    item: 'Kalguksu (칼국수)',
    context: 'One bowl, standard restaurant',
    pastYear: 1990,
    trend: [1500, 2000, 3000, 4000, 5000, 7000, 8000, 10000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Kalguksu rose from ₩1,500 in 1990 to ₩10,000 today: 6.7×. The dish depends heavily on wheat flour — a global commodity that spiked dramatically in 2022 due to the Ukraine conflict. Kalguksu restaurants were among the first to announce ₩10,000 prices and face customer backlash. The hand-cut noodle, once the humble alternative to ramen, has joined the five-figure club.'
  },
  {
    id: 'sundubujjigae',
    category: 'food',
    item: 'Sundubu Jjigae (순두부찌개)',
    context: 'One serving, standard restaurant',
    pastYear: 1995,
    trend: [3000, 4000, 5000, 6000, 7000, 8000, 10000],
    trendYears: [1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Sundubu jjigae rose from ₩3,000 in 1995 to ₩10,000 today: 3.3×. One of the slower inflation rates in Korean food, partly because tofu production is highly mechanized and soybean imports have been relatively stable. Yet the restaurant price has still more than tripled, driven primarily by labor and rent rather than ingredients.'
  },
  {
    id: 'convenience_lunch',
    category: 'food',
    item: 'Convenience Store Lunchbox (도시락)',
    context: 'Standard meal set, CU/GS25/7-Eleven',
    pastYear: 2000,
    trend: [2000, 2500, 3000, 3500, 4000, 4500, 5500],
    trendYears: [2000, 2004, 2008, 2011, 2015, 2019, 2024],
    fallbackInsight: "Convenience store lunchboxes rose from ₩2,000 in 2000 to ₩5,500 today: 2.75×. The industry's scale and automation kept price increases modest for years. But since 2022, rice, meat, and packaging costs all spiked simultaneously. The convenience lunchbox became a national symbol during the 2023 'lunchflation' debate, when restaurant prices drove workers toward it — only to find it had also jumped."
  },
  {
    id: 'latte',
    category: 'food',
    item: 'Café Latte (라떼)',
    context: 'Starbucks Korea, tall size',
    pastYear: 2000,
    trend: [3500, 3800, 4000, 4300, 4600, 5000, 6100],
    trendYears: [2000, 2003, 2006, 2009, 2012, 2016, 2024],
    fallbackInsight: 'A Starbucks latte rose from ₩3,500 in 2000 to ₩6,100 today: 1.7×, one of the slowest rises in this game. Starbucks deliberately suppresses price increases to protect its aspirational brand. But milk prices jumped 30% in 2022–2023, finally forcing a hike. Relative to general inflation, a Starbucks latte has actually gotten cheaper in real terms over 24 years.'
  },
  {
    id: 'draft_beer',
    category: 'food',
    item: 'Draft Beer (생맥주)',
    context: 'One 500ml glass, standard restaurant/hof',
    pastYear: 1990,
    trend: [1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Draft beer rose from ₩1,000 in 1990 to ₩6,000 today: 6×. Beer itself is relatively cheap; what costs money is the venue. Post-COVID rent and labor surges pushed hof (Korean beer pub) prices up sharply. The classic chimaek (chicken + beer) combo that once cost ₩15,000 for two people now runs ₩30,000–40,000."
  },
  {
    id: 'makgeolli',
    category: 'food',
    item: 'Makgeolli (막걸리)',
    context: 'One bottle, standard restaurant',
    pastYear: 1990,
    trend: [500, 800, 1200, 1500, 2000, 2500, 3000, 4000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Restaurant makgeolli rose from ₩500 in 1990 to ₩4,000 today: 8×. Korea's traditional rice wine was once the cheapest alcoholic drink available. Supermarket prices remain under ₩2,000, but the restaurant premium has grown dramatically. The drink has transformed from a laborer's staple into a trending artisan product, with craft versions exceeding ₩10,000."
  },
  {
    id: 'rice_20kg',
    category: 'food',
    item: 'Rice (쌀) — 20kg Bag',
    context: 'Standard white rice, major supermarket',
    pastYear: 1990,
    trend: [20000, 28000, 35000, 40000, 50000, 45000, 50000, 58000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "A 20kg bag of rice rose from ₩20,000 in 1990 to ₩58,000 today: 2.9×. Rice is one of the slowest-rising foods in Korea due to heavy government intervention: price supports for farmers and strategic stockpiling cap both floors and ceilings. Yet even with intervention, rice costs nearly triple what it did 30 years ago. Korea's rice consumption has also halved as diets diversified."
  },
  {
    id: 'milk',
    category: 'food',
    item: 'Milk (우유) — 1L',
    context: 'Standard whole milk, major supermarket',
    pastYear: 1990,
    trend: [500, 700, 900, 1100, 1400, 1800, 2000, 2500],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Milk rose from ₩500/L in 1990 to ₩2,500 today: 5×. Korean dairy farming is heavily protected: raw milk prices are set by a government-negotiated system, not the market. This means Korean milk costs far more than imported alternatives, but it shields domestic farmers. In 2023, the raw milk price was raised by the largest amount in 10 years, flowing immediately to store shelves.'
  },
  {
    id: 'eggs_30',
    category: 'food',
    item: 'Eggs (계란) — 30-Pack',
    context: 'Standard tray, major supermarket',
    pastYear: 1990,
    trend: [1500, 2000, 2500, 3000, 4000, 5000, 6000, 8000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'A 30-pack of eggs rose from ₩1,500 in 1990 to ₩8,000 today: 5.3×. But the chart has violent spikes: every major avian influenza outbreak culls tens of millions of hens, sending prices surging 50–100% in weeks. The 2017 outbreak was so severe the government temporarily allowed imports. Egg prices are a leading indicator of food anger in Korean politics.'
  },
  {
    id: 'snack_shrimp',
    category: 'food',
    item: 'Saewoo Kang (새우깡)',
    context: 'Standard 90g bag, convenience store',
    pastYear: 1990,
    trend: [200, 300, 500, 600, 700, 800, 1000, 1500],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Saewoo Kang (shrimp crackers) launched in 1971 and has been Korea's best-selling snack for over 50 years. From ₩200 in 1990 to ₩1,500 today: 7.5×. Nongshim held the price at ₩800 for years before a major jump in 2022. The bag size has quietly shrunk while the price rose — a phenomenon economists call 'shrinkflation.' You are paying more for less, twice over."
  },
  {
    id: 'instant_coffee',
    category: 'food',
    item: 'Maxim Coffee Mix (맥심) — 50-Pack',
    context: 'Dongseo Foods, standard box',
    pastYear: 1990,
    trend: [3000, 4000, 5000, 7000, 9000, 12000, 14000, 18000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Maxim coffee mix rose from ₩3,000 for 50 sachets in 1990 to ₩18,000 today: 6×. It has been Korea's default office and home coffee for decades, served at every meeting and condolence call. Coffee bean and sugar prices rose, but the bigger driver is brand premium: Maxim holds ~70% market share and prices accordingly."
  },
  {
    id: 'bubble_tea',
    category: 'food',
    item: 'Bubble Tea (버블티)',
    context: 'Gong Cha or similar chain, standard size',
    pastYear: 2012,
    trend: [3500, 4000, 4500, 5000, 5500, 6000],
    trendYears: [2012, 2015, 2017, 2019, 2022, 2024],
    fallbackInsight: 'Bubble tea entered Korean mainstream around 2012 at ₩3,500 and has risen to ₩6,000 today: 1.7× in 12 years. Relatively modest compared to other food prices, partly because the category is still expansion-focused. Chains also introduced premium add-ons (brown sugar, cheese foam) that quietly pushed average spend higher than the base price suggests.'
  },
  {
    id: 'donut',
    category: 'food',
    item: 'Glazed Donut (도넛)',
    context: "Dunkin' Korea, standard glazed donut",
    pastYear: 1994,
    trend: [500, 700, 900, 1100, 1300, 1500, 1800, 2500],
    trendYears: [1994, 1998, 2002, 2006, 2010, 2014, 2019, 2024],
    fallbackInsight: "Dunkin's glazed donut rose from ₩500 in 1994 to ₩2,500 today: 5×. Dunkin' entered Korea in 1994 and became a teen snack staple. For years the price stayed under ₩1,000, making it one of the cheapest Western treats. The 2022 surge in wheat, oil, and sugar simultaneously hit bakeries across the board. A box of a dozen donuts now costs as much as a full restaurant meal did 20 years ago."
  },
  {
    id: 'lotteria_burger',
    category: 'food',
    item: 'Lotteria Bulgogi Burger (불고기버거)',
    context: 'Lotteria Korea, standard menu price',
    pastYear: 1990,
    trend: [800, 1200, 1700, 2100, 2500, 3000, 3500, 4500],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Lotteria's Bulgogi Burger rose from ₩800 in 1990 to ₩4,500 today: 5.6×. Lotteria opened in 1979 as Korea's first fast food chain and the bulgogi burger became its signature. For decades it was the affordable option compared to McDonald's. The two chains now cost roughly the same, but Lotteria's Korean-style flavors hold nostalgic loyalty among older consumers."
  },
  {
    id: 'galbitang',
    category: 'food',
    item: 'Galbitang (갈비탕)',
    context: 'One bowl, standard restaurant',
    pastYear: 1990,
    trend: [4000, 6000, 8000, 10000, 13000, 15000, 18000, 22000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Galbitang rose from ₩4,000 in 1990 to ₩22,000 today: 5.5×. Beef short rib soup is expensive because short ribs are a premium cut. Korean beef (한우) prices have risen with income levels and quality expectations: consumers increasingly demand domestically raised beef, which costs far more than imported alternatives. Galbitang is now a celebration meal as much as a regular one."
  },
  {
    id: 'convenience_coffee',
    category: 'food',
    item: 'Convenience Store Coffee (편의점 아메리카노)',
    context: 'Fresh-brewed Americano, GS25/CU machine',
    pastYear: 2011,
    trend: [1000, 1000, 1000, 1200, 1500, 1800],
    trendYears: [2011, 2013, 2015, 2018, 2021, 2024],
    fallbackInsight: "Convenience store fresh-brewed coffee launched around 2011 at a disruptive ₩1,000, threatening cafés industry-wide. It held ₩1,000 for years through fierce competition. By 2024 it has risen to ₩1,800 — still the cheapest fresh coffee in Korea, but the original promise is fading. The ₩1,000 coffee was briefly Korea's most disruptive consumer product; that era is ending."
  },
  {
    id: 'kimchi_1kg',
    category: 'food',
    item: 'Cabbage Kimchi (포기김치) — 1kg',
    context: 'Store-bought, major supermarket brand',
    pastYear: 1995,
    trend: [2000, 3000, 4000, 5000, 7000, 8000, 10000, 12000],
    trendYears: [1995, 2000, 2004, 2008, 2012, 2016, 2020, 2024],
    fallbackInsight: "Store-bought kimchi rose from ₩2,000/kg in 1995 to ₩12,000 today: 6×. Napa cabbage (배추) is one of Korea's most politically volatile food prices — a bad harvest triggers a national crisis. The 2010 'kimchi crisis' when cabbage prices spiked 500% in two months forced government imports and dominated headlines. Store-bought has grown as fewer households make their own winter kimchi."
  },
  {
    id: 'japchae',
    category: 'food',
    item: 'Japchae (잡채)',
    context: 'One serving, standard restaurant',
    pastYear: 1990,
    trend: [2000, 3000, 4000, 5000, 7000, 9000, 12000, 15000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Japchae (glass noodle stir-fry) rose from ₩2,000 in 1990 to ₩15,000 today: 7.5×. The dish requires glass noodles, multiple vegetables, beef, and sesame oil — making it labor-intensive even among Korean dishes. It is a staple of Korean celebrations (제사, 생일), so demand stays high regardless of price. Premium japchae with extra beef can now exceed ₩20,000.'
  },
  {
    id: 'convenience_beer',
    category: 'food',
    item: 'Canned Beer (맥주) — 500ml',
    context: 'Convenience store, domestic brand (Hite/Cass)',
    pastYear: 2000,
    trend: [1000, 1200, 1500, 1700, 2000, 2500, 3000],
    trendYears: [2000, 2004, 2008, 2012, 2016, 2020, 2024],
    fallbackInsight: 'A 500ml can of domestic beer rose from ₩1,000 in 2000 to ₩3,000 today: 3×. Korean beer brands long held prices artificially low to compete with imported craft beers that arrived in the 2010s. Post-COVID grain and aluminum cost surges forced them to catch up. "Four cans for ₩10,000" convenience store deals are increasingly being phased out or quietly shrinking.'
  },

  // ── TRANSPORT (10 more) ──────────────────────────────────────
  {
    id: 'express_bus',
    category: 'transport',
    item: 'Express Bus Seoul–Busan',
    context: 'Standard seat (일반), one way',
    pastYear: 1990,
    trend: [5000, 8000, 12000, 17000, 22000, 26000, 28000, 32000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Express bus Seoul–Busan rose from ₩5,000 in 1990 to ₩32,000 today: 6.4×. Before KTX (2004), the express bus was Korea's primary intercity connection. Even now it competes on price with the train. Fuel, driver wages, and terminal fees all contributed. The premium 우등 (luxury class) bus started ₩1,000 above standard and now runs ₩47,000 — the gap has widened considerably."
  },
  {
    id: 'airport_bus',
    category: 'transport',
    item: 'Airport Limousine Bus',
    context: 'Seoul Station to Incheon Airport',
    pastYear: 2001,
    trend: [7000, 9000, 10000, 12000, 14000, 15000, 17000],
    trendYears: [2001, 2005, 2008, 2011, 2015, 2019, 2024],
    fallbackInsight: 'Incheon Airport limousine bus rose from ₩7,000 in 2001 to ₩17,000 today: 2.4×. Fuel, highway tolls, and driver wages all contributed. The bus competes with AREX (Airport Railroad), which opened in 2010 — competition kept prices relatively in check. For budget travelers, it is still 5× cheaper than a taxi to the airport.'
  },
  {
    id: 'mugungwha',
    category: 'transport',
    item: 'Mugunghwa Train Seoul–Busan',
    context: 'Standard seat, one way (무궁화호)',
    pastYear: 1990,
    trend: [6600, 10000, 14000, 19500, 24000, 28200, 28200, 30000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "The Mugunghwa train rose from ₩6,600 in 1990 to ₩30,000 today: 4.5×. For decades it was the people's intercity option: slower but cheaper than the express bus. KTX's 2004 arrival gradually cannibalized its ridership. KORAIL keeps Mugunghwa fares low as a social service, but the trains are aging and routes are being cut. It may not survive another decade."
  },
  {
    id: 'courier',
    category: 'transport',
    item: 'Courier Delivery (택배)',
    context: 'Small box, CJ Logistics door-to-door',
    pastYear: 2000,
    trend: [2000, 2500, 3000, 3500, 4000, 5000, 6000, 7000],
    trendYears: [2000, 2004, 2008, 2012, 2015, 2018, 2021, 2024],
    fallbackInsight: 'Courier delivery rose from ₩2,000 in 2000 to ₩7,000 today: 3.5×. Korea built one of the world\'s most efficient last-mile delivery networks, and for years competition kept prices low. But COVID exploded e-commerce volume while drivers demanded better conditions — the 2021 delivery worker deaths from overwork became a national controversy. The era of ₩2,500 delivery is over.'
  },
  {
    id: 'car_wash',
    category: 'transport',
    item: 'Automatic Car Wash (자동 세차)',
    context: 'Standard tunnel wash, gas station',
    pastYear: 1995,
    trend: [2000, 3000, 4000, 5000, 6000, 7000, 8000, 10000],
    trendYears: [1995, 2000, 2005, 2008, 2012, 2016, 2020, 2024],
    fallbackInsight: 'Automatic car wash rose from ₩2,000 in 1995 to ₩10,000 today: 5×. Water, electricity, cleaning chemicals, and machine maintenance all rose. As car ownership became nearly universal, the market expanded — but so did real estate costs for the large footprints car washes require. Premium touch-free washes now run ₩15,000–20,000.'
  },
  {
    id: 'car_insurance',
    category: 'transport',
    item: 'Car Insurance (자동차 보험)',
    context: 'Annual premium, mid-size sedan, 30-year-old driver',
    pastYear: 1995,
    trend: [300000, 450000, 600000, 700000, 750000, 800000, 850000, 900000],
    trendYears: [1995, 2000, 2005, 2008, 2012, 2016, 2020, 2024],
    fallbackInsight: "Car insurance premiums rose from ₩300,000/year in 1995 to ₩900,000 today: 3×. Repair costs for modern cars packed with sensors are dramatically higher than for older models. Medical cost inflation also raised injury claim payouts. Insurance companies are effectively pricing technology upgrades you didn't choose: a fender bender that cost ₩200,000 to repair in 2005 now costs ₩800,000+."
  },
  {
    id: 'parking',
    category: 'transport',
    item: 'Seoul City Parking (서울 주차)',
    context: '1 hour, public parking lot, central Seoul',
    pastYear: 1995,
    trend: [300, 500, 800, 1000, 1500, 2000, 2500, 3000],
    trendYears: [1995, 2000, 2004, 2008, 2012, 2016, 2020, 2024],
    fallbackInsight: 'Central Seoul parking rose from ₩300/hour in 1995 to ₩3,000 today: 10×. Land values in Seoul have increased astronomically, making an empty parking space one of the most expensive surfaces to maintain. Private parking in Gangnam now exceeds ₩5,000/hour. The government has also deliberately raised public parking fees to discourage driving into the city center.'
  },
  {
    id: 'bicycle',
    category: 'transport',
    item: 'Standard Bicycle (자전거)',
    context: 'City commuter/utility bicycle, mid-range',
    pastYear: 1990,
    trend: [50000, 70000, 90000, 110000, 130000, 150000, 170000, 200000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'A standard commuter bicycle rose from ₩50,000 in 1990 to ₩200,000 today: 4×. Korean cycling transformed: once purely utilitarian, it became a weekend leisure industry in the 2010s. Post-COVID, bicycle demand surged globally and supply chains broke down, causing the single largest price jump in recent years. Entry-level bicycles now cost what a mid-range bike did a decade ago.'
  },
  {
    id: 'moving',
    category: 'transport',
    item: 'Moving Service (포장이사)',
    context: 'Small apartment within Seoul, professional packing',
    pastYear: 1995,
    trend: [100000, 150000, 200000, 280000, 350000, 450000, 550000, 700000],
    trendYears: [1995, 2000, 2005, 2009, 2013, 2017, 2021, 2024],
    fallbackInsight: 'Professional packing moves within Seoul rose from ₩100,000 in 1995 to ₩700,000 today: 7×. Moving is pure labor — packing, carrying, unloading — with a small vehicle cost. Every minimum wage increase passes directly to moving fees. Peak seasons (end of February, end of August, when leases renew) can push prices 2× higher than off-peak.'
  },
  {
    id: 'domestic_flight',
    category: 'transport',
    item: 'Domestic Flight Seoul–Jeju',
    context: 'One way, economy class, non-peak',
    pastYear: 1995,
    trend: [50000, 60000, 70000, 80000, 90000, 100000, 80000, 110000],
    trendYears: [1995, 2000, 2005, 2008, 2012, 2016, 2020, 2024],
    fallbackInsight: 'Seoul–Jeju flights rose from ₩50,000 in 1995 to ₩110,000 today: 2.2×. Budget carriers entered in 2005–2008 and dramatically suppressed prices — a rare case where new competition overrode inflation. Before LCCs, the route was a Korean Air/Asiana duopoly. The Jeju route is the world\'s busiest air corridor: pure volume drives efficiency and keeps prices lower than comparable distances elsewhere.'
  },

  // ── CULTURE (18 more) ────────────────────────────────────────
  {
    id: 'gym',
    category: 'culture',
    item: 'Gym Monthly Membership (헬스장)',
    context: 'Standard fitness center, monthly fee',
    pastYear: 1995,
    trend: [30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000],
    trendYears: [1995, 2000, 2005, 2009, 2013, 2017, 2021, 2024],
    fallbackInsight: 'Gym memberships rose from ₩30,000/month in 1995 to ₩100,000 today: 3.3×. Gyms require large spaces in expensive urban real estate, heavy equipment maintenance, and staffing. Rent inflation in Korean cities hit gyms especially hard. The boom of low-cost 24-hour gyms in the 2020s created some downward pressure, but traditional full-service gyms continued raising prices to differentiate.'
  },
  {
    id: 'haircut',
    category: 'culture',
    item: "Men's Haircut (남성 커트)",
    context: 'Standard barbershop or hair salon',
    pastYear: 1990,
    trend: [2000, 3000, 5000, 7000, 8000, 10000, 12000, 15000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Men's haircuts rose from ₩2,000 in 1990 to ₩15,000 today: 7.5×. Pure labor service: price tracks wages almost directly. ₩1,000 barbershops survived into the 2000s; they are now museum pieces. Low-cost chain salons created a ₩10,000–12,000 floor rather than a ceiling. Premium studios in Hongdae or Apgujeong charge ₩30,000–50,000 for the same basic cut."
  },
  {
    id: 'dry_cleaning',
    category: 'culture',
    item: 'Dry Cleaning — Business Suit',
    context: 'Full suit (jacket + trousers), standard laundry',
    pastYear: 1990,
    trend: [3000, 5000, 7000, 9000, 11000, 13000, 15000, 18000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Dry cleaning a suit rose from ₩3,000 in 1990 to ₩18,000 today: 6×. Chemical, labor, and energy costs all rose. But the category also shrank: remote work after COVID reduced suit usage dramatically. Dry cleaners in office districts report 30–40% volume drops since 2020 even as prices rose. Higher prices and fewer customers is a tough equilibrium.'
  },
  {
    id: 'popcorn',
    category: 'culture',
    item: 'Movie Theater Popcorn',
    context: 'Medium-size bucket, CGV or Lotte Cinema',
    pastYear: 2000,
    trend: [2500, 3000, 3500, 4000, 5000, 6000, 7000, 9000],
    trendYears: [2000, 2003, 2006, 2009, 2012, 2016, 2020, 2024],
    fallbackInsight: 'Movie theater popcorn rose from ₩2,500 in 2000 to ₩9,000 today: 3.6×. Cinemas intentionally subsidize ticket prices with concession margins — a global practice. Corn prices are relatively stable; what you pay for is the location and the captive audience. The popcorn combo (large + two drinks) at CGV can now exceed ₩22,000, rivaling the ticket price itself.'
  },
  {
    id: 'everland',
    category: 'culture',
    item: 'Everland Theme Park Entry',
    context: 'Standard adult day ticket',
    pastYear: 1990,
    trend: [7000, 15000, 21000, 28000, 36000, 46000, 54000, 72000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Everland admission rose from ₩7,000 in 1990 to ₩72,000 today: over 10×. Samsung operates Everland and has invested billions in new rides, positioning it as a premium destination. Dynamic pricing (weekday vs. weekend vs. holiday) means the advertised price is rarely what you actually pay. A family outing that cost ₩30,000 total in 1990 now approaches ₩300,000.'
  },
  {
    id: 'screen_golf',
    category: 'culture',
    item: 'Screen Golf (스크린골프)',
    context: '18 holes, one person, standard facility',
    pastYear: 2005,
    trend: [15000, 20000, 25000, 30000, 35000, 40000],
    trendYears: [2005, 2009, 2012, 2016, 2020, 2024],
    fallbackInsight: 'Screen golf rose from ₩15,000 per round in 2005 to ₩40,000 today: 2.7× in under 20 years. Korea pioneered indoor simulator golf as an affordable alternative to expensive real courses. But rent and equipment costs are high, and rising minimum wages hit the attendant-heavy business model. Still, ₩40,000 for 18 simulated holes remains far cheaper than any real golf course.'
  },
  {
    id: 'bowling',
    category: 'culture',
    item: 'Bowling (볼링)',
    context: 'One game per person, standard bowling alley',
    pastYear: 1995,
    trend: [2000, 2500, 3000, 3500, 4000, 5000, 6000, 7000],
    trendYears: [1995, 2000, 2004, 2008, 2012, 2016, 2020, 2024],
    fallbackInsight: 'Bowling rose from ₩2,000/game in 1995 to ₩7,000 today: 3.5×. Bowling alleys are expensive to operate: large floorplates, lane maintenance, pin machines, and shoe rentals all add up. The industry peaked in the late 1990s and shrank as screen golf and PC cafés drew younger customers. Surviving alleys raised prices to compensate for lower volume.'
  },
  {
    id: 'musical',
    category: 'culture',
    item: 'Musical Theater Ticket (뮤지컬)',
    context: 'R-seat (preferred), mid-scale production',
    pastYear: 2000,
    trend: [30000, 40000, 60000, 80000, 100000, 120000, 150000],
    trendYears: [2000, 2004, 2008, 2012, 2016, 2020, 2024],
    fallbackInsight: "Korean musical theater tickets rose from ₩30,000 in 2000 to ₩150,000 today: 5×. Korea has become the world's third-largest musical theater market after Broadway and the West End. The influx of licensed Broadway shows demanded international royalty fees paid in dollars, exposing ticket prices to exchange rate risk. K-pop stars performing in musicals now drive premium pricing through fan demand."
  },
  {
    id: 'idol_concert',
    category: 'culture',
    item: 'K-pop Concert Ticket',
    context: 'Standard seat, domestic arena concert',
    pastYear: 2000,
    trend: [30000, 50000, 70000, 90000, 110000, 132000, 165000],
    trendYears: [2000, 2004, 2008, 2012, 2016, 2020, 2024],
    fallbackInsight: 'K-pop concert tickets rose from ₩30,000 in 2000 to ₩165,000 today: 5.5×. The Korean Wave transformed idol concerts from domestic entertainment into global luxury events. BTS, BLACKPINK, and TWICE sell out 70,000-seat stadiums worldwide, and agencies followed the Western model of dynamic pricing. Fan club pre-sale tiers and VIP packages can push total spend to ₩500,000+ per event.'
  },
  {
    id: 'netflix',
    category: 'culture',
    item: 'Netflix Subscription',
    context: 'Standard plan, Korea pricing',
    pastYear: 2016,
    trend: [9900, 10900, 12000, 13500, 17000],
    trendYears: [2016, 2018, 2020, 2022, 2024],
    fallbackInsight: 'Netflix in Korea rose from ₩9,900/month in 2016 to ₩17,000 today: 1.7× in 8 years. Seemingly slow, but Netflix spent billions producing Korean content (Squid Game, Hellbound, The Glory) that pulled global subscriptions. The 2023 password-sharing crackdown added millions of paid subscribers. Korean consumers now generate premium content they then pay to watch — a curious loop where their own stories come back at a price.'
  },
  {
    id: 'youtube_premium',
    category: 'culture',
    item: 'YouTube Premium (월정액)',
    context: 'Individual subscription, Korean pricing',
    pastYear: 2018,
    trend: [7900, 8690, 10450, 14900],
    trendYears: [2018, 2020, 2022, 2024],
    fallbackInsight: 'YouTube Premium in Korea rose from ₩7,900 in 2018 to ₩14,900 in 2024: nearly doubling in 6 years. Google raised Korean prices 70% in a single step in 2023 — one of the largest single-year jumps in this entire game. Korea had been priced unusually low relative to Western markets, and Google corrected this aggressively. Korean consumers, deeply habituated to ad-free YouTube, largely absorbed the shock rather than cancel.'
  },
  {
    id: 'public_pool',
    category: 'culture',
    item: 'Public Swimming Pool (수영장)',
    context: 'Per session entry, municipal facility',
    pastYear: 1995,
    trend: [1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000],
    trendYears: [1995, 2000, 2004, 2008, 2012, 2016, 2020, 2024],
    fallbackInsight: 'Public pool entry rose from ₩1,000 in 1995 to ₩6,000 today: 6×. Municipal pools are subsidized but not free from cost pressures: water, chemicals, heating, and lifeguard wages all rose. Summer queues at public pools — often the only affordable option for urban families — reflect how pricing shapes access to basic recreation.'
  },
  {
    id: 'billiards',
    category: 'culture',
    item: 'Billiard Hall (당구장)',
    context: 'Per hour, standard table',
    pastYear: 1995,
    trend: [1500, 2000, 2500, 3000, 3500, 4000, 5000, 6000],
    trendYears: [1995, 2000, 2004, 2008, 2012, 2016, 2020, 2024],
    fallbackInsight: 'Billiard halls rose from ₩1,500/hour in 1995 to ₩6,000 today: 4×. Billiards was a working-class leisure staple from the 1970s through 2000s. The industry slowly declined as younger demographics gravitated toward PC cafés and screen golf. Surviving halls raised prices to offset lower foot traffic. The ₩1,500 game is history.'
  },
  {
    id: 'waterpark',
    category: 'culture',
    item: 'Waterpark Entry (워터파크)',
    context: 'Caribbean Bay, standard adult day ticket',
    pastYear: 1996,
    trend: [10000, 15000, 22000, 28000, 38000, 48000, 55000, 65000],
    trendYears: [1996, 2000, 2005, 2008, 2012, 2016, 2020, 2024],
    fallbackInsight: "Caribbean Bay waterpark rose from ₩10,000 in 1996 to ₩65,000 today: 6.5×. Korea's largest waterpark opened as an accessible summer destination. Rising energy costs (heating wave pools year-round, water treatment) and Samsung's investment in premium attractions drove price increases. A family of four in 1996 entered for ₩40,000; today that costs ₩260,000 before food or lockers."
  },
  {
    id: 'photo_booth',
    category: 'culture',
    item: 'Photo Booth Strip (인생네컷)',
    context: '4-frame photo strip, self-service booth',
    pastYear: 2017,
    trend: [3000, 4000, 5000, 6000, 7000],
    trendYears: [2017, 2019, 2020, 2022, 2024],
    fallbackInsight: "Photo booth strips launched around 2017 at ₩3,000 and rose to ₩7,000 by 2024: 2.3× in 7 years. A uniquely Korean Gen Z phenomenon, the format spread globally through K-pop fan culture. Ink, paper, and machine maintenance costs are modest; the bigger driver is brand expansion and premium options (filters, backgrounds, sticker sets). It became a staple of shopping malls, cafés, and tourist spots worldwide."
  },
  {
    id: 'escape_room',
    category: 'culture',
    item: 'Escape Room (방탈출)',
    context: 'Per person, standard room (team of 4)',
    pastYear: 2014,
    trend: [15000, 18000, 20000, 22000, 25000],
    trendYears: [2014, 2016, 2018, 2021, 2024],
    fallbackInsight: "Escape rooms rose from ₩15,000/person in 2014 to ₩25,000 today: 1.7× in 10 years. Korea pioneered the modern escape room format and exported it globally. Operators continuously invest in higher-tech, more theatrical room designs — hydraulic doors, actor-in-room scenarios, projections. These capital investments justify price increases. Ironically, the higher the quality, the more it costs even though the time per experience barely changes."
  },
  {
    id: 'soccer',
    category: 'culture',
    item: 'K-League Soccer Ticket',
    context: 'Standard seat (일반석), K League 1 match',
    pastYear: 2000,
    trend: [3000, 5000, 7000, 9000, 10000, 12000, 14000],
    trendYears: [2000, 2005, 2009, 2012, 2016, 2019, 2024],
    fallbackInsight: "K-League soccer tickets rose from ₩3,000 in 2000 to ₩14,000 today: 4.7×. Korean professional soccer has grown alongside the national team's 2002 World Cup semi-final legacy. Stadium improvements, imported foreign players, and broadcast deals pushed operating costs up. But baseball's 2023–2024 boom left K-League in its shadow, and clubs keep prices accessible to fill seats."
  },
  {
    id: 'art_exhibition',
    category: 'culture',
    item: 'Special Art Exhibition (미술 특별전)',
    context: 'Major gallery or museum, adult entry',
    pastYear: 1995,
    trend: [2000, 3000, 5000, 7000, 9000, 12000, 15000, 18000],
    trendYears: [1995, 2000, 2005, 2009, 2012, 2016, 2020, 2024],
    fallbackInsight: 'Major art exhibition tickets rose from ₩2,000 in 1995 to ₩18,000 today: 9×. International blockbusters (Monet in Seoul, Yayoi Kusama) now command ₩25,000+. The post-COVID "Art in Culture" trend brought younger audiences but also higher production costs: immersive lighting, insurance for priceless works, and competition with digital entertainment all pushed prices up.'
  },

  // ── TECH (14 more) ──────────────────────────────────────────
  {
    id: 'smartphone_midrange',
    category: 'tech',
    item: 'Mid-range Smartphone (중급 스마트폰)',
    context: 'Galaxy A-series or equivalent, launch price',
    pastYear: 2012,
    trend: [300000, 280000, 260000, 300000, 350000, 400000],
    trendYears: [2012, 2015, 2017, 2019, 2022, 2024],
    fallbackInsight: "Mid-range smartphones started around ₩300,000 in 2012 and have risen to ₩400,000 today: 1.3×. Prices dipped first as Chinese competitors forced Samsung to cut margins. Then component costs rebounded. ₩400,000 in 2024 buys a phone far more powerful than any 2012 flagship — value per won increased even as the price crept up."
  },
  {
    id: 'tablet',
    category: 'tech',
    item: 'Tablet PC (태블릿)',
    context: 'Entry-level model, Galaxy Tab or iPad (Wi-Fi)',
    pastYear: 2011,
    trend: [500000, 450000, 400000, 380000, 400000, 450000],
    trendYears: [2011, 2013, 2015, 2017, 2020, 2024],
    fallbackInsight: 'Entry-level tablets dropped from ₩500,000 in 2011 to ₩380,000 by 2017, then rose back to ₩450,000 — a net decline of 10%. Competition and manufacturing scale drove prices down initially, but pandemic-driven demand and chip shortages reversed the trend. Despite similar nominal prices, the product improved enormously: screen quality, battery life, and processing power each multiplied many times over.'
  },
  {
    id: 'smartwatch',
    category: 'tech',
    item: 'Smartwatch (스마트워치)',
    context: 'Galaxy Watch basic model, launch price',
    pastYear: 2014,
    trend: [350000, 320000, 330000, 350000, 350000],
    trendYears: [2014, 2016, 2018, 2021, 2024],
    fallbackInsight: 'Galaxy Watch prices have stayed remarkably flat at ₩330,000–350,000 since 2014. This is unusual: most tech items either fall (commoditization) or rise (premium positioning). Samsung has deliberately held the entry point steady while adding features, using the watch as an ecosystem anchor to sell Galaxy phones. The Apple Watch effect — defining a ₩400,000+ ceiling — helped anchor the market.'
  },
  {
    id: 'game_console',
    category: 'tech',
    item: 'Nintendo Handheld Console',
    context: 'Launch price of each new generation',
    pastYear: 1990,
    trend: [50000, 99000, 149000, 250000, 220000, 360000],
    trendYears: [1990, 2001, 2004, 2011, 2019, 2022],
    fallbackInsight: "Nintendo handhelds rose from the Game Boy at ₩50,000 in 1990 to the Switch OLED at ₩360,000 in 2022: 7.2×. But each generation represented a dramatic leap in capability. The Switch is essentially a home console that fits in your pocket. The category also benefited from the Pokémon GO cultural moment and the COVID home entertainment boom. A toy became an entertainment platform."
  },
  {
    id: 'printer',
    category: 'tech',
    item: 'Home Inkjet Printer (프린터)',
    context: 'Standard home model, HP or Samsung',
    pastYear: 1995,
    trend: [200000, 150000, 100000, 80000, 70000, 80000, 90000],
    trendYears: [1995, 2000, 2005, 2009, 2013, 2018, 2024],
    fallbackInsight: 'Home printers dropped from ₩200,000 in 1995 to ₩70,000 at their cheapest (2013), then crept back to ₩90,000. The falling price was a trap: manufacturers subsidize hardware to sell ink cartridges at enormous margins — ₩50,000 cartridges that cost ₩3,000 to make. Koreans print far less than a decade ago, yet ink cartridges remain ludicrously expensive.'
  },
  {
    id: 'air_purifier',
    category: 'tech',
    item: 'Air Purifier (공기청정기)',
    context: 'Mid-range model, ~20-pyeong coverage',
    pastYear: 2000,
    trend: [300000, 250000, 200000, 200000, 250000, 300000, 350000],
    trendYears: [2000, 2004, 2008, 2012, 2016, 2020, 2024],
    fallbackInsight: "Air purifiers have stayed around ₩250,000–350,000 since 2000, with prices dipping in the 2010s before recovering. The hidden cost story: HEPA filter replacements run ₩50,000–100,000/year. The category exploded after 2016 when fine particle (미세먼지) crises made air purifiers a household necessity. Dyson and LG now compete in a premium segment above ₩800,000."
  },
  {
    id: 'robot_vacuum',
    category: 'tech',
    item: 'Robot Vacuum (로봇청소기)',
    context: 'Entry-level model, standard brand',
    pastYear: 2010,
    trend: [500000, 400000, 300000, 250000, 250000, 300000],
    trendYears: [2010, 2013, 2016, 2018, 2020, 2024],
    fallbackInsight: 'Robot vacuums dropped from ₩500,000 in 2010 to ₩250,000 by 2018 — then prices stabilized. Chinese manufacturers (Roborock, Xiaomi) commoditized the category, forcing Samsung and LG to compete aggressively. Higher-end models with mop functions and self-emptying bases now cost ₩700,000–1,500,000. Cheap became basic; basic became premium. The market split into two tiers.'
  },
  {
    id: 'smartphone_plan',
    category: 'tech',
    item: 'Mobile Data Plan (스마트폰 요금제)',
    context: 'Mid-range monthly plan, major carrier (SKT/KT/LGU+)',
    pastYear: 2000,
    trend: [40000, 45000, 55000, 60000, 55000, 55000, 55000],
    trendYears: [2000, 2004, 2010, 2012, 2015, 2020, 2024],
    fallbackInsight: 'Mobile plans rose from ₩40,000 in 2000 to a current mid-range of ₩55,000/month: 1.4×. For a communication essential, this is remarkably stable — but the product changed entirely. ₩40,000 in 2000 bought voice calls; ₩55,000 today buys unlimited 5G data. Government price regulation on Korean telcos has been consistent and effective, keeping the baseline relatively flat.'
  },
  {
    id: 'electric_fan',
    category: 'tech',
    item: 'Electric Fan (선풍기)',
    context: 'Standard floor fan, major brand',
    pastYear: 1990,
    trend: [20000, 25000, 30000, 35000, 40000, 45000, 50000, 55000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Electric fans rose from ₩20,000 in 1990 to ₩55,000 today: 2.75×. One of the slower inflation rates for a physical product in this game. Manufacturing moved to China, keeping costs down. Korean summers have also gotten hotter due to climate change, increasing demand and justifying modest premiums for quieter, more energy-efficient models.'
  },
  {
    id: 'refrigerator',
    category: 'tech',
    item: 'Refrigerator (냉장고)',
    context: 'Mid-range 300L model, major brand',
    pastYear: 1990,
    trend: [400000, 500000, 600000, 700000, 800000, 900000, 1000000, 1200000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'A mid-range refrigerator rose from ₩400,000 in 1990 to ₩1,200,000 today: 3×. This is moderate growth for a major appliance over 34 years. But average refrigerator size grew from 200L to 300L+, and features expanded to include French door designs, ice makers, and smart home connectivity. Premium Samsung and LG models now exceed ₩5,000,000 for the family hub flagship.'
  },
  {
    id: 'washing_machine',
    category: 'tech',
    item: 'Washing Machine (세탁기)',
    context: 'Drum-type, 7–8kg, mid-range brand',
    pastYear: 1995,
    trend: [400000, 500000, 600000, 700000, 800000, 900000, 1000000],
    trendYears: [1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Drum washing machines rose from ₩400,000 in 1995 to ₩1,000,000 today: 2.5×. The shift from top-loading to drum-type in the 2000s was itself a significant price jump. Steam washing, AI load sensing, and energy efficiency certification drove the premium segment higher. But Chinese brands now offer entry-level options at ₩300,000–400,000, creating a bifurcated market.'
  },
  {
    id: 'air_conditioner',
    category: 'tech',
    item: 'Wall-mounted Air Conditioner (에어컨)',
    context: 'Standard split type, ~10-pyeong room',
    pastYear: 1990,
    trend: [500000, 600000, 700000, 800000, 900000, 1000000, 1200000, 1400000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Wall-mounted air conditioners rose from ₩500,000 in 1990 to ₩1,400,000 today: 2.8×. Korean summers getting hotter has driven AC from a luxury to a necessity — over 90% of Korean households now own one. The price rise partly reflects technology improvements (inverter compressors, WiFi control) but also brand premiums. Installation adds another ₩200,000–300,000 on top.'
  },
  {
    id: 'microwave',
    category: 'tech',
    item: 'Microwave Oven (전자레인지)',
    context: 'Standard home model, ~20L',
    pastYear: 1990,
    trend: [100000, 120000, 100000, 80000, 70000, 70000, 80000, 90000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Microwaves actually got cheaper: from ₩100,000 in 1990 to ₩90,000 today, with a dip to ₩70,000 in the 2010s. Manufacturing moved to China and economies of scale drove costs down sharply. The microwave is one of very few items in this game that is nominally cheaper than 30 years ago. The commodity trap set in; the premium segment shifted to oven-microwave combos at ₩300,000+.'
  },
  {
    id: 'external_hdd',
    category: 'tech',
    item: 'External Hard Drive (외장하드) — 1TB',
    context: 'Standard brand, retail price',
    pastYear: 2008,
    trend: [200000, 120000, 80000, 60000, 50000, 55000],
    trendYears: [2008, 2011, 2013, 2016, 2020, 2024],
    fallbackInsight: 'A 1TB external hard drive dropped from ₩200,000 in 2008 to ₩50,000 in 2020, then crept up slightly to ₩55,000: 72% cheaper in 16 years — the sharpest price deflation in this game. The 2011 Thailand floods briefly spiked prices before recovery. Cloud storage (Google Drive, Naver MYBOX) now competes directly, meaning the HDD market faces both cost deflation and demand replacement simultaneously.'
  },

  // ── FOOD (15 more) ──────────────────────────────────────────
  {
    id: 'doenjang_jjigae',
    category: 'food',
    item: 'Doenjang Jjigae (된장찌개)',
    context: 'Per person, standard restaurant',
    pastYear: 1990,
    trend: [1500, 2000, 3000, 4500, 6000, 7000, 8000, 10000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Doenjang jjigae rose from ₩1,500 in 1990 to ₩10,000 today: 6.7×. Korea's fermented soybean stew has tracked kimchi jjigae almost identically over 30 years. Fermented soybean paste (doenjang) is increasingly positioned as a premium artisan ingredient. The gap between home-cooked and restaurant versions has widened as kitchen labor costs make even simple soups disproportionately expensive to serve commercially."
  },
  {
    id: 'budae_jjigae',
    category: 'food',
    item: 'Budae Jjigae (부대찌개)',
    context: 'Per person, standard restaurant',
    pastYear: 1995,
    trend: [3000, 4000, 5000, 7000, 8000, 10000, 12000],
    trendYears: [1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Budae jjigae (army base stew) rose from ₩3,000 in 1995 to ₩12,000 today: 4×. Born from post-Korean War scarcity — mixing surplus US military spam and sausages with kimchi — it became comfort food and then a trendy retro dish. SPAM prices track global pork and packaging costs. Ironically, a dish born from poverty now costs more than a standard Korean stew."
  },
  {
    id: 'gamjatang',
    category: 'food',
    item: 'Gamjatang (감자탕)',
    context: 'Per person, standard restaurant',
    pastYear: 1995,
    trend: [4000, 5000, 6000, 8000, 10000, 12000, 15000],
    trendYears: [1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Gamjatang (pork spine stew) rose from ₩4,000 in 1995 to ₩15,000 today: 3.75×. The pork spine was once a cheap cut almost given away; rising domestic pork prices transformed it into a semi-premium ingredient. Large pots cooking all day require significant gas. The dish became a late-night staple, which means nighttime surcharges apply at many restaurants, pushing the real price higher."
  },
  {
    id: 'bingsu',
    category: 'food',
    item: 'Patbingsu (팥빙수)',
    context: 'Red bean shaved ice, standard café',
    pastYear: 1990,
    trend: [1000, 1500, 2000, 3000, 5000, 8000, 10000, 14000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Patbingsu rose from ₩1,000 in 1990 to ₩14,000 today: 14× — one of the highest inflation rates in this game. Korea's iconic summer dessert transformed from a simple street snack into a premium visual experience. Premium hotel bingsu (Shilla, Lotte) now exceed ₩50,000. Instagram culture created a luxury tier that pulled even standard café prices up dramatically."
  },
  {
    id: 'hotteok',
    category: 'food',
    item: 'Hotteok (호떡)',
    context: 'One piece, street vendor',
    pastYear: 1990,
    trend: [200, 300, 500, 700, 1000, 1500, 2000, 2500],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Hotteok rose from ₩200 in 1990 to ₩2,500 today: 12.5×. The sweet syrup-filled pancake is one of Korea's most beloved winter street foods. Wheat, sugar, cinnamon, and peanuts all rose in price. Street food vendors can't spread costs across table service — every price hike must be passed directly to the customer. Yet demand remains inelastic because few things warm a cold Korean street as reliably."
  },
  {
    id: 'bungeoppang',
    category: 'food',
    item: 'Bungeoppang (붕어빵)',
    context: 'Three pieces, street vendor',
    pastYear: 1990,
    trend: [300, 500, 700, 1000, 1500, 2000, 3000, 5000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Three bungeoppang rose from ₩300 in 1990 to ₩5,000 today: 16.7×. Red bean prices are volatile and surged in recent years. Once the definitive '5 for ₩1,000' experience, bungeoppang is now a luxury street snack at ₩1,500+ per piece. Vendors who survived COVID shutdowns are pricing to recover. This fish-shaped pastry now has one of the highest nominal inflation multiples of any Korean street food."
  },
  {
    id: 'yukgaejang',
    category: 'food',
    item: 'Yukgaejang (육개장)',
    context: 'One bowl, standard restaurant',
    pastYear: 1990,
    trend: [2000, 3000, 4000, 5000, 7000, 8000, 10000, 12000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Yukgaejang (spicy beef soup) rose from ₩2,000 in 1990 to ₩12,000 today: 6×. The dish requires beef brisket, fernbrake (고사리), and green onion — all of which tracked agricultural inflation. It is one of the four ceremonial soups eaten at Korean memorials and funerals, meaning demand stays culturally constant regardless of price. Ceremonial foods rarely go out of fashion."
  },
  {
    id: 'pork_ribs',
    category: 'food',
    item: 'Pork Ribs (돼지갈비)',
    context: '200g per person, standard restaurant',
    pastYear: 1995,
    trend: [5000, 7000, 9000, 11000, 13000, 15000, 18000, 22000],
    trendYears: [1995, 2000, 2005, 2009, 2013, 2017, 2021, 2024],
    fallbackInsight: "Pork ribs rose from ₩5,000 per person in 1995 to ₩22,000 today: 4.4×. Marinated galbi has long been a celebration dish in Korea. Rib supply is limited — there are only so many ribs per pig — so prices track both overall pork costs and premium cut scarcity. The dish is ordered for birthdays and gatherings, meaning price sensitivity is lower than for everyday meals. Special occasions absorb special prices."
  },
  {
    id: 'beef_ribs',
    category: 'food',
    item: 'Beef Short Ribs (소갈비)',
    context: '200g per person, Korean BBQ restaurant',
    pastYear: 1995,
    trend: [10000, 15000, 20000, 25000, 30000, 40000, 50000, 65000],
    trendYears: [1995, 2000, 2005, 2009, 2013, 2017, 2021, 2024],
    fallbackInsight: "Beef short ribs (소갈비) rose from ₩10,000 per person in 1995 to ₩65,000 today: 6.5×. Hanwoo (Korean domestic beef) commands extreme premiums: a single prize cow can sell for ₩5,000,000+. The 'Hanwoo premium' grew as middle-class incomes rose and beef became a status symbol. A full galbi dinner for four now easily exceeds ₩300,000. It is arguably Korea's most dramatic food inflation story."
  },
  {
    id: 'soft_serve',
    category: 'food',
    item: 'Soft Serve Ice Cream (소프트아이스크림)',
    context: "McDonald's or Lotteria Korea, small cone",
    pastYear: 1990,
    trend: [200, 300, 400, 500, 600, 700, 800, 1000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Fast food soft serve rose from ₩200 in 1990 to ₩1,000 today: 5×. For decades it was the ultimate cheap treat — the one thing you could get at McDonald's for pocket change. McDonald's Korea held the price at ₩500 for years before gradually raising it. The soft serve cone is a loss-leader: chains deliberately suppress its price while raising everything else around it to attract foot traffic."
  },
  {
    id: 'baskin_robbins',
    category: 'food',
    item: 'Baskin-Robbins Scoop (배스킨라빈스)',
    context: 'One regular scoop in a cup/cone',
    pastYear: 1994,
    trend: [700, 1000, 1500, 2000, 2500, 3000, 3500, 4500],
    trendYears: [1994, 1998, 2002, 2006, 2010, 2014, 2019, 2024],
    fallbackInsight: "Baskin-Robbins single scoop rose from ₩700 in 1994 to ₩4,500 today: 6.4×. Entering Korea in 1985, it became synonymous with birthday cakes and childhood treats. Dairy, sugar, and flavor ingredient costs all rose. The iconic 'pink spoon' now costs as much as a convenience store sandwich. The brand's '31호' stores became such a cultural institution that price hikes generate genuine national controversy."
  },
  {
    id: 'cup_tteokbokki',
    category: 'food',
    item: 'Cup Tteokbokki (컵떡볶이)',
    context: 'Convenience store, ready-to-eat cup',
    pastYear: 2005,
    trend: [1000, 1200, 1500, 1800, 2000, 2500],
    trendYears: [2005, 2008, 2011, 2015, 2019, 2024],
    fallbackInsight: "Convenience store cup tteokbokki rose from ₩1,000 in 2005 to ₩2,500 today: 2.5×. The format was pioneered by GS25 and became Korea's best-selling convenience snack. Automated production kept price increases modest. But since 2022, rice cake and gochujang ingredient costs caught up. Still, at ₩2,500 it remains one of the cheapest hot snacks available anywhere in Korea."
  },
  {
    id: 'energy_drink',
    category: 'food',
    item: 'Energy Drink (레드불 250ml)',
    context: 'Convenience store, standard can',
    pastYear: 2005,
    trend: [2000, 2200, 2500, 3000, 3500, 4000],
    trendYears: [2005, 2008, 2011, 2015, 2019, 2024],
    fallbackInsight: "Red Bull rose from ₩2,000 in 2005 to ₩4,000 today: 2×. Energy drinks are a premium category competing on brand, not cost. The aluminum can, taurine, caffeine, and B vitamins are not expensive to produce, but the brand commands extraordinary margins. Domestic Korean brands (Hot6, Bacchus) undercut significantly. The rise of convenience store culture made energy drinks a ₩4,000 daily ritual for millions of Korean students and workers."
  },
  {
    id: 'yakult',
    category: 'food',
    item: 'Yakult (야쿠르트)',
    context: 'One 65ml bottle',
    pastYear: 1990,
    trend: [50, 80, 100, 120, 150, 180, 200, 250],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Yakult rose from ₩50/bottle in 1990 to ₩250 today: 5×. Korea's iconic probiotic drink, delivered by the legendary 'yakult ladies' (야쿠르트 아줌마) on electric trikes, is one of the most recognized brands in the country. The company deliberately kept prices low for decades. The direct-to-doorstep delivery model — without retail markup — is a unique cost structure that helped hold prices down relative to comparable products."
  },
  {
    id: 'juk',
    category: 'food',
    item: 'Restaurant Porridge (죽)',
    context: 'One bowl, Bonjuk (본죽) or similar franchise',
    pastYear: 2002,
    trend: [4000, 5000, 6000, 7000, 8000, 10000, 12000],
    trendYears: [2002, 2005, 2008, 2012, 2016, 2020, 2024],
    fallbackInsight: "Restaurant porridge rose from ₩4,000 in 2002 to ₩12,000 today: 3×. Bonjuk franchised the category in 2002, repositioning juk from sick-person food to a premium health lunch. The abalone juk that gave the brand its reputation now exceeds ₩15,000. Ingredients like abalone and premium grains all rose. Juk is now a mainstream healthy office lunch — a positioning that fully justifies the price."
  },

  // ── TRANSPORT (10 more) ──────────────────────────────────────
  {
    id: 'arex',
    category: 'transport',
    item: 'AREX Airport Express (직통)',
    context: 'Seoul Station to Incheon Airport T1, direct train',
    pastYear: 2010,
    trend: [13300, 14800, 14800, 14800, 16500],
    trendYears: [2010, 2014, 2017, 2020, 2024],
    fallbackInsight: "AREX direct express launched in 2010 at ₩13,300 and is ₩16,500 today: a 24% rise in 14 years. For an airport rail link, this is remarkably stable — AREX is partly government-owned and uses public pricing logic. The all-stop commuter train on the same track costs ₩4,500 to the airport, so the express premium versus the slow train has widened considerably over time."
  },
  {
    id: 'busan_subway',
    category: 'transport',
    item: 'Busan Subway Base Fare',
    context: 'Standard adult ticket, Busan Metro',
    pastYear: 1985,
    trend: [200, 350, 500, 700, 900, 1300, 1400, 1550],
    trendYears: [1985, 1991, 1996, 2001, 2005, 2014, 2019, 2024],
    fallbackInsight: "Busan subway fares rose from ₩200 in 1985 to ₩1,550 today: 7.75×. Korea's second city opened its metro in 1985 and has followed Seoul's trajectory closely. Like Seoul's subway, Busan's runs at operating deficits covered by city taxes. The real cost of a Busan subway ride is significantly higher than ₩1,550; riders are heavily subsidized by public funds."
  },
  {
    id: 'jeju_rent_car',
    category: 'transport',
    item: 'Jeju Island Rental Car',
    context: 'Compact car, one day (excluding insurance)',
    pastYear: 2000,
    trend: [30000, 35000, 40000, 45000, 50000, 70000, 130000, 80000],
    trendYears: [2000, 2004, 2008, 2012, 2016, 2020, 2022, 2024],
    fallbackInsight: "Jeju rental cars rose from ₩30,000/day in 2000 to around ₩80,000 today — but hit ₩130,000+ during 2020–2022 when COVID closed international travel and Koreans flooded Jeju. The market normalized as travel reopened. Jeju's unique geography — no reliable public transit — means virtually every visitor needs a car, giving rental companies unusual and enduring pricing power."
  },
  {
    id: 'oil_change',
    category: 'transport',
    item: 'Engine Oil Change (엔진오일 교환)',
    context: 'Standard oil + filter, mid-size sedan',
    pastYear: 1995,
    trend: [20000, 25000, 30000, 35000, 40000, 50000, 60000, 70000],
    trendYears: [1995, 2000, 2005, 2009, 2013, 2017, 2021, 2024],
    fallbackInsight: "Engine oil changes rose from ₩20,000 in 1995 to ₩70,000 today: 3.5×. Oil and filters are commodities, but labor and garage rent are not. The shift to 10,000km-interval changes reduced visit frequency, pushing shops to charge more per visit. Synthetic oil upgrades have normalized ₩100,000+ changes for premium cars. Basic maintenance now costs real money."
  },
  {
    id: 'electric_scooter',
    category: 'transport',
    item: 'Shared E-Scooter (공유 킥보드)',
    context: 'Per 30 minutes, major sharing service',
    pastYear: 2019,
    trend: [1000, 2000, 3000, 4000],
    trendYears: [2019, 2021, 2023, 2024],
    fallbackInsight: "Shared e-scooters launched in Korea around 2019 at roughly ₩1,000 for 30 minutes and have risen to ₩4,000: 4× in 5 years. Initial prices were intentionally low to build adoption. As regulations tightened (helmets required, sidewalk bans), operating costs rose sharply. Battery replacement, maintenance, and parking enforcement all add up. The 'cheap last-mile' promise of 2019 has already faded."
  },
  {
    id: 'intercity_bus',
    category: 'transport',
    item: 'Intercity Bus Seoul–Cheonan',
    context: 'Standard seat, one way (시외버스)',
    pastYear: 1990,
    trend: [1500, 2500, 3500, 5000, 7000, 8500, 9000, 11000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Seoul–Cheonan intercity bus rose from ₩1,500 in 1990 to ₩11,000 today: 7.3×. Short intercity routes were once the cheapest intercity travel. Rising fuel, driver wages, and terminal costs changed that. KTX SRT now connects Seoul and Cheonan in 30 minutes for a similar fare — undercutting the bus on both price and speed. The intercity bus for short distances is under serious competitive pressure."
  },
  {
    id: 'ferry_jeju',
    category: 'transport',
    item: 'Mokpo–Jeju Ferry',
    context: 'Standard class seat, one way',
    pastYear: 1995,
    trend: [15000, 20000, 25000, 32000, 40000, 50000, 55000, 65000],
    trendYears: [1995, 2000, 2005, 2009, 2013, 2017, 2021, 2024],
    fallbackInsight: "The Mokpo–Jeju ferry rose from ₩15,000 in 1995 to ₩65,000 today: 4.3×. The Sewol tragedy in 2014 led to sweeping safety regulations that increased operating costs for all Korean ferries. Budget airlines now make the 13-hour ferry journey impractical for most travelers, but the ferry remains essential for cargo and those who cannot fly."
  },
  {
    id: 'ev_charging',
    category: 'transport',
    item: 'EV Fast Charging (전기차 급속충전)',
    context: 'Public charger, approx. 30 minutes',
    pastYear: 2015,
    trend: [2000, 5000, 8000, 12000, 18000],
    trendYears: [2015, 2018, 2020, 2022, 2024],
    fallbackInsight: "Public EV fast charging rose from roughly ₩2,000 for 30 minutes in 2015 to ₩18,000 today: 9× in 9 years. Early infrastructure was heavily subsidized to encourage EV adoption. As subsidies were withdrawn and electricity prices rose, charging costs surged. The math for EV ownership is now less obvious than in 2018: the cost gap with gasoline has narrowed significantly for high-mileage drivers."
  },
  {
    id: 'motorcycle',
    category: 'transport',
    item: 'Motorcycle 125cc (오토바이)',
    context: 'Standard commuter scooter, new retail price',
    pastYear: 1990,
    trend: [700000, 900000, 1100000, 1300000, 1500000, 1700000, 2000000, 2500000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "A 125cc commuter motorcycle rose from ₩700,000 in 1990 to ₩2,500,000 today: 3.6×. Motorcycles became the backbone of Korea's delivery economy. Post-COVID delivery demand surged, increasing used motorcycle prices dramatically. The cheapest new scooter now costs more than a decent used car did 20 years ago. Delivery platforms effectively drove up the purchase price of the bikes their workers depend on."
  },
  {
    id: 'driver_license',
    category: 'transport',
    item: "Driver's License Academy (운전학원)",
    context: 'Full course, Type 1 license (1종 보통)',
    pastYear: 1995,
    trend: [200000, 300000, 400000, 500000, 600000, 700000, 800000, 900000],
    trendYears: [1995, 2000, 2005, 2009, 2013, 2017, 2021, 2024],
    fallbackInsight: "Driver's license academy fees rose from ₩200,000 in 1995 to ₩900,000 today: 4.5×. A license is a practical necessity in Korea. Academies charge for instructor time, fuel, vehicle maintenance, and facility rent — all labor and real estate intensive. The government tried to introduce private self-study exams to reduce costs, but the dominant academy model has kept prices rising steadily."
  },

  // ── CULTURE (15 more) ────────────────────────────────────────
  {
    id: 'ski_resort',
    category: 'culture',
    item: 'Ski Resort Day Pass (스키장 리프트권)',
    context: 'All-day lift ticket, standard domestic resort',
    pastYear: 1995,
    trend: [20000, 30000, 40000, 50000, 60000, 70000, 80000, 100000],
    trendYears: [1995, 2000, 2005, 2009, 2013, 2017, 2021, 2024],
    fallbackInsight: "Ski resort day passes rose from ₩20,000 in 1995 to ₩100,000 today: 5×. Korean ski culture peaked in the 2000s and has slowly declined as warming winters shorten seasons. Yet prices keep rising — fewer skiers means resorts must extract more per visitor to cover fixed costs. Ski equipment rentals, lessons, and food can push a day trip well over ₩200,000."
  },
  {
    id: 'imax_ticket',
    category: 'culture',
    item: 'IMAX Movie Ticket',
    context: 'CGV IMAX, standard weekend screening',
    pastYear: 2010,
    trend: [14000, 16000, 18000, 20000, 22000, 25000],
    trendYears: [2010, 2013, 2016, 2018, 2021, 2024],
    fallbackInsight: "IMAX tickets rose from ₩14,000 in 2010 to ₩25,000 today: 1.8× in 14 years. CGV introduced IMAX to Korea in 2010 and quickly expanded. Marvel and blockbuster releases sell out IMAX within hours, meaning price-insensitive demand lets theaters charge significantly more. IMAX has become a nearly separate product category — people buy it specifically, not just 'a movie ticket.'"
  },
  {
    id: 'camping',
    category: 'culture',
    item: 'National Park Campsite (캠핑장)',
    context: 'One night, standard site',
    pastYear: 2000,
    trend: [3000, 5000, 6000, 7000, 10000, 14000, 18000],
    trendYears: [2000, 2004, 2008, 2012, 2016, 2020, 2024],
    fallbackInsight: "National park campsites rose from ₩3,000/night in 2000 to ₩18,000 today: 6×. The COVID-era camping boom pushed demand to record highs, and the forest service raised prices to manage overcrowding. Domestic camping gear spending exploded, making Korea one of the world's fastest-growing outdoor markets. What was once a budget family activity now requires advance reservations weeks out and a significant gear investment."
  },
  {
    id: 'pilates',
    category: 'culture',
    item: 'Pilates Group Class (필라테스)',
    context: 'Per group session (6–8 people), standard studio',
    pastYear: 2010,
    trend: [20000, 25000, 30000, 35000, 40000, 50000],
    trendYears: [2010, 2013, 2016, 2018, 2021, 2024],
    fallbackInsight: "Pilates group classes rose from ₩20,000 in 2010 to ₩50,000 today: 2.5× in 14 years. The format exploded in Korea in the 2010s, driven by celebrity endorsements and social media. Instructor certification costs are substantial, and prime Gangnam studio locations demand high rent. Private 1-on-1 sessions now exceed ₩100,000. Pilates has become one of the most expensive routine wellness habits in urban Korea."
  },
  {
    id: 'pet_grooming',
    category: 'culture',
    item: 'Dog Grooming (반려견 미용)',
    context: 'Small dog, full wash + trim, standard pet salon',
    pastYear: 2000,
    trend: [15000, 20000, 25000, 30000, 35000, 45000, 55000, 70000],
    trendYears: [2000, 2004, 2008, 2012, 2016, 2019, 2022, 2024],
    fallbackInsight: "Dog grooming rose from ₩15,000 in 2000 to ₩70,000 today: 4.7×. Korea's pet population exceeds 10 million and spending per pet rivals developed Western markets. Groomers are now skilled certified labor. As pet ownership replaced child-rearing for many younger Koreans, spending per animal increased dramatically. Pets became family members and are priced accordingly."
  },
  {
    id: 'webtoon_platform',
    category: 'culture',
    item: 'Webtoon Platform Subscription (웹툰 플랫폼)',
    context: 'Monthly pass, KakaoPage or Naver Webtoon',
    pastYear: 2012,
    trend: [5000, 7000, 9000, 10000, 12000],
    trendYears: [2012, 2015, 2018, 2020, 2024],
    fallbackInsight: "Webtoon platform subscriptions rose from ₩5,000/month in 2012 to ₩12,000 today: 2.4×. Korean webtoons conquered global digital content: KakaoPage and Naver Webtoon now operate in dozens of countries. Content licensing fees and creator payouts rose as the industry scaled. The same platform that charged ₩5,000 in 2012 now hosts content generating billions of dollars in global IP licensing — readers pay more and get richer content."
  },
  {
    id: 'classical_concert',
    category: 'culture',
    item: 'Classical Concert (클래식 공연)',
    context: 'R-seat, Seoul Arts Center (예술의전당)',
    pastYear: 1995,
    trend: [20000, 30000, 40000, 50000, 70000, 90000, 110000, 130000],
    trendYears: [1995, 2000, 2005, 2009, 2013, 2017, 2021, 2024],
    fallbackInsight: "Classical concert R-seats at the Seoul Arts Center rose from ₩20,000 in 1995 to ₩130,000 today: 6.5×. International performers demand fees in euros and dollars, making exchange rates a key variable. The Korean classical music scene has grown dramatically with world-renowned Korean soloists. Premium seats for blockbuster programs now exceed ₩200,000."
  },
  {
    id: 'comic_book',
    category: 'culture',
    item: 'Comic/Manga Book (만화책)',
    context: 'Single volume, standard format',
    pastYear: 1990,
    trend: [800, 1200, 1500, 2000, 3000, 4000, 5000, 7000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Comic books rose from ₩800 in 1990 to ₩7,000 today: 8.75×. Paper and printing costs drove physical prices up just as digital alternatives (webtoons, scanlations) eroded demand. The physical manga market in Korea shrank dramatically in the 2010s, leaving only dedicated fans buying printed volumes. Publishers raised per-unit prices to compensate for lower print runs — a classic low-volume premium loop."
  },
  {
    id: 'music_streaming',
    category: 'culture',
    item: 'Music Streaming (멜론 월정액)',
    context: 'Monthly unlimited streaming, Melon or equivalent',
    pastYear: 2004,
    trend: [4000, 6000, 7000, 7700, 7900, 8900, 10900],
    trendYears: [2004, 2008, 2012, 2015, 2017, 2021, 2024],
    fallbackInsight: "Music streaming (led by Melon) rose from ₩4,000/month in 2004 to ₩10,900 today: 2.7×. Korea was one of the earliest markets to adopt paid streaming globally. Rising royalty rates — pushed by artist advocacy and government reform — drove prices up. K-pop's global explosion made Korean music catalog rights far more valuable than they were 20 years ago."
  },
  {
    id: 'taekwondo',
    category: 'culture',
    item: 'Taekwondo Academy (태권도 학원)',
    context: "Children's monthly tuition",
    pastYear: 1990,
    trend: [20000, 30000, 40000, 50000, 60000, 70000, 80000, 100000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Children's taekwondo rose from ₩20,000/month in 1990 to ₩100,000 today: 5×. Taekwondo is part of Korean childhood in a way few other activities are — nearly every neighborhood has a dojang. Monthly fees track instructor wages and real estate almost directly. The 2000 Sydney Olympics (Korea won gold) boosted enrollment, and the global spread of taekwondo as an Olympic sport gave Korean instructors global career options, raising the domestic wage floor."
  },
  {
    id: 'english_academy',
    category: 'culture',
    item: 'English Academy (영어학원)',
    context: "Children's monthly tuition, elementary level",
    pastYear: 1995,
    trend: [60000, 100000, 150000, 200000, 250000, 300000, 350000, 400000],
    trendYears: [1995, 2000, 2005, 2009, 2013, 2017, 2021, 2024],
    fallbackInsight: "English academy (hagwon) monthly fees rose from ₩60,000 in 1995 to ₩400,000 today: 6.7×. The Korean private education market is one of the largest in the world relative to GDP. Competition for university entrance drives parents to spend regardless of cost. Native-speaking foreign instructors command significant premiums. Total private education spending per Korean child rivals tuition at many Western universities."
  },
  {
    id: 'nailshop',
    category: 'culture',
    item: 'Nail Salon — Gel Nails (네일샵)',
    context: 'Full hand gel nail set, standard salon',
    pastYear: 2005,
    trend: [20000, 25000, 30000, 35000, 40000, 50000],
    trendYears: [2005, 2009, 2013, 2016, 2020, 2024],
    fallbackInsight: "Gel nail services rose from ₩20,000 in 2005 to ₩50,000 today: 2.5×. Korea has one of the highest nail salon densities in the world; nail art is mainstream professional grooming. Product costs (gel, UV lamps, removal chemicals) rose, but the bigger driver is professionalization: certified nail artists now command higher wages. Instagram-driven design complexity also pushed average session times — and prices — significantly higher."
  },
  {
    id: 'batting_cage',
    category: 'culture',
    item: 'Baseball Batting Cage (배팅연습장)',
    context: 'Standard time slot, urban facility',
    pastYear: 1995,
    trend: [2000, 3000, 4000, 5000, 6000, 7000, 8000],
    trendYears: [1995, 2000, 2005, 2010, 2015, 2019, 2024],
    fallbackInsight: "Baseball batting cages rose from ₩2,000 in 1995 to ₩8,000 today: 4×. KBO baseball has seen surging popularity — the 2024 season set attendance records. Machine maintenance, facility rent, and net replacement costs all rise with Seoul real estate. The 2023–2024 baseball boom may push prices higher still as operators invest in premium experiences to capture demand."
  },
  {
    id: 'kids_cafe',
    category: 'culture',
    item: "Kids Café (키즈카페)",
    context: 'Per child, 1-hour entry',
    pastYear: 2005,
    trend: [5000, 7000, 10000, 12000, 15000, 18000],
    trendYears: [2005, 2009, 2013, 2016, 2020, 2024],
    fallbackInsight: "Kids café entry rose from ₩5,000 in 2005 to ₩18,000 today: 3.6×. Indoor play cafés became essential for Korean parents in apartment-heavy cities with limited outdoor space. Play equipment, safety padding, and cleaning staff are significant costs. The category was devastated by COVID lockdowns; operators who survived raised prices to recover. A family trip to a kids café, including adult coffee, now easily costs ₩50,000+."
  },
  {
    id: 'wedding_photo',
    category: 'culture',
    item: 'Wedding Studio Photo (웨딩 스튜디오)',
    context: 'Basic package, standard studio',
    pastYear: 1995,
    trend: [300000, 400000, 500000, 600000, 700000, 800000, 1000000, 1200000],
    trendYears: [1995, 2000, 2005, 2009, 2013, 2017, 2021, 2024],
    fallbackInsight: "Wedding studio photography rose from ₩300,000 in 1995 to ₩1,200,000 today: 4×. Korean wedding culture demands elaborate pre-ceremony photo shoots — a unique tradition that grew into a large industry. Premium packages with multiple outfits, outdoor locations, and retouching now exceed ₩5,000,000. Declining marriage rates mean fewer clients, so studios raise prices per booking — another declining-industry pricing spiral."
  },

  // ── TECH (10 more) ──────────────────────────────────────────
  {
    id: 'bluetooth_speaker',
    category: 'tech',
    item: 'Bluetooth Speaker (블루투스 스피커)',
    context: 'Mid-range portable speaker',
    pastYear: 2012,
    trend: [100000, 80000, 60000, 60000, 70000, 80000],
    trendYears: [2012, 2015, 2017, 2019, 2022, 2024],
    fallbackInsight: "Mid-range Bluetooth speakers dropped from ₩100,000 in 2012 to ₩60,000 by 2017, then recovered to ₩80,000: a net 20% decrease. Chinese manufacturers commoditized the category rapidly. Post-COVID supply chain disruptions pushed prices back up. Decent audio quality is now achievable at ₩30,000–50,000 — the ₩100,000 tier now competes with true premium brands (Bose, B&O) rather than the mid-market."
  },
  {
    id: 'monitor_27',
    category: 'tech',
    item: '27-inch FHD Monitor (모니터)',
    context: 'Standard 1080p office/gaming monitor',
    pastYear: 2010,
    trend: [400000, 300000, 200000, 150000, 150000, 180000, 200000],
    trendYears: [2010, 2013, 2016, 2018, 2020, 2022, 2024],
    fallbackInsight: "A 27-inch FHD monitor dropped from ₩400,000 in 2010 to ₩150,000 by 2018: a 62% fall. Then COVID-driven demand and chip shortages pushed it back to ₩200,000. The ₩150,000 monitor of 2018 was more capable than the ₩400,000 of 2010 — response time, contrast, and viewing angles all improved dramatically while the price fell. This is technology deflation briefly interrupted by supply shock."
  },
  {
    id: 'cordless_vacuum',
    category: 'tech',
    item: 'Cordless Vacuum (무선 청소기)',
    context: 'Mid-range stick vacuum, major brand',
    pastYear: 2010,
    trend: [300000, 250000, 200000, 200000, 250000, 300000],
    trendYears: [2010, 2013, 2016, 2018, 2021, 2024],
    fallbackInsight: "Cordless vacuums stayed broadly flat at ₩200,000–300,000 since 2010. Dyson entered Korea and defined a ₩700,000–1,000,000 premium tier; LG and Samsung competed hard at ₩200,000–400,000 to protect market share. The total category grew dramatically as apartment living made cordless cleaning a practical necessity. Dyson's entry essentially split the vacuum market into two price worlds with a wide gap between them."
  },
  {
    id: 'electric_toothbrush',
    category: 'tech',
    item: 'Electric Toothbrush (전동칫솔)',
    context: 'Mid-range oscillating type, Oral-B or Philips',
    pastYear: 2005,
    trend: [80000, 70000, 60000, 60000, 70000, 80000],
    trendYears: [2005, 2009, 2013, 2017, 2020, 2024],
    fallbackInsight: "Electric toothbrushes have stayed remarkably flat at ₩60,000–80,000 since 2005. The replacement head model means the base unit is a near-loss-leader: ₩30,000–50,000 per set of four heads per year is where profit lies. Korean dentist recommendations and growing oral health awareness expanded the user base, but intense Oral-B vs. Philips competition held hardware prices stable."
  },
  {
    id: 'game_subscription',
    category: 'tech',
    item: 'Game Subscription Service (게임 구독)',
    context: 'Monthly, Xbox Game Pass or PlayStation Plus',
    pastYear: 2015,
    trend: [4900, 6900, 9900, 12900, 17000],
    trendYears: [2015, 2018, 2020, 2022, 2024],
    fallbackInsight: "Game subscription services rose from ₩4,900/month in 2015 to ₩17,000 today: 3.5× in 9 years. Microsoft and Sony restructured gaming from ownership to access, then raised prices once habits were established. The ₩17,000 fee covers hundreds of games — per-game cost plummeted even as the subscription price rose. Still, the 2022–2023 price hikes drew significant backlash from Korean gamers accustomed to low local pricing."
  },
  {
    id: 'dashcam',
    category: 'tech',
    item: 'Dashcam (블랙박스)',
    context: '2-channel (front + rear), standard model',
    pastYear: 2010,
    trend: [200000, 150000, 120000, 100000, 80000, 90000, 100000],
    trendYears: [2010, 2012, 2015, 2017, 2019, 2022, 2024],
    fallbackInsight: "Dashcams dropped from ₩200,000 in 2010 to ₩80,000 by 2019, then crept back to ₩100,000: a net 50% decrease. Korea has the world's highest dashcam adoption rate — essentially considered mandatory for insurance disputes. Chinese components commoditized the hardware rapidly. The brief price rebound reflects feature upgrades (4K, parking mode, cloud) rather than component cost increases. A niche accessory became essential car equipment."
  },
  {
    id: 'rice_cooker',
    category: 'tech',
    item: 'Electric Rice Cooker (전기밥솥)',
    context: '6-person IH pressure cooker, Cuckoo brand',
    pastYear: 1995,
    trend: [100000, 120000, 150000, 180000, 200000, 220000, 250000, 280000],
    trendYears: [1995, 2000, 2005, 2009, 2013, 2017, 2021, 2024],
    fallbackInsight: "Korean rice cookers rose from ₩100,000 in 1995 to ₩280,000 today: 2.8×. Cuckoo and Cuchen dominate a market unique to Korea — pressure IH rice cookers that cost 5–10× their Japanese equivalents but produce noticeably better results. Koreans consider this technology non-negotiable for proper rice texture. Premium models now exceed ₩500,000 and are gifted at weddings as luxury appliances."
  },
  {
    id: 'wifi_router',
    category: 'tech',
    item: 'Wi-Fi Router (공유기)',
    context: 'Mid-range home router, TP-Link or IPTIME',
    pastYear: 2005,
    trend: [100000, 80000, 60000, 50000, 60000, 70000, 80000],
    trendYears: [2005, 2009, 2012, 2016, 2019, 2022, 2024],
    fallbackInsight: "Home Wi-Fi routers dropped from ₩100,000 in 2005 to ₩50,000 by 2016, then recovered to ₩80,000. Korean brand IPTIME captured the mass market with aggressive pricing, while TP-Link and ASUS competed in the premium segment. The recovery reflects the shift to Wi-Fi 6 routers and chip cost increases. With Korea having the world's fastest home internet, router upgrades to support gigabit speeds have become a regular household expense."
  },
  {
    id: 'security_camera',
    category: 'tech',
    item: 'Home CCTV Camera (가정용 CCTV)',
    context: 'Single IP camera, standard brand',
    pastYear: 2010,
    trend: [200000, 150000, 100000, 70000, 60000, 60000, 70000],
    trendYears: [2010, 2013, 2016, 2018, 2020, 2022, 2024],
    fallbackInsight: "Home CCTV cameras dropped from ₩200,000 in 2010 to ₩60,000 by 2020: a 70% fall. Chinese manufacturers drove costs to the floor. Post-COVID supply chain issues caused a minor rebound. From a niche professional product to an ordinary household item within a decade. Concerns about stalking and domestic violence have simultaneously made cameras both more popular and more controversial in Korean homes."
  },
  {
    id: 'electric_kettle',
    category: 'tech',
    item: 'Electric Kettle (전기포트)',
    context: 'Standard 1.7L home kettle',
    pastYear: 2000,
    trend: [20000, 20000, 20000, 25000, 30000, 35000, 40000],
    trendYears: [2000, 2004, 2008, 2012, 2016, 2020, 2024],
    fallbackInsight: "Electric kettles rose from ₩20,000 in 2000 to ₩40,000 today: 2×. One of the slowest-rising items in this game. The basic function (boil water) has not changed; manufacturing moved to China early; domestic brands competed fiercely with imports. The market split between ₩15,000 budget kettles and ₩80,000+ designer models (Smeg, Fellow). The middle of the market, where most Koreans shop, has barely moved in 20 years."
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
   STATS - localStorage persistence
============================================================ */

const STATS_KEY = 'priceMemoryStats';

function saveGameResult(category, avgError) {
  const history = JSON.parse(localStorage.getItem(STATS_KEY) || '[]');
  history.push({ date: new Date().toISOString().slice(0, 10), category, avgError });
  if (history.length > 50) history.splice(0, history.length - 50);
  localStorage.setItem(STATS_KEY, JSON.stringify(history));
}

function showStatsScreen() {
  showScreen('screen-stats');
  document.getElementById('stats-name').value = localStorage.getItem('priceMemoryName') || '';
  const history = JSON.parse(localStorage.getItem(STATS_KEY) || '[]');

  // Overview
  const games = history.length;
  const overallAvg = games ? Math.round(history.reduce((s, r) => s + r.avgError, 0) / games) : null;
  document.getElementById('st-games').textContent = games || '--';
  document.getElementById('st-avg').textContent = overallAvg !== null ? overallAvg + '%' : '--';

  // By category
  const catEl = document.getElementById('st-categories');
  catEl.innerHTML = '';
  ['all', 'food', 'transport', 'culture', 'tech'].forEach(cat => {
    const rows = history.filter(r => r.category === cat);
    if (!rows.length) return;
    const avg = Math.round(rows.reduce((s, r) => s + r.avgError, 0) / rows.length);
    const div = document.createElement('div');
    div.className = 'history-row';
    div.innerHTML = `<span>${cat.charAt(0).toUpperCase() + cat.slice(1)}</span><span>${avg}% avg · ${rows.length} game${rows.length > 1 ? 's' : ''}</span>`;
    catEl.appendChild(div);
  });
  if (!catEl.children.length) {
    catEl.innerHTML = '<p class="stats-empty">No games yet.</p>';
  }

  // Recent games
  const histEl = document.getElementById('st-history');
  histEl.innerHTML = '';
  const recent = history.slice(-5).reverse();
  if (!recent.length) {
    histEl.innerHTML = '<p class="stats-empty">No games yet.</p>';
  } else {
    recent.forEach(r => {
      const div = document.createElement('div');
      div.className = 'history-row';
      div.innerHTML = `<span>${r.date} · ${r.category}</span><span>${r.avgError}% error</span>`;
      histEl.appendChild(div);
    });
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
  // Stats button
  document.getElementById('stats-btn').addEventListener('click', showStatsScreen);

  // API key toggle
  const apiToggle  = document.getElementById('api-key-toggle');
  const apiSection = document.getElementById('api-key-section');
  apiToggle.addEventListener('click', () => {
    const open = apiSection.hidden;
    apiSection.hidden = !open;
    apiToggle.textContent = open ? '▼ Enable explanations (Optional)' : '▶ Enable explanations (Optional)';
  });

  // Restore saved API key for this session
  const saved = sessionStorage.getItem('priceMemoryApiKey');
  if (saved) {
    document.getElementById('api-key-input').value = saved;
    apiSection.hidden = false;
    apiToggle.textContent = '▼ Enable explanations (Optional)';
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
  document.getElementById('home-btn').addEventListener('click', () => showScreen('screen-start'));
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

  // Validation: reject empty, non-numeric, decimal, or non-positive values
  if (raw === '' || isNaN(Number(raw))) {
    errorEl.textContent = 'Please enter a number.';
    input.focus();
    return;
  }
  const guess = Number(raw);
  if (!Number.isInteger(guess)) {
    errorEl.textContent = 'Please enter a whole number.';
    input.focus();
    return;
  }
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
  nextBtn.textContent = isLast ? 'See Results' : 'Next Question';
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
  document.getElementById('result-home-btn').addEventListener('click', () => showScreen('screen-start'));
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

  // Save to history
  saveGameResult(state.selectedCategory, avgError);

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

function initStatsScreen() {
  document.getElementById('stats-back-btn').addEventListener('click', () => {
    showScreen('screen-start');
  });

  // Restore saved name
  const savedName = localStorage.getItem('priceMemoryName') || '';
  document.getElementById('stats-name').value = savedName;

  document.getElementById('stats-save-name-btn').addEventListener('click', () => {
    const name = document.getElementById('stats-name').value.trim();
    if (name) localStorage.setItem('priceMemoryName', name);
    else localStorage.removeItem('priceMemoryName');
  });

  document.getElementById('stats-export-btn').addEventListener('click', () => {
    const data = {
      name: localStorage.getItem('priceMemoryName') || '',
      history: JSON.parse(localStorage.getItem(STATS_KEY) || '[]')
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'price-memory-progress.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  document.getElementById('stats-import-input').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.history) localStorage.setItem(STATS_KEY, JSON.stringify(data.history));
        if (data.name) {
          localStorage.setItem('priceMemoryName', data.name);
          document.getElementById('stats-name').value = data.name;
        }
        showStatsScreen();
      } catch {
        alert('Invalid file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  document.getElementById('stats-reset-btn').addEventListener('click', () => {
    if (!confirm('Reset all progress? This cannot be undone.')) return;
    localStorage.removeItem(STATS_KEY);
    localStorage.removeItem('priceMemoryName');
    document.getElementById('stats-name').value = '';
    showStatsScreen();
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
  initStatsScreen();
});
