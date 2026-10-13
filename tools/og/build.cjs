/*
 * Renders the site's share images with headless Chrome, from the site's own
 * tokens, fonts and screenshots. What it renders depends on --for:
 *
 *   node tools/og/build.cjs [--only=slug,slug]
 *     The link preview cards in public/og/ (1200x630 JPEG, committed): the
 *     case-study title, name and domain on the left and the project's card
 *     art on the right. A card with `phone` instead of `art` shows that
 *     screenshot in a phone frame. Each case study's `image` entry in
 *     routes.mjs points og:image at its card (the script stops if one is
 *     missing); every other route keeps public/og/home.jpg.
 *
 *   node tools/og/build.cjs --for=linkedin [--only=slug,slug]
 *     The same cards as 1080x1350 portrait posts for LinkedIn (4:5, the
 *     tallest ratio its feed shows uncropped), with the case study's own
 *     address under the name.
 *
 *   node tools/og/build.cjs --for=play [--only=slug]
 *     The 1024x500 feature graphic a Google Play listing requires, one per
 *     listing language, in the app's own colours and without the site's
 *     wordmark or byline.
 *
 * Posts and feature graphics land in tools/og/output/ (gitignored). Colours
 * come from the :root block of src/styles/tokens.css (the dark theme) and the
 * fonts from src/styles/fonts.css with every woff2 inlined, so the images
 * follow the design tokens and nothing is fetched. Needs playwright (a
 * devDependency); it drives the installed Chrome (channel "chrome"), falling
 * back to Playwright's Chromium. Never use the bag lock photo here: it is too
 * small to upscale and the originals must stay local. Only screenshots with
 * no personal data on screen belong on a card.
 */
const path = require("path");
const fs = require("fs");
const { pathToFileURL } = require("url");

let chromium;
try {
  ({ chromium } = require("playwright"));
} catch (e) {
  console.error("playwright is not installed. Run: npm install");
  process.exit(1);
}

const repo = path.resolve(__dirname, "../..");

// The canvas, output folder and JPEG quality for each --for. Only the
// committed link cards have a size cap.
const TARGETS = {
  og: { width: 1200, height: 630, dir: "public/og", quality: 90, maxBytes: 300 * 1024 },
  linkedin: { width: 1080, height: 1350, dir: "tools/og/output/linkedin", quality: 92 },
  play: { width: 1024, height: 500, dir: "tools/og/output/play", quality: 92 },
};

// Titles match each case study's h1 and eyebrow; each slug is the route's
// name in routes.mjs.
const CARDS = [
  {
    slug: "mytax",
    eyebrow: "Case study · Production work",
    title: "MyTax",
    // The login screen: nothing from a taxpayer's account on screen.
    phone: "src/Assets/featured/pic 1.webp",
  },
  {
    slug: "bestinet",
    eyebrow: "Case study · Company work",
    title: "TOTP authenticator",
    art: "src/Assets/Projects/bestinet.svg",
  },
  {
    slug: "silent-support",
    eyebrow: "Case study · Personal project",
    title: "Silent Support",
    // The check-in grid: no account, history or times on screen.
    phone: "src/Assets/featured/silent-1.webp",
  },
  {
    slug: "baglock",
    eyebrow: "Case study · Final year project",
    title: "Anti-theft fingerprint bag lock",
    art: "src/Assets/Projects/baglock.svg",
  },
];

// Play feature graphics: the app's name, a line and a real screen, in colours
// sampled from that screen. Play takes one feature graphic per listing
// language, so each entry in `lines` renders its own file, <slug>-<lang>.jpg.
// Keep every line clear of ranking, price and promotion words ("Best", "#1",
// "Top", "New", "Free", "Sale"), which Play's listing guidelines rule out.
const FEATURES = [
  {
    slug: "halalsaji",
    name: "HalalSaji",
    // The opening sentence of projects.halalsaji_desc in each locale, turned
    // into an imperative. Nothing keeps them in step: change both together.
    lines: {
      en: "Find halal food nearby and see how each place was verified.",
      ms: "Cari makanan halal berdekatan dan lihat bagaimana setiap tempat disahkan.",
    },
    // The site's capture of the web build on its sample data, with no
    // certificate numbers on screen. Swap in a screen from the release build
    // before the listing goes live.
    screen: "src/Assets/featured/halalsaji-1.webp",
    // The filter button's blue, white, and the app's page background.
    colors: { brand: "#1465c0", ink: "#ffffff", page: "#f3f9fe" },
  },
];

