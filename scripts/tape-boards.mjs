// scripts/tape-boards.mjs: the hand-authored half of Tape's bank. One row per
// day, in live order from TAPE_START. scripts/gen-tape.mjs joins these rows with
// the price file and the Russell 3000 list and writes app/tape/puzzles.js.
//
// Fields (every one is checked by scripts/verify-tape.mjs):
//   t      the answer's ticker, exactly as the iShares IWV holdings file lists it
//   ipo    the year the company first went public (a direct listing counts)
//   hq     headquarters, "City, State" (or "City, Province" for one in Canada)
//   pin    [date, headline]: a dated event inside the five-year chart. The date
//          is the trading week the market reacted; the pin is drawn on the week
//          nearest to it. The headline never names the company or its ticker.
//   does   what the company does, in our own words, one line. Never the
//          company's name. It is the strongest clue, so it sits fifth.
//   alt    other names a player may type for the same answer (old names,
//          famous brands), so a right answer is never marked wrong.
//   also   other tickers that are the same company (a second share class).
//
// Sundays (a smaller company, from deeper in the Russell 3000) are marked by
// the generator from the live date, never by hand.
export const TAPE_START = '2026-11-06';

export const BOARDS = [
  { t: 'NFLX', ipo: 2002, hq: 'Los Gatos, California', pin: ['2022-04-20', 'Reported its first loss of subscribers in more than a decade'], does: 'Runs a subscription streaming service for films and series' },
  { t: 'NKE', ipo: 1980, hq: 'Beaverton, Oregon', pin: ['2024-06-28', 'Biggest one-day drop in its history after cutting its outlook'], does: 'Designs athletic shoes and apparel sold all over the world' },
  { t: 'CROX', ipo: 2006, hq: 'Broomfield, Colorado', pin: ['2021-12-23', 'Agreed to buy the HeyDude shoe brand for $2.5 billion'], does: 'Best known for colorful molded foam clogs' },
  { t: 'AAPL', ipo: 1980, hq: 'Cupertino, California', pin: ['2023-06-30', 'Became the first company to close above $3 trillion in market value'], does: 'Makes the iPhone, the Mac and the iPad' },
  { t: 'CRWD', ipo: 2019, hq: 'Austin, Texas', pin: ['2024-07-19', 'A faulty update it pushed crashed millions of Windows computers worldwide'], does: 'Sells cybersecurity software that protects laptops, servers and cloud accounts' },
  { t: 'TGT', ipo: 1967, hq: 'Minneapolis, Minnesota', pin: ['2022-05-18', 'Worst day since 1987 after quarterly profit fell by half'], does: 'Runs a chain of nearly 2,000 big-box discount stores' },
  { t: 'AMD', ipo: 1972, hq: 'Santa Clara, California', pin: ['2022-02-14', 'Closed its $49 billion purchase of chipmaker Xilinx'], does: 'Designs processors and graphics chips for PCs, servers and game consoles' },
  { t: 'SBUX', ipo: 1992, hq: 'Seattle, Washington', pin: ['2024-08-13', "Hired Chipotle's CEO as its new chief executive"], does: "Runs the world's largest chain of coffeehouses" },
  { t: 'META', ipo: 2012, hq: 'Menlo Park, California', pin: ['2022-02-03', 'Lost over $200 billion of value in a day after its first drop in daily users'], does: 'Owns the biggest social network, plus Instagram and WhatsApp', alt: ['Facebook'] },
  { t: 'PTON', ipo: 2019, hq: 'New York, New York', pin: ['2022-02-08', 'Its founder stepped down as CEO and 2,800 jobs were cut'], does: 'Sells connected exercise bikes and treadmills that stream live classes' },
  { t: 'COST', ipo: 1985, hq: 'Issaquah, Washington', pin: ['2024-07-10', 'Announced its first membership fee increase in seven years'], does: 'Runs membership-only warehouse clubs' },
  { t: 'SMCI', ipo: 2007, hq: 'San Jose, California', pin: ['2024-10-30', 'Its auditor, Ernst & Young, resigned'], does: 'Builds servers and storage, including the racks inside AI data centers', alt: ['Supermicro'] },
  { t: 'TSLA', ipo: 2010, hq: 'Austin, Texas', pin: ['2024-10-24', 'Its best day since 2013, up 22% after quarterly profit beat forecasts'], does: 'Makes electric cars and home and grid batteries', alt: ['Tesla Motors'] },
  { t: 'MCD', ipo: 1965, hq: 'Chicago, Illinois', pin: ['2024-10-22', 'An E. coli outbreak was linked to one of its burgers'], does: "Runs the world's biggest fast food chain by sales" },
  { t: 'GME', ipo: 2002, hq: 'Grapevine, Texas', pin: ['2024-05-13', 'The investor known as Roaring Kitty returned to social media'], does: 'Sells video games, consoles and collectibles in its own stores' },
  { t: 'ADBE', ipo: 1986, hq: 'San Jose, California', pin: ['2022-09-15', 'Agreed to buy the design startup Figma for $20 billion'], does: 'Makes Photoshop, Acrobat and other creative software', alt: ['Adobe Systems'] },
  { t: 'CAVA', ipo: 2023, hq: 'Washington, D.C.', pin: ['2023-06-15', 'Shares nearly doubled on their first day of trading'], does: 'Runs a fast casual Mediterranean restaurant chain' },
  { t: 'AMZN', ipo: 1997, hq: 'Seattle, Washington', pin: ['2022-04-29', 'Biggest one-day drop since 2006 after its first quarterly loss in seven years'], does: 'Runs the largest online store in the US and the biggest cloud computing business' },
  { t: 'INTC', ipo: 1971, hq: 'Santa Clara, California', pin: ['2024-08-02', 'Suspended its dividend and cut 15% of its workforce'], does: 'Designs PC and server processors and makes them in its own factories' },
  { t: 'DPZ', ipo: 2004, hq: 'Ann Arbor, Michigan', pin: ['2024-11-14', 'Berkshire Hathaway disclosed a new stake'], does: "The world's largest pizza company by global retail sales" },
  { t: 'HOOD', ipo: 2021, hq: 'Menlo Park, California', pin: ['2025-09-22', 'Joined the S&P 500'], does: 'Runs a commission-free app for trading stocks and crypto' },
  { t: 'WMT', ipo: 1970, hq: 'Bentonville, Arkansas', pin: ['2024-02-20', 'Agreed to buy the TV maker Vizio for $2.3 billion'], does: 'The largest retailer in the world by revenue', alt: ['Wal-Mart'] },
  { t: 'SNOW', ipo: 2020, hq: 'Bozeman, Montana', pin: ['2024-02-29', 'Its CEO announced his retirement and shares fell 18% in a day'], does: 'Sells a cloud data warehouse that companies pay for by how much they use it' },
  { t: 'ELF', ipo: 2016, hq: 'Oakland, California', pin: ['2025-05-28', 'Agreed to buy the Rhode skincare brand for $1 billion'], does: 'Sells low-priced cosmetics and skincare', alt: ['e.l.f.', 'elf Beauty'] },
  { t: 'NVDA', ipo: 1999, hq: 'Santa Clara, California', pin: ['2023-05-25', 'Forecast sales far above estimates on demand for its AI chips'], does: 'Designs graphics chips and the accelerators that train AI models' },
  { t: 'LULU', ipo: 2007, hq: 'Vancouver, British Columbia', pin: ['2023-10-18', 'Joined the S&P 500'], does: 'Sells premium yoga pants and athletic apparel' },
  { t: 'F', ipo: 1956, hq: 'Dearborn, Michigan', pin: ['2022-03-02', 'Split itself into separate units for gas and electric vehicles'], does: 'Makes the F-150 pickup and the Mustang' },
  { t: 'PLTR', ipo: 2020, hq: 'Denver, Colorado', pin: ['2024-11-26', 'Moved its stock listing to the Nasdaq'], does: 'Sells data analysis software to governments and large companies' },
  { t: 'DECK', ipo: 1993, hq: 'Goleta, California', pin: ['2024-09-17', 'Split its stock six for one'], does: 'Owns the UGG and HOKA footwear brands', alt: ['Deckers'] },
  { t: 'GOOGL', ipo: 2004, hq: 'Mountain View, California', pin: ['2023-02-08', 'A wrong answer in a demo of its AI chatbot wiped $100 billion off its value'], does: "Runs the world's most used search engine, and YouTube", alt: ['Google'], also: ['GOOG'] },
  { t: 'BMBL', ipo: 2021, hq: 'Austin, Texas', pin: ['2023-11-06', 'Its founder said she would step down as CEO'], does: 'Runs a dating app where women make the first move' },
  { t: 'HD', ipo: 1981, hq: 'Atlanta, Georgia', pin: ['2024-03-28', 'Agreed to buy the roofing supplier SRS for $18 billion'], does: 'Runs the largest chain of hardware and building supply stores in the US' },
  { t: 'UBER', ipo: 2019, hq: 'San Francisco, California', pin: ['2024-02-14', 'Announced its first ever share buyback, of $7 billion'], does: 'Runs a ride-hailing and food delivery app' },
  { t: 'CVNA', ipo: 2017, hq: 'Tempe, Arizona', pin: ['2023-07-19', 'A debt restructuring deal sent the shares soaring'], does: 'Sells used cars online and delivers them from glass car vending towers' },
  { t: 'MSFT', ipo: 1986, hq: 'Redmond, Washington', pin: ['2023-01-23', 'Announced a multibillion dollar investment in OpenAI'], does: 'Makes Windows, Office and the Azure cloud' },
  { t: 'CMG', ipo: 2006, hq: 'Newport Beach, California', pin: ['2024-06-26', 'Split its stock 50 for one'], does: 'Runs a fast casual chain of burrito restaurants' },
  { t: 'DASH', ipo: 2020, hq: 'San Francisco, California', pin: ['2025-05-06', 'Agreed to buy the British delivery app Deliveroo'], does: 'Runs the largest food delivery app in the US' },
  { t: 'RDDT', ipo: 2024, hq: 'San Francisco, California', pin: ['2024-03-21', 'Shares jumped 48% on their first day of trading'], does: 'Runs a website of discussion communities moderated by its own users' },
  { t: 'AVGO', ipo: 2009, hq: 'Palo Alto, California', pin: ['2023-11-22', 'Closed its $69 billion purchase of VMware'], does: 'Designs networking and custom AI chips and sells infrastructure software', alt: ['Avago'] },
  { t: 'RIVN', ipo: 2021, hq: 'Irvine, California', pin: ['2024-06-25', 'Volkswagen agreed to invest up to $5 billion'], does: 'Makes electric pickups, SUVs and delivery vans' },
  { t: 'ABNB', ipo: 2020, hq: 'San Francisco, California', pin: ['2023-02-14', 'Reported its first full year of profit'], does: 'Runs a marketplace for booking short-term stays in homes' },
  { t: 'ORCL', ipo: 1986, hq: 'Austin, Texas', pin: ['2025-09-10', 'Its biggest one-day gain since 1992, on a surge of cloud contracts'], does: 'Sells database software and cloud computing infrastructure' },
  { t: 'CRM', ipo: 2004, hq: 'San Francisco, California', pin: ['2022-11-30', 'Its co-CEO said he would step down'], does: 'Sells customer relationship management software in the cloud' },
  { t: 'MSTR', ipo: 1998, hq: 'Tysons Corner, Virginia', pin: ['2024-12-23', 'Joined the Nasdaq-100'], does: 'A software company that holds more bitcoin than any other listed company', alt: ['MicroStrategy', 'Strategy'] },
  { t: 'KSS', ipo: 1992, hq: 'Menomonee Falls, Wisconsin', pin: ['2025-07-22', 'A meme-stock rally sent shares up nearly 40% in a day'], does: 'Runs a chain of more than 1,100 department stores' },
];
