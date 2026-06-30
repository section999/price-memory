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
    fallbackInsight: 'Jjajangmyeon is Korea\'s working-class price benchmark. From ₩700 in 1990 to ₩7,000 today: exactly 10×. Until 1984, the government set a legally enforceable ceiling price — a legacy of the Park Chung-hee and Chun Doo-hwan eras when jjajangmyeon was considered essential nutrition for laborers. After deregulation, prices rose steadily with flour, pork, and rent. Average manufacturing wages grew about 8× over the same period, meaning jjajangmyeon is roughly 25% more expensive in real terms than your parents paid. When the price crossed ₩5,000 around 2015 and then ₩6,000, each milestone made national headlines.'
  },
  {
    id: 'subway',
    category: 'transport',
    item: 'Seoul Subway Base Fare',
    context: 'Line 1, standard adult ticket',
    pastYear: 1994,
    trend: [300, 400, 500, 700, 900, 1050, 1250, 1500],
    trendYears: [1994, 1997, 1999, 2004, 2007, 2013, 2019, 2024],
    fallbackInsight: 'Seoul subway fares rose from ₩300 in 1994 to ₩1,500 today: 5× — by far the lowest increase of any major item in this game. The Seoul Metropolitan Government has run operating deficits every year since the 1990s; the gap between fares collected and actual operating costs is filled by city tax revenue, which exceeded ₩600 billion annually by 2023. Subway Line 1 actually opened in 1974 at ₩100 for a paper ticket; in real wage terms, today\'s ₩1,500 fare is cheaper than the 1974 price relative to income. In 2024, Seoul announced a hike to ₩1,650 citing fiscal unsustainability — the first explicit acknowledgment that the subsidy model has limits. Compare to jjajangmyeon at 10×: the subway is the most politically managed price in Korea.'
  },
  {
    id: 'chicken',
    category: 'food',
    item: 'Fried Chicken (후라이드)',
    context: 'One whole chicken, standard delivery brand',
    pastYear: 1995,
    trend: [5000, 6000, 7000, 8000, 10000, 13000, 17000, 22000],
    trendYears: [1995, 1998, 2001, 2004, 2008, 2012, 2017, 2024],
    fallbackInsight: 'Fried chicken rose from ₩5,000 in 1995 to ₩22,000 today: 4.4×. Until the mid-2000s, the market was dominated by small independent shops with competitive pricing. Then franchise brands — BBQ, BHC, Kyochon — consolidated with licensing fees adding ₩2,000–₩3,000 per bird to the cost structure. Baemin\'s rise from 2012 onward added platform commissions of 15–30% per order. The 2016–2017 avian influenza outbreak culled 30 million birds and temporarily spiked prices over ₩20,000; ASF (African Swine Fever) in 2019 shifted some pork demand to chicken, raising baseline prices further. A franchise chicken shop owner today earns less margin per bird than in 2005, yet consumers pay more. "₩30,000 chicken" crossed from joke to reality for premium brands in 2023.'
  },
  {
    id: 'movie',
    category: 'culture',
    item: 'Movie Ticket',
    context: 'CGV standard screening, weekend',
    pastYear: 2000,
    trend: [5000, 6000, 7000, 8000, 8000, 9000, 11000, 15000],
    trendYears: [2000, 2003, 2006, 2009, 2012, 2015, 2018, 2024],
    fallbackInsight: 'Movie tickets rose from ₩5,000 in 2000 to ₩15,000 today: 3×. Korea has been a uniquely cinema-obsessed nation — Parasite\'s 2020 Oscar win for Best Picture was the culmination of a culture where annual admissions once exceeded one per person per year. The 2003 reduction of the Screen Quota (from 146 to 73 mandatory Korean film days per year, under US trade pressure) changed the economics: more Hollywood blockbusters, more premium formatting. CGV went public in 2004 and invested heavily in IMAX and 4DX, pulling the entire price floor upward. Netflix\'s 2016 Korea launch was expected to collapse cinemas — it did not. In 2023, Korean theaters had their second-best attendance year on record, proving that despite ₩15,000 tickets, the cinema habit endures.'
  },
  {
    id: 'ramen',
    category: 'food',
    item: 'Shin Ramyun (신라면)',
    context: 'One pack, convenience store price',
    pastYear: 1986,
    trend: [150, 200, 300, 400, 500, 600, 720, 1000],
    trendYears: [1986, 1990, 1995, 2000, 2005, 2010, 2016, 2024],
    fallbackInsight: 'Shin Ramyun launched in October 1986 at ₩150 — deliberately spicier than market norms, targeting a gap Nongshim identified through consumer research. At ₩1,000 today, it has risen about 6.7× over 38 years, while overall Korean CPI rose roughly 7–8×. Shin Ramyun is actually cheaper in real terms — a rare Korean inflation winner. Nongshim achieved this through massive production scale and export growth to over 100 countries. The brand raised prices only 6 times in 36 years before the 2022 global wheat crisis (triggered by Russia\'s invasion of Ukraine) forced an 11.3% hike in August 2022 — the largest single increase in the brand\'s history. Before that, the previous hike was in 2016. Few Korean consumer products have maintained prices as consistently as Shin Ramyun.'
  },
  {
    id: 'bus',
    category: 'transport',
    item: 'Seoul City Bus Fare',
    context: 'Standard bus, adult fare',
    pastYear: 1990,
    trend: [170, 250, 400, 600, 900, 1050, 1200, 1500],
    trendYears: [1990, 1993, 1997, 2002, 2007, 2013, 2019, 2024],
    fallbackInsight: 'Seoul city bus fares rose from ₩170 in 1990 to ₩1,500 today: 8.8×. The 2004 bus reform (버스 준공영제) was the structural turning point: Mayor Lee Myung-bak converted Seoul\'s privately operated bus network into a quasi-public system, with the city absorbing operating losses in exchange for route and fare control. Before 2004, each private company set its own price; after, fare increases required city council approval and became politically costly. Seoul\'s annual bus deficit exceeded ₩1 trillion by 2022. The 2024 hike to ₩1,500 was framed explicitly as a fiscal reckoning after years of COVID revenue collapse. Korea\'s bus system is deliberately cheap; the difference between the fare and the true cost is paid by Seoul taxpayers.'
  },
  {
    id: 'coke',
    category: 'food',
    item: 'Coca-Cola 500ml',
    context: 'Convenience store price',
    pastYear: 1993,
    trend: [500, 600, 700, 800, 1000, 1200, 1500, 2000],
    trendYears: [1993, 1996, 1999, 2003, 2008, 2012, 2018, 2024],
    fallbackInsight: 'Coca-Cola 500ml rose from ₩500 in 1993 to ₩2,000 today: 4×. For a multinational commodity beverage, this is a remarkably stable long-term price — until 2022. The 1997 Asian financial crisis (IMF 외환위기) briefly collapsed Korean purchasing power so severely that even Coke consumption dropped; the price was then frozen for years to rebuild market share. The 2022 global inflation wave hit sugar, aluminum cans, and logistics simultaneously: Korea\'s CPI hit a 24-year high at 5.1% in 2022. Coca-Cola raised Korean prices 7–10% in 2022 and again in early 2023, the largest consecutive increase since the 1990s. What seems like a stable global brand is surprisingly exposed to Korean macroeconomic and commodity shocks.'
  },
  {
    id: 'tv',
    category: 'tech',
    item: '32-inch Samsung TV',
    context: 'Mid-range model, retail price',
    pastYear: 2005,
    trend: [1200000, 900000, 700000, 500000, 400000, 350000, 300000, 350000],
    trendYears: [2005, 2007, 2009, 2011, 2013, 2016, 2020, 2024],
    fallbackInsight: "A 32-inch Samsung TV cost ₩1,200,000 in 2005 and costs ₩350,000 today: 71% cheaper — the deflation story of Korean manufacturing. Samsung and LG pioneered large-scale LCD production in Gumi and Paju factories in the early 2000s and briefly controlled over 50% of global panel supply. Chinese manufacturers — BOE, CSOT — then entered with state subsidies, eroding Korean dominance and driving LCD prices toward breakeven. Samsung and LG responded by pivoting upmarket to OLED (Samsung to QD-OLED, LG to W-OLED), leaving standard LCD as a commodity. The 32-inch TV you buy for ₩350,000 today has better color accuracy, thinner bezels, and lower power consumption than the ₩1,200,000 set of 2005. Technology deflated; food inflated. That asymmetry is the defining pattern of the past 20 years."
  },
  {
    id: 'coffee',
    category: 'food',
    item: 'Americano (아메리카노)',
    context: 'Starbucks standard size',
    pastYear: 2000,
    trend: [3000, 3300, 3500, 3800, 4000, 4100, 4500, 5500],
    trendYears: [2000, 2003, 2006, 2009, 2012, 2015, 2019, 2024],
    fallbackInsight: "Starbucks entered Korea in 1999 with its first store in Ewha Womans University, positioned as an aspirational Western experience. The Americano was ₩3,000 and by 2024 is ₩5,500: only 1.8× over 25 years — the slowest price rise in this entire game. Starbucks deliberately suppresses increases because in Korea, 'going to Starbucks' carries social meaning beyond the coffee itself. Korean coffee culture transformed completely in this period: in 2000, Maxim instant coffee dominated every office; by 2015, Korea had one of the highest specialty coffee shop densities in the world. The real shift is the comparison: ₩3,000 in 2000 bought 4 bowls of jjajangmyeon. Today ₩5,500 does not buy one. Coffee held its value; jjajangmyeon lost it."
  },
  {
    id: 'taxi',
    category: 'transport',
    item: 'Seoul Taxi Base Fare',
    context: 'Standard taxi, daytime rate',
    pastYear: 1990,
    trend: [700, 1000, 1300, 1600, 2400, 3000, 3800, 4800],
    trendYears: [1990, 1994, 1998, 2002, 2007, 2013, 2019, 2024],
    fallbackInsight: 'Seoul taxi base fares rose from ₩700 in 1990 to ₩4,800 today: 6.9×. The largest single hike came in February 2023 — fares jumped from ₩3,800 to ₩4,800 (26%) after drivers organized through Kakao Mobility\'s platform to demand COVID loss recovery and fuel cost relief. The arrival of Kakao Taxi in 2015 transformed the industry: before it, drivers competed individually; after, app-based dispatch organized them into an effective collective, giving driver unions new leverage in fare negotiations. Seoul\'s taxi industry went from over 70,000 licensed cabs in 2010 to under 60,000 by 2023 as younger workers chose other gig work, tightening supply and supporting higher fares. A late-night cross-city trip with night surcharges (20%) can now reach ₩15,000–₩20,000 from the ₩4,800 starting point.'
  },
  {
    id: 'kimbap',
    category: 'food',
    item: 'Gimbap (김밥)',
    context: 'One roll, standard restaurant',
    pastYear: 1990,
    trend: [500, 700, 1000, 1500, 2000, 2500, 3000, 4000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Gimbap rose from ₩500 in 1990 to ₩4,000 today: 8×. The ₩1,000 gimbap persisted as a near-sacred price point well into the 2010s. Then two forces converged: minimum wage increases accelerated from ₩5,580 in 2016 to ₩9,860 in 2024 (76.7% in 8 years), directly hitting the labor-intensive rolling process; and napa cabbage price shocks (the 2010 kimchi crisis, the 2022 drought) hit ingredient costs. The convenience store roll (₩1,500–₩2,000) survived by automating production, but the made-to-order neighborhood shop can no longer operate at ₩1,000 without losing money. When gimbap crossed ₩3,000 around 2021, it became a national symbol of "lunchflation" — the moment Korean workers realized even the cheapest lunch was no longer truly cheap.'
  },
  {
    id: 'samgyeopsal',
    category: 'food',
    item: 'Samgyeopsal (삼겹살)',
    context: '200g per person serving, standard restaurant',
    pastYear: 1995,
    trend: [4000, 6000, 8000, 10000, 12000, 15000, 18000],
    trendYears: [1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Samgyeopsal rose from ₩4,000 per person in 1995 to ₩18,000 today: 4.5×. Two disease events caused the sharpest spikes: the 2010–2011 foot-and-mouth disease outbreak culled 3.3 million pigs (nearly 30% of Korea\'s national herd), triggering a government-declared agricultural disaster and a 40% price surge within months; African Swine Fever (ASF) in 2019 then destroyed herd populations across Northeast Asia for two consecutive years. Beyond the pork, every element alongside it — gas, sesame oil, lettuce, garlic, side dishes, and above all restaurant rent in Seoul — rose faster than the meat itself. Samgyeopsal restaurants operate on famously thin margins because all side dishes (banchan) are included free, making it one of Korea\'s most cost-pressured food business models.'
  },
  {
    id: 'soju',
    category: 'food',
    item: 'Soju — Restaurant Bottle (소주)',
    context: 'One 360ml bottle, standard restaurant',
    pastYear: 1990,
    trend: [700, 1000, 1500, 2000, 3000, 4000, 5000, 6000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Restaurant soju jumped from ₩700 in 1990 to ₩6,000 today: 8.6×. The factory price (HiteJinro, which holds ~50% market share) is only about ₩1,100 per bottle — the rest is restaurant markup. Korea levies a 72% factory-price tax on soju, a legacy policy that paradoxically kept retail prices low while protecting domestic distillers from import competition. In 2022–2023, Koreans watched restaurant soju cross ₩5,000 then ₩6,000 in rapid succession — each ₩500 hike generating genuine national outrage and media coverage. Post-COVID rent recovery left restaurants with their thinnest margins in a decade, and soju — as a near-inelastic beverage in Korean dining culture — became the primary vehicle for operators to quietly recover revenue without raising food prices directly.'
  },
  {
    id: 'bigmac',
    category: 'food',
    item: 'Big Mac (빅맥)',
    context: "McDonald's Korea, standard price",
    pastYear: 1995,
    trend: [2300, 2900, 3200, 3700, 4400, 5400, 6500],
    trendYears: [1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "The Economist's Big Mac Index uses the burger as a global purchasing power benchmark. Korea's price rose from ₩2,300 in 1995 to ₩6,500 today: 2.8×, suggesting the won has been roughly fairly valued against the dollar throughout this period. McDonald's entered Korea in 1988 — timed to coincide with the Seoul Olympics — and the Big Mac was a symbol of Westernization for a generation. The chain kept Korean prices deliberately low to maintain its mass-market positioning. But back-to-back 4–5% hikes in 2022 and 2023, driven by global beef, wheat, and labor cost surges, broke a pattern of restraint. Korea's Big Mac remains cheaper than Japan's (₩7,500 equivalent) and far cheaper than Switzerland's (₩16,000 equivalent), illustrating how local wage levels and competition shape even a 'global' product's price."
  },
  {
    id: 'naengmyeon',
    category: 'food',
    item: 'Naengmyeon (냉면)',
    context: 'One bowl, standard restaurant',
    pastYear: 1990,
    trend: [2000, 3000, 4000, 5000, 7000, 8000, 10000, 13000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Naengmyeon rose from ₩2,000 in 1990 to ₩13,000 today: 6.5×. The dish exists in two revered regional traditions — Pyongyang style (물냉면, subtle beef broth) and Hamheung style (비빔냉면, spicy). After inter-Korean moments of détente, interest in Pyongyang naengmyeon surged; the 2018 Pyongyang summit dinner famously featured Okryu-gwan naengmyeon, and Seoul restaurants marketing "Pyongyang style" subsequently raised prices citing prestige. Buckwheat prices are volatile — dominated by imports from China and Russia — and global grain pressure flows directly into each bowl. The famous old Seoul naengmyeon houses that broke the ₩10,000 barrier in 2019 triggered national media coverage; ₩13,000–₩15,000 is now standard even at mid-range restaurants. The ₩5,000 bowl is a memory from the 2000s.'
  },
  {
    id: 'melona',
    category: 'food',
    item: 'Melona Ice Cream (메로나)',
    context: 'One bar, convenience store',
    pastYear: 1992,
    trend: [200, 300, 500, 600, 700, 800, 1000, 1500],
    trendYears: [1992, 1997, 2002, 2006, 2010, 2014, 2018, 2024],
    fallbackInsight: "Melona launched in April 1992 at ₩200 — one of the most successful Korean FMCG launches of the 1990s, created by Binggrae. At ₩1,500 today it has risen 7.5×. For nearly 30 years, ice cream manufacturers engaged in what economists call tacit collusion on price: no company wanted to be first to raise prices and lose shelf space to rivals, so costs were absorbed. This held Korean ice cream prices below general inflation for decades. Then in 2022, palm oil (key for the Melona base), refined sugar, and plastic packaging hit simultaneous cost spikes linked to the global commodity supercycle and Russia-Ukraine conflict. Binggrae raised prices 15–17% in 2022 and again in 2023. The ₩1,000 price point — held since 2018 — was abandoned, ending a generational price anchor for Korean summer."
  },
  {
    id: 'bread',
    category: 'food',
    item: 'White Bread Loaf (식빵)',
    context: 'Standard supermarket loaf (~270g)',
    pastYear: 1990,
    trend: [600, 800, 1200, 1500, 2000, 2500, 3000, 3800],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'A loaf of white bread rose from ₩600 in 1990 to ₩3,800 today: 6.3×. Korea imports over 90% of its wheat, sourcing primarily from the US, Australia, and — until 2022 — Ukraine. Russia\'s February 2022 invasion sent global wheat futures up over 60% within weeks; Russia and Ukraine together accounted for about 30% of global wheat exports. Korean millers immediately passed costs forward: retail bread prices rose 15–30% within six months — the fastest single-year increase since the 1990s. The Korea Agro-Fisheries & Food Trade Corporation (aT) manages strategic grain reserves, but these are measured in weeks, not years. The 2022 crisis demonstrated how a single geopolitical event on another continent can abruptly reset the price of breakfast on the other side of the world.'
  },
  {
    id: 'pizza',
    category: 'food',
    item: 'Delivery Pizza — Regular Size',
    context: "Domino's or Pizza Hut, standard menu",
    pastYear: 2000,
    trend: [12000, 15000, 17000, 19000, 21000, 23000, 28000],
    trendYears: [2000, 2005, 2009, 2012, 2015, 2019, 2024],
    fallbackInsight: 'Delivery pizza rose from ₩12,000 in 2000 to ₩28,000 today: 2.3×. Until 2010, Korean pizza delivery used direct phone ordering — restaurants ran their own drivers, and costs were contained. The rise of Baemin (Woowa Brothers, founded 2011) then Coupang Eats and Yogiyo restructured the economics: platforms initially charged 6–15% commission, then raised to 15–30% as market concentration grew. Delivery Riders Union strikes in 2020–2021 raised rider wages, which platforms passed upstream to restaurants. By 2022, the effective platform cost per order reached ₩4,000–₩7,000. Woowa Brothers was acquired by Germany\'s DoorDash parent (Delivery Hero) in 2019 for $4 billion — validating the platform model just as it was making food more expensive. Domino\'s and Pizza Hut publicly cited platform fees as the primary reason for 2022–2023 price hikes.'
  },
  {
    id: 'triangle_kimbap',
    category: 'food',
    item: 'Triangle Kimbap (삼각김밥)',
    context: 'Convenience store, standard filling',
    pastYear: 2000,
    trend: [500, 600, 700, 800, 1000, 1200, 1500],
    trendYears: [2000, 2003, 2006, 2009, 2013, 2018, 2024],
    fallbackInsight: 'Triangle kimbap was ₩500 in 2000 — introduced to Korea in the mid-1990s as a Japanese convenience food format and rapidly adopted as an affordable meal. At ₩1,500 today it has tripled over 24 years: one of the smaller increases in this game. CU, GS25, and 7-Eleven competed intensely on quality (better fillings, freshness, the now-iconic seaweed-separation packaging), driving volume and keeping prices low through scale. The ₩1,000 floor survived numerous cost pressures until 2022: Korea\'s minimum wage surpassed ₩9,000 (a 76.7% increase in 8 years), rice prices rose after consecutive poor harvests, and sesame oil hit multi-decade highs. The era of the ₩1,000 triangle kimbap — which outlasted multiple presidential administrations — officially ended in 2022.'
  },
  {
    id: 'seolleongtang',
    category: 'food',
    item: 'Seolleongtang (설렁탕)',
    context: 'One bowl, standard restaurant',
    pastYear: 1990,
    trend: [2000, 3000, 4000, 5000, 7000, 8000, 10000, 12000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Seolleongtang rose from ₩2,000 in 1990 to ₩12,000 today: 6×. This milky ox bone soup has been a Seoul lunch institution since the Joseon era. To make it properly, beef leg bones simmer 12+ hours — making energy costs unusually high as a share of total cost. When LNG prices surged in 2022 (Korea imports nearly all of its natural gas and faced spot market spikes following Russia\'s Ukraine invasion), seolleongtang restaurants were among the first to announce major price hikes. The legendary old restaurants in Jongno and Mapo that built loyal clientele across generations have been closing as rents rise and founding owners retire. The bowl you eat today at 6× the price may come from a kitchen that has held the same recipe for 40 years but now operates with half the staff.'
  },
  {
    id: 'ktx',
    category: 'transport',
    item: 'KTX Seoul–Busan',
    context: 'Standard seat, one way',
    pastYear: 2004,
    trend: [41500, 44800, 49800, 53600, 59800, 59800, 62800],
    trendYears: [2004, 2007, 2010, 2013, 2017, 2020, 2024],
    fallbackInsight: 'KTX Seoul–Busan launched in April 2004 at ₩41,500 — a transformational moment that cut the 4.5-hour express bus journey to 2 hours 40 minutes. At ₩62,800 today, it has risen just 51% in 20 years — far below food inflation. KORAIL (Korea Railroad Corporation) is 100% state-owned, and fare increases require government approval; they have consistently been kept below CPI to maintain KTX\'s social contract as public infrastructure. The actual cost of building and operating high-speed rail infrastructure is far higher than any ticket price; the gap is covered by government subsidies and KTX revenues cross-subsidizing slower regional lines. When KTX launched, it was seen as a national development project — completing Korea\'s rail modernization that began with the 1970 Gyeongbu Expressway.'
  },
  {
    id: 'gasoline',
    category: 'transport',
    item: 'Gasoline (휘발유)',
    context: 'Per liter, national average pump price',
    pastYear: 1995,
    trend: [600, 1000, 1400, 1900, 1750, 1600, 1400, 1700],
    trendYears: [1995, 2000, 2005, 2008, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Gasoline rose from ₩600/L in 1995 to ₩1,700 in 2024: 2.8×. But the chart is a roller coaster revealing Korea\'s total dependence on oil imports (97%+ of all crude). The 2008 global oil crisis pushed prices past ₩1,900 and sparked Korea\'s first serious EV and hydrogen policy push. COVID-19 collapsed global demand in 2020 and pulled pump prices below ₩1,400. Russia\'s 2022 Ukraine invasion spiked Brent crude above $130/barrel and Korean gas prices above ₩2,200 before government rebates. About 50% of the pump price is taxes (transportation energy tax + VAT). The Korean government temporarily cut the fuel tax by 30% in 2022 to buffer the shock — one of the largest direct household subsidies since the 1997 IMF crisis. Korea\'s gasoline price is set by two forces: global crude markets and the Korean tax code.'
  },
  {
    id: 'expressway_toll',
    category: 'transport',
    item: 'Highway Toll Seoul–Busan',
    context: 'Passenger car, Gyeongbu Expressway (경부고속도로)',
    pastYear: 1995,
    trend: [10900, 14400, 18600, 23900, 24100, 24100, 26000],
    trendYears: [1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'The Seoul–Busan highway toll rose from ₩10,900 in 1995 to ₩26,000 today: 2.4×. Korea Expressway Corporation (한국도로공사) is state-owned and toll increases require government approval, keeping the Gyeongbu Expressway — Korea\'s most important highway, opened in 1970 under the Park Chung-hee administration\'s 경제개발 plan — politically constrained. But the 2000s saw the rise of privately financed expressways (민자고속도로) built under BOT (Build-Operate-Transfer) agreements. These routes — including sections of the Seoul Ring Road and Incheon Airport Expressway — set their own tolls with far less public oversight and raised them 3–5× faster than public highways. The two-tier toll system created striking inequities: the same drive can cost radically different amounts depending on whether you use public or private infrastructure.'
  },
  {
    id: 'karaoke',
    category: 'culture',
    item: 'Norebang (노래방)',
    context: 'Per hour, standard private room',
    pastYear: 1995,
    trend: [3000, 5000, 6000, 8000, 10000, 12000, 15000],
    trendYears: [1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Norebang was invented in Korea in the 1980s and spread across Asia as a $5 billion industry. From ₩3,000/hour in 1995 to ₩15,000 today: 5×. Music licensing fees (KMCA and KMC collect royalties on every song played) are a unique cost burden that rises with industry lobbying. Equipment upgrades — touchscreen catalogs replacing binders, high-definition screens, premium audio systems — justified price increases. Karaoke rooms occupy large floor areas in expensive commercial zones, making rent a major fixed cost. The rise of coin-operated solo norebang booths (코인노래방) in the late 2010s created a sub-₩1,500/song alternative, but traditional private rooms continued climbing. The format survived competition from streaming, gaming, and social media; singing together remains a near-universal Korean social ritual.'
  },
  {
    id: 'jjimjilbang',
    category: 'culture',
    item: 'Jjimjilbang (찜질방)',
    context: 'Entry fee, standard facility',
    pastYear: 1995,
    trend: [3000, 5000, 7000, 8000, 9000, 10000, 12000],
    trendYears: [1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Jjimjilbang entry rose from ₩3,000 in 1995 to ₩12,000 today: 4×. Energy is the dominant cost: heating sauna rooms, pools, and 24-hour common areas consumes enormous amounts of gas and electricity. The 2022 energy crisis hit Korean LNG import prices by 150%+ over 18 months — jjimjilbangs, which cannot reduce their heating without destroying the product, faced the most severe operating cost pressures in their history. Hundreds closed or temporarily suspended operations. Jjimjilbangs serve a dual social role that is often overlooked: they are a leisure space for families and also an informal shelter for travelers, seniors, and unhoused people seeking a safe, warm overnight space for ₩10,000–₩15,000. Price hikes have real social consequences in this second role, reducing access for Korea\'s most vulnerable users.'
  },
  {
    id: 'pccafe',
    category: 'culture',
    item: 'PC Café (PC방)',
    context: 'Per hour, standard seat',
    pastYear: 1999,
    trend: [1000, 1000, 1000, 1000, 1000, 1500, 2000],
    trendYears: [1999, 2003, 2007, 2011, 2016, 2020, 2024],
    fallbackInsight: 'PC cafés held ₩1,000 per hour for nearly two decades — one of the most remarkable price locks in Korean consumer history. When PC bangs boomed in 1999 following StarCraft\'s explosion (concurrent with widespread internet access during the Kim Dae-jung government\'s 초고속 인터넷 initiative), thousands of shops competed so intensely that no operator dared raise prices first. The ₩1,000 floor persisted through the 2004 WoW expansion, the 2012 League of Legends era, and the entire rise of Korean esports. Finally in the 2020s, the dual pressure of minimum wages rising above ₩9,000 and post-COVID rent recovery broke the consensus. ₩2,000/hour is now standard in urban areas. The "₩1,000 PC bang" era — which shaped an entire generation of Korean gaming culture — is officially over.'
  },
  {
    id: 'newspaper',
    category: 'culture',
    item: 'Newspaper Subscription (신문)',
    context: 'Monthly subscription, major daily paper',
    pastYear: 1990,
    trend: [3000, 5000, 7000, 10000, 13000, 15000, 18000, 20000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'A monthly newspaper subscription rose from ₩3,000 in 1990 to ₩20,000 today: 6.7×. But actual readership has collapsed by over 70% since 2000. The 1997 IMF crisis devastated advertising budgets; the 2000s internet revolution then permanently shifted audiences online. Korea\'s major dailies — Chosun, JoongAng, Dong-A — responded by raising subscription prices to compensate for lost ad revenue. This created the classic declining-industry doom loop: higher prices drove more cancellations, which required further hikes. By the 2010s, printed newspapers were distributed as loss-leaders with gifts (umbrellas, rice) to maintain subscriber counts needed to justify advertising rates. Print journalism in Korea is now expensive, politically polarized, and niche — a textbook example of what economists call a "death spiral" pricing dynamic.'
  },
  {
    id: 'novel',
    category: 'culture',
    item: 'Korean Novel (소설책)',
    context: 'New release, major publisher',
    pastYear: 1990,
    trend: [3000, 5000, 7000, 8000, 10000, 12000, 14000, 17000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'A Korean novel cost ₩3,000 in 1990 and costs ₩17,000 today: 5.7×. Paper, printing, and labor all rose, but the bigger driver has been consolidation: large publishers raised prices as independent bookshops closed and fewer price-competitive outlets remained. E-books are now available at 60–70% of the print price, but Korean readers retain a strong physical book preference. Han Kang\'s 2024 Nobel Prize in Literature marked a global watershed moment for Korean publishing — the first Korean Nobel laureate in any category — and immediately drove unprecedented international sales. Korean literature is now translated and sold in over 30 languages. The industry is a paradox: culturally booming internationally, economically pressured domestically, with physical books that cost nearly 6× their 1990 price.'
  },
  {
    id: 'baseball',
    category: 'culture',
    item: 'KBO Baseball Ticket',
    context: 'Standard seat (일반석), KBO League',
    pastYear: 2000,
    trend: [3000, 5000, 8000, 10000, 12000, 13000, 15000],
    trendYears: [2000, 2005, 2010, 2015, 2019, 2022, 2024],
    fallbackInsight: 'KBO baseball tickets rose from ₩3,000 in 2000 to ₩15,000 today: 5×. The 2023–2024 KBO season set all-time attendance records — over 10 million cumulative spectators in 2024 — driven by heightened national interest following Ryu Hyun-jin and Kim Ha-seong\'s success in MLB and intense rivalry between powerhouse franchises. Teams responded by restructuring seating tiers and eliminating cheap sections. The popular Dugout Club seats that cost ₩10,000 in 2015 now exceed ₩30,000–₩50,000. Add the chimaek (chicken + beer) ritual at ₩25,000+ and a family of four to a Doosan–LG rivalry game at Jamsil now costs ₩150,000–₩200,000 all-in. Baseball fandom remains intense but is no longer cheap.'
  },
  {
    id: 'galaxy',
    category: 'tech',
    item: 'Samsung Galaxy Flagship (갤럭시)',
    context: 'S-series top model, launch retail price',
    pastYear: 2010,
    trend: [800000, 900000, 900000, 990000, 1000000, 1250000, 1350000],
    trendYears: [2010, 2012, 2014, 2016, 2019, 2022, 2024],
    fallbackInsight: "Samsung's Galaxy S flagship rose from ₩800,000 in 2010 to ₩1,350,000 today: 1.7×. But the Galaxy S24 Ultra performs roughly 1,000× better than the original Galaxy S by every metric — processing speed, camera resolution, battery life, connectivity. Whether this constitutes inflation depends entirely on how you define the product. Samsung introduced the S-series in 2010 as the culmination of Korea's semiconductor and display competitiveness; the Galaxy phone became Korea's most visible technological export. The real market shift: the Galaxy A-series (₩400,000) now outperforms the 2015 flagship Galaxy S6, making the premium tier increasingly an identity purchase rather than a performance necessity. Korean carriers historically subsidized flagship phones through two-year contracts, masking the true price from consumers — a subsidy structure that ended with 2014 regulatory changes."
  },
  {
    id: 'internet',
    category: 'tech',
    item: 'Home Internet (인터넷)',
    context: 'Monthly broadband subscription',
    pastYear: 2000,
    trend: [35000, 30000, 27000, 25000, 25000, 27000, 30000],
    trendYears: [2000, 2005, 2008, 2012, 2016, 2020, 2024],
    fallbackInsight: 'Home internet dropped from ₩35,000/month in 2000 to ₩25,000 at its cheapest (2012–2018), then crept back to ₩30,000. The Kim Dae-jung government\'s 1999 "초고속 인터넷" (ultra-high-speed internet) national plan was one of the most consequential infrastructure decisions in Korean history: it mandated fiber-optic rollout and encouraged competition between SKT, KT, and LGU+, driving prices down even as speeds multiplied from 1Mbps to 1Gbps. Korea consistently ranked #1 in global broadband speed throughout the 2000s and 2010s. The slight rebound since 2018 reflects gigabit fiber upgrades and 5G mobile convergence packages. In this game, almost everything got 3–10× more expensive. Internet got cheaper and faster simultaneously — the most anomalous item of all.'
  },
  {
    id: 'laptop',
    category: 'tech',
    item: 'Mid-range Laptop (노트북)',
    context: 'Samsung/LG standard model',
    pastYear: 2000,
    trend: [1500000, 1200000, 900000, 700000, 700000, 800000, 1000000],
    trendYears: [2000, 2004, 2008, 2012, 2016, 2020, 2024],
    fallbackInsight: 'A mid-range Samsung or LG laptop cost ₩1,500,000 in 2000 and costs around ₩1,000,000 today — nominally 33% cheaper, but exponentially more powerful. Prices fell steadily to ₩700,000 by 2012 as manufacturing shifted to Taiwan and China and Intel\'s processor roadmap followed Moore\'s Law. Then the COVID-19 pandemic created a historic demand surge — every student and office worker suddenly needed a personal device — simultaneously with the 2020–2021 global chip shortage, which was the worst semiconductor supply disruption in 30 years. Laptop prices jumped 20–30% in 2021 before normalizing. The real question is not "did the price change?" but "what does ₩1 million buy?" — and in 2024 it buys a machine incomparably faster than the 2000 version at the same nominal price.'
  },
  {
    id: 'wireless_earphones',
    category: 'tech',
    item: 'Wireless Earphones (무선 이어폰)',
    context: 'Mid-range TWS earphones',
    pastYear: 2017,
    trend: [150000, 120000, 100000, 80000, 70000],
    trendYears: [2017, 2019, 2020, 2022, 2024],
    fallbackInsight: "TWS (True Wireless Stereo) earphones entered the Korean mass market around 2017 at ₩150,000 for a decent mid-range pair — the same year Apple removed the headphone jack from the iPhone, forcing a global shift to wireless. By 2024 you can find capable pairs for ₩70,000: a 53% price drop in 7 years. Chinese manufacturers — Xiaomi, QCY, Anker — commoditized the core Bluetooth chip and driver technology with remarkable speed, forcing Samsung Galaxy Buds and Sony to compete harder on premium features (ANC, spatial audio, fit). Battery life improved from 3 hours in 2017 to 8–10 hours in 2024 while prices fell. In a game full of items that cost 4–10× more than before, TWS earphones went entirely the other direction."
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
    fallbackInsight: 'Donkkaseu rose from ₩2,000 in 1990 to ₩13,000 today: 6.5×. The dish entered Korea during the Japanese colonial era and became embedded in school cafeteria culture — the "학생 돈가스" was the defining cheap treat of Korean childhood through the 1980s and 1990s. Pork loin prices track domestic pork markets affected by disease outbreaks (foot-and-mouth 2011, ASF 2019), breadcrumbs follow wheat costs, and frying oil surged in 2022 when palm oil markets were disrupted by Indonesia\'s export ban during the Ukraine war commodity shock. Commercial fryers running all day contribute significantly to energy bills, which rose sharply in 2022–2023. The ₩5,000 donkkaseu of the early 2000s — already expensive by 1990s standards — now seems like a distant memory.'
  },
  {
    id: 'sundaegukbap',
    category: 'food',
    item: 'Sundae Gukbap (순대국밥)',
    context: 'One bowl, standard restaurant',
    pastYear: 1990,
    trend: [1500, 2000, 3000, 4000, 5000, 7000, 8000, 10000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Sundae gukbap rose from ₩1,500 in 1990 to ₩10,000 today: 6.7×. Once the cheapest hot meal a Korean laborer could buy — a bowl of pork broth with blood sausage and offal, available at dawn near factory gates and market stalls. The 2010–2011 foot-and-mouth disease outbreak triggered mass culling of nearly a third of Korea\'s pig population, causing the single largest pork price spike in modern Korean history and permanently lifting the baseline cost of pork-based soups. Offal cuts that were once essentially discarded — now prized for flavor — rose dramatically in price as restaurant demand for them grew. The ₩10,000 crossing in 2022–2023 made sundae gukbap a symbol of "서민 물가" (everyday people\'s prices) inflation. Its working-class identity is now at odds with its price tag.'
  },
  {
    id: 'bibimbap',
    category: 'food',
    item: 'Bibimbap (비빔밥)',
    context: 'One bowl, standard restaurant',
    pastYear: 1990,
    trend: [2000, 3000, 4000, 5000, 7000, 8000, 10000, 12000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Bibimbap rose from ₩2,000 in 1990 to ₩12,000 today: 6×. The dish requires over 10 separate vegetable toppings, each seasoned and prepared individually — making it among the most labor-intensive Korean meals per plate. Jeonju bibimbap, certified as a UNESCO Intangible Cultural Heritage candidate, became Korea\'s flagship dish for tourism and food diplomacy. Korean Air has served Jeonju bibimbap on international routes since the 1990s, and its global prestige has gradually pulled even the neighborhood version upmarket. The Korean government\'s Hansik (한식) globalization initiative in the late 2000s invested billions in promoting Korean cuisine globally — a campaign whose cultural success flowed back into domestic price expectations.'
  },
  {
    id: 'kimchijjigae',
    category: 'food',
    item: 'Kimchi Jjigae (김치찌개)',
    context: 'Per person, standard restaurant',
    pastYear: 1990,
    trend: [1500, 2500, 3500, 4500, 6000, 7000, 8000, 10000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Korea's national comfort food rose from ₩1,500 in 1990 to ₩10,000 today: 6.7×. Kimchi jjigae requires aged kimchi (which becomes more expensive as labor costs for kimchi-making rise), pork belly, and tofu — every ingredient has tracked its own inflation curve. The 2010 kimchi crisis — when napa cabbage prices surged 500% in two months due to a summer heat wave — permanently disrupted the assumption that kimchi was a free or trivially cheap ingredient. Post-crisis, the cost of aged kimchi entered restaurant calculation as a real expense. When restaurant-standard kimchi jjigae crossed ₩8,000 around 2020, it sparked policy debates about affordable meal access. At ₩10,000, Korea's most universal comfort food is no longer actually cheap."
  },
  {
    id: 'samgyetang',
    category: 'food',
    item: 'Samgyetang (삼계탕)',
    context: 'One whole chicken, standard restaurant',
    pastYear: 1990,
    trend: [5000, 7000, 10000, 12000, 14000, 16000, 18000, 22000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Samgyetang rose from ₩5,000 in 1990 to ₩22,000 today: 4.4×. Traditionally eaten on the three hottest days of the lunar calendar (초복, 중복, 말복), it requires a whole young chicken, Korean ginseng (인삼), jujubes, and garlic — all of which track independent agricultural cost curves. The avian influenza outbreak of 2016–2017 was particularly severe, culling 33 million birds and creating temporary shortages that pushed samgyetang prices above ₩18,000 for the first time. Korean ginseng — cultivated under shade canopies for 4–6 years before harvest — has its own inflation independent of food prices, driven by Chinese export demand and Korean wellness culture. As a once-a-year ritual meal tied to enduring beliefs about health and heat, consumers show unusual price inelasticity.'
  },
  {
    id: 'tteokbokki',
    category: 'food',
    item: 'Tteokbokki (떡볶이)',
    context: 'Standard street food portion',
    pastYear: 1990,
    trend: [500, 700, 1000, 1500, 2000, 3000, 4000, 5000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Tteokbokki rose from ₩500 in 1990 to ₩5,000 today: 10× — tied with jjajangmyeon for the highest inflation multiple of any Korean food in this game. Rice cake (떡) prices track rice market conditions directly; gochujang has risen with red pepper prices, which suffer frequent harvest volatility. The format transformed: from pojangmacha (포장마차) carts with no fixed address, to permanent 분식점 shops, to franchise chains like Sindangdong Tteokbokki and Jaws (죠스떡볶이), each step formalizing costs. Street food vendors who avoided commercial rent for decades now pay shopping mall franchise fees. Global K-food popularity — tteokbokki appears prominently in K-dramas and went viral through platforms like TikTok — gave operators justification to position it as a premium item. A dish born from poverty now costs more than its own origin story suggests it should."
  },
  {
    id: 'kalguksu',
    category: 'food',
    item: 'Kalguksu (칼국수)',
    context: 'One bowl, standard restaurant',
    pastYear: 1990,
    trend: [1500, 2000, 3000, 4000, 5000, 7000, 8000, 10000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Kalguksu rose from ₩1,500 in 1990 to ₩10,000 today: 6.7×. Wheat flour is the dominant ingredient and directly imported — Korea grows almost none of its own wheat. When Russia invaded Ukraine in February 2022, global wheat futures spiked 60%; Korea immediately felt the impact through millers raising prices within weeks. Kalguksu restaurants were among the first food businesses to publicly announce ₩10,000 prices in 2022, generating national media coverage and consumer backlash. The irony: kalguksu was long valued as the "healthier, more artisanal" alternative to instant ramen — made with fresh dough, hand-cut noodles, and clean broth. Its artisan credentials made restaurants confident that customers would absorb price increases. At ₩10,000, the humble noodle bowl is now in the same price tier as a restaurant rice set meal.'
  },
  {
    id: 'sundubujjigae',
    category: 'food',
    item: 'Sundubu Jjigae (순두부찌개)',
    context: 'One serving, standard restaurant',
    pastYear: 1995,
    trend: [3000, 4000, 5000, 6000, 7000, 8000, 10000],
    trendYears: [1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Sundubu jjigae rose from ₩3,000 in 1995 to ₩10,000 today: 3.3×. One of the slower food inflation rates in this game — partly because tofu production is highly mechanized and domestic soybean supply benefits from stable import relationships with the US and Brazil. Korea has been one of the world\'s largest soybean importers since the 1980s, and long-term supply contracts have muted price volatility. Yet the restaurant price has still more than tripled. The gap between ingredient cost and selling price reveals how much of a Korean restaurant meal is actually paying for labor, gas utilities, and commercial rent — not the food itself. In this sense, sundubu jjigae is a cleaner example of service-sector inflation than almost any other Korean dish.'
  },
  {
    id: 'convenience_lunch',
    category: 'food',
    item: 'Convenience Store Lunchbox (도시락)',
    context: 'Standard meal set, CU/GS25/7-Eleven',
    pastYear: 2000,
    trend: [2000, 2500, 3000, 3500, 4000, 4500, 5500],
    trendYears: [2000, 2004, 2008, 2011, 2015, 2019, 2024],
    fallbackInsight: "Convenience store lunchboxes rose from ₩2,000 in 2000 to ₩5,500 today: 2.75×. Korea's convenience store chains — CU (BGF Retail), GS25, 7-Eleven, Ministop — invested heavily in food manufacturing infrastructure from the 2000s onward, building central kitchens that produced fresh lunchboxes at industrial scale. This efficiency kept prices far below restaurant alternatives. The 2023 'lunchflation' wave brought an unexpected twist: as restaurant jjajang crossed ₩10,000 and gimbap hit ₩4,000, office workers fled to convenience stores seeking affordable meals — only to find lunchbox prices had also risen 20–30% since 2021 due to rice, chicken, and packaging cost spikes. The convenience lunchbox, once a clear budget choice, became the subject of the same national inflation anxiety as restaurant food."
  },
  {
    id: 'latte',
    category: 'food',
    item: 'Café Latte (라떼)',
    context: 'Starbucks Korea, tall size',
    pastYear: 2000,
    trend: [3500, 3800, 4000, 4300, 4600, 5000, 6100],
    trendYears: [2000, 2003, 2006, 2009, 2012, 2016, 2024],
    fallbackInsight: 'A Starbucks Tall latte rose from ₩3,500 in 2000 to ₩6,100 today: 1.7×. Starbucks Korea is the most profitable Starbucks market in Asia by store count; it opened its 1,000th Korean store in 2021 and now operates over 1,800. Despite explosive growth, the brand deliberately suppresses price increases to protect its aspirational positioning in a culture where being seen at Starbucks carries social meaning. The Korean dairy system is uniquely inflated: raw milk prices are set through government-negotiated negotiations between Lotte and Maeil, and Korean fresh milk costs 2–3× the international market price due to import tariffs protecting domestic dairy farmers. The 2022–2023 raw milk price hike was the largest in a decade and finally forced Starbucks to raise prices — but still only modestly. Relative to general inflation, a Starbucks latte has actually gotten cheaper in real terms over 24 years.'
  },
  {
    id: 'draft_beer',
    category: 'food',
    item: 'Draft Beer (생맥주)',
    context: 'One 500ml glass, standard restaurant/hof',
    pastYear: 1990,
    trend: [1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Draft beer rose from ₩1,000 in 1990 to ₩6,000 today: 6×. The actual beer — malt, hops, water, yeast — is a small fraction of the price; what you pay for is the venue. The Korean hof (호프) culture peaked in the 1990s when German-style beer pubs became ubiquitous in university districts. Hite and OB (Cass) dominated distribution through exclusive supplier agreements that kept restaurant prices artificially uniform. Craft beer legalization reforms in 2014 allowed microbreweries, diversifying the market but also introducing premium pricing. Post-COVID, commercial rents in Hongdae and Itaewon recovered faster than revenues, squeezing hof operators who raised beer prices to compensate. The classic chimaek (치맥) combo that cost ₩15,000 for two in 2010 now runs ₩35,000–₩45,000."
  },
  {
    id: 'makgeolli',
    category: 'food',
    item: 'Makgeolli (막걸리)',
    context: 'One bottle, standard restaurant',
    pastYear: 1990,
    trend: [500, 800, 1200, 1500, 2000, 2500, 3000, 4000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Restaurant makgeolli rose from ₩500 in 1990 to ₩4,000 today: 8×. Korea's traditional rice wine was a laborer's staple through the 1970s; the Park Chung-hee government actually banned imported spirits and championed makgeolli to support domestic rice consumption and alcohol culture. The 1980s lifted restrictions and soju overtook it in popularity. Then a remarkable reversal: makgeolli experienced a cultural renaissance in the 2010s — young Koreans rediscovered it as artisan, traditional, and locally sourced. Craft makgeolli makers in Gyeonggi-do and Seoul launched premium varieties at ₩8,000–₩15,000, pulling restaurant pricing upward. The K-beauty and K-wellness wave positioned traditional Korean fermentation as premium. A drink once associated with construction workers became a trendy accompaniment to pajeon in design cafés."
  },
  {
    id: 'rice_20kg',
    category: 'food',
    item: 'Rice (쌀) — 20kg Bag',
    context: 'Standard white rice, major supermarket',
    pastYear: 1990,
    trend: [20000, 28000, 35000, 40000, 50000, 45000, 50000, 58000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "A 20kg bag of rice rose from ₩20,000 in 1990 to ₩58,000 today: 2.9×. Rice is the most politically managed food price in Korea. The government operates a 쌀 직불제 (rice direct payment system) that compensates farmers when market prices fall below a guaranteed floor, while strategic reserves allow intervention when prices spike. These mechanisms have kept rice inflation far below general food CPI. Yet the social context has shifted dramatically: Korean per-capita rice consumption fell from 130kg/year in 1985 to under 56kg in 2023 — less than half — as bread, noodles, and Westernized diets displaced the bowl of rice. The political power of the Korean rice farming lobby (organized through the National Agricultural Cooperative Federation, 농협) means price supports will likely remain regardless of consumption trends."
  },
  {
    id: 'milk',
    category: 'food',
    item: 'Milk (우유) — 1L',
    context: 'Standard whole milk, major supermarket',
    pastYear: 1990,
    trend: [500, 700, 900, 1100, 1400, 1800, 2000, 2500],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Milk rose from ₩500/L in 1990 to ₩2,500 today: 5×. Korean dairy farming is heavily protected by an import quota system and a government-mediated raw milk price-setting mechanism — negotiations between dairy farmers and large processors (Maeil, Lotte) set the farmgate price annually, shielded from world market competition. As a result, Korean milk costs 2–3× the international market price, but domestic farms remain viable. In 2023, the Korea Dairy Committee approved the largest raw milk price increase in 10 years (+8.8%), citing rising feed costs and energy costs. That increase flowed directly to supermarket shelves within weeks. Korea\'s import quota on fluid milk protects a farming industry that would struggle to survive against cheaper Australian or US alternatives — a trade-off between food security and consumer prices.'
  },
  {
    id: 'eggs_30',
    category: 'food',
    item: 'Eggs (계란) — 30-Pack',
    context: 'Standard tray, major supermarket',
    pastYear: 1990,
    trend: [1500, 2000, 2500, 3000, 4000, 5000, 6000, 8000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'A 30-pack of eggs rose from ₩1,500 in 1990 to ₩8,000 today: 5.3×. But the chart conceals violent spikes: the 2003 avian influenza outbreak was Korea\'s first; the 2014 and 2016–2017 outbreaks were catastrophic, with the 2016–2017 wave culling 33 million birds and sending egg prices above ₩10,000 per 30-pack. The government\'s emergency response in 2017 — temporarily suspending import tariffs to allow US and Spanish eggs into Korea for the first time — was unprecedented and generated intense political controversy. Egg prices are a leading indicator of "food anger" in Korean politics: when eggs get expensive, approval ratings for agricultural policy drop measurably. The poultry industry restructured after each outbreak, but the underlying vulnerability to airborne disease remains.'
  },
  {
    id: 'snack_shrimp',
    category: 'food',
    item: 'Saewoo Kang (새우깡)',
    context: 'Standard 90g bag, convenience store',
    pastYear: 1990,
    trend: [200, 300, 500, 600, 700, 800, 1000, 1500],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Saewoo Kang launched in 1971 and has been Korea's best-selling snack for over 50 years — the first product ever to sell 100 million bags in a single year in Korea. From ₩200 in 1990 to ₩1,500 today: 7.5×. Nongshim held the price at ₩800 for an extended period by quietly engaging in 'shrinkflation' — reducing bag weight from 100g to 90g while keeping the price constant. When ingredient and energy costs spiked simultaneously in 2022, Nongshim implemented its largest price hike in 20 years (15–20% across most products), finally breaking the ₩800 Saewoo Kang floor. The bag shrinkage had already happened years before. Shrinkflation is particularly common in Korean snacks: you are paying more per gram even when the nominal price appears stable — a hidden inflation that official CPI statistics often undercount."
  },
  {
    id: 'instant_coffee',
    category: 'food',
    item: 'Maxim Coffee Mix (맥심) — 50-Pack',
    context: 'Dongseo Foods, standard box',
    pastYear: 1990,
    trend: [3000, 4000, 5000, 7000, 9000, 12000, 14000, 18000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Maxim coffee mix rose from ₩3,000 for 50 sachets in 1990 to ₩18,000 today: 6×. Launched by Dongseo Foods in 1976 in partnership with General Foods, Maxim became Korea's default beverage across every social context — office meetings, condolence visits (상가), military service, countryside grandmothers' kitchens. Its ~70% market share gives Dongseo enormous pricing power. The product is simultaneously simple (instant coffee, creamer, sugar in one sachet) and culturally irreplaceable. When specialty coffee culture exploded in the 2010s, Maxim faced its first real cultural competition — not from price, but from identity. Younger urban Koreans shifted to specialty coffee; Maxim held the 40+ demographic. Dongseo responded by launching premium lines (Master Instant) at ₩500+/sachet while maintaining volume on the base product."
  },
  {
    id: 'bubble_tea',
    category: 'food',
    item: 'Bubble Tea (버블티)',
    context: 'Gong Cha or similar chain, standard size',
    pastYear: 2012,
    trend: [3500, 4000, 4500, 5000, 5500, 6000],
    trendYears: [2012, 2015, 2017, 2019, 2022, 2024],
    fallbackInsight: 'Bubble tea entered Korean mainstream around 2012 at ₩3,500 via Gong Cha and Tiger Sugar, and has risen to ₩6,000 today: 1.7× in 12 years. Relatively modest compared to other food prices. The category was imported from Taiwan and initially positioned as a premium imported experience. Korean chains scaled rapidly and drove down production costs through standardized syrups and domestically sourced tapioca. Chains also introduced premium add-ons — brown sugar boba, salted cheese foam, matcha dust — that pushed average ticket above the menu base price. Korea then exported the format back to Taiwan, the US, and Southeast Asia through franchises. The bubble tea market is one of the few Korean food categories where export revenue is as important as domestic pricing.'
  },
  {
    id: 'donut',
    category: 'food',
    item: 'Glazed Donut (도넛)',
    context: "Dunkin' Korea, standard glazed donut",
    pastYear: 1994,
    trend: [500, 700, 900, 1100, 1300, 1500, 1800, 2500],
    trendYears: [1994, 1998, 2002, 2006, 2010, 2014, 2019, 2024],
    fallbackInsight: "Dunkin' entered Korea in 1994 and the glazed donut rose from ₩500 to ₩2,500 today: 5×. Dunkin' is now one of the largest fast food chains in Korea by store count — the Korean franchise (operated by SPC Group, the same company behind Paris Baguette) aggressively expanded to over 1,300 locations. For years the donut price stayed under ₩1,000, making it accessible to school-age consumers on pocket money. The 2022 commodity shock hit three key ingredients simultaneously: wheat (Ukraine war), palm oil (Indonesia export ban), and refined sugar (global crop shortfalls). SPC Group raised prices across its entire portfolio in 2022, including Paris Baguette and Dunkin'. A box of 12 donuts now costs ₩30,000, equivalent to a full restaurant set meal in 2005."
  },
  {
    id: 'lotteria_burger',
    category: 'food',
    item: 'Lotteria Bulgogi Burger (불고기버거)',
    context: 'Lotteria Korea, standard menu price',
    pastYear: 1990,
    trend: [800, 1200, 1700, 2100, 2500, 3000, 3500, 4500],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Lotteria's Bulgogi Burger rose from ₩800 in 1990 to ₩4,500 today: 5.6×. Lotteria opened in 1979 — the same year Park Chung-hee was assassinated — making it a witness to 45 years of Korean economic transformation. Owned by Lotte Group (one of Korea's largest chaebols), it was positioned as an affordable, Koreanized fast food alternative to McDonald's, which arrived in 1988. For decades it undercut McDonald's on price, a strategy that drove market share among cost-conscious consumers. By 2020, the price gap had nearly closed. Lotteria has been losing market share to Burger King, Five Guys, and domestic brands (Mom's Touch) while also facing labor and rent cost pressures common to all franchises. The bulgogi burger survives mainly on nostalgia for consumers who grew up ordering it in the 1990s."
  },
  {
    id: 'galbitang',
    category: 'food',
    item: 'Galbitang (갈비탕)',
    context: 'One bowl, standard restaurant',
    pastYear: 1990,
    trend: [4000, 6000, 8000, 10000, 13000, 15000, 18000, 22000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Galbitang rose from ₩4,000 in 1990 to ₩22,000 today: 5.5×. Short ribs are a premium cut with limited yield per animal, and the slow-cooked broth requires both the bones and the meat — making galbitang one of the most ingredient-intensive Korean soups. The 한우 (Hanwoo) premium is central to the price: Korean domestic beef commands 3–5× the price of Australian or US imported beef due to import tariffs (currently ~40%) protecting Hanwoo farmers. As Korean middle-class incomes rose in the 1990s and 2000s, 'only domestic beef' became a marker of quality consciousness that restaurants responded to. The FTA with the US and Australia (2012, 2014) gradually lowered beef tariffs, but Hanwoo's premium positioning held. Galbitang remains a celebration soup — ordered for ancestral memorial services (제사) and special lunches — a context where price sensitivity is deliberately suspended."
  },
  {
    id: 'convenience_coffee',
    category: 'food',
    item: 'Convenience Store Coffee (편의점 아메리카노)',
    context: 'Fresh-brewed Americano, GS25/CU machine',
    pastYear: 2011,
    trend: [1000, 1000, 1000, 1200, 1500, 1800],
    trendYears: [2011, 2013, 2015, 2018, 2021, 2024],
    fallbackInsight: "Convenience store fresh-brewed coffee launched around 2011 at ₩1,000 — one of the most disruptive consumer product launches in Korea in a decade. GS25\'s Café25 and CU\'s Heybrew threatened established cafés by offering espresso-based coffee at 30% of the Starbucks price. It held ₩1,000 for nearly a decade through fierce chain competition — all three majors (CU, GS25, 7-Eleven) subsidized coffee to drive foot traffic. The ₩1,000 cup generated enormous debate: Korean independent cafés complained of unfair competition; convenience chains argued they were democratizing coffee. By 2024 it has risen to ₩1,800 as coffee bean costs surged in 2021–2022 due to Brazilian drought (Brazil produces ~40% of global coffee) and minimum wage pressures. Still the cheapest fresh coffee in Korea, but the original ₩1,000 promise has ended."
  },
  {
    id: 'kimchi_1kg',
    category: 'food',
    item: 'Cabbage Kimchi (포기김치) — 1kg',
    context: 'Store-bought, major supermarket brand',
    pastYear: 1995,
    trend: [2000, 3000, 4000, 5000, 7000, 8000, 10000, 12000],
    trendYears: [1995, 2000, 2004, 2008, 2012, 2016, 2020, 2024],
    fallbackInsight: "Store-bought kimchi rose from ₩2,000/kg in 1995 to ₩12,000 today: 6×. Napa cabbage (배추) is the most politically volatile food price in Korea. The 2010 kimchi crisis is the defining example: an unusually hot, wet summer devastated the harvest, sending cabbage prices from ₩800 to over ₩4,000 per head (500%+) in two months. The government emergency-imported Chinese cabbage — a measure considered almost culturally humiliating — and distributed subsidized cabbage through the military. As kimjang (winter kimchi-making, 김장) culture has declined — fewer households make their own — store-bought kimchi has grown from a convenience option to the primary source for most urban families, making commercial kimchi pricing a political matter. Major brands (Daesang, CJ) face government scrutiny whenever kimchi prices rise sharply."
  },
  {
    id: 'japchae',
    category: 'food',
    item: 'Japchae (잡채)',
    context: 'One serving, standard restaurant',
    pastYear: 1990,
    trend: [2000, 3000, 4000, 5000, 7000, 9000, 12000, 15000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Japchae rose from ₩2,000 in 1990 to ₩15,000 today: 7.5×. Glass noodles (당면) are made from sweet potato starch — a niche commodity dominated by Chinese imports — and sesame oil, which has surged as domestic sesame cultivation declined. The dish requires multiple separately prepared vegetables (spinach, carrots, mushrooms, bell pepper), each of which tracks independent agricultural prices. As a staple of Korean celebration food — memorial services (제사), birthdays (생일), Lunar New Year (설), Chuseok (추석) — demand is culturally constant regardless of price, giving restaurants unusual pricing power on this particular dish. Korean sesame oil prices doubled between 2020 and 2023 due to poor harvests in sesame-producing regions, directly lifting japchae costs. Premium versions with extra sirloin now exceed ₩20,000.'
  },
  {
    id: 'convenience_beer',
    category: 'food',
    item: 'Canned Beer (맥주) — 500ml',
    context: 'Convenience store, domestic brand (Hite/Cass)',
    pastYear: 2000,
    trend: [1000, 1200, 1500, 1700, 2000, 2500, 3000],
    trendYears: [2000, 2004, 2008, 2012, 2016, 2020, 2024],
    fallbackInsight: 'A 500ml can of domestic beer rose from ₩1,000 in 2000 to ₩3,000 today: 3×. The Korean beer market was a Hite-OB duopoly for decades, with prices kept low through supplier agreements and fear of market share loss to the other. The 2014 liquor tax reform and subsequent craft beer legalization brought in hundreds of new microbreweries and international imports, pressuring domestic brands to hold prices even tighter. Post-COVID barley and aluminum surges finally forced price increases in 2021–2022. The iconic "4캔 만원" (four cans for ₩10,000) convenience store promotion — a cultural fixture since the mid-2010s — is being phased out or replaced with smaller volumes at the same price point. At ₩3,000/can, domestic canned beer inflation is among the lowest in Korean food and beverage, a testament to how intensely competitive the category remains.'
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
    fallbackInsight: "Express bus Seoul–Busan rose from ₩5,000 in 1990 to ₩32,000 today: 6.4×. The Gyeongbu Expressway (경부고속도로, 1970) defined Korean intercity travel for 34 years before KTX arrived in 2004 and fundamentally changed the competitive landscape. Pre-KTX, the express bus was Korea's primary intercity connection: over 30 million passengers annually used the Seoul–Busan route. Post-KTX, bus ridership collapsed by 40–50%, forcing Kobus (the express bus consortium) to cut frequencies and raise prices to maintain viability. Fuel costs (tracking global oil markets), driver wage increases (40-hour week regulations expanded liability), and terminal renovation fees at Seoul Express Bus Terminal and Busan Terminal all contributed. The premium 우등 class that started ₩1,000 above standard in 1990 now commands a ₩15,000 gap."
  },
  {
    id: 'airport_bus',
    category: 'transport',
    item: 'Airport Limousine Bus',
    context: 'Seoul Station to Incheon Airport',
    pastYear: 2001,
    trend: [7000, 9000, 10000, 12000, 14000, 15000, 17000],
    trendYears: [2001, 2005, 2008, 2011, 2015, 2019, 2024],
    fallbackInsight: 'Incheon Airport limousine bus rose from ₩7,000 in 2001 to ₩17,000 today: 2.4×. Incheon Airport opened in March 2001 as Korea\'s largest infrastructure project since the 1988 Seoul Olympics — replacing the aging Gimpo Airport with a world-class hub. The airport limousine bus was its primary public transport link for the first nine years. AREX (Airport Railroad Express) opened in 2010, creating direct competition for the first time and constraining limousine bus price increases. Today the AREX all-stop train costs ₩4,500 to the airport; the direct express ₩16,500; the limousine bus ₩17,000. The bus survives by offering door-to-door service to hotel districts — AREX delivers you to Seoul Station, requiring an additional connection. Both remain far cheaper than the ₩80,000–₩100,000 taxi alternative.'
  },
  {
    id: 'mugungwha',
    category: 'transport',
    item: 'Mugunghwa Train Seoul–Busan',
    context: 'Standard seat, one way (무궁화호)',
    pastYear: 1990,
    trend: [6600, 10000, 14000, 19500, 24000, 28200, 28200, 30000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "The Mugunghwa train rose from ₩6,600 in 1990 to ₩30,000 today: 4.5×. Named after Korea's national flower (the Rose of Sharon), the Mugunghwa was the workhorse of Korean intercity rail from its 1984 introduction until KTX arrived in 2004. It served an important social function: connecting small cities and rural areas that KTX bypasses, and providing affordable intercity travel for elderly and low-income passengers who cannot afford KTX fares. KORAIL cross-subsidizes Mugunghwa routes with KTX revenues — a deliberate policy to maintain affordable regional connectivity. By 2023, KORAIL began announcing route cuts as ridership fell below sustainable levels. Rolling stock is aging (some carriages are 40+ years old), and investment in Mugunghwa upgrades has been minimal compared to KTX. The service is in genuine decline — a victim of the speed economy it helped create."
  },
  {
    id: 'courier',
    category: 'transport',
    item: 'Courier Delivery (택배)',
    context: 'Small box, CJ Logistics door-to-door',
    pastYear: 2000,
    trend: [2000, 2500, 3000, 3500, 4000, 5000, 6000, 7000],
    trendYears: [2000, 2004, 2008, 2012, 2015, 2018, 2021, 2024],
    fallbackInsight: 'Courier delivery rose from ₩2,000 in 2000 to ₩7,000 today: 3.5×. Korea built one of the world\'s most efficient last-mile networks — CJ Logistics, Hanjin, Lotte Logistics — with next-day delivery as the standard and same-day as an emerging norm. For years, fierce competition between carriers kept prices remarkably low relative to volume. Then two events converged in 2020–2021: COVID-19 exploded e-commerce volumes (Korean online retail grew 25% in 2020 alone), and a series of delivery worker deaths from overwork (과로사) became a national crisis. In January 2021, five delivery workers died within a week, triggering emergency government negotiations. The resulting agreement limited parcel sorting shifts and mandated rest periods — reducing driver capacity and raising per-package cost. The era of ₩2,500 door-to-door delivery ended with these deaths.'
  },
  {
    id: 'car_wash',
    category: 'transport',
    item: 'Automatic Car Wash (자동 세차)',
    context: 'Standard tunnel wash, gas station',
    pastYear: 1995,
    trend: [2000, 3000, 4000, 5000, 6000, 7000, 8000, 10000],
    trendYears: [1995, 2000, 2005, 2008, 2012, 2016, 2020, 2024],
    fallbackInsight: 'Automatic car wash rose from ₩2,000 in 1995 to ₩10,000 today: 5×. Korean car ownership grew from about 250 cars per 1,000 people in 1995 to over 500 in 2024 — the market doubled. Car washes require large urban footprints (tunnel systems need 30–50m of space), and as Seoul and other city land values increased, the real estate cost of operating a ground-level car wash grew substantially. Water costs also increased as environmental regulations tightened water recycling requirements. Korean car culture also intensified: the average Korean car is now washed more frequently than in 1995, with exterior protection products (ceramic coating, PPF films) driving premium wash demand. The basic tunnel wash market is increasingly squeezed between rising costs and competition from elaborate detail shops charging ₩30,000–₩100,000.'
  },
  {
    id: 'car_insurance',
    category: 'transport',
    item: 'Car Insurance (자동차 보험)',
    context: 'Annual premium, mid-size sedan, 30-year-old driver',
    pastYear: 1995,
    trend: [300000, 450000, 600000, 700000, 750000, 800000, 850000, 900000],
    trendYears: [1995, 2000, 2005, 2008, 2012, 2016, 2020, 2024],
    fallbackInsight: "Car insurance premiums rose from ₩300,000/year in 1995 to ₩900,000 today: 3×. Two structural cost drivers dominate. First, vehicle complexity: a bumper sensor system that didn't exist in 2000 now costs ₩400,000–₩800,000 to replace after a low-speed collision — insurers price this technology risk into every policy. Korean car manufacturers (Hyundai, Kia) significantly increased ADAS (Advanced Driver Assistance System) content from 2018 onward, raising repair costs industry-wide. Second, medical inflation: personal injury payouts from traffic accidents rose as Korean hospital costs and rehabilitation standards improved. The 1998 mandatory auto insurance reform expanded minimum coverage requirements, raising baseline premiums. The industry is also notably concentrated (Samsung Fire & Marine, Hyundai Marine & Fire hold dominant share), limiting competitive pressure on pricing."
  },
  {
    id: 'parking',
    category: 'transport',
    item: 'Seoul City Parking (서울 주차)',
    context: '1 hour, public parking lot, central Seoul',
    pastYear: 1995,
    trend: [300, 500, 800, 1000, 1500, 2000, 2500, 3000],
    trendYears: [1995, 2000, 2004, 2008, 2012, 2016, 2020, 2024],
    fallbackInsight: 'Central Seoul parking rose from ₩300/hour in 1995 to ₩3,000 today: 10× — the same multiple as jjajangmyeon, and one of the highest in this game. Seoul land values in districts like Jung-gu and Gangnam-gu increased 5–10× over 30 years; maintaining a surface parking lot means forgoing enormous revenue from commercial development. The Seoul Metropolitan Government has deliberately used parking fee policy as a demand management tool: several rounds of increases in the 2010s were explicitly justified as part of the city\'s traffic reduction strategy (Seoul follows a "car diet" policy to reduce downtown congestion). Private commercial parking in Gangnam now reaches ₩5,000–₩8,000/hour. Compared to jjajangmyeon, parking has been the more reliably inflation-tracking price — because it directly reflects land costs rather than food commodity markets.'
  },
  {
    id: 'bicycle',
    category: 'transport',
    item: 'Standard Bicycle (자전거)',
    context: 'City commuter/utility bicycle, mid-range',
    pastYear: 1990,
    trend: [50000, 70000, 90000, 110000, 130000, 150000, 170000, 200000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'A standard commuter bicycle rose from ₩50,000 in 1990 to ₩200,000 today: 4×. Korean cycling transformed across 30 years: through the 1990s, bicycles were purely utilitarian (market vendors, delivery workers); the 2009 Four Major Rivers Restoration Project (4대강 사업) under President Lee Myung-bak created thousands of kilometers of bicycle paths nationwide, sparking a recreational cycling boom. Dedicated cycling infrastructure triggered massive leisure demand. The COVID-19 pandemic then created the most acute global bicycle shortage since World War II: supply chains for components (Shimano, Taiwanese frames, Taiwanese aluminum) broke down, delivery times stretched to 12–18 months, and prices jumped 30–50% in 2020–2021. Entry-level bicycles now cost what mid-range models cost a decade ago, and quality mid-range bicycles have crossed ₩500,000.'
  },
  {
    id: 'moving',
    category: 'transport',
    item: 'Moving Service (포장이사)',
    context: 'Small apartment within Seoul, professional packing',
    pastYear: 1995,
    trend: [100000, 150000, 200000, 280000, 350000, 450000, 550000, 700000],
    trendYears: [1995, 2000, 2005, 2009, 2013, 2017, 2021, 2024],
    fallbackInsight: 'Professional packing moves within Seoul rose from ₩100,000 in 1995 to ₩700,000 today: 7×. Moving is almost pure labor — packing, wrapping, carrying, unloading — with minimal capital cost. This makes it one of the cleanest trackers of wage inflation in Korea. Minimum wage increases from ₩4,110 in 2010 to ₩9,860 in 2024 (140% in 14 years) flow almost directly into moving fees. Korea\'s jeonse (전세) and monthly rental (월세) lease system creates concentrated demand: leases commonly renew at the same time (end of February for school-year transitions, end of August), creating brief periods of extreme scarcity. During peak season, moving prices can double or triple normal rates. The jeonse system\'s 2022–2023 crisis — when skyrocketing deposits forced massive tenant relocations — created extraordinary moving demand precisely when operating costs were highest.'
  },
  {
    id: 'domestic_flight',
    category: 'transport',
    item: 'Domestic Flight Seoul–Jeju',
    context: 'One way, economy class, non-peak',
    pastYear: 1995,
    trend: [50000, 60000, 70000, 80000, 90000, 100000, 80000, 110000],
    trendYears: [1995, 2000, 2005, 2008, 2012, 2016, 2020, 2024],
    fallbackInsight: 'Seoul–Jeju flights rose from ₩50,000 in 1995 to ₩110,000 today: 2.2× — one of the smallest price increases in this game, and a rare case where new competition overrode inflation. Before 2005, Korean Air and Asiana ran the Seoul–Jeju route as a duopoly; tickets often exceeded ₩100,000. The entry of Jeju Air (2005), Eastar Jet (2009), Jin Air, Air Busan, and others created an LCC revolution that drove prices down 40–50% within five years. The Seoul–Jeju route is the world\'s busiest aviation corridor by passenger count — over 15 million passengers annually. That volume enables extraordinary efficiency. However, the COVID-19 pandemic nearly destroyed Korea\'s LCC industry: multiple airlines required government bailouts in 2020–2021, and several (Eastar Jet, Flybe Korea) ceased operations. Surviving carriers raised prices in 2022–2023 to recover losses, partially reversing the LCC discount.'
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
    fallbackInsight: 'Gym memberships rose from ₩30,000/month in 1995 to ₩100,000 today: 3.3×. Gyms require large floorplates in expensive urban real estate — a 500-pyeong gym in Gangnam pays rent that most restaurants couldn\'t afford. Equipment maintenance, certified personal trainers, and 24-hour staffing add fixed costs that scale poorly. The "Pilates and gym culture" explosion of the 2010s drove premium positioning: gyms invested in aesthetics, equipment upgrades, and infrared saunas to justify higher prices. The 2020s disruption came from low-cost 24-hour chain gyms (Anytime Fitness, Fit24) charging ₩30,000–₩40,000/month — commoditizing the basic workout. Traditional full-service gyms responded by raising prices further to emphasize premium differentiation. The market split between a cheap utilitarian tier and a premium lifestyle tier.'
  },
  {
    id: 'haircut',
    category: 'culture',
    item: "Men's Haircut (남성 커트)",
    context: 'Standard barbershop or hair salon',
    pastYear: 1990,
    trend: [2000, 3000, 5000, 7000, 8000, 10000, 12000, 15000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Men's haircuts rose from ₩2,000 in 1990 to ₩15,000 today: 7.5×. A pure labor service: the price tracks wages almost directly. The ₩2,000 neighborhood barber was replaced by the ₩5,000 shop in the 1990s, then by the ₩10,000 chain salon in the 2000s. The 2010s brought two opposing disruptions: discount chain salons (홍익일달러커트, Hairshop24) created a ₩5,000–₩9,000 floor targeting students and price-sensitive men; while Apgujeong-style premium studios charged ₩30,000–₩50,000 for the same cut, based on designer reputation and location. The minimum wage increase from ₩5,580 (2016) to ₩9,860 (2024) lifted the baseline for all service labor. Korean male grooming standards also intensified: the average Korean man visiting a salon in 2024 requests more styling and finishing services than in 1990, raising the average transaction even at the same establishment."
  },
  {
    id: 'dry_cleaning',
    category: 'culture',
    item: 'Dry Cleaning — Business Suit',
    context: 'Full suit (jacket + trousers), standard laundry',
    pastYear: 1990,
    trend: [3000, 5000, 7000, 9000, 11000, 13000, 15000, 18000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Dry cleaning a suit rose from ₩3,000 in 1990 to ₩18,000 today: 6×. Dry cleaning uses perchloroethylene (PCE) — a regulated chemical solvent whose price and disposal costs rose as environmental regulations tightened in Korea through the 2000s and 2010s. Labor, energy, and commercial real estate costs all rose alongside chemical costs. Then COVID-19 delivered a structural shock: Korea\'s remote work transition (though less extensive than the US) and permanent casualization of office dress codes reduced suit usage among the primary customer demographic by an estimated 30–40%. Dry cleaners in office districts near Gangnam and Yeouido report revenue drops that haven\'t recovered. The result: higher prices per garment compensating for lower volume — the classic declining-industry equilibrium that cannot be sustained indefinitely.'
  },
  {
    id: 'popcorn',
    category: 'culture',
    item: 'Movie Theater Popcorn',
    context: 'Medium-size bucket, CGV or Lotte Cinema',
    pastYear: 2000,
    trend: [2500, 3000, 3500, 4000, 5000, 6000, 7000, 9000],
    trendYears: [2000, 2003, 2006, 2009, 2012, 2016, 2020, 2024],
    fallbackInsight: 'Movie theater popcorn rose from ₩2,500 in 2000 to ₩9,000 today: 3.6×. Cinemas operate a deliberate cross-subsidy model: undercharge on tickets to maximize attendance, then extract margin at the concession stand. This is a global practice, but Korean multiplex operators (CGV is listed on the Korean Stock Exchange; Lotte Cinema is a chaebol subsidiary) have refined it aggressively. Corn itself is a stable commodity — the raw material for a medium bucket costs under ₩300. What you pay ₩9,000 for is location, captivity, and brand experience. A CGV large popcorn and two drinks in 2024 can exceed ₩22,000 — more than the ticket itself. In 2023, CGV faced a consumer backlash campaign (#CGV_불매운동) specifically targeting concession prices, briefly making it a national news story.'
  },
  {
    id: 'everland',
    category: 'culture',
    item: 'Everland Theme Park Entry',
    context: 'Standard adult day ticket',
    pastYear: 1990,
    trend: [7000, 15000, 21000, 28000, 36000, 46000, 54000, 72000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Everland admission rose from ₩7,000 in 1990 to ₩72,000 today: over 10× — the highest inflation multiple among culture items in this game. Everland is owned by Samsung C&T (part of Samsung Group) and functions partly as a flagship brand experience for the conglomerate. Samsung invested billions in T-Express (2008, briefly the world\'s steepest wooden roller coaster), Panda World (2016, for Fu Bao\'s parents), and continual attraction upgrades. As a private monopoly destination park in the Gyeonggi region with no direct competitor, Everland has significant pricing power. Dynamic pricing has been introduced in recent years — holiday prices exceed weekday prices by 30–40%. A family of four — two adults and two children — that spent ₩30,000 total in 1990 now spends approximately ₩230,000–₩300,000 at current ticket prices, before food or merchandise.'
  },
  {
    id: 'screen_golf',
    category: 'culture',
    item: 'Screen Golf (스크린골프)',
    context: '18 holes, one person, standard facility',
    pastYear: 2005,
    trend: [15000, 20000, 25000, 30000, 35000, 40000],
    trendYears: [2005, 2009, 2012, 2016, 2020, 2024],
    fallbackInsight: 'Screen golf rose from ₩15,000 per round in 2005 to ₩40,000 today: 2.7× in under 20 years. Korea invented the commercial screen golf format — companies like Golfzon (founded 2000) built proprietary simulation systems that replicate real courses with infrared ball tracking and high-fidelity projections. Golfzon went public on the KOSDAQ in 2012 and now operates over 8,000 screen golf facilities in Korea alone, exporting to 70+ countries. The format is an authentic Korean innovation that spread globally. Simulator hardware costs ₩20–₩50 million per bay; monthly rent in commercial districts adds substantially. The COVID-19 pandemic actually accelerated screen golf demand — it was considered lower-risk than outdoor golf and indoor social dining. At ₩40,000 for 18 holes, it remains 80–90% cheaper than any actual Korean golf green fee.'
  },
  {
    id: 'bowling',
    category: 'culture',
    item: 'Bowling (볼링)',
    context: 'One game per person, standard bowling alley',
    pastYear: 1995,
    trend: [2000, 2500, 3000, 3500, 4000, 5000, 6000, 7000],
    trendYears: [1995, 2000, 2004, 2008, 2012, 2016, 2020, 2024],
    fallbackInsight: 'Bowling rose from ₩2,000/game in 1995 to ₩7,000 today: 3.5×. Korean bowling experienced its golden age in the 1990s — in 1997, Korea hosted the World Tenpin Bowling Championships and had over 1,200 bowling centers. Then the 1997 IMF crisis (외환위기) devastated discretionary spending and closed hundreds of alleys; PC cafés and screen golf then absorbed the youth leisure market in the 2000s. By 2024, fewer than 400 bowling alleys remain nationwide. Lane equipment (AMF and Brunswick pinsetters) is imported and expensive to maintain; shoe inventory requires constant replacement. The survivors raised prices sharply to compensate for reduced volume. The bowling alley, once a mainstream date destination, is now a nostalgia experience for 40+ Koreans or a school group outing.'
  },
  {
    id: 'musical',
    category: 'culture',
    item: 'Musical Theater Ticket (뮤지컬)',
    context: 'R-seat (preferred), mid-scale production',
    pastYear: 2000,
    trend: [30000, 40000, 60000, 80000, 100000, 120000, 150000],
    trendYears: [2000, 2004, 2008, 2012, 2016, 2020, 2024],
    fallbackInsight: "Korean musical theater tickets rose from ₩30,000 in 2000 to ₩150,000 today: 5×. Korea became the world's third-largest musical theater market after Broadway and the West End — remarkable for a country that had almost no musical theater tradition before the 1990s. The influx of licensed Broadway productions (Chicago, Les Misérables, Phantom of the Opera) from the early 2000s brought royalty fees payable in US dollars, exposing Korean ticket prices directly to exchange rate volatility. The 2022–2023 won depreciation (USD/KRW peaked above 1,400) inflated royalty costs by 15–20%. The distinctive Korean market dynamic: K-pop idols cast in musicals (idols regularly take acting roles in Daehangno productions) drive fan-based premium demand, creating a tier of ₩150,000–₩200,000 seats sold out within minutes to fandoms willing to pay for proximity to their artists."
  },
  {
    id: 'idol_concert',
    category: 'culture',
    item: 'K-pop Concert Ticket',
    context: 'Standard seat, domestic arena concert',
    pastYear: 2000,
    trend: [30000, 50000, 70000, 90000, 110000, 132000, 165000],
    trendYears: [2000, 2004, 2008, 2012, 2016, 2020, 2024],
    fallbackInsight: 'K-pop concert tickets rose from ₩30,000 in 2000 to ₩165,000 today: 5.5×. The 2000 concert was a domestic affair — H.O.T or g.o.d filling indoor venues. By 2024, BTS filled Seoul\'s Olympic Stadium (70,000 seats) for multiple consecutive nights while simultaneously streaming to millions globally. HYBE (BTS\'s agency) became Korea\'s largest entertainment company by market cap in 2021, and its public listing revealed how concerts had become loss-leader events for merchandise, fan subscriptions, and IP licensing — changing the pricing calculus entirely. Dynamic pricing was introduced by major agencies from 2022: VIP packages with soundcheck access reach ₩300,000–₩500,000. The official WEVERSE platform and fan club pre-sale tiers created price discrimination by fandom intensity. A single BTS concert in Seoul generated an estimated ₩1 trillion in local economic activity through tourism.'
  },
  {
    id: 'netflix',
    category: 'culture',
    item: 'Netflix Subscription',
    context: 'Standard plan, Korea pricing',
    pastYear: 2016,
    trend: [9900, 10900, 12000, 13500, 17000],
    trendYears: [2016, 2018, 2020, 2022, 2024],
    fallbackInsight: "Netflix in Korea rose from ₩9,900/month in 2016 to ₩17,000 today: 1.7× in 8 years. The business logic is extraordinary: Netflix entered Korea in January 2016 offering low prices to capture subscribers, then invested billions in Korean original content — Squid Game (2021, the most-watched series in Netflix history, 111M households in its first month), Hellbound, The Glory, All of Us Are Dead — that drove global subscription growth worth far more than Korean subscriber revenue. Korean consumers' cultural output is simultaneously subsidizing and justifying the platform's price increases globally. The 2023 password-sharing crackdown added millions of new paying Korean subscribers. The standard plan was removed in 2024, leaving only an ad-supported tier at ₩5,500 and the standard plan at ₩17,000. Koreans now pay to watch their own stories — a uniquely 21st-century form of cultural value extraction."
  },
  {
    id: 'youtube_premium',
    category: 'culture',
    item: 'YouTube Premium (월정액)',
    context: 'Individual subscription, Korean pricing',
    pastYear: 2018,
    trend: [7900, 8690, 10450, 14900],
    trendYears: [2018, 2020, 2022, 2024],
    fallbackInsight: 'YouTube Premium in Korea rose from ₩7,900 in 2018 to ₩14,900 in 2024: nearly doubling in 6 years. The defining event: in July 2023, Google raised Korean prices 70% in a single step — from ₩8,690 to ₩14,900 — the largest single-year price jump for any subscription service in this game. Korea had been priced unusually low relative to Western markets (the US price was $13.99 ≈ ₩18,500) because Google initially used low pricing to build market share in the intensely competitive Korean app market dominated by Naver and Kakao. By 2023, with deep user habituation established — millions of Koreans had built YouTube Premium into their daily routines for ad-free watching and background play — Google corrected aggressively. Cancellation rates were reported at under 15%, validating the price point. The episode illustrates how a "freemium" platform builds dependency before extracting value.'
  },
  {
    id: 'public_pool',
    category: 'culture',
    item: 'Public Swimming Pool (수영장)',
    context: 'Per session entry, municipal facility',
    pastYear: 1995,
    trend: [1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000],
    trendYears: [1995, 2000, 2004, 2008, 2012, 2016, 2020, 2024],
    fallbackInsight: 'Public pool entry rose from ₩1,000 in 1995 to ₩6,000 today: 6×. Korea\'s network of municipal sports centers (국민체육센터) was built aggressively from the 1990s as part of a national wellness infrastructure policy following the 1988 Olympics legacy. These facilities are operated by district governments and priced below cost. Heating an Olympic-size pool year-round is extremely energy-intensive; the 2022 energy price surge hit these facilities especially hard. Lifeguard certification requirements were tightened after several drowning incidents in the 2010s, raising staffing costs. Seoul\'s public pools are also under chronic overcrowding pressure in summer — a waiting list of hours during heat waves is normal. As private sports clubs charge ₩200,000+/month for pool access, the ₩6,000 public pool remains a vital equity resource for urban families who cannot afford alternatives.'
  },
  {
    id: 'billiards',
    category: 'culture',
    item: 'Billiard Hall (당구장)',
    context: 'Per hour, standard table',
    pastYear: 1995,
    trend: [1500, 2000, 2500, 3000, 3500, 4000, 5000, 6000],
    trendYears: [1995, 2000, 2004, 2008, 2012, 2016, 2020, 2024],
    fallbackInsight: 'Billiard halls rose from ₩1,500/hour in 1995 to ₩6,000 today: 4×. Billiards (specifically 3-cushion carom, which is more popular in Korea than pocket billiards) was a working-class leisure institution from the 1970s through the 1990s — every neighborhood had a 당구장 (billiard hall). Korea produced world-class players (Cho Jae-ho, Fred Chao) who made the sport aspirational. The industry entered structural decline after 2000: PC cafés, norebang, and screen golf competed for the same leisure budget, and billiards was perceived as an older demographic activity. By 2020, the number of registered billiard halls had fallen by over 60% from the 1990s peak. The survivors concentrated in older residential neighborhoods and raised prices to compensate for lower volume. World championship-quality tables (Chevillotte, Longoni) require expensive maintenance — slate is unforgiving of neglect.'
  },
  {
    id: 'waterpark',
    category: 'culture',
    item: 'Waterpark Entry (워터파크)',
    context: 'Caribbean Bay, standard adult day ticket',
    pastYear: 1996,
    trend: [10000, 15000, 22000, 28000, 38000, 48000, 55000, 65000],
    trendYears: [1996, 2000, 2005, 2008, 2012, 2016, 2020, 2024],
    fallbackInsight: "Caribbean Bay opened in 1996 as Samsung's second theme park adjacent to Everland, at ₩10,000 admission. It has risen to ₩65,000 today: 6.5×. Heating outdoor wave pools and maintaining water quality for tens of thousands of daily visitors during summer peaks is extraordinarily energy-intensive — the 2022 energy price spike forced Caribbean Bay to implement its largest annual price increase since opening. Samsung C&T continually invested in new attractions (the FlowRider surf simulator, RiverRide expansion) to justify premium positioning. Admission now uses dynamic pricing: weekday prices are 20–30% lower than weekend and holiday rates. A family of four that paid ₩40,000 total in 1996 would pay ₩260,000 today at standard weekend pricing — before food, lockers, or parking."
  },
  {
    id: 'photo_booth',
    category: 'culture',
    item: 'Photo Booth Strip (인생네컷)',
    context: '4-frame photo strip, self-service booth',
    pastYear: 2017,
    trend: [3000, 4000, 5000, 6000, 7000],
    trendYears: [2017, 2019, 2020, 2022, 2024],
    fallbackInsight: "Photo booth strips (인생네컷 format) launched around 2017 at ₩3,000 and rose to ₩7,000 by 2024: 2.3× in 7 years. The format was created by Korean startup Life4cuts (인생네컷), which recognized that Gen Z wanted physical photo mementos in an era of digital-only photography. The timing was perfect: the iPhone camera normalized casual portraiture, and the 4-frame strip became a way to make the digital physical and shareable. K-pop fan culture supercharged international spread: fans documenting moments with idols or with friends at fan events adopted the format religiously. The brand expanded to Japan, Southeast Asia, and Europe. Price increases reflected commercial rent increases in prime shopping mall and tourist district locations. Hardware is proprietary, giving the operator control over consumable pricing — similar to the printer cartridge model."
  },
  {
    id: 'escape_room',
    category: 'culture',
    item: 'Escape Room (방탈출)',
    context: 'Per person, standard room (team of 4)',
    pastYear: 2014,
    trend: [15000, 18000, 20000, 22000, 25000],
    trendYears: [2014, 2016, 2018, 2021, 2024],
    fallbackInsight: "Escape rooms rose from ₩15,000/person in 2014 to ₩25,000 today: 1.7× in 10 years. Korea is widely credited with pioneering the modern commercial escape room format — the first real-life escape game businesses emerged in Hongdae and Sinchon around 2012–2014, before the format spread to the US, Europe, and globally. Korean operators competed on experience quality: hydraulic puzzle mechanisms, actor-in-room GM scenarios, synchronized lighting and sound, theatrical set design. Each upgrade cycle justified a price increase. The COVID-19 pandemic devastated the industry in 2020–2021 (small enclosed rooms with strangers were among the highest-risk social activities); operators who survived raised prices to recover investment. Escape rooms have become more elaborate and expensive even as the market matured — a rare case of experience goods appreciating in cost as the industry professionalized."
  },
  {
    id: 'soccer',
    category: 'culture',
    item: 'K-League Soccer Ticket',
    context: 'Standard seat (일반석), K League 1 match',
    pastYear: 2000,
    trend: [3000, 5000, 7000, 9000, 10000, 12000, 14000],
    trendYears: [2000, 2005, 2009, 2012, 2016, 2019, 2024],
    fallbackInsight: "K-League soccer tickets rose from ₩3,000 in 2000 to ₩14,000 today: 4.7×. The 2002 World Cup, when Korea's national team reached the semi-finals (defeating Portugal, Poland, and Spain — a result that stunned the world), was the defining moment for Korean soccer culture. Cities that hosted matches invested in stadium upgrades that raised operating costs. The league brought in international players and improved broadcast production quality. Yet K-League has consistently struggled to convert the 2002 emotional peak into sustained domestic viewership — Korean fans often prefer watching Premier League or La Liga to attending K-League matches. The 2023–2024 KBO baseball attendance boom made the contrast especially stark: while Jamsil Baseball Stadium was sold out daily, many K-League venues operated at 30–40% capacity despite low ticket prices. Accessibility pricing remains essential to fill seats."
  },
  {
    id: 'art_exhibition',
    category: 'culture',
    item: 'Special Art Exhibition (미술 특별전)',
    context: 'Major gallery or museum, adult entry',
    pastYear: 1995,
    trend: [2000, 3000, 5000, 7000, 9000, 12000, 15000, 18000],
    trendYears: [1995, 2000, 2005, 2009, 2012, 2016, 2020, 2024],
    fallbackInsight: 'Major art exhibition tickets rose from ₩2,000 in 1995 to ₩18,000 today: 9× — one of the higher inflation rates in the culture category. The ₩2,000 tickets in 1995 were for domestic exhibitions at the National Museum; by 2024, blockbuster international touring exhibitions (Monet in Seoul, Yayoi Kusama\'s Infinity Rooms, Frida Kahlo retrospectives) command ₩25,000–₩30,000. Art insurance costs for globally significant works have risen sharply as auction records reset regularly; shipping and climate-controlled handling across continents is expensive. The post-COVID "cultural rebound" trend — which Korean cultural critics call "예술 열풍" (art boom) — brought younger Koreans to museums in unprecedented numbers, giving curators confidence to raise prices. Immersive experiences (media art installations, team Lab Korea, Digital Art Fair Asia) created a new price tier of ₩25,000–₩40,000 targeting the Instagram-driven exhibition market.'
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
    fallbackInsight: "Mid-range smartphones started around ₩300,000 in 2012 and have risen to ₩400,000 today: 1.3× — one of the slowest price increases in the tech category. Samsung launched the Galaxy A-series in 2014 specifically to combat the rise of Xiaomi, OPPO, and Huawei in Asian markets, targeting the ₩300,000–₩400,000 tier with competitive specs. Chinese manufacturers then entered Korea through Coupang and Gmarket from 2016, forcing Samsung to maintain value even at modest price increases. The 2020–2021 global chip shortage (the most severe semiconductor supply disruption in 30 years) pushed component costs up across the industry. ₩400,000 in 2024 buys dramatically better performance than any 2012 flagship — the Galaxy S3 cost ₩900,000 at launch that year. The mid-range smartphone is arguably the best value for money of any consumer product over the past decade."
  },
  {
    id: 'tablet',
    category: 'tech',
    item: 'Tablet PC (태블릿)',
    context: 'Entry-level model, Galaxy Tab or iPad (Wi-Fi)',
    pastYear: 2011,
    trend: [500000, 450000, 400000, 380000, 400000, 450000],
    trendYears: [2011, 2013, 2015, 2017, 2020, 2024],
    fallbackInsight: 'Entry-level tablets dropped from ₩500,000 in 2011 to ₩380,000 by 2017, then rose back to ₩450,000: a net 10% decline over 13 years. Apple\'s iPad launched in Korea in 2011 and defined the category price point; Samsung Galaxy Tab competed directly and forced ongoing efficiency gains that brought prices down. The education market — Korean schools rapidly adopted tablets for digital textbooks from 2015 onward — drove volume that lowered per-unit costs. The 2020–2021 COVID-19 pandemic created the largest single demand surge for tablets in history as remote schooling became universal; simultaneously, the global chip shortage restricted supply. Prices jumped 15–25% in 2021 before normalizing. Despite similar nominal prices, a ₩450,000 tablet in 2024 has a display, processor, and battery that are categorically superior to the 2011 version at ₩500,000.'
  },
  {
    id: 'smartwatch',
    category: 'tech',
    item: 'Smartwatch (스마트워치)',
    context: 'Galaxy Watch basic model, launch price',
    pastYear: 2014,
    trend: [350000, 320000, 330000, 350000, 350000],
    trendYears: [2014, 2016, 2018, 2021, 2024],
    fallbackInsight: 'Galaxy Watch prices have stayed remarkably flat at ₩330,000–₩350,000 since 2014 — one of the most unusual pricing stories in Korean consumer tech. Samsung released the first Gear smartwatch in 2013; the category was new and prices reflected development cost amortization. As production scaled and components (display, heart rate sensors, GPS chipsets) commoditized, costs fell — but Samsung held retail prices steady, capturing the savings as margin while adding features (ECG monitoring, blood pressure measurement, body composition). The Apple Watch set a pricing anchor of ₩500,000–₩600,000 for the premium tier; Samsung positioned just below it to capture premium-seeking consumers who resisted paying the Apple premium. The watch functions as an ecosystem anchor — a device that ties Galaxy phone users to the Samsung wearable ecosystem through exclusive features.'
  },
  {
    id: 'game_console',
    category: 'tech',
    item: 'Nintendo Handheld Console',
    context: 'Launch price of each new generation',
    pastYear: 1990,
    trend: [50000, 99000, 149000, 250000, 220000, 360000],
    trendYears: [1990, 2001, 2004, 2011, 2019, 2022],
    fallbackInsight: "Nintendo handhelds rose from the Game Boy at ₩50,000 in 1990 to the Switch OLED at ₩360,000 in 2022: 7.2×. But each generation leap justifies comparison to a different product, not the same one. The Game Boy was a dedicated monochrome handheld; the DS (2004) introduced dual screens and touchscreen; the 3DS (2011) added 3D display; the Switch (2017) bridged handheld and home console entirely. Nintendo entered Korea officially in 2006 (having been largely absent for 20 years) and built the 닌텐도 DS wave through Brain Training and Pokémon. The Pokémon GO moment of 2016 — which crashed Korean location-based networks and caused thousands of people to travel to Sokcho (one of the few locations with Google Maps access) — demonstrated the franchise's cultural power. The COVID-19 pandemic made Animal Crossing: New Horizons (2020) a global mental health tool; Switch units sold out worldwide for 18 months."
  },
  {
    id: 'printer',
    category: 'tech',
    item: 'Home Inkjet Printer (프린터)',
    context: 'Standard home model, HP or Samsung',
    pastYear: 1995,
    trend: [200000, 150000, 100000, 80000, 70000, 80000, 90000],
    trendYears: [1995, 2000, 2005, 2009, 2013, 2018, 2024],
    fallbackInsight: 'Home printers dropped from ₩200,000 in 1995 to ₩70,000 at their cheapest (2013), then rose to ₩90,000 — a net 55% decline over 29 years. The falling hardware price was a deliberate trap pioneered by HP and Epson: the razor-and-blade model. Printers are sold near or below cost; ink cartridges with 5–8ml of ink are sold for ₩30,000–₩50,000 apiece. Korea\'s Fair Trade Commission investigated ink cartridge pricing in 2017 and found manufacturer margins exceeding 1,000% on cartridge ink relative to raw production cost. Korean consumers responded by massively adopting third-party compatible cartridges and refill services, prompting manufacturers to introduce firmware updates that block non-OEM cartridges. Print volumes have dropped 50%+ since 2015 as government services and documents moved digital. The printer is one of Korea\'s most contested consumer products from a competition policy perspective.'
  },
  {
    id: 'air_purifier',
    category: 'tech',
    item: 'Air Purifier (공기청정기)',
    context: 'Mid-range model, ~20-pyeong coverage',
    pastYear: 2000,
    trend: [300000, 250000, 200000, 200000, 250000, 300000, 350000],
    trendYears: [2000, 2004, 2008, 2012, 2016, 2020, 2024],
    fallbackInsight: "Air purifiers stayed broadly flat at ₩250,000–₩350,000 since 2000, with prices dipping in the 2010s before recovering. The market transformation happened in 2014–2016 when Korea experienced its worst recorded fine particulate matter (미세먼지, PM2.5) seasons — dense yellow dust from Chinese and Mongolian deserts, combined with domestic industrial emissions, created days where outdoor air quality was classified 'very bad' for weeks at a time. Air purifiers shifted from a luxury niche to a household necessity overnight. Samsung, LG, and Coway (the subscription rental pioneer) scaled production dramatically. The hidden cost: HEPA and activated carbon filter replacements run ₩50,000–₩100,000/year — often exceeding the amortized hardware cost. Coway's 코웨이 rental model (₩20,000–₩30,000/month including filter replacement) capitalized on this to become the market leader, transforming a product purchase into an ongoing service subscription."
  },
  {
    id: 'robot_vacuum',
    category: 'tech',
    item: 'Robot Vacuum (로봇청소기)',
    context: 'Entry-level model, standard brand',
    pastYear: 2010,
    trend: [500000, 400000, 300000, 250000, 250000, 300000],
    trendYears: [2010, 2013, 2016, 2018, 2020, 2024],
    fallbackInsight: 'Robot vacuums dropped from ₩500,000 in 2010 to ₩250,000 by 2018 — then prices stabilized. iRobot\'s Roomba introduced the category to Korea around 2008; Samsung and LG followed with domestic models. Then Roborock and Xiaomi entered from China at ₩200,000–₩300,000 with superior mapping and cleaning performance, forcing Samsung\'s PowerBot and LG\'s HomBot to compete aggressively on price. Korean apartment culture — small floorplans, frequent cleaning culture, dual-income households — made robot vacuums an ideal fit. By 2020, penetration exceeded 30% of Korean households. Higher-end models with auto-emptying dust bases, mop functions, and AI obstacle recognition (LG\'s ThinQ, Roborock S8) entered the ₩700,000–₩1,500,000 tier. The ₩250,000 entry-level robot vacuum is now a commodity while the premium tier captures aspirational buyers — a bifurcated market structure common to maturing Korean consumer electronics.'
  },
  {
    id: 'smartphone_plan',
    category: 'tech',
    item: 'Mobile Data Plan (스마트폰 요금제)',
    context: 'Mid-range monthly plan, major carrier (SKT/KT/LGU+)',
    pastYear: 2000,
    trend: [40000, 45000, 55000, 60000, 55000, 55000, 55000],
    trendYears: [2000, 2004, 2010, 2012, 2015, 2020, 2024],
    fallbackInsight: 'Mobile plans rose from ₩40,000 in 2000 to a mid-range of ₩55,000/month today: 1.4× — among the smallest increases in this game, and the product changed entirely. ₩40,000 in 2000 bought a few hundred minutes of voice calls on 2G; ₩55,000 today buys unlimited 5G data, calls, and texts. The Korean Communications Commission has consistently regulated the Big Three carriers (SKT, KT, LGU+) through required low-cost MVNO (가상이동통신망사업자) plans, mandated rate reduction for low-income households, and competitive licensing. The 2014 Device Distribution Improvement Act capped handset subsidies, forcing carriers to compete on plan pricing rather than subsidized hardware deals. Korea\'s 5G rollout (the world\'s first commercial 5G network, launched April 3, 2019) required massive infrastructure investment but did not translate to equivalent price increases — the regulator held the line on consumer plan costs.'
  },
  {
    id: 'electric_fan',
    category: 'tech',
    item: 'Electric Fan (선풍기)',
    context: 'Standard floor fan, major brand',
    pastYear: 1990,
    trend: [20000, 25000, 30000, 35000, 40000, 45000, 50000, 55000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Electric fans rose from ₩20,000 in 1990 to ₩55,000 today: 2.75× — one of the slower inflation rates for any physical product in this game. Manufacturing shifted to China in the 1990s and has remained there, keeping production costs suppressed. Korean summers have measurably intensified due to climate change: Seoul\'s average summer temperature rose approximately 1.5°C between 1990 and 2024, and heatwave days (above 33°C) tripled over the same period. In 2018, Korea experienced its hottest summer since records began (August peak: 41°C in Hongcheon), triggering emergency government-subsidized fan distribution for low-income households. Higher temperatures increased fan demand and allowed domestic brands (Wintech, Shinil) to charge modest premiums for quieter DC motor and energy-efficient designs. Climate change is a hidden inflation driver for cooling products.'
  },
  {
    id: 'refrigerator',
    category: 'tech',
    item: 'Refrigerator (냉장고)',
    context: 'Mid-range 300L model, major brand',
    pastYear: 1990,
    trend: [400000, 500000, 600000, 700000, 800000, 900000, 1000000, 1200000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'A mid-range refrigerator rose from ₩400,000 in 1990 to ₩1,200,000 today: 3×. Moderate growth for a major appliance over 34 years — but the product definition shifted dramatically. In 1990, a 200L single-door refrigerator was standard; by 2024, a 300L+ French-door or side-by-side configuration with a separate kimchi compartment is typical. Korean refrigerators have a uniquely domestic feature: the dedicated kimchi refrigerator (김치냉장고), pioneered by Winia Mando\'s Dimchae (딤채) in 1995. Maintaining optimal temperature and humidity for kimchi fermentation (around 0°C) requires a separate compressor system. Over 80% of Korean households now own both a regular refrigerator and a kimchi refrigerator — meaning the total refrigeration cost per household is closer to ₩2,000,000–₩2,500,000. Premium Samsung Bespoke and LG InstaView models now exceed ₩5,000,000.'
  },
  {
    id: 'washing_machine',
    category: 'tech',
    item: 'Washing Machine (세탁기)',
    context: 'Drum-type, 7–8kg, mid-range brand',
    pastYear: 1995,
    trend: [400000, 500000, 600000, 700000, 800000, 900000, 1000000],
    trendYears: [1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Drum washing machines rose from ₩400,000 in 1995 to ₩1,000,000 today: 2.5×. The shift from traditional pulsator (통돌이) top-loading to drum-type was driven by Korean manufacturers\' strategic move upmarket in the mid-2000s — drum machines cost more but cleaned more gently and used less water, aligning with growing environmental consciousness. LG\'s DD (Direct Drive) motor technology, introduced in 1998, eliminated the belt and reduced vibration; Samsung\'s EcoBubble (2010) and AI-powered cycle selection (2018) further differentiated the product. Korea has among the most demanding energy efficiency standards globally (1등급 energy label), which increased component quality requirements and prices. Chinese brands (Galanz, Midea) now offer functional drum washers at ₩300,000–₩400,000, creating strong bifurcation: basic functionality cheap, premium Korean brands expensive.'
  },
  {
    id: 'air_conditioner',
    category: 'tech',
    item: 'Wall-mounted Air Conditioner (에어컨)',
    context: 'Standard split type, ~10-pyeong room',
    pastYear: 1990,
    trend: [500000, 600000, 700000, 800000, 900000, 1000000, 1200000, 1400000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Wall-mounted air conditioners rose from ₩500,000 in 1990 to ₩1,400,000 today: 2.8×. In 1990, AC was a luxury item owned by fewer than 20% of Korean households; by 2024, penetration exceeds 90%. The shift from luxury to necessity was driven by measurably hotter summers: Seoul\'s heatwave days (above 33°C) tripled between 1990 and 2024, and the 2018 summer recorded Korea\'s highest temperatures in history. Samsung and LG dominate the Korean AC market with inverter compressor technology (which adjusts speed rather than cycling on/off, saving 30–40% energy) that added cost but became mandatory for energy certification. The government\'s energy efficiency grading system (1–5등급) effectively requires inverter technology for anything sold at the mass market. Installation — drilling exterior walls, running refrigerant lines, outdoor unit mounting — adds ₩200,000–₩300,000 per unit, doubling the real first-year cost.'
  },
  {
    id: 'microwave',
    category: 'tech',
    item: 'Microwave Oven (전자레인지)',
    context: 'Standard home model, ~20L',
    pastYear: 1990,
    trend: [100000, 120000, 100000, 80000, 70000, 70000, 80000, 90000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: 'Microwaves got cheaper: from ₩100,000 in 1990 to ₩90,000 today, with a dip to ₩70,000 in the 2010s — one of the very few items in this game that is nominally cheaper than 30 years ago. Manufacturing moved to China in the 1990s and Galanz became the world\'s largest microwave manufacturer (producing OEM units for Samsung, LG, and most global brands), achieving economies of scale that crushed component costs. Korean brands maintained domestic R&D on the premium tier — LG\'s NeoChef and Samsung\'s SmartOven introduced convection baking, steam cooking, and IoT connectivity. The mass market microwave became a true commodity; LG and Samsung largely exited the basic tier to Chinese OEM production. The interesting Korean twist: microwave oven penetration is lower than in Western countries because Korean cooking culture prefers gas hobs and rice cookers — the microwave is often used only for reheating, not cooking.'
  },
  {
    id: 'external_hdd',
    category: 'tech',
    item: 'External Hard Drive (외장하드) — 1TB',
    context: 'Standard brand, retail price',
    pastYear: 2008,
    trend: [200000, 120000, 80000, 60000, 50000, 55000],
    trendYears: [2008, 2011, 2013, 2016, 2020, 2024],
    fallbackInsight: 'A 1TB external hard drive dropped from ₩200,000 in 2008 to ₩55,000 in 2024: 72.5% cheaper in 16 years — among the sharpest price deflation in this game. Seagate and Western Digital dominate the HDD market; storage density improvements (recording more data per platter) drove cost-per-gigabyte down relentlessly. Then the October 2011 Thailand floods submerged the factories responsible for over 40% of global HDD production in Ayutthaya province — prices tripled within weeks, remained elevated for 18 months, then collapsed as manufacturing recovered and SSDs accelerated in market share. Cloud storage — Naver MYBOX (네이버 마이박스), Google Drive, iCloud — now provides 15–50GB free and terabytes for ₩10,000–₩30,000/month, competing directly with hardware storage. The physical HDD faces both relentless cost deflation and demand substitution from services simultaneously.'
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
    fallbackInsight: "Doenjang jjigae rose from ₩1,500 in 1990 to ₩10,000 today: 6.7×. Korea's fermented soybean stew has tracked kimchi jjigae almost identically over 30 years — both are foundational Korean comfort foods with similar cost structures. The 2010s doenjang renaissance transformed a humble peasant food into a premium wellness product: artisan producers in Sunchang (전라북도 순창) — Korea's traditional sauce town — began marketing two- to three-year fermented doenjang at ₩30,000–₩80,000 per jar, citing probiotic and anti-cancer properties validated by Korean nutrition research. This premium positioning gradually raised the price floor for restaurant-quality doenjang. The 2022 soybean price spike (triggered by drought in South America, Korea's primary soybean import source) added direct ingredient cost pressure. The gap between home-cooked (₩2,000) and restaurant versions (₩10,000) now reflects entirely the cost of labor and real estate in commercial kitchens."
  },
  {
    id: 'budae_jjigae',
    category: 'food',
    item: 'Budae Jjigae (부대찌개)',
    context: 'Per person, standard restaurant',
    pastYear: 1995,
    trend: [3000, 4000, 5000, 7000, 8000, 10000, 12000],
    trendYears: [1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Budae jjigae (army base stew) rose from ₩3,000 in 1995 to ₩12,000 today: 4×. The dish was born in Uijeongbu in the 1950s from post-Korean War scarcity — Koreans near US Army Camp Red Cloud combined surplus American military SPAM, sausages, and baked beans with kimchi and gochujang to create a warming winter stew. It is a direct culinary artifact of the US military presence in Korea. SPAM (made by CJ CheilJedang under license in Korea, sold at over ₩5,000 per can in 2024) anchors the dish's cost. SPAM became a premium gift item in Korea — sold in luxury holiday gift sets — which is one of the world's most culturally anomalous marketing positions for a processed meat product. Ironically, a dish literally invented from wartime poverty ingredients now costs ₩12,000 at a sit-down restaurant. The retro-comfort food wave of the 2010s gave budae jjigae a premium makeover with signature restaurant versions exceeding ₩15,000."
  },
  {
    id: 'gamjatang',
    category: 'food',
    item: 'Gamjatang (감자탕)',
    context: 'Per person, standard restaurant',
    pastYear: 1995,
    trend: [4000, 5000, 6000, 8000, 10000, 12000, 15000],
    trendYears: [1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Gamjatang (pork spine stew) rose from ₩4,000 in 1995 to ₩15,000 today: 3.75×. Pork spine was historically discarded or given away — virtually zero commercial value in the 1980s. As gamjatang restaurants grew popular through the 1990s, demand for spines rose while supply per pig remained fixed, transforming a worthless byproduct into a sought-after cut. The 2010–2011 foot-and-mouth disease outbreak killed over 3 million pigs, reducing total pork supply and raising all pork cut prices simultaneously. Large clay pots simmering on gas all day — the defining image of gamjatang restaurants — make energy cost a significant variable; the 2022 LNG price surge directly hit operating costs. Gamjatang restaurants in Mapo-gu famously operate 24 hours, serving as late-night dining halls for laborers and pub-goers — a business model that requires higher prices to sustain nighttime labor costs."
  },
  {
    id: 'bingsu',
    category: 'food',
    item: 'Patbingsu (팥빙수)',
    context: 'Red bean shaved ice, standard café',
    pastYear: 1990,
    trend: [1000, 1500, 2000, 3000, 5000, 8000, 10000, 14000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Patbingsu rose from ₩1,000 in 1990 to ₩14,000 today: 14× — the highest inflation multiple of any food item in this game. The transformation has two phases. Phase 1 (1990s–2010s): gradual ingredient and labor cost increases from a street food to a sit-down café item. Phase 2 (2013–present): the Instagram revolution. In 2013–2015, Korean cafés began competing on bingsu visual spectacle — mango towers, strawberry mountains, injeolmi-dusted peaks — and posting on Instagram. The Shilla Hotel's mango bingsu (₩37,000 in 2015, now ₩55,000) became a national luxury benchmark. This luxury tier pulled mainstream café prices upward as the category was reframed from 'cheap summer treat' to 'premium dessert experience.' Red bean prices also rose as domestic azuki cultivation declined, increasing import dependence. No other Korean food item has experienced this combination of ingredient inflation and luxury repositioning simultaneously."
  },
  {
    id: 'hotteok',
    category: 'food',
    item: 'Hotteok (호떡)',
    context: 'One piece, street vendor',
    pastYear: 1990,
    trend: [200, 300, 500, 700, 1000, 1500, 2000, 2500],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Hotteok rose from ₩200 in 1990 to ₩2,500 today: 12.5× — the second-highest food inflation multiple in this game. The sweet syrup-filled pancake is one of Korea's most beloved winter street foods, with origins in Chinese immigrant communities (호떡 derives from 胡餠) in the late 19th century. Street food vendors have no fixed costs to absorb price increases — every cost must be passed to the customer with no option of reducing labor through tipping or service charges. Wheat (2022 Ukraine shock), sugar (global supply shortfall), and peanut prices all rose. Urban redevelopment throughout the 2010s cleared many traditional market areas where hotteok vendors clustered, reducing supply and pushing surviving vendors to premium locations with higher footfall and higher rent. The vendors who remain have more pricing power than before — but each ₩500 increase still generates visible customer hesitation at the stand."
  },
  {
    id: 'bungeoppang',
    category: 'food',
    item: 'Bungeoppang (붕어빵)',
    context: 'Three pieces, street vendor',
    pastYear: 1990,
    trend: [300, 500, 700, 1000, 1500, 2000, 3000, 5000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Three bungeoppang rose from ₩300 in 1990 to ₩5,000 today: 16.7× — the highest nominal inflation multiple of any item in this game. The fish-shaped pastry was the original 'cheap Korean treat' — '5 for ₩1,000' was a cultural fixture from the 1990s into the 2000s. Azuki red bean (팥), the primary filling, is dominated by imports from Japan and China; a drought-related Korean red bean harvest failure in 2021–2022 sent domestic 팥 prices up 60% in a year. The specialized cast-iron fish molds (붕어빵 틀) are expensive equipment, limiting who can enter the market. Urban redevelopment and COVID-19 lockdowns (2020–2021) forced many traditional street vendors out of business permanently, sharply reducing supply. Post-COVID survivors recognized their reduced competition and reset prices aggressively. The ₩1,000/fish bungeoppang that now appears in premium markets isn't nostalgia — it's scarcity."
  },
  {
    id: 'yukgaejang',
    category: 'food',
    item: 'Yukgaejang (육개장)',
    context: 'One bowl, standard restaurant',
    pastYear: 1990,
    trend: [2000, 3000, 4000, 5000, 7000, 8000, 10000, 12000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Yukgaejang rose from ₩2,000 in 1990 to ₩12,000 today: 6×. The dish requires beef brisket, fernbrake (고사리), and green onion — all of which tracked independent agricultural inflation curves. Fernbrake (bracken fern shoots) is a wild-harvested mountain vegetable; domestic supply shrank as rural harvesting labor aged and younger generations left the countryside, increasing dependence on Chinese and North Korean-origin imports. Beef brisket prices track the broader Hanwoo (한우) beef premium system protected by import tariffs. Yukgaejang is culturally non-negotiable: it is one of four designated soups (탕) served at Korean funeral (상갓집) and memorial (제사) events alongside seolleongtang, galbijjim, and miyeokguk. Ceremonial foods command unusual price inelasticity — you don't serve cheaper soup at a funeral."
  },
  {
    id: 'pork_ribs',
    category: 'food',
    item: 'Pork Ribs (돼지갈비)',
    context: '200g per person, standard restaurant',
    pastYear: 1995,
    trend: [5000, 7000, 9000, 11000, 13000, 15000, 18000, 22000],
    trendYears: [1995, 2000, 2005, 2009, 2013, 2017, 2021, 2024],
    fallbackInsight: "Pork ribs (돼지갈비) rose from ₩5,000 per person in 1995 to ₩22,000 today: 4.4×. Marinated and grilled over charcoal or gas, 돼지갈비 is ordered for birthdays, team dinners, and celebrations — a context where price sensitivity is intentionally lowered. Supply economics are structural: there are only 13 ribs per pig, making this cut genuinely scarce regardless of pork industry scale. The 2010–2011 foot-and-mouth disease crisis that culled 3.3 million Korean pigs — nearly 30% of the national herd — temporarily drove pork rib prices up 60%, and the baseline never fully returned to pre-crisis levels. Charcoal-grilled versions (숯불갈비) command an additional ₩3,000–₩5,000 premium over gas. The restaurant's marinade recipe is often a proprietary family secret — a form of branding that allows pricing above commodity meat levels."
  },
  {
    id: 'beef_ribs',
    category: 'food',
    item: 'Beef Short Ribs (소갈비)',
    context: '200g per person, Korean BBQ restaurant',
    pastYear: 1995,
    trend: [10000, 15000, 20000, 25000, 30000, 40000, 50000, 65000],
    trendYears: [1995, 2000, 2005, 2009, 2013, 2017, 2021, 2024],
    fallbackInsight: "Beef short ribs (소갈비) rose from ₩10,000 per person in 1995 to ₩65,000 today: 6.5×. This is arguably Korea's most dramatic food inflation story. Hanwoo (한우, Korean domestic cattle) commands prices 3–5× imported Australian or US beef because of strict import tariffs (currently ~40%), traceability requirements (every Hanwoo carcass is DNA-registered and labeled at retail), and middle-class status signaling. A prize Hanwoo at auction can sell for ₩5,000–₩10,000,000 for a single animal. Korea's beef import tariffs were supposed to fall to near-zero under the KORUS FTA (2012) and KAFTA (2014), but Hanwoo farmers organized politically to maintain protections, and domestic prices remained elevated. Short ribs are a constrained cut — 13 ribs per animal — making supply inelastic. A full galbi dinner for four at a Seoul Korean BBQ restaurant now exceeds ₩300,000 routinely."
  },
  {
    id: 'soft_serve',
    category: 'food',
    item: 'Soft Serve Ice Cream (소프트아이스크림)',
    context: "McDonald's or Lotteria Korea, small cone",
    pastYear: 1990,
    trend: [200, 300, 400, 500, 600, 700, 800, 1000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Fast food soft serve rose from ₩200 in 1990 to ₩1,000 today: 5×. McDonald's entered Korea in 1988 (just before the Seoul Olympics) and the soft serve was immediately its cheapest item — a deliberate marketing anchor. McDonald's held Korean soft serve at ₩500 for nearly 15 years before gradually raising it. The pricing strategy is textbook loss-leader economics: a ₩1,000 soft serve generates foot traffic that leads to ₩12,000 combo meal purchases. McDonald's Korea soft serve is made with New Zealand dairy (imported under the Korea-New Zealand FTA, 2015), which kept ingredient costs lower than for domestic dairy users. The ₩1,000 price point survived significant cost pressures specifically because McDonald's can offset soft serve losses against other menu items — a privilege independent ice cream vendors do not have."
  },
  {
    id: 'baskin_robbins',
    category: 'food',
    item: 'Baskin-Robbins Scoop (배스킨라빈스)',
    context: 'One regular scoop in a cup/cone',
    pastYear: 1994,
    trend: [700, 1000, 1500, 2000, 2500, 3000, 3500, 4500],
    trendYears: [1994, 1998, 2002, 2006, 2010, 2014, 2019, 2024],
    fallbackInsight: "Baskin-Robbins single scoop rose from ₩700 in 1994 to ₩4,500 today: 6.4×. Baskin-Robbins entered Korea in 1985 via SPC Group (the same conglomerate that operates Paris Baguette and Dunkin') and became culturally embedded as the birthday cake brand of Korean childhood — '이달의 맛' (flavor of the month) was a genuine cultural event. Korean dairy prices are structurally high (the government-mediated raw milk system prices Korean milk 2–3× international levels), making Korean ice cream inherently more expensive than US equivalents. SPC Group raised prices across all its brands in 2022 citing raw material cost surges — Baskin-Robbins, Paris Baguette, and Dunkin' all increased simultaneously. The '파인트' (pint container) that families bought for home parties has become a significant purchase, contributing to what Korean media called the '아이스크림 먹기도 겁나는 세상' (the world where even eating ice cream is scary)."
  },
  {
    id: 'cup_tteokbokki',
    category: 'food',
    item: 'Cup Tteokbokki (컵떡볶이)',
    context: 'Convenience store, ready-to-eat cup',
    pastYear: 2005,
    trend: [1000, 1200, 1500, 1800, 2000, 2500],
    trendYears: [2005, 2008, 2011, 2015, 2019, 2024],
    fallbackInsight: "Convenience store cup tteokbokki rose from ₩1,000 in 2005 to ₩2,500 today: 2.5×. GS25 pioneered the ready-to-heat format in 2005, and within a decade it became Korea's top-selling convenience snack item by volume. The format works by producing rice cakes at industrial scale (centralized factories achieving cost efficiencies impossible for street vendors), combined with mass-produced gochujang sauce. Rice cake inflation is structurally linked to rice prices — when Korea experienced consecutive poor rice harvests in 2022–2023, rice cake costs rose 20–30%. Korean red pepper (고추), the base for gochujang, had its worst domestic harvest in years in 2022 due to extreme summer heat — domestic gochujang prices rose 25%+. Despite these pressures, automated production kept cup tteokbokki at one of the lowest price-per-calorie ratios of any prepared food in Korea."
  },
  {
    id: 'energy_drink',
    category: 'food',
    item: 'Energy Drink (레드불 250ml)',
    context: 'Convenience store, standard can',
    pastYear: 2005,
    trend: [2000, 2200, 2500, 3000, 3500, 4000],
    trendYears: [2005, 2008, 2011, 2015, 2019, 2024],
    fallbackInsight: "Red Bull rose from ₩2,000 in 2005 to ₩4,000 today: 2×. Energy drinks are a classic brand-premium category: the ingredients (taurine, caffeine, B vitamins, sucrose in a 250ml aluminum can) cost under ₩200 to produce, but Red Bull's global marketing — Formula 1, extreme sports, K-pop event sponsorships — justifies an 1,900% margin. Red Bull entered Korea in 2005 during the height of Korean office work culture and positioned itself as an elite productivity supplement. Domestic competition from 박카스 (Bacchus, Korea's original energy tonic, ₩700–₩800), Hot6 (Lotte Chilsung), and Monster Energy (from 2012) created a stratified market. The 2019–2023 surge in convenience store visiting frequency — Korean adults now visit convenience stores an average of 5+ times per week — made the ₩4,000 energy drink a normalized daily ritual for students and delivery workers."
  },
  {
    id: 'yakult',
    category: 'food',
    item: 'Yakult (야쿠르트)',
    context: 'One 65ml bottle',
    pastYear: 1990,
    trend: [50, 80, 100, 120, 150, 180, 200, 250],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Yakult rose from ₩50/bottle in 1990 to ₩250 today: 5×. The ₩250 price is for the original 65ml bottle — one of the most recognizable packaging formats in Korea. Korea Yakult (한국야쿠르트, founded 1969) pioneered an extraordinary direct-to-consumer distribution model: the '야쿠르트 아줌마' (Yakult ladies) delivering refrigerated products door-to-door. By 2024 they have transitioned to electric refrigerated trikes (코코), giving them one of Korea's most visible and beloved last-mile delivery networks. The direct model eliminates retail markup and cold chain handling costs — a unique cost structure that helped hold prices lower than supermarket equivalents. The company launched premium probiotic products (Wilys, Pulmuone line-extensions) at ₩1,000–₩2,000 while keeping the original at ₩250 as a volume anchor. The Yakult lady network is also one of the largest female employment systems in Korean history, creating a social dimension to its pricing decisions."
  },
  {
    id: 'juk',
    category: 'food',
    item: 'Restaurant Porridge (죽)',
    context: 'One bowl, Bonjuk (본죽) or similar franchise',
    pastYear: 2002,
    trend: [4000, 5000, 6000, 7000, 8000, 10000, 12000],
    trendYears: [2002, 2005, 2008, 2012, 2016, 2020, 2024],
    fallbackInsight: "Restaurant porridge rose from ₩4,000 in 2002 to ₩12,000 today: 3×. Bonjuk (본죽) franchised the category in 2002, making one of the boldest repositioning moves in Korean food history: taking juk from 'what you eat when you're sick' to 'premium healthy weekday lunch.' The founding insight was that Korean office workers wanted something lighter and healthier than jjajangmyeon. Bonjuk grew to over 1,000 locations by the 2010s. Abalone (전복) — used in the brand's premium 전복죽 — is a high-value aquaculture product from Jeju and Wando that has risen dramatically with Chinese export demand. Wild abalone, once common on Korea's southern coasts, has become scarce; farmed abalone still commands ₩30,000–₩50,000/kg. Premium juk ingredients tracked luxury seafood inflation rather than general food CPI — a result of the category's deliberate upmarket positioning."
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
    fallbackInsight: "AREX direct express launched in March 2010 at ₩13,300 and is ₩16,500 today: a 24% rise in 14 years. Incheon Airport Railroad (AREX) was built under a public-private partnership and is now majority owned by KORAIL after the government bought out private shareholders in 2014 — a reversal of the PPP model that originally built it. KORAIL's acquisition brought public pricing logic to the fare structure: increases require government approval and are kept well below general inflation. The same track serves two product tiers: the all-stop commuter train (₩4,500, 53 minutes) and the direct express (₩16,500, 43 minutes). The ₩12,000 premium for 10 minutes less travel time reflects demand from business travelers who value time over money — a classic price discrimination structure. Competition from the airport limousine bus (₩17,000, but door-to-door) constrains how far AREX can push direct express pricing."
  },
  {
    id: 'busan_subway',
    category: 'transport',
    item: 'Busan Subway Base Fare',
    context: 'Standard adult ticket, Busan Metro',
    pastYear: 1985,
    trend: [200, 350, 500, 700, 900, 1300, 1400, 1550],
    trendYears: [1985, 1991, 1996, 2001, 2005, 2014, 2019, 2024],
    fallbackInsight: "Busan subway fares rose from ₩200 in 1985 to ₩1,550 today: 7.75×. Busan Metro opened Line 1 in 1985 as Korea's second urban metro after Seoul — a major infrastructure milestone for Korea's largest port city and industrial hub. Like Seoul's system, Busan's metro has run at operating deficits since the 1990s, covered by city tax revenue and cross-subsidies. Busan faces a structurally harder financial position than Seoul: its population has declined from 3.8 million in 1995 to under 3.3 million in 2024, reducing the ridership base while fixed infrastructure costs remain constant. The 2003 Daegu subway arson disaster (192 fatalities), the worst Korean rail accident in modern history, triggered nationwide safety regulation upgrades across all Korean metro systems that added significant compliance costs. Busan's 2024 fare is aligned with Seoul's ₩1,550, reflecting a national standardization trend in public transport pricing."
  },
  {
    id: 'jeju_rent_car',
    category: 'transport',
    item: 'Jeju Island Rental Car',
    context: 'Compact car, one day (excluding insurance)',
    pastYear: 2000,
    trend: [30000, 35000, 40000, 45000, 50000, 70000, 130000, 80000],
    trendYears: [2000, 2004, 2008, 2012, 2016, 2020, 2022, 2024],
    fallbackInsight: "Jeju rental cars rose from ₩30,000/day in 2000 to around ₩80,000 today — but hit ₩130,000–₩180,000 during 2020–2022 when COVID-19 closed international travel and Koreans redirected all overseas travel budgets to Jeju. The island received 15.1 million visitors in 2021 (with a resident population of only 700,000), creating the most acute domestic travel demand surge in Korean history. Rental companies, unable to expand their fleets fast enough (global chip shortages had halted new car production), leveraged captive demand aggressively. Post-COVID normalization brought prices down but not to pre-COVID levels — fleet sizes shrank during COVID and companies retained a portion of the pricing premium. Jeju's transit problem is structural: the island's hilly terrain and spread-out attractions make public buses impractical for most itineraries, giving rental companies near-monopoly power over tourist mobility."
  },
  {
    id: 'oil_change',
    category: 'transport',
    item: 'Engine Oil Change (엔진오일 교환)',
    context: 'Standard oil + filter, mid-size sedan',
    pastYear: 1995,
    trend: [20000, 25000, 30000, 35000, 40000, 50000, 60000, 70000],
    trendYears: [1995, 2000, 2005, 2009, 2013, 2017, 2021, 2024],
    fallbackInsight: "Engine oil changes rose from ₩20,000 in 1995 to ₩70,000 today: 3.5×. The actual oil and filter represent about 40% of the cost; the rest is labor and garage rent. Korean auto service underwent a structural shift in the 2010s: the government pushed for certified auto maintenance centers (자동차 종합 검사소) with higher equipment standards, raising capital costs and differentiating quality service from unlicensed shops. The shift from 5,000km to 10,000km oil change intervals (enabled by improved synthetic oil) reduced visit frequency — garages responded by raising per-visit revenue. Modern synthetic oil (fully synthetic 5W-30, required by Hyundai Theta II and Genesis engines) costs ₩30,000–₩50,000/4L alone, already more than the total cost of a 1995 oil change. The proliferation of EV adoption is beginning to shrink the oil change market, giving remaining ICE service shops a supply-reducing dynamic that supports price increases."
  },
  {
    id: 'electric_scooter',
    category: 'transport',
    item: 'Shared E-Scooter (공유 킥보드)',
    context: 'Per 30 minutes, major sharing service',
    pastYear: 2019,
    trend: [1000, 2000, 3000, 4000],
    trendYears: [2019, 2021, 2023, 2024],
    fallbackInsight: "Shared e-scooters launched in Korea around 2019 at ₩1,000 for 30 minutes and have risen to ₩4,000: 4× in 5 years. The launch was a classic VC-subsidized land-grab: Lime, Kick, and Korean competitors (Beam, Neuron, Xingxing) flooded Seoul with scooters at below-cost pricing to build market share. The regulatory response came quickly. The 2021 Road Traffic Act revision mandated helmets, prohibited sidewalk riding, and required dedicated parking zones — raising operating costs for enforcement, fleet management, and liability. Battery degradation requiring replacement every 12–18 months is the largest hidden cost. Several operators exited Korea by 2022 citing unsustainable unit economics at ₩1,000 fares. Surviving operators raised prices to ₩3,000–₩4,000 and still struggle to reach profitability. The 'cheap last-mile' promise of 2019 was always a marketing subsidy, not a sustainable economic proposition."
  },
  {
    id: 'intercity_bus',
    category: 'transport',
    item: 'Intercity Bus Seoul–Cheonan',
    context: 'Standard seat, one way (시외버스)',
    pastYear: 1990,
    trend: [1500, 2500, 3500, 5000, 7000, 8500, 9000, 11000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Seoul–Cheonan intercity bus rose from ₩1,500 in 1990 to ₩11,000 today: 7.3×. Short intercity routes were once the cheapest mode of travel between Korean cities; they filled the gap between urban transit and long-distance express buses. Rising fuel, driver wages, and bus terminal renovation costs steadily eroded that position. The decisive competitive disruption came when SRT (수서고속철도) opened in December 2016, connecting Seoul's Suseo station to Cheonan-Asan in under 30 minutes for roughly the same fare as the bus. A 30-minute train vs. a 60-minute bus for the same price — the bus cannot win on either dimension. Intercity bus operators on routes near KTX/SRT stations have seen ridership collapse 40–60%. Those that remain serve travelers without convenient access to rail stations, a shrinking demographic as station access improves."
  },
  {
    id: 'ferry_jeju',
    category: 'transport',
    item: 'Mokpo–Jeju Ferry',
    context: 'Standard class seat, one way',
    pastYear: 1995,
    trend: [15000, 20000, 25000, 32000, 40000, 50000, 55000, 65000],
    trendYears: [1995, 2000, 2005, 2009, 2013, 2017, 2021, 2024],
    fallbackInsight: "The Mokpo–Jeju ferry rose from ₩15,000 in 1995 to ₩65,000 today: 4.3×. The April 2014 Sewol (세월호) disaster — a ferry capsizing off Jindo that killed 304 people, mostly high school students on a field trip — was one of the most traumatic events in modern Korean history and fundamentally changed the economics of Korean ferry operation. The resulting Maritime Safety Act of 2014 mandated extensive safety upgrades: life jacket counts, emergency drill requirements, hull structural inspections, evacuation system upgrades. The compliance costs were enormous and permanently raised the operating expense baseline for all Korean ferries. Simultaneously, Jeju Air and other LCCs offered Seoul–Jeju flights for ₩30,000–₩50,000, making the 13-hour ferry journey economically irrational for passengers. The Mokpo–Jeju ferry now primarily carries cargo and vehicles, with passenger revenue no longer the economic justification for the service."
  },
  {
    id: 'ev_charging',
    category: 'transport',
    item: 'EV Fast Charging (전기차 급속충전)',
    context: 'Public charger, approx. 30 minutes',
    pastYear: 2015,
    trend: [2000, 5000, 8000, 12000, 18000],
    trendYears: [2015, 2018, 2020, 2022, 2024],
    fallbackInsight: "Public EV fast charging rose from roughly ₩2,000 for 30 minutes in 2015 to ₩18,000 today: 9× in 9 years — the fastest price increase of any transport item in this game. The Korean government subsidized early EV charging infrastructure heavily through KEPCO (Korea Electric Power Corporation) to stimulate adoption: the first public fast chargers were available at near-zero cost. As EV penetration grew from a few thousand in 2015 to over 500,000 registered EVs in 2024, subsidies were gradually withdrawn. KEPCO implemented a 'peak rate' charging system in 2022 that aligned commercial charger prices with industrial electricity rates, which themselves surged as Korea's energy import costs (LNG, coal) rose 80–100% in 2022. The practical implication: a full charge for a Hyundai IONIQ 5 now costs ₩15,000–₩20,000 at a public DC fast charger, versus ₩20,000 for an equivalent gasoline fillup. The EV fuel cost advantage has nearly evaporated for urban drivers."
  },
  {
    id: 'motorcycle',
    category: 'transport',
    item: 'Motorcycle 125cc (오토바이)',
    context: 'Standard commuter scooter, new retail price',
    pastYear: 1990,
    trend: [700000, 900000, 1100000, 1300000, 1500000, 1700000, 2000000, 2500000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "A 125cc commuter motorcycle rose from ₩700,000 in 1990 to ₩2,500,000 today: 3.6×. Motorcycles became the structural backbone of Korea's delivery economy — food delivery (배달), courier services, and document dispatch all depend on 125cc scooters navigating Seoul's traffic. The COVID-19 pandemic created an extraordinary demand surge: food delivery orders grew 80% in 2020 alone as restaurants pivoted to delivery, and hundreds of thousands of new delivery workers entered the market simultaneously. Used motorcycle prices for popular models (Honda PCX, Yamaha NMAX, Kymco) doubled within 12 months in 2020–2021 as new deliveries were delayed by global supply chain disruption. Delivery platforms (Baemin, Coupang Eats) effectively inflated the asset price of the vehicles their workers depend on — creating a market structure where the platforms captured delivery revenue while workers bore rising capital costs."
  },
  {
    id: 'driver_license',
    category: 'transport',
    item: "Driver's License Academy (운전학원)",
    context: 'Full course, Type 1 license (1종 보통)',
    pastYear: 1995,
    trend: [200000, 300000, 400000, 500000, 600000, 700000, 800000, 900000],
    trendYears: [1995, 2000, 2005, 2009, 2013, 2017, 2021, 2024],
    fallbackInsight: "Driver's license academy fees rose from ₩200,000 in 1995 to ₩900,000 today: 4.5×. Korea's license system requires completing a certified academy course — you cannot simply prepare independently and show up for the government test (unlike in many countries). This captive market structure has allowed academies to raise prices steadily without competitive pressure. Instructor wages, vehicle fuel and depreciation, and facility rent in urban areas are all service-labor costs that track minimum wage increases. The government attempted reform in 2011 by simplifying the test format and allowing private practice tracks — reducing required course hours slightly — but the academy lobby successfully preserved the mandatory academy model. A reform in 2022 further reduced mandatory hours, saving some cost, yet total fees continued rising. At ₩900,000, getting a Korean license costs more than buying a budget used car from the 1990s."
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
    fallbackInsight: "Ski resort day passes rose from ₩20,000 in 1995 to ₩100,000 today: 5×. Korean ski culture peaked in the early 2000s following Yongpyong Resort's successful hosting of Alpine Ski World Cup events and the snowboard boom. The 2018 PyeongChang Winter Olympics brought international attention and infrastructure investment, briefly renewing interest. But warming winters are structurally shrinking the season: average snow-season length at Korean resorts dropped from 120+ days in the 1990s to under 90 days by the 2020s. Resorts now rely more heavily on artificial snow machines (which cost ₩50–₩100 billion per resort to install and operate), raising fixed costs dramatically. As total skier days decline, resorts must extract more revenue per visitor — higher lift passes, mandatory equipment package pricing, and expensive food options. A Korean ski day for two adults now easily exceeds ₩300,000 all-in."
  },
  {
    id: 'imax_ticket',
    category: 'culture',
    item: 'IMAX Movie Ticket',
    context: 'CGV IMAX, standard weekend screening',
    pastYear: 2010,
    trend: [14000, 16000, 18000, 20000, 22000, 25000],
    trendYears: [2010, 2013, 2016, 2018, 2021, 2024],
    fallbackInsight: "IMAX tickets rose from ₩14,000 in 2010 to ₩25,000 today: 1.8× in 14 years. CGV signed its IMAX licensing agreement in 2009 and opened Korea's first IMAX theater at CGV Yongsan in 2010. IMAX Corporation (Canadian-headquartered) charges significant licensing fees per screen per year, a cost that translates directly to ticket premiums. CGV and Lotte Cinema expanded to over 20 IMAX screens nationwide by 2024. Marvel Cinematic Universe films, Christopher Nolan releases, and Korean blockbusters (along with Bong Joon-ho's films) reliably sell out IMAX within minutes of ticket release — sometimes within seconds through fansites and Naver ticket pre-sales. This extreme demand scarcity lets theaters charge ₩25,000 without consumer resistance. IMAX is now a distinct sub-market: consumers aren't buying 'a movie ticket' but a specific premium experience defined by screen size, laser projection, and enhanced sound."
  },
  {
    id: 'camping',
    category: 'culture',
    item: 'National Park Campsite (캠핑장)',
    context: 'One night, standard site',
    pastYear: 2000,
    trend: [3000, 5000, 6000, 7000, 10000, 14000, 18000],
    trendYears: [2000, 2004, 2008, 2012, 2016, 2020, 2024],
    fallbackInsight: "National park campsites rose from ₩3,000/night in 2000 to ₩18,000 today: 6×. Korea's camping culture was almost nonexistent before 2010 — 'camping' meant basic overnight shelters. The government's 4 Major Rivers Restoration Project (4대강 사업) created riverside parks with camping infrastructure, and a domestic outdoor lifestyle media boom followed. COVID-19 was the inflection point: with overseas travel closed and restaurants restricted, camping became Korea's safest social activity. Forest Service reservation systems crashed repeatedly in 2020–2021 from overload. Sites booked out weeks in advance. The Korea Forestry Administration raised prices in 2021 and 2022 citing demand management and maintenance costs. Korean camping spending (gear, clothing, food) grew into a ₩3 trillion/year market by 2022 — one of the world's fastest growth rates for outdoor industry spending. A family camping trip that cost ₩10,000 in 2005 now requires ₩50,000+ before food or equipment."
  },
  {
    id: 'pilates',
    category: 'culture',
    item: 'Pilates Group Class (필라테스)',
    context: 'Per group session (6–8 people), standard studio',
    pastYear: 2010,
    trend: [20000, 25000, 30000, 35000, 40000, 50000],
    trendYears: [2010, 2013, 2016, 2018, 2021, 2024],
    fallbackInsight: "Pilates group classes rose from ₩20,000 in 2010 to ₩50,000 today: 2.5× in 14 years. Pilates entered Korea around 2008 through celebrity fitness culture — Korean actresses and K-pop idols publicly attributed their physiques to Pilates, creating aspirational demand. The Gangnam-gu and Seocho-gu studio districts saw explosive studio openings from 2012 onward. Instructor certification costs are substantial: a STOTT Pilates or BASI certification requires ₩3,000,000–₩8,000,000 in training fees, creating genuine human capital investment that justifies premium pricing. Studio rents in prime Gangnam commercial buildings run ₩5,000,000–₩10,000,000/month. Private (1-on-1) Reformer sessions now exceed ₩100,000 per hour in top Gangnam studios. The Korea Pilates Association was formally established in 2013, adding certification requirements and professionalizing — and raising — the industry's cost structure. Urban Korean wellness spending on Pilates now rivals cosmetics as a category."
  },
  {
    id: 'pet_grooming',
    category: 'culture',
    item: 'Dog Grooming (반려견 미용)',
    context: 'Small dog, full wash + trim, standard pet salon',
    pastYear: 2000,
    trend: [15000, 20000, 25000, 30000, 35000, 45000, 55000, 70000],
    trendYears: [2000, 2004, 2008, 2012, 2016, 2019, 2022, 2024],
    fallbackInsight: "Dog grooming rose from ₩15,000 in 2000 to ₩70,000 today: 4.7×. Korea's pet population grew from 3 million in 2000 to over 15 million by 2024 — driven by the 'fur baby' cultural shift as Korea's total fertility rate fell below 1.0 (the lowest in the world in 2023). For many younger Koreans, pets replaced children as primary care investments. Per-pet annual spending in Korea now approaches ₩2,000,000–₩3,000,000 — comparable to child-raising cost in some categories. The Animal Protection Act has been progressively strengthened since 2007, raising care standards and licensing requirements for pet salons. Certified groomer credentials (반려동물 미용사) require formal training and exam — a form of human capital that commands higher wages. The shift from 'pet' to '반려 동물' (companion animal) in official Korean language (a government-sanctioned term change in 2007) reflects a cultural reframing that supports premium spending."
  },
  {
    id: 'webtoon_platform',
    category: 'culture',
    item: 'Webtoon Platform Subscription (웹툰 플랫폼)',
    context: 'Monthly pass, KakaoPage or Naver Webtoon',
    pastYear: 2012,
    trend: [5000, 7000, 9000, 10000, 12000],
    trendYears: [2012, 2015, 2018, 2020, 2024],
    fallbackInsight: "Webtoon platform subscriptions rose from ₩5,000/month in 2012 to ₩12,000 today: 2.4×. Korea invented the webtoon format — vertical-scrolling digital comics optimized for mobile — in the early 2000s, and Naver Webtoon (launched 2004) and KakaoPage (2012) built it into a global industry. Naver Webtoon (now rebranded as WEBTOON Entertainment) listed on NASDAQ in June 2024, valuing the company at $2.7 billion and confirming Korean webtoons as a globally significant IP category. Creator payment systems evolved from modest revenue sharing in 2012 to complex royalty structures where top creators earn billions of won annually, raising platform content costs. Webtoon IP has become the primary source material for Korean dramas: True Beauty, Itaewon Class, and All of Us Are Dead all started as webtoons. Readers are paying ₩12,000/month to fund an industry that generates far more value in drama licensing and merchandise than in subscription revenue alone."
  },
  {
    id: 'classical_concert',
    category: 'culture',
    item: 'Classical Concert (클래식 공연)',
    context: 'R-seat, Seoul Arts Center (예술의전당)',
    pastYear: 1995,
    trend: [20000, 30000, 40000, 50000, 70000, 90000, 110000, 130000],
    trendYears: [1995, 2000, 2005, 2009, 2013, 2017, 2021, 2024],
    fallbackInsight: "Classical concert R-seats at the Seoul Arts Center (예술의전당) rose from ₩20,000 in 1995 to ₩130,000 today: 6.5×. The Arts Center opened in 1993 and became the anchor of Seoul's cultural infrastructure, built to consolidate Korea's post-Olympic aspiration to cultural legitimacy. International performer fees are denominated in euros and dollars — the 2022 won depreciation (USD/KRW peaked above 1,450) effectively raised the cost of booking any foreign artist by 15–20% in a single year. Korea's classical music scene produced world-class soloists who changed the global perception of Korean musicians: Yiruma, pianist Seong-Jin Cho (2015 Chopin Competition winner), violinist Ray Chen, and conductor Myung-Whun Chung helped elevate Korean concerts as premium global events. Top-tier soloists and orchestras — Vienna Philharmonic, Berlin Philharmonic visiting tours — command ticket prices of ₩200,000–₩350,000, pulling the middle-tier R-seat price upward."
  },
  {
    id: 'comic_book',
    category: 'culture',
    item: 'Comic/Manga Book (만화책)',
    context: 'Single volume, standard format',
    pastYear: 1990,
    trend: [800, 1200, 1500, 2000, 3000, 4000, 5000, 7000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Comic books rose from ₩800 in 1990 to ₩7,000 today: 8.75×. Korea's manhwa (만화) industry was a major domestic cultural force through the 1990s — rental manhwa shops (만화방) served as neighborhood entertainment hubs, and serialized manhwa ran in every major newspaper and monthly magazine. Then Japan's Shonen Jump magazines and licensed manga arrived in the early 2000s, followed by free online scanlations and then webtoons. Each wave eroded physical volume sales while paper and printing costs rose. Publishers responded with higher per-unit prices as print runs shrank — the classic 'death loop' of a declining physical medium. The paper supply chain shock of 2021–2022 (global pulp prices rose 40%) was the final blow to keeping under ₩5,000 prices viable. Korean physical manhwa and manga publishing now serves a dedicated niche willing to pay ₩7,000 per volume for collectible physical editions."
  },
  {
    id: 'music_streaming',
    category: 'culture',
    item: 'Music Streaming (멜론 월정액)',
    context: 'Monthly unlimited streaming, Melon or equivalent',
    pastYear: 2004,
    trend: [4000, 6000, 7000, 7700, 7900, 8900, 10900],
    trendYears: [2004, 2008, 2012, 2015, 2017, 2021, 2024],
    fallbackInsight: "Music streaming (led by Melon) rose from ₩4,000/month in 2004 to ₩10,900 today: 2.7×. Korea was one of the first markets globally to transition from music piracy to paid streaming. Melon launched in 2004 by SK Telecom and helped legitimize the streaming model before Spotify existed — Korea's streaming penetration was among the world's highest by 2010. The platform has changed hands multiple times: from SK Telecom to Loen Entertainment, then to Kakao in 2016 (for ₩1.87 trillion — one of Korea's largest digital acquisitions). Royalty rate reforms mandated by the Korean Copyright Commission have raised the percentage paid to artists from roughly 60% in 2010 to over 65% by 2020, directly increasing platform costs. K-pop's global explosion made Korean music catalog rights far more valuable: BTS' HYBE catalog alone is worth billions, and higher IP valuations have translated to higher licensing fees that platforms pass to subscribers."
  },
  {
    id: 'taekwondo',
    category: 'culture',
    item: 'Taekwondo Academy (태권도 학원)',
    context: "Children's monthly tuition",
    pastYear: 1990,
    trend: [20000, 30000, 40000, 50000, 60000, 70000, 80000, 100000],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024],
    fallbackInsight: "Children's taekwondo rose from ₩20,000/month in 1990 to ₩100,000 today: 5×. Taekwondo became an Olympic sport in Seoul 1988 (demonstration) and officially in Sydney 2000 — Korea won four gold medals in Sydney, cementing national prestige and enrollment boom. Nearly every Korean neighborhood has a 도장 (dojang), making it the most ubiquitous children's extracurricular activity in the country. Monthly fees track instructor wages almost directly — masters are relatively scarce (4th–6th dan certification requires years of dedicated practice), and real estate in residential school zones is expensive. The global spread of taekwondo as the world's most practiced martial art (over 80 million practitioners in 200 countries) gave Korean Kukkiwon-certified instructors international career options: a certified Korean master can earn 3–5× domestic wages by teaching abroad, raising the domestic wage floor. Korea's falling birth rate is now reducing dojang enrollment, pushing surviving studios to raise per-student fees."
  },
  {
    id: 'english_academy',
    category: 'culture',
    item: 'English Academy (영어학원)',
    context: "Children's monthly tuition, elementary level",
    pastYear: 1995,
    trend: [60000, 100000, 150000, 200000, 250000, 300000, 350000, 400000],
    trendYears: [1995, 2000, 2005, 2009, 2013, 2017, 2021, 2024],
    fallbackInsight: "English academy (hagwon) monthly fees rose from ₩60,000 in 1995 to ₩400,000 today: 6.7×. Korea's private education (사교육) market grew from a supplement to the public school system into a parallel educational system. The 1995 '교육개혁' (education reform) that introduced the CSAT (수능) system inadvertently intensified hagwon dependence as students sought every competitive advantage. English became the primary private education spending category: after the 1997 IMF crisis created a generation acutely aware that global economic integration required English fluency, demand exploded. Native English teacher (원어민 강사) visa programs brought thousands of foreign instructors, whose salary expectations set a wage floor well above Korean instructor rates. The government attempted to regulate hagwon hours (the 2009 10pm curfew law) and prices without success. Total Korean household spending on private education exceeded ₩26 trillion in 2023 — approximately ₩500,000 per student per month on average, with English taking the largest share."
  },
  {
    id: 'nailshop',
    category: 'culture',
    item: 'Nail Salon — Gel Nails (네일샵)',
    context: 'Full hand gel nail set, standard salon',
    pastYear: 2005,
    trend: [20000, 25000, 30000, 35000, 40000, 50000],
    trendYears: [2005, 2009, 2013, 2016, 2020, 2024],
    fallbackInsight: "Gel nail services rose from ₩20,000 in 2005 to ₩50,000 today: 2.5×. Korea has one of the highest nail salon densities in the world — Seoul's Gangnam district alone has thousands. Gel nails entered the Korean market in the late 2000s as an upgrade from traditional acrylic, requiring UV/LED lamps and specialized gel products (largely imported from Japan and the US). The K-beauty industry's global rise from 2013 onward made Korean nail aesthetics internationally influential: Seoul nail art was cited in global beauty publications as setting trends. Instagram and TikTok nail accounts accelerated design complexity — the 'classic French' of 2005 evolved into elaborate hand-painted art, 3D embellishments, and chrome powder finishes that take 60–90 minutes per session instead of 30. Longer sessions mean more technician time and higher prices. The Korean Ministry of Labor formally classified nail technicians as a certified trade in 2019, requiring examinations that raised professional standards and wages."
  },
  {
    id: 'batting_cage',
    category: 'culture',
    item: 'Baseball Batting Cage (배팅연습장)',
    context: 'Standard time slot, urban facility',
    pastYear: 1995,
    trend: [2000, 3000, 4000, 5000, 6000, 7000, 8000],
    trendYears: [1995, 2000, 2005, 2010, 2015, 2019, 2024],
    fallbackInsight: "Baseball batting cages rose from ₩2,000 in 1995 to ₩8,000 today: 4×. Korea's baseball culture runs deep — the KBO was founded in 1982 under the Chun Doo-hwan government as a deliberate 'bread and circuses' distraction policy (along with color television access and expanded leisure). This created an authentic national baseball obsession that has endured 40 years. Batting cage machine maintenance (pitching machines, netting, lighting) and commercial real estate costs drive pricing. The 2023–2024 KBO attendance boom — breaking all-time records with over 10 million spectators in 2024, driven by Kia Tigers and LG Twins rivalry — created the strongest batting cage demand in two decades. Urban batting cages increasingly compete with expensive commercial real estate uses; operators in Gangnam and Hongdae have converted some lanes to premium membership tiers at ₩15,000–₩20,000 per session."
  },
  {
    id: 'kids_cafe',
    category: 'culture',
    item: "Kids Café (키즈카페)",
    context: 'Per child, 1-hour entry',
    pastYear: 2005,
    trend: [5000, 7000, 10000, 12000, 15000, 18000],
    trendYears: [2005, 2009, 2013, 2016, 2020, 2024],
    fallbackInsight: "Kids café entry rose from ₩5,000 in 2005 to ₩18,000 today: 3.6×. Kids cafés (키즈카페) emerged as a distinctly Korean solution to apartment urban living: when families live in 85㎡ apartments with no private garden, indoor play spaces filled the gap that backyards would otherwise provide. The format required expensive safety-certified soft play equipment (ASTM/EN standards), large floorplates in commercial zones, and continuous sanitation staff — all high fixed costs. Korea's child safety standards tightened substantially after several injury incidents in the 2010s, increasing compliance costs. COVID-19 was catastrophic: kids cafés were mandatorily closed for months in 2020 and 2021 as high-contact children's play spaces were deemed maximum risk. Those that survived raised prices significantly to recover lost revenue. Korea's falling birth rate is gradually reducing the child population, meaning fewer customers per square meter of expensive space — another structural pressure on pricing."
  },
  {
    id: 'wedding_photo',
    category: 'culture',
    item: 'Wedding Studio Photo (웨딩 스튜디오)',
    context: 'Basic package, standard studio',
    pastYear: 1995,
    trend: [300000, 400000, 500000, 600000, 700000, 800000, 1000000, 1200000],
    trendYears: [1995, 2000, 2005, 2009, 2013, 2017, 2021, 2024],
    fallbackInsight: "Wedding studio photography rose from ₩300,000 in 1995 to ₩1,200,000 today: 4×. Korean pre-wedding photography (웨딩 스튜디오 촬영) is a cultural practice largely unique to Korea: couples commission elaborate studio and outdoor shoots with multiple outfit changes weeks before the ceremony, producing hundreds of edited photos for wedding halls and family albums. The practice intensified in the 2000s and 2010s as Korean weddings became increasingly production-intensive events. Photography technology shifts (digital cameras replacing film, then mirrorless replacing DSLR, then retouching software becoming sophisticated) changed the product but didn't reduce prices. Korea's marriage rate collapsed from 9.0 per 1,000 population in 1990 to 3.8 in 2023 — the largest recorded peacetime marriage rate decline in any developed country. Fewer weddings mean fewer studio bookings; studios compensate by raising prices per shoot. Premium 'outdoor forest' and 'overseas Jeju' packages now exceed ₩5,000,000 — an extraordinary sum for a declining-frequency life event."
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
    fallbackInsight: "Mid-range Bluetooth speakers dropped from ₩100,000 in 2012 to ₩60,000 by 2017, then recovered to ₩80,000: a net 20% decrease. The category was established by JBL and Sony in the early 2010s; Korean brands (Samsung, Anker subsidiaries) entered quickly. Chinese manufacturers — Xiaomi, Tribit, Soundcore — commoditized the core Bluetooth audio technology (primarily CSR Bluetooth chipsets, manufactured by Qualcomm) below ₩40,000 by 2018. The 2020–2021 global chip shortage disrupted Bluetooth chipset supply, pushing prices back up 20–30% temporarily. By 2024, a ₩30,000–₩50,000 speaker provides genuinely good audio quality for casual use, forcing the ₩80,000–₩100,000 tier to compete on premium branding (Bose SoundLink, Bang & Olufsen) rather than basic audio performance. The mid-market is being squeezed from both below (cheap-and-good) and above (luxury brand)."
  },
  {
    id: 'monitor_27',
    category: 'tech',
    item: '27-inch FHD Monitor (모니터)',
    context: 'Standard 1080p office/gaming monitor',
    pastYear: 2010,
    trend: [400000, 300000, 200000, 150000, 150000, 180000, 200000],
    trendYears: [2010, 2013, 2016, 2018, 2020, 2022, 2024],
    fallbackInsight: "A 27-inch FHD monitor dropped from ₩400,000 in 2010 to ₩150,000 by 2018: a 62% fall. The price collapse was driven by Samsung and LG's panel overcapacity cycles: both companies invested heavily in large-format LCD panel factories through the 2010s, creating periodic supply gluts that crushed module prices. Chinese panel makers (BOE, CSOT) entered the market from 2015 onward with government-subsidized factories, accelerating the commoditization. Then COVID-19 created the largest single-year demand surge for computer monitors in history (every remote worker needed a home setup), while the global chip shortage restricted supply — prices jumped 30% in 2021 before normalizing to ₩200,000. The ₩150,000 monitor of 2018 had better response time (1ms vs. 5ms), higher contrast, and IPS panel technology compared to the ₩400,000 TN panel of 2010. Technology deflation, briefly interrupted by supply shock, then partially resumed."
  },
  {
    id: 'cordless_vacuum',
    category: 'tech',
    item: 'Cordless Vacuum (무선 청소기)',
    context: 'Mid-range stick vacuum, major brand',
    pastYear: 2010,
    trend: [300000, 250000, 200000, 200000, 250000, 300000],
    trendYears: [2010, 2013, 2016, 2018, 2021, 2024],
    fallbackInsight: "Cordless vacuums stayed broadly flat at ₩200,000–₩300,000 since 2010 — but the story is the market transformation around that stable midpoint. Dyson entered Korea in 2014 with the V6 at ₩500,000 and subsequently the V11 and V15 at ₩700,000–₩1,000,000, targeting the premium segment that had never existed. Dyson's design and marketing strategy proved extraordinarily effective in Korea's aesthetics-conscious market: the transparent dust bin and cyclone technology became status symbols visible in apartments. LG responded with its CordZero line and Samsung with Bespoke Jet — both ₩400,000–₩700,000 — to compete in the new premium tier while protecting their ₩200,000–₩300,000 mass market. Korean apartment living (average Korean apartment 84㎡, typically hardwood floors with no carpet) makes a cordless stick vacuum the most practical cleaning tool — driving penetration above 60% of urban households. The market bifurcated sharply between a utilitarian budget tier and a premium lifestyle tier."
  },
  {
    id: 'electric_toothbrush',
    category: 'tech',
    item: 'Electric Toothbrush (전동칫솔)',
    context: 'Mid-range oscillating type, Oral-B or Philips',
    pastYear: 2005,
    trend: [80000, 70000, 60000, 60000, 70000, 80000],
    trendYears: [2005, 2009, 2013, 2017, 2020, 2024],
    fallbackInsight: "Electric toothbrushes have stayed flat at ₩60,000–₩80,000 since 2005 — one of the most stable prices in the tech category. The business model explains the pricing: the base unit is essentially a loss-leader (or a minimal-margin product) and the real profit comes from replacement brush heads at ₩30,000–₩50,000 per set of four heads per year. This razor-and-blade model gives Oral-B (Braun/P&G) and Philips Sonicare incentives to price hardware competitively to maximize installed base, then recoup on consumables. Korean dentist culture supports this market: Korean oral care spending per capita is among the highest in Asia, with annual dental checkups normalized by National Health Insurance coverage since the 2000s. Korean insurers covered scaling (치석 제거) from 2013 onward, bringing millions more Koreans into regular dental care habits and expanding the electric toothbrush market organically without requiring significant price changes."
  },
  {
    id: 'game_subscription',
    category: 'tech',
    item: 'Game Subscription Service (게임 구독)',
    context: 'Monthly, Xbox Game Pass or PlayStation Plus',
    pastYear: 2015,
    trend: [4900, 6900, 9900, 12900, 17000],
    trendYears: [2015, 2018, 2020, 2022, 2024],
    fallbackInsight: "Game subscription services rose from ₩4,900/month in 2015 to ₩17,000 today: 3.5× in 9 years. Xbox Game Pass launched in Korea at ₩4,900 in 2017 (PlayStation Now/Plus was earlier), initially subsidized to establish market position against Korea's PC game-dominant culture. The Korean gaming market is structurally unusual: most popular titles (League of Legends, PUBG, Lineage) are free-to-play PC games with in-game purchases — console subscription gaming competes with a deeply established PC café and F2P ecosystem. Microsoft's $68.7 billion acquisition of Activision Blizzard (2023) — adding Call of Duty, Overwatch, and Diablo to Game Pass — justified significant price increases that Microsoft implemented globally, including Korea. The 2022 hike from ₩9,900 to ₩12,900 and subsequent 2023 hike to ₩17,000 drew intense Korean gamer backlash but minimal cancellation, validating the addictive-catalogue lock-in strategy."
  },
  {
    id: 'dashcam',
    category: 'tech',
    item: 'Dashcam (블랙박스)',
    context: '2-channel (front + rear), standard model',
    pastYear: 2010,
    trend: [200000, 150000, 120000, 100000, 80000, 90000, 100000],
    trendYears: [2010, 2012, 2015, 2017, 2019, 2022, 2024],
    fallbackInsight: "Dashcams dropped from ₩200,000 in 2010 to ₩80,000 by 2019, then crept back to ₩100,000: a net 50% decrease. Korea has the world's highest dashcam adoption rate — over 70% of registered vehicles — driven by a specific cultural and legal dynamic: Korean insurance companies use dashcam footage as primary evidence in accident fault determination, and drivers without footage are at a systematic disadvantage in disputes. This created a market where adoption is effectively mandatory, not optional. Korean companies — Thinkware, Blackvue, Lukas — pioneered the category globally and still dominate the premium segment. Chinese component commoditization drove down hardware costs rapidly; Korean brands responded by moving upmarket with 4K resolution (2019), built-in LTE connectivity (2020), and AI-based danger detection (2022), raising the premium tier to ₩200,000–₩400,000. A niche accessory became an essential legal protection tool within a decade."
  },
  {
    id: 'rice_cooker',
    category: 'tech',
    item: 'Electric Rice Cooker (전기밥솥)',
    context: '6-person IH pressure cooker, Cuckoo brand',
    pastYear: 1995,
    trend: [100000, 120000, 150000, 180000, 200000, 220000, 250000, 280000],
    trendYears: [1995, 2000, 2005, 2009, 2013, 2017, 2021, 2024],
    fallbackInsight: "Korean rice cookers rose from ₩100,000 in 1995 to ₩280,000 today: 2.8×. Korea developed its own distinct rice cooker technology — IH (Induction Heating) pressure cookers — that differs from Japanese models: the Korean version reaches higher pressure (1.5–1.7 atm) at higher temperatures (110–115°C), producing a texture Koreans find superior for short-grain Korean rice (medium-grain oryza sativa japonica). Cuckoo (쿠쿠) and Cuchen (쿠첸) dominate the domestic market and have built export businesses to the Korean diaspora globally. The brand Cuckoo has been the #1 wedding gift registry appliance in Korea for over a decade. Premium models with AI cooking algorithms and NESHAP stainless inner pots now exceed ₩500,000 — approaching the price of budget smartphones. For a single-use cooking appliance, this price premium reflects how seriously Korean food culture treats the ritual of properly cooked rice. Per-grain texture matters at this level of spending."
  },
  {
    id: 'wifi_router',
    category: 'tech',
    item: 'Wi-Fi Router (공유기)',
    context: 'Mid-range home router, TP-Link or IPTIME',
    pastYear: 2005,
    trend: [100000, 80000, 60000, 50000, 60000, 70000, 80000],
    trendYears: [2005, 2009, 2012, 2016, 2019, 2022, 2024],
    fallbackInsight: "Home Wi-Fi routers dropped from ₩100,000 in 2005 to ₩50,000 by 2016, then recovered to ₩80,000. Korea's home internet infrastructure is uniquely demanding: with the world's fastest broadband speeds (averaging over 200Mbps as of 2024, compared to the US average of ~130Mbps), routers must support genuine gigabit throughput — many global budget routers cannot. EFM Networks' IPTIME brand captured the Korean mass market by building low-cost routers specifically optimized for Korean ISP protocols (DHCP, PPPoE configurations specific to KT and SK networks). Qualcomm and MediaTek Wi-Fi chipset generations (Wi-Fi 4 → 5 → 6 → 6E) drove periodic price bumps as consumers upgraded for speed. The 2020–2021 chip shortage hit router chipsets — a small market compared to phones and PCs — causing supply disruptions and 20–30% price increases. The recovery to ₩80,000 reflects both Wi-Fi 6 specification premiums and component cost normalization."
  },
  {
    id: 'security_camera',
    category: 'tech',
    item: 'Home CCTV Camera (가정용 CCTV)',
    context: 'Single IP camera, standard brand',
    pastYear: 2010,
    trend: [200000, 150000, 100000, 70000, 60000, 60000, 70000],
    trendYears: [2010, 2013, 2016, 2018, 2020, 2022, 2024],
    fallbackInsight: "Home CCTV cameras dropped from ₩200,000 in 2010 to ₩60,000 by 2020: a 70% fall. Hikvision, Dahua, and Xiaomi (China) achieved extraordinary economies of scale in CMOS image sensors and embedded Linux processing, driving IP camera hardware costs to a fraction of 2010 prices. Korean brands (Hanwha Vision — formerly Samsung Techwin — and LG's security division) were forced to either exit the consumer tier or accept razor-thin margins. The societal context is complex: growing concerns about illegal filming (불법 촬영, or 몰카) and 스토킹 범죄 (stalking crimes) simultaneously increased demand for home security cameras and made Koreans more aware that cameras can be used against them as well. The Stalking Crimes Punishment Act (2021) and increased media coverage of hidden camera crimes created a dual demand: protect yourself with cameras, while being afraid of cameras placed by others. Post-COVID supply chain disruptions caused a minor price rebound before stabilizing."
  },
  {
    id: 'electric_kettle',
    category: 'tech',
    item: 'Electric Kettle (전기포트)',
    context: 'Standard 1.7L home kettle',
    pastYear: 2000,
    trend: [20000, 20000, 20000, 25000, 30000, 35000, 40000],
    trendYears: [2000, 2004, 2008, 2012, 2016, 2020, 2024],
    fallbackInsight: "Electric kettles rose from ₩20,000 in 2000 to ₩40,000 today: 2× — one of the slowest price increases in this game. The basic function (rapidly boil water) has not changed; manufacturing moved to China by the early 2000s; and the product has no meaningful software or feature arms race. Korean specialty coffee culture actually created a new market segment: precision temperature-control kettles (variable temperature for green tea at 70°C, pour-over coffee at 93°C) that command ₩60,000–₩150,000. Brands like Fellow Stagg (US) and Korean brand BALMUDA (Japan) created lifestyle aspirational kettles at ₩80,000–₩120,000. But the mass market — where most Koreans shop at Emart or Homeplus — remains at ₩20,000–₩40,000 with Chinese-manufactured units dominating. The electric kettle is the clearest example in this game of a product that has genuinely resisted inflation through functional simplicity."
  },

  // ── FOOD (15 more) ───────────────────────────────────────────
  {
    id: 'jokbal',
    category: 'food',
    item: 'Jokbal (족발)',
    context: 'Small portion, standard jokbal restaurant',
    pastYear: 1995,
    trend: [15000, 18000, 22000, 25000, 30000, 35000, 40000, 50000],
    trendYears: [1995, 1999, 2003, 2007, 2010, 2014, 2019, 2024],
    fallbackInsight: "Jokbal rose from ₩15,000 in 1995 to ₩50,000 today: 3.3×. Braised pig trotter is a labor-intensive dish requiring hours of simmering in soy, ginger, and spices, then meticulous hand-slicing — a process that cannot be meaningfully automated. The Jangchung-dong jokbal street in central Seoul is one of Korea's original restaurant destination districts, dating to the 1960s when the area served laborers near Dongdaemun market. It became a national late-night food institution. Pork leg prices track the overall pork market; the 2010–2011 foot-and-mouth disease culling of 3.3 million pigs raised all pork cut prices permanently. Post-COVID, Baemin and Coupang Eats delivery transformed jokbal from a dine-in experience to a premium delivery item: platform commissions added 20–30% to the effective cost, and jokbal restaurants raised menu prices accordingly. A small (소) portion that cost ₩15,000 in 1995 is now ₩50,000 — surpassing the ₩50,000 threshold was a national price milestone."
  },
  {
    id: 'bossam',
    category: 'food',
    item: 'Bossam (보쌈)',
    context: 'Small portion, standard bossam restaurant',
    pastYear: 1995,
    trend: [12000, 15000, 18000, 22000, 25000, 30000, 38000, 45000],
    trendYears: [1995, 1999, 2003, 2007, 2010, 2014, 2019, 2024],
    fallbackInsight: "Bossam rose from ₩12,000 in 1995 to ₩45,000 today: 3.75×. Boiled pork belly (삼겹살 or 앞다리살) served with fresh kimchi, green onion salad, and wrapping leaves sounds simple, but requires premium freshness timing — the pork must be sliced and served immediately from the pot. The Mapo-gu bossam district (망원동) became Seoul's most famous destination for the dish in the 2010s. Post-2017, delivery app culture transformed bossam economics: Baemin and Coupang Eats recognized bossam as a high-ticket delivery item, and the 'premium bossam set' with raw oysters (굴), kimchi, and makgeolli became a popular late-night delivery combination. Platform commissions of 15–30% meant restaurants priced menus 20% higher for delivery than dine-in. The premium ingredient additions — fresh oysters, homemade kimchi, premium pork cuts — each added ₩5,000–₩10,000 to the menu price as operators competed on quality rather than price."
  },
  {
    id: 'mandu',
    category: 'food',
    item: 'Steamed Mandu (찐만두)',
    context: 'One portion (8–10 pieces), street stall or small restaurant',
    pastYear: 1995,
    trend: [2000, 2500, 3000, 4000, 5000, 6000, 7000, 9000],
    trendYears: [1995, 1999, 2003, 2007, 2010, 2014, 2019, 2024],
    fallbackInsight: "Steamed mandu rose from ₩2,000 in 1995 to ₩9,000 today: 4.5×. Mandu (Korean dumpling) has deep historical roots — records of dumpling culture date to the Goryeo dynasty (918–1392) when Mongolian cuisine influenced Korean cooking. The dish is particularly labor-intensive: wrapping each dumpling by hand requires skilled repetitive motion that cannot be fully automated in the restaurant setting. Frozen supermarket mandu (CJ Bibigo, Dongwon) industrialized production and created a mass-market product at ₩5,000–₩8,000 per 350g bag — far cheaper per piece than restaurant-made. Bibigo mandu became one of Korea's most successful global food exports, available in US Costco and European retailers. This industrial success paradoxically raised the cultural value of handmade mandu: consumers now pay a premium for the human labor that mass production replaced, creating the widest gap between industrial and artisan dumpling pricing in history."
  },
  {
    id: 'haejang',
    category: 'food',
    item: 'Haejang-guk (해장국)',
    context: 'Standard hangover soup restaurant',
    pastYear: 1995,
    trend: [3000, 4000, 5000, 6000, 7000, 8000, 9000, 12000],
    trendYears: [1995, 1999, 2003, 2007, 2010, 2014, 2019, 2024],
    fallbackInsight: "Haejang-guk rose from ₩3,000 in 1995 to ₩12,000 today: 4×. Korea's iconic hangover cure — 콩나물해장국 (bean sprout), 선지해장국 (coagulated blood), or 뼈해장국 (bone broth) depending on region — is inseparable from a drinking culture where soju consumption per capita is among the world's highest. Haejang-guk restaurants are a unique business model: they open at midnight or 4am to serve the post-drinking crowd and morning market workers, then close by noon — requiring split overnight staffing shifts that cost 30–50% more per hour under Korean labor regulations (야간 근무 수당, night work premium). Beef bones for broth simmering overnight require gas or electricity all night — energy costs that surged in 2022. The Cheonggyecheon and Dongdaemun traditional haejang-guk districts, where restaurants served laborers from the 1950s onward, have seen rising rents force closures of establishments that operated for decades."
  },
  {
    id: 'sundae_street',
    category: 'food',
    item: 'Sundae Street Food (순대)',
    context: 'One portion, street stall or pojangmacha',
    pastYear: 1990,
    trend: [500, 700, 1000, 1500, 2000, 2500, 3000, 4000],
    trendYears: [1990, 1994, 1998, 2003, 2007, 2012, 2017, 2024],
    fallbackInsight: "Sundae street food rose from ₩500 in 1990 to ₩4,000 today: 8×. Korean sundae (blood sausage stuffed with glass noodles and vegetables) originated in the Joseon era and became a street food institution after industrialization brought it to market stalls nationwide. It is inseparable from tteokbokki culture — the two are almost always sold together (떡볶이와 순대 세트). The 2010–2011 foot-and-mouth disease crisis that culled nearly a third of Korea's pig population sharply raised pork and offal prices, raising the base cost of sundae production. Urban redevelopment cleared many traditional pojangmacha districts — Gangnam's redevelopment in the 2010s, Seongsu-dong's transformation, Hongdae's commercialization — reducing street food vendor density and eliminating the competitive pressure that kept prices down. The humble sundae vendor that survived now has less competition and higher rent to justify elevated prices."
  },
  {
    id: 'odeng',
    category: 'food',
    item: 'Fish Cake Skewer (오뎅)',
    context: 'One skewer, convenience store or street stall',
    pastYear: 1990,
    trend: [100, 200, 300, 400, 500, 700, 1000, 1500],
    trendYears: [1990, 1995, 1999, 2003, 2007, 2012, 2018, 2024],
    fallbackInsight: "Fish cake skewers rose from ₩100 in 1990 to ₩1,500 today: 15× — the third-highest inflation multiple in this game. Originally the cheapest possible winter food: a pollock-based surimi stick simmering in free broth that anyone could stand and eat. The Korean Food Standard Codex (식품공전) progressively tightened minimum fish content requirements for products labeled '어묵' (fish cake), raising the real ingredient cost as cheap filler binders were restricted. Energy costs for maintaining hot broth vats at street stalls all day (gas burners running 8–10 hours) rose sharply in 2022. Korean fish cake manufacturers (삼진어묵, 부산어묵) repositioned the product as a premium artisan food through flagship stores and premium ingredient varieties — anchoring a cultural perception that justified higher prices across all market channels. Urban redevelopment that eliminated pojangmacha clusters reduced street supply further."
  },
  {
    id: 'corn_dog',
    category: 'food',
    item: 'Korean Corn Dog (핫도그)',
    context: 'One piece, street stall or specialty shop',
    pastYear: 1995,
    trend: [500, 700, 1000, 1500, 2000, 2500, 3000, 4000],
    trendYears: [1995, 1999, 2003, 2007, 2010, 2014, 2019, 2024],
    fallbackInsight: "Korean corn dogs rose from ₩500 in 1995 to ₩4,000 today: 8×. The transformation from American-style corn dog to Korean 핫도그 is a masterclass in food format innovation. The original was a simple battered sausage on a stick. Korean street food vendors then introduced rice cake (떡) mixed into the batter for chewiness; then mozzarella cheese inside for the 'cheese pull' video effect; then potato cube coatings, crushed ramen crusts, and sugar-dusted finishes. Each innovation layer added cost and justified a higher price. Brand chains — Myungrang Hot Dog (명랑핫도그), Two Two (두두핫도그) — systematized the premium format and expanded to over 1,000 locations in Korea and 200+ in the US, Japan, and Southeast Asia. The ₩4,000 Korean corn dog is no longer a street food — it is a globally exported format priced as an experience. TikTok videos of cheese pulls generated billions of views, creating international demand that further justified premium positioning."
  },
  {
    id: 'udon',
    category: 'food',
    item: 'Udon (우동)',
    context: 'One bowl, standard Korean-style udon restaurant',
    pastYear: 1990,
    trend: [1000, 1500, 2000, 3000, 4000, 5000, 6000, 8000],
    trendYears: [1990, 1994, 1999, 2003, 2007, 2011, 2016, 2024],
    fallbackInsight: "Korean-style udon rose from ₩1,000 in 1990 to ₩8,000 today: 8×. Korean 우동 is distinct from Japanese udon — generally softer, served in a lighter anchovy-based broth, and accompanied by more side dishes. It occupied the cheapest restaurant noodle tier alongside 라면 through the 1990s, commonly served at school cafeterias and neighborhood 분식점 for under ₩2,000. The 2022 Ukraine war wheat shock hit udon directly: Korean millers immediately raised flour prices 15–20%, and udon restaurants — which use fresh thick noodles with higher flour content than thin noodles — were among the first to announce ₩8,000 prices publicly. A counter-trend: Japanese udon culture (Hanamidori, imported Sanuki-style restaurants) established a premium ₩12,000–₩18,000 tier in the 2010s that pulled the category's perceived value upward. The humble school udon now costs as much as a full jjajang in 2015."
  },
  {
    id: 'convenience_sandwich',
    category: 'food',
    item: 'Convenience Store Sandwich (편의점 샌드위치)',
    context: 'Standard triangle sandwich, GS25 or CU',
    pastYear: 2005,
    trend: [1000, 1200, 1500, 1800, 2000, 2500, 3000, 3800],
    trendYears: [2005, 2008, 2010, 2012, 2015, 2018, 2021, 2024],
    fallbackInsight: "Convenience store sandwiches rose from ₩1,000 in 2005 to ₩3,800 today: 3.8×. Korean convenience stores (GS25, CU, 7-Eleven) built sophisticated fresh food manufacturing operations — central kitchens that produce thousands of sandwiches daily with standardized ingredients, cold-chain delivery to stores multiple times per day, and strict sell-by systems. This operational sophistication made Korean convenience store food quality genuinely competitive with fast casual restaurants. The business relies on continuous innovation: when egg salad became ubiquitous, chains added smoked salmon, avocado chicken, and premium bulgogi varieties — each adding ₩500–₩1,000 to the price. Packaging technology (modified atmosphere, antimicrobial wraps) added cost but extended shelf life. Korea's convenience store density is among the world's highest (one store per 1,500 people in urban areas), making competition fierce but costs amortizable. Premium 'Premium Triangle' lines now reach ₩5,000–₩6,000."
  },
  {
    id: 'makguksu',
    category: 'food',
    item: 'Makguksu (막국수)',
    context: 'One bowl, standard Gangwon-style restaurant',
    pastYear: 2000,
    trend: [5000, 6000, 7000, 8000, 9000, 10000, 12000, 15000],
    trendYears: [2000, 2004, 2007, 2010, 2013, 2016, 2020, 2024],
    fallbackInsight: "Makguksu rose from ₩5,000 in 2000 to ₩15,000 today: 3×. Gangwon Province's cold buckwheat noodles (막국수) occupy a unique position in Korean food culture — they are intrinsically tied to the experience of visiting the mountains of Chuncheon, Inje, or Sokcho. Highway rest-stop culture (고속도로 휴게소) normalized the dish for Seoul commuters driving through Gangwon on weekends. Buckwheat (메밀) is Korea's most volatile grain: grown in cool mountain climates, production is limited and yields vary significantly year to year. Import dependence on Chinese buckwheat means global weather patterns directly affect Korean makguksu prices. The dish's regional identity gave restaurants authenticity pricing power: a Gangwon-origin restaurant in Seoul charges more than a generic noodle shop. As the dish spread from regional specialty to nationwide franchise (봉평막국수, 유정막국수), standardization raised baseline quality expectations and price floors simultaneously."
  },
  {
    id: 'red_bean_bun',
    category: 'food',
    item: 'Red Bean Bun (단팥빵)',
    context: 'One piece, local bakery',
    pastYear: 1990,
    trend: [300, 400, 500, 600, 800, 1000, 1200, 1800],
    trendYears: [1990, 1994, 1999, 2003, 2007, 2011, 2016, 2024],
    fallbackInsight: "Red bean buns rose from ₩300 in 1990 to ₩1,800 today: 6×. The dan-pat-ppang predates any living Korean's memory — its roots trace to Japanese colonial-era anka-pan introduced in the early 20th century, adapted with Korean azuki red bean (팥). The transformation of Korean bakery retail is the structural story: in 1990, every neighborhood had independent bakeries charging ₩300–₩500 per item; by 2024, SPC Group's Paris Baguette (over 3,500 domestic locations) and CJ Foodville's Tous Les Jours have absorbed that market, operating under franchise agreements that include licensing fees and mandatory central kitchen sourcing. Paris Baguette's founding philosophy — 'premium Western bakery with Korean adaptations' — gradually repositioned the entire category upmarket. Azuki red bean (팥) prices rose as domestic cultivation declined and import dependency on Chinese supply chains increased; the 2021–2022 drought-related Korean red bean harvest failure sent 팥 prices up 60% in a single year. Flour (Ukraine war shock, 2022), sugar (global supply shortfall), and butter (protected by Korea's dairy system) all rose simultaneously in 2022–2023, producing the largest bakery cost shock in a decade. The ₩300 neighborhood dan-pat-ppang survives only in memory; today it costs ₩1,800 at a chain and ₩2,500–₩3,000 at an artisan bakery."
  },
  {
    id: 'tteokgalbi',
    category: 'food',
    item: 'Tteokgalbi (떡갈비)',
    context: 'One portion (2 pieces), standard Korean restaurant',
    pastYear: 2000,
    trend: [8000, 10000, 12000, 15000, 18000, 22000, 28000, 35000],
    trendYears: [2000, 2004, 2007, 2010, 2013, 2016, 2020, 2024],
    fallbackInsight: "Tteokgalbi rose from ₩8,000 in 2000 to ₩35,000 today: 4.4×. Minced and grilled beef rib — pressed into oval patties and glazed with soy-ginger marinade — originated in Joseon royal court cuisine (수라상) before becoming a specialty of Gwangju and Damyang in Jeollanam-do province. The Gwangju regional identity is central to premium positioning: restaurants marketing '담양 떡갈비' charge 20–30% more than generic versions, a provenance premium that strengthened as Korean food tourism grew. Hanwoo (한우) short rib — the traditional ingredient — carries import tariffs of approximately 40% protecting Korean domestic cattle farmers, keeping beef prices structurally high. A prize Hanwoo rib section is DNA-registered and traceable to the animal's birth farm, a traceability system introduced after BSE concerns in the mid-2000s. As Korean BBQ culture transformed from a domestic activity to a globally exported food trend, tteokgalbi crossed from a regional specialty to a fine-dining item: Michelin-starred Korean restaurants in Seoul now serve premium tteokgalbi at ₩45,000–₩80,000 per portion. The crossing of ₩35,000 for what was once a working lunch dish shocked consumers who remembered the 2000s price."
  },
  {
    id: 'galmaegi_sal',
    category: 'food',
    item: 'Galmaegisal (갈매기살)',
    context: 'One portion (200g), Korean BBQ restaurant',
    pastYear: 2005,
    trend: [8000, 10000, 12000, 15000, 18000, 22000, 25000, 30000],
    trendYears: [2005, 2008, 2010, 2012, 2015, 2018, 2021, 2024],
    fallbackInsight: "Galmaegisal rose from ₩8,000 in 2005 to ₩30,000 today: 3.75×. The pork skirt/diaphragm muscle was literally discarded or given to workers for free as late as the 1990s — butchers considered it too small and too unusual in texture to sell commercially. Discovery came through the restaurant culture of Mapo-gu: a few restaurant owners in Mangwon-dong began serving it as a specialty around 2003–2005, and the combination of chewy texture and intense flavor made it immediately popular. Television food programs on Olive Network and KBS's '한국인의 밥상' turned food discovery into a national phenomenon from 2008 onward, driving restaurant bookings in previously obscure neighborhoods. The supply constraint is biological and absolute: only approximately 200g of skirt meat is recoverable per pig, compared to 3kg+ of samgyeopsal (pork belly). As demand rose, the price per gram surpassed pork belly by 2012 — a complete reversal of the previous decade's value hierarchy. The 2010–2011 foot-and-mouth disease outbreak culled 3.3 million pigs, creating acute scarcity that permanently reset the galmaegisal price floor above ₩10,000. From a free byproduct to a premium BBQ cut in under 20 years — one of Korean food culture's most extraordinary pricing transformations."
  },
  {
    id: 'soft_tofu_bowl',
    category: 'food',
    item: 'Sundubu Set (순두부 정식)',
    context: 'Full set meal with rice and banchan, standard restaurant',
    pastYear: 2000,
    trend: [4000, 5000, 6000, 7000, 8000, 9000, 11000, 14000],
    trendYears: [2000, 2004, 2007, 2010, 2013, 2016, 2020, 2024],
    fallbackInsight: "Sundubu set meals rose from ₩4,000 in 2000 to ₩14,000 today: 3.5×. Silken tofu (순두부) is made from fresh soybean curd and has been one of the most price-stable food ingredients in Korea — the result of highly mechanized domestic production and stable soybean import relationships with the US and Brazil. Yet the full set meal price more than tripled. This gap — modest ingredient inflation, dramatic meal price inflation — is the clearest illustration of service-sector cost inflation in Korean food. A sundubu set includes hot tofu jjigae, rice, and typically 4–6 separate banchan; the labor of preparing and cleaning multiple dishes is what you primarily pay for, not the tofu itself. The Korean minimum wage rose from ₩2,840 in 2000 to ₩9,860 in 2024 (347%), and restaurant labor accounts for 30–40% of operating costs — that increase flows directly into every bowl. Commercial gas utility rates surged in 2022–2023 as Korea's LNG import costs spiked post-Ukraine invasion. The ₩5,000 'lunch special' that Yeouido office workers depended on through the 2000s crossed ₩10,000 around 2022, generating extensive media coverage as a symbol of '점심 물가' (lunchflation). At ₩14,000, the sundubu set is no longer a budget refuge — a shift with real consequences for Seoul's lowest-income workers who built meal routines around it."
  },
  {
    id: 'delivery_fee',
    category: 'food',
    item: 'Food Delivery Fee (배달료)',
    context: 'Average delivery fee per order, major platform apps',
    pastYear: 2015,
    trend: [0, 1000, 2000, 3000, 4000, 5000],
    trendYears: [2015, 2017, 2019, 2020, 2022, 2024],
    fallbackInsight: "Food delivery fees rose from ₩0 in 2015 to ₩5,000+ today — from free to a significant per-order cost in under a decade. In 2015, nearly all Korean restaurant delivery used the restaurant's own staff; the delivery cost was baked into menu prices as a fixed business expense, invisible to the consumer. Woowa Brothers launched Baemin in 2011 as a phone-order aggregation app, then pivoted to in-app ordering by 2013 with 10 million users. The initial model charged restaurants 5–10% commissions with no consumer-visible fee. Then Baemin Riders launched in 2015 — a third-party delivery network where a delivery fee line appeared on the consumer's screen for the first time. Germany's Delivery Hero acquired Woowa Brothers in December 2019 for $4 billion USD (the largest Korean internet acquisition in history), signaling that platform commissions were the extractable value. Post-acquisition, commission structures tightened: restaurants faced mandatory 'open list' fee tiers of 6.8–15% on top of delivery fees. The 2020–2021 delivery worker deaths from overwork (과로사) — five riders died in a single week in January 2021 — triggered mandatory rest requirements and minimum earnings guarantees that raised the direct cost per delivery. By 2024, a single order incurs an average ₩4,000–₩5,000 visible delivery fee plus ₩3,000–₩5,000 in platform commission baked into menu prices, making delivery 20–30% more expensive than dine-in for the same meal."
  },

  // ── TRANSPORT (5 more) ───────────────────────────────────────
  {
    id: 'airport_parking',
    category: 'transport',
    item: 'Incheon Airport Parking (인천공항 주차)',
    context: 'Short-term parking lot, per day',
    pastYear: 2001,
    trend: [10000, 12000, 15000, 18000, 20000, 23000, 25000, 28000],
    trendYears: [2001, 2005, 2008, 2011, 2014, 2017, 2020, 2024],
    fallbackInsight: "Incheon Airport daily parking rose from ₩10,000 in 2001 to ₩28,000 today: 2.8×. Incheon International Airport opened in March 2001 as Korea's largest single infrastructure project since the 1988 Seoul Olympics — a deliberate national investment in becoming Northeast Asia's premier aviation hub, replacing the aging Gimpo Airport. Initial parking fees were set conservatively to avoid sticker-shock for travelers unfamiliar with the new airport and its long-term parking complex. Incheon Airport Corporation (인천국제공항공사) is listed on the Korea Stock Exchange and must generate operating surplus — unlike public highway or rail operators that can run deficits covered by city tax revenue. Terminal 2 opened in January 2018 specifically for the 2018 PyeongChang Winter Olympics and added 18 million annual passenger capacity alongside 12,000 new parking spaces. A distinctive competitive dynamic constrains airport pricing: dozens of private near-airport parking services operate at ₩8,000–₩15,000/day with shuttle buses to terminals, creating genuine downward price pressure that the official airport lot cannot fully ignore. The ₩28,000 short-term rate reflects what the airport judges is the maximum premium travelers will accept over private alternatives given the convenience advantage of on-campus parking. Long-term parking (7일+ stays) is priced at ₩7,000–₩9,000/day — closer to private lot rates — because duration-sensitive travelers have more willingness to comparison-shop."
  },
  {
    id: 'car_inspection',
    category: 'transport',
    item: 'Vehicle Safety Inspection (자동차 정기검사)',
    context: 'Standard passenger car, authorized inspection center',
    pastYear: 2000,
    trend: [17000, 20000, 23000, 26000, 30000, 35000, 40000, 45000],
    trendYears: [2000, 2004, 2007, 2010, 2013, 2016, 2020, 2024],
    fallbackInsight: "Vehicle safety inspection fees rose from ₩17,000 in 2000 to ₩45,000 today: 2.6×. Korea's mandatory inspection system (자동차 정기검사) requires all registered vehicles to pass safety and emissions tests at intervals of 2–4 years, administered by the Korea Traffic Safety Authority (한국교통안전공단, KOTSA) through a network of authorized centers. The examination scope expanded substantially over two decades: the 2000 inspection checked brakes, lights, and basic emissions; by 2024 the protocol includes OBD-II diagnostic scanning, ADAS (Advanced Driver Assistance System) functionality checks, fine particulate matter emissions testing aligned with Euro 6 standards, and vehicle identity verification against national insurance and ownership databases. Each expansion required inspection centers to invest in new equipment — emissions analyzers, dynamometers, OBD scanners — capital costs recovered through fee increases. The Ministry of Land, Infrastructure and Transport (국토교통부) sets fee ceilings, keeping inspections below free-market pricing while still allowing cost recovery. Electric vehicles introduced an entirely new inspection protocol: no emissions to test, but mandatory battery state-of-health assessment, charging port integrity checks, and high-voltage safety inspections add complexity as Korea's EV fleet approaches 500,000 vehicles. The 2.6× increase over 24 years is one of the lowest in this game — evidence that government-regulated fee schedules genuinely constrain what would otherwise be a higher market price for the expanded scope of service."
  },
  {
    id: 'premium_express_bus',
    category: 'transport',
    item: 'Premium Express Bus (우등버스)',
    context: 'Seoul–Busan, one way, Kobus premium seat',
    pastYear: 1995,
    trend: [12000, 15000, 18000, 22000, 25000, 27000, 30000, 36000],
    trendYears: [1995, 1999, 2003, 2007, 2010, 2014, 2019, 2024],
    fallbackInsight: "Premium express bus (Seoul–Busan) rose from ₩12,000 in 1995 to ₩36,000 today: 3×. The 우등 (premier class) express bus was introduced in 1987 with wider seats and fewer passengers per vehicle as a deliberate pricing tier above the standard bus, designed to compete with the Saemaul limited express train. This positioning collapsed after KTX launched in April 2004: the Seoul–Busan journey that took 4.5 hours by bus was now achievable in 2 hours 40 minutes by train. Express bus ridership on the Gyeongbu route fell 40% in the first year after KTX opened. Kobus (the state consortium operating Korea's express bus network) responded by upgrading the premium product aggressively — 2+1 seating (2 seats on one side, 1 on the other), on-board screens, USB charging, and eventually leather headrests — to retain segments where KTX has fewer options: late-night departures, mid-route stops, travelers without convenient rail station access. The full Seoul–Busan expressway route includes approximately ₩18,000 in highway tolls per vehicle — a significant fixed cost that the bus must recover through fares. Driver wages grew under Korea's extended work-hour regulations, and fuel tracked global oil price cycles. Despite KTX dominance, the premium bus survives as Korea's most economical 우등 overnight option: a ₩36,000 seat that departs at 11pm and arrives at 4am — a niche KTX cannot serve as efficiently."
  },
  {
    id: 'daegu_subway',
    category: 'transport',
    item: 'Daegu Subway Fare (대구 지하철)',
    context: 'Base fare, standard adult single journey',
    pastYear: 1997,
    trend: [400, 500, 600, 700, 900, 1100, 1250, 1500],
    trendYears: [1997, 2000, 2003, 2007, 2010, 2013, 2018, 2024],
    fallbackInsight: "Daegu subway fares rose from ₩400 in 1997 to ₩1,500 today: 3.75×. Daegu Metro Line 1 opened in November 1997 as Korea's third urban rail system after Seoul and Busan — a major milestone for Korea's third-largest city and the economic hub of Gyeongsang Province. The Daegu subway exists in the permanent shadow of the February 18, 2003 subway fire: 192 people died when an arsonist set fire to a train at Jungangno Station, smoke filling tunnels for hours due to inadequate ventilation and emergency response failures. The psychological and operational aftermath was immense — ridership dropped 30% for years, and the mandatory safety renovation program (fire-retardant materials, improved ventilation, platform screen doors) mandated across all Korean metro systems cost Daegu Metro billions. The resulting operating deficit has been chronic: even by 2023, Daegu Metro's daily ridership had not returned to pre-fire levels, compounded by a population decline from 2.5 million to 2.4 million. The 2024 fare increase to ₩1,500 aligned Daegu with Seoul and Busan under a national transit pricing standardization policy — but Daegu Metro's operating deficit as a percentage of revenue remains higher than Seoul's, since fewer riders share the same fixed infrastructure costs. This mathematical reality means Daegu citizens pay proportionally more in tax subsidy per subway ride than any other major Korean city."
  },
  {
    id: 'ebike',
    category: 'transport',
    item: 'Electric Bicycle (전기자전거)',
    context: 'Entry-level e-bike, standard brand',
    pastYear: 2012,
    trend: [500000, 550000, 600000, 650000, 700000, 800000, 900000, 1000000],
    trendYears: [2012, 2014, 2016, 2017, 2019, 2020, 2022, 2024],
    fallbackInsight: "Entry-level e-bikes rose from ₩500,000 in 2012 to ₩1,000,000 today: 2×. Korean e-bikes entered the market as niche tools used primarily by older commuters and agricultural workers — virtually invisible in Seoul's urban landscape. The 2009 Four Major Rivers Restoration Project (4대강 사업) created thousands of kilometers of dedicated cycling paths nationwide, providing the infrastructure precondition for recreational cycling adoption. Lithium-ion battery costs — the dominant e-bike component — actually fell from approximately ₩300,000/kWh in 2012 to ₩100,000/kWh by 2020, yet retail prices rose because brand margins expanded to absorb the COVID-era demand surge. In 2020–2021, Korea's bicycle market grew over 40% year-on-year as COVID restrictions shifted commuters to two-wheelers; new Chinese brands (Yadea, Fiido) entered at ₩300,000–₩500,000, establishing a budget tier while Korean brands (삼천리, 알톤) moved upmarket. The Ministry of Environment's e-bike subsidy program (보조금 최대 ₩600,000 per unit) created a peculiar market dynamic: manufacturers priced models to maximally capture the subsidy ceiling, with the post-subsidy consumer price clustering around ₩600,000–₩700,000 regardless of underlying hardware cost. This government-subsidy-induced pricing floor — where subsidies inflate rather than reduce effective prices — is a textbook example of support programs inadvertently establishing new price anchors above what the market would otherwise bear."
  },

  // ── CULTURE (15 more) ────────────────────────────────────────
  {
    id: 'dokseosil',
    category: 'culture',
    item: 'Study Room Membership (독서실)',
    context: 'Monthly fixed-seat membership, standard facility',
    pastYear: 1995,
    trend: [30000, 40000, 50000, 60000, 70000, 80000, 100000, 130000],
    trendYears: [1995, 1999, 2003, 2007, 2010, 2014, 2019, 2024],
    fallbackInsight: "Study room memberships (독서실) rose from ₩30,000 in 1995 to ₩130,000/month today: 4.3×. The dokseosil is a Korean institution unique in the world — a commercial building of individual study carrels, rented monthly by high school students and university exam-takers, where absolute silence is enforced and sustained concentrated study is the sole purpose. The format emerged in the 1970s during Korea's intensifying academic-credential competition and became ubiquitous with the suyeong (수능, CSAT) era from 1993 onward. Geography creates extreme price stratification: the Daechi-dong district in Gangnam-gu hosts Korea's densest concentration of premium study facilities, where monthly fees exceed ₩200,000 and location itself signals academic seriousness — proximity to Daechi's top hagwons is a selling point. Commercial rents in Daechi-dong rose 5× between 2000 and 2024, directly flowing into facility costs. The 2010s product evolution from basic carrel to 'smart study café' (스터디카페) transformed the category: ergonomic furniture, adjustable lighting systems, background white-noise management, premium coffee machines, and individual privacy dividers justified escalation from ₩30,000 to ₩150,000+/month. Korea's chronically falling birth rate is reducing the student population — fewer potential customers — yet prices continue rising as the remaining students face intensifying academic pressure, making demand structurally inelastic. The dokseosil is where Korean education anxiety becomes a monthly household expense."
  },
  {
    id: 'coin_karaoke',
    category: 'culture',
    item: 'Coin Karaoke (코인노래방)',
    context: 'Per song, standard booth',
    pastYear: 2012,
    trend: [300, 400, 500, 600, 800, 1000, 1200],
    trendYears: [2012, 2014, 2016, 2017, 2019, 2022, 2024],
    fallbackInsight: "Coin karaoke prices rose from ₩300/song in 2012 to ₩1,200 today: 4× in 12 years. The format was invented in Korea around 2010 as a response to a market gap: traditional noraebangs charged by the hour (minimum ₩10,000 for 1–2 people), pricing out solo singers wanting only a few songs. Coin karaoke — a standalone booth the size of a phone booth, accepting contactless payment per song — democratized karaoke access and became immediately popular with the growing 혼밥 (dining alone) / 혼행 (traveling alone) generation comfortable with solitary leisure. The format spread from Hongdae and university districts across Korea's commercial areas, then expanded to Japan, Southeast Asia, and beyond. Commercial real estate is the primary cost driver: booths are concentrated in high-traffic shopping malls and entertainment districts where rents rose 3–5× since 2012. Sound insulation (each booth requires acoustic treatment), equipment maintenance (microphones, speakers, touchscreens replaced every 1–2 years), and music licensing fees (KMCA collects royalties per song played) added ongoing costs that have compounded. At ₩1,200 per song and an average 3–4 songs per visit, coin karaoke now costs ₩3,600–₩4,800 per session — only ₩5,000–₩6,000 less than a standard norebang room. The price differential that was its core value proposition has significantly closed."
  },
  {
    id: 'womens_haircut',
    category: 'culture',
    item: "Women's Haircut (여성 미용실)",
    context: 'Basic cut and blow-dry, standard local salon',
    pastYear: 1995,
    trend: [8000, 10000, 13000, 17000, 22000, 28000, 35000, 45000],
    trendYears: [1995, 1999, 2003, 2007, 2010, 2014, 2019, 2024],
    fallbackInsight: "Women's haircuts rose from ₩8,000 in 1995 to ₩45,000 today: 5.6×. Hairdressing is among the most labor-pure services in any economy — every minute is skilled human time that cannot be automated, compressed, or outsourced. Minimum wages rising from ₩2,840 in 1995 to ₩9,860 in 2024 (347%) flow almost directly into service pricing. Commercial real estate near subway exits — where most standard salons locate — rose substantially as Korean urbanization densified and prime pedestrian zones became increasingly valuable. The industry underwent dramatic structural fragmentation: at one extreme, discount chain salons (홍익일달러커트, Hairshop24) built assembly-line cutting models at ₩5,000–₩9,000 that commoditized the basic haircut; at the other, Apgujeong and Cheongdam designer salons charge ₩50,000–₩200,000 per cut based entirely on the designer's individual reputation. The middle-tier neighborhood beauty salon (미용실) was squeezed from both directions and raised prices to ₩35,000–₩50,000 to maintain viable economics. Korean salon techniques — volume perms, C-curl treatments, rebonding, balayage coloring — became internationally benchmarked as Korean beauty (K-beauty) went global, raising professional expectations and training investment. The expectation that a Korean haircut includes consultation, blow-dry, and styling rather than just cutting has lengthened average service time and justified higher prices. The ₩8,000 cut of 1995 was a trim; the ₩45,000 cut of 2024 is a full professional styling service."
  },
  {
    id: 'massage',
    category: 'culture',
    item: 'Body Massage (마사지)',
    context: '60-minute full-body massage, standard parlor',
    pastYear: 2000,
    trend: [25000, 30000, 35000, 40000, 50000, 60000, 70000, 90000],
    trendYears: [2000, 2004, 2007, 2010, 2013, 2016, 2020, 2024],
    fallbackInsight: "Full-body massage (60 minutes) rose from ₩25,000 in 2000 to ₩90,000 today: 3.6×. Massage entered Korean mainstream wellness culture in the late 1990s as awareness of stress-related health issues grew in a corporate culture where working overtime (야근) was a near-universal expectation and annual vacation usage averaged only 50–60% of entitlement. Therapist certification requirements established by the Ministry of Health and Welfare created genuine credential barriers: licensed massage therapists (안마사 자격증) require hundreds of training hours, limiting labor supply and supporting wage floors well above minimum wage. Commercial real estate in prime wellness locations — Gangnam, Mapo, Hongdae — rose dramatically as the category moved upmarket. The 2010s brought franchise systemization: brands like Lalavla and Relaxation Park built standardized protocols that justified premium pricing through quality consistency. Korean corporate health insurance (단체보험) increasingly reimburses therapeutic massage, expanding the paying consumer base. Post-COVID anxiety-driven wellness spending was pronounced: Korea's massage industry grew 15%+ in 2022–2023 as consumers emerging from pandemic restrictions invested heavily in physical recovery. The illegal massage underground market (불법 성인 마사지) paradoxically supports legitimate pricing — operators emphasize professional credentials and legal compliance to differentiate, justifying higher prices as a quality signal. The ₩90,000 session is now a normalized monthly expense for urban middle-class Korean adults."
  },
  {
    id: 'vet_visit',
    category: 'culture',
    item: 'Vet Consultation (동물병원 진료비)',
    context: 'Basic exam fee, standard urban vet clinic',
    pastYear: 2000,
    trend: [10000, 12000, 15000, 20000, 25000, 35000, 45000, 60000],
    trendYears: [2000, 2004, 2007, 2010, 2013, 2016, 2020, 2024],
    fallbackInsight: "Vet consultation fees rose from ₩10,000 in 2000 to ₩60,000 today: 6×. Korea's pet population grew from approximately 3 million in 2000 to over 15 million companion animals by 2024 — one of the most dramatic demographic shifts of the past generation. The sociological driver is Korea's fertility collapse: with a total fertility rate of 0.72 in 2023 (the lowest ever recorded by any country), younger Koreans increasingly invest in companion animals as primary care relationships. The Ministry of Agriculture changed the official Korean term from '애완동물' (pet, literally 'toy animal') to '반려동물' (companion animal) in 2007, a government-sanctioned reframing that legitimized spending at human-family levels. Veterinary school enrollment grew slowly relative to the pet population explosion, creating specialist shortages: animal dermatologists, cardiologists, and oncologists command consultation fees of ₩150,000–₩300,000. Diagnostics available in Korean vet clinics expanded to match human medicine: MRI scanning for dogs costs ₩800,000+, oncology treatments exceed ₩5,000,000 per course, and orthopedic implants from the same manufacturers as human devices are now standard. Korean pet insurance penetration remains below 5% despite multiple policy launches since 2007 — most costs are out-of-pocket. The basic consultation fee gap between human (₩5,000 with national health insurance) and animal (₩60,000 uninsured) is one of the starkest economic inequities in Korean healthcare: humans are structurally subsidized; animals are not."
  },
  {
    id: 'swimming_lessons',
    category: 'culture',
    item: 'Swimming Lessons (수영 강습)',
    context: 'Monthly group lessons, public sports center',
    pastYear: 2000,
    trend: [35000, 45000, 55000, 65000, 75000, 85000, 100000, 130000],
    trendYears: [2000, 2004, 2007, 2010, 2013, 2016, 2020, 2024],
    fallbackInsight: "Swimming lessons rose from ₩35,000/month in 2000 to ₩130,000 today: 3.7×. Korea's public sports center (국민체육센터) swimming pool network was built from the late 1980s onward as an Olympic legacy — the government subsidized community sports infrastructure after the 1988 Seoul Games under the 국민생활체육 (National Life Sports) initiative, pricing programs well below cost. A standard 25–50m pool requires year-round heating, daily chemical treatment, continuous filtration, lifeguard staffing, and certified instructor payroll — costs easily reaching hundreds of millions of won annually. Government subsidy covered the gap, making swimming lessons genuinely affordable. Budget pressures and the 2022 energy crisis significantly raised operating costs: heating a 27°C pool year-round is among the most energy-intensive functions in any public facility, and Korea's LNG import costs surged 150%+ in 2022 following Russia's Ukraine invasion. Ministry of Culture, Sports and Tourism revised subsidy formulas, requiring local governments to cover more of the operating deficit — which translated directly into fee increases. Pandemic-era pool closures (2020–2021) triggered a structural demand surge: Korean adults returned to indoor exercise in unprecedented numbers post-COVID after nearly two years of restricted access, encountering a reduced supply because some public pools permanently closed due to deferred maintenance costs during COVID. The collision of fewer available facilities and heightened demand produced the sharpest fee increases of the past 20 years in 2022–2023."
  },
  {
    id: 'piano_academy',
    category: 'culture',
    item: 'Piano Academy (피아노 학원)',
    context: 'Monthly fee, group lessons included, standard academy',
    pastYear: 1995,
    trend: [40000, 55000, 70000, 85000, 100000, 120000, 140000, 160000],
    trendYears: [1995, 1999, 2003, 2007, 2010, 2014, 2019, 2024],
    fallbackInsight: "Piano academy fees rose from ₩40,000/month in 1995 to ₩160,000 today: 4×. Piano lessons occupy a unique position in Korea's private education ecosystem: not tied to university entrance exams, yet considered so essential to a 'well-rounded child' that they function as a semi-mandatory childhood experience for middle-class families. This reflects Confucian educational philosophy — music as character development rather than career training — mediated through 20th-century classical music culture. The 1988 Seoul Olympics famously featured Korean pianist Kun-Woo Paik, and the following two decades produced world-class Korean classical pianists (Seong-Jin Cho, 2015 Chopin Competition winner; Sunwoo Yekwon, 2017 Van Cliburn Competition winner) who validated the national piano investment narrative. Academy rents in residential areas near elementary schools — the primary enrollment catchment — rose substantially as Korean land values in school-adjacent zones climbed. Certified piano teachers command wages above general service-sector rates due to conservatory training requirements; the College Scholastic Ability Test does not include piano performance, but music high school (예고) admission — a prestigious alternative educational pathway — does, sustaining elite-tier demand independent of exam pressure. Korea's falling birth rate (total fertility rate: 0.72 in 2023) is the primary structural threat: fewer children per neighborhood reduce potential enrollment, forcing surviving academies to raise per-student fees to maintain revenue. The monthly ₩160,000 now represents roughly 1.5% of the median household income — a non-trivial recurring expense paid for a childhood activity with no direct economic return."
  },
  {
    id: 'small_theater',
    category: 'culture',
    item: 'Small Theater Play (소극장 연극)',
    context: 'Standard ticket, Daehangno or equivalent venue',
    pastYear: 2000,
    trend: [8000, 10000, 12000, 15000, 18000, 22000, 28000, 40000],
    trendYears: [2000, 2004, 2007, 2010, 2013, 2016, 2020, 2024],
    fallbackInsight: "Small theater play tickets rose from ₩8,000 in 2000 to ₩40,000 today: 5×. Daehangno (대학로, 'University Street') in Seoul's Jongno-gu is Korea's historic theater district — named for the Seoul National University campus that occupied the area until the university relocated to Gwanak-gu in 1975, after which vacated space was gradually converted into 200+ small theater venues that cluster there today. The theater ecosystem operates on a troubling economics: Korean actors earn some of the lowest wages in the creative industries — the Korean Theatre Association has documented average actor monthly incomes of ₩700,000–₩1,200,000 — while ticket prices have risen faster than general inflation. The disconnect has two explanations. First, venue rents in Daehangno rose sharply as the district's cultural cachet attracted restaurants, cafés, and commercial tenants bidding up real estate that theaters depend on. Second, marketing transformation raised costs enormously: productions in 2000 relied on posted flyers and word of mouth; by 2024, SNS advertising, influencer ticket giveaways, and Interpark/YES24 platform commissions (typically 10–15% of face value) add ₩4,000–₩6,000 per ticket in distribution costs. Arts Council Korea (한국문화예술위원회) funding for small theater productions has not grown proportionally with cost inflation, increasing the burden each ticket must bear. A production breaking even at ₩40,000 tickets with 60% occupancy could have operated at ₩8,000 in 2000 — the entire cost structure transformed while actor wages barely moved."
  },
  {
    id: 'manhwa_room',
    category: 'culture',
    item: 'Manhwa Room (만화방)',
    context: 'Per-hour rental, standard urban manhwa café',
    pastYear: 1995,
    trend: [500, 700, 1000, 1500, 2000, 2500, 3000, 4000],
    trendYears: [1995, 1999, 2003, 2007, 2010, 2014, 2019, 2024],
    fallbackInsight: "Manhwa room (만화방) hourly rates rose from ₩500 in 1995 to ₩4,000 today: 8×. The 만화방 — a shop renting physical comics by the hour, typically doubling as a ramen-and-snack hangout — was Korea's original social third space for teenagers and young adults from the 1970s through the 1990s. At its peak in the mid-1990s, Seoul alone had thousands of manhwa rooms; the format was how most Koreans consumed serialized comics from masters like Huh Young-man (식객, 바람의 파이터) and Lee Hyun-se (공포의 외인구단). The digital disruption was sequential and total: free online scanlations (2001–2006), then Naver Webtoon's free vertical-scroll format (launched 2004, reaching 10 million monthly active users by 2010), then smartphone reading (2011+) destroyed the economic model entirely. By 2024, fewer than 200 manhwa cafés operate nationwide — a 95%+ decline from the peak. The survivors have repositioned as nostalgia destinations and cultural experiences: curated physical collections, vintage cabinet aesthetics, traditional wooden furniture, and ramen delivery distinguish them from the original utilitarian reading shops. This repositioning as a premium nostalgic experience is precisely what enables the survivors to charge ₩4,000/hour — 8× the 1995 rate — for what is fundamentally the same service. The 만화방 that remains is not competing with webtoons on content access; it is selling the memory of how an entire generation of Koreans used to spend their afternoons. Physical presence in a curated space is what costs ₩4,000, not the comics themselves."
  },
  {
    id: 'golf_green_fee',
    category: 'culture',
    item: 'Public Golf Green Fee (퍼블릭 골프장)',
    context: 'Weekday 18-hole green fee, standard public course',
    pastYear: 2000,
    trend: [70000, 80000, 90000, 100000, 120000, 140000, 180000, 250000],
    trendYears: [2000, 2004, 2007, 2010, 2013, 2016, 2020, 2024],
    fallbackInsight: "Public golf green fees rose from ₩70,000 in 2000 to ₩250,000 today: 3.6×. Korean golf has undergone one of the most dramatic cultural transformations of any sport in modern Korean history. Through the 1990s it was purely an executive-class activity — company-provided golf memberships were a standard perk for 부장급 (department head) and above. The structural supply constraint is fundamental: Korea is 70% mountainous, leaving limited flat land for golf courses, and environmental regulations (particularly in water catchment zones) make new course approvals politically contentious. Korea had approximately 470 public and semi-public courses in 2020 — a figure that grew only marginally despite soaring demand, since course construction requires 5–10 years from planning to opening. COVID-19 was the decisive inflection point. In 2020–2021, all overseas travel ceased; Koreans who had routinely golfed in Japan, Jeju, and Southeast Asia redirected that budget domestically. The Korea Golf Association recorded the largest single-year jump in rounds played in history in 2020 (+18%), and courses implemented dynamic pricing — raising weekend, holiday, and morning-slot rates 30–50% above base. A generational identity shift simultaneously occurred: social media visibility of golf aesthetics, K-pop celebrity participation, and the 2030 demographic's appetite for premium outdoor experiences combined to make golf mainstream for the first time. New courses opening in 2023–2024 have begun easing outlying area prices — but Gyeonggi-do weekend green fees remain ₩200,000–₩280,000 with no structural reversal in sight."
  },
  {
    id: 'badminton_court',
    category: 'culture',
    item: 'Badminton Court Rental (배드민턴장)',
    context: 'Per hour, standard indoor badminton facility',
    pastYear: 2000,
    trend: [5000, 6000, 7000, 8000, 10000, 12000, 15000, 20000],
    trendYears: [2000, 2004, 2007, 2010, 2013, 2016, 2020, 2024],
    fallbackInsight: "Badminton court rentals rose from ₩5,000 in 2000 to ₩20,000/hour today: 4×. Badminton is Korea's most broadly participated recreational racquet sport — the Korean Badminton Association estimates over 6 million regular recreational players, far exceeding tennis or squash, spread across all age groups and income levels. The sport's primary social structure in Korea is the 동호회 (sports club): groups of 10–30 members meeting weekly and booking courts in 2-hour blocks, sharing the hourly cost. Indoor facility requirements are stringent: a standard court (13.4m × 6.1m) needs 9m+ ceiling clearance, controlled ventilation to prevent air currents that affect shuttlecock flight, and specialized non-reflective flooring — requirements that constrain available spaces in densely built Korean commercial districts. Badminton-specific lighting (1,000+ lux, glare-free) runs high-wattage systems for 6–8 hours daily; the 2022 energy crisis hit indoor sports facilities particularly hard. A uniquely Korean policy factor explains the historically low prices: the government's '생활체육시설' (Living Sports Ground) program heavily subsidized indoor badminton centers from the 1990s through the 2010s, keeping fees artificially below cost. As subsidy periods expired and facilities aged past their supported phase, rents and maintenance rose to market rates. COVID-era demand for low-contact, socially distanced exercise (badminton is naturally distanced across the net) created strong demand precisely when operators were free to reprice after years of subsidy-constrained pricing."
  },
  {
    id: 'tennis_court',
    category: 'culture',
    item: 'Tennis Court Rental (테니스 코트)',
    context: 'Per hour, standard public or private court',
    pastYear: 2000,
    trend: [8000, 10000, 12000, 14000, 16000, 20000, 28000, 40000],
    trendYears: [2000, 2004, 2007, 2010, 2013, 2016, 2020, 2024],
    fallbackInsight: "Tennis court rentals rose from ₩8,000 in 2000 to ₩40,000/hour today: 5×. Korean tennis held a distinct class identity from its introduction in the 1970s until the 2020s: initially confined to elite recreation clubs, then gradually democratized through subsidized public courts in the 1990s, but still primarily associated with corporate executives and middle-aged professionals. The COVID-19 inflection was sudden and dramatic. When restaurants, gyms, noraebangs, and indoor social venues closed or restricted in 2020, tennis — played outdoors with physical distancing implicit in the sport — emerged as one of the few socially acceptable leisure activities. Young Koreans (MZ generation) discovered tennis en masse in 2020–2021: the aesthetically pleasing sportswear culture (Lacoste, Fila, Nike tennis lines), the social-media-photogenic nature of the court, and visible celebrity participation collectively triggered a generational adoption. Seoul public tennis courts — operated by district governments at subsidized rates of ₩5,000–₩8,000/hour before 2020 — saw booking queues stretch to months overnight. The Seoul Metropolitan Government booking system crashed from demand traffic multiple times in 2021. Private tennis clubs, observing the demand surge, raised hourly rates from ₩15,000 to ₩35,000–₩50,000 and introduced membership entrance fees previously unknown. Between supply constraints (Seoul has approximately 300 public tennis courts for 10 million residents) and a genuine generational cultural phenomenon, tennis became one of the fastest-repricing services in Korean leisure history — a 5× price increase achieved within just 20 years."
  },
  {
    id: 'arcade',
    category: 'culture',
    item: 'Arcade Game Credit (오락실)',
    context: 'One credit/token, standard urban arcade',
    pastYear: 1990,
    trend: [100, 200, 300, 500, 500, 500, 1000, 1500],
    trendYears: [1990, 1995, 2000, 2005, 2010, 2015, 2019, 2024],
    fallbackInsight: "Arcade game credits rose from ₩100 in 1990 to ₩1,500 today: 15× — among the highest inflation multiples of any entertainment item in this game. The Korean arcade (오락실) followed a lifecycle unique in entertainment history. Phase 1 (1985–1999): explosive growth around imported Japanese arcade hardware (Capcom Street Fighter, SNK King of Fighters, Konami Dance Dance Revolution). The ₩100 credit was calibrated to match the 100-won coin — a child's pocket-money unit — and arcade operators numbered over 25,000 nationwide by the early 1990s. Phase 2 (2000–2010): near-total destruction. Home consoles (PlayStation, GameBoy), widespread internet (StarCraft in PC cafés), and moral panics over arcade gambling games collapsed the industry. Over 80% of Korean arcades closed in this decade; the 게임산업진흥법 (Game Industry Promotion Act, 2006) required age verification and restricted prize-dispensing machines, adding compliance overhead. Phase 3 (2010–present): reinvention as premium boutique experience. Surviving arcades pivoted to rhythm games (Pump It Up — a Korean innovation — DDR, DJMAX Respect), crane/claw machines (인형뽑기), and Japanese medal games. These formats require expensive Japanese hardware (Konami and Taito machines cost ₩5,000,000–₩20,000,000 each), meticulous maintenance, and high-traffic prime commercial rents in Hongdae and Sinchon to attract the nostalgic 20s–30s demographic willing to pay ₩1,500 per credit for a premium entertainment experience that simply cannot exist at ₩100."
  },
  {
    id: 'book_cafe',
    category: 'culture',
    item: 'Book Café Entry (북카페)',
    context: 'Entry fee includes one drink, standard book café',
    pastYear: 2010,
    trend: [6000, 7000, 8000, 9000, 10000, 12000, 14000],
    trendYears: [2010, 2013, 2015, 2017, 2019, 2022, 2024],
    fallbackInsight: "Book café entry fees rose from ₩6,000 in 2010 to ₩14,000 today: 2.3×. The 북카페 emerged around 2008–2010 as a hybrid third space combining the public library, specialty coffee shop, and quiet workspace — designed to serve Korea's study-obsessed culture with premium amenities unavailable in public libraries (no noise restrictions, high-quality coffee, extended opening hours, curated aesthetic). The category distinguished itself through cultural positioning: visiting a book café signals an identity as a reader and creative professional, appealing to the 독서 (reading) culture that Korean publishing and educational policy promotes. Early book cafés in Sangsu-dong, Seochon, and Mapo grew from individual entrepreneurs combining passion for books with commercial logic. By 2016, franchise concepts (Books&Life, Reads) had emerged, raising overhead through standardized fit-outs and brand licensing fees. Specialty coffee's price escalation is embedded in the entry fee: the included beverage progressed from basic drip coffee to specialty pour-over or espresso-based drinks as consumer expectations rose, adding ₩2,000–₩4,000 in inherent cost. Seongsu-dong's extraordinary gentrification cycle from 2019–2024 — the district transformed from a light-industrial zone into Seoul's most desirable cultural destination — doubled commercial rents for book cafés that had established themselves in the neighborhood before the wave. At ₩14,000, the book café experience (typically 2–3 hours with one premium beverage and unlimited book access) competes directly with a Starbucks 3-hour study session — and wins on atmosphere and literary identity, not on price."
  },

  // ── TECH (15 more) ───────────────────────────────────────────
  {
    id: 'digital_camera',
    category: 'tech',
    item: 'Digital Camera (디지털카메라)',
    context: 'Entry-level point-and-shoot, standard brand',
    pastYear: 2003,
    trend: [300000, 250000, 200000, 150000, 120000, 100000, 80000, 70000],
    trendYears: [2003, 2006, 2008, 2010, 2012, 2015, 2019, 2024],
    fallbackInsight: "Entry-level digital cameras fell from ₩300,000 in 2003 to ₩70,000 today: a 77% drop. The story has two distinct acts. Act 1 (2003–2012): technological deflation. Sony, Canon, Casio, and Samsung Digimax competed fiercely on megapixel counts and form factor; CMOS sensor manufacturing scaled globally; each generation delivered more pixels at a lower price. The 4MP camera of 2003 (₩300,000) became the 12MP camera of 2009 (₩150,000), then the 16MP camera of 2012 (₩80,000). Act 2 (2012–present): smartphone destruction. The iPhone 4S (2011) was widely recognized as the tipping point where smartphone camera quality matched low-end point-and-shoot cameras. Samsung's Galaxy S4 (2013) completed the disruption in the Korean market specifically — Samsung's simultaneous dominance of both camera and smartphone manufacturing made the comparison internally visible and commercially decisive. The Korean point-and-shoot market, once one of the largest in Asia, collapsed 80%+ by 2017. Samsung exited the dedicated camera business entirely by 2015. Surviving cameras serve either children (₩30,000–₩70,000 toy cameras), the film photography revival (analog, 2019–present), or the Gen Z 'aesthetic vlog camera' trend (Sony ZV-1 at ₩500,000+). The ₩70,000 digital camera of 2024 performs below any flagship smartphone camera — it survives on simplicity and familiar form factor, not photographic quality. The entire category that built Sony and Canon's consumer electronics businesses nearly ceased to exist within a single decade."
  },
  {
    id: 'usb_drive',
    category: 'tech',
    item: 'USB Flash Drive 16GB (USB 메모리)',
    context: 'Standard brand, 16GB capacity',
    pastYear: 2007,
    trend: [50000, 30000, 15000, 8000, 5000, 3000, 2500, 2000],
    trendYears: [2007, 2009, 2011, 2013, 2015, 2018, 2021, 2024],
    fallbackInsight: "16GB USB flash drives fell from ₩50,000 in 2007 to ₩2,000 today: a 96% price collapse — the most extreme deflation of any item in this game. The flash memory revolution was driven by Samsung's and SK Hynix's massive NAND investment cycles: between 2007 and 2015, Samsung alone invested over $35 billion in NAND flash production capacity, with each technology generation (SLC → MLC → TLC → QLC) dramatically increasing bits per silicon wafer while reducing cost per gigabyte. In 2007, a 16GB flash drive stored approximately 4,000 digital photos — a genuinely significant capacity representing weeks of photography. By 2014, smartphone cameras were generating 50GB+ of data monthly, making 16GB a minimum baseline rather than a premium capacity. The Thailand floods of October 2011 — which destroyed factories producing 40% of global hard drive output — paradoxically accelerated flash adoption by making HDD supply unreliable, shifting demand toward flash-based storage. Brandless Chinese flash drives entered Korean markets via Gmarket and Coupang from 2012 at prices domestic brands could not match, eliminating margins at every capacity tier. Cloud storage (Naver MYBOX offering 30GB free since 2015, Google Drive, iCloud) then eroded demand for physical flash storage entirely for most use cases. The ₩2,000 USB drive of 2024 is primarily a corporate marketing giveaway — literally free with a company logo printed on it. The entire value chain from manufacturing to retail has been compressed to the cost of the plastic casing and branding, with the storage itself essentially free."
  },
  {
    id: 'ssd_500gb',
    category: 'tech',
    item: 'SSD 500GB (SSD 저장장치)',
    context: 'Internal 2.5" SATA SSD, standard brand',
    pastYear: 2013,
    trend: [200000, 140000, 100000, 70000, 50000, 40000, 30000, 25000],
    trendYears: [2013, 2015, 2016, 2017, 2018, 2020, 2022, 2024],
    fallbackInsight: "500GB SSDs fell from ₩200,000 in 2013 to ₩25,000 today: an 87.5% price collapse in 11 years. The SSD story is inseparable from Korea's semiconductor dominance. Samsung introduced its first mass-market consumer SATA SSD (840 series) in 2012 and within 24 months had captured 30%+ of the global SSD market through 3D V-NAND technology — a vertical stacking architecture that dramatically increased storage density per wafer. SK Hynix entered the SSD market aggressively from 2018, creating domestic competition that accelerated Korean market price declines specifically. NAND flash oversupply cycles — the semiconductor industry's boom-bust rhythm — periodically dropped SSD prices faster than demand could absorb, particularly in 2018–2019 and 2022–2023 when factory capacity additions outpaced consumer take-up. The 2021 adoption of Windows 11 and Apple's M-series processor transition accelerated SSD standardization: virtually all new PCs shipped with SSDs by 2022, driving volumes that supported price floor reductions. For Korean consumers specifically, the PC café (PC방) ecosystem — over 10,000 venues nationwide — began upgrading to all-SSD rigs from 2018, making SSD the expected standard for a gaming PC. The 87.5% drop means a device that was a discretionary luxury upgrade (₩200,000 on a ₩1,000,000 PC) became a commodity so inexpensive it is now included as standard in ₩300,000 budget laptops. Semiconductor economics have a distinct pattern: production cost falls exponentially, then retail price follows with a lag as brands maintain margins until competition forces capitulation. SSDs are the textbook case."
  },
  {
    id: '4k_tv_55',
    category: 'tech',
    item: '55-inch 4K TV (55인치 4K TV)',
    context: 'Standard brand entry-level model, new retail',
    pastYear: 2015,
    trend: [2000000, 1500000, 900000, 600000, 400000, 350000, 300000],
    trendYears: [2015, 2016, 2017, 2018, 2020, 2022, 2024],
    fallbackInsight: "55-inch 4K TVs fell from ₩2,000,000 in 2015 to ₩300,000 today: an 85% drop in 9 years — one of the fastest deflation curves of any consumer electronics category. In 2015, Samsung and LG were the world's dominant 4K panel producers, setting a price floor that reflected their duopoly economics and the recency of 4K mass production. Then Chinese state-sponsored manufacturers — BOE Technology, CSOT (TCL subsidiary), HKC — entered large-format LCD panel production with factories funded by provincial government subsidies in Wuhan, Chengdu, and Shenzhen. By 2019, BOE had surpassed Samsung as the world's largest LCD panel manufacturer by area. Chinese brand TCL entered the Korean market directly via Coupang in 2021, selling 55-inch 4K TVs for ₩350,000 — forcing Korean retail prices to follow suit within 12 months. Samsung and LG's strategic response was decisive: both deliberately exited the commodity LCD business (LG closed its Korean LCD panel lines in 2022; Samsung Display followed in 2023) and pivoted entirely to OLED (LG W-OLED, Samsung QD-OLED) and MiniLED. These premium technologies start at ₩1,500,000–₩3,000,000 for 55 inches. The result is a bifurcated market with nothing in between: a ₩300,000 commodity LCD tier made in China, and a ₩1,500,000+ premium Korean-technology OLED tier. The middle market — where Korean brands once competed on value — disappeared in under 10 years. What was a status purchase in 2015 is now cheaper than a month's smartphone plan."
  },
  {
    id: 'gaming_chair',
    category: 'tech',
    item: 'Gaming Chair (게이밍 의자)',
    context: 'Mid-range model, standard domestic brand',
    pastYear: 2016,
    trend: [150000, 170000, 200000, 230000, 270000, 310000],
    trendYears: [2016, 2017, 2018, 2019, 2021, 2024],
    fallbackInsight: "Gaming chairs rose from ₩150,000 in 2016 to ₩310,000 today: 2×. The category originated with DXRacer (Germany), which adapted racing car bucket seat designs for desk use and began supplying esports teams in the mid-2000s. Korean PC gaming culture — the world's most developed esports ecosystem, institutionalized through OGN and LCK (LoL Champions Korea) from 2012 — created immediate aspirational demand: consumers wanted the same chairs used by Faker (이상혁, widely regarded as the greatest esports player of all time) and Korean League of Legends pros. DXRacer entered Korea around 2012; domestic brands (시디즈, 캐럿, 듀오백 gaming lines) adapted ergonomic office chair technology for gaming aesthetics at 20–30% lower prices. The COVID-19 work-from-home transition created an unexpected crossover demand: office workers who had never gamed purchased gaming chairs because they offered lumbar support, adjustable armrests, and reclining capabilities that standard home chairs lacked. Korea's office culture of extended desk-sitting — 'butt-glued' (엉덩이가 무겁다) norms where leaving before the boss is frowned upon — made ergonomic seating a significant WFH investment. Supply chain disruptions in 2020–2021 hit foam padding (an oil-based petrochemical product) and steel frames, raising manufacturing costs 15–25%. Post-COVID, the market bifurcated: budget Korean-brand chairs at ₩100,000–₩150,000 for students, and premium imports (Secretlab, Herman Miller gaming editions) at ₩500,000–₩1,500,000 for professionals. The ₩310,000 mid-range is increasingly squeezed by both ends."
  },
  {
    id: 'air_fryer',
    category: 'tech',
    item: 'Air Fryer (에어프라이어)',
    context: 'Mid-range 5-6L model, standard domestic brand',
    pastYear: 2018,
    trend: [130000, 100000, 80000, 65000, 55000, 50000],
    trendYears: [2018, 2019, 2020, 2021, 2022, 2024],
    fallbackInsight: "Air fryers fell from ₩130,000 in 2018 to ₩50,000 today: a 62% drop in 6 years — one of the fastest consumer appliance commoditizations in Korean market history. Philips invented the air fryer in 2010 and entered Korea in 2015 at ₩200,000–₩250,000, positioning it as a health-forward appliance delivering fried textures without oil immersion. The technology is mechanically simple — a convection heating element, high-speed fan, and basket — and Korean manufacturers recognized this immediately. By 2018, Cuchen, Winix, and multiple OEM brands had reverse-engineered the core mechanism and launched at ₩130,000. Chinese manufacturers — Xiaomi Mija, Cosori, Hauswirt — then entered Coupang and Gmarket from 2019 at ₩50,000–₩70,000 with genuinely comparable cooking performance. The Korean food culture alignment was near-perfect: air frying produces results ideal for Korean fried chicken (치킨), spring rolls (튀김), and reheating delivery food — all extremely high-frequency Korean eating occasions. NAVER food bloggers and Instagram cooking accounts published thousands of air fryer kimchi-jeon, tteokbokki, and chicken recipes, creating demand from consumers who had never considered the product. By 2021, penetration exceeded 30% of Korean households — one of the fastest appliance adoption curves since the electric rice cooker. The ₩50,000 air fryer has become semi-standard in Korean apartments, owned more commonly than food processors or stand mixers. Its rapid commoditization is a case study in how Chinese manufacturing scale can collapse a premium category price in under 5 years."
  },
  {
    id: 'electric_blanket',
    category: 'tech',
    item: 'Electric Blanket (전기장판)',
    context: 'Single-person size, standard Korean brand',
    pastYear: 1995,
    trend: [30000, 35000, 40000, 45000, 55000, 65000, 75000, 90000],
    trendYears: [1995, 1999, 2003, 2007, 2010, 2014, 2019, 2024],
    fallbackInsight: "Electric blankets rose from ₩30,000 in 1995 to ₩90,000 today: 3×. Korea's distinctive floor-heating culture (온돌, ondol) gives electric blankets a different use profile than in Western countries: they supplement heating on cold nights when ondol is either unavailable (rented gosiwon rooms, officetels, studio apartments with inefficient ondol) or economically expensive to run continuously. As apartment living replaced traditional ondol from the 1970s onward, electric blankets became standard winter household items purchased nearly universally. Korean brands (Kumsung 금성, Hyundai Electronics, Daewoo) developed domestically manufactured products through the 1980s and 1990s. EMF (electromagnetic field) health concerns, prominently publicized in Korea through a 1999 KBS documentary linking electric blanket use to potential health risk, significantly suppressed sales between 2000 and 2007 — an episode illustrating how Korean media health panics can immediately reshape consumer markets. Brands responded by developing EMF-shielded heating wire technologies (차단선 방식) at additional manufacturing cost, driving price increases before demand had recovered. Korean safety certification requirements (KC인증) mandate rigorous fire safety and overheating protection testing — a category-specific regulatory burden reflecting documented fire risks from aging blanket wiring in older models. The 2022 energy cost surge ironically benefited electric blanket sales: as ondol heating became more expensive overnight due to LNG price spikes, consumers sought localized body heating as the most energy-efficient wintertime solution. At ₩90,000, the electric blanket remains one of Korea's most energy-rational winter purchases per hour of thermal comfort."
  },
  {
    id: 'powerbank',
    category: 'tech',
    item: 'Portable Power Bank (보조배터리 10000mAh)',
    context: '10,000mAh capacity, standard brand',
    pastYear: 2014,
    trend: [50000, 35000, 25000, 18000, 13000, 10000, 8000],
    trendYears: [2014, 2016, 2017, 2018, 2019, 2021, 2024],
    fallbackInsight: "10,000mAh power banks fell from ₩50,000 in 2014 to ₩8,000 today: an 84% price collapse in 10 years. The power bank category was created by the smartphone era's fundamental design constraint: batteries couldn't grow large enough for all-day use without adding weight consumers found unacceptable. Korean consumers were early adopters: Samsung's Galaxy Note series (introduced 2011) had large screens and processors that drained batteries faster than charging could compensate. Xiaomi's Mi Power Bank (2013), launched at approximately ₩15,000 for 10,400mAh, defined the category's price-performance expectation globally — Xiaomi sourced lithium-ion cells directly from Samsung SDI and LG Energy Solution at volumes that eliminated distributor margins. Korean convenience stores (GS25, CU) introduced rental power bank stations ('Charging On', '배터리 렌탈') from 2019, reducing consumer need to own personal units and further suppressing perceived ownership value. Lithium-ion cell costs fell from approximately $200/kWh in 2014 to $50/kWh by 2023, reducing the bill of materials from roughly ₩30,000 to under ₩5,000 for a 10,000mAh unit. Airline regulations became the primary market constraint: IATA limits carry-on power banks to 100Wh (≈27,000mAh), a ceiling preventing capacity escalation beyond what airlines permit. The real innovation investment shifted to fast-charging capability (65W–100W GaN chargers), where premium brands (Anker, Baseus) command ₩50,000–₩80,000 — while the basic 10,000mAh unit became a corporate giveaway item. Few products better illustrate how lithium battery economics reshaped an entire product category."
  },
  {
    id: 'mechanical_keyboard',
    category: 'tech',
    item: 'Mechanical Keyboard (기계식 키보드)',
    context: 'Entry-level gaming mechanical keyboard, standard brand',
    pastYear: 2012,
    trend: [80000, 85000, 90000, 100000, 110000, 130000, 150000],
    trendYears: [2012, 2014, 2016, 2017, 2019, 2021, 2024],
    fallbackInsight: "Entry-level mechanical keyboards rose from ₩80,000 in 2012 to ₩150,000 today: 1.9×. Mechanical keyboards were first adopted in Korea as professional esports tools: StarCraft and League of Legends players required the tactile feedback and actuation precision of Cherry MX switches (manufactured in Auerbach, Germany by ZF Electronics) for games demanding 200+ APM (actions per minute). The Korea esports scene — institutionalized through OGN and LCK (LoL Champions Korea) from 2012 — gave mechanical keyboards aspirational status: consumers purchased the exact peripheral models endorsed by Faker (이상혁) and other Korean pros. Filco (Japan), Leopold (Korea, founded 2007), and Varmilo (China) established the market before Korean OEM brands (ABKO, 한성컴퓨터) entered at lower price points. Cherry MX switches were subject to a 2020 COVID-related supply disruption causing 6-month lead times, reducing market supply and raising prices 20–30%. The custom mechanical keyboard culture — enthusiasts building keyboards from scratch with custom PCBs, keycap sets, and hand-lubed switches — is globally active but particularly strong in Korea, with group buys routinely producing 60% keyboards costing ₩500,000–₩3,000,000. This premium tier pulled entry-level brand perceptions upward. The ₩150,000 'budget' mechanical keyboard of 2024 typically uses Kailh or Gateron switches (Chinese manufacturers reaching Cherry MX quality parity) rather than German switches — a substitution that maintained quality while limiting the price increase. Mechanical keyboards are now as much an office identity object as a gaming tool."
  },
  {
    id: 'smart_speaker',
    category: 'tech',
    item: 'Smart Speaker (스마트 스피커)',
    context: 'Mid-range model (Kakao Mini, Naver Clova equivalent)',
    pastYear: 2017,
    trend: [100000, 90000, 80000, 70000, 60000, 55000],
    trendYears: [2017, 2018, 2019, 2020, 2022, 2024],
    fallbackInsight: "Smart speakers fell from ₩100,000 in 2017 to ₩55,000 today: a 45% drop. Kakao Corp. and Naver both launched AI speakers in August 2017 — Kakao Minini and Naver CLOVA Friends — within weeks of each other in a race to establish the Korean-language AI assistant market. Initial prices (₩130,000–₩200,000 for launch editions) were set to recover AI development investment and establish premium brand perception. Amazon Echo and Google Home entered the Korean market in 2018 at prices reflecting global production scale, forcing Kakao and Naver to aggressively cut prices — launch units sold at ₩130,000 were bundled for ₩30,000 within 18 months through Kakao Pay and Naver Pay promotional partnerships. This subsidy strategy mirrors the global tech platform playbook: hardware is priced below cost to maximize the installed base of users attached to platform ecosystems. The real revenue is not the speaker — it's the ₩9,900–₩10,900/month music streaming subscription, e-commerce transactions, and AI assistant behavioral data the speaker enables. Korean natural language processing for Korean is genuinely difficult — Korean's agglutinative grammar, extensive honorific system (존댓말), and dense homophone structure require specialized AI training that foreign entrants haven't matched. This localization creates a competitive moat: Amazon Echo's Korean-language capabilities remain inferior to native AI assistants even years after entry. The ₩55,000 smart speaker is the cheapest entry point into the Kakao or Naver paid digital ecosystem — priced to maximize adoption, not profit. Hardware as ecosystem bait."
  },
  {
    id: 'wireless_mouse',
    category: 'tech',
    item: 'Wireless Mouse (무선 마우스)',
    context: 'Mid-range ergonomic model, standard brand',
    pastYear: 2005,
    trend: [40000, 35000, 30000, 25000, 20000, 18000, 20000, 25000],
    trendYears: [2005, 2008, 2010, 2012, 2015, 2018, 2021, 2024],
    fallbackInsight: "Wireless mice fell from ₩40,000 in 2005 to around ₩25,000 today, with a low of ₩18,000 in 2018 — one of the few categories that genuinely got cheaper, then partially rebounded. The deflation was driven by Logitech's 2.4GHz wireless receiver technology becoming commodity-grade, followed by Chinese manufacturers (Rapoo, Baseus, Xiaomi) entering below ₩15,000 with functionally adequate wireless connectivity. The market then bifurcated dramatically around two opposing forces. Commodity compression from below: Chinese brands producing adequate wireless mice for ₩10,000–₩15,000 on Coupang, eliminating the mid-range value proposition. Premium expansion from above: Logitech's MX Master 3 launched at ₩120,000 with USB-C charging, 8,000 DPI sensor, customizable gesture controls, and multi-device Bluetooth switching that office professionals found genuinely useful. Korean office workers who shifted to work-from-home in 2020 upgraded ergonomic peripherals significantly — spending ₩80,000–₩120,000 on models like Logitech MX Ergo (trackball) and Logitech Lift (vertical grip), driven by RSI (repetitive strain injury) awareness and national health insurance coverage for carpal tunnel syndrome from 2019 onward. Gaming mice created yet another premium tier: Razer Viper and Logitech G Pro X Superlight (₩100,000–₩150,000) used by Korean esports professionals, aspirationally purchased by amateur gamers. The ₩25,000 mid-range wireless mouse is increasingly squeezed between cheap-but-adequate imports and premium ergonomic/gaming categories — a classically bifurcating market with a disappearing middle."
  },
  {
    id: 'vr_headset',
    category: 'tech',
    item: 'VR Headset (VR 헤드셋)',
    context: 'Entry-level standalone headset (Meta Quest equivalent)',
    pastYear: 2019,
    trend: [400000, 350000, 300000, 400000, 500000, 550000],
    trendYears: [2019, 2020, 2021, 2022, 2023, 2024],
    fallbackInsight: "Entry-level standalone VR headsets rose from ₩400,000 in 2019 to ₩550,000 today: a 37.5% increase that reversed the expected consumer electronics deflation curve. The original Oculus Quest (2019) was priced at $399 globally — below manufacturing cost — subsidized by Facebook's $3 billion Oculus acquisition investment, to establish an installed base. Korean import duties and exclusive Samsung distribution added approximately ₩50,000 over the US price. The Quest 2 (2020) launched at $299 globally but was raised to $399 within 9 months once Meta monetization pressure overrode the growth-at-cost-strategy; the Quest 3 (2023) launched at $499, establishing that consumers would absorb $500+ for the category. Korean VR adoption faces specific structural challenges: Korean apartments average 84㎡ — spacious by Seoul standards but marginal for room-scale VR requiring 2×2m of clear space. Korean-language content libraries for VR remain thin — most compelling experiences are English-language American productions, creating a localization barrier that depresses adoption relative to markets with native-language content. Korea's primary VR use cases are industrial training (Hyundai factory simulations, military applications) and VR arcades, not home consumer use. Samsung's Gear VR partnership with Meta ended after the Galaxy Note 7 combustion crisis (2016), leaving Samsung without a competitive standalone VR product and the Korean market primarily served by Meta imports at premium prices. The ₩550,000 price point serves a niche enthusiast market, not mainstream Korean households."
  },
  {
    id: 'action_cam',
    category: 'tech',
    item: 'Action Camera (액션캠)',
    context: 'Entry-level 4K model (GoPro Hero equivalent)',
    pastYear: 2015,
    trend: [350000, 300000, 250000, 200000, 180000, 170000],
    trendYears: [2015, 2017, 2018, 2019, 2022, 2024],
    fallbackInsight: "Action cameras fell from ₩350,000 in 2015 to ₩170,000 today: a 51% drop in 9 years. GoPro defined and dominated the category from the original Hero model (2004) through Hero4 Black (2014), reaching peak consumer brand recognition globally around 2015 — the year GoPro went public on NASDAQ at a $3 billion valuation. Korean adoption was driven by extreme outdoor sports culture (surfing at Yangyang, snowboarding at Yongpyong, cycling along the 4대강 bike paths) and the YouTube content creator explosion. At ₩350,000–₩450,000, GoPro was a significant purchase but justifiable for content creators. Competitive disruption arrived from two directions simultaneously. First, DJI (China) entered the action camera market with the Osmo Action in 2019, offering GoPro-comparable stabilization and video quality at ₩270,000. Second, Insta360 (China) introduced spherical 360-degree cameras with Korean-language apps that gained strong adoption among K-travel vloggers and Korean YouTube creators documenting outdoor experiences. GoPro's response — aggressive price cuts and subscription-bundled models — compressed entry-level prices to ₩170,000 while maintaining a ₩550,000+ premium tier for the Hero12 Black. For the Korean market specifically, smartphone video capabilities eroded much of the action camera's value proposition: Samsung Galaxy S24 Ultra's 8K video, AI stabilization, and 200MP camera can handle most scenarios that required a GoPro in 2015. Action cameras now survive primarily for genuinely extreme physical conditions (underwater, helmet-mount, surfboard-mount) where smartphones cannot physically withstand the environment — a narrowing but loyal use case that sustains a smaller, lower-priced market."
  },
  {
    id: 'streaming_tv_box',
    category: 'tech',
    item: 'Streaming TV Box (스트리밍 TV 박스)',
    context: 'Android-based TV stick or box, standard brand',
    pastYear: 2015,
    trend: [80000, 70000, 60000, 50000, 45000, 40000, 38000],
    trendYears: [2015, 2017, 2018, 2019, 2020, 2022, 2024],
    fallbackInsight: "Streaming TV boxes fell from ₩80,000 in 2015 to ₩38,000 today: a 52% drop. The streaming box category was created by the OTT content revolution: Netflix's Korean launch in January 2016, Amazon Prime Video, Disney+, and domestic platforms (Wavve, Tving) required connected-TV hardware that older Korean televisions lacked. Initial products (Amazon Fire TV Stick, Chromecast, Samsung AllShare) were priced at ₩80,000–₩100,000 as genuinely novel hardware expanding TV functionality. Rapid commoditization followed as Android TV manufacturers — Xiaomi Mi Box S, Tencent-backed devices, and Korean-branded units from LG Uplus and KT — entered Coupang and Gmarket at ₩30,000–₩50,000. The category's structural problem is that its own success made it unnecessary: by 2020, over 75% of Korean households owned at least one smart TV with built-in Netflix, YouTube, and domestic OTT apps — eliminating the need for a separate box. The streaming box market contracted to two surviving segments: older TV upgrades (households with pre-2018 TVs lacking modern OTT app compatibility) and Android power users who want customization unavailable on manufacturer-locked smart TV platforms. Korean telcos (KT, SKT, LGU+) maintained the category through subsidized IPTV set-top boxes bundled with internet/TV service contracts — where the hardware was effectively free in exchange for 24-month commitments. The ₩38,000 streaming box market of 2024 is a niche remnant of what was briefly a mainstream necessity, disrupted by the very content ecosystem it was designed to enable."
  },
  {
    id: 'beer_can_single',
    category: 'food',
    item: 'Canned Beer — Single Can (캔맥주)',
    context: 'Single 500ml can purchased individually, convenience store',
    pastYear: 2000,
    trend: [1000, 1100, 1200, 1400, 1600, 1800, 2000, 2500],
    trendYears: [2000, 2003, 2006, 2009, 2012, 2015, 2019, 2024],
    fallbackInsight: "Single-can beer prices rose from ₩1,000 in 2000 to ₩2,500 today: 2.5×. The Korean canned beer market operated as a near-duopoly between Hite (now HiteJinro) and OB (Oriental Brewery, makers of Cass and OB Lager) for decades — a market structure that kept competitive pricing pressure intense and limited how aggressively either brand could raise prices without losing shelf space. The 2009 InBev acquisition of Oriental Brewery (AB InBev, parent of Budweiser, then briefly owned by KKR) introduced global cost management practices but also preserved the fierce domestic pricing dynamic. Korea's '4캔 10,000원' (four cans for ₩10,000) convenience store promotion — a cultural fixture since the mid-2010s — became one of the most effective consumer price anchors in Korean retail history, training millions of consumers to expect ₩2,500 per can as the ceiling. Import tariff reductions under multiple FTAs (KORUS 2012, EU-Korea 2011) brought Japanese (Asahi, Kirin) and European beers into Korean convenience stores, constraining domestic brands from raising above import alternatives. Post-COVID barley and aluminum can surges finally forced modest increases in 2021–2022. Beer inflation at 2.5× over 24 years is among the lowest of any food category in this game — a result of deliberate competitive restraint and consumer expectation management that domestic brands could not unilaterally break."
  },
  {
    id: 'hapkido_academy',
    category: 'culture',
    item: 'Hapkido Academy (합기도 학원)',
    context: "Children's monthly tuition, standard dojang",
    pastYear: 1995,
    trend: [25000, 35000, 45000, 55000, 65000, 75000, 90000, 110000],
    trendYears: [1995, 1999, 2003, 2007, 2010, 2014, 2019, 2024],
    fallbackInsight: "Hapkido academy fees rose from ₩25,000/month in 1995 to ₩110,000 today: 4.4×. Hapkido (합기도) — Korea's joint-lock and throwing art distinguished from taekwondo's kicking emphasis — is the second most widely practiced Korean martial art and is particularly popular as a self-defense curriculum for children and women. The Korean Hapkido Association (대한합기도협회) credentials master instructors (단증) through a multi-year examination process, limiting certified instructor supply and supporting wage floors well above minimum wage for qualified masters. Academy rents in residential areas near elementary schools — the primary enrollment catchment — rose substantially as Korean land values in school-adjacent zones climbed. Korea's falling birth rate (0.72 total fertility rate in 2023, the lowest ever recorded globally) is the defining structural pressure: fewer children per neighborhood mean fewer potential students per dojang. Operators facing declining enrollment raised per-student fees to maintain revenue — the survival math of a fixed-overhead business with a shrinking customer pool. Unlike taekwondo (which became an Olympic sport in Sydney 2000 and benefited from the national prestige boost), hapkido lacks the Olympic platform — its pricing increases reflect pure service cost inflation and demographic math, not cultural status escalation."
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
  document.getElementById('end-home-btn').addEventListener('click', () => {
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