// One face per family and weight each kind of image sets text in.
const FONTS_USED = {
  og: ['800 72px "Bricolage Grotesque"', '600 26px "Inter"', '500 17px "JetBrains Mono"'],
  linkedin: ['800 92px "Bricolage Grotesque"', '600 34px "Inter"', '500 20px "JetBrains Mono"'],
  play: ['800 64px "Inter"', '500 24px "Inter"'],
};

// --for=og|linkedin|play picks what to render (the link cards by default);
// --only=slug,slug renders just those and leaves the others alone.
function readFlags(argv) {
  const flags = { for: "og", only: [] };
  for (const arg of argv) {
    const [key, value = ""] = arg.replace(/^--/, "").split("=");
    if (key === "for") flags.for = value;
    else if (key === "only") flags.only.push(...value.split(",").filter(Boolean));
    else throw new Error(`unknown option ${arg}; use --for=og|linkedin|play and --only=slug,slug`);
  }
  if (!Object.hasOwn(TARGETS, flags.for)) throw new Error(`unknown --for=${flags.for}; use og, linkedin or play`);
  return flags;
}

// The site's @font-face rules with each woff2 inlined as a data URL, so
// Chrome draws exactly the faces the site serves and needs no network.
function fontFaces() {
  const file = path.resolve(repo, "src/styles/fonts.css");
  let count = 0;
  const css = fs.readFileSync(file, "utf8").replace(/url\("([^"]+\.woff2)"\)/g, (match, rel) => {
    count += 1;
    const font = fs.readFileSync(path.resolve(path.dirname(file), rel));
    return `url("data:font/woff2;base64,${font.toString("base64")}")`;
  });
  if (!count) throw new Error("no woff2 url() in src/styles/fonts.css");
  return css;
}

// fonts.css declares Inter 400 to 600, all the site uses, but its files carry
// the weight axis to 900. A feature graphic sets the app's name at 800, so it
// gets the same files again under the heavier range.
function heavyInter(faces) {
  const rules = faces.match(/@font-face\s*\{[^}]*font-family:\s*"Inter";[^}]*\}/g) || [];
  if (!rules.length || !rules.every((rule) => /font-weight:\s*400 600;/.test(rule))) {
    throw new Error('expected every "Inter" @font-face in src/styles/fonts.css at font-weight: 400 600');
  }
  return rules.map((rule) => rule.replace(/font-weight:\s*400 600;/, "font-weight: 700 900;")).join("\n");
}

function darkTokens() {
  const css = fs.readFileSync(path.resolve(repo, "src/styles/tokens.css"), "utf8");
  const block = css.match(/:root\s*\{([^}]*)\}/);
  if (!block) throw new Error("no :root block in src/styles/tokens.css");
  return block[1];
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

const webp = (file) =>
  "data:image/webp;base64," + fs.readFileSync(path.resolve(repo, file)).toString("base64");

// The link card: text on the left, the art panel on the right. The LinkedIn
// post starts from the same rules and changes the layout (POST_CSS).
const CARD_CSS = `
* { box-sizing: border-box; margin: 0; }
body {
  position: relative;
  overflow: hidden;
  background: var(--bg-0);
  color: var(--text-1);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
}
.aurora {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(ellipse at center, var(--accent-glow) 0%, rgba(155, 107, 255, 0) 62%);
  filter: blur(40px);
}
.aurora--main { width: 1400px; height: 700px; left: 150px; top: -420px; opacity: 0.6; }
.aurora--art { width: 760px; height: 560px; right: -160px; top: 60px; opacity: 0.5; }
.grain {
  position: absolute;
  inset: 0;
  opacity: 0.04;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.6 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 220px 220px;
}
.text {
  position: absolute;
  left: 72px;
  top: 64px;
  bottom: 64px;
  width: 560px;
  display: flex;
  flex-direction: column;
}
.wordmark {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 34px;
  letter-spacing: -0.04em;
  line-height: 1;
}
.wordmark span { color: var(--accent); margin-left: 1px; }
.middle { margin-top: auto; margin-bottom: auto; }
.eyebrow {
  display: flex;
  align-items: center;
  gap: 14px;
  font-family: var(--font-mono);
  font-size: 17px;
  font-weight: 500;
  letter-spacing: var(--track-eyebrow);
  text-transform: uppercase;
  color: var(--accent-text);
  line-height: 1;
}
.eyebrow::before {
  content: "";
  width: 24px;
  height: 1px;
  background: currentColor;
  opacity: 0.7;
}
h1 {
  margin-top: 26px;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 72px;
  line-height: var(--lh-tight);
  letter-spacing: var(--track-display);
  text-wrap: balance;
}
.byline { display: flex; flex-direction: column; gap: 10px; }
.name { font-size: 26px; font-weight: 600; line-height: 1.1; }
.domain { font-family: var(--font-mono); font-size: 18px; color: var(--text-2); line-height: 1; }
/* The art is drawn in the middle of a 1280x800 canvas; show that middle
   large in a square frame so it still reads in a small preview. */
.art {
  position: absolute;
  right: 64px;
  top: 50%;
  width: 460px;
  height: 460px;
  transform: translateY(-50%);
  border-radius: var(--r-xl);
  border: 1px solid var(--line-strong);
  background: radial-gradient(ellipse at 50% 110%, var(--accent-soft-2), transparent 70%), var(--bg-3);
  box-shadow: var(--shadow-glow);
  overflow: hidden;
}
.art > img {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 768px;
  height: 480px;
  transform: translate(-50%, -50%);
}
/* A phone rising from the bottom of the panel, like the site's PhoneFrame. */
.art--phone .phone {
  position: absolute;
  left: 50%;
  top: 44px;
  width: 256px;
  transform: translateX(-50%);
  padding: 9px;
  border-radius: 42px;
  background: linear-gradient(160deg, #2a2338 0%, #0d0915 100%);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.09), 0 0 0 5px #06040b,
    0 30px 80px -30px var(--accent-glow);
}
.art--phone .phone img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 33px;
}
`;

// The LinkedIn post: the same pieces stacked in one column, with the art
// panel filling whatever the title leaves above the byline.
const POST_CSS = `
.aurora--main { width: 1500px; height: 900px; left: -260px; top: -560px; }
.aurora--art { width: 1100px; height: 900px; right: auto; left: -10px; top: 560px; }
.sheet {
  position: absolute;
  inset: 88px 72px 80px;
  display: flex;
  flex-direction: column;
}
.wordmark { font-size: 40px; }
.middle { margin: 96px 0 0; }
.eyebrow { font-size: 20px; }
h1 { margin-top: 30px; font-size: 92px; }
.art {
  position: relative;
  right: auto;
  top: auto;
  width: auto;
  height: auto;
  flex: 1;
  min-height: 0;
  margin-top: 64px;
  transform: none;
}
/* The whole 1280x800 drawing, scaled to the panel's height. */
.art > img { width: auto; height: 100%; }
.art--phone .phone { top: 72px; width: 400px; padding: 13px; border-radius: 64px; }
.art--phone .phone img { border-radius: 51px; }
.byline { margin-top: 64px; gap: 14px; }
.name { font-size: 34px; }
.domain { font-size: 24px; }
`;

// The Play feature graphic: the app's name and line on the left and the top
// of its screen on the right, on the app's own colour rather than the site's.
// Play crops the graphic differently per format and asks that the app name,
// the slogan and the main UI stay out of cutoff bands at the edges (about 15%
// of each side in its diagram, so roughly the middle 720x348 here), with the
// focal point near the centre. Everything sits inside that middle, the screen
// shown as a window onto its top 328 px; only the background glow reaches the
// edges, as Play asks of background elements.
const PLAY_CSS = `
* { box-sizing: border-box; margin: 0; }
body {
  position: relative;
  overflow: hidden;
  background: radial-gradient(ellipse 45% 70% at 100% 0%, rgba(255, 255, 255, 0.2), transparent 70%),
    radial-gradient(ellipse 40% 60% at 0% 100%, rgba(0, 0, 0, 0.14), transparent 70%), var(--brand);
  color: var(--ink);
  font-family: "Inter", sans-serif;
  -webkit-font-smoothing: antialiased;
}
.copy {
  position: absolute;
  left: 168px;
  top: 50%;
  width: 360px;
  transform: translateY(-50%);
}
.name {
  font-weight: 800;
  font-size: 64px;
  line-height: 1;
  letter-spacing: -0.035em;
}
.line {
  margin-top: 20px;
  font-size: 24px;
  font-weight: 500;
  line-height: 1.35;
  opacity: 0.92;
}
.screen {
  position: absolute;
  left: 576px;
  top: 86px;
  width: 264px;
  height: 328px;
  border-radius: 28px;
  overflow: hidden;
  background: var(--page);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.28), 0 40px 80px -24px rgba(3, 20, 48, 0.6);
}
.screen img { display: block; width: 100%; height: auto; }
`;

// The right-hand panel: the card art, or a screenshot in a phone frame.
function artMarkup(card) {
  if (card.phone) {
    return `<div class="art art--phone"><div class="phone"><img src="${webp(card.phone)}" alt=""></div></div>`;
  }
  const svg = fs.readFileSync(path.resolve(repo, card.art));
  const art = "data:image/svg+xml;base64," + svg.toString("base64");
  return `<div class="art"><img src="${art}" alt=""></div>`;
}

const headingMarkup = (card) => `<div class="middle">
    <div class="eyebrow">${esc(card.eyebrow)}</div>
    <h1>${esc(card.title)}</h1>
  </div>`;

const bylineMarkup = (address) => `<div class="byline">
    <div class="name">Zariff Danial</div>
    <div class="domain">${esc(address)}</div>
  </div>`;

function cardMarkup(card, address) {
  return `<div class="aurora aurora--main"></div>
<div class="aurora aurora--art"></div>
<div class="text">
  <div class="wordmark">ZD<span>.</span></div>
  ${headingMarkup(card)}
  ${bylineMarkup(address)}
</div>
${artMarkup(card)}
<div class="grain"></div>`;
}

function postMarkup(card, address) {
  return `<div class="aurora aurora--main"></div>
<div class="aurora aurora--art"></div>
<div class="sheet">
  <div class="wordmark">ZD<span>.</span></div>
  ${headingMarkup(card)}
  ${artMarkup(card)}
  ${bylineMarkup(address)}
</div>
<div class="grain"></div>`;
}

function featureMarkup(app, line) {
  return `<div class="copy">
  <div class="name">${esc(app.name)}</div>
  <p class="line">${esc(line)}</p>
</div>
<div class="screen"><img src="${webp(app.screen)}" alt=""></div>`;
}

function page({ width, height }, style, body, lang = "en") {
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<style>
${style}
html, body { width: ${width}px; height: ${height}px; }
</style>
</head>
<body>
${body}
</body>
</html>`;
}

// The page for one image: a card, or an app in one listing language.
// `site` carries the inlined fonts, the dark tokens, the site's host name and
// the route behind each card.
function render(kind, { item, lang, line }, site) {
  const target = TARGETS[kind];
  if (kind === "play") {
    const { brand, ink, page: screenBg } = item.colors;
    const colors = `:root { --brand: ${brand}; --ink: ${ink}; --page: ${screenBg}; }`;
    const style = `${site.faces}\n${heavyInter(site.faces)}\n${colors}\n${PLAY_CSS}`;
    return page(target, style, featureMarkup(item, line), lang);
  }
  const style = `${site.faces}\n:root {${site.tokens}}\n${CARD_CSS}`;
  if (kind === "linkedin") {
    const address = site.host + site.routeFor(item).path;
    return page(target, `${style}\n${POST_CSS}`, postMarkup(item, address));
  }
  return page(target, style, cardMarkup(item, site.host));
}

// Run in the page after the fonts load: a reason the layout failed, or null.
// The text columns have fixed widths, so a line that does not fit shows up as
// an element whose scrollWidth is larger than its clientWidth, not as a
// column that grows into the art.
const LAYOUT_CHECKS = {
  og: () => {
    const lines = document.querySelectorAll(".text .eyebrow, .text h1, .text .name, .text .domain");
    if ([...lines].some((el) => el.scrollWidth > el.clientWidth)) {
      return "a line of text is wider than its column and runs into the art";
    }
    const text = document.querySelector(".text").getBoundingClientRect();
    const byline = document.querySelector(".byline").getBoundingClientRect();
    if (byline.bottom > text.bottom + 0.5) return "the text is taller than its column";
    return null;
  },
  linkedin: () => {
    const lines = document.querySelectorAll(".eyebrow, h1, .name, .domain");
    if ([...lines].some((el) => el.scrollWidth > el.clientWidth)) return "a line of text is wider than the post";
    const art = document.querySelector(".art").getBoundingClientRect();
    const byline = document.querySelector(".byline").getBoundingClientRect();
    if (art.height < 480) return "the title leaves the art too little room";
    if (byline.bottom > window.innerHeight - 40) return "the byline runs off the post";
    return null;
  },
  play: () => {
    // Play's cutoff bands, measured from its diagram: about 15% of each side.
    const band = { x: Math.round(window.innerWidth * 0.148), y: Math.round(window.innerHeight * 0.152) };
    const inCore = (el) => {
      const r = el.getBoundingClientRect();
      return (
        r.left >= band.x &&
        r.right <= window.innerWidth - band.x &&
        r.top >= band.y &&
        r.bottom <= window.innerHeight - band.y
      );
    };
    if ([...document.querySelectorAll(".copy > *")].some((el) => el.scrollWidth > el.clientWidth)) {
      return "the name or line is wider than its column and runs into the screen";
    }
    if (!inCore(document.querySelector(".copy"))) return "the name or line reaches a cutoff band";
    if (!inCore(document.querySelector(".screen"))) return "the screen reaches a cutoff band";
    return null;
  },
};

(async () => {
  const flags = readFlags(process.argv.slice(2));
  const target = TARGETS[flags.for];
  const { ORIGIN, ROUTES } = await import(pathToFileURL(path.resolve(repo, "routes.mjs")).href);

  const list = flags.for === "play" ? FEATURES : CARDS;
  const unknown = flags.only.filter((slug) => !list.some((item) => item.slug === slug));
  if (unknown.length) throw new Error(`unknown ${flags.for === "play" ? "app" : "card"}: ${unknown.join(", ")}`);
  const items = flags.only.length ? list.filter((item) => flags.only.includes(item.slug)) : list;

  const routeFor = (card) => {
    const route = ROUTES.find((r) => r.name === card.slug);
    if (!route) throw new Error(`${card.slug}: routes.mjs has no route of that name`);
    return route;
  };
  // A link card nothing points at is never seen: each one must be its
  // route's og:image, at the size the card is drawn.
  if (flags.for === "og") {
    for (const card of items) {
      const { image } = routeFor(card);
      const file = `/og/${card.slug}.jpg`;
      if (!image || image.path !== file || image.width !== target.width || image.height !== target.height) {
        throw new Error(`${card.slug}: give its route in routes.mjs an image entry for ${file} (${target.width}x${target.height})`);
      }
    }
  }

  // One image per card, or one per app and listing language.
  const jobs =
    flags.for === "play"
      ? items.flatMap((item) =>
          Object.entries(item.lines).map(([lang, line]) => ({ item, lang, line, name: `${item.slug}-${lang}.jpg` }))
        )
      : items.map((item) => ({ item, name: `${item.slug}.jpg` }));

  const site = { faces: fontFaces(), tokens: darkTokens(), host: new URL(ORIGIN).host, routeFor };
  const outDir = path.resolve(repo, target.dir);
  fs.mkdirSync(outDir, { recursive: true });

  let engine = "Chrome";
  const browser = await chromium.launch({ channel: "chrome", headless: true }).catch(() => {
    engine = "Playwright's Chromium (Chrome would not start)";
    return chromium.launch({ headless: true });
  });
  // The committed cards only come out byte for byte the same from the same
  // browser build, so say which one drew them.
  console.log(`drawing with ${engine} ${browser.version()}`);
  const tab = await browser.newPage({
    viewport: { width: target.width, height: target.height },
    deviceScaleFactor: 1,
  });

  for (const job of jobs) {
    await tab.setContent(render(flags.for, job, site), { waitUntil: "load" });
    await tab.evaluate(() => document.fonts.ready);
    // An image in a fallback font is worse than none: stop instead.
    // document.fonts.check() answers true when no face matches at all (a rule
    // that never parsed, say), so ask for each face and require one that
    // actually loaded (as the sweep's waitForFonts does) and whose weight
    // range covers the weight asked for. Without the heavy Inter face, a
    // request for 800 is answered by the 400 to 600 face and drawn lighter.
    const missing = await tab.evaluate(async (wanted) => {
      const number = (w) => ({ normal: 400, bold: 700 })[w] || Number(w);
      const lost = [];
      for (const font of wanted) {
        const weight = number(font.split(" ")[0]);
        const covers = (face) => {
          const [low, high = low] = face.weight.split(" ").map(number);
          return low <= weight && weight <= high;
        };
        const faces = await document.fonts.load(font).catch(() => []);
        if (!faces.some((face) => face.status === "loaded" && covers(face))) lost.push(font);
      }
      return lost;
    }, FONTS_USED[flags.for]);
    if (missing.length) throw new Error(`${job.name}: fonts did not load: ${missing.join(", ")}`);

    const problem = await tab.evaluate(LAYOUT_CHECKS[flags.for]);
    if (problem) throw new Error(`${job.name}: ${problem}`);

    const file = path.resolve(outDir, job.name);
    await tab.screenshot({
      path: file,
      type: "jpeg",
      quality: target.quality,
      clip: { x: 0, y: 0, width: target.width, height: target.height },
    });
    const bytes = fs.statSync(file).size;
    if (target.maxBytes && bytes > target.maxBytes) {
      throw new Error(`${job.name} is ${(bytes / 1024).toFixed(0)} KB; keep it under ${target.maxBytes / 1024} KB`);
    }
    console.log(`wrote ${path.relative(process.cwd(), file)} (${(bytes / 1024).toFixed(1)} KB)`);
  }

  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
